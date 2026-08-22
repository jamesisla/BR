import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CreditCard, ShieldCheck, Truck, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: ''
  })

  if (cart.length === 0) {
    return (
      <div className="container py-32 text-center">
        <h2 className="font-serif text-3xl md:text-4xl mb-6 font-bold text-slate-900">Tu carrito está vacío</h2>
        <Link to="/" className="btn-primary">
           Explorar Colección
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
      const response = await fetch('/api/orders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const orderResult = await response.json()
        
        // Try creating Mercado Pago Preference
        try {
          const prefResponse = await fetch('/api/payments/create-preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderResult.id })
          })

          if (prefResponse.ok) {
            const prefData = await prefResponse.json()
            if (prefData.init_point && prefData.init_point.startsWith('http')) {
              window.location.href = prefData.init_point
              return
            }
          }
        } catch (mpErr) {
          console.warn('Mercado Pago bypass / offline mode:', mpErr)
        }

        clearCart()
        navigate(`/checkout/success?orderId=${orderResult.id}`)
      } else {
        const err = await response.json()
        alert('Error al procesar pedido: ' + (err.detail || 'Verifique los datos'))
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-8 transition-colors">
           <ArrowLeft size={14} /> Volver a la tienda
        </Link>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7 flex flex-col gap-10 bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-sm"
          >
            <section>
              <h2 className="font-serif text-3xl font-bold text-slate-900 mb-6">Información de Envío</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">Correo Electrónico</label>
                  <input 
                    name="email"
                    type="email" 
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 text-sm"
                    placeholder="correo@ejemplo.com" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">Nombre</label>
                  <input 
                    name="firstName"
                    type="text" 
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">Apellido</label>
                  <input 
                    name="lastName"
                    type="text" 
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">Dirección de Entrega</label>
                  <input 
                    name="address"
                    type="text" 
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 text-sm"
                    placeholder="Calle, número, departamento, ciudad"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4">Método de Pago</h2>
              <div className="p-5 border-2 border-slate-900 rounded-2xl bg-slate-50/50 flex items-center gap-4">
                <CreditCard size={24} className="text-slate-800" />
                <div className="flex-1">
                   <p className="font-bold text-sm text-slate-900">Mercado Pago / Pago Seguro</p>
                   <p className="text-xs text-slate-400">Tarjetas de crédito, débito o transferencia</p>
                </div>
                <ShieldCheck size={20} className="text-emerald-600" />
              </div>
            </section>

            <button 
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-xs font-bold justify-center rounded-xl shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Procesando pedido...
                </>
              ) : (
                `Confirmar Pedido de $${(totalPrice + 5).toLocaleString()}`
              )}
            </button>
          </motion.div>

          {/* Summary */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-sm sticky top-32"
          >
             <h3 className="font-serif text-2xl font-bold text-slate-900 mb-8">Resumen del Pedido</h3>
             <div className="flex flex-col gap-4 mb-8 max-h-80 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center">
                     <div className="w-14 h-16 bg-slate-50 rounded-lg overflow-hidden relative flex-shrink-0 border border-slate-100">
                        <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 text-white rounded-full text-[10px] flex items-center justify-center font-bold">{item.quantity}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-800 truncate">{item.name}</p>
                     </div>
                     <p className="font-bold text-xs text-slate-900">${(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
             </div>

             <div className="border-t border-slate-100 pt-6 flex flex-col gap-3">
                <div className="flex justify-between text-xs text-slate-500">
                   <span>Subtotal</span>
                   <span className="font-semibold text-slate-800">${totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                   <span>Costo de Envío</span>
                   <span className="font-semibold text-slate-800">$5.00</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t border-slate-100">
                   <span>Total</span>
                   <span>${(totalPrice + 5).toLocaleString()}</span>
                </div>
             </div>

             <div className="mt-8 p-4 bg-slate-50 rounded-2xl flex gap-3 items-center text-xs text-slate-500">
                <Truck size={18} className="text-secondary flex-shrink-0" style={{ color: 'var(--secondary)' }} />
                <span>Entrega estimada en 2 a 4 días hábiles.</span>
             </div>
          </motion.div>
        </form>
      </div>
    </div>
  )
}
