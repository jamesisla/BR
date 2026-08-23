import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Search, User } from 'lucide-react'
import { useCart, formatImageUrl } from '../context/CartContext'

export default function Navbar() {
  const { totalItems, setIsCartOpen, setIsSearchOpen, config, categories } = useCart()
  const logoUrl = formatImageUrl(config?.logo_url)

  return (
    <header className="sticky top-0 z-40 w-full transition-all">
      {/* Announcement Bar */}
      {config?.announcement_active !== false && config?.announcement_bar && (
        <div 
          className="text-white text-[10px] sm:text-xs font-bold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-sm"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <span>{config.announcement_bar}</span>
        </div>
      )}

      <div className="bg-white/95 backdrop-blur-md border-b border-black/5">
        <div className="container flex items-center justify-between py-3.5 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors p-2 rounded-full hover:bg-slate-100/70"
              aria-label="Buscar"
            >
              <Search size={20} />
              <span className="text-[11px] uppercase font-bold tracking-wider hidden md:inline">Buscar</span>
            </button>
          </div>
          
          <Link to="/" className="text-decoration-none flex-1 text-center max-w-[60%] sm:max-w-none">
            <div className="flex items-center gap-2.5 justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt={config?.name || 'Logo'} className="h-8 sm:h-10 w-auto object-contain max-w-[120px]" />
              ) : null}
              <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate" style={{ color: 'var(--primary)' }}>
                {config?.name || 'TIENDA DEMO'}
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/admin" className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-full hover:bg-slate-100 hidden sm:flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
              <User size={18} />
              <span className="hidden md:inline">Admin</span>
            </Link>

            <div 
              onClick={() => setIsCartOpen(true)}
              className="relative cursor-pointer p-2 hover:bg-slate-100/70 rounded-full transition-colors"
            >
              <ShoppingBag size={22} style={{ color: 'var(--primary)' }} />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-md" style={{ background: 'var(--secondary)' }}>
                  {totalItems}
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex justify-center border-t border-black/5 bg-white/60">
          <div className="flex overflow-x-auto py-1 px-4 no-scrollbar gap-2 sm:gap-4">
            <Link to="/" className="nav-link whitespace-nowrap !py-2.5 !px-3 sm:!px-6">Inicio</Link>
            <a href="/#productos" className="nav-link whitespace-nowrap !py-2.5 !px-3 sm:!px-6">Catálogo</a>
            {categories && categories.length > 0 ? (
              categories.map(cat => (
                <Link key={cat.id} to={`/category/${cat.slug}`} className="nav-link whitespace-nowrap !py-2.5 !px-3 sm:!px-6 capitalize">
                  {cat.name}
                </Link>
              ))
            ) : (
              <>
                <Link to="/category/accesorios" className="nav-link whitespace-nowrap !py-2.5 !px-3 sm:!px-6">Accesorios</Link>
                <Link to="/category/hogar" className="nav-link whitespace-nowrap !py-2.5 !px-3 sm:!px-6">Hogar</Link>
                <Link to="/category/cafes" className="nav-link whitespace-nowrap !py-2.5 !px-3 sm:!px-6">Cafés</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
