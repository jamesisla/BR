
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, ChevronRight, Star } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Product {
  id: string
  name: string
  description: string
  base_price: number
  slug: string
  category: string
  image_url?: string
}

export default function CategoryPage() {
  const params = useParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const categoryName = Array.isArray(params.slug) ? params.slug[0] : params.slug

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    fetch(`${apiUrl}/products/`)
      .then(res => res.json())
      .then(data => {
        const lowerCategory = String(categoryName).toLowerCase()
        const filtered = data.filter((p: any) => p.category?.toLowerCase() === lowerCategory)
        setProducts(filtered)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [categoryName])

  return (
    <div className="bg-[#f9f7f4] min-h-screen">
      {/* Category Header */}
      <section className="container" style={{ padding: '100px 0 60px' }}>
         <div style={{ textAlign: 'center' }}>
            <span style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '20px', display: 'block' }}>Explorar</span>
            <h1 className="font-serif" style={{ fontSize: '4rem', marginBottom: '40px', textTransform: 'capitalize' }}>{categoryName}</h1>
            <div style={{ width: '40px', height: '2px', background: 'var(--secondary)', margin: '0 auto' }}></div>
         </div>
      </section>

      {/* Grid */}
      <section className="container" style={{ paddingBottom: '120px' }}>
        <div className="product-grid">
          {loading ? (
             [1, 2, 3].map(i => (
              <div key={i} className="product-card" style={{ height: '500px', background: 'rgba(0,0,0,0.02)' }}></div>
            ))
          ) : Array.isArray(products) && products.length > 0 ? (
            products.map((product, idx) => (
              <Link key={product.id} href={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
                <div className="product-card">
                  <div className="product-image-wrapper">
                    <img 
                      src={product.image_url || `https://images.unsplash.com/photo-${categoryName === 'cafes' ? (idx === 0 ? '1611854779393-1b2da9d400fe' : idx === 1 ? '1611854779393-1b2da9d400fe' : '1559056199-641a0ac8b55e') : '1517668808822-9ebb02f2a0e6'}?q=80&w=800&auto=format&fit=crop`}
                      alt={product.name}
                    />
                  </div>
                  <div className="product-info">
                    <h4 className="font-serif product-name">{product.name}</h4>
                    <p className="product-price">${Number(product.base_price || 0).toLocaleString()}</p>
                    <div style={{ marginTop: '20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, opacity: 0.3, color: 'var(--primary)' }}>Ver Detalles</div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
             <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '100px 0', opacity: 0.4 }}>
                No hay productos en esta categoría por el momento.
             </div>
          )}
        </div>
      </section>
    </div>
  )
}
