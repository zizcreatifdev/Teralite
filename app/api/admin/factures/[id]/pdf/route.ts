import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ReactPDF from '@react-pdf/renderer'
import { FacturePDF } from '@/components/pdf/FacturePDF'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const facture = await prisma.facture.findUnique({
      where: { id: params.id },
      include: {
        commande: {
          include: {
            client: true,
            lignes: {
              include: { produit: { select: { nom: true, reference: true } } },
            },
          },
        },
        devis: {
          include: {
            client: true,
            lignes: { include: { produit: { select: { nom: true, reference: true } } } },
          },
        },
      },
    })

    if (!facture) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })

    const parametres = await prisma.parametres.findMany({
      where: { cle: { in: ['entreprise_telephone', 'entreprise_adresse', 'entreprise_email', 'entreprise_ninea'] } },
    }).catch(() => [])

    const paramsMap = Object.fromEntries(parametres.map((p) => [p.cle, p.valeur]))

    const stream = await ReactPDF.renderToStream(
      FacturePDF({ facture, paramsMap })
    )

    const chunks: Uint8Array[] = []
    for await (const chunk of stream) {
      chunks.push(chunk as Uint8Array)
    }
    const buffer = Buffer.concat(chunks)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${facture.numero}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF error', err)
    return NextResponse.json({ error: 'Erreur génération PDF' }, { status: 500 })
  }
}
