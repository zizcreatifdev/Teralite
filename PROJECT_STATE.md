# PROJECT_STATE.md

## Phase actuelle : 6 — Tests, optimisation, mise en production ✅ COMPLÉTÉE

## Statut global : 🟢 PRÊT POUR PRODUCTION

## Dernière action : feat logos + hero image — 2026-04-06

### Post-prod : Logos + Hero image ✅
- ✅ Header site public → `next/image` avec `/logos/TeraLite_Logo-couleur.png`
- ✅ Sidebar admin → `next/image` avec `/logos/TeraLite_Logo-blanc.png`
- ✅ Hero homepage → image Unsplash éclairage + overlay `#002D50` 70% opacité
- ✅ `next.config.mjs` → `images.unsplash.com` ajouté aux remotePatterns
- ⚠️ Fichiers PNG à placer manuellement : `public/logos/TeraLite_Logo-couleur.png` + `TeraLite_Logo-blanc.png`

### Post-prod : Première connexion obligatoire ✅
- ✅ `premiereConnexion Boolean @default(true)` sur modèle `Utilisateur`
- ✅ `lib/auth.ts` : `premiereConnexion` inclus dans le JWT token
- ✅ `middleware.ts` : redirection vers `/admin/changer-mot-de-passe` si `premiereConnexion=true`
- ✅ `app/(admin)/admin/changer-mot-de-passe/page.tsx` — page dédiée (même style que login)
- ✅ `PATCH /api/admin/utilisateurs/changer-mot-de-passe` — update mot de passe + `premiereConnexion=false`, puis signOut
- ✅ Page login : banner vert « Mot de passe mis à jour » après `?changed=true`
- ✅ Migration SQL : `ALTER TABLE "Utilisateur" ADD COLUMN "premiereConnexion" BOOLEAN NOT NULL DEFAULT TRUE`
- ✅ Build : 0 erreur · tsc : 0 erreur TypeScript

## Ce qui est fait

### Phase 1 — Fondations (100%) ✅
- Next.js 14 + TypeScript strict + Tailwind + Prisma + NextAuth
- Schema 20 modèles, middleware auth, layouts admin/site

### Phase 2 — Site public vitrine (100%) ✅

#### Pages
- ✅ `/` — Accueil : hero, stats (-50%/25000h/IP65/paiements), produits vedettes (ISR 3600s), étapes, témoignages, formulaire devis rapide, logos paiement
- ✅ `/produits` — Catalogue : filtres par catégorie (client-side), grille responsive, badges statut, ISR
- ✅ `/produits/[slug]` — Fiche produit : galerie 5 photos, prix FCFA, sélecteur quantité, bouton panier/devis, specs techniques, produits similaires, ISR + generateStaticParams
- ✅ `/devis` — Formulaire devis complet : nom/tel/besoin/message, POST /api/devis, page de confirmation avec numéro
- ✅ `/suivi` — Suivi commande : recherche par numéro ou téléphone, historique des statuts
- ✅ `/a-propos` — Données depuis ContenuSite, valeurs, chiffres clés
- ✅ `/faq` — Accordion par catégories, données depuis table FAQ avec fallback
- ✅ `/contact` — Formulaire + WhatsApp + coordonnées + placeholder carte
- ✅ `/cgv` — Contenu statique complet (11 articles)

#### APIs
- ✅ `POST /api/devis` — Zod validation + rate limit 5/min + création Client+Devis en DB
- ✅ `GET /api/produits` — Filtres categorie/vedette/limit, cache 3600s
- ✅ `GET /api/produits/[slug]` — Fiche produit, cache 3600s
- ✅ `POST /api/contact` — Zod validation + rate limit 3/min
- ✅ `GET /api/commandes/suivi` — Recherche par numéro ou téléphone, rate limit 10/min

#### Composants créés
- `ProductCard`, `Badge` (produit/vedette), `CatalogueFilters`, `GaleriePhotos`
- `AjoutPanierSection`, `QuickDevisForm`, `DevisForm`, `ContactForm`
- `FaqAccordion`, `SuiviForm`, `ServiceWorkerRegister`

#### PWA
- ✅ `public/manifest.json` — nom: Teralite, theme_color: #004880
- ✅ `public/sw.js` — Service Worker : cache /produits + /, stratégie Cache First / Network First

#### SEO
- ✅ `app/sitemap.ts` — Pages statiques + slugs produits dynamiques
- ✅ `app/robots.ts` — Bloque /admin et /api/, indexe le reste
- ✅ Métadonnées OG + Twitter sur chaque page
- ✅ Google Fonts DM Sans + DM Mono via `<link>` dans layout.tsx
- ✅ `viewport` export séparé (themeColor #004880)

#### Sécurité
- ✅ `lib/rateLimit.ts` — Rate limiter en mémoire (par IP)
- ✅ Zod validation sur toutes les routes POST

#### Build
- ✅ `npm run build` — 19 routes générées, 0 erreur
- ✅ `npx tsc --noEmit` — 0 erreur TypeScript

### Phase 3 — E-commerce (100%) ✅

#### Panier
- ✅ `CartContext` — React Context + useReducer, persisté en localStorage (`teralite_cart`)
- ✅ `/panier` — Affichage articles, sélecteur zone livraison, code promo, totaux, CTA checkout

#### APIs nouvelles
- ✅ `GET /api/zones` — Liste des zones de livraison actives avec frais
- ✅ `POST /api/promo/valider` — Validation code promo (montant min, quota, dates)
- ✅ `POST /api/paiement/initier` — Création commande atomique ($transaction) + initiation PayDunya
- ✅ `POST /api/webhooks/paydunya` — Vérification HMAC-SHA256 + confirmation paiement + stock + commission
- ✅ `GET /api/commandes/[id]` — Détail commande (champs admin exclus)

#### Checkout
- ✅ `/checkout` — Formulaire client (nom, tel, adresse) + mode paiement (OM/Wave/YAS/Cash) + récapitulatif
- ✅ Redirection PayDunya pour paiements mobiles
- ✅ Cash → statut `EN_ATTENTE_PAIEMENT`, redirect confirmation directe

#### Confirmation & suivi
- ✅ `/commandes/[id]/confirmation` — Banner statut, récapitulatif complet, historique, CTAs WhatsApp/suivi

#### Libs créées
- ✅ `lib/paydunya.ts` — Client PayDunya server-side (sandbox/production), `initierPaiement`, `verifierPaiement`
- ✅ `lib/whatsapp.ts` — Notifications WhatsApp client + admin (graceful, non-bloquant)

#### Sécurité
- ✅ HMAC-SHA256 timing-safe sur webhook PayDunya
- ✅ Idempotence webhook (skip si déjà CONFIRMEE)
- ✅ Vérification montant ±10 FCFA
- ✅ `$transaction` Prisma pour atomicité stock/commande/recette/commission
- ✅ Middleware rôle SUPER_ADMIN / ADMIN étendu

#### Build
- ✅ `npm run build` — 27 routes générées, 0 erreur
- ✅ `npx tsc --noEmit` — 0 erreur TypeScript

### Phase 4a — Dashboard admin (100%) ✅

#### Dashboard `/admin`
- ✅ KPIs temps réel : commandes du mois, CA du jour, devis en attente, nouveaux clients
- ✅ Alertes : devis non traités +48h (orange), produits stock critique (rouge)
- ✅ `DashboardCharts` (recharts) : graphique ventes 7j/30j/3 mois (LineChart) + répartition paiements (PieChart donut)
- ✅ Tableaux : 5 dernières commandes + 4 derniers devis avec badges statut

#### Produits `/admin/produits`
- ✅ Liste avec photo miniature, référence, prix, stock, statut, vedette, badges
- ✅ Badge stock critique (rouge) si stock ≤ seuilAlerte
- ✅ Filtres : catégorie, statut, recherche texte, archivés
- ✅ Pagination 20/page
- ✅ `ArchiveBtnClient` — archive via FETCH (jamais de suppression)
- ✅ `/admin/produits/nouveau` + `/admin/produits/[id]/modifier`
- ✅ `ProduitForm` — formulaire complet : nom, ref, catégorie, descriptions, specs, prix, stock, statut, vedette
- ✅ Upload jusqu'à 5 photos : sélection photo principale, preview, suppression

#### Commandes `/admin/commandes`
- ✅ Liste avec filtres : statut, mode paiement, date début/fin, recherche
- ✅ Badges statut colorés selon design-system
- ✅ Pagination

#### Fiche commande `/admin/commandes/[id]`
- ✅ `CommandeDetail` — composant client interactif
- ✅ Détail produits commandés + totaux (sous-total, livraison, total)
- ✅ Changement de statut avec workflow autorisé (RECUE→CONFIRMEE→EN_PREPARATION→EXPEDIEE→LIVREE)
- ✅ Notes internes (sauvegarde AJAX)
- ✅ Bouton "Générer facture" → crée Facture en DB (PDF Phase 5)
- ✅ Bouton "Export Excel" → téléchargement CSV
- ✅ Bouton WhatsApp client
- ✅ Historique des statuts avec timeline

#### APIs créées
- ✅ `GET/POST /api/admin/produits`
- ✅ `GET/PUT /api/admin/produits/[id]`
- ✅ `PUT /api/admin/produits/[id]/archiver`
- ✅ `GET /api/admin/commandes`
- ✅ `GET/PUT /api/admin/commandes/[id]`
- ✅ `PUT /api/admin/commandes/[id]/statut` — transitions validées
- ✅ `POST /api/admin/commandes/[id]/facture` — crée enregistrement Facture
- ✅ `GET /api/admin/commandes/[id]/export` — export CSV
- ✅ `POST /api/admin/upload` — upload JPEG/PNG/WebP max 5MB

#### Build
- ✅ `npm run build` — 42 routes générées, 0 erreur
- ✅ `npx tsc --noEmit` — 0 erreur TypeScript

### Phase 4b — Dashboard admin complet (100%) ✅

#### Devis `/admin/devis`
- ✅ Liste avec filtres statut, badges NOUVEAU (orange)/EN_COURS/ENVOYE/ACCEPTE/REFUSE
- ✅ `/admin/devis/nouveau` — création avec sélection client existant ou nouveau + éditeur lignes
- ✅ `/admin/devis/[id]` — fiche interactive : éditeur lignes inline (désignation, produit, qté, prix, remise%, TVA)
- ✅ Calcul automatique : sousTotal = round(q × pu × (1 - remise/100)), totaux HT/TVA/TTC
- ✅ Changement statut avec transitions validées (NOUVEAU→EN_COURS/ENVOYE/REFUSE, etc.)
- ✅ Génération PDF — HTML + print styles, `window.open`, sans nouveau package
- ✅ Convertir en facture (POST `/convertir`) — génère FAC-YYYY-NNN, calcule montantHT/TVA/TTC

#### Clients `/admin/clients`
- ✅ Liste avec filtres type (PARTICULIER/ENTREPRISE/MUNICIPALITE), recherche, CSV export
- ✅ `/admin/clients/[id]` — fiche éditable : infos, notes, historique commandes + devis, total dépensé

#### CMS `/admin/contenu`
- ✅ `ContenuEditor` — 3 onglets : Général (hero, à propos, contact), Témoignages (CRUD + toggle + reorder), FAQ (CRUD par catégorie)
- ✅ Sauvegarde bulk via PUT `/api/admin/contenu` avec `{ cles: Record<string, string> }`
- ✅ Réordonnancement témoignages par boutons ↑↓ (swap ordre)

#### Promotions `/admin/promotions`
- ✅ Bannière promotionnelle : toggle actif/inactif, texte, couleur (color picker), aperçu live
- ✅ Codes promo : table CRUD (code, type, valeur, expiration, usages/max), toggle actif

#### Zones de livraison `/admin/parametres/zones`
- ✅ `ZonesManager` — table CRUD inline : nom, tarif FCFA, délai jours, toggle actif
- ✅ Protection suppression : alerte si zone liée à des commandes (409 depuis API)

#### APIs créées
- ✅ `GET/POST /api/admin/devis`
- ✅ `GET/PUT /api/admin/devis/[id]`
- ✅ `PUT /api/admin/devis/[id]/statut` — transitions validées
- ✅ `GET /api/admin/devis/[id]/pdf` — HTML imprimable
- ✅ `POST /api/admin/devis/[id]/convertir` — devis → facture
- ✅ `GET/POST /api/admin/clients`
- ✅ `GET/PUT /api/admin/clients/[id]`
- ✅ `GET /api/admin/clients/export` — CSV
- ✅ `GET/PUT /api/admin/contenu`
- ✅ `POST /api/admin/temoignages`
- ✅ `PUT/DELETE /api/admin/temoignages/[id]`
- ✅ `POST /api/admin/faq`
- ✅ `PUT/DELETE /api/admin/faq/[id]`
- ✅ `GET/POST /api/admin/promotions`
- ✅ `PUT/DELETE /api/admin/promotions/[id]`
- ✅ `GET/POST /api/admin/zones`
- ✅ `PUT/DELETE /api/admin/zones/[id]`

#### Build
- ✅ `npm run build` — 0 erreur
- ✅ `npx tsc --noEmit` — 0 erreur TypeScript

### Phase 5a — Comptabilité & finances (100%) ✅

#### `/admin/comptabilite`
- ✅ Sélecteur période : ce mois / mois dernier / trimestre / année / personnalisé
- ✅ 4 KPIs : CA, Dépenses, Bénéfice net, Marge %
- ✅ Graphique linéaire évolution 12 mois (Recettes / Dépenses / Bénéfice)
- ✅ Graphique barres Recettes vs Dépenses par mois
- ✅ Donut répartition dépenses par catégorie
- ✅ Onglet Recettes — table filtrée par mode paiement, total automatique
- ✅ Onglet Dépenses — CRUD manuel (catégorie/description/montant/date/justificatif URL), suppression
- ✅ Onglet Journal financier — chronologique avec solde cumulé, filtre recette/dépense
- ✅ Onglet Factures — liste avec PDF download individuel
- ✅ Export Excel (xlsx) toutes opérations de la période

#### Packages ajoutés
- ✅ `@react-pdf/renderer@4.3.3` — PDF factures branded
- ✅ `xlsx@0.18.5` — export Excel journal financier

#### `components/pdf/FacturePDF.tsx`
- ✅ Template PDF branded Teralite : logo texte, numéro FAC-YYYY-NNN, données entreprise depuis Parametres
- ✅ Tableau lignes (désignation, qté, prix unit., remise%, total HT)
- ✅ Totaux HT / TVA / TTC avec bloc bleu Teralite pour TTC
- ✅ Conditions de paiement, footer avec pagination
- ✅ Compatible commandes (lignes produits) et devis (lignes devis)

#### APIs créées
- ✅ `GET /api/admin/comptabilite/resume` — KPIs + évolution 12 mois + répartition dépenses
- ✅ `GET /api/admin/comptabilite/recettes` — liste filtrée par période + mode paiement
- ✅ `GET/POST /api/admin/comptabilite/depenses` — liste + création
- ✅ `PUT/DELETE /api/admin/comptabilite/depenses/[id]`
- ✅ `GET /api/admin/comptabilite/journal` — journal chronologique avec solde cumulé
- ✅ `GET /api/admin/comptabilite/export` — export XLSX du journal
- ✅ `GET /api/admin/factures` — liste toutes factures avec client et origine
- ✅ `GET /api/admin/factures/[id]/pdf` — PDF branded via @react-pdf/renderer

#### Build
- ✅ `npm run build` — 0 erreur
- ✅ `npx tsc --noEmit` — 0 erreur TypeScript

### Phase 5b — Commissions vendeurs & gestion équipe (100%) ✅

#### `/admin/commissions` (Admin + Super Admin)
- ✅ Section config : taux % et/ou montant fixe par commande, date d'effet, formulaire inline
- ✅ Sélecteur période (mois/année) + filtre par vendeur
- ✅ Récapitulatif par vendeur : nb ventes, CA généré, commission calculée, statuts badges
- ✅ Expand/collapse détail des commissions par commande
- ✅ Bouton "Payer" par vendeur → Modal avec ajustement montant + note de paiement
- ✅ Paiement bulk de toutes les commissions EN_ATTENTE/VALIDEE d'un vendeur

#### `/admin/commissions/vendeur` (Vendeur connecté — ses données uniquement)
- ✅ 4 KPIs : Mes ventes / CA généré / Commission du mois / En attente
- ✅ Table commissions du mois avec statuts
- ✅ Historique des paiements reçus avec notes
- ✅ Chargement dynamique par période (sélecteur mois/année)
- ✅ Aucune donnée des autres vendeurs ou finances globales

#### `/admin/utilisateurs` (Super Admin uniquement)
- ✅ Liste comptes groupés par rôle : Super Admin / Admin / Vendeur
- ✅ Formulaire création : nom, email, rôle (Admin/Vendeur), mot de passe (bcrypt)
- ✅ Toggle actif/inactif avec protection Super Admin (impossible à désactiver)
- ✅ Badges rôle colorés, compteur de commissions

#### Calcul & annulation automatique
- ✅ Webhook PayDunya (déjà en place) crée la commission lors de CONFIRMEE
- ✅ Route statut commande mise à jour : ANNULEE → annule commissions EN_ATTENTE liées
- ✅ Middleware mis à jour : `/admin/commissions/vendeur` accessible aux VENDEUR

#### APIs créées
- ✅ `GET /api/admin/commissions` — résumé par vendeur, regroupé
- ✅ `GET /api/admin/commissions/vendeur` — données propres au vendeur connecté
- ✅ `PUT /api/admin/commissions/[id]/payer` — marquer payé avec ajustement + note
- ✅ `GET/PUT /api/admin/commissions/config` — config taux + historique
- ✅ `GET/POST /api/admin/utilisateurs` — liste + création (bcrypt, validation rôle)
- ✅ `PUT /api/admin/utilisateurs/[id]` — modification
- ✅ `PUT /api/admin/utilisateurs/[id]/toggle` — activer/désactiver (protège SUPER_ADMIN)

#### Build
- ✅ `npm run build` — 0 erreur
- ✅ `npx tsc --noEmit` — 0 erreur TypeScript

#### Migration SQL
- ✅ Aucune migration nécessaire — tous les modèles (Commission, ConfigCommission, Utilisateur) existaient déjà dans le schema Phase 1

### Phase 5c — Paramètres système, journal d'activité, sidebar rôles (100%) ✅

#### `/admin/parametres` (Super Admin)
- ✅ Onglet Entreprise : nom, adresse, téléphone, email, NINEA, logo URL → PDF factures
- ✅ Onglet PayDunya : mode TEST/PRODUCTION avec confirmation, masquage des clés API
- ✅ Onglet Modèles PDF : couleur d'accent (color picker + aperçu live), footer, conditions générales
- ✅ Onglet Sauvegardes : info Supabase auto, sauvegarde manuelle, informations système

#### `/admin/journal` (Super Admin)
- ✅ Table chronologique de toutes les actions admin (50 par page, pagination)
- ✅ Filtres : par utilisateur, par type d'action
- ✅ Badges colorés par type d'action + rôle utilisateur

#### Logging `lib/journal.ts`
- ✅ Helper `logAction()` silencieux (ne bloque jamais l'action principale)
- ✅ Loggé : PRODUIT_CREE, COMMANDE_STATUT_CHANGE, COMMISSION_PAYEE, UTILISATEUR_CREE, UTILISATEUR_TOGGLE, PARAMETRES_MODIFIES

#### Sidebar dynamique par rôle
- ✅ VENDEUR : Tableau de bord, Produits, Commandes, Devis, Clients, Contenu site, Mes commissions
- ✅ ADMIN : + Commissions, Comptabilité, Promotions, Zones livraison
- ✅ SUPER_ADMIN : + Équipe, Paramètres, Journal activité
- ✅ Badge Shield pour Super Admin dans le footer sidebar
- ✅ Middleware mis à jour : /admin/journal → Super Admin uniquement

#### APIs créées
- ✅ `GET/PUT /api/admin/parametres` — lecture + upsert bulk
- ✅ `GET /api/admin/journal` — filtres utilisateur/action + pagination

#### Build
- ✅ `npm run build` — 0 erreur
- ✅ `npx tsc --noEmit` — 0 erreur TypeScript

### Phase 6 — Tests, optimisation, prêt pour production (100%) ✅

#### Sécurité complète
- ✅ Rate limiting : /api/devis (5/min), /api/contact (3/min), /api/commandes/suivi (10/min)
- ✅ Webhook PayDunya : vérification HMAC-SHA256 timing-safe
- ✅ Aucune clé API exposée côté client (PayDunya 100% server-side)
- ✅ Zod validation sur toutes les routes POST/PUT
- ✅ Middleware NextAuth protège toutes les routes /admin
- ✅ Rôles vérifiés dans chaque Route Handler (SUPER_ADMIN / ADMIN / VENDEUR)
- ✅ bcrypt cost 12 pour les mots de passe

#### Headers HTTP de sécurité (`next.config.mjs`)
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
- ✅ Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
- ✅ Content-Security-Policy: complet (GA, PayDunya, Google Fonts)
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ X-Powered-By supprimé (poweredByHeader: false)

#### Cache-Control
- ✅ /_next/static : public, max-age=31536000, immutable
- ✅ /_next/image : public, max-age=86400, must-revalidate
- ✅ /icons/ : public, max-age=604800, immutable
- ✅ /produits : public, max-age=60, stale-while-revalidate=600

#### Performance images
- ✅ next/image avec `fill` + `sizes` sur toutes les images produit
- ✅ `priority` sur l'image principale LCP (GaleriePhotos.tsx)
- ✅ Formats avif + webp dans next.config.mjs
- ✅ `compress: true` (gzip/brotli)

#### Google Analytics
- ✅ `@next/third-parties@16.2.2` installé
- ✅ GoogleAnalytics conditionnel sur NEXT_PUBLIC_GA_ID dans layout.tsx
- ✅ CSP mise à jour pour googletagmanager.com + google-analytics.com

#### Vercel / Déploiement
- ✅ `vercel.json` : `framework: nextjs` + buildCommand = `prisma generate && next build`
- ✅ Variables d'environnement configurées sur Vercel

#### Build final
- ✅ `npm run build` — toutes routes générées, 0 erreur de compilation
- ✅ `npx tsc --noEmit` — 0 erreur TypeScript

---

## Récapitulatif complet du projet

| Phase | Contenu | Statut |
|-------|---------|--------|
| 1 | Fondations (Next.js, Prisma, NextAuth, middleware) | ✅ |
| 2 | Site public (accueil, catalogue, fiches, SEO, PWA) | ✅ |
| 3 | E-commerce (panier, checkout, PayDunya, suivi) | ✅ |
| 4a | Dashboard admin (produits, commandes) | ✅ |
| 4b | Dashboard admin (devis, clients, CMS, promos, zones) | ✅ |
| 5a | Comptabilité & finances (PDF, Excel) | ✅ |
| 5b | Commissions vendeurs & gestion équipe | ✅ |
| 5c | Paramètres système, journal, sidebar rôles | ✅ |
| 6 | Tests, optimisation, sécurité, production | ✅ |

---

## Variables d'environnement : Configurées sur Vercel ✅
## URL de déploiement : https://teralite.vercel.app
## Base de données : Supabase — migration SQL appliquée ✅

## Compte Super Admin
- Email : admin@teralite.sn
- Password : Teralite2025!
