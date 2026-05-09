
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, ArrowLeft, Star, ShieldCheck, Truck, RefreshCcw } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCart } from '../../../context/CartContext'

interface Product {
  id: string
  name: string
  description: string
  base_price: number
  slug: string
  image_url?: string
}

export default function ProductDetail() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { addToCart, setIsCartOpen } = useCart()

  useEffect(() => {
    if (params.slug) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      fetch(`${apiUrl}/products/${params.slug}`)
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
  }, [params.slug])

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity)
      setIsCartOpen(true)
    }
  }

  if (loading) return (
    <div className="container" style={{ padding: '200px 0', textAlign: 'center', opacity: 0.5 }}>
      Cargando experiencia sensorial...
    </div>
  )

  if (!product) return (
    <div className="container" style={{ padding: '200px 0', textAlign: 'center' }}>
      Producto no encontrado.
    </div>
  )

  return (
    <div className="bg-[#f9f7f4] min-h-screen">
      <div className="container" style={{ padding: '60px 0' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', textDecoration: 'none', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '40px', opacity: 0.4 }}>
          <ArrowLeft size={16} /> Volver a la Colección
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '100px', alignItems: 'start' }}>
          {/* Left: Experimental Image Display */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ position: 'sticky', top: '150px' }}
          >
            <div style={{ aspectRatio: '4/5', background: 'white', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
               <img 
                 src={product.image_url || "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?q=80&w=1200&auto=format&fit=crop"} 
                 alt={product.name}
                 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
               />
            </div>
          </motion.div>

          {/* Right: Refined Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '20px', display: 'block' }}>
              Micro-Lote Seleccionado
            </span>
            <h1 className="font-serif" style={{ fontSize: '4rem', marginBottom: '20px', lineHeight: 1.1 }}>{product.name}</h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
               <div style={{ display: 'flex', gap: '2px', color: 'var(--secondary)' }}>
                 <Star size={14} fill="currentColor" />
                 <Star size={14} fill="currentColor" />
                 <Star size={14} fill="currentColor" />
                 <Star size={14} fill="currentColor" />
                 <Star size={14} fill="currentColor" />
               </div>
               <span style={{ fontSize: '12px', opacity: 0.4, fontWeight: 700 }}>(24 Reseñas)</span>
            </div>

            <p style={{ fontSize: '2.5rem', fontWeight: 300, marginBottom: '40px', color: 'var(--primary)' }}>
              ${Number(product.base_price || 0).toLocaleString()}
            </p>

            <p style={{ opacity: 0.6, lineHeight: 1.8, marginBottom: '50px', fontSize: '1.1rem' }}>
              {product.description || "Un perfil complejo con notas florales y una acidez balanceada, cosechado a más de 1,800 metros sobre el nivel del mar."}
            </p>

            {/* Selection */}
            <div style={{ marginBottom: '50px' }}>
               <h4 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '15px', opacity: 0.4 }}>Cantidad</h4>
               <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(0,0,0,0.1)', padding: '5px' }}>
                     <button onClick={() => setQuantity(q => Math.max(1, q-1))} style={{ background: 'none', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>-</button>
                     <span style={{ width: '40px', textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
                     <button onClick={() => setQuantity(q => q+1)} style={{ background: 'none', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>+</button>
                  </div>
                  <button className="btn-primary" style={{ flex: 1, padding: '20px' }} onClick={handleAddToCart}>
                    <ShoppingBag size={16} /> Añadir al Carrito
                  </button>
               </div>
            </div>

            {/* Perks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '40px' }}>
               <div style={{ display: 'flex', gap: '15px' }}>
                  <Truck size={20} style={{ color: 'var(--secondary)' }} />
                  <div>
                    <h5 style={{ fontSize: '12px', marginBottom: '5px' }}>Envio Express</h5>
                    <p style={{ fontSize: '11px', opacity: 0.5 }}>24-48 horas en todo el país.</p>
                  </div>
               </div>
               <div style={{ display: 'flex', gap: '15px' }}>
                  <RefreshCcw size={20} style={{ color: 'var(--secondary)' }} />
                  <div>
                    <h5 style={{ fontSize: '12px', marginBottom: '5px' }}>Frescura Garantizada</h5>
                    <p style={{ fontSize: '11px', opacity: 0.5 }}>Tostado bajo pedido.</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
