'use client'

import { useState } from 'react'
import { Save, CheckCircle2, Eye, EyeOff, AlertTriangle, Shield, Database, FileText, Building2 } from 'lucide-react'

interface Props {
  parametres: Record<string, string>
}

type Section = 'entreprise' | 'paydunya' | 'pdf' | 'sauvegardes'

const TABS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'entreprise', label: 'Entreprise', icon: <Building2 className="w-4 h-4" /> },
  { id: 'paydunya', label: 'PayDunya', icon: <Shield className="w-4 h-4" /> },
  { id: 'pdf', label: 'Modèles PDF', icon: <FileText className="w-4 h-4" /> },
  { id: 'sauvegardes', label: 'Sauvegardes', icon: <Database className="w-4 h-4" /> },
]

export default function ParametresManager({ parametres: initialParams }: Props) {
  const [tab, setTab] = useState<Section>('entreprise')
  const [params, setParams] = useState<Record<string, string>>(initialParams)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // PayDunya
  const [showConfirmMode, setShowConfirmMode] = useState(false)
  const [showMasterKey, setShowMasterKey] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)

  const set = (cle: string, valeur: string) => setParams((prev) => ({ ...prev, [cle]: valeur }))

  const sauvegarder = async (cles: string[]) => {
    setSaving(true)
    setSaved(false)
    setErreur(null)
    try {
      const payload: Record<string, string> = {}
      cles.forEach((k) => { payload[k] = params[k] ?? '' })

      const res = await fetch('/api/admin/parametres', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cles: payload }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Erreur')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const basculerModePaydunya = async () => {
    const nouveau = params['paydunya_mode'] === 'test' ? 'production' : 'test'
    set('paydunya_mode', nouveau)
    setShowConfirmMode(false)
    await sauvegarder(['paydunya_mode'])
  }

  const genererSauvegarde = async () => {
    setSaving(true)
    try {
      // Enregistre la date de sauvegarde manuelle
      const now = new Date().toISOString()
      set('sauvegarde_derniere_date', now)
      await fetch('/api/admin/parametres', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cles: { sauvegarde_derniere_date: now } }),
      })
      alert('Sauvegarde manuelle enregistrée.\n\nNote : l\'export SQL complet est géré par Supabase (onglet Database → Backups).')
    } finally {
      setSaving(false)
    }
  }

  const masquerCle = (cle: string) =>
    cle && cle.length > 4 ? '••••••••' + cle.slice(-4) : '••••'

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

      {/* Onglets */}
      <div className="flex gap-1 border-b border-border-main">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-teralite text-blue-teralite'
                : 'border-transparent text-text-mid hover:text-text-main'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Feedback global */}
      {(saved || erreur) && (
        <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg ${
          saved ? 'bg-green-light text-green-teralite' : 'bg-red-light text-red-teralite'
        }`}>
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {saved ? 'Paramètres enregistrés' : erreur}
        </div>
      )}

      {/* ═══ Entreprise ═══ */}
      {tab === 'entreprise' && (
        <div className="bg-white rounded-xl border border-border-main p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-main">Informations entreprise</h2>
            <button onClick={() => sauvegarder(['entreprise_nom', 'entreprise_adresse', 'entreprise_telephone', 'entreprise_email', 'entreprise_ninea', 'entreprise_logo_url'])}
              disabled={saving}
              className="flex items-center gap-1.5 bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
              <Save className="w-3.5 h-3.5" />{saving ? '…' : 'Enregistrer'}
            </button>
          </div>
          <p className="text-xs text-text-light">Ces informations apparaissent sur les factures et devis PDF.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { cle: 'entreprise_nom', label: 'Nom de l\'entreprise', placeholder: 'Teralite' },
              { cle: 'entreprise_telephone', label: 'Téléphone', placeholder: '+221 77 000 00 00' },
              { cle: 'entreprise_email', label: 'Email', placeholder: 'contact@teralite.sn' },
              { cle: 'entreprise_ninea', label: 'NINEA', placeholder: 'Numéro NINEA' },
            ].map(({ cle, label, placeholder }) => (
              <div key={cle}>
                <label className="block text-xs font-medium text-text-mid mb-1">{label}</label>
                <input value={params[cle] ?? ''} onChange={(e) => set(cle, e.target.value)}
                  placeholder={placeholder}
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-text-mid mb-1">Adresse complète</label>
              <textarea value={params['entreprise_adresse'] ?? ''} onChange={(e) => set('entreprise_adresse', e.target.value)}
                rows={2} placeholder="Rue, ville, pays"
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-text-mid mb-1">URL Logo</label>
              <input value={params['entreprise_logo_url'] ?? ''} onChange={(e) => set('entreprise_logo_url', e.target.value)}
                placeholder="https://…/logo.png"
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              {params['entreprise_logo_url'] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={params['entreprise_logo_url']} alt="Logo" className="mt-2 h-12 object-contain rounded border border-border-main p-1" />
              )}
              <p className="text-xs text-text-light mt-1">Upload via la page Produits puis copier l&apos;URL. Formats : JPEG, PNG, WebP.</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PayDunya ═══ */}
      {tab === 'paydunya' && (
        <div className="space-y-4">
          {/* Mode actuel */}
          <div className="bg-white rounded-xl border border-border-main p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-main">Mode PayDunya</h2>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                params['paydunya_mode'] === 'production'
                  ? 'bg-green-light text-green-teralite'
                  : 'bg-orange-light text-orange-teralite'
              }`}>
                {params['paydunya_mode'] === 'production' ? '🟢 PRODUCTION' : '🟡 TEST'}
              </div>
              <button onClick={() => setShowConfirmMode(true)}
                className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                  params['paydunya_mode'] === 'production'
                    ? 'border-orange-teralite text-orange-teralite hover:bg-orange-light'
                    : 'border-green-teralite text-green-teralite hover:bg-green-light'
                }`}>
                Basculer vers {params['paydunya_mode'] === 'production' ? 'TEST' : 'PRODUCTION'}
              </button>
            </div>
            {params['paydunya_mode'] === 'production' && (
              <div className="flex items-start gap-2 bg-red-light text-red-teralite text-xs p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Mode <strong>PRODUCTION</strong> actif — les paiements clients sont réels.</span>
              </div>
            )}

            {/* Confirmation bascule */}
            {showConfirmMode && (
              <div className="border border-orange-teralite/40 bg-orange-light rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-teralite flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-teralite">
                      Basculer vers {params['paydunya_mode'] === 'production' ? 'TEST' : 'PRODUCTION'} ?
                    </p>
                    <p className="text-xs text-text-mid mt-1">
                      {params['paydunya_mode'] === 'production'
                        ? 'Les paiements ne seront plus encaissés. Les clients verront une interface de test.'
                        : 'Les paiements seront réels et encaissés. Assurez-vous que vos clés production sont configurées dans les variables d\'environnement Vercel.'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={basculerModePaydunya} disabled={saving}
                    className="bg-orange-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-teralite/80 transition-colors disabled:opacity-60">
                    Confirmer le changement
                  </button>
                  <button onClick={() => setShowConfirmMode(false)}
                    className="text-sm text-text-mid border border-border-main px-4 py-2 rounded-lg hover:bg-gray-fond">
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clés API (masquées) */}
          <div className="bg-white rounded-xl border border-border-main p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-main">Clés API PayDunya</h2>
            <p className="text-xs text-text-light">
              Les clés sont stockées dans les variables d&apos;environnement Vercel pour des raisons de sécurité.
              Elles ne sont jamais exposées côté client.
            </p>
            <div className="space-y-3">
              {[
                { label: 'Master Key', envKey: 'PAYDUNYA_MASTER_KEY', show: showMasterKey, toggle: () => setShowMasterKey(v => !v) },
                { label: 'Private Key', envKey: 'PAYDUNYA_PRIVATE_KEY', show: showPrivateKey, toggle: () => setShowPrivateKey(v => !v) },
              ].map(({ label, envKey, show, toggle }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-text-mid mb-1">{label}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border border-border-main rounded-lg px-3 py-2 text-sm bg-gray-fond font-mono text-text-light">
                      {show ? `${envKey} (configurée dans Vercel)` : masquerCle(envKey)}
                    </div>
                    <button onClick={toggle} className="text-text-light hover:text-text-mid p-2">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-light bg-gray-fond rounded-lg p-3">
              Pour modifier les clés : Vercel Dashboard → Settings → Environment Variables →
              <code className="font-mono mx-1">PAYDUNYA_MASTER_KEY</code>,
              <code className="font-mono mx-1">PAYDUNYA_PRIVATE_KEY</code>,
              <code className="font-mono mx-1">PAYDUNYA_TOKEN</code>
            </p>
          </div>
        </div>
      )}

      {/* ═══ PDF ═══ */}
      {tab === 'pdf' && (
        <div className="bg-white rounded-xl border border-border-main p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-main">Personnalisation des modèles PDF</h2>
            <button onClick={() => sauvegarder(['pdf_couleur_accent', 'pdf_footer_texte', 'pdf_conditions_generales'])}
              disabled={saving}
              className="flex items-center gap-1.5 bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
              <Save className="w-3.5 h-3.5" />{saving ? '…' : 'Enregistrer'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-text-mid w-36">Couleur d&apos;accent</label>
              <input type="color" value={params['pdf_couleur_accent'] ?? '#004880'}
                onChange={(e) => set('pdf_couleur_accent', e.target.value)}
                className="w-10 h-10 rounded border border-border-main cursor-pointer" />
              <span className="text-xs font-mono text-text-light">{params['pdf_couleur_accent'] ?? '#004880'}</span>
              <div className="w-16 h-8 rounded-lg" style={{ backgroundColor: params['pdf_couleur_accent'] ?? '#004880' }} />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Texte footer factures/devis</label>
              <input value={params['pdf_footer_texte'] ?? ''} onChange={(e) => set('pdf_footer_texte', e.target.value)}
                placeholder="Teralite · teralite.sn · contact@teralite.sn"
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-mid mb-1">Conditions générales (factures)</label>
              <textarea value={params['pdf_conditions_generales'] ?? ''} onChange={(e) => set('pdf_conditions_generales', e.target.value)}
                rows={4} placeholder="Conditions de paiement, délais, mentions légales…"
                className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite resize-none" />
            </div>
          </div>

          {/* Aperçu miniature */}
          <div className="border border-border-main rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-text-mid uppercase tracking-wider mb-3">Aperçu</p>
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: params['pdf_couleur_accent'] ?? '#004880' }}>
              <div className="px-4 py-3 text-white text-sm font-bold" style={{ backgroundColor: params['pdf_couleur_accent'] ?? '#004880' }}>
                {params['entreprise_nom'] ?? 'Teralite'} — FAC-2026-001
              </div>
              <div className="px-4 py-3 text-xs text-text-mid space-y-1 bg-white">
                <div className="flex justify-between">
                  <span>Sous-total HT</span><span>250 000 F CFA</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA (18%)</span><span>45 000 F CFA</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-border-main"
                  style={{ color: params['pdf_couleur_accent'] ?? '#004880' }}>
                  <span>TOTAL TTC</span><span>295 000 F CFA</span>
                </div>
              </div>
              <div className="px-4 py-2 text-xs text-text-light border-t border-border-main bg-gray-fond">
                {params['pdf_footer_texte'] ?? 'Teralite · teralite.sn'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Sauvegardes ═══ */}
      {tab === 'sauvegardes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border-main p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-main">Sauvegardes de la base de données</h2>

            <div className="flex items-start gap-3 bg-blue-light rounded-lg p-4 text-sm">
              <Database className="w-5 h-5 text-blue-teralite flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-blue-teralite">Sauvegardes automatiques Supabase</p>
                <p className="text-xs text-text-mid">
                  Supabase génère automatiquement des sauvegardes quotidiennes de votre base PostgreSQL
                  (rétention 7 jours sur le plan gratuit, 30 jours sur Pro).
                  Accessibles via <strong>Supabase Dashboard → Database → Backups</strong>.
                </p>
              </div>
            </div>

            {params['sauvegarde_derniere_date'] && (
              <div className="text-sm text-text-mid">
                Dernière sauvegarde manuelle :{' '}
                <span className="font-medium text-text-main">
                  {new Date(params['sauvegarde_derniere_date']).toLocaleString('fr-SN')}
                </span>
              </div>
            )}

            <button onClick={genererSauvegarde} disabled={saving}
              className="flex items-center gap-2 bg-blue-teralite text-white text-sm px-4 py-2.5 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
              <Database className="w-4 h-4" />
              {saving ? 'Enregistrement…' : 'Sauvegarde manuelle'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-border-main p-5 space-y-3">
            <h2 className="text-sm font-semibold text-text-main">Informations système</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Framework', value: 'Next.js 14 (App Router)' },
                { label: 'Base de données', value: 'PostgreSQL via Supabase' },
                { label: 'ORM', value: 'Prisma' },
                { label: 'Authentification', value: 'NextAuth.js (JWT, 8h)' },
                { label: 'Paiements', value: `PayDunya (mode : ${params['paydunya_mode'] ?? 'test'})` },
                { label: 'Hébergement', value: 'Vercel' },
                { label: 'Domaine', value: 'teralite.sn' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-main last:border-0">
                  <span className="text-text-light">{label}</span>
                  <span className="font-medium text-text-main">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
