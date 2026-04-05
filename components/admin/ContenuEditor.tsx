'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, Save, CheckCircle2 } from 'lucide-react'

interface ContenuEntry { id: string; cle: string; valeur: string }
interface Temoignage { id: string; nom: string; role: string; texte: string; note: number; ordre: number; actif: boolean }
interface FaqItem { id: string; question: string; reponse: string; categorie: string; ordre: number; actif: boolean }

interface Props {
  contenu: ContenuEntry[]
  temoignages: Temoignage[]
  faq: FaqItem[]
}

type Tab = 'general' | 'temoignages' | 'faq'

function val(contenu: ContenuEntry[], cle: string) {
  return contenu.find((c) => c.cle === cle)?.valeur ?? ''
}

export default function ContenuEditor({ contenu: initialContenu, temoignages: initialTem, faq: initialFaq }: Props) {
  const [tab, setTab] = useState<Tab>('general')

  // ——— Général ———
  const [clesEdit, setClesEdit] = useState<Record<string, string>>({
    hero_titre: val(initialContenu, 'hero_titre'),
    hero_sous_titre: val(initialContenu, 'hero_sous_titre'),
    hero_cta: val(initialContenu, 'hero_cta'),
    apropos_texte: val(initialContenu, 'apropos_texte'),
    contact_telephone: val(initialContenu, 'contact_telephone'),
    contact_whatsapp: val(initialContenu, 'contact_whatsapp'),
    contact_adresse: val(initialContenu, 'contact_adresse'),
    contact_facebook: val(initialContenu, 'contact_facebook'),
  })
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [savedGeneral, setSavedGeneral] = useState(false)

  const sauvegarderGeneral = async () => {
    setSavingGeneral(true)
    setSavedGeneral(false)
    try {
      await fetch('/api/admin/contenu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cles: clesEdit }),
      })
      setSavedGeneral(true)
      setTimeout(() => setSavedGeneral(false), 3000)
    } finally {
      setSavingGeneral(false)
    }
  }

  // ——— Témoignages ———
  const [temoignages, setTemoignages] = useState<Temoignage[]>(initialTem)
  const [editingTem, setEditingTem] = useState<Partial<Temoignage> | null>(null)
  const [savingTem, setSavingTem] = useState(false)

  const sauvegarderTem = async () => {
    if (!editingTem) return
    setSavingTem(true)
    try {
      if (editingTem.id) {
        const res = await fetch(`/api/admin/temoignages/${editingTem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingTem),
        })
        if (res.ok) {
          const updated = await res.json() as Temoignage
          setTemoignages((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        }
      } else {
        const res = await fetch('/api/admin/temoignages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom: editingTem.nom, role: editingTem.role, texte: editingTem.texte, note: editingTem.note ?? 5, ordre: temoignages.length, actif: true }),
        })
        if (res.ok) {
          const created = await res.json() as Temoignage
          setTemoignages((prev) => [...prev, created])
        }
      }
      setEditingTem(null)
    } finally {
      setSavingTem(false)
    }
  }

  const supprimerTem = async (id: string) => {
    if (!confirm('Supprimer ce témoignage ?')) return
    await fetch(`/api/admin/temoignages/${id}`, { method: 'DELETE' })
    setTemoignages((prev) => prev.filter((t) => t.id !== id))
  }

  const toggleActifTem = async (t: Temoignage) => {
    await fetch(`/api/admin/temoignages/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actif: !t.actif }),
    })
    setTemoignages((prev) => prev.map((x) => (x.id === t.id ? { ...x, actif: !x.actif } : x)))
  }

  const deplacerTem = async (idx: number, dir: -1 | 1) => {
    const newList = [...temoignages]
    const target = idx + dir
    if (target < 0 || target >= newList.length) return
    ;[newList[idx], newList[target]] = [newList[target], newList[idx]]
    newList[idx].ordre = idx
    newList[target].ordre = target
    setTemoignages(newList)
    await Promise.all([
      fetch(`/api/admin/temoignages/${newList[idx].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ordre: idx }) }),
      fetch(`/api/admin/temoignages/${newList[target].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ordre: target }) }),
    ])
  }

  // ——— FAQ ———
  const [faq, setFaq] = useState<FaqItem[]>(initialFaq)
  const [editingFaq, setEditingFaq] = useState<Partial<FaqItem> | null>(null)
  const [savingFaq, setSavingFaq] = useState(false)
  const categories = Array.from(new Set(faq.map((f) => f.categorie)))

  const sauvegarderFaq = async () => {
    if (!editingFaq) return
    setSavingFaq(true)
    try {
      if (editingFaq.id) {
        const res = await fetch(`/api/admin/faq/${editingFaq.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingFaq),
        })
        if (res.ok) {
          const updated = await res.json() as FaqItem
          setFaq((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
        }
      } else {
        const res = await fetch('/api/admin/faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: editingFaq.question, reponse: editingFaq.reponse, categorie: editingFaq.categorie, ordre: faq.length, actif: true }),
        })
        if (res.ok) {
          const created = await res.json() as FaqItem
          setFaq((prev) => [...prev, created])
        }
      }
      setEditingFaq(null)
    } finally {
      setSavingFaq(false)
    }
  }

  const supprimerFaq = async (id: string) => {
    if (!confirm('Supprimer cette question ?')) return
    await fetch(`/api/admin/faq/${id}`, { method: 'DELETE' })
    setFaq((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-fond rounded-xl p-1 w-fit">
        {([['general', 'Général'], ['temoignages', 'Témoignages'], ['faq', 'FAQ']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === t ? 'bg-white text-blue-teralite shadow-sm' : 'text-text-mid hover:text-text-main'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ——— Général ——— */}
      {tab === 'general' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-main">Contenu du site</h2>
            <div className="flex items-center gap-2">
              {savedGeneral && <span className="flex items-center gap-1 text-xs text-green-teralite"><CheckCircle2 className="w-3.5 h-3.5" />Sauvegardé</span>}
              <button onClick={sauvegarderGeneral} disabled={savingGeneral}
                className="flex items-center gap-1.5 bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
                <Save className="w-4 h-4" />{savingGeneral ? 'Enregistrement…' : 'Enregistrer tout'}
              </button>
            </div>
          </div>

          {/* Hero */}
          <div className="bg-white rounded-xl border border-border-main p-5 space-y-3">
            <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider">Section Hero (accueil)</h3>
            {[
              { cle: 'hero_titre', label: 'Titre principal' },
              { cle: 'hero_sous_titre', label: 'Sous-titre' },
              { cle: 'hero_cta', label: 'Texte du bouton CTA' },
            ].map(({ cle, label }) => (
              <div key={cle}>
                <label className="block text-xs font-medium text-text-mid mb-1">{label}</label>
                <input value={clesEdit[cle] ?? ''} onChange={(e) => setClesEdit((p) => ({ ...p, [cle]: e.target.value }))}
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
            ))}
          </div>

          {/* À propos */}
          <div className="bg-white rounded-xl border border-border-main p-5">
            <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-3">Section À propos</h3>
            <label className="block text-xs font-medium text-text-mid mb-1">Texte de présentation</label>
            <textarea value={clesEdit.apropos_texte ?? ''} onChange={(e) => setClesEdit((p) => ({ ...p, apropos_texte: e.target.value }))}
              rows={4} className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite resize-y" />
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl border border-border-main p-5 space-y-3">
            <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider">Informations contact</h3>
            {[
              { cle: 'contact_telephone', label: 'Téléphone' },
              { cle: 'contact_whatsapp', label: 'WhatsApp' },
              { cle: 'contact_adresse', label: 'Adresse' },
              { cle: 'contact_facebook', label: 'Facebook (URL)' },
            ].map(({ cle, label }) => (
              <div key={cle}>
                <label className="block text-xs font-medium text-text-mid mb-1">{label}</label>
                <input value={clesEdit[cle] ?? ''} onChange={(e) => setClesEdit((p) => ({ ...p, [cle]: e.target.value }))}
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ——— Témoignages ——— */}
      {tab === 'temoignages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-main">Témoignages ({temoignages.length})</h2>
            <button onClick={() => setEditingTem({ nom: '', role: '', texte: '', note: 5 })}
              className="flex items-center gap-2 bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors">
              <Plus className="w-4 h-4" />Ajouter
            </button>
          </div>

          {editingTem && (
            <div className="bg-white rounded-xl border border-blue-teralite/30 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-text-main">{editingTem.id ? 'Modifier' : 'Nouveau témoignage'}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-mid mb-1">Nom</label>
                  <input value={editingTem.nom ?? ''} onChange={(e) => setEditingTem((p) => ({ ...p, nom: e.target.value }))}
                    className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-mid mb-1">Rôle / Ville</label>
                  <input value={editingTem.role ?? ''} onChange={(e) => setEditingTem((p) => ({ ...p, role: e.target.value }))}
                    className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Témoignage</label>
                <textarea value={editingTem.texte ?? ''} onChange={(e) => setEditingTem((p) => ({ ...p, texte: e.target.value }))}
                  rows={3} className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Note ({editingTem.note ?? 5}/5)</label>
                <input type="range" min={1} max={5} value={editingTem.note ?? 5} onChange={(e) => setEditingTem((p) => ({ ...p, note: parseInt(e.target.value) }))}
                  className="accent-orange-teralite" />
              </div>
              <div className="flex gap-2">
                <button onClick={sauvegarderTem} disabled={savingTem}
                  className="bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
                  {savingTem ? '…' : 'Enregistrer'}
                </button>
                <button onClick={() => setEditingTem(null)} className="text-sm text-text-mid border border-border-main px-4 py-2 rounded-lg hover:bg-gray-fond">
                  Annuler
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {temoignages.map((t, idx) => (
              <div key={t.id} className={`bg-white rounded-xl border p-4 flex items-start gap-3 ${t.actif ? 'border-border-main' : 'border-dashed border-border-main opacity-60'}`}>
                <div className="flex flex-col gap-1">
                  <button onClick={() => deplacerTem(idx, -1)} disabled={idx === 0} className="text-text-light hover:text-text-main disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => deplacerTem(idx, 1)} disabled={idx === temoignages.length - 1} className="text-text-light hover:text-text-main disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-main">{t.nom} <span className="font-normal text-text-light">— {t.role}</span></p>
                  <p className="text-sm text-text-mid mt-1 line-clamp-2">{t.texte}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`text-xs ${i < t.note ? 'text-orange-teralite' : 'text-border-main'}`}>★</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActifTem(t)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${t.actif ? 'bg-green-light text-green-teralite hover:bg-red-light hover:text-red-teralite' : 'bg-red-light text-red-teralite hover:bg-green-light hover:text-green-teralite'}`}>
                    {t.actif ? 'Actif' : 'Inactif'}
                  </button>
                  <button onClick={() => setEditingTem(t)} className="text-xs text-blue-teralite hover:underline">Modifier</button>
                  <button onClick={() => supprimerTem(t.id)} className="text-text-light hover:text-red-teralite transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ——— FAQ ——— */}
      {tab === 'faq' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-main">FAQ ({faq.length} questions)</h2>
            <button onClick={() => setEditingFaq({ question: '', reponse: '', categorie: categories[0] ?? '' })}
              className="flex items-center gap-2 bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors">
              <Plus className="w-4 h-4" />Ajouter
            </button>
          </div>

          {editingFaq && (
            <div className="bg-white rounded-xl border border-blue-teralite/30 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-text-main">{editingFaq.id ? 'Modifier' : 'Nouvelle question'}</h3>
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Catégorie</label>
                <input value={editingFaq.categorie ?? ''} onChange={(e) => setEditingFaq((p) => ({ ...p, categorie: e.target.value }))}
                  list="cats-faq" placeholder="Paiement, Livraison, Produits…"
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
                <datalist id="cats-faq">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Question</label>
                <input value={editingFaq.question ?? ''} onChange={(e) => setEditingFaq((p) => ({ ...p, question: e.target.value }))}
                  className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-mid mb-1">Réponse</label>
                <textarea value={editingFaq.reponse ?? ''} onChange={(e) => setEditingFaq((p) => ({ ...p, reponse: e.target.value }))}
                  rows={4} className="w-full border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-teralite resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={sauvegarderFaq} disabled={savingFaq}
                  className="bg-blue-teralite text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-60">
                  {savingFaq ? '…' : 'Enregistrer'}
                </button>
                <button onClick={() => setEditingFaq(null)} className="text-sm text-text-mid border border-border-main px-4 py-2 rounded-lg hover:bg-gray-fond">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {categories.length === 0 ? (
            <p className="text-sm text-text-light py-8 text-center">Aucune question — cliquez sur Ajouter</p>
          ) : (
            categories.map((cat) => (
              <div key={cat} className="bg-white rounded-xl border border-border-main overflow-hidden">
                <div className="px-4 py-3 bg-gray-fond border-b border-border-main">
                  <h3 className="text-xs font-semibold text-text-mid uppercase tracking-wider">{cat}</h3>
                </div>
                <div className="divide-y divide-border-main">
                  {faq.filter((f) => f.categorie === cat).map((f) => (
                    <div key={f.id} className={`flex items-start gap-3 px-4 py-3 ${!f.actif ? 'opacity-60' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-main">{f.question}</p>
                        <p className="text-xs text-text-light mt-0.5 line-clamp-2">{f.reponse}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setEditingFaq(f)} className="text-xs text-blue-teralite hover:underline">Modifier</button>
                        <button onClick={() => supprimerFaq(f.id)} className="text-text-light hover:text-red-teralite transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
