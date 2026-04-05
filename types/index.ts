import type {
  Role,
  StatutCommande,
  StatutDevis,
  TypePaiement,
  StatutCommission,
  TypeProduit,
  TypeClient,
  TypeDepense,
  TypePromo,
} from '@prisma/client'

// Re-export des enums Prisma pour usage dans le code
export type {
  Role,
  StatutCommande,
  StatutDevis,
  TypePaiement,
  StatutCommission,
  TypeProduit,
  TypeClient,
  TypeDepense,
  TypePromo,
}

// Extension du type Session NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
    }
  }

  interface User {
    id: string
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}

// Types utilitaires
export type StatutCommandeLabel = {
  [K in StatutCommande]: string
}

export const STATUT_COMMANDE_LABELS: StatutCommandeLabel = {
  RECUE: 'Reçue',
  CONFIRMEE: 'Confirmée',
  EN_PREPARATION: 'En préparation',
  EXPEDIEE: 'Expédiée',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
  EN_ATTENTE_PAIEMENT: 'En attente de paiement',
}

export const STATUT_DEVIS_LABELS: Record<StatutDevis, string> = {
  NOUVEAU: 'Nouveau',
  EN_COURS: 'En cours',
  ENVOYE: 'Envoyé',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
}

export const TYPE_PAIEMENT_LABELS: Record<TypePaiement, string> = {
  ORANGE_MONEY: 'Orange Money',
  WAVE: 'Wave',
  YAS: 'YAS',
  CASH: 'Paiement à la livraison',
}

// Spécification technique produit
export interface Spec {
  label: string
  valeur: string
}
