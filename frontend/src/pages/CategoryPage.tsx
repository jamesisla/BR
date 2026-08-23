import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { formatCLP, formatImageUrl } from '../context/CartContext'

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
    <div className="min-h-screen py-12 sm:py-16 px-4 sm:px-6">
      <div className="container">
         <div className="text-center mb-12 sm:mb-16">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
              Categoría
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 capitalize mb-3">
              {slug}
            </h1>
            <div className="w-12 h-0.5 bg-secondary mx-auto" style={{ backgroundColor: 'var(--secondary)' }}></div>
         </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {loading ? (
             [1, 2, 3, 4].map(i => (
              <div key={i} className="h-72 sm:h-96 bg-slate-100 animate-pulse rounded-2xl sm:rounded-3xl"></div>
            ))
          ) : products.length > 0 ? (
            products.map((product) => (
              <Link key={product.id} to={`/product/${product.slug}`} className="block text-decoration-none group">
                <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
                  <div className="aspect-[4/5] bg-slate-50 overflow-hidden relative">
                    <img 
                      src={formatImageUrl(product.image_url) || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e: any) => {
                        e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"
                      }}
                    />
                  </div>
                  <div className="p-3 sm:p-5 flex flex-col flex-1 text-center">
                    <h4 className="font-serif text-sm sm:text-lg font-bold text-slate-900 mb-1.5 sm:mb-2 line-clamp-2">{product.name}</h4>
                    <p className="text-base sm:text-xl font-bold text-slate-900 mt-auto font-mono" style={{ color: 'var(--primary)' }}>
                      {formatCLP(product.base_price)}
                    </p>
                    <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
                      <MessageCircle size={14} /> <span className="hidden sm:inline">Ver & Pedir por</span> WhatsApp →
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
             <div className="col-span-full text-center py-24 text-slate-400 font-medium">
                No hay productos en esta categoría por el momento.
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
