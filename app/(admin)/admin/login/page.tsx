'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const passwordChanged = searchParams.get('changed') === 'true'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect.')
      } else {
        router.push('/admin')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-teralite flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-4 shadow-lg">
            <span className="text-blue-teralite font-bold text-xl">T</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Teralite Admin</h1>
          <p className="text-white/60 text-sm mt-1">Connectez-vous à votre espace</p>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {passwordChanged && (
            <div className="bg-green-light border border-green-teralite/30 rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-teralite mt-1.5 flex-shrink-0" />
              <p className="text-sm text-green-teralite">
                Mot de passe mis à jour. Connectez-vous avec vos nouveaux identifiants.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-light border border-red-teralite/30 rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-red-teralite mt-1.5 flex-shrink-0" />
              <p className="text-sm text-red-teralite">{error}</p>
            </div>
          )}

          <div className="mb-5">
            <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
              Adresse e-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@teralite.sn"
              className="w-full border border-border-main rounded-lg px-3 py-2.5 text-sm text-text-main
                         focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite
                         placeholder:text-text-light transition-colors"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-blue-teralite uppercase tracking-wider mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-border-main rounded-lg px-3 py-2.5 pr-10 text-sm text-text-main
                           focus:outline-none focus:ring-2 focus:ring-blue-teralite/30 focus:border-blue-teralite
                           placeholder:text-text-light transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-mid transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-teralite hover:bg-blue-dark text-white text-sm font-medium py-2.5 rounded-lg
                       transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-white/40 text-xs mt-6">
          © {new Date().getFullYear()} Teralite — La lumière qui pense pour vous
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
