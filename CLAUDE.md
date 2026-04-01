# CLAUDE.md — Teralite Web Platform

> Ce fichier est lu automatiquement par Claude Code au démarrage.
> Il contient toutes les conventions, règles et commandes du projet.
> **Ne jamais supprimer ce fichier.**

---

## Identité du projet

- **Nom** : Teralite Web Platform
- **Stack** : Next.js 14 (App Router) · Prisma ORM · PostgreSQL · Tailwind CSS · NextAuth.js · PayDunya · Vercel
- **Langue du site** : Français (Sénégal)
- **Domaine prod** : teralite.sn
- **Slogan** : « La lumière qui pense pour vous »

---

## Commandes essentielles

```bash
# Développement
npm run dev              # Lance le serveur local sur http://localhost:3000

# Base de données
npx prisma migrate dev   # Applique les migrations en développement
npx prisma migrate deploy # Applique les migrations en production (CI/CD)
npx prisma studio        # Interface visuelle de la base de données
npx prisma generate      # Régénère le client Prisma après modif schema

# Qualité
npm run lint             # ESLint sur tout le projet
npm run build            # Build de production (vérifier avant tout commit)
npm run type-check       # TypeScript strict check

# Tests
npm run test             # Jest — tests unitaires
npm run test:e2e         # Playwright — tests end-to-end
```

---

## Structure des dossiers

```
teralite/
├── app/                          # App Router Next.js 14
│   ├── (site)/                   # Groupe : site public
│   │   ├── page.tsx              # / — Accueil
│   │   ├── produits/
│   │   │   ├── page.tsx          # /produits — Catalogue
│   │   │   └── [slug]/page.tsx   # /produits/[slug] — Fiche produit
│   │   ├── panier/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── devis/page.tsx
│   │   ├── suivi/page.tsx
│   │   ├── a-propos/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── contact/page.tsx
│   │   └── cgv/page.tsx
│   ├── (admin)/                  # Groupe : dashboard admin (protégé)
│   │   └── admin/
│   │       ├── page.tsx          # /admin — Tableau de bord
│   │       ├── produits/
│   │       ├── commandes/
│   │       ├── devis/
│   │       ├── clients/
│   │       ├── comptabilite/
│   │       ├── commissions/
│   │       ├── contenu/
│   │       ├── promotions/
│   │       ├── utilisateurs/
│   │       └── parametres/
│   ├── api/                      # Routes API
│   │   ├── auth/[...nextauth]/
│   │   ├── produits/
│   │   ├── commandes/
│   │   ├── devis/
│   │   ├── paiement/
│   │   └── webhooks/
│   └── layout.tsx
├── components/
│   ├── ui/                       # Composants génériques (Button, Card, Badge…)
│   ├── site/                     # Composants site public (Header, Footer…)
│   └── admin/                    # Composants dashboard (Sidebar, DataTable…)
├── lib/
│   ├── prisma.ts                 # Instance Prisma singleton
│   ├── auth.ts                   # Config NextAuth
│   ├── paydunya.ts               # Client PayDunya
│   └── utils.ts                  # Helpers génériques
├── prisma/
│   ├── schema.prisma             # Schéma de données
│   └── migrations/               # Migrations SQL — NE JAMAIS MODIFIER MANUELLEMENT
├── public/
│   ├── images/
│   ├── logos/
│   │   ├── teralite-couleur.png
│   │   └── teralite-blanc.png
│   ├── manifest.json             # PWA
│   └── sw.js                     # Service Worker
└── types/
    └── index.ts                  # Types TypeScript globaux
```

---

## Conventions de nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Composants React | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase avec `use` | `useCart.ts` |
| Routes API | kebab-case | `api/produits/[id]/route.ts` |
| Variables | camelCase | `totalCommande` |
| Constantes | SCREAMING_SNAKE | `TAUX_TVA` |
| Tables Prisma | PascalCase singulier | `model Produit` |
| Variables CSS/Tailwind | kebab-case | `--color-blue-principal` |
| Fichiers de migration | auto-généré par Prisma | `20250410_init` |

---

## Design system — couleurs Tailwind

Toujours utiliser ces classes Tailwind personnalisées (définies dans `tailwind.config.ts`) :

```
bleu principal   → bg-blue-teralite    (#004880)
bleu foncé       → bg-blue-dark        (#002D50)
bleu clair       → bg-blue-light       (#E8F0F8)
orange accent    → bg-orange-teralite  (#FFA000)
orange clair     → bg-orange-light     (#FFF3DC)
vert succès      → bg-green-teralite   (#1A6B3A)
vert clair       → bg-green-light      (#E6F4EC)
rouge erreur     → bg-red-teralite     (#B03A2E)
rouge clair      → bg-red-light        (#FADBD8)
gris fond        → bg-gray-fond        (#F5F5F5)
texte principal  → text-text-main      (#1A1A1A)
texte moyen      → text-text-mid       (#555555)
texte léger      → text-text-light     (#888888)
bordure          → border-border-main  (#E5E5E5)
```

**Polices** : DM Sans (300/400/500/600) pour le corps, DM Mono pour les références/codes.

**Border-radius** : `rounded-xl` (12px) cartes · `rounded-lg` (8px) boutons · `rounded-full` badges/pills.

---

## Règles absolues — NE JAMAIS FAIRE

- ❌ Ne jamais exposer les clés PayDunya dans le code client
- ❌ Ne jamais stocker les mots de passe en clair (toujours bcrypt)
- ❌ Ne jamais utiliser `delete` sur un produit (archiver uniquement)
- ❌ Ne jamais modifier manuellement les fichiers dans `prisma/migrations/`
- ❌ Ne jamais commiter un `.env` ou `.env.local`
- ❌ Ne jamais appeler l'API PayDunya depuis le client (toujours via `app/api/`)
- ❌ Ne jamais bypasser le middleware d'auth sur les routes `/admin`
- ❌ Ne jamais utiliser `any` en TypeScript sauf cas extrême documenté

---

## Règles importantes — TOUJOURS FAIRE

- ✅ Toujours valider les données côté serveur (Zod)
- ✅ Toujours utiliser `next/image` pour toutes les images
- ✅ Toujours tester sur mobile (viewport 375px) avant de commiter
- ✅ Toujours utiliser le singleton Prisma (`lib/prisma.ts`)
- ✅ Toujours formater les montants en FCFA (`toLocaleString('fr-SN')`)
- ✅ Toujours préfixer les variables d'env avec `NEXT_PUBLIC_` si accès client
- ✅ Toujours écrire les migrations via `prisma migrate dev` (jamais à la main)

---

## Variables d'environnement requises

```env
# Base de données
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# PayDunya
PAYDUNYA_MASTER_KEY=
PAYDUNYA_PRIVATE_KEY=
PAYDUNYA_TOKEN=
PAYDUNYA_MODE=test   # → production en prod

# WhatsApp (notifications)
WHATSAPP_API_URL=
WHATSAPP_TOKEN=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SITE_NAME=Teralite
```

---

## Rôles utilisateurs

| Rôle | Valeur Prisma | Accès |
|------|--------------|-------|
| Super Admin | `SUPER_ADMIN` | Tout — finances, commissions, paramètres, comptes |
| Admin | `ADMIN` | Tout sauf supprimer un Super Admin et clés API |
| Vendeur | `VENDEUR` | Produits, commandes, devis, ses propres commissions |

Le middleware `middleware.ts` protège toutes les routes `/admin/*`.
Vérification du rôle dans chaque Server Action ou Route Handler.

---

## Ordre de développement (phases)

Respecter cet ordre sans sauter d'étape :

1. **Phase 1** — Fondations : setup Next.js + Prisma + PostgreSQL + NextAuth + layout admin
2. **Phase 2** — Site public vitrine : accueil, catalogue, fiches, pages statiques, PWA, SEO
3. **Phase 3** — E-commerce : panier, checkout, PayDunya, confirmation, suivi commande
4. **Phase 4** — Dashboard admin opérationnel : produits, commandes, devis, clients, CMS, promos
5. **Phase 5** — Comptabilité & commissions vendeurs + exports PDF/Excel
6. **Phase 6** — Tests, optimisation PageSpeed 80+, mise en production teralite.sn

---

## Paiements PayDunya

- Modes supportés : Orange Money · Wave · YAS · Cash (livraison)
- Toujours utiliser `lib/paydunya.ts` — ne jamais appeler l'API directement
- Basculer `PAYDUNYA_MODE=test` → `production` depuis les paramètres admin
- Webhook de confirmation : `POST /api/webhooks/paydunya`
- Cash → commande en statut `EN_ATTENTE_PAIEMENT` jusqu'à confirmation manuelle admin

---

## Génération PDF

- Librairie : `@react-pdf/renderer` ou `puppeteer` (à décider en Phase 5)
- Factures et devis : branded Teralite (logo, couleurs, numéro auto)
- Templates dans `components/pdf/`

---

## PWA

- `public/manifest.json` : nom "Teralite", couleur thème `#004880`
- Service Worker : cache le catalogue pour mode offline
- Tester l'installation sur Android Chrome avant la mise en production
