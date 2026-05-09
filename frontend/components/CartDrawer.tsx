
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import Link from 'next/link'

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { cart, removeFromCart, totalPrice, totalItems } = useCart()

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
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(5px)' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', background: 'white', zIndex: 1001, padding: '40px', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '40px' }}>
               <h3 className="font-serif" style={{ fontSize: '2rem' }}>Tu Selección</h3>
               <X onClick={onClose} size={24} style={{ cursor: 'pointer', opacity: 0.3 }} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
               {cart.length === 0 ? (
                 <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.3 }}>
                    <ShoppingBag size={40} style={{ marginBottom: '20px' }} />
                    <p style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em' }}>El carrito está vacío</p>
                 </div>
               ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: 'flex', gap: '20px', alignItems: 'start' }}>
                         <div style={{ width: '80px', height: '100px', background: '#f9f7f4', overflow: 'hidden' }}>
                            <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} />
                         </div>
                         <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '5px' }}>{item.name}</h4>
                            <p style={{ fontSize: '12px', opacity: 0.5, marginBottom: '10px' }}>Cantidad: {item.quantity}</p>
                            <span style={{ fontWeight: 800 }}>${(item.price * item.quantity).toLocaleString()}</span>
                         </div>
                         <Trash2 onClick={() => removeFromCart(item.id)} size={16} style={{ cursor: 'pointer', opacity: 0.2, marginTop: '5px' }} />
                      </div>
                    ))}
                 </div>
               )}
            </div>

            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '30px', marginTop: '30px' }}>
                 <div style={{ display: 'flex', justifyContent: 'between', marginBottom: '10px', fontSize: '12px', opacity: 0.5, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>
                    <span>Subtotal</span>
                    <span>${totalPrice.toLocaleString()}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'between', marginBottom: '30px', fontSize: '1.5rem', fontWeight: 800 }}>
                    <span>Total</span>
                    <span>${totalPrice.toLocaleString()}</span>
                 </div>
                 <Link href="/checkout" style={{ textDecoration: 'none' }} onClick={onClose}>
                   <button className="btn-primary" style={{ width: '100%', padding: '25px', justifyContent: 'center' }}>
                     Finalizar Compra <ArrowRight size={16} />
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
