import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { cart, removeFromCart, totalPrice } = useCart()

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 p-8 flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
               <h3 className="font-serif text-2xl font-bold text-slate-800">Tu Selección</h3>
               <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-50 transition-colors">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
               {cart.length === 0 ? (
                 <div className="text-center py-20 opacity-40">
                    <ShoppingBag size={48} className="mx-auto mb-4 stroke-1" />
                    <p className="uppercase text-xs font-bold tracking-widest">El carrito está vacío</p>
                 </div>
               ) : (
                 <div className="flex flex-col gap-6">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-4 items-center bg-slate-50/60 p-3 rounded-xl border border-slate-100/80">
                         <div className="w-16 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                            <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 truncate mb-1">{item.name}</h4>
                            <p className="text-xs text-slate-400 mb-1">Cantidad: {item.quantity}</p>
                            <span className="font-bold text-slate-900 text-sm">${(item.price * item.quantity).toLocaleString()}</span>
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
              <div className="border-t border-slate-100 pt-6 mt-6">
                 <div className="flex justify-between items-center mb-6">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total a Pagar</span>
                    <span className="text-2xl font-bold text-slate-900">${totalPrice.toLocaleString()}</span>
                 </div>
                 <Link to="/checkout" onClick={onClose} className="block">
                   <button className="btn-primary w-full py-4 text-xs font-bold justify-center rounded-xl shadow-lg">
                     Continuar al Pago <ArrowRight size={16} />
                   </button>
                 </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
