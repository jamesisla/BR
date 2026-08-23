import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MessageCircle, ShieldCheck, Truck, RefreshCw } from 'lucide-react'
import { useCart, formatCLP, formatImageUrl } from '../context/CartContext'

interface Product {
  id: string
  name: string
  description: string
  base_price: number
  slug: string
  image_url?: string
  stock: number
  category?: string
}

export default function HomePage() {
  const { config } = useCart()
  const [products, setProducts] = useState<Product[]>([])
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

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section min-h-[60vh] sm:min-h-[75vh] flex items-center justify-center relative overflow-hidden bg-black">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt={config?.name || "Hero Banner"}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-content relative z-10 text-center px-4 py-12"
        >
          <span className="hero-subtitle text-[10px] sm:text-xs tracking-widest text-emerald-400 font-extrabold uppercase mb-2 block">
            {config?.name || 'TIENDA'} • Catálogo Digital
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            {config?.hero_title || 'Emprende con Estilo'}
          </h2>
          <p className="opacity-90 text-sm sm:text-base max-w-lg mx-auto text-slate-200 mb-8 leading-relaxed">
            {config?.hero_subtitle || 'Descubre nuestra selección exclusiva. Haz tus pedidos de forma rápida y directa por WhatsApp.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a href="#productos" className="btn-primary w-full sm:w-auto justify-center py-3.5 px-6 rounded-xl">
              Ver Productos
            </a>
            <a 
              href={`https://wa.me/${phone}?text=${encodeURIComponent('¡Hola! Quisiera hacer una consulta sobre los productos de la tienda.')}`}
              target="_blank" 
              rel="noreferrer"
              className="w-full sm:w-auto py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
            >
              <MessageCircle size={16} /> Consultar por WhatsApp
            </a>
          </div>
        </motion.div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-slate-100 py-6">
        <div className="container px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
             <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-700">
                <Truck size={20} className="text-secondary" style={{ color: 'var(--secondary)' }} />
                <span className="text-xs font-bold">Envíos a todo Chile</span>
             </div>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-700">
                <MessageCircle size={20} className="text-emerald-600" />
                <span className="text-xs font-bold">Atención por WhatsApp</span>
             </div>
             <div className="col-span-2 sm:col-span-1 flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-700">
                <ShieldCheck size={20} className="text-secondary" style={{ color: 'var(--secondary)' }} />
                <span className="text-xs font-bold">Pago seguro vía Transferencia</span>
             </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container py-16 sm:py-24 px-4 sm:px-6" id="productos">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 block mb-1">Catálogo Disponible</span>
          <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3">Nuestra Colección</h3>
          <div className="w-12 h-0.5 bg-secondary mx-auto mb-3" style={{ backgroundColor: 'var(--secondary)' }}></div>
          <p className="text-slate-500 max-w-md mx-auto text-xs sm:text-sm">
            Precios en pesos chilenos (CLP). Elige tus productos y finaliza tu pedido por WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {loading ? (
             [1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-slate-100 animate-pulse rounded-3xl"></div>
            ))
          ) : products.length > 0 ? (
            products.map((product) => (
              <Link key={product.id} to={`/product/${product.slug}`} className="block text-decoration-none group">
                <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
                  <div className="aspect-[4/5] bg-slate-50 overflow-hidden relative">
                    <img 
                      src={formatImageUrl(product.image_url) || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e: any) => {
                        e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"
                      }}
                    />
                    {product.stock <= 3 && product.stock > 0 && (
                      <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                        ¡Últimas {product.stock} unidades!
                      </span>
                    )}
                  </div>
                  <div className="p-5 sm:p-6 flex flex-col flex-1 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 capitalize">
                      {product.category || 'general'}
                    </span>
                    <h4 className="font-serif text-lg sm:text-xl font-bold text-slate-900 mb-2 truncate">{product.name}</h4>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-auto font-mono" style={{ color: 'var(--primary)' }}>
                      {formatCLP(product.base_price)}
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
                      <MessageCircle size={15} /> Ver & Pedir por WhatsApp →
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-slate-400 font-medium">
               No hay productos disponibles por ahora.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
