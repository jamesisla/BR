import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

interface Product {
  id: string
  name: string
  description: string
  base_price: number
  slug: string
  image_url?: string
  stock: number
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

  const heroImage = config?.hero_image_url || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2000&auto=format&fit=crop"

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt={config?.name || "Hero Banner"}
            className="w-full h-full object-cover opacity-60"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-content"
        >
          <span className="hero-subtitle">{config?.name || 'TIENDA'} • Especialistas</span>
          <h2 className="font-serif hero-title text-white">{config?.hero_title || 'El Arte de la Pureza'}</h2>
          <p className="opacity-80 text-base md:text-lg mb-8 max-w-xl mx-auto text-white">
            {config?.hero_subtitle || 'Descubre nuestra selección artesanal única.'}
          </p>
          <div className="flex gap-4 justify-center">
            <a href="#productos" className="btn-primary">
              Ver Colección
            </a>
          </div>
        </motion.div>
      </section>

      {/* Products Grid */}
      <section className="container py-24" id="productos">
        <div className="text-center mb-16">
          <h3 className="font-serif text-4xl md:text-5xl mb-4 font-bold text-slate-900">Nuestra Colección</h3>
          <div className="w-12 h-0.5 bg-secondary mx-auto mb-4" style={{ backgroundColor: 'var(--secondary)' }}></div>
          <p className="text-slate-500 max-w-md mx-auto text-sm">
            Seleccionamos cada producto con un estándar de calidad inigualable.
          </p>
        </div>

        <div className="product-grid">
          {loading ? (
             [1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-slate-100/80 animate-pulse rounded-2xl"></div>
            ))
          ) : products.length > 0 ? (
            products.map((product) => (
              <Link key={product.id} to={`/product/${product.slug}`} className="block text-decoration-none">
                <div className="product-card group">
                  <div className="product-image-wrapper">
                    <img 
                      src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"}
                      alt={product.name}
                    />
                  </div>
                  <div className="product-info">
                    <h4 className="font-serif product-name font-bold text-slate-900">{product.name}</h4>
                    <p className="product-price">${Number(product.base_price).toLocaleString()}</p>
                    <div className="mt-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                      Ver Detalles →
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center py-20 text-slate-400 font-medium">
               No hay productos disponibles por ahora.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
