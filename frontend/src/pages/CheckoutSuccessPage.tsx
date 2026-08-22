import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Package, Mail } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <div className="min-h-screen py-24">
      <div className="container max-w-xl text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="bg-white p-10 md:p-12 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={44} strokeWidth={2} />
          </div>
          
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mb-4">¡Gracias por tu compra!</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Tu pedido ha sido registrado con éxito en nuestro sistema y ya estamos preparándolo para el envío.
          </p>

          <div className="bg-slate-50 p-6 rounded-2xl mb-8 text-left flex flex-col gap-4 border border-slate-100">
            <div className="flex items-center gap-3">
               <Package size={18} className="text-slate-400" />
               <p className="text-xs text-slate-600 font-medium">
                 Número de Pedido: <strong className="text-slate-900 font-mono">{orderId?.substring(0, 8).toUpperCase() || '---'}</strong>
               </p>
            </div>
            <div className="flex items-center gap-3">
               <Mail size={18} className="text-slate-400" />
               <p className="text-xs text-slate-600">Te enviamos el comprobante y seguimiento a tu correo.</p>
            </div>
          </div>

          <Link to="/">
            <button className="btn-primary w-full py-4 text-xs font-bold justify-center rounded-xl shadow-lg">
              Volver a la Tienda <ArrowRight size={16} />
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
