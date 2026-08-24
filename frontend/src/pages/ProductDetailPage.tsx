import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingBag, ArrowLeft, MessageCircle, Truck, CreditCard, 
  ShieldCheck, Check, ChevronLeft, ChevronRight, Maximize2, X, ZoomIn,
  AlertCircle, AlertTriangle, Ban
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCart, formatCLP, formatImageUrl } from '../context/CartContext'

interface Product {
  id: string
  name: string
  description: string
  base_price: number
  slug: string
  image_url?: string
  images?: string[]
  stock: number
  category?: string
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const { addToCart, setIsCartOpen, getItemQuantityInCart, config } = useCart()

  useEffect(() => {
    if (slug) {
      fetch(`/api/products/${slug}`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setProduct(data)
            setActiveImageIndex(0)
            const availableStock = typeof data.stock === 'number' ? data.stock : 10
            setQuantity(availableStock <= 0 ? 0 : 1)
          }
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [slug])

  const maxStock = typeof product?.stock === 'number' ? product.stock : 10
  const isOutOfStock = maxStock <= 0
  const inCartCount = product ? getItemQuantityInCart(product.id) : 0

  // Aggregate images safely
  const galleryImages: string[] = React.useMemo(() => {
    if (!product) return []
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.map(img => formatImageUrl(img)).filter(Boolean)
    }
    if (product.image_url) {
      return [formatImageUrl(product.image_url)]
    }
    return ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop"]
  }, [product])

  const currentImage = galleryImages[activeImageIndex] || galleryImages[0]

  const nextImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setActiveImageIndex(prev => (prev + 1) % galleryImages.length)
  }, [galleryImages.length])

  const prevImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setActiveImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length)
  }, [galleryImages.length])

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return
      if (e.key === 'Escape') setIsLightboxOpen(false)
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, nextImage, prevImage])

  const handleAddToCart = () => {
    if (product) {
      if (isOutOfStock) {
        alert('⚠️ Este producto se encuentra agotado actualmente.')
        return
      }
      const res = addToCart(product, quantity)
      if (res.success) {
        setAdded(true)
        setTimeout(() => setAdded(false), 1500)
        setIsCartOpen(true)
      }
    }
  }

  const handleDirectWhatsApp = () => {
    if (!product) return
    const rawNumber = config?.whatsapp_number || '+56912345678'
    const phone = rawNumber.replace(/[^0-9]/g, '')
    const storeName = config?.name || 'la tienda'

    if (isOutOfStock) {
      const msg = `👋 ¡Hola! Me interesa saber cuándo tendrán nuevamente disponible el producto *${product.name}* en *${storeName}*. ¡Muchas gracias!`
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
      return
    }

    const total = Math.round(Number(product.base_price || 0) * quantity)
    let msg = `👋 ¡Hola! Me interesa comprar este producto en *${storeName}*:\n\n`
    msg += `📦 *Producto:* ${product.name}\n`
    msg += `🔢 *Cantidad:* ${quantity}\n`
    msg += `💰 *Precio Total:* ${formatCLP(total)}\n\n`
    msg += `¿Podrías facilitarme los datos de transferencia bancaria y opciones de envío/retiro? ¡Muchas gracias!`

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) return (
    <div className="container py-32 text-center text-slate-400 font-medium animate-pulse">
      Cargando detalles del producto...
    </div>
  )

  if (!product) return (
    <div className="container py-32 text-center">
      <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
      <Link to="/" className="text-xs uppercase font-bold tracking-widest text-slate-600 hover:text-slate-900">
        ← Volver al Catálogo
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6">
      <div className="container max-w-5xl">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft size={16} /> Volver al Catálogo
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-14 items-start">
          {/* Product Image Gallery */}
          <div className="w-full space-y-4">
            {/* Main Interactive Image Frame */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-[4/5] bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-lg group cursor-zoom-in"
              onClick={() => setIsLightboxOpen(true)}
            >
              <img 
                key={currentImage}
                src={currentImage} 
                alt={`${product.name} - Foto ${activeImageIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e: any) => {
                  e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop"
                }}
              />

              {/* Zoom badge indicator */}
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity shadow-lg">
                <Maximize2 size={13} />
                <span>Ver en grande</span>
              </div>

              {/* Prev / Next Arrows if multiple photos */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
                    title="Foto anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
                    title="Siguiente foto"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </motion.div>

            {/* Thumbnails Carousel (when 2+ images) */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 transition-all border-2 ${
                      idx === activeImageIndex 
                        ? 'border-slate-900 ring-2 ring-slate-900/20 scale-105 shadow-md' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col"
          >
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 block mb-2 capitalize">
              {product.category || 'General'}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
              {product.name}
            </h1>

            {/* Price and Stock Badge */}
            <div className="flex flex-wrap items-baseline gap-3 mb-2">
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 font-mono" style={{ color: 'var(--primary)' }}>
                {formatCLP(Number(product.base_price || 0) * (isOutOfStock ? 1 : quantity))}
                {quantity > 1 && !isOutOfStock && (
                  <span className="text-xs text-slate-400 font-sans font-normal ml-2">
                    ({formatCLP(product.base_price)} c/u)
                  </span>
                )}
              </p>
            </div>

            {/* Stock status alert badge */}
            <div className="mb-5">
              {isOutOfStock ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                  <Ban size={14} />
                  <span>Agotado / Sin Stock disponible</span>
                </div>
              ) : maxStock <= 5 ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <span>¡Últimas {maxStock} unidades disponibles en stock!</span>
                  {inCartCount > 0 && <span className="opacity-75 font-normal">({inCartCount} en tu carrito)</span>}
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                  <Check size={14} className="text-emerald-600" />
                  <span>Stock disponible: {maxStock} unidades</span>
                  {inCartCount > 0 && <span className="opacity-75 font-normal">({inCartCount} en tu carrito)</span>}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description || "Producto de excelente calidad. Stock garantizado para envío inmediato o retiro."}
            </div>

            {/* Quantity Selector with Stock Limits */}
            <div className="mb-6">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Cantidad</span>
                 {!isOutOfStock && (
                   <span className="text-[11px] text-slate-500 font-mono">
                     Máx permitido: <strong className="text-slate-800">{maxStock}</strong>
                   </span>
                 )}
               </div>
               <div className="flex items-center gap-4">
                  <div className={`flex items-center bg-white border rounded-xl p-1 shadow-sm ${isOutOfStock ? 'border-slate-100 opacity-50' : 'border-slate-200'}`}>
                     <button 
                       onClick={() => setQuantity(q => Math.max(1, q - 1))}
                       disabled={quantity <= 1 || isOutOfStock}
                       className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-lg ${
                         quantity <= 1 || isOutOfStock ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100'
                       }`}
                     >
                       -
                     </button>
                     <span className="w-12 text-center font-bold text-base text-slate-900 font-mono">
                       {isOutOfStock ? 0 : quantity}
                     </span>
                     <button 
                       onClick={() => setQuantity(q => Math.min(maxStock, q + 1))}
                       disabled={quantity >= maxStock || isOutOfStock}
                       className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-lg ${
                         quantity >= maxStock || isOutOfStock ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100'
                       }`}
                       title={quantity >= maxStock ? `Máximo ${maxStock} disponibles` : 'Aumentar'}
                     >
                       +
                     </button>
                  </div>
                  {quantity >= maxStock && !isOutOfStock && (
                    <span className="text-xs text-amber-600 font-medium">
                      Límite de stock alcanzado
                    </span>
                  )}
               </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
               <button 
                 onClick={handleDirectWhatsApp}
                 className={`flex-1 py-4 px-6 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                   isOutOfStock 
                     ? 'bg-slate-800 hover:bg-slate-900' 
                     : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                 }`}
               >
                 <MessageCircle size={18} /> {isOutOfStock ? 'Consultar Disponibilidad por WhatsApp' : 'Pedir Directo por WhatsApp'}
               </button>

               <button 
                 onClick={handleAddToCart}
                 disabled={isOutOfStock}
                 className={`py-4 px-6 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                   isOutOfStock 
                     ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                     : 'bg-slate-900 hover:bg-slate-800'
                 }`}
               >
                 {isOutOfStock ? (
                   <><Ban size={18} /> Agotado</>
                 ) : added ? (
                   <><Check size={18} /> ¡Agregado!</>
                 ) : (
                   <><ShoppingBag size={18} /> Al Carrito</>
                 )}
               </button>
            </div>

            {/* Guarantees & Transfer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
               <div className="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-100">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                     <CreditCard size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Transferencia Bancaria</h5>
                    <p className="text-[11px] text-slate-400">CuentaRUT o Cta Corriente</p>
                  </div>
               </div>

               <div className="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-100">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                     <Truck size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Envío / Retiro</h5>
                    <p className="text-[11px] text-slate-400">Coordinación por WhatsApp</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fullscreen High-Resolution Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-8 select-none">
            {/* Close button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-20"
              title="Cerrar (Esc)"
            >
              <X size={24} />
            </button>

            {/* Counter badge */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 text-white/80 font-mono text-xs px-3 py-1 bg-white/10 rounded-full z-20">
              {activeImageIndex + 1} / {galleryImages.length}
            </div>

            {/* Prev Arrow in Lightbox */}
            {galleryImages.length > 1 && (
              <button
                onClick={prevImage}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all z-20"
                title="Anterior"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Main Lightbox Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={currentImage}
                alt={product.name}
                className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl"
              />
            </motion.div>

            {/* Next Arrow in Lightbox */}
            {galleryImages.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all z-20"
                title="Siguiente"
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* Bottom thumbnail strip in Lightbox */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] p-2 bg-black/40 rounded-2xl z-20">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-12 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      idx === activeImageIndex ? 'border-white scale-105' : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
