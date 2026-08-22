'use client'

import React, { Suspense } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Package, Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <div className="bg-[#f9f7f4] min-h-screen" style={{ padding: '120px 0' }}>
      <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          <div style={{ display: 'inline-flex', padding: '30px', borderRadius: '50%', background: 'white', color: 'var(--accent)', marginBottom: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            <CheckCircle size={60} strokeWidth={1.5} />
          </div>
          
          <h1 className="font-serif" style={{ fontSize: '3.5rem', marginBottom: '20px' }}>¡Gracias por tu compra!</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.6, lineHeight: 1.6, marginBottom: '40px' }}>
            Tu pedido ha sido procesado con éxito. Pronto recibirás un correo electrónico con los detalles del envío.
          </p>

          <div style={{ background: 'white', padding: '40px', borderRadius: '20px', marginBottom: '50px', border: '1px solid rgba(0,0,0,0.05)', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #f0f0f0', paddingBottom: '20px' }}>
               <Package size={20} opacity={0.4} />
               <p style={{ fontSize: '14px' }}>Número de Pedido: <strong>{orderId?.substring(0, 8).toUpperCase() || '---'}</strong></p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
               <Mail size={20} opacity={0.4} />
               <p style={{ fontSize: '14px' }}>Enviamos la confirmación a tu correo.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                Volver al Inicio <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#f9f7f4] min-h-screen flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-slate-800" size={32} />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
