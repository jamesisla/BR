import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, ArrowLeft, MessageCircle, Truck, CreditCard, ShieldCheck, Check, Store } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCart, formatCLP } from '../context/CartContext'

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

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addToCart, setIsCartOpen, config } = useCart()

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

  const handleDirectWhatsApp = () => {
    if (!product) return
    const rawNumber = config?.whatsapp_number || '+56912345678'
    const phone = rawNumber.replace(/[^0-9]/g, '')
    const storeName = config?.name || 'la tienda'
    const total = Math.round(Number(product.base_price || 0) * quantity)

    let msg = `👋 ¡Hola! Me interesa comprar este producto en *${storeName}*:\n\n`
    msg += `📦 *Producto:* ${product.name}\n`
    msg += `🔢 *Cantidad:* ${quantity}\n`
    msg += `💰 *Precio Total:* ${formatCLP(total)}\n\n`
    msg += `¿Podrías facilitarme los datos de transferencia bancaria y opciones de envío/retiro? ¡Muchas gracias!`

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) return (
    <div className="container py-32 text-center text-slate-400 font-medium animate-pulse">
      Cargando detalles del producto...
    </div>
  )

  if (!product) return (
    <div className="container py-32 text-center">
      <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
      <Link to="/" className="text-xs uppercase font-bold tracking-widest text-slate-600 hover:text-slate-900">
        ← Volver al Catálogo
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6">
      <div className="container max-w-5xl">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft size={16} /> Volver al Catálogo
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 items-start">
          {/* Product Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
            <div className="aspect-[4/5] bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-lg">
               <img 
                 src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop"} 
                 alt={product.name}
                 className="w-full h-full object-cover"
               />
            </div>
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col"
          >
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 block mb-2 capitalize">
              {product.category || 'General'}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 font-mono" style={{ color: 'var(--primary)' }}>
              {formatCLP(Number(product.base_price || 0) * quantity)}
              {quantity > 1 && (
                <span className="text-xs text-slate-400 font-sans font-normal ml-2">
                  ({formatCLP(product.base_price)} c/u)
                </span>
              )}
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 text-xs text-slate-600 leading-relaxed">
              {product.description || "Producto de excelente calidad. Stock garantizado para envío inmediato o retiro."}
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
               <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Cantidad</span>
               <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                     <button 
                       onClick={() => setQuantity(q => Math.max(1, q - 1))}
                       className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg font-bold text-lg"
                     >
                       -
                     </button>
                     <span className="w-12 text-center font-bold text-base text-slate-900">{quantity}</span>
                     <button 
                       onClick={() => setQuantity(q => q + 1)}
                       className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg font-bold text-lg"
                     >
                       +
                     </button>
                  </div>
               </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
               <button 
                 onClick={handleDirectWhatsApp}
                 className="flex-1 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
               >
                 <MessageCircle size={18} /> Pedir Directo por WhatsApp
               </button>

               <button 
                 onClick={handleAddToCart}
                 className="py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
               >
                 {added ? <><Check size={18} /> ¡Agregado!</> : <><ShoppingBag size={18} /> Al Carrito</>}
               </button>
            </div>

            {/* Guarantees & Transfer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
               <div className="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-100">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                     <CreditCard size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Transferencia Bancaria</h5>
                    <p className="text-[11px] text-slate-400">CuentaRUT o Cta Corriente</p>
                  </div>
               </div>

               <div className="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-100">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                     <Truck size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Envío / Retiro</h5>
                    <p className="text-[11px] text-slate-400">Coordinación por WhatsApp</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
