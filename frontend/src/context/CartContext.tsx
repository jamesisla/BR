import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  id: string
  name: string
  slug?: string
  price: number
  quantity: number
  stock: number
  image: string
}

export interface CategoryItem {
  id: string
  name: string
  slug: string
  icon?: string
  order?: number
  is_active?: boolean
}

export interface StoreConfig {
  name: string
  primary_color: string
  secondary_color: string
  footer_text: string
  hero_size?: 'half' | 'full' | 'compact' | 'hidden'
  logo_url?: string
  hero_title: string
  hero_subtitle: string
  hero_image_url?: string
  whatsapp_number: string
  whatsapp_message?: string
  bank_details: string
  shipping_info?: string
  instagram_url?: string
  announcement_bar?: string
  announcement_active?: boolean
  currency: string
  payment_whatsapp_enabled?: boolean
  payment_mercadopago_enabled?: boolean
  mercadopago_public_key?: string
  mercadopago_access_token?: string
  mercadopago_sandbox?: boolean
  payment_flow_enabled?: boolean
  flow_api_key?: string
  flow_secret_key?: string
  flow_sandbox?: boolean
}

// Chilean Peso Formatter ($49.990 CLP)
export const formatCLP = (amount: number | string) => {
  const num = Number(amount) || 0
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(num)
}

// Limpiador universal de URLs de imágenes (corrige cualquier URL con localhost)
export const formatImageUrl = (url?: string) => {
  if (!url) return ''
  if (url.startsWith('http://localhost:8000')) {
    return url.replace('http://localhost:8000', '')
  }
  if (url.startsWith('http://localhost')) {
    return url.replace('http://localhost', '')
  }
  return url
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: any, quantity: number) => { success: boolean; message?: string }
  updateQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  getItemQuantityInCart: (productId: string) => number
  totalItems: number
  totalPrice: number
  isCartOpen: boolean
  setIsCartOpen: (isOpen: boolean) => void
  isSearchOpen: boolean
  setIsSearchOpen: (isOpen: boolean) => void
  config: StoreConfig | null
  categories: CategoryItem[]
  reloadConfig: () => void
  reloadCategories: () => void
  getWhatsAppOrderURL: (deliveryType: 'envio' | 'retiro', customerInfo?: { name: string, address: string, phone?: string }) => string
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [config, setConfig] = useState<StoreConfig | null>(null)
  const [categories, setCategories] = useState<CategoryItem[]>([])

  // Load configuration and apply theme
  const loadConfig = () => {
    fetch('/api/settings/')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setConfig(data)
          if (data.primary_color) {
            document.documentElement.style.setProperty('--primary', data.primary_color)
          }
          if (data.secondary_color) {
            document.documentElement.style.setProperty('--secondary', data.secondary_color)
          }
          if (data.name) {
            document.title = data.name
          }
        }
      })
      .catch(err => console.error('Error fetching settings:', err))
  }

  // Load active categories
  const loadCategories = () => {
    fetch('/api/categories/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data)
        }
      })
      .catch(err => console.error('Error fetching categories:', err))
  }

  useEffect(() => {
    loadConfig()
    loadCategories()
  }, [])

  // Load from LocalStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('tienda_cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error('Error loading cart', e)
      }
    }
  }, [])

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('tienda_cart', JSON.stringify(cart))
  }, [cart])

  const getItemQuantityInCart = (productId: string): number => {
    const item = cart.find(i => i.id === productId)
    return item ? item.quantity : 0
  }

  const addToCart = (product: any, quantity: number): { success: boolean; message?: string } => {
    const productStock = typeof product.stock === 'number' ? product.stock : 10

    if (productStock <= 0) {
      alert(`⚠️ Lo sentimos, "${product.name}" se encuentra agotado actualmente.`)
      return { success: false, message: 'Producto agotado' }
    }

    let addedSuccessfully = true
    let warningMsg: string | undefined

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      const currentQty = existingItem ? existingItem.quantity : 0
      const totalRequested = currentQty + quantity

      if (totalRequested > productStock) {
        const availableToAdd = Math.max(0, productStock - currentQty)
        if (availableToAdd <= 0) {
          alert(`⚠️ Ya tienes el máximo disponible (${productStock} unidades) de "${product.name}" en tu carrito.`)
          addedSuccessfully = false
          return prevCart
        } else {
          alert(`⚠️ Solo se agregaron ${availableToAdd} unidad(es) de "${product.name}" porque el stock total es de ${productStock} unidades.`)
          warningMsg = `Stock limitado a ${productStock}`
        }
      }

      const finalQuantity = Math.min(productStock, totalRequested)

      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: finalQuantity, stock: productStock }
            : item
        )
      }

      const coverImg = (Array.isArray(product.images) && product.images.length > 0)
        ? product.images[0]
        : (product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop')

      return [...prevCart, {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Math.round(Number(product.base_price || 0)),
        quantity: Math.min(productStock, quantity),
        stock: productStock,
        image: formatImageUrl(coverImg)
      }]
    })

    return { success: addedSuccessfully, message: warningMsg }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === productId) {
          const maxStock = typeof item.stock === 'number' ? item.stock : 999
          if (newQuantity > maxStock) {
            alert(`⚠️ No puedes agregar más de ${maxStock} unidades (límite de stock disponible).`)
            return { ...item, quantity: maxStock }
          }
          if (newQuantity < 1) {
            return { ...item, quantity: 1 }
          }
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }

  const clearCart = () => setCart([])

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0)
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)

  // Generate WhatsApp Order link with Chilean formatted message
  const getWhatsAppOrderURL = (deliveryType: 'envio' | 'retiro', customerInfo?: { name: string, address: string, phone?: string }) => {
    const rawNumber = config?.whatsapp_number || '+56912345678'
    const phone = rawNumber.replace(/[^0-9]/g, '')
    const storeName = config?.name || 'la tienda'

    let msg = `👋 ¡Hola! Me gustaría hacer un pedido en *${storeName}*:\n\n`
    msg += `📦 *Detalle del Pedido:*\n`
    cart.forEach(item => {
      msg += `• ${item.quantity}x ${item.name} (${formatCLP(item.price * item.quantity)})\n`
    })
    msg += `\n💰 *Total a Transferir:* ${formatCLP(totalPrice)}\n`
    msg += `🚚 *Modalidad:* ${deliveryType === 'envio' ? 'Envío a Domicilio' : 'Retiro en Tienda'}\n`

    if (customerInfo) {
      if (customerInfo.name) msg += `👤 *Cliente:* ${customerInfo.name}\n`
      if (customerInfo.address) msg += `📍 *Dirección/Comuna:* ${customerInfo.address}\n`
      if (customerInfo.phone) msg += `📞 *Teléfono:* ${customerInfo.phone}\n`
    }

    msg += `\n¿Me podrías compartir los datos de transferencia bancaria para realizar el pago? ¡Muchas gracias!`

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      updateQuantity,
      removeFromCart, 
      clearCart, 
      getItemQuantityInCart,
      totalItems, 
      totalPrice, 
      isCartOpen, 
      setIsCartOpen, 
      isSearchOpen, 
      setIsSearchOpen,
      config,
      categories,
      reloadConfig: loadConfig,
      reloadCategories: loadCategories,
      getWhatsAppOrderURL 
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
