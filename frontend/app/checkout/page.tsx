
'use client'

import React, { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CreditCard, ShieldCheck, Truck, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: ''
  })

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '150px 0', textAlign: 'center' }}>
        <h2 className="font-serif" style={{ fontSize: '3rem', marginBottom: '30px' }}>Tu carrito está vacío</h2>
        <Link href="/">
           <button className="btn-primary">Explorar Colección</button>
        </Link>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const orderData = {
      email: formData.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      address: formData.address,
      total: totalPrice + 5,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price
      }))
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const response = await fetch(`${apiUrl}/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const orderResult = await response.json()
        
        // 2. Crear Preferencia de Mercado Pago
        const prefResponse = await fetch(`${apiUrl}/payments/create-preference`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderResult.id })
        })

        if (prefResponse.ok) {
          const prefData = await prefResponse.json()
          // Redirigir al usuario a Mercado Pago
          window.location.href = prefData.init_point
        } else {
          // Si falla Mercado Pago, igual mostramos éxito de pedido como "pago pendiente/transferencia"
          clearCart()
          router.push(`/checkout/success?orderId=${orderResult.id}`)
        }
      } else {
        alert('Error al procesar el pedido. Por favor intente de nuevo.')
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#f9f7f4] min-h-screen" style={{ padding: '80px 0 120px' }}>
      <div className="container">
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--primary)', opacity: 0.5, marginBottom: '40px', fontSize: '12px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>
           <ArrowLeft size={14} /> Volver a la tienda
        </Link>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '60px', alignItems: 'start' }}>
          {/* Form Side */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}
          >
            <section>
              <h2 className="font-serif" style={{ fontSize: '2.5rem', marginBottom: '30px' }}>Información de Envío</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, opacity: 0.4 }}>Email</label>
                  <input 
                    name="email"
                    type="email" 
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{ padding: '15px', border: '1px solid rgba(0,0,0,0.1)', background: 'white' }} 
                    placeholder="correo@ejemplo.com" 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, opacity: 0.4 }}>Nombre</label>
                  <input 
                    name="firstName"
                    type="text" 
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    style={{ padding: '15px', border: '1px solid rgba(0,0,0,0.1)', background: 'white' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, opacity: 0.4 }}>Apellido</label>
                  <input 
                    name="lastName"
                    type="text" 
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    style={{ padding: '15px', border: '1px solid rgba(0,0,0,0.1)', background: 'white' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, opacity: 0.4 }}>Dirección</label>
                  <input 
                    name="address"
                    type="text" 
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    style={{ padding: '15px', border: '1px solid rgba(0,0,0,0.1)', background: 'white' }} 
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-serif" style={{ fontSize: '2.5rem', marginBottom: '30px' }}>Método de Pago</h2>
              <div style={{ padding: '30px', border: '1px solid var(--primary)', background: 'white', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <CreditCard size={24} />
                <div style={{ flex: 1 }}>
                   <p style={{ fontWeight: 700 }}>Pago al recibir / Transferencia</p>
                   <p style={{ fontSize: '12px', opacity: 0.5 }}>Coordinaremos los detalles por email</p>
                </div>
                <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />
              </div>
            </section>

            <button 
              type="submit"
              disabled={loading}
              className="btn-primary" 
              style={{ padding: '25px', fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />Procesando...
                </>
              ) : (
                `Confirmar Pedido de $${(totalPrice + 5).toLocaleString()}`
              )}
            </button>
          </motion.div>

          {/* Summary Side */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ background: 'white', padding: '50px', border: '1px solid rgba(0,0,0,0.05)' }}
          >
             <h3 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '40px' }}>Resumen del Pedido</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '40px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                     <div style={{ width: '60px', height: '60px', background: '#f9f7f4', position: 'relative' }}>
                        <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} />
                        <span style={{ position: 'absolute', top: -10, right: -10, width: '20px', height: '20px', background: 'var(--primary)', color: 'white', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>
                     </div>
                     <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: '14px' }}>{item.name}</p>
                     </div>
                     <p style={{ fontWeight: 800 }}>${(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
             </div>

             <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', opacity: 0.5 }}>
                   <span>Subtotal</span>
                   <span>${totalPrice.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', opacity: 0.5 }}>
                   <span>Envío</span>
                   <span>$5.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 800, marginTop: '15px' }}>
                   <span>Total</span>
                   <span>${(totalPrice + 5).toLocaleString()}</span>
                </div>
             </div>

             <div style={{ marginTop: '50px', padding: '20px', background: '#f9f7f4', borderRadius: '10px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <Truck size={20} style={{ opacity: 0.5 }} />
                <p style={{ fontSize: '12px', opacity: 0.6 }}>Tu pedido llegará en 2-4 días hábiles.</p>
             </div>
          </motion.div>
        </form>
      </div>
    </div>
  )
}
