
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShoppingBag, ArrowLeft, Star, Minus, Plus } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string
  base_price: number
  slug: string
}

export default function ProductDetail() {
  const params = useParams()
  const slug = params.slug
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (slug) {
      fetch(`http://localhost:8000/api/products/${slug}`)
        .then(res => res.json())
        .then(data => {
          setProduct(data)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-64 h-64 bg-primary/10 rounded-full mb-8" />
          <div className="h-8 w-48 bg-primary/10 mb-4" />
          <div className="h-4 w-32 bg-primary/10" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl font-serif mb-8">Producto no encontrado</h2>
        <Link href="/" className="comprar-btn w-auto px-8">Volver a la tienda</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-12 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase opacity-50">
        <Link href="/" className="hover:text-secondary transition-colors">Inicio</Link>
        <span>/</span>
        <span className="text-secondary">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
        {/* Product Image Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative group"
        >
          <div className="aspect-square bg-white rounded-3xl flex items-center justify-center relative overflow-hidden">
             <div className="text-secondary opacity-5 text-[20rem] font-black group-hover:scale-110 transition-transform duration-700 select-none">
                {product.name.substring(0, 1)}
             </div>
             {/* Decorative element */}
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
          </div>
          
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-secondary rounded-[40%_60%_70%_30%/40%_50%_60%_70%] -z-10 blur-2xl opacity-20 animate-pulse" />
        </motion.div>

        {/* Product Info Section */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
           <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className="fill-secondary text-secondary" />)}
              <span className="text-[10px] font-bold tracking-widest opacity-50 ml-2">4.9 (24 RESEÑAS)</span>
           </div>

           <h1 className="text-6xl font-serif font-bold text-primary mb-4 leading-tight">
             {product.name}
           </h1>
           
           <div className="text-3xl font-bold text-secondary mb-12">
             ${Number(product.base_price).toFixed(3)}
           </div>

           <div className="bg-white/50 p-8 rounded-2xl mb-12 border border-white/20">
              <h3 className="text-xs font-bold tracking-widest text-primary uppercase mb-4 opacity-50">Descripción</h3>
              <p className="text-sm leading-relaxed opacity-70 mb-0">
                {product.description || "Nuestra selección premium de café artesanal, tostado con precisión para resaltar cada nota aromática. Una experiencia única para los paladares más exigentes."}
              </p>
           </div>

           {/* Actions */}
           <div className="flex gap-6 items-center">
              <div className="flex items-center bg-white border border-primary/10 rounded-full px-4 py-2">
                 <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:text-secondary transition-colors"
                >
                  <Minus size={16} />
                </button>
                 <span className="w-12 text-center font-bold">{quantity}</span>
                 <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:text-secondary transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button className="comprar-btn flex-1 flex items-center justify-center gap-4 py-6">
                 <ShoppingBag size={20} />
                 AÑADIR AL CARRITO
              </button>
           </div>

           {/* Extra info */}
           <div className="mt-12 pt-12 border-t border-primary/5 grid grid-cols-2 gap-8">
              <div>
                 <h4 className="text-[10px] font-bold tracking-widest uppercase opacity-40 mb-2">Envío</h4>
                 <p className="text-xs font-bold">24/48 Horas gratis</p>
              </div>
              <div>
                 <h4 className="text-[10px] font-bold tracking-widest uppercase opacity-40 mb-2">Tostaduría</h4>
                 <p className="text-xs font-bold">Chacona Special</p>
              </div>
           </div>
        </motion.div>
      </div>

      {/* Back link */}
      <Link href="/" className="inline-flex items-center gap-2 mt-24 text-[10px] font-bold tracking-widest uppercase opacity-40 hover:opacity-100 hover:text-secondary transition-all">
         <ArrowLeft size={16} />
         Explorar más cafés
      </Link>
    </div>
  )
}
