import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

// GET /api/admin/devis/[id]/pdf — retourne une page HTML imprimable (PDF via Ctrl+P)
// La génération PDF binaire (@react-pdf/renderer) est prévue en Phase 5
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const devis = await prisma.devis.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        lignes: { include: { produit: { select: { nom: true } } } },
      },
    })

    if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

    const montantHT = devis.lignes.reduce((s, l) => s + l.sousTotal, 0)
    const montantTVA = devis.lignes.reduce((s, l) => s + Math.round(l.sousTotal * l.tva), 0)
    const montantTTC = montantHT + montantTVA

    const dateExpiration = new Date(devis.createdAt)
    dateExpiration.setDate(dateExpiration.getDate() + devis.validiteJours)

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Devis ${devis.numero}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DM Sans', Arial, sans-serif; color: #1A1A1A; font-size: 14px; }
    .page { max-width: 794px; margin: 0 auto; padding: 48px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: 700; color: #004880; letter-spacing: 1px; }
    .slogan { font-size: 11px; color: #888; margin-top: 2px; }
    .company-info { text-align: right; font-size: 12px; color: #555; line-height: 1.6; }
    .devis-title { background: #004880; color: white; padding: 12px 20px; border-radius: 8px; margin-bottom: 24px; }
    .devis-title h1 { font-size: 20px; font-weight: 600; }
    .devis-title p { font-size: 13px; opacity: 0.8; margin-top: 2px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .meta-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 8px; border-bottom: 1px solid #E5E5E5; padding-bottom: 4px; }
    .meta-block p { font-size: 13px; color: #1A1A1A; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #004880; color: white; }
    thead th { padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; }
    thead th:last-child, thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    tbody tr:nth-child(even) { background: #F5F5F5; }
    tbody td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #E5E5E5; }
    tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(4) { text-align: right; }
    .totals { margin-left: auto; width: 280px; }
    .totals table { margin-bottom: 0; }
    .totals tbody td { padding: 6px 12px; background: none; border: none; font-size: 13px; }
    .totals tfoot tr { border-top: 2px solid #004880; }
    .totals tfoot td { padding: 10px 12px; font-weight: 700; font-size: 15px; color: #004880; }
    .conditions { margin-top: 32px; padding: 16px; border: 1px solid #E5E5E5; border-radius: 8px; }
    .conditions h3 { font-size: 12px; font-weight: 600; color: #555; margin-bottom: 8px; }
    .conditions p { font-size: 12px; color: #555; line-height: 1.6; }
    .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #E5E5E5; padding-top: 16px; }
    @media print {
      body { font-size: 12px; }
      .page { padding: 32px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="logo">TERALITE</div>
      <div class="slogan">La lumière qui pense pour vous</div>
    </div>
    <div class="company-info">
      <p><strong>Teralite</strong></p>
      <p>Dakar, Sénégal</p>
      <p>contact@teralite.sn</p>
    </div>
  </div>

  <div class="devis-title">
    <h1>DEVIS ${devis.numero}</h1>
    <p>Date : ${formatDate(devis.createdAt)} · Validité : jusqu'au ${formatDate(dateExpiration)}</p>
  </div>

  <div class="meta">
    <div class="meta-block">
      <h3>Client</h3>
      <p><strong>${devis.client.nom}</strong></p>
      <p>Tél : ${devis.client.telephone}</p>
      ${devis.client.email ? `<p>${devis.client.email}</p>` : ''}
      ${devis.client.adresse ? `<p>${devis.client.adresse}</p>` : ''}
    </div>
    <div class="meta-block">
      <h3>Référence</h3>
      <p>N° : <strong>${devis.numero}</strong></p>
      <p>Date d'émission : ${formatDate(devis.createdAt)}</p>
      <p>Validité : ${devis.validiteJours} jours</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:40%">Désignation</th>
        <th>Réf.</th>
        <th>Qté</th>
        <th>P.U. HT (F)</th>
        <th>Remise</th>
        <th>Sous-total HT (F)</th>
      </tr>
    </thead>
    <tbody>
      ${devis.lignes
        .map(
          (l) => `
      <tr>
        <td>${l.designation}</td>
        <td style="font-family:monospace;font-size:11px">${l.produit?.nom ?? '—'}</td>
        <td style="text-align:right">${l.quantite}</td>
        <td style="text-align:right">${l.prixUnitaire.toLocaleString('fr-SN')}</td>
        <td style="text-align:right">${l.remise > 0 ? l.remise + '%' : '—'}</td>
        <td style="text-align:right"><strong>${l.sousTotal.toLocaleString('fr-SN')}</strong></td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tbody>
        <tr><td>Total HT</td><td style="text-align:right">${montantHT.toLocaleString('fr-SN')} F</td></tr>
        <tr><td>TVA</td><td style="text-align:right">${montantTVA.toLocaleString('fr-SN')} F</td></tr>
      </tbody>
      <tfoot>
        <tr><td>TOTAL TTC</td><td style="text-align:right">${montantTTC.toLocaleString('fr-SN')} F</td></tr>
      </tfoot>
    </table>
  </div>

  ${
    devis.conditions
      ? `<div class="conditions"><h3>Conditions</h3><p>${devis.conditions}</p></div>`
      : ''
  }

  <div class="footer">
    <p>Teralite — teralite.sn — Ce devis est valable ${devis.validiteJours} jours à compter de sa date d'émission.</p>
  </div>
</div>
<script>window.onload = () => window.print()</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
