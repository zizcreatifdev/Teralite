import { CartProvider } from '@/app/context/CartContext'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import { GoogleAnalytics } from '@next/third-parties/google'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </CartProvider>
  )
}
