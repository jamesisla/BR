import React from 'react'
import { Instagram, MessageCircle, CreditCard, ShieldCheck } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function Footer() {
  const { config } = useCart()
  const rawNumber = config?.whatsapp_number || '+56912345678'
  const phone = rawNumber.replace(/[^0-9]/g, '')

  return (
    <footer className="bg-[#111111] text-white pt-16 pb-12">
      <div className="container px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl mb-3 text-white">{config?.name || 'Tienda Demo'}</h2>
            <p className="opacity-60 text-xs sm:text-sm max-w-sm mb-4 leading-relaxed">
              Atención directa y personalizada. Pagos mediante transferencia bancaria y envíos a todo Chile.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <ShieldCheck size={16} /> Compra 100% segura y coordinada
            </div>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-widest opacity-40 mb-4 font-bold">Contacto Directo</h4>
            <div className="flex flex-col gap-3">
              <a 
                href={`https://wa.me/${phone}`} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold hover:bg-emerald-600/30 transition-colors w-fit"
              >
                <MessageCircle size={16} /> WhatsApp: {config?.whatsapp_number || '+56912345678'}
              </a>
              {config?.instagram_url && (
                <a 
                  href={config.instagram_url.startsWith('http') ? config.instagram_url : `https://${config.instagram_url}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink-600/20 text-pink-400 border border-pink-500/30 rounded-xl text-xs font-bold hover:bg-pink-600/30 transition-colors w-fit"
                >
                  <Instagram size={16} /> Síguenos en Instagram
                </a>
              )}
              <div className="text-xs opacity-50 flex items-center gap-2">
                <CreditCard size={14} /> Transferencia Bancaria (CuentaRUT / Cta Corriente)
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-widest opacity-40 mb-4 font-bold">Información de Transferencia</h4>
            <p className="text-xs opacity-70 bg-white/5 p-4 rounded-xl border border-white/10 font-mono whitespace-pre-line leading-relaxed">
              {config?.bank_details || 'BancoEstado | CuentaRUT: 12.345.678-9 | Email: pagos@tienda.cl'}
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center opacity-40 text-[11px] tracking-wider">
          {config?.footer_text || '© 2026 Tienda Demo. Todos los derechos reservados.'}
        </div>
      </div>
    </footer>
  )
}
