// lib/paydunya.ts — Client PayDunya côté serveur UNIQUEMENT
// Ne jamais importer ce fichier dans du code client (components 'use client')

const PAYDUNYA_MODE = process.env.PAYDUNYA_MODE ?? 'test'
const IS_PROD = PAYDUNYA_MODE === 'production'

const BASE_URL = IS_PROD
  ? 'https://app.paydunya.com/api/v1'
  : 'https://app.paydunya.com/sandbox-api/v1'

const CHECKOUT_BASE = IS_PROD
  ? 'https://app.paydunya.com/checkout/invoice/'
  : 'https://app.paydunya.com/sandbox-checkout/invoice/'

function getHeaders(): Record<string, string> {
  return {
    'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY ?? '',
    'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY ?? '',
    'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN ?? '',
    'Content-Type': 'application/json',
  }
}

export interface LigneFacture {
  nom: string
  quantite: number
  prixUnitaire: number
  sousTotal: number
}

export interface InitierPaiementParams {
  commandeId: string
  numeroCommande: string
  montantTotal: number
  fraisLivraison: number
  lignes: LigneFacture[]
  client: {
    nom: string
    telephone: string
  }
  returnUrl: string
  cancelUrl: string
}

export interface PaydunyaResult {
  success: boolean
  token?: string
  paymentUrl?: string
  error?: string
}

/**
 * Initier un paiement PayDunya
 * Retourne une URL de redirection vers la page de paiement
 */
export async function initierPaiement(params: InitierPaiementParams): Promise<PaydunyaResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://teralite.sn'

  const payload = {
    invoice: {
      total_amount: params.montantTotal,
      description: `Commande Teralite ${params.numeroCommande}`,
    },
    store: {
      name: 'Teralite',
      tagline: 'La lumière qui pense pour vous',
      postal_address: 'Dakar, Sénégal',
      phone: process.env.WHATSAPP_PHONE ?? '',
      logo_url: `${appUrl}/logos/teralite-couleur.png`,
      website_url: appUrl,
    },
    actions: {
      cancel_url: params.cancelUrl,
      return_url: params.returnUrl,
      callback_url: `${appUrl}/api/webhooks/paydunya`,
    },
    custom_data: {
      commande_id: params.commandeId,
      numero_commande: params.numeroCommande,
    },
  }

  try {
    const res = await fetch(`${BASE_URL}/checkout-invoice/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })

    const data = await res.json() as {
      response_code: string
      token?: string
      description?: string
    }

    if (data.response_code !== '00' || !data.token) {
      console.error('PayDunya initiation error:', data)
      return { success: false, error: data.description ?? 'Erreur PayDunya.' }
    }

    return {
      success: true,
      token: data.token,
      paymentUrl: `${CHECKOUT_BASE}${data.token}`,
    }
  } catch (err) {
    console.error('PayDunya fetch error:', err)
    return { success: false, error: 'Service de paiement indisponible.' }
  }
}

/**
 * Vérifier le statut d'un paiement PayDunya via son token
 */
export async function verifierPaiement(token: string): Promise<{
  confirme: boolean
  statut: string
  montant?: number
  commandeId?: string
}> {
  try {
    const res = await fetch(`${BASE_URL}/checkout-invoice/confirm/${token}`, {
      method: 'GET',
      headers: getHeaders(),
    })

    const data = await res.json() as {
      response_code: string
      status?: string
      invoice?: { total_amount: number }
      custom_data?: { commande_id: string }
    }

    if (data.response_code !== '00') {
      return { confirme: false, statut: 'ERREUR' }
    }

    const confirme = data.status === 'completed'
    return {
      confirme,
      statut: data.status ?? 'inconnu',
      montant: data.invoice?.total_amount,
      commandeId: data.custom_data?.commande_id,
    }
  } catch (err) {
    console.error('PayDunya vérification error:', err)
    return { confirme: false, statut: 'ERREUR' }
  }
}
