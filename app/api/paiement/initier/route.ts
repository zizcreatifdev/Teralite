import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { initierPaiement } from '@/lib/paydunya'
import { notifierAdminNouvelleCommande } from '@/lib/whatsapp'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const schemaLigne = z.object({
  produitId:    z.string().cuid(),
  nom:          z.string().min(1).max(200),
  quantite:     z.number().int().positive().max(999),
  prixUnitaire: z.number().int().positive(),
})

const schemaCommande = z.object({
  items:         z.array(schemaLigne).min(1).max(50),
  client: z.object({
    nom:       z.string().min(2).max(100),
    telephone: z.string().min(8).max(20).regex(/^[+\d\s\-()]+$/),
    adresse:   z.string().min(5).max(500),
  }),
  zoneId:        z.string().cuid().optional().or(z.literal('')),
  fraisLivraison:z.number().int().min(0),
  codePromo:     z.string().max(50).nullable().optional(),
  remise:        z.number().int().min(0).optional(),
  montantTotal:  z.number().int().positive(),
  typePaiement:  z.enum(['ORANGE_MONEY', 'WAVE', 'YAS', 'CASH']),
})

export async function POST(request: Request) {
  // Rate limit : 10 req/min par IP
  const ip = getClientIp(request)
  const { allowed, retryAfter } = rateLimit(ip, 60_000, 10)
  if (!allowed) {
    return NextResponse.json(
      { error: `Trop de requêtes. Réessayez dans ${retryAfter}s.` },
      { status: 429 }
    )
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const parsed = schemaCommande.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Données invalides.'
    return NextResponse.json({ error: message }, { status: 422 })
  }

  const {
    items, client, zoneId, fraisLivraison,
    codePromo, remise = 0, montantTotal, typePaiement,
  } = parsed.data

  try {
    // 1. Vérifier le stock de chaque produit
    for (const ligne of items) {
      const produit = await prisma.produit.findUnique({
        where: { id: ligne.produitId, archive: false },
        select: { id: true, stock: true, prixPublic: true, statut: true, nom: true },
      })
      if (!produit) {
        return NextResponse.json(
          { error: `Produit introuvable : ${ligne.nom}` },
          { status: 404 }
        )
      }
      if (produit.statut === 'RUPTURE') {
        return NextResponse.json(
          { error: `"${produit.nom}" est en rupture de stock.` },
          { status: 409 }
        )
      }
      if (produit.stock < ligne.quantite) {
        return NextResponse.json(
          { error: `Stock insuffisant pour "${produit.nom}". Disponible : ${produit.stock}` },
          { status: 409 }
        )
      }
    }

    // 2. Générer le numéro de commande
    const parametres = await prisma.parametres.findUnique({
      where: { cle: 'commande_numero_courant' },
    })
    const numCourant = parseInt(parametres?.valeur ?? '0', 10) + 1
    const numero = `#${String(numCourant).padStart(4, '0')}`

    // 3. Créer ou retrouver le client
    let clientDb = await prisma.client.findFirst({
      where: { telephone: client.telephone },
    })
    if (!clientDb) {
      clientDb = await prisma.client.create({
        data: { nom: client.nom, telephone: client.telephone, whatsapp: client.telephone },
      })
    }

    // 4. Créer la commande en DB (transaction)
    const commande = await prisma.$transaction(async (tx) => {
      const cmd = await tx.commande.create({
        data: {
          numero,
          clientId: clientDb!.id,
          statut: typePaiement === 'CASH' ? 'EN_ATTENTE_PAIEMENT' : 'RECUE',
          typePaiement,
          montantTotal,
          fraisLivraison,
          adresseLivraison: client.adresse,
          ...(zoneId ? { zoneId } : {}),
          notes: codePromo ? `Code promo : ${codePromo} (remise: ${remise} FCFA)` : null,
          lignes: {
            create: items.map((l) => ({
              produitId: l.produitId,
              quantite: l.quantite,
              prixUnitaire: l.prixUnitaire,
              sousTotal: l.prixUnitaire * l.quantite,
            })),
          },
          historique: {
            create: [{
              statut: typePaiement === 'CASH' ? 'EN_ATTENTE_PAIEMENT' : 'RECUE',
              note: typePaiement === 'CASH'
                ? 'Commande reçue — paiement à la livraison'
                : 'Commande reçue — en attente de paiement',
            }],
          },
        },
      })

      // Mettre à jour le compteur
      await tx.parametres.upsert({
        where: { cle: 'commande_numero_courant' },
        update: { valeur: String(numCourant) },
        create: { cle: 'commande_numero_courant', valeur: String(numCourant) },
      })

      // Pour le cash : décrémenter le stock immédiatement
      if (typePaiement === 'CASH') {
        for (const ligne of items) {
          await tx.produit.update({
            where: { id: ligne.produitId },
            data: { stock: { decrement: ligne.quantite } },
          })
        }
        // Créer la recette
        await tx.recette.create({
          data: {
            commandeId: cmd.id,
            description: `Commande ${numero} — Cash livraison`,
            montant: montantTotal,
            typePaiement: 'CASH',
          },
        })
      }

      return cmd
    })

    // 5. Notification admin
    await notifierAdminNouvelleCommande({
      numeroCommande: numero,
      nomClient: client.nom,
      montantTotal,
      typePaiement,
    })

    // 6. Cash → retourner directement l'ID de commande
    if (typePaiement === 'CASH') {
      return NextResponse.json({ commandeId: commande.id, numero }, { status: 201 })
    }

    // 7. Mobile money → initier paiement PayDunya
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://teralite.sn'
    const result = await initierPaiement({
      commandeId: commande.id,
      numeroCommande: numero,
      montantTotal,
      fraisLivraison,
      lignes: items.map((l) => ({
        nom: l.nom,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        sousTotal: l.prixUnitaire * l.quantite,
      })),
      client: { nom: client.nom, telephone: client.telephone },
      returnUrl: `${appUrl}/commandes/${commande.id}/confirmation`,
      cancelUrl: `${appUrl}/checkout`,
    })

    if (!result.success) {
      // Marquer la commande en échec mais la garder pour référence
      await prisma.commande.update({
        where: { id: commande.id },
        data: { statut: 'ANNULEE', notes: `Échec PayDunya : ${result.error}` },
      })
      return NextResponse.json(
        { error: result.error ?? 'Impossible d\'initier le paiement.' },
        { status: 502 }
      )
    }

    // Sauvegarder le token PayDunya
    await prisma.commande.update({
      where: { id: commande.id },
      data: { paydunyaRef: result.token },
    })

    return NextResponse.json({
      commandeId: commande.id,
      numero,
      paymentUrl: result.paymentUrl,
    }, { status: 201 })

  } catch (err) {
    console.error('Erreur création commande:', err)
    return NextResponse.json({ error: 'Erreur serveur. Veuillez réessayer.' }, { status: 500 })
  }
}
