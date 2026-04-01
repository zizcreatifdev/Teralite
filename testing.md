# testing.md — Teralite Web Platform

> Stratégie de tests complète — priorité mobile Android, paiement, sécurité.

---

## Vue d'ensemble

| Type | Outil | Couverture cible | Quand |
|---|---|---|---|
| Unitaire | Jest + Testing Library | 80% fonctions critiques | À chaque commit |
| Intégration | Jest + Prisma test DB | Flux complets | Avant chaque merge |
| End-to-end | Playwright | Parcours utilisateurs clés | Avant déploiement prod |
| Performance | Lighthouse CI | PageSpeed ≥ 80 mobile | Avant mise en prod |
| Manuel mobile | Chrome DevTools + vrai Android | Responsive + PWA | Fin de chaque phase |

---

## Configuration Jest

```typescript
// jest.config.ts
import type { Config } from 'jest'
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterFramework: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    'app/api/**/*.ts',
    '!**/*.d.ts',
  ],
}
export default config
```

```typescript
// tests/setup.ts
import { prisma } from '@/lib/prisma'

beforeEach(async () => {
  // Nettoyer la DB de test entre chaque test
  await prisma.$transaction([
    prisma.commission.deleteMany(),
    prisma.ligneCommande.deleteMany(),
    prisma.commande.deleteMany(),
    prisma.produit.deleteMany(),
    prisma.utilisateur.deleteMany(),
  ])
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

---

## Tests unitaires — Fonctions critiques

### 1. Calcul des commissions

```typescript
// tests/unit/commission.test.ts
import { calculerCommission } from '@/lib/commission'

describe('calculerCommission', () => {
  it('calcule correctement avec taux uniquement (5%)', () => {
    const config = { taux: 5, montantFixe: null }
    expect(calculerCommission(10000, config)).toBe(500)
  })

  it('calcule correctement avec montant fixe uniquement (500 FCFA)', () => {
    const config = { taux: null, montantFixe: 500 }
    expect(calculerCommission(10000, config)).toBe(500)
  })

  it('calcule correctement avec taux + montant fixe', () => {
    const config = { taux: 5, montantFixe: 500 }
    expect(calculerCommission(10000, config)).toBe(1000) // 500 + 500
  })

  it('retourne 0 si commande annulée', () => {
    expect(calculerCommission(10000, { taux: 5, montantFixe: null }, true)).toBe(0)
  })

  it('retourne 0 si montant commande = 0', () => {
    expect(calculerCommission(0, { taux: 5, montantFixe: 500 })).toBe(0)
  })
})
```

### 2. Formatage des montants

```typescript
// tests/unit/utils.test.ts
import { formatFCFA, formatNumeroCommande, formatNumeroDevis } from '@/lib/utils'

describe('formatFCFA', () => {
  it('formate correctement', () => {
    expect(formatFCFA(4500)).toBe('4 500 F')
    expect(formatFCFA(1234567)).toBe('1 234 567 F')
    expect(formatFCFA(0)).toBe('0 F')
  })
})

describe('formatNumeroCommande', () => {
  it('padde avec des zéros', () => {
    expect(formatNumeroCommande(1)).toBe('#0001')
    expect(formatNumeroCommande(847)).toBe('#0847')
    expect(formatNumeroCommande(10000)).toBe('#10000') // pas de troncature
  })
})
```

### 3. Validation des codes promo

```typescript
// tests/unit/promo.test.ts
import { validerCodePromo } from '@/lib/promo'

describe('validerCodePromo', () => {
  it('rejette un code expiré', async () => {
    const code = { expiration: new Date('2020-01-01'), usageMax: null, usageActuel: 0, actif: true }
    await expect(validerCodePromo(code)).rejects.toThrow('Code expiré')
  })

  it('rejette un code dépassant l usage max', async () => {
    const code = { expiration: null, usageMax: 10, usageActuel: 10, actif: true }
    await expect(validerCodePromo(code)).rejects.toThrow('Quota atteint')
  })

  it('rejette un code inactif', async () => {
    const code = { expiration: null, usageMax: null, usageActuel: 0, actif: false }
    await expect(validerCodePromo(code)).rejects.toThrow('Code inactif')
  })
})
```

---

## Tests d'intégration — Flux API

### 1. Création de commande

```typescript
// tests/integration/commande.test.ts
import { POST } from '@/app/api/commandes/route'

describe('POST /api/commandes', () => {
  it('crée une commande avec paiement cash', async () => {
    const produit = await prisma.produit.create({ data: { /* ... */ } })
    const client = await prisma.client.create({ data: { /* ... */ } })

    const req = new Request('http://localhost/api/commandes', {
      method: 'POST',
      body: JSON.stringify({
        clientId: client.id,
        typePaiement: 'CASH',
        lignes: [{ produitId: produit.id, quantite: 2 }],
      }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.statut).toBe('EN_ATTENTE_PAIEMENT') // cash = attente
    expect(data.montantTotal).toBe(produit.prixPublic * 2)
  })

  it('refuse si stock insuffisant', async () => {
    const produit = await prisma.produit.create({
      data: { stock: 1, /* ... */ }
    })

    const req = new Request('http://localhost/api/commandes', {
      method: 'POST',
      body: JSON.stringify({
        lignes: [{ produitId: produit.id, quantite: 5 }],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

### 2. Webhook PayDunya

```typescript
// tests/integration/webhook-paydunya.test.ts
describe('POST /api/webhooks/paydunya', () => {
  it('confirme la commande après paiement validé', async () => {
    // Setup commande en statut RECUE
    const commande = await prisma.commande.create({
      data: { statut: 'RECUE', typePaiement: 'ORANGE_MONEY', /* ... */ }
    })

    const req = new Request('http://localhost/api/webhooks/paydunya', {
      method: 'POST',
      body: JSON.stringify({
        status: 'completed',
        custom_data: { commandeId: commande.id },
        hash: 'valid-hash', // signature PayDunya
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const updated = await prisma.commande.findUnique({ where: { id: commande.id } })
    expect(updated?.statut).toBe('CONFIRMEE')
  })

  it('ignore un webhook avec signature invalide', async () => {
    const req = new Request('http://localhost/api/webhooks/paydunya', {
      method: 'POST',
      body: JSON.stringify({ hash: 'invalid-hash' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
```

---

## Tests E2E — Playwright

### Installation

```bash
npm install -D @playwright/test
npx playwright install chromium  # suffisant pour les tests
```

### Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 390, height: 844 }, // iPhone 14 — mobile-first
  },
  projects: [
    { name: 'Mobile Chrome', use: { ...devices['Pixel 7'] } },
    { name: 'Desktop Chrome', use: { viewport: { width: 1280, height: 720 } } },
  ],
})
```

### Parcours critiques

```typescript
// tests/e2e/achat-complet.spec.ts
import { test, expect } from '@playwright/test'

test('parcours achat complet mobile', async ({ page }) => {
  // 1. Accueil → Catalogue
  await page.goto('/')
  await page.click('text=Voir tout le catalogue')
  await expect(page).toHaveURL('/produits')

  // 2. Fiche produit → Panier
  await page.click('text=Ampoule LED E27')
  await expect(page).toHaveURL(/\/produits\/ampoule-led-e27/)
  await page.click('text=Ajouter au panier')
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1')

  // 3. Panier → Checkout
  await page.click('[data-testid="cart-icon"]')
  await page.click('text=Passer la commande')
  await expect(page).toHaveURL('/checkout')

  // 4. Checkout → Choix paiement cash
  await page.fill('[name="nom"]', 'Moussa Diallo')
  await page.fill('[name="telephone"]', '771234567')
  await page.click('[data-testid="paiement-cash"]')
  await page.click('text=Confirmer la commande')

  // 5. Page de confirmation
  await expect(page).toHaveURL(/\/commandes\/.*\/confirmation/)
  await expect(page.locator('h1')).toContainText('Commande confirmée')
})
```

```typescript
// tests/e2e/admin-login.spec.ts
test('connexion admin et accès dashboard', async ({ page }) => {
  await page.goto('/admin')

  // Redirect vers login si non connecté
  await expect(page).toHaveURL(/signin/)

  // Login
  await page.fill('[name="email"]', 'admin@teralite.sn')
  await page.fill('[name="password"]', 'password-test')
  await page.click('[type="submit"]')

  // Accès dashboard
  await expect(page).toHaveURL('/admin')
  await expect(page.locator('h1')).toContainText('Tableau de bord')
})
```

```typescript
// tests/e2e/devis.spec.ts
test('formulaire devis site public', async ({ page }) => {
  await page.goto('/devis')

  await page.fill('[name="nom"]', 'Société ABC')
  await page.fill('[name="telephone"]', '338001234')
  await page.selectOption('[name="besoin"]', 'Bureau / commerce')
  await page.fill('[name="message"]', '15 unités pour nos bureaux')
  await page.click('[type="submit"]')

  // Confirmation
  await expect(page.locator('[data-testid="devis-confirmation"]')).toBeVisible()
})
```

---

## Tests Performance — Lighthouse CI

```bash
# Installation
npm install -D @lhci/cli

# .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000", "http://localhost:3000/produits"],
      "numberOfRuns": 3,
      "settings": { "emulatedFormFactor": "mobile" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.80 }],
        "categories:accessibility": ["warn", { "minScore": 0.90 }],
        "categories:seo": ["error", { "minScore": 0.90 }]
      }
    }
  }
}
```

---

## Tests manuels — Checklist mobile Android

À faire sur un vrai appareil Android (ou Chrome DevTools Pixel 7) à la fin de chaque phase :

### Site public
- [ ] Accueil : hero visible, CTA cliquables, images chargées
- [ ] Catalogue : grille produits responsive, filtres fonctionnels
- [ ] Fiche produit : photos, quantité, bouton panier
- [ ] Panier : ajout/suppression, total correct
- [ ] Checkout : formulaire complet sans overflow horizontal
- [ ] Formulaire devis : tous les champs accessibles au clavier virtuel
- [ ] Navigation mobile : menu hamburger si besoin
- [ ] Footer : tous les liens fonctionnels
- [ ] PWA : "Ajouter à l'écran d'accueil" disponible sur Chrome Android

### Dashboard admin
- [ ] Login : formulaire fonctionnel
- [ ] Sidebar : affichage adapté (collapsed sur mobile)
- [ ] Tableaux : scroll horizontal si nécessaire
- [ ] Formulaire produit : upload photos fonctionnel
- [ ] Génération PDF : téléchargement sur mobile

### PayDunya (mode test)
- [ ] Bouton Orange Money → redirect vers page OM
- [ ] Bouton Wave → QR code ou lien de paiement
- [ ] Retour après paiement → page de confirmation
- [ ] Webhook reçu → statut commande mis à jour

---

## Commandes de test

```bash
npm run test                    # Jest unitaire + intégration
npm run test:coverage           # Avec rapport de couverture
npm run test:e2e                # Playwright (serveur doit tourner)
npm run test:e2e:ui             # Playwright avec interface visuelle
npm run lighthouse              # Lighthouse CI (serveur doit tourner)
```

---

## Variables d'environnement pour les tests

```env
# .env.test
DATABASE_URL="postgresql://localhost:5432/teralite_test"
NEXTAUTH_SECRET="test-secret-local"
NEXTAUTH_URL="http://localhost:3000"
PAYDUNYA_MODE="test"
```
