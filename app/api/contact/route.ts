import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const schemaContact = z.object({
  nom: z.string().min(2).max(100),
  email: z.string().email('Email invalide').max(200).optional().or(z.literal('')),
  telephone: z
    .string()
    .min(8)
    .max(20)
    .regex(/^[+\d\s\-()]+$/, 'Numéro invalide'),
  sujet: z.string().min(2).max(200),
  message: z.string().min(10, 'Message trop court').max(2000),
})

export async function POST(request: Request) {
  // Rate limiting : 3 requêtes par minute par IP
  const ip = getClientIp(request)
  const { allowed, retryAfter } = rateLimit(ip, 60_000, 3)
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

  const parsed = schemaContact.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Données invalides.'
    return NextResponse.json({ error: message }, { status: 422 })
  }

  // En Phase 4 : envoyer notification WhatsApp / email
  // Pour l'instant : log et réponse OK
  console.log('Contact reçu:', { nom: parsed.data.nom, sujet: parsed.data.sujet })

  return NextResponse.json({ success: true }, { status: 200 })
}
