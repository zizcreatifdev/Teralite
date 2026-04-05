import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const schema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  montantTotal: z.number().int().positive(),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { allowed, retryAfter } = rateLimit(ip, 60_000, 10)
  if (!allowed) {
    return NextResponse.json({ error: `Trop de requêtes. Réessayez dans ${retryAfter}s.` }, { status: 429 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ valide: false, message: 'Code invalide.' }, { status: 200 })
  }

  const { code, montantTotal } = parsed.data

  try {
    const promo = await prisma.codePromo.findUnique({ where: { code } })

    if (!promo || !promo.actif) {
      return NextResponse.json({ valide: false, message: 'Code promotionnel introuvable.' })
    }
    if (promo.expiration && promo.expiration < new Date()) {
      return NextResponse.json({ valide: false, message: 'Ce code a expiré.' })
    }
    if (promo.usageMax !== null && promo.usageActuel >= promo.usageMax) {
      return NextResponse.json({ valide: false, message: 'Ce code a atteint son nombre maximum d\'utilisations.' })
    }

    const remise =
      promo.type === 'POURCENTAGE'
        ? Math.round(montantTotal * (promo.valeur / 100))
        : Math.min(promo.valeur, montantTotal)

    return NextResponse.json({
      valide: true,
      type: promo.type,
      valeur: promo.valeur,
      remise,
      message: `Code appliqué — économie de ${promo.type === 'POURCENTAGE' ? `${promo.valeur}%` : `${promo.valeur} FCFA`}`,
    })
  } catch (err) {
    console.error('Erreur validation promo:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
