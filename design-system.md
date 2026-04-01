# design-system.md — Teralite

> Référence complète du design system pour Claude Code.
> Toujours utiliser ces classes et composants — ne pas réinventer.

---

## Couleurs — tailwind.config.ts

```typescript
// tailwind.config.ts
colors: {
  'blue-teralite':  '#004880',
  'blue-dark':      '#002D50',
  'blue-light':     '#E8F0F8',
  'orange-teralite':'#FFA000',
  'orange-dark':    '#CC7A00',
  'orange-light':   '#FFF3DC',
  'green-teralite': '#1A6B3A',
  'green-light':    '#E6F4EC',
  'red-teralite':   '#B03A2E',
  'red-light':      '#FADBD8',
  'gray-fond':      '#F5F5F5',
  'text-main':      '#1A1A1A',
  'text-mid':       '#555555',
  'text-light':     '#888888',
  'border-main':    '#E5E5E5',
},
fontFamily: {
  sans: ['DM Sans', 'sans-serif'],
  mono: ['DM Mono', 'monospace'],
},
```

---

## Typographie

| Usage | Classe Tailwind |
|---|---|
| Titre page | `text-2xl font-semibold text-blue-teralite` |
| Titre section | `text-lg font-semibold text-text-main` |
| Label champ | `text-xs font-semibold text-blue-teralite uppercase tracking-wider` |
| Corps texte | `text-sm text-text-mid leading-relaxed` |
| Texte léger | `text-xs text-text-light` |
| Code / référence | `font-mono text-sm text-text-mid` |

---

## Composants UI

### Card (conteneur principal)

```tsx
// Utilisation type : tableau de bord, formulaires, sections
<div className="bg-white rounded-xl shadow-sm border border-border-main overflow-hidden mb-6">
  {/* Header optionnel */}
  <div className="px-8 py-6 border-b border-border-main flex items-center justify-between">
    <h2 className="text-lg font-semibold text-text-main">Titre</h2>
  </div>
  {/* Contenu */}
  <div className="px-8 py-7">
    {/* ... */}
  </div>
</div>
```

### Card colorée (dashboard KPI)

```tsx
// Couleurs : blue-teralite | orange-teralite | green-teralite | red-teralite
<div className="bg-blue-teralite rounded-xl p-6 text-white">
  <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Label</p>
  <p className="text-3xl font-semibold">842k</p>
  <p className="text-xs text-white/70 mt-1">↑ +12% vs mois dernier</p>
</div>
```

### Card avec bordure gauche

```tsx
// Styles disponibles : blue | orange | green | red
const styles = {
  blue:   'border-l-4 border-blue-teralite bg-blue-light/30',
  orange: 'border-l-4 border-orange-teralite bg-orange-light/30',
  green:  'border-l-4 border-green-teralite bg-green-light/30',
  red:    'border-l-4 border-red-teralite bg-red-light/30',
}
<div className={`${styles.blue} rounded-r-xl px-5 py-4 mb-3`}>
  <p className="text-sm font-medium text-text-main">Titre</p>
  <p className="text-xs text-text-mid mt-1">Description</p>
</div>
```

---

### Badges / Pills

```tsx
// Statuts de commande
const statutClasses = {
  RECUE:              'bg-blue-light text-blue-teralite',
  CONFIRMEE:          'bg-blue-light text-blue-teralite',
  EN_PREPARATION:     'bg-orange-light text-orange-dark',
  EXPEDIEE:           'bg-orange-light text-orange-dark',
  LIVREE:             'bg-green-light text-green-teralite',
  ANNULEE:            'bg-red-light text-red-teralite',
  EN_ATTENTE_PAIEMENT:'bg-gray-fond text-text-light',
}

<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statutClasses[statut]}`}>
  {statut}
</span>
```

---

### Boutons

```tsx
// Primaire (bleu)
<button className="bg-blue-teralite hover:bg-blue-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
  Enregistrer
</button>

// Secondaire (contour)
<button className="border border-border-main text-text-mid hover:bg-gray-fond text-sm font-medium px-4 py-2 rounded-lg transition-colors">
  Annuler
</button>

// Accent orange
<button className="bg-orange-teralite hover:bg-orange-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
  + Nouveau produit
</button>

// Danger
<button className="bg-red-light text-red-teralite hover:bg-red-teralite hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
  Archiver
</button>
```

---

### Tableau de données (DataTable)

```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b border-border-main">
        <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider py-3 px-4">
          Colonne
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-border-main hover:bg-gray-fond/50 transition-colors">
        <td className="py-3 px-4 text-sm text-text-main">Valeur</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### Champs de formulaire

```tsx
// Input texte
<div className="mb-4">
  <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
    Nom du produit
  </label>
  <input
    className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main
               focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite
               placeholder:text-text-light transition-colors"
    placeholder="Ex: Ampoule LED E27"
  />
</div>

// Select
<select className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main
                   focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite">
  <option>Option</option>
</select>
```

---

### Header section admin (avec icône)

```tsx
<div className="flex items-center gap-4 px-8 py-6 border-b border-border-main">
  <div className="w-10 h-10 bg-blue-teralite rounded-xl flex items-center justify-center flex-shrink-0">
    <span className="text-xs font-bold text-white tracking-wider">PRD</span>
  </div>
  <div>
    <p className="text-xs font-medium text-orange-teralite uppercase tracking-wider mb-0.5">
      Partie 3.2
    </p>
    <h2 className="text-lg font-semibold text-blue-teralite">Gestion des produits</h2>
  </div>
</div>
```

---

### Sidebar admin

```tsx
// Structure de la sidebar (desktop)
<aside className="w-56 bg-blue-teralite min-h-screen flex flex-col">
  {/* Logo */}
  <div className="px-5 py-4 border-b border-white/10">
    <img src="/logos/teralite-blanc.png" alt="Teralite" className="h-8" />
  </div>

  {/* Navigation */}
  <nav className="flex-1 px-3 py-4 space-y-0.5">
    {/* Groupe */}
    <p className="text-xs text-white/40 uppercase tracking-wider px-3 mb-2 mt-4">Principal</p>

    {/* Item actif */}
    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/15 text-white text-sm font-medium">
      <span className="w-4 h-4">{/* Icône */}</span>
      Tableau de bord
    </a>

    {/* Item inactif */}
    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white text-sm transition-colors">
      <span className="w-4 h-4">{/* Icône */}</span>
      Produits
      {/* Badge compteur */}
      <span className="ml-auto bg-orange-teralite text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">5</span>
    </a>
  </nav>

  {/* Footer sidebar */}
  <div className="px-3 py-4 border-t border-white/10">
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="w-7 h-7 rounded-full bg-orange-teralite flex items-center justify-center text-xs font-semibold text-white">
        AD
      </div>
      <div>
        <p className="text-xs font-medium text-white">Admin Teralite</p>
        <p className="text-xs text-white/50">Administrateur</p>
      </div>
    </div>
  </div>
</aside>
```

---

### Alerte / Notification admin

```tsx
// Alerte warning (orange)
<div className="bg-orange-light border border-orange-teralite/30 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
  <div className="w-2 h-2 rounded-full bg-orange-teralite mt-1.5 flex-shrink-0" />
  <p className="text-sm text-text-main">
    <strong>3 devis non traités</strong> depuis plus de 48h — pensez à y répondre
  </p>
</div>

// Alerte danger (rouge)
<div className="bg-red-light border border-red-teralite/30 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
  <div className="w-2 h-2 rounded-full bg-red-teralite mt-1.5 flex-shrink-0" />
  <p className="text-sm text-text-main">
    <strong>Stock critique :</strong> Plafonnier TL-PLC — 2 unités restantes
  </p>
</div>
```

---

### Graphique des ventes (placeholder)

Utiliser `recharts` avec les couleurs Teralite :

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={180}>
  <BarChart data={data}>
    <XAxis dataKey="jour" tick={{ fontSize: 11, fill: '#888' }} />
    <YAxis tick={{ fontSize: 11, fill: '#888' }} />
    <Tooltip
      contentStyle={{ borderRadius: 8, border: '1px solid #E5E5E5', fontSize: 12 }}
    />
    <Bar dataKey="ventes" fill="#004880" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

---

## Header site public

```tsx
<header className="bg-white border-b border-border-main sticky top-0 z-50">
  <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
    <img src="/logos/teralite-couleur.png" alt="Teralite" className="h-9" />
    <nav className="hidden md:flex items-center gap-6">
      <a className="text-sm text-text-mid hover:text-blue-teralite transition-colors">Produits</a>
      {/* ... */}
    </nav>
    <div className="flex items-center gap-3">
      <a className="bg-orange-teralite text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-dark transition-colors">
        Devis
      </a>
    </div>
  </div>
</header>
```

---

## Formatage des données (helpers)

```typescript
// lib/utils.ts

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

// Date en français
export const formatDate = (date: Date): string =>
  date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
// → "10 avril 2025"
```

---

## Logos — Utilisation

| Contexte | Fichier | Taille |
|---|---|---|
| Header site public | `teralite-couleur.png` | h-9 (36px) |
| Sidebar admin | `teralite-blanc.png` | h-8 (32px) |
| PDF factures/devis | `teralite-couleur.png` | 120px largeur |
| Cover page CDC | `teralite-couleur.png` | 40px |
| PWA / favicon | Icône carrée orange | 192px / 512px |

---

## Icônes recommandées

Utiliser `lucide-react` (déjà dans l'écosystème Next.js) :

```tsx
import {
  LayoutDashboard, Package, ShoppingCart, FileText,
  Users, BarChart2, DollarSign, Megaphone, Settings,
  Star, Bell, Search, Plus, Edit, Archive, Download,
  ChevronRight, TrendingUp, AlertTriangle
} from 'lucide-react'
```

Taille standard : `className="w-4 h-4"` dans la sidebar, `className="w-5 h-5"` dans les headers.
