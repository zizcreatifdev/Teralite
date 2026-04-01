import type { Metadata } from 'next'
import SessionProvider from '@/components/admin/SessionProvider'

export const metadata: Metadata = {
  title: {
    template: '%s | Admin Teralite',
    default: 'Dashboard | Admin Teralite',
  },
  robots: 'noindex, nofollow',
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
}
