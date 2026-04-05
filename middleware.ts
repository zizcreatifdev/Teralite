import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Routes Super Admin uniquement
    const superAdminRoutes = ['/admin/utilisateurs', '/admin/parametres', '/admin/journal']
    if (superAdminRoutes.some((r) => pathname.startsWith(r))) {
      if (token?.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin?error=unauthorized', req.url))
      }
    }

    // Vue vendeur : accessible aux vendeurs (leurs propres commissions uniquement)
    if (pathname.startsWith('/admin/commissions/vendeur')) {
      if (!['SUPER_ADMIN', 'ADMIN', 'VENDEUR'].includes(token?.role as string)) {
        return NextResponse.redirect(new URL('/admin?error=unauthorized', req.url))
      }
      return NextResponse.next()
    }

    // Routes Admin + Super Admin uniquement
    const adminOnlyRoutes = ['/admin/comptabilite', '/admin/commissions', '/admin/promotions']
    if (adminOnlyRoutes.some((r) => pathname.startsWith(r))) {
      if (!['SUPER_ADMIN', 'ADMIN'].includes(token?.role as string)) {
        return NextResponse.redirect(new URL('/admin?error=unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // La page login est toujours accessible
        if (req.nextUrl.pathname === '/admin/login') return true
        // Toutes les autres routes /admin/* nécessitent un token valide
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*'],
}
