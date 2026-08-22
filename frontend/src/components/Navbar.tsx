import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Search, User, Menu } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { totalItems, setIsCartOpen, setIsSearchOpen, config } = useCart()

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-black/5 sticky top-0 z-40 w-full transition-all">
      <div className="container flex items-center justify-between py-5">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Buscar"
          >
            <Search size={19} />
            <span className="text-xs uppercase font-bold tracking-wider hidden md:inline">Buscar</span>
          </button>
        </div>
        
        <Link to="/" className="text-decoration-none">
          <div className="flex items-center gap-3 justify-center">
            {config?.logo_url ? (
              <img src={config.logo_url} alt={config.name} className="h-10 w-auto object-contain" />
            ) : null}
            <h1 className="font-serif text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--primary)', margin: 0 }}>
              {config?.name || 'TIENDA ARTISAN'}
            </h1>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/admin" className="text-slate-400 hover:text-slate-900 transition-colors hidden sm:flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
            <User size={18} />
            <span>Admin</span>
          </Link>

          <div 
            onClick={() => setIsCartOpen(true)}
            className="relative cursor-pointer p-2 hover:bg-slate-50 rounded-full transition-colors"
          >
            <ShoppingBag size={22} style={{ color: 'var(--primary)' }} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-md animate-scale" style={{ background: 'var(--secondary)' }}>
                {totalItems}
              </span>
            )}
          </div>
        </div>
      </div>

      <nav className="flex justify-center border-t border-black/5">
        <div className="flex overflow-x-auto py-1">
          <Link to="/" className="nav-link">Inicio</Link>
          <a href="/#productos" className="nav-link">Catálogo</a>
          <Link to="/category/accesorios" className="nav-link">Accesorios</Link>
          <Link to="/category/general" className="nav-link">Colección</Link>
        </div>
      </nav>
    </header>
  )
}
