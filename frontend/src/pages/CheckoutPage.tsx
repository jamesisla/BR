import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MessageCircle, CreditCard, ShieldCheck, Truck, Store, CheckCircle, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, formatCLP } from '../context/CartContext'

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart, config, getWhatsAppOrderURL } = useCart()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [deliveryType, setDeliveryType] = useState<'envio' | 'retiro'>('envio')
  const [paymentMethods, setPaymentMethods] = useState<any[]>([
    {
      id: 'whatsapp_manual',
      name: 'Transferencia Bancaria & Pedido por WhatsApp',
      description: 'Transfiere directamente a CuentaRUT o Cuenta Corriente y confirma tu pedido al instante por WhatsApp.',
      icon: 'whatsapp',
      type: 'manual'
    }
  ])
  const [selectedMethod, setSelectedMethod] = useState<string>('whatsapp_manual')
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: ''
  })

  useEffect(() => {
    fetch('/api/payments/methods')
      .then(res => res.json())
      .then(data => {
        if (data.methods && data.methods.length > 0) {
          setPaymentMethods(data.methods)
          setSelectedMethod(data.methods[0].id)
        }
      })
      .catch(err => {
        console.error('Error loading payment methods:', err)
      })
  }, [])

  if (cart.length === 0) {
    return (
      <div className="container py-32 text-center px-4">
        <h2 className="font-serif text-3xl mb-6 font-bold text-slate-900">Tu carrito está vacío</h2>
        <Link to="/" className="btn-primary">
           Ver Catálogo
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

    const fullAddress = deliveryType === 'envio' 
      ? `${formData.address}${formData.city ? ', ' + formData.city : ''}`
      : 'Retiro en Tienda'

    const orderData = {
      email: formData.email || 'pedido@tienda.cl',
      first_name: formData.name,
      last_name: formData.phone ? `(Tel: ${formData.phone})` : '',
      address: fullAddress,
      total: totalPrice,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price
      }))
    }

    try {
      // 1. Registrar pedido en la base de datos
      const response = await fetch('/api/orders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const orderResult = await response.json()
        const orderId = orderResult.id || orderResult.order_id

        // 2. Inicializar con la pasarela de pago seleccionada
        if (selectedMethod && selectedMethod !== 'whatsapp_manual') {
          const payRes = await fetch('/api/payments/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: orderId,
              method_id: selectedMethod
            })
          })

          if (payRes.ok) {
            const payData = await payRes.json()
            if (payData.redirect_url) {
              clearCart()
              window.location.href = payData.redirect_url
              return
            }
          }
        }

        // Flujo Directo WhatsApp
        const waURL = getWhatsAppOrderURL(deliveryType, {
          name: formData.name,
          address: fullAddress,
          phone: formData.phone
        })
        
        clearCart()
        window.open(waURL, '_blank')
        navigate(`/checkout/success`)
      } else {
        const errData = await response.json().catch(() => ({}))
        if (errData.detail && (errData.detail.toLowerCase().includes('stock') || errData.detail.toLowerCase().includes('insuficiente'))) {
          alert(`⚠️ ${errData.detail}\nPor favor ajusta las cantidades en tu carrito antes de continuar.`)
          setLoading(false)
          return
        }

        // Fallback a WhatsApp
        const waURL = getWhatsAppOrderURL(deliveryType, {
          name: formData.name,
          address: fullAddress,
          phone: formData.phone
        })
        clearCart()
        window.open(waURL, '_blank')
        navigate(`/checkout/success`)
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      const waURL = getWhatsAppOrderURL(deliveryType, {
        name: formData.name,
        address: fullAddress,
        phone: formData.phone
      })
      clearCart()
      window.open(waURL, '_blank')
      navigate(`/checkout/success`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 bg-[#f8fafc]">
      <div className="container max-w-5xl">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-8 transition-colors">
           <ArrowLeft size={14} /> Volver al catálogo
        </Link>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          {/* Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7 flex flex-col gap-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-sm"
          >
            {/* Modalidad */}
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-2">1. Modalidad de Entrega</h2>
              <p className="text-xs text-slate-400 mb-4">Selecciona cómo deseas recibir tu pedido</p>
              
              <div className="grid grid-cols-2 gap-3">
                 <button 
                   type="button"
                   onClick={() => setDeliveryType('envio')}
                   className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-2 ${deliveryType === 'envio' ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:border-slate-200'}`}
                 >
                    <Truck size={22} className={deliveryType === 'envio' ? 'text-slate-900' : 'text-slate-400'} />
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">Envío a Domicilio</div>
                      <div className="text-[11px] text-slate-400">Coordinado por Starken / Blue Express / Chilexpress</div>
                    </div>
                 </button>

                 <button 
                   type="button"
                   onClick={() => setDeliveryType('retiro')}
                   className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-2 ${deliveryType === 'retiro' ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:border-slate-200'}`}
                 >
                    <Store size={22} className={deliveryType === 'retiro' ? 'text-slate-900' : 'text-slate-400'} />
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">Retiro en Tienda</div>
                      <div className="text-[11px] text-slate-400">Sin costo de envío adicional</div>
                    </div>
                 </button>
              </div>
            </div>

            {/* Datos Personales */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-slate-900 mb-2">2. Tus Datos</h2>
              <p className="text-xs text-slate-400 mb-4">Para asociar tu pedido y enviarte el seguimiento</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">Nombre Completo *</label>
                  <input 
                    name="name"
                    type="text" 
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm"
                    placeholder="Ej: Juan Pérez" 
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">Teléfono / WhatsApp *</label>
                  <input 
                    name="phone"
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm font-mono"
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">Correo Electrónico (Opcional)</label>
                  <input 
                    name="email"
                    type="email" 
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm"
                    placeholder="correo@ejemplo.cl"
                  />
                </div>

                {deliveryType === 'envio' && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">Dirección de Entrega (Calle, Número, Depto) *</label>
                      <input 
                        name="address"
                        type="text" 
                        required={deliveryType === 'envio'}
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm"
                        placeholder="Av. Providencia 1234, Depto 402"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">Comuna / Ciudad *</label>
                      <input 
                        name="city"
                        type="text" 
                        required={deliveryType === 'envio'}
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm"
                        placeholder="Providencia, Santiago"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3. Selección de Medio de Pago */}
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-2">3. Medio de Pago</h2>
              <p className="text-xs text-slate-400 mb-4">Elige cómo deseas abonar tu compra</p>

              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const isSelected = selectedMethod === method.id
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50/80 shadow-sm'
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={isSelected}
                        onChange={() => setSelectedMethod(method.id)}
                        className="mt-1 accent-slate-900 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">{method.name}</span>
                          {method.id === 'mercadopago' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded-md uppercase">
                              Tarjetas / Cuotas
                            </span>
                          )}
                          {method.id === 'whatsapp_manual' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-md uppercase">
                              Sin Comisión
                            </span>
                          )}
                          {method.id === 'flow' && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[9px] font-bold rounded-md uppercase">
                              Webpay
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{method.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Datos de Transferencia (si se eligió WhatsApp / Transferencia) */}
            {selectedMethod === 'whatsapp_manual' && (
              <div className="p-5 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl">
                 <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-xs">
                    <CreditCard size={18} /> Datos para Transferencia Bancaria
                 </div>
                 <p className="text-xs text-emerald-700 leading-relaxed font-mono whitespace-pre-line">
                   {config?.bank_details || 'BancoEstado | CuentaRUT: 12.345.678-9 | Email: pagos@tienda.cl'}
                 </p>
                 <p className="text-[11px] text-emerald-600/80 mt-2">
                   * Al finalizar se abrirá WhatsApp con el pedido estructurado para enviar el comprobante de transferencia.
                 </p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all ${
                selectedMethod === 'mercadopago'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
                  : selectedMethod === 'flow'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  {selectedMethod === 'mercadopago' ? (
                    <>
                      <CreditCard size={18} />
                      <span>Pagar con Mercado Pago ({formatCLP(totalPrice)})</span>
                    </>
                  ) : selectedMethod === 'flow' ? (
                    <>
                      <CreditCard size={18} />
                      <span>Continuar a Flow.cl ({formatCLP(totalPrice)})</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle size={18} />
                      <span>Completar Pedido por WhatsApp ({formatCLP(totalPrice)})</span>
                    </>
                  )}
                </>
              )}
            </button>
          </motion.div>

          {/* Resumen */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm sticky top-28"
          >
             <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mb-6">Resumen del Pedido</h3>
             <div className="flex flex-col gap-3.5 mb-6 max-h-72 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                     <div className="w-12 h-14 bg-slate-50 rounded-xl overflow-hidden relative flex-shrink-0 border border-slate-100">
                        <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-slate-900 text-white rounded-full text-[9px] flex items-center justify-center font-bold">{item.quantity}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-800 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400">{formatCLP(item.price)}</p>
                     </div>
                     <p className="font-bold text-xs text-slate-900 font-mono">{formatCLP(item.price * item.quantity)}</p>
                  </div>
                ))}
             </div>

             <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5">
                <div className="flex justify-between text-xs text-slate-500">
                   <span>Subtotal</span>
                   <span className="font-semibold text-slate-800 font-mono">{formatCLP(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                   <span>Costo de Envío</span>
                   <span className="font-semibold text-slate-800">
                     {deliveryType === 'retiro' ? 'Gratis (Retiro)' : 'A coordinar por WhatsApp'}
                   </span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t border-slate-100">
                   <span>Total a Transferir</span>
                   <span className="font-mono">{formatCLP(totalPrice)}</span>
                </div>
             </div>

             <div className="mt-6 p-3.5 bg-slate-50 rounded-xl flex gap-2.5 items-center text-xs text-slate-500">
                <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Atención directa y segura con el vendedor.</span>
             </div>
          </motion.div>
        </form>
      </div>
    </div>
  )
}
