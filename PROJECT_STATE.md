# PROJECT_STATE.md

## Phase actuelle : 5b — Commissions & équipe ✅ COMPLÉTÉE

## Dernière action : Phase 5b complétée le 2026-04-05

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

## Prochaine étape : Phase 6 — Tests, optimisation PageSpeed 80+, mise en production teralite.sn

## Variables d'environnement : Configurées sur Vercel ✅
## URL de déploiement : https://teralite.vercel.app
## Base de données : Supabase — migration SQL appliquée ✅

## Compte Super Admin
- Email : admin@teralite.sn
- Password : Teralite2025!
