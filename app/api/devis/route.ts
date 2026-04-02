import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const schemaDevis = z.object({
  nom: z.string().min(2, 'Nom trop court').max(100),
  telephone: z
    .string()
    .min(8, 'Numéro invalide')
    .max(20)
    .regex(/^[+\d\s\-()]+$/, 'Numéro invalide'),
  besoin: z.string().min(1, 'Veuillez sélectionner un type de besoin').max(100),
  message: z.string().max(2000).optional(),
})

export async function POST(request: Request) {
  // Rate limiting : 5 requêtes par minute par IP
  const ip = getClientIp(request)
  const { allowed, retryAfter } = rateLimit(ip, 60_000, 5)
  if (!allowed) {
    return NextResponse.json(
      { error: `Trop de demandes. Réessayez dans ${retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const parsed = schemaDevis.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Données invalides.'
    return NextResponse.json({ error: message }, { status: 422 })
  }

  const { nom, telephone, besoin, message } = parsed.data

  try {
    // Générer le numéro de devis
    const parametres = await prisma.parametres.findUnique({
      where: { cle: 'devis_numero_courant' },
    })
    const numCourant = parseInt(parametres?.valeur ?? '0', 10) + 1
    const annee = new Date().getFullYear()
    const numero = `DEV-${annee}-${String(numCourant).padStart(3, '0')}`

    // Créer ou retrouver le client
    let client = await prisma.client.findFirst({
      where: { telephone },
    })
    if (!client) {
      client = await prisma.client.create({
        data: { nom, telephone, whatsapp: telephone },
      })
    }

    // Créer le devis
    await prisma.devis.create({
      data: {
        numero,
        clientId: client.id,
        statut: 'NOUVEAU',
        notes: `Besoin : ${besoin}${message ? `\n\nMessage : ${message}` : ''}`,
        validiteJours: 30,
      },
    })

    // Incrémenter le compteur
    await prisma.parametres.upsert({
      where: { cle: 'devis_numero_courant' },
      update: { valeur: String(numCourant) },
      create: { cle: 'devis_numero_courant', valeur: String(numCourant) },
    })

    return NextResponse.json(
      { success: true, numero },
      { status: 201 }
    )
  } catch (err) {
    console.error('Erreur création devis:', err)
    return NextResponse.json(
      { error: 'Erreur serveur. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}
