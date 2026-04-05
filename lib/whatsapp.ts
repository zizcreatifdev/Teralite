// lib/whatsapp.ts — Notifications WhatsApp côté serveur uniquement
// Utilise l'API WhatsApp Business (Meta) ou un service tiers

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL ?? ''
const WHATSAPP_TOKEN   = process.env.WHATSAPP_TOKEN ?? ''

/**
 * Envoie un message WhatsApp de confirmation de commande au client
 */
export async function notifierConfirmationCommande(params: {
  telephone: string       // format international : +221771234567
  numeroCommande: string  // ex: #0042
  montantTotal: number    // en FCFA
  nomClient: string
}): Promise<void> {
  if (!WHATSAPP_API_URL || !WHATSAPP_TOKEN) {
    console.warn('WhatsApp non configuré — notification ignorée.')
    return
  }

  const message =
    `✅ *Commande confirmée !*\n\n` +
    `Bonjour ${params.nomClient},\n` +
    `Votre commande *${params.numeroCommande}* a bien été reçue.\n\n` +
    `💰 Montant : *${params.montantTotal.toLocaleString('fr-SN')} FCFA*\n\n` +
    `Notre équipe Teralite vous contactera sous 24h pour organiser la livraison.\n\n` +
    `Merci de votre confiance ! 🌟`

  const telephone = params.telephone.startsWith('+')
    ? params.telephone.replace(/\s/g, '')
    : `+${params.telephone.replace(/\s/g, '')}`

  try {
    const res = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: telephone,
        type: 'text',
        text: { body: message },
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('WhatsApp API error:', res.status, errBody)
    }
  } catch (err) {
    // Ne pas faire échouer la commande si WhatsApp est indisponible
    console.error('WhatsApp notification error:', err)
  }
}

/**
 * Notification interne à l'admin : nouvelle commande reçue
 */
export async function notifierAdminNouvelleCommande(params: {
  numeroCommande: string
  nomClient: string
  montantTotal: number
  typePaiement: string
}): Promise<void> {
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE
  if (!WHATSAPP_API_URL || !WHATSAPP_TOKEN || !adminPhone) return

  const message =
    `🛒 *Nouvelle commande Teralite*\n\n` +
    `Commande : *${params.numeroCommande}*\n` +
    `Client : ${params.nomClient}\n` +
    `Montant : *${params.montantTotal.toLocaleString('fr-SN')} FCFA*\n` +
    `Paiement : ${params.typePaiement}`

  try {
    await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: adminPhone,
        type: 'text',
        text: { body: message },
      }),
    })
  } catch (err) {
    console.error('WhatsApp admin notification error:', err)
  }
}
