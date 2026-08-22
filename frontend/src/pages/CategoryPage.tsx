import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

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
  const { slug } = useParams<{ slug: string }>()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const lowerCat = String(slug).toLowerCase()
          const filtered = data.filter((p: any) => p.category?.toLowerCase() === lowerCat || (lowerCat === 'general' && p.category === 'general'))
          setProducts(filtered)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [slug])

  return (
    <div className="min-h-screen py-16">
      <div className="container">
         <div className="text-center mb-16">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-secondary block mb-2" style={{ color: 'var(--secondary)' }}>
              Explorar Categoría
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 capitalize mb-4">
              {slug}
            </h1>
            <div className="w-12 h-0.5 bg-secondary mx-auto" style={{ backgroundColor: 'var(--secondary)' }}></div>
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
                    <p className="product-price">${Number(product.base_price || 0).toLocaleString()}</p>
                    <div className="mt-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                      Ver Detalles →
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
             <div className="col-span-3 text-center py-24 text-slate-400 font-medium">
                No hay productos en esta categoría por el momento.
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
