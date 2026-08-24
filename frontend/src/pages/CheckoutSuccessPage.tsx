import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  ArrowRight, 
  Package, 
  Printer, 
  Download, 
  ShoppingBag, 
  MessageCircle, 
  MapPin, 
  Calendar, 
  CreditCard,
  Building2,
  FileText
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart, formatCLP, formatImageUrl } from '../context/CartContext'

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id') || searchParams.get('orderId') || ''
  const { config } = useCart()

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.id) {
            setOrder(data)
          }
        })
        .catch(err => console.error('Error fetching order details:', err))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [orderId])

  const handlePrint = () => {
    window.print()
  }

  const cleanPhone = (config?.whatsapp_number || '+56912345678').replace(/[^0-9]/g, '')
  const waURL = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`¡Hola! Tengo una consulta sobre mi pedido #${orderId?.substring(0, 8).toUpperCase() || ''}`)}`

  return (
    <div className="min-h-screen py-12 sm:py-20 bg-slate-50/50 print:bg-white print:py-0">
      <div className="container max-w-2xl px-4 mx-auto">
        
        {/* Printable Receipt Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 print:shadow-none print:border-none print:p-0"
        >
          {/* Success Banner (Hidden on Print) */}
          <div className="text-center mb-8 print:hidden">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} strokeWidth={2.5} />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-2">¡Pedido Registrado con Éxito!</h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Gracias por tu compra en <strong className="text-slate-800">{config?.name || 'nuestra tienda'}</strong>. A continuación tienes el comprobante detallado de tu orden.
            </p>
          </div>

          {/* RECEIPT HEADER (Visible on Screen and Print) */}
          <div className="border-b border-slate-200 pb-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {config?.logo_url ? (
                    <img 
                      src={formatImageUrl(config.logo_url)} 
                      alt={config.name} 
                      className="h-9 w-auto max-w-[120px] object-contain rounded-lg" 
                    />
                  ) : null}
                  <h2 className="font-serif text-xl font-bold text-slate-900 tracking-tight">
                    {config?.name || 'Tienda Digital'}
                  </h2>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">COMPROBANTE DE PEDIDO / ORDEN DE COMPRA</p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">N° de Orden</span>
                <span className="font-mono font-bold text-sm sm:text-base text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                  #{orderId ? orderId.substring(0, 8).toUpperCase() : 'RECIBO-OFFLINE'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {order?.created_at ? new Date(order.created_at).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : new Date().toLocaleDateString('es-CL')}
                </span>
              </div>
            </div>
          </div>

          {/* CUSTOMER & DELIVERY INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl mb-6 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Cliente</span>
              <p className="font-bold text-slate-900">{order?.first_name || 'Cliente'} {order?.last_name || ''}</p>
              {order?.email && order.email !== 'pedido@tienda.cl' && (
                <p className="text-slate-500">{order.email}</p>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Dirección / Entrega</span>
              <p className="font-medium text-slate-800 leading-relaxed flex items-start gap-1">
                <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span>{order?.address || 'Retiro en Tienda / Acordado por WhatsApp'}</span>
              </p>
            </div>
          </div>

          {/* ITEMS BREAKDOWN TABLE */}
          <div className="mb-6">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Detalle de Productos</h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-2 text-center">Cant.</th>
                    <th className="py-2.5 px-3 text-right">P. Unitario</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order?.items && order.items.length > 0 ? (
                    order.items.map((item: any) => (
                      <tr key={item.id} className="text-slate-800">
                        <td className="py-2.5 px-3 font-medium">
                          {item.product?.name || `Producto #${item.product_id}`}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatCLP(item.price_at_purchase)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCLP(item.price_at_purchase * item.quantity)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 px-3 text-center text-slate-400">
                        Pedido registrado (Total: {formatCLP(order?.total || 0)})
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-sm">
                    <td colSpan={3} className="py-3 px-3 text-right text-slate-700">Total a Pagar:</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700 text-base">
                      {formatCLP(order?.total || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* BANK DETAILS FOOTER */}
          {config?.bank_details && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl mb-8 text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wide">
                <CreditCard size={14} /> Datos de Transferencia Bancaria
              </span>
              <p className="text-emerald-800 font-mono leading-relaxed whitespace-pre-line text-[11px]">
                {config.bank_details}
              </p>
            </div>
          )}

          {/* ACTION BUTTONS (Hidden on Print) */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 print:hidden border-t border-slate-100">
            <button
              onClick={handlePrint}
              className="flex-1 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Printer size={16} />
              <span>Imprimir / Guardar en PDF</span>
            </button>

            <a
              href={waURL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all text-center"
            >
              <MessageCircle size={16} />
              <span>Contactar por WhatsApp</span>
            </a>
          </div>

          <div className="mt-4 text-center print:hidden">
            <Link to="/" className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center justify-center gap-1">
              <ShoppingBag size={14} /> Volver al Catálogo de Productos
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
