import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { notifierConfirmationCommande } from '@/lib/whatsapp'

function verifierSignature(rawBody: string, signature: string): boolean {
  const masterKey = process.env.PAYDUNYA_MASTER_KEY
  if (!masterKey) return false

  try {
    const expected = crypto
      .createHmac('sha256', masterKey)
      .update(rawBody)
      .digest('hex')

    // timingSafeEqual protège contre les timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature,   'hex')
    )
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  // Lire le body brut AVANT de le parser (nécessaire pour la vérification HMAC)
  const rawBody = await request.text()
  const signature = request.headers.get('x-paydunya-signature') ?? ''

  // 1. Vérifier la signature HMAC
  if (!verifierSignature(rawBody, signature)) {
    console.warn('PayDunya webhook: signature invalide', { signature })
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 })
  }

  let data: {
    status?: string
    invoice?: { token?: string; total_amount?: number }
    custom_data?: { commande_id?: string; numero_commande?: string }
  }
  try {
    data = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 })
  }

  // 2. Vérifier que le paiement est bien "completed"
  if (data.status !== 'completed') {
    return NextResponse.json({ received: true, ignored: true }, { status: 200 })
  }

  const commandeId    = data.custom_data?.commande_id
  const montantRecu   = data.invoice?.total_amount
  const paydunyaToken = data.invoice?.token

  if (!commandeId || !montantRecu || !paydunyaToken) {
    console.error('PayDunya webhook: données manquantes', data)
    return NextResponse.json({ error: 'Données manquantes.' }, { status: 422 })
  }

  try {
    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      include: {
        lignes: { include: { produit: true } },
        client: true,
      },
    })

    if (!commande) {
      console.error('PayDunya webhook: commande introuvable', commandeId)
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }

    // 3. Idempotence : ignorer si déjà confirmée
    if (commande.statut === 'CONFIRMEE' || commande.statut === 'LIVREE') {
      return NextResponse.json({ received: true, already_processed: true }, { status: 200 })
    }

    // 4. Vérifier le montant (ne pas faire confiance au webhook seul)
    if (Math.abs(montantRecu - commande.montantTotal) > 10) {
      console.error('PayDunya webhook: montant incohérent', {
        recu: montantRecu,
        attendu: commande.montantTotal,
        commandeId,
      })
      return NextResponse.json({ error: 'Montant incohérent.' }, { status: 422 })
    }

    // 5. Transaction : confirmer la commande + décrémenter stock + créer recette + calcul commission
    await prisma.$transaction(async (tx) => {
      // Mettre à jour le statut
      await tx.commande.update({
        where: { id: commandeId },
        data: { statut: 'CONFIRMEE', paydunyaRef: paydunyaToken },
      })

      // Ajouter à l'historique
      await tx.historiqueStatut.create({
        data: {
          commandeId,
          statut: 'CONFIRMEE',
          note: `Paiement confirmé via PayDunya (token: ${paydunyaToken})`,
        },
      })

      // Décrémenter le stock
      for (const ligne of commande.lignes) {
        await tx.produit.update({
          where: { id: ligne.produitId },
          data: { stock: { decrement: ligne.quantite } },
        })
      }

      // Créer la recette comptable
      await tx.recette.create({
        data: {
          commandeId,
          description: `Commande ${commande.numero} — ${commande.typePaiement}`,
          montant: commande.montantTotal,
          typePaiement: commande.typePaiement,
        },
      })

      // Calculer la commission vendeur si applicable
      if (commande.vendeurId) {
        const config = await tx.configCommission.findFirst({
          where: { actif: true },
          orderBy: { dateEffet: 'desc' },
        })

        if (config) {
          const montantCommission = config.taux
            ? Math.round(commande.montantTotal * (config.taux / 100))
            : config.montantFixe ?? 0

          if (montantCommission > 0) {
            await tx.commission.create({
              data: {
                vendeurId: commande.vendeurId,
                commandeId,
                montant: montantCommission,
                taux: config.taux ?? null,
                montantFixe: config.montantFixe ?? null,
                statut: 'EN_ATTENTE',
              },
            })
          }
        }
      }
    })

    // 6. Notification WhatsApp client (hors transaction — ne doit pas bloquer)
    await notifierConfirmationCommande({
      telephone: commande.client.whatsapp ?? commande.client.telephone,
      numeroCommande: commande.numero,
      montantTotal: commande.montantTotal,
      nomClient: commande.client.nom,
    })

    return NextResponse.json({ received: true, success: true }, { status: 200 })

  } catch (err) {
    console.error('Erreur traitement webhook PayDunya:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
