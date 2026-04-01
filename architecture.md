# architecture.md — Teralite Web Platform

> Architecture technique complète — Next.js 14 App Router, mono-repo.

---

## Vue d'ensemble

```
Browser / Mobile Android (PWA)
        │
        ▼
  [Vercel CDN / Edge]
        │
  ┌─────┴──────────────────┐
  │   Next.js 14            │
  │   App Router            │
  │                         │
  │  (site)/     ← pages publiques (SSR + ISR)
  │  (admin)/    ← dashboard protégé (SSR + auth)
  │  api/        ← Route Handlers (Server-side only)
  └────────┬────────────────┘
           │  Prisma ORM
           ▼
    [PostgreSQL — Supabase / Railway]
           │
    [Backups automatiques quotidiens]
```

---

## Modèle de données complet (Prisma Schema)

> Fichier de référence : `prisma/schema.prisma`

### Enums

```prisma
enum Role {
  SUPER_ADMIN
  ADMIN
  VENDEUR
}

enum StatutCommande {
  RECUE
  CONFIRMEE
  EN_PREPARATION
  EXPEDIEE
  LIVREE
  ANNULEE
  EN_ATTENTE_PAIEMENT
}

enum StatutDevis {
  NOUVEAU
  EN_COURS
  ENVOYE
  ACCEPTE
  REFUSE
}

enum TypePaiement {
  ORANGE_MONEY
  WAVE
  YAS
  CASH
}

enum StatutCommission {
  EN_ATTENTE
  VALIDEE
  PAYEE
  ANNULEE
}

enum TypeProduit {
  DISPONIBLE
  RUPTURE
  BIENTOT
}

enum TypeClient {
  PARTICULIER
  ENTREPRISE
  MUNICIPALITE
}

enum TypeDepense {
  STOCK
  TRANSPORT
  MARKETING
  FRAIS_DIVERS
}

enum TypePromo {
  POURCENTAGE
  MONTANT_FIXE
}
```

### Modèles principaux

```prisma
model Utilisateur {
  id            String    @id @default(cuid())
  nom           String
  email         String    @unique
  motDePasse    String    // bcrypt hash
  role          Role      @default(VENDEUR)
  actif         Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  commissions   Commission[]
  commandes     Commande[]   @relation("VendeurCommande")
  devis         Devis[]      @relation("VendeurDevis")
  journalActivite JournalActivite[]
}

model Produit {
  id              String      @id @default(cuid())
  nom             String
  slug            String      @unique
  reference       String      @unique
  categorie       String
  descriptionCourte String
  descriptionLongue String?
  specifications  Json?       // tableau de { label, valeur }
  prixPublic      Int?        // en FCFA, null si "sur devis"
  prixDevis       Int?
  tva             Float       @default(0)
  stock           Int         @default(0)
  seuilAlerte     Int         @default(5)
  statut          TypeProduit @default(DISPONIBLE)
  estVedette      Boolean     @default(false)
  archive         Boolean     @default(false)
  photos          Photo[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  lignesCommande  LigneCommande[]
  lignesDevis     LigneDevis[]
}

model Photo {
  id          String   @id @default(cuid())
  url         String
  estPrincipale Boolean @default(false)
  ordre       Int      @default(0)
  produitId   String
  produit     Produit  @relation(fields: [produitId], references: [id])
}

model Client {
  id          String     @id @default(cuid())
  nom         String
  telephone   String
  whatsapp    String?
  email       String?
  adresse     String?
  type        TypeClient @default(PARTICULIER)
  notes       String?
  createdAt   DateTime   @default(now())

  commandes   Commande[]
  devis       Devis[]
}

model Commande {
  id              String         @id @default(cuid())
  numero          String         @unique  // ex: #0847
  clientId        String
  client          Client         @relation(fields: [clientId], references: [id])
  vendeurId       String?
  vendeur         Utilisateur?   @relation("VendeurCommande", fields: [vendeurId], references: [id])
  statut          StatutCommande @default(RECUE)
  typePaiement    TypePaiement
  montantTotal    Int            // FCFA
  fraisLivraison  Int            @default(0)
  adresseLivraison String?
  zoneId          String?
  zone            ZoneLivraison? @relation(fields: [zoneId], references: [id])
  notes           String?        // notes internes admin
  paydunyaRef     String?        // référence transaction PayDunya
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  lignes          LigneCommande[]
  historique      HistoriqueStatut[]
  commission      Commission?
  facture         Facture?
}

model LigneCommande {
  id          String   @id @default(cuid())
  commandeId  String
  commande    Commande @relation(fields: [commandeId], references: [id])
  produitId   String
  produit     Produit  @relation(fields: [produitId], references: [id])
  quantite    Int
  prixUnitaire Int     // prix au moment de la commande (snapshot)
  sousTotal   Int
}

model HistoriqueStatut {
  id          String         @id @default(cuid())
  commandeId  String
  commande    Commande       @relation(fields: [commandeId], references: [id])
  statut      StatutCommande
  note        String?
  createdAt   DateTime       @default(now())
}

model Devis {
  id          String      @id @default(cuid())
  numero      String      @unique   // ex: DEV-2025-001
  clientId    String
  client      Client      @relation(fields: [clientId], references: [id])
  vendeurId   String?
  vendeur     Utilisateur? @relation("VendeurDevis", fields: [vendeurId], references: [id])
  statut      StatutDevis @default(NOUVEAU)
  conditions  String?
  validiteJours Int       @default(30)
  notes       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  lignes      LigneDevis[]
  facture     Facture?
}

model LigneDevis {
  id            String   @id @default(cuid())
  devisId       String
  devis         Devis    @relation(fields: [devisId], references: [id])
  designation   String
  produitId     String?
  produit       Produit? @relation(fields: [produitId], references: [id])
  quantite      Int
  prixUnitaire  Int
  remise        Float    @default(0)  // pourcentage
  tva           Float    @default(0)
  sousTotal     Int
}

model Facture {
  id          String    @id @default(cuid())
  numero      String    @unique  // ex: FAC-2025-001
  commandeId  String?   @unique
  commande    Commande? @relation(fields: [commandeId], references: [id])
  devisId     String?   @unique
  devis       Devis?    @relation(fields: [devisId], references: [id])
  montantHT   Int
  montantTVA  Int
  montantTTC  Int
  createdAt   DateTime  @default(now())
}

model Commission {
  id          String           @id @default(cuid())
  vendeurId   String
  vendeur     Utilisateur      @relation(fields: [vendeurId], references: [id])
  commandeId  String           @unique
  commande    Commande         @relation(fields: [commandeId], references: [id])
  montant     Int              // FCFA calculé
  taux        Float?           // % appliqué
  montantFixe Int?             // FCFA fixe appliqué
  statut      StatutCommission @default(EN_ATTENTE)
  notePaiement String?
  payeeLe     DateTime?
  createdAt   DateTime         @default(now())
}

model ConfigCommission {
  id          String   @id @default(cuid())
  taux        Float?   // pourcentage
  montantFixe Int?     // FCFA
  actif       Boolean  @default(true)
  dateEffet   DateTime @default(now())
  createdAt   DateTime @default(now())
}

model Recette {
  id          String   @id @default(cuid())
  commandeId  String?
  description String
  montant     Int      // FCFA
  typePaiement TypePaiement?
  date        DateTime @default(now())
  createdAt   DateTime @default(now())
}

model Depense {
  id           String      @id @default(cuid())
  categorie    TypeDepense
  description  String
  montant      Int         // FCFA
  justificatif String?     // URL photo uploadée
  date         DateTime    @default(now())
  createdAt    DateTime    @default(now())
}

model ZoneLivraison {
  id          String     @id @default(cuid())
  nom         String     // ex: "Dakar Centre"
  tarif       Int        // FCFA
  delaiJours  Int        @default(2)
  actif       Boolean    @default(true)
  commandes   Commande[]
}

model CodePromo {
  id          String    @id @default(cuid())
  code        String    @unique
  type        TypePromo
  valeur      Float
  expiration  DateTime?
  usageMax    Int?
  usageActuel Int       @default(0)
  actif       Boolean   @default(true)
  createdAt   DateTime  @default(now())
}

model ContenuSite {
  id    String @id @default(cuid())
  cle   String @unique   // ex: "hero_titre", "hero_sous_titre"
  valeur String
  updatedAt DateTime @updatedAt
}

model Temoignage {
  id        String   @id @default(cuid())
  nom       String
  role      String
  texte     String
  note      Int      @default(5)
  ordre     Int      @default(0)
  actif     Boolean  @default(true)
  createdAt DateTime @default(now())
}

model FAQ {
  id          String   @id @default(cuid())
  question    String
  reponse     String
  categorie   String
  ordre       Int      @default(0)
  actif       Boolean  @default(true)
}

model Parametres {
  id            String  @id @default(cuid())
  cle           String  @unique
  valeur        String
  description   String?
}

model JournalActivite {
  id            String      @id @default(cuid())
  utilisateurId String?
  utilisateur   Utilisateur? @relation(fields: [utilisateurId], references: [id])
  action        String
  details       Json?
  createdAt     DateTime    @default(now())
}
```

---

## Guide des migrations SQL — QUAND ET COMMENT

> C'est la partie la plus importante pour éviter de casser la production.

### Principe fondamental

Prisma génère les migrations automatiquement. **Tu n'écris jamais de SQL à la main.**

```
Tu modifies schema.prisma
        ↓
npx prisma migrate dev --name description_courte
        ↓
Prisma génère un fichier SQL dans prisma/migrations/
        ↓
Ce fichier est commité dans Git avec ton code
        ↓
En déployant sur Vercel → npx prisma migrate deploy
        ↓
La migration s'applique sur la base de production
```

---

### Quand créer une migration ?

#### ✅ OBLIGATOIRE — Toujours migrer quand tu :

| Modification | Commande | Risque |
|---|---|---|
| Ajoutes un nouveau modèle | `migrate dev` | Aucun |
| Ajoutes un champ nullable | `migrate dev` | Aucun |
| Ajoutes un champ avec `@default` | `migrate dev` | Aucun |
| Renommes un champ | `migrate dev` | ⚠️ Voir note |
| Supprimes un champ | `migrate dev` | ⚠️ Perte de données |
| Modifies un type de champ | `migrate dev` | ⚠️ Voir note |
| Ajoutes une relation | `migrate dev` | Faible |
| Ajoutes un index | `migrate dev` | Aucun |

#### ❌ NE PAS MIGRER sans réfléchir quand tu :

- **Renommes un champ** → Prisma va `DROP COLUMN` + `ADD COLUMN` = perte de données ! Utilise `@map("ancien_nom")` pour garder le vrai nom SQL.
- **Changes le type d'un champ existant** avec des données → prévoir une migration en 2 étapes (ajouter nouveau champ, copier données, supprimer ancien).
- **Supprimes un modèle en production** avec des données existantes.

---

### Les 3 scénarios concrets pour Teralite

#### Scénario A — Ajout simple (Phase 1 à 4 : développement actif)

```bash
# 1. Tu modifies schema.prisma (ex: ajouter champ "whatsappConfirme" sur Client)
# 2. Lancer la migration
npx prisma migrate dev --name add_whatsapp_confirme_client

# Prisma crée : prisma/migrations/20250410120000_add_whatsapp_confirme_client/migration.sql
# Contenu généré automatiquement :
# ALTER TABLE "Client" ADD COLUMN "whatsappConfirme" BOOLEAN NOT NULL DEFAULT false;

# 3. Commiter les 2 fichiers ensemble
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: ajouter whatsappConfirme sur Client"
```

#### Scénario B — Modification risquée (renommage de champ)

```bash
# NE PAS FAIRE : renommer directement dans schema.prisma
# FAIRE : utiliser @map pour préserver le nom SQL

# Dans schema.prisma :
# AVANT : montantTotal Int
# APRÈS : montantTTC    Int  @map("montantTotal")
#
# Prisma ne touche pas à la colonne SQL, seulement l'alias Prisma
# Aucune perte de données

npx prisma migrate dev --name rename_montantTotal_to_montantTTC
```

#### Scénario C — Migration de production (déploiement Vercel)

```bash
# Dans le script de build Vercel (vercel.json ou package.json) :
# "build": "prisma migrate deploy && next build"
#
# migrate deploy (≠ migrate dev) :
# - Applique UNIQUEMENT les migrations déjà committées
# - Ne génère rien de nouveau
# - Sécurisé pour la production
# - Idempotent (peut être rejoué sans problème)
```

---

### Workflow Git recommandé

```
Phase de dev (local)
├── Modifier schema.prisma
├── npx prisma migrate dev --name <description>
├── npx prisma generate
├── Tester localement
└── git commit (schema.prisma + migrations/ + code ensemble)

Pull Request / Preview Vercel
└── migrate deploy s'exécute automatiquement sur la DB preview

Merge sur main → Production
└── migrate deploy s'exécute sur la DB production
```

---

### Nommage des migrations

Utiliser des noms descriptifs en snake_case :

```
init_schema_complet
add_paydunya_ref_commande
add_zone_livraison
add_config_commission
add_journal_activite
add_contenu_site_cms
add_temoignage_faq
rename_montant_to_montant_ttc
add_index_commande_statut
```

---

## Authentification (NextAuth.js)

```
POST /api/auth/signin       → Login
POST /api/auth/signout      → Logout
GET  /api/auth/session      → Session courante
```

Session contient : `{ user: { id, nom, email, role } }`

Middleware `middleware.ts` protège `/admin/*` → redirige vers `/api/auth/signin` si non authentifié.

Vérification du rôle dans chaque Route Handler :
```typescript
const session = await getServerSession(authOptions)
if (!session || session.user.role !== 'SUPER_ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

---

## Flux de paiement PayDunya

```
Client → /checkout
    ↓
POST /api/paiement/initier
    ↓ (server-side)
PayDunya API → retourne URL de paiement
    ↓
Redirect client → page PayDunya (OM/Wave/YAS)
    ↓
Client paie → PayDunya callback
    ↓
POST /api/webhooks/paydunya (vérification signature)
    ↓
Mise à jour statut commande → CONFIRMEE
    ↓
Notification WhatsApp client
    ↓
Redirect → /commandes/[id]/confirmation
```

---

## Flux de commission vendeur

```
Commande statut → LIVREE
    ↓
Calcul automatique (Server Action ou webhook)
    ↓
Commission créée avec statut EN_ATTENTE
    ↓
Fin de mois : recap par vendeur dans /admin/commissions
    ↓
Admin clique "Marquer comme payé"
    ↓
Commission → statut PAYEE + note + date
    ↓
Exportable PDF/Excel par vendeur et par période
```

---

## Performance et SEO

- `next/image` obligatoire pour toutes les images (compression auto WebP)
- ISR (Incremental Static Regeneration) sur les pages catalogue (`revalidate: 3600`)
- SSR pour les pages avec données temps réel (dashboard, commandes)
- Métadonnées OpenGraph sur toutes les pages publiques
- `sitemap.xml` et `robots.txt` générés dynamiquement
- Google Analytics via `@next/third-parties/google`

---

## Déploiement

| Environnement | Branche | Base de données | URL |
|---|---|---|---|
| Local | n/a | PostgreSQL local | localhost:3000 |
| Preview | feature/* | DB Preview Supabase | \*.vercel.app |
| Production | main | DB Production Supabase | teralite.sn |

`vercel.json` :
```json
{
  "buildCommand": "prisma migrate deploy && next build",
  "outputDirectory": ".next"
}
```
