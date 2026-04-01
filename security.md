# security.md — Teralite Web Platform

> Règles de sécurité non négociables.
> Chaque point doit être respecté avant la mise en production.

---

## 1. Authentification — NextAuth.js

### Configuration

```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const user = await prisma.utilisateur.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.actif) return null

        const valid = await bcrypt.compare(credentials.password, user.motDePasse)
        if (!valid) return null

        return { id: user.id, nom: user.nom, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.nom = user.nom
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.nom = token.nom as string
      return session
    },
  },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8 heures
  pages: { signIn: '/admin/login' },
  secret: process.env.NEXTAUTH_SECRET,
}
```

### Middleware de protection

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Routes Super Admin uniquement
    const superAdminRoutes = ['/admin/utilisateurs', '/admin/parametres']
    if (superAdminRoutes.some(r => pathname.startsWith(r))) {
      if (token?.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin?error=unauthorized', req.url))
      }
    }

    // Routes Admin + Super Admin
    const adminRoutes = ['/admin/comptabilite', '/admin/commissions', '/admin/promotions']
    if (adminRoutes.some(r => pathname.startsWith(r))) {
      if (!['SUPER_ADMIN', 'ADMIN'].includes(token?.role as string)) {
        return NextResponse.redirect(new URL('/admin?error=unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/admin/:path*'],
}
```

---

## 2. Mots de passe

### Hashage lors de la création

```typescript
// Toujours utiliser bcrypt avec coût 12
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 12

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, BCRYPT_ROUNDS)

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash)
```

### Règles de mot de passe

- Minimum 8 caractères
- Au moins 1 majuscule, 1 chiffre
- Validation côté serveur avec Zod (jamais seulement côté client)

```typescript
import { z } from 'zod'

const motDePasseSchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[0-9]/, 'Au moins un chiffre')
```

---

## 3. Validation des entrées — Zod

**Règle absolue : valider TOUTES les entrées côté serveur.**

```typescript
// Exemple : création d'un produit
import { z } from 'zod'

const createProduitSchema = z.object({
  nom: z.string().min(2).max(200).trim(),
  reference: z.string().min(2).max(50).trim().toUpperCase(),
  categorie: z.enum(['AMPOULES', 'PLAFONNIERS', 'SOLAIRE', 'ACCESSOIRES']),
  prixPublic: z.number().int().positive().optional(),
  stock: z.number().int().min(0),
  seuilAlerte: z.number().int().min(0),
  statut: z.enum(['DISPONIBLE', 'RUPTURE', 'BIENTOT']),
})

// Dans le Route Handler
export async function POST(req: Request) {
  const body = await req.json()
  const parsed = createProduitSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  // Utiliser parsed.data (typé et nettoyé)
}
```

---

## 4. Protection des routes API

**Vérifier session ET rôle dans chaque Route Handler :**

```typescript
// Helper réutilisable
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function requireRole(roles: string[]) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  if (!roles.includes(session.user.role)) {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }

  return { session }
}

// Utilisation dans un Route Handler
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['SUPER_ADMIN', 'ADMIN'])
  if (error) return error

  // Logique métier...
}
```

---

## 5. Sécurité PayDunya

### Vérification des webhooks

```typescript
// app/api/webhooks/paydunya/route.ts
import crypto from 'crypto'

function verifyPaydunyaSignature(body: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.PAYDUNYA_MASTER_KEY!)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  )
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-paydunya-signature') || ''

  if (!verifyPaydunyaSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
  }

  const data = JSON.parse(rawBody)
  // Traiter le paiement...
}
```

### Règles PayDunya

- Clés API uniquement dans les variables d'environnement
- Appels PayDunya uniquement côté serveur (`app/api/`)
- Toujours vérifier la signature du webhook
- Toujours re-vérifier le montant avec la commande en base (ne pas faire confiance au montant reçu dans le webhook)
- Idempotence : vérifier si la commande est déjà confirmée avant de la reconfirmer

---

## 6. Rate Limiting — Formulaires publics

```typescript
// lib/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  req: NextRequest,
  limit = 5,
  windowMs = 60_000 // 1 minute
): NextResponse | null {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return null
  }

  entry.count++
  if (entry.count > limit) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans 1 minute.' },
      { status: 429 }
    )
  }

  return null
}

// Appliquer sur les formulaires publics :
// POST /api/devis → 5 requêtes / minute
// POST /api/contact → 3 requêtes / minute
// POST /api/auth/signin → 5 tentatives / 15 minutes
```

---

## 7. Variables d'environnement

### Règles

- Jamais commiter `.env` ou `.env.local` (dans `.gitignore`)
- Toujours utiliser `.env.example` (sans valeurs réelles) comme documentation
- Jamais préfixer `NEXT_PUBLIC_` les clés secrètes
- Rotation des clés si compromission suspectée

```bash
# .gitignore — vérifier que ces lignes existent
.env
.env.local
.env.production
.env*.local
```

### Validation au démarrage

```typescript
// lib/env.ts — Vérifier au startup que les variables critiques existent
const required = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'PAYDUNYA_MASTER_KEY',
  'PAYDUNYA_PRIVATE_KEY',
  'PAYDUNYA_TOKEN',
]

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variable d'environnement manquante : ${key}`)
  }
}
```

---

## 8. Sécurité base de données

### Connexion

```typescript
// lib/prisma.ts — Singleton pour éviter les connexions multiples
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Règles Prisma

- Toujours utiliser les méthodes Prisma (jamais `$queryRawUnsafe` avec des entrées utilisateur)
- Si `$queryRaw` nécessaire : utiliser les tagged templates Prisma (protection SQL injection automatique)

```typescript
// ✅ Sécurisé
const result = await prisma.$queryRaw`SELECT * FROM "Commande" WHERE id = ${id}`

// ❌ Dangereux
const result = await prisma.$queryRawUnsafe(`SELECT * FROM "Commande" WHERE id = '${id}'`)
```

---

## 9. Headers de sécurité HTTP

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://app.paydunya.com",
    ].join('; '),
  },
]

const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}
```

---

## 10. Upload de fichiers (photos produits)

```typescript
// Limites et validation pour l'upload
const UPLOAD_CONFIG = {
  maxSizeBytes: 5 * 1024 * 1024,  // 5 MB max
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxPhotosParProduit: 5,
}

async function validateUpload(file: File): Promise<void> {
  if (file.size > UPLOAD_CONFIG.maxSizeBytes) {
    throw new Error('Fichier trop volumineux (max 5 MB)')
  }
  if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    throw new Error('Format non autorisé. Utiliser JPEG, PNG ou WebP.')
  }
  // Vérifier l'extension vs le content-type (éviter l'usurpation)
  const ext = file.name.split('.').pop()?.toLowerCase()
  const allowedExt = ['jpg', 'jpeg', 'png', 'webp']
  if (!ext || !allowedExt.includes(ext)) {
    throw new Error('Extension de fichier non autorisée')
  }
}
```

---

## 11. Sauvegardes

- Sauvegarde automatique quotidienne : configurée sur Supabase/Railway
- Rétention : 30 jours
- Sauvegarde manuelle : bouton dans `/admin/parametres` → export SQL
- Tester la restauration au moins une fois avant la mise en production

---

## Checklist avant mise en production

### Auth & Accès
- [ ] `NEXTAUTH_SECRET` est une clé forte et aléatoire (min 32 chars)
- [ ] Toutes les routes `/admin/*` protégées par le middleware
- [ ] Vérification de rôle dans chaque Route Handler sensible
- [ ] Mots de passe hashés avec bcrypt (coût 12)

### Données
- [ ] Validation Zod sur toutes les routes POST/PUT/PATCH
- [ ] Aucun `queryRawUnsafe` avec entrées utilisateur
- [ ] Upload fichiers : type + taille validés

### Paiement
- [ ] `PAYDUNYA_MODE=production` en production
- [ ] Vérification signature webhook active
- [ ] Clés PayDunya dans les variables d'environnement uniquement

### Infrastructure
- [ ] HTTPS actif (automatique sur Vercel)
- [ ] Headers de sécurité configurés dans `next.config.ts`
- [ ] `.env` dans `.gitignore`
- [ ] Rate limiting actif sur les formulaires publics
- [ ] Sauvegardes automatiques configurées et testées

### Monitoring
- [ ] Logs d'erreur configurés (Vercel logs ou Sentry)
- [ ] Journal d'activité admin actif (`JournalActivite`)
