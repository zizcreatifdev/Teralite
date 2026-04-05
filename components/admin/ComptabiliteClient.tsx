'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Download, Plus, Trash2, FileText, X, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'
import { formatFCFA, formatDateCourte } from '@/lib/utils'
import type { TypeDepense, TypePaiement } from '@prisma/client'

// ─── Types ──────────────────────────────────────────────────────────────────

interface KPIs {
  ca: number
  depenses: number
  benefice: number
  marge: number
}

interface ResumeData extends KPIs {
  nbRecettes: number
  nbDepenses: number
  evolution: { mois: string; recettes: number; depenses: number; benefice: number }[]
  repartitionDepenses: { categorie: TypeDepense; montant: number }[]
  periode: { debut: string; fin: string }
}

interface Recette {
  id: string
  description: string
  montant: number
  typePaiement: TypePaiement | null
  date: string | Date
}

interface Depense {
  id: string
  categorie: TypeDepense
  description: string
  montant: number
  date: string | Date
  justificatif: string | null
}

interface EntreeJournal {
  id: string
  date: string | Date
  type: 'recette' | 'depense'
  categorie: string
  description: string
  montant: number
  soldeCumule: number
}

interface Facture {
  id: string
  numero: string
  montantHT: number
  montantTVA: number
  montantTTC: number
  createdAt: string | Date
  commande?: { numero: string; client: { nom: string } } | null
  devis?: { numero: string; client: { nom: string } } | null
}

interface Props {
  initialKPIs: KPIs
  initialFactures: Facture[]
}

// ─── Constantes ─────────────────────────────────────────────────────────────

type Periode = 'mois' | 'mois_dernier' | 'trimestre' | 'annee' | 'personnalise'

const PERIODES: { value: Periode; label: string }[] = [
  { value: 'mois', label: 'Ce mois' },
  { value: 'mois_dernier', label: 'Mois dernier' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'annee', label: 'Année' },
  { value: 'personnalise', label: 'Personnalisé' },
]

const TYPE_DEPENSE_LABELS: Record<TypeDepense, string> = {
  STOCK: 'Stock',
  TRANSPORT: 'Transport',
  MARKETING: 'Marketing',
  FRAIS_DIVERS: 'Frais divers',
}

const TYPE_PAIEMENT_LABELS: Record<TypePaiement, string> = {
  ORANGE_MONEY: 'Orange Money',
  WAVE: 'Wave',
  YAS: 'YAS',
  CASH: 'Cash',
}

const COLORS_PIE = ['#004880', '#FFA000', '#1A6B3A', '#B03A2E', '#6C757D']

const TABS = ['Tableau de bord', 'Recettes', 'Dépenses', 'Journal', 'Factures'] as const
type Tab = typeof TABS[number]

// ─── Component ───────────────────────────────────────────────────────────────

export default function ComptabiliteClient({ initialKPIs, initialFactures }: Props) {
  const [tab, setTab] = useState<Tab>('Tableau de bord')
  const [periode, setPeriode] = useState<Periode>('mois')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')

  const [resume, setResume] = useState<ResumeData | null>(null)
  const [loadingResume, setLoadingResume] = useState(false)

  const [recettes, setRecettes] = useState<Recette[]>([])
  const [totalRecettes, setTotalRecettes] = useState(0)
  const [loadingRecettes, setLoadingRecettes] = useState(false)
  const [filtreTP, setFiltreTP] = useState('')

  const [depenses, setDepenses] = useState<Depense[]>([])
  const [totalDepenses, setTotalDepenses] = useState(0)
  const [loadingDepenses, setLoadingDepenses] = useState(false)
  const [filtreCategorie, setFiltreCategorie] = useState('')
  const [showFormDepense, setShowFormDepense] = useState(false)
  const [savingDepense, setSavingDepense] = useState(false)
  const [formDepense, setFormDepense] = useState({
    categorie: 'STOCK' as TypeDepense,
    description: '',
    montant: '',
    date: new Date().toISOString().slice(0, 10),
    justificatif: '',
  })

  const [journal, setJournal] = useState<EntreeJournal[]>([])
  const [loadingJournal, setLoadingJournal] = useState(false)
  const [filtreJournalType, setFiltreJournalType] = useState('')

  const [factures, setFactures] = useState<Facture[]>(initialFactures)
  const [loadingFactures, setLoadingFactures] = useState(false)
  const [qFacture, setQFacture] = useState('')

  // Période query string
  const periodeParams = useCallback(() => {
    const p = new URLSearchParams({ periode })
    if (periode === 'personnalise') {
      if (dateDebut) p.set('debut', dateDebut)
      if (dateFin) p.set('fin', dateFin)
    }
    return p.toString()
  }, [periode, dateDebut, dateFin])

  // Charger résumé
  const chargerResume = useCallback(async () => {
    setLoadingResume(true)
    try {
      const res = await fetch(`/api/admin/comptabilite/resume?${periodeParams()}`)
      if (res.ok) setResume(await res.json() as ResumeData)
    } finally {
      setLoadingResume(false)
    }
  }, [periodeParams])

  // Charger recettes
  const chargerRecettes = useCallback(async () => {
    setLoadingRecettes(true)
    try {
      const p = new URLSearchParams({ periode })
      if (filtreTP) p.set('typePaiement', filtreTP)
      if (periode === 'personnalise') {
        if (dateDebut) p.set('debut', dateDebut)
        if (dateFin) p.set('fin', dateFin)
      }
      const res = await fetch(`/api/admin/comptabilite/recettes?${p.toString()}`)
      if (res.ok) {
        const d = await res.json() as { recettes: Recette[]; totalMontant: number }
        setRecettes(d.recettes)
        setTotalRecettes(d.totalMontant)
      }
    } finally {
      setLoadingRecettes(false)
    }
  }, [periode, filtreTP, dateDebut, dateFin])

  // Charger dépenses
  const chargerDepenses = useCallback(async () => {
    setLoadingDepenses(true)
    try {
      const p = new URLSearchParams({ periode })
      if (filtreCategorie) p.set('categorie', filtreCategorie)
      if (periode === 'personnalise') {
        if (dateDebut) p.set('debut', dateDebut)
        if (dateFin) p.set('fin', dateFin)
      }
      const res = await fetch(`/api/admin/comptabilite/depenses?${p.toString()}`)
      if (res.ok) {
        const d = await res.json() as { depenses: Depense[]; totalMontant: number }
        setDepenses(d.depenses)
        setTotalDepenses(d.totalMontant)
      }
    } finally {
      setLoadingDepenses(false)
    }
  }, [periode, filtreCategorie, dateDebut, dateFin])

  // Charger journal
  const chargerJournal = useCallback(async () => {
    setLoadingJournal(true)
    try {
      const p = new URLSearchParams({ periode })
      if (filtreJournalType) p.set('type', filtreJournalType)
      if (periode === 'personnalise') {
        if (dateDebut) p.set('debut', dateDebut)
        if (dateFin) p.set('fin', dateFin)
      }
      const res = await fetch(`/api/admin/comptabilite/journal?${p.toString()}`)
      if (res.ok) {
        const d = await res.json() as { journal: EntreeJournal[] }
        setJournal(d.journal)
      }
    } finally {
      setLoadingJournal(false)
    }
  }, [periode, filtreJournalType, dateDebut, dateFin])

  // Charger factures
  const chargerFactures = useCallback(async () => {
    setLoadingFactures(true)
    try {
      const p = new URLSearchParams()
      if (qFacture) p.set('q', qFacture)
      const res = await fetch(`/api/admin/factures?${p.toString()}`)
      if (res.ok) {
        const d = await res.json() as { factures: Facture[] }
        setFactures(d.factures)
      }
    } finally {
      setLoadingFactures(false)
    }
  }, [qFacture])

  // Chargement initial et à chaque changement de période
  useEffect(() => {
    if (tab === 'Tableau de bord') chargerResume()
    else if (tab === 'Recettes') chargerRecettes()
    else if (tab === 'Dépenses') chargerDepenses()
    else if (tab === 'Journal') chargerJournal()
    else if (tab === 'Factures') chargerFactures()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, periode, dateDebut, dateFin])

  // Re-fetch quand filtres changent
  useEffect(() => { if (tab === 'Recettes') chargerRecettes() }, [filtreTP, tab, chargerRecettes])
  useEffect(() => { if (tab === 'Dépenses') chargerDepenses() }, [filtreCategorie, tab, chargerDepenses])
  useEffect(() => { if (tab === 'Journal') chargerJournal() }, [filtreJournalType, tab, chargerJournal])

  const ajouterDepense = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingDepense(true)
    try {
      const res = await fetch('/api/admin/comptabilite/depenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categorie: formDepense.categorie,
          description: formDepense.description,
          montant: parseInt(formDepense.montant),
          date: new Date(formDepense.date).toISOString(),
          justificatif: formDepense.justificatif || null,
        }),
      })
      if (res.ok) {
        const created = await res.json() as Depense
        setDepenses((prev) => [created, ...prev])
        setTotalDepenses((prev) => prev + created.montant)
        setShowFormDepense(false)
        setFormDepense({ categorie: 'STOCK', description: '', montant: '', date: new Date().toISOString().slice(0, 10), justificatif: '' })
        // Rafraîchir résumé si on y revient
        if (resume) setResume({ ...resume, depenses: resume.depenses + created.montant, benefice: resume.benefice - created.montant })
      }
    } finally {
      setSavingDepense(false)
    }
  }

  const supprimerDepense = async (dep: Depense) => {
    if (!confirm('Supprimer cette dépense ?')) return
    const res = await fetch(`/api/admin/comptabilite/depenses/${dep.id}`, { method: 'DELETE' })
    if (res.ok) {
      setDepenses((prev) => prev.filter((d) => d.id !== dep.id))
      setTotalDepenses((prev) => prev - dep.montant)
    }
  }

  const exportExcel = () => {
    const p = new URLSearchParams({ periode })
    if (periode === 'personnalise') {
      if (dateDebut) p.set('debut', dateDebut)
      if (dateFin) p.set('fin', dateFin)
    }
    window.open(`/api/admin/comptabilite/export?${p.toString()}`)
  }

  const kpis = resume ?? { ...initialKPIs, nbRecettes: 0, nbDepenses: 0, evolution: [], repartitionDepenses: [] }

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

      {/* Sélecteur période + Export */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {PERIODES.map((p) => (
            <button key={p.value} onClick={() => setPeriode(p.value)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                periode === p.value
                  ? 'bg-blue-teralite text-white border-blue-teralite'
                  : 'border-border-main text-text-mid hover:bg-gray-fond'
              }`}>
              {p.label}
            </button>
          ))}
          {periode === 'personnalise' && (
            <div className="flex items-center gap-2">
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
                className="border border-border-main rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-teralite" />
              <span className="text-text-light text-sm">→</span>
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
                className="border border-border-main rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-teralite" />
            </div>
          )}
        </div>
        <button onClick={exportExcel}
          className="flex items-center gap-2 bg-green-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-green-teralite/80 transition-colors">
          <Download className="w-4 h-4" />Export Excel
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-border-main">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-teralite text-blue-teralite'
                : 'border-transparent text-text-mid hover:text-text-main'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ═══ Tableau de bord ═══ */}
      {tab === 'Tableau de bord' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="CA de la période" value={formatFCFA(kpis.ca)} icon={<DollarSign className="w-5 h-5" />} color="blue" loading={loadingResume} />
            <KPICard label="Dépenses" value={formatFCFA(kpis.depenses)} icon={<TrendingDown className="w-5 h-5" />} color="orange" loading={loadingResume} />
            <KPICard label="Bénéfice net" value={formatFCFA(kpis.benefice)} icon={<TrendingUp className="w-5 h-5" />} color={kpis.benefice >= 0 ? 'green' : 'red'} loading={loadingResume} />
            <KPICard label="Marge" value={`${kpis.marge}%`} icon={<Percent className="w-5 h-5" />} color="blue" loading={loadingResume} />
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Évolution bénéfice */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-border-main p-5">
              <h3 className="text-sm font-semibold text-text-main mb-4">Évolution financière (12 mois)</h3>
              {resume && resume.evolution.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={resume.evolution} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#888888' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#888888' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatFCFA(v)} labelStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="recettes" name="Recettes" stroke="#004880" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="depenses" name="Dépenses" stroke="#FFA000" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="benefice" name="Bénéfice" stroke="#1A6B3A" strokeWidth={2} strokeDasharray="4 2" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-text-light text-sm">
                  {loadingResume ? 'Chargement…' : 'Aucune donnée'}
                </div>
              )}
            </div>

            {/* Répartition dépenses */}
            <div className="bg-white rounded-xl border border-border-main p-5">
              <h3 className="text-sm font-semibold text-text-main mb-4">Dépenses par catégorie</h3>
              {resume && resume.repartitionDepenses.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={resume.repartitionDepenses} dataKey="montant" nameKey="categorie"
                        cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                        {resume.repartitionDepenses.map((_, i) => (
                          <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatFCFA(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {resume.repartitionDepenses.map((r, i) => (
                      <div key={r.categorie} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_PIE[i % COLORS_PIE.length] }} />
                          <span className="text-text-mid">{TYPE_DEPENSE_LABELS[r.categorie]}</span>
                        </div>
                        <span className="font-medium text-text-main">{formatFCFA(r.montant)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-text-light text-sm">
                  {loadingResume ? 'Chargement…' : 'Aucune dépense'}
                </div>
              )}
            </div>
          </div>

          {/* Graphique barres recettes vs dépenses */}
          {resume && resume.evolution.length > 0 && (
            <div className="bg-white rounded-xl border border-border-main p-5">
              <h3 className="text-sm font-semibold text-text-main mb-4">Recettes vs Dépenses par mois</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={resume.evolution} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#888888' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#888888' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatFCFA(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="recettes" name="Recettes" fill="#004880" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="depenses" name="Dépenses" fill="#FFA000" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ═══ Recettes ═══ */}
      {tab === 'Recettes' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={filtreTP} onChange={(e) => setFiltreTP(e.target.value)}
              className="border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite">
              <option value="">Tous les modes</option>
              {(Object.keys(TYPE_PAIEMENT_LABELS) as TypePaiement[]).map((k) => (
                <option key={k} value={k}>{TYPE_PAIEMENT_LABELS[k]}</option>
              ))}
            </select>
            <div className="ml-auto bg-green-light text-green-teralite text-sm font-semibold px-4 py-2 rounded-lg">
              Total : {formatFCFA(totalRecettes)}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border-main overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-main bg-gray-fond">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Mode paiement</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {loadingRecettes ? (
                  <tr><td colSpan={4} className="text-center py-8 text-text-light">Chargement…</td></tr>
                ) : recettes.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-text-light">Aucune recette sur cette période</td></tr>
                ) : (
                  recettes.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-fond/50">
                      <td className="px-4 py-3 text-xs text-text-mid">{formatDateCourte(new Date(r.date))}</td>
                      <td className="px-4 py-3 text-text-main">{r.description}</td>
                      <td className="px-4 py-3">
                        {r.typePaiement ? (
                          <span className="text-xs bg-blue-light text-blue-teralite px-2 py-0.5 rounded-full font-medium">
                            {TYPE_PAIEMENT_LABELS[r.typePaiement]}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-teralite">{formatFCFA(r.montant)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Dépenses ═══ */}
      {tab === 'Dépenses' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filtreCategorie} onChange={(e) => setFiltreCategorie(e.target.value)}
              className="border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite">
              <option value="">Toutes catégories</option>
              {(Object.keys(TYPE_DEPENSE_LABELS) as TypeDepense[]).map((k) => (
                <option key={k} value={k}>{TYPE_DEPENSE_LABELS[k]}</option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-3">
              <div className="bg-orange-light text-orange-teralite text-sm font-semibold px-4 py-2 rounded-lg">
                Total : {formatFCFA(totalDepenses)}
              </div>
              <button onClick={() => setShowFormDepense(true)}
                className="flex items-center gap-2 bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors">
                <Plus className="w-4 h-4" />Ajouter une dépense
              </button>
            </div>
          </div>

          {/* Formulaire ajout */}
          {showFormDepense && (
            <form onSubmit={ajouterDepense} className="bg-white rounded-xl border border-blue-teralite/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-main">Nouvelle dépense</h3>
                <button type="button" onClick={() => setShowFormDepense(false)}><X className="w-4 h-4 text-text-light" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-mid mb-1">Catégorie *</label>
                  <select required value={formDepense.categorie}
                    onChange={(e) => setFormDepense({ ...formDepense, categorie: e.target.value as TypeDepense })}
                    className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite">
                    {(Object.keys(TYPE_DEPENSE_LABELS) as TypeDepense[]).map((k) => (
                      <option key={k} value={k}>{TYPE_DEPENSE_LABELS[k]}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-1 lg:col-span-2">
                  <label className="block text-xs font-medium text-text-mid mb-1">Description *</label>
                  <input required value={formDepense.description}
                    onChange={(e) => setFormDepense({ ...formDepense, description: e.target.value })}
                    placeholder="Achat stock lampes solaires…"
                    className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-mid mb-1">Montant (F CFA) *</label>
                  <input required type="number" min={1} value={formDepense.montant}
                    onChange={(e) => setFormDepense({ ...formDepense, montant: e.target.value })}
                    placeholder="150000"
                    className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-mid mb-1">Date *</label>
                  <input required type="date" value={formDepense.date}
                    onChange={(e) => setFormDepense({ ...formDepense, date: e.target.value })}
                    className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-medium text-text-mid mb-1">Justificatif (URL photo)</label>
                  <input type="url" value={formDepense.justificatif}
                    onChange={(e) => setFormDepense({ ...formDepense, justificatif: e.target.value })}
                    placeholder="https://…"
                    className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingDepense}
                  className="bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
                  {savingDepense ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => setShowFormDepense(false)}
                  className="text-sm text-text-mid border border-border-main px-4 py-2 rounded-lg hover:bg-gray-fond">
                  Annuler
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-border-main overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-main bg-gray-fond">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Catégorie</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Montant</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {loadingDepenses ? (
                  <tr><td colSpan={5} className="text-center py-8 text-text-light">Chargement…</td></tr>
                ) : depenses.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-text-light">Aucune dépense sur cette période</td></tr>
                ) : (
                  depenses.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-fond/50">
                      <td className="px-4 py-3 text-xs text-text-mid whitespace-nowrap">{formatDateCourte(new Date(d.date))}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORIE_BADGE[d.categorie]}`}>
                          {TYPE_DEPENSE_LABELS[d.categorie]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-main">
                        <span>{d.description}</span>
                        {d.justificatif && (
                          <a href={d.justificatif} target="_blank" rel="noopener noreferrer"
                            className="ml-2 text-xs text-blue-teralite hover:underline">
                            Justificatif ↗
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-teralite">{formatFCFA(d.montant)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => supprimerDepense(d)} className="text-text-light hover:text-red-teralite transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Journal ═══ */}
      {tab === 'Journal' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={filtreJournalType} onChange={(e) => setFiltreJournalType(e.target.value)}
              className="border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite">
              <option value="">Recettes + Dépenses</option>
              <option value="recette">Recettes uniquement</option>
              <option value="depense">Dépenses uniquement</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-border-main overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-main bg-gray-fond">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Catégorie</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Montant</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {loadingJournal ? (
                  <tr><td colSpan={6} className="text-center py-8 text-text-light">Chargement…</td></tr>
                ) : journal.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-text-light">Aucune opération sur cette période</td></tr>
                ) : (
                  journal.map((e) => (
                    <tr key={`${e.type}-${e.id}`} className="hover:bg-gray-fond/50">
                      <td className="px-4 py-3 text-xs text-text-mid whitespace-nowrap">{formatDateCourte(new Date(e.date))}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          e.type === 'recette' ? 'bg-green-light text-green-teralite' : 'bg-red-light text-red-teralite'
                        }`}>
                          {e.type === 'recette' ? 'Recette' : 'Dépense'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-mid">{e.categorie}</td>
                      <td className="px-4 py-3 text-text-main">{e.description}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        e.type === 'recette' ? 'text-green-teralite' : 'text-red-teralite'
                      }`}>
                        {e.type === 'recette' ? '+' : '-'}{formatFCFA(e.montant)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono text-sm font-semibold ${
                        e.soldeCumule >= 0 ? 'text-text-main' : 'text-red-teralite'
                      }`}>
                        {formatFCFA(e.soldeCumule)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Factures ═══ */}
      {tab === 'Factures' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input value={qFacture} onChange={(e) => setQFacture(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && chargerFactures()}
              placeholder="Rechercher une facture…"
              className="border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite w-56" />
            <button onClick={chargerFactures}
              className="text-sm bg-blue-teralite text-white px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors">
              Rechercher
            </button>
          </div>

          <div className="bg-white rounded-xl border border-border-main overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-main bg-gray-fond">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">N° Facture</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Origine</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">HT</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">TVA</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider">TTC</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {loadingFactures ? (
                  <tr><td colSpan={8} className="text-center py-8 text-text-light">Chargement…</td></tr>
                ) : factures.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-text-light">Aucune facture</td></tr>
                ) : (
                  factures.map((f) => {
                    const client = f.commande?.client?.nom ?? f.devis?.client?.nom ?? '—'
                    const origine = f.commande ? `Cmd ${f.commande.numero}` : f.devis ? `Devis ${f.devis.numero}` : '—'
                    return (
                      <tr key={f.id} className="hover:bg-gray-fond/50">
                        <td className="px-4 py-3 font-mono font-bold text-blue-teralite">{f.numero}</td>
                        <td className="px-4 py-3 text-text-main">{client}</td>
                        <td className="px-4 py-3 text-xs text-text-mid">{origine}</td>
                        <td className="px-4 py-3 text-xs text-text-mid">{formatDateCourte(new Date(f.createdAt))}</td>
                        <td className="px-4 py-3 text-right text-text-mid">{formatFCFA(f.montantHT)}</td>
                        <td className="px-4 py-3 text-right text-text-mid">{formatFCFA(f.montantTVA)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-text-main">{formatFCFA(f.montantTTC)}</td>
                        <td className="px-4 py-3">
                          <a href={`/api/admin/factures/${f.id}/pdf`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-teralite hover:text-blue-dark transition-colors">
                            <FileText className="w-3.5 h-3.5" />PDF
                          </a>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

const CATEGORIE_BADGE: Record<TypeDepense, string> = {
  STOCK: 'bg-blue-light text-blue-teralite',
  TRANSPORT: 'bg-orange-light text-orange-teralite',
  MARKETING: 'bg-green-light text-green-teralite',
  FRAIS_DIVERS: 'bg-gray-fond text-text-mid',
}

function KPICard({
  label, value, icon, color, loading,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: 'blue' | 'orange' | 'green' | 'red'
  loading: boolean
}) {
  const colorClasses = {
    blue: 'bg-blue-light text-blue-teralite',
    orange: 'bg-orange-light text-orange-teralite',
    green: 'bg-green-light text-green-teralite',
    red: 'bg-red-light text-red-teralite',
  }
  return (
    <div className="bg-white rounded-xl border border-border-main p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-text-light uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="h-7 bg-gray-fond animate-pulse rounded w-24" />
      ) : (
        <p className="text-xl font-semibold text-text-main">{value}</p>
      )}
    </div>
  )
}
