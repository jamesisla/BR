import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MessageCircle, ShieldCheck, Truck, Sparkles, Images, ArrowRight, Tag } from 'lucide-react'
import { useCart, formatCLP, formatImageUrl } from '../context/CartContext'

interface Product {
  id: string
  name: string
  description: string
  base_price: number
  slug: string
  image_url?: string
  images?: string[]
  stock: number
  category?: string
}

export default function HomePage() {
  const { config, categories } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const heroImage = formatImageUrl(config?.hero_image_url) || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2000&auto=format&fit=crop"
  const rawNumber = config?.whatsapp_number || '+56912345678'
  const phone = rawNumber.replace(/[^0-9]/g, '')
  const heroSize = config?.hero_size || 'half'

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => (p.category || 'general').toLowerCase() === selectedCategory.toLowerCase())

  // Dynamic Hero Height styles
  const heroHeightClasses = 
    heroSize === 'compact' ? 'h-[24vh] sm:h-[30vh] min-h-[180px] max-h-[290px]' :
    heroSize === 'full' ? 'min-h-[75vh] sm:min-h-[85vh]' :
    'h-[38vh] sm:h-[46vh] min-h-[260px] max-h-[440px]' // default 'half'

  const heroPadding = 
    heroSize === 'compact' ? 'py-4 sm:py-6' :
    heroSize === 'full' ? 'py-16 sm:py-24' :
    'py-6 sm:py-10' // 'half'

  return (
    <div>
      {/* Hero Section (if not hidden) */}
      {heroSize !== 'hidden' && (
        <section className={`hero-section ${heroHeightClasses} flex items-center justify-center relative overflow-hidden bg-black transition-all duration-300`}>
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img 
              src={heroImage} 
              alt={config?.name || "Hero Banner"}
              className="w-full h-full object-cover object-center opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`hero-content relative z-10 text-center px-4 ${heroPadding} max-w-4xl mx-auto`}
          >
            <span className="hero-subtitle text-[10px] sm:text-xs tracking-widest text-emerald-400 font-extrabold uppercase mb-1 block">
              {config?.name || 'TIENDA'} • Catálogo Digital
            </span>
            <h2 className={`font-serif ${heroSize === 'compact' ? 'text-xl sm:text-3xl mb-1.5' : heroSize === 'full' ? 'text-3xl sm:text-5xl md:text-6xl mb-4' : 'text-2xl sm:text-4xl md:text-5xl mb-2'} font-bold text-white leading-tight`}>
              {config?.hero_title || 'Emprende con Estilo'}
            </h2>
            <p className={`opacity-90 ${heroSize === 'compact' ? 'text-[11px] sm:text-xs mb-3 line-clamp-1' : 'text-xs sm:text-sm mb-4 sm:mb-5 line-clamp-2'} max-w-lg mx-auto text-slate-200 leading-relaxed`}>
              {config?.hero_subtitle || 'Descubre nuestra selección exclusiva. Haz tus pedidos de forma rápida y directa por WhatsApp.'}
            </p>
            <div className="flex flex-wrap gap-2.5 justify-center items-center">
              <a href="#productos" className="btn-primary py-2 sm:py-2.5 px-4 sm:px-5 text-xs rounded-xl shadow-lg">
                Ver Catálogo
              </a>
              <a 
                href={`https://wa.me/${phone}?text=${encodeURIComponent('¡Hola! Quisiera hacer una consulta sobre los productos de la tienda.')}`}
                target="_blank" 
                rel="noreferrer"
                className="py-2 sm:py-2.5 px-3.5 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
              >
                <MessageCircle size={15} /> WhatsApp
              </a>
            </div>
          </motion.div>
        </section>
      )}

      {/* Trust Badges */}
      <section className="bg-white border-b border-slate-100 py-4 sm:py-5">
        <div className="container px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
             <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-700">
                <Truck size={18} className="text-secondary flex-shrink-0" style={{ color: 'var(--secondary)' }} />
                <span className="text-[11px] sm:text-xs font-bold">Envíos a todo Chile</span>
             </div>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-700">
                <MessageCircle size={18} className="text-emerald-600 flex-shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold">Atención por WhatsApp</span>
             </div>
             <div className="col-span-2 sm:col-span-1 flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-700">
                <ShieldCheck size={18} className="text-secondary flex-shrink-0" style={{ color: 'var(--secondary)' }} />
                <span className="text-[11px] sm:text-xs font-bold">Pago seguro vía Transferencia</span>
             </div>
          </div>
        </div>
      </section>

      {/* Category Pills & Quick Filter Bar */}
      {categories && categories.length > 0 && (
        <section className="bg-slate-50/80 border-b border-slate-100 py-3.5 px-4 overflow-x-auto scrollbar-none sticky top-16 z-20 backdrop-blur-md">
          <div className="container flex items-center gap-2 max-w-7xl">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Sparkles size={13} />
              <span>Todos ({products.length})</span>
            </button>

            {categories.map((cat) => {
              const count = products.filter(p => (p.category || 'general').toLowerCase() === cat.slug.toLowerCase()).length
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    selectedCategory.toLowerCase() === cat.slug.toLowerCase()
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Tag size={12} />
                  <span>{cat.name}</span>
                  {count > 0 && <span className="opacity-60 text-[10px]">({count})</span>}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section className="container py-8 sm:py-14 px-4 sm:px-6" id="productos">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 block mb-1">
              Catálogo Disponible
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
              {selectedCategory === 'all' ? 'Nuestra Colección' : categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
            </h3>
          </div>
          <p className="text-slate-400 text-xs font-medium">
            Mostrando {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {loading ? (
             [1, 2, 3, 4].map(i => (
              <div key={i} className="h-72 sm:h-96 bg-slate-100 animate-pulse rounded-2xl sm:rounded-3xl"></div>
            ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const imageCount = (product.images && product.images.length > 0) ? product.images.length : (product.image_url ? 1 : 0)
              const coverImage = (product.images && product.images.length > 0) ? product.images[0] : product.image_url

              return (
                <Link key={product.id} to={`/product/${product.slug}`} className="block text-decoration-none group">
                  <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
                    <div className="aspect-[4/5] bg-slate-50 overflow-hidden relative">
                      <img 
                        src={formatImageUrl(coverImage) || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e: any) => {
                          e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"
                        }}
                      />

                      {/* Stock badge */}
                      {product.stock <= 3 && product.stock > 0 && (
                        <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-amber-500 text-white text-[8px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase shadow-sm">
                          ¡Últimas {product.stock}!
                        </span>
                      )}

                      {/* Multiple Photos Badge */}
                      {imageCount > 1 && (
                        <span className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/70 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                          <Images size={11} /> {imageCount}
                        </span>
                      )}
                    </div>
                    <div className="p-3 sm:p-5 flex flex-col flex-1 text-center">
                      <span className="text-[8px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 capitalize truncate">
                        {product.category || 'general'}
                      </span>
                      <h4 className="font-serif text-sm sm:text-base font-bold text-slate-900 mb-1.5 sm:mb-2 line-clamp-2">{product.name}</h4>
                      <p className="text-base sm:text-xl font-bold text-slate-900 mt-auto font-mono" style={{ color: 'var(--primary)' }}>
                        {formatCLP(product.base_price)}
                      </p>
                      <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
                        <MessageCircle size={14} /> <span className="hidden sm:inline">Ver & Pedir por</span> WhatsApp →
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="col-span-full text-center py-20 text-slate-400 font-medium">
               No hay productos disponibles en esta sección por ahora.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
