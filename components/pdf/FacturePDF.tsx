import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register font (use built-in Helvetica for compatibility)
Font.register({
  family: 'Helvetica',
  fonts: [],
})

const BLEU = '#004880'
const BLEU_CLAIR = '#E8F0F8'
const GRIS = '#888888'
const GRIS_FOND = '#F5F5F5'
const NOIR = '#1A1A1A'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: NOIR,
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: `2 solid ${BLEU}`,
  },
  logoZone: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: BLEU,
    letterSpacing: 1,
  },
  logoSlogan: {
    fontSize: 8,
    color: GRIS,
    marginTop: 2,
  },
  factureInfo: {
    alignItems: 'flex-end',
  },
  factureNumero: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: BLEU,
    marginBottom: 4,
  },
  factureDate: {
    fontSize: 9,
    color: GRIS,
  },
  // Adresses
  adressesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  adresseBox: {
    width: '47%',
    padding: 12,
    backgroundColor: GRIS_FOND,
    borderRadius: 4,
  },
  adresseBoxBleu: {
    width: '47%',
    padding: 12,
    backgroundColor: BLEU_CLAIR,
    borderRadius: 4,
  },
  adresseTitre: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GRIS,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  adresseNom: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: NOIR,
    marginBottom: 3,
  },
  adresseLigne: {
    fontSize: 9,
    color: '#555555',
    marginBottom: 1,
  },
  // Tableau lignes
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BLEU,
    padding: '7 6',
    borderRadius: 2,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '6 6',
    borderBottom: `0.5 solid #E5E5E5`,
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: '6 6',
    backgroundColor: GRIS_FOND,
    borderBottom: `0.5 solid #E5E5E5`,
  },
  colDesignation: { flex: 4, paddingRight: 4 },
  colQte: { width: 40, textAlign: 'right', paddingRight: 4 },
  colPU: { width: 70, textAlign: 'right', paddingRight: 4 },
  colRemise: { width: 45, textAlign: 'right', paddingRight: 4 },
  colTotal: { width: 70, textAlign: 'right' },
  thText: { color: '#FFFFFF', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  tdText: { color: NOIR, fontSize: 9 },
  tdTextMuted: { color: GRIS, fontSize: 8 },
  // Totaux
  totauxContainer: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  totauxBox: {
    width: 220,
  },
  totauxLigne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: `0.5 solid #E5E5E5`,
  },
  totauxLigneTTC: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    backgroundColor: BLEU,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  totauxLabel: { fontSize: 9, color: '#555555' },
  totauxValeur: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: NOIR },
  totauxLabelTTC: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  totauxValeurTTC: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  // Conditions
  conditionsBox: {
    marginTop: 28,
    padding: 12,
    backgroundColor: GRIS_FOND,
    borderRadius: 4,
    borderLeft: `3 solid ${BLEU}`,
  },
  conditionsTitre: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BLEU,
    marginBottom: 4,
  },
  conditionsText: {
    fontSize: 8,
    color: '#555555',
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: `0.5 solid #E5E5E5`,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: GRIS },
})

function formatFCFA(n: number) {
  return n.toLocaleString('fr-SN') + ' F CFA'
}

interface LigneRow {
  designation: string
  quantite: number
  prixUnitaire: number
  remise?: number
  tva?: number
  sousTotal: number
}

interface FactureData {
  id: string
  numero: string
  montantHT: number
  montantTVA: number
  montantTTC: number
  createdAt: Date | string
  commande?: {
    numero: string
    client: { nom: string; telephone: string; adresse: string | null; email: string | null }
    lignes: { designation?: string; quantite: number; prixUnitaire: number; sousTotal: number; produit: { nom: string; reference: string } | null }[]
  } | null
  devis?: {
    numero: string
    conditions: string | null
    validiteJours: number
    client: { nom: string; telephone: string; adresse: string | null; email: string | null }
    lignes: { designation: string; quantite: number; prixUnitaire: number; remise: number; tva: number; sousTotal: number }[]
  } | null
}

interface Props {
  facture: FactureData
  paramsMap: Record<string, string>
}

export function FacturePDF({ facture, paramsMap }: Props) {
  const client = facture.commande?.client ?? facture.devis?.client
  const lignes: LigneRow[] = facture.commande
    ? facture.commande.lignes.map((l) => ({
        designation: l.produit?.nom ?? 'Produit',
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        sousTotal: l.sousTotal,
      }))
    : (facture.devis?.lignes ?? []).map((l) => ({
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        remise: l.remise,
        tva: l.tva,
        sousTotal: l.sousTotal,
      }))

  const dateStr = new Date(facture.createdAt).toLocaleDateString('fr-SN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const conditions = facture.devis?.conditions ?? 'Paiement à réception de la facture.'
  const refSource = facture.commande?.numero ?? facture.devis?.numero ?? ''

  return (
    <Document title={facture.numero} author="Teralite" subject="Facture">
      <Page size="A4" style={styles.page}>

        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.logoZone}>
            <Text style={styles.logoText}>TERALITE</Text>
            <Text style={styles.logoSlogan}>La lumière qui pense pour vous</Text>
            {paramsMap['entreprise_adresse'] && (
              <Text style={[styles.logoSlogan, { marginTop: 6 }]}>{paramsMap['entreprise_adresse']}</Text>
            )}
            {paramsMap['entreprise_telephone'] && (
              <Text style={styles.logoSlogan}>{paramsMap['entreprise_telephone']}</Text>
            )}
            {paramsMap['entreprise_email'] && (
              <Text style={styles.logoSlogan}>{paramsMap['entreprise_email']}</Text>
            )}
            {paramsMap['entreprise_ninea'] && (
              <Text style={styles.logoSlogan}>NINEA : {paramsMap['entreprise_ninea']}</Text>
            )}
          </View>
          <View style={styles.factureInfo}>
            <Text style={styles.factureNumero}>{facture.numero}</Text>
            <Text style={styles.factureDate}>Date : {dateStr}</Text>
            {refSource && (
              <Text style={[styles.factureDate, { marginTop: 2 }]}>Réf : {refSource}</Text>
            )}
          </View>
        </View>

        {/* Adresses */}
        <View style={styles.adressesRow}>
          <View style={styles.adresseBox}>
            <Text style={styles.adresseTitre}>Émetteur</Text>
            <Text style={styles.adresseNom}>Teralite</Text>
            <Text style={styles.adresseLigne}>{paramsMap['entreprise_adresse'] ?? 'Dakar, Sénégal'}</Text>
            <Text style={styles.adresseLigne}>{paramsMap['entreprise_telephone'] ?? ''}</Text>
            <Text style={styles.adresseLigne}>{paramsMap['entreprise_email'] ?? 'contact@teralite.sn'}</Text>
          </View>
          <View style={styles.adresseBoxBleu}>
            <Text style={styles.adresseTitre}>Facturé à</Text>
            <Text style={styles.adresseNom}>{client?.nom ?? '—'}</Text>
            {client?.adresse && <Text style={styles.adresseLigne}>{client.adresse}</Text>}
            <Text style={styles.adresseLigne}>{client?.telephone ?? ''}</Text>
            {client?.email && <Text style={styles.adresseLigne}>{client.email}</Text>}
          </View>
        </View>

        {/* Tableau des lignes */}
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesignation, styles.thText]}>Désignation</Text>
            <Text style={[styles.colQte, styles.thText]}>Qté</Text>
            <Text style={[styles.colPU, styles.thText]}>Prix unit.</Text>
            <Text style={[styles.colRemise, styles.thText]}>Remise</Text>
            <Text style={[styles.colTotal, styles.thText]}>Total HT</Text>
          </View>
          {lignes.map((ligne, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.colDesignation, styles.tdText]}>{ligne.designation}</Text>
              <Text style={[styles.colQte, styles.tdText]}>{ligne.quantite}</Text>
              <Text style={[styles.colPU, styles.tdText]}>{formatFCFA(ligne.prixUnitaire)}</Text>
              <Text style={[styles.colRemise, styles.tdTextMuted]}>
                {ligne.remise ? `${ligne.remise}%` : '—'}
              </Text>
              <Text style={[styles.colTotal, styles.tdText]}>{formatFCFA(ligne.sousTotal)}</Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={styles.totauxContainer}>
          <View style={styles.totauxBox}>
            <View style={styles.totauxLigne}>
              <Text style={styles.totauxLabel}>Sous-total HT</Text>
              <Text style={styles.totauxValeur}>{formatFCFA(facture.montantHT)}</Text>
            </View>
            <View style={styles.totauxLigne}>
              <Text style={styles.totauxLabel}>TVA</Text>
              <Text style={styles.totauxValeur}>{formatFCFA(facture.montantTVA)}</Text>
            </View>
            <View style={styles.totauxLigneTTC}>
              <Text style={styles.totauxLabelTTC}>TOTAL TTC</Text>
              <Text style={styles.totauxValeurTTC}>{formatFCFA(facture.montantTTC)}</Text>
            </View>
          </View>
        </View>

        {/* Conditions */}
        {conditions && (
          <View style={styles.conditionsBox}>
            <Text style={styles.conditionsTitre}>Conditions de paiement</Text>
            <Text style={styles.conditionsText}>{conditions}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Teralite · teralite.sn · contact@teralite.sn</Text>
          <Text style={styles.footerText}>{facture.numero} · {dateStr}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} / ${totalPages}`
          } />
        </View>

      </Page>
    </Document>
  )
}
