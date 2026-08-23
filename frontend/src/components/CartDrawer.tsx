import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Trash2, MessageCircle, ArrowRight, Truck, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart, formatCLP } from '../context/CartContext'

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { cart, removeFromCart, totalPrice, getWhatsAppOrderURL } = useCart()
  const [deliveryType, setDeliveryType] = useState<'envio' | 'retiro'>('envio')

  const handleWhatsAppCheckout = () => {
    const url = getWhatsAppOrderURL(deliveryType)
    window.open(url, '_blank')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 p-6 sm:p-8 flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
               <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-800">Tu Carrito</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Precios en Pesos Chilenos (CLP)</p>
               </div>
               <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
               {cart.length === 0 ? (
                 <div className="text-center py-20 opacity-40">
                    <ShoppingBag size={44} className="mx-auto mb-3 stroke-1" />
                    <p className="uppercase text-xs font-bold tracking-widest">El carrito está vacío</p>
                 </div>
               ) : (
                 <div className="flex flex-col gap-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-3 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                         <div className="w-16 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                            <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate mb-0.5">{item.name}</h4>
                            <p className="text-[11px] text-slate-400 mb-1">Cant: {item.quantity} x {formatCLP(item.price)}</p>
                            <span className="font-bold text-slate-900 text-sm">{formatCLP(item.price * item.quantity)}</span>
                         </div>
                         <button 
                            onClick={() => removeFromCart(item.id)} 
                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                    ))}
                 </div>
               )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-100 pt-5 mt-4 space-y-4">
                 {/* Modalidad de entrega */}
                 <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">Modalidad de Entrega</span>
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                         onClick={() => setDeliveryType('envio')}
                         className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${deliveryType === 'envio' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                       >
                          <Truck size={14} /> Envío Domicilio
                       </button>
                       <button 
                         onClick={() => setDeliveryType('retiro')}
                         className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${deliveryType === 'retiro' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                       >
                          <Store size={14} /> Retiro en Tienda
                       </button>
                    </div>
                 </div>

                 {/* Total */}
                 <div className="flex justify-between items-center">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total a Transferir</span>
                    <span className="text-xl font-bold text-slate-900 font-mono">{formatCLP(totalPrice)}</span>
                 </div>

                 {/* WhatsApp Main Button */}
                 <button 
                   onClick={handleWhatsAppCheckout}
                   className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                 >
                   <MessageCircle size={18} /> Pedir por WhatsApp (Transferencia)
                 </button>

                 <Link to="/checkout" onClick={onClose} className="block text-center text-xs text-slate-400 hover:text-slate-700 font-medium py-1">
                   O llenar datos de envío primero →
                 </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
