
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Star, Instagram, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string
  base_price: number
  slug: string
  image_url?: string
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    fetch(`${apiUrl}/products/`)
      .then(res => res.json())
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div style={{ position: 'absolute', inset: 0 }}>
          <img 
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2000&auto=format&fit=crop" 
            alt="Artisan Coffee"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-content"
        >
          <span className="hero-subtitle">Curado para el alma • Roast #084</span>
          <h2 className="font-serif hero-title">El Arte del <span style={{ fontWeight: 400, fontStyle: 'italic', color: 'var(--secondary)' }}>Tostado</span></h2>
          <p style={{ opacity: 0.8, fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
            Descubre nuestra selección artesanal de granos de origen único, tostados minuciosamente cada mañana.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <Link href="#productos">
              <button className="btn-primary">Ver Colección</button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Featured Grid Section */}
      <section className="container" id="productos" style={{ padding: '120px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h3 className="font-serif" style={{ fontSize: '3.5rem', marginBottom: '15px' }}>Nuestros Orígenes</h3>
          <div style={{ width: '40px', height: '2px', background: 'var(--secondary)', margin: '0 auto 20px' }}></div>
          <p style={{ opacity: 0.4, maxWidth: '500px', margin: '0 auto', fontSize: '13px' }}>
            Trabajamos directamente con fincas seleccionadas para asegurar la mejor calidad y sostenibilidad.
          </p>
        </div>

        <div className="product-grid">
          {loading ? (
             [1, 2, 3].map(i => (
              <div key={i} className="product-card" style={{ height: '500px', background: 'rgba(0,0,0,0.02)' }}></div>
            ))
          ) : Array.isArray(products) && products.length > 0 ? (
            products.map((product) => (
              <Link key={product.id} href={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
                <div className="product-card">
                  <div className="product-image-wrapper">
                    <img 
                      src={product.image_url || "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?q=80&w=800&auto=format&fit=crop"}
                      alt={product.name}
                    />
                  </div>
                  <div className="product-info">
                    <h4 className="font-serif product-name">{product.name}</h4>
                    <p className="product-price">${Number(product.base_price).toLocaleString()}</p>
                    <div style={{ marginTop: '20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, opacity: 0.3, color: 'var(--primary)' }}>Ver Detalles</div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', opacity: 0.3, padding: '100px 0' }}>
               No hay productos disponibles por ahora.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}