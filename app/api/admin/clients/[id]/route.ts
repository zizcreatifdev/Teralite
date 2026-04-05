import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schemaUpdate = z.object({
  nom: z.string().min(2).max(200).optional(),
  telephone: z.string().min(8).max(20).optional(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  adresse: z.string().optional().nullable(),
  type: z.enum(['PARTICULIER', 'ENTREPRISE', 'MUNICIPALITE']).optional(),
  notes: z.string().optional().nullable(),
})

// GET /api/admin/clients/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        commandes: {
          select: { id: true, numero: true, statut: true, montantTotal: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        devis: {
          select: { id: true, numero: true, statut: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    const totalDepense = client.commandes.reduce((s, c) => s + c.montantTotal, 0)
    return NextResponse.json({ ...client, totalDepense })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/admin/clients/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await request.json()
    const data = schemaUpdate.parse(body)

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...data,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        adresse: data.adresse || null,
        notes: data.notes || null,
      },
    })
    return NextResponse.json(client)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
