
'use client'

import './globals.css'
import { useEffect, useState } from 'react'
import { Instagram, Facebook, Search, User, ShoppingBag, Menu } from 'lucide-react'
import Link from 'next/link'
import { CartProvider, useCart } from '../context/CartContext'
import CartDrawer from '../components/CartDrawer'
import SearchOverlay from '../components/SearchOverlay'

interface StoreConfig {
  name: string
  primary_color: string
  secondary_color: string
  footer_text: string
  logo_url?: string
}

function Header({ config }: { config: StoreConfig | null }) {
  const { totalItems, setIsCartOpen, setIsSearchOpen } = useCart()

  return (
    <header className="header-container">
      <div className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-6">
          <Menu size={20} className="lg:hidden cursor-pointer" />
          <Search 
            size={18} 
            className="cursor-pointer opacity-50 hover:opacity-100 transition-all" 
            onClick={() => setIsSearchOpen(true)} 
          />
        </div>
        
        <Link href="/" style={{ textDecoration: 'none' }}>
           <div className="flex items-center gap-4 justify-center">
              {config?.logo_url && (
                <img src={config.logo_url} alt={config.name} style={{ height: '60px', width: 'auto' }} />
              )}
              <h1 className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0, whiteSpace: 'nowrap' }}>
               {config?.name || 'TIENDA ARTISAN'}
              </h1>
           </div>
        </Link>

        <div className="flex items-center gap-6">
          <User size={20} className="hidden lg:block cursor-pointer opacity-50" />
          <div className="relative cursor-pointer" onClick={() => setIsCartOpen(true)}>
            <ShoppingBag size={22} />
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: -8, right: -8, background: 'var(--secondary)', color: 'white', fontSize: '10px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 800 }}>
                {totalItems}
              </span>
            )}
          </div>
        </div>
      </div>

      <nav className="flex justify-center" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex">
          <Link href="/category/cafes" className="nav-link">Cafés</Link>
          <Link href="/category/accesorios" className="nav-link">Accesorios</Link>
          <Link href="#" className="nav-link">Suscripción</Link>
          <Link href="#" className="nav-link" style={{ color: 'var(--secondary)' }}>Ofertas</Link>
        </div>
      </nav>
    </header>
  )
}

function Footer({ config }: { config: StoreConfig | null }) {
  return (
    <footer style={{ background: '#111', color: 'white', padding: '100px 0 50px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '50px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <h2 className="font-serif" style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Eleva tu ritual.</h2>
            <p style={{ opacity: 0.5, maxWidth: '400px', marginBottom: '30px' }}>Suscríbete para recibir noticias de nuestros microlotes y eventos exclusivos.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
               <input type="text" placeholder="Email" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px 20px', color: 'white', flex: 1 }} />
               <button className="btn-primary">Unirme</button>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.4, marginBottom: '30px' }}>Tienda</h4>
            <ul style={{ listStyle: 'none', fontSize: '13px', opacity: 0.7, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li>Nuestros Cafés</li>
              <li>Equipamiento</li>
              <li>Regalos</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.4, marginBottom: '30px' }}>Social</h4>
            <div style={{ display: 'flex', gap: '20px' }}>
               <Instagram size={20} />
               <Facebook size={20} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: '80px', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', opacity: 0.3, fontSize: '10px', letterSpacing: '0.1em' }}>
          {config?.footer_text || '© 2024 TIENDA ARTISAN. Crafted for purity.'}
        </div>
      </div>
    </footer>
  )
}

function MainLayout({ children, config }: { children: React.ReactNode, config: StoreConfig | null }) {
  const { isCartOpen, setIsCartOpen, isSearchOpen, setIsSearchOpen } = useCart()
  return (
    <>
      <Header config={config} />
      <main>
        {children}
      </main>
      <Footer config={config} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<StoreConfig | null>(null)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    fetch(`${apiUrl}/settings/`)
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error(err))
  }, [])

  useEffect(() => {
    if (config) {
      document.documentElement.style.setProperty('--primary', config.primary_color)
      document.documentElement.style.setProperty('--secondary', config.secondary_color)
    }
  }, [config])

  return (
    <html lang="es">
      <body suppressHydrationWarning={true}>
        <CartProvider>
          <MainLayout config={config}>{children}</MainLayout>
        </CartProvider>
      </body>
    </html>
  )
}
