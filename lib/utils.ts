// Montant en FCFA
export const formatFCFA = (montant: number): string =>
  montant.toLocaleString('fr-SN') + ' F'
// → "4 500 F"

// Numéro de commande
export const formatNumeroCommande = (num: number): string =>
  '#' + String(num).padStart(4, '0')
// → "#0847"

// Numéro de devis
export const formatNumeroDevis = (annee: number, num: number): string =>
  `DEV-${annee}-${String(num).padStart(3, '0')}`
// → "DEV-2025-001"

// Numéro de facture
export const formatNumeroFacture = (annee: number, num: number): string =>
  `FAC-${annee}-${String(num).padStart(3, '0')}`
// → "FAC-2025-001"

// Date en français
export const formatDate = (date: Date): string =>
  date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
// → "10 avril 2025"

// Date courte
export const formatDateCourte = (date: Date): string =>
  date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
// → "10/04/2025"

// Génère un slug à partir d'un texte
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Calcule la TVA
export const calculerMontantTVA = (montantHT: number, taux: number): number =>
  Math.round(montantHT * taux)

// Calcule le TTC
export const calculerMontantTTC = (montantHT: number, taux: number): number =>
  montantHT + calculerMontantTVA(montantHT, taux)
