import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// GET /api/admin/contenu — toutes les données CMS
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const [contenu, temoignages, faq] = await Promise.all([
      prisma.contenuSite.findMany({ orderBy: { cle: 'asc' } }),
      prisma.temoignage.findMany({ orderBy: { ordre: 'asc' } }),
      prisma.fAQ.findMany({ orderBy: [{ categorie: 'asc' }, { ordre: 'asc' }] }),
    ])

    return NextResponse.json({ contenu, temoignages, faq })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const schemaContenu = z.object({
  cles: z.record(z.string(), z.string()),
})

// PUT /api/admin/contenu — mise à jour en masse des clés ContenuSite
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await request.json()
    const { cles } = schemaContenu.parse(body)

    // Upsert chaque clé
    await Promise.all(
      Object.entries(cles).map(([cle, valeur]) =>
        prisma.contenuSite.upsert({
          where: { cle },
          update: { valeur },
          create: { cle, valeur },
        })
      )
    )

    // Invalide le cache des pages publiques concernées
    revalidatePath('/')
    revalidatePath('/a-propos')
    revalidatePath('/contact')

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
