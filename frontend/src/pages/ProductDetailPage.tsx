import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, ArrowLeft, Star, Truck, RefreshCcw, Check } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
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

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addToCart, setIsCartOpen } = useCart()

  useEffect(() => {
    if (slug) {
      fetch(`/api/products/${slug}`)
        .then(res => res.json())
        .then(data => {
          if (data.id) setProduct(data)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [slug])

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity)
      setAdded(true)
      setTimeout(() => setAdded(false), 1500)
      setIsCartOpen(true)
    }
  }

  if (loading) return (
    <div className="container py-32 text-center text-slate-400 font-medium animate-pulse">
      Cargando producto...
    </div>
  )

  if (!product) return (
    <div className="container py-32 text-center">
      <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
      <Link to="/" className="text-xs uppercase font-bold tracking-widest text-slate-600 hover:text-slate-900">
        ← Volver a la Colección
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-12 transition-colors">
          <ArrowLeft size={16} /> Volver a la Colección
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Image */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-32"
          >
            <div className="aspect-4/5 bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl shadow-slate-100">
               <img 
                 src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop"} 
                 alt={product.name}
                 className="w-full h-full object-cover"
               />
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-secondary block mb-4" style={{ color: 'var(--secondary)' }}>
              Colección Seleccionada
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-3 mb-8">
               <div className="flex text-amber-400">
                 {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
               </div>
               <span className="text-xs text-slate-400 font-bold">(24 Reseñas)</span>
            </div>

            <p className="text-3xl md:text-4xl font-light text-slate-900 mb-8" style={{ color: 'var(--primary)' }}>
              ${Number(product.base_price || 0).toLocaleString()}
            </p>

            <p className="text-slate-600 leading-relaxed mb-10 text-base">
              {product.description || "Diseño y fabricación de alta gama, pensado para ofrecerte la máxima durabilidad, rendimiento y estética excepcional."}
            </p>

            {/* Quantity and Cart */}
            <div className="mb-12">
               <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Cantidad</h4>
               <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden p-1 shadow-sm">
                     <button 
                       onClick={() => setQuantity(q => Math.max(1, q - 1))}
                       className="px-4 py-2 text-slate-500 hover:bg-slate-50 font-bold"
                     >
                       -
                     </button>
                     <span className="w-10 text-center font-bold text-sm text-slate-800">{quantity}</span>
                     <button 
                       onClick={() => setQuantity(q => q + 1)}
                       className="px-4 py-2 text-slate-500 hover:bg-slate-50 font-bold"
                     >
                       +
                     </button>
                  </div>
                  <button 
                    onClick={handleAddToCart}
                    className="btn-primary flex-1 py-4 text-xs font-bold justify-center rounded-xl shadow-lg"
                  >
                    {added ? <><Check size={16} /> ¡Añadido!</> : <><ShoppingBag size={16} /> Añadir al Carrito</>}
                  </button>
               </div>
            </div>

            {/* Perks */}
            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-slate-200">
               <div className="flex gap-4 items-start">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-secondary" style={{ color: 'var(--secondary)' }}>
                     <Truck size={20} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 mb-1">Envío Express</h5>
                    <p className="text-xs text-slate-400">24-48 horas a todo el país.</p>
                  </div>
               </div>
               <div className="flex gap-4 items-start">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-secondary" style={{ color: 'var(--secondary)' }}>
                     <RefreshCcw size={20} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 mb-1">Garantía Total</h5>
                    <p className="text-xs text-slate-400">Calidad 100% asegurada.</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
