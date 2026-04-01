import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Vérifie que l'utilisateur est connecté (withAuth s'en charge déjà)
    // Ici on peut ajouter des vérifications de rôle supplémentaires si besoin
    if (pathname.startsWith('/admin') && !token) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // La page login est toujours accessible
        if (req.nextUrl.pathname === '/admin/login') return true
        // Toutes les autres routes /admin/* nécessitent un token valide
        if (req.nextUrl.pathname.startsWith('/admin')) return !!token
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*'],
}
