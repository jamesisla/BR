import React from 'react'
import { Instagram, Facebook, Mail } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function Footer() {
  const { config } = useCart()

  return (
    <footer className="bg-[#111111] text-white pt-20 pb-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <h2 className="font-serif text-3xl md:text-4xl mb-4 text-white">Eleva tu experiencia.</h2>
            <p className="opacity-50 text-sm max-w-md mb-6 leading-relaxed">
              Descubre nuestra selección de productos diseñados con los más altos estándares de calidad y durabilidad.
            </p>
            <div className="flex gap-3 max-w-md">
              <input 
                type="email" 
                placeholder="Tu correo electrónico" 
                className="bg-white/5 border border-white/10 px-4 py-3 text-white text-xs rounded flex-1 focus:outline-none focus:border-white/30 transition-colors" 
              />
              <button className="btn-primary">Suscribirme</button>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-widest opacity-40 mb-6 font-bold">Navegación</h4>
            <ul className="list-none text-xs opacity-70 flex flex-col gap-3">
              <li><a href="/#productos" className="hover:text-white transition-colors">Catálogo Completo</a></li>
              <li><a href="/category/accesorios" className="hover:text-white transition-colors">Accesorios</a></li>
              <li><a href="/category/general" className="hover:text-white transition-colors">Novedades</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-widest opacity-40 mb-6 font-bold">Social</h4>
            <div className="flex gap-4 opacity-70">
              <a href="#" className="hover:opacity-100 hover:text-secondary transition-all"><Instagram size={20} /></a>
              <a href="#" className="hover:opacity-100 hover:text-secondary transition-all"><Facebook size={20} /></a>
              <a href="#" className="hover:opacity-100 hover:text-secondary transition-all"><Mail size={20} /></a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 text-center opacity-30 text-[11px] tracking-wider">
          {config?.footer_text || '© 2026 Tienda Artisan. Todos los derechos reservados.'}
        </div>
      </div>
    </footer>
  )
}
