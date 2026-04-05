import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const zones = await prisma.zoneLivraison.findMany({
      where: { actif: true },
      orderBy: { tarif: 'asc' },
      select: { id: true, nom: true, tarif: true, delaiJours: true },
    })
    return NextResponse.json(zones, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
    })
  } catch (err) {
    console.error('Erreur GET /api/zones:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
