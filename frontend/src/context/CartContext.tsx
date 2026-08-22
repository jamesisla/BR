import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

export interface StoreConfig {
  name: string
  primary_color: string
  secondary_color: string
  footer_text: string
  logo_url?: string
  hero_title: string
  hero_subtitle: string
  hero_image_url?: string
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: any, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isCartOpen: boolean
  setIsCartOpen: (isOpen: boolean) => void
  isSearchOpen: boolean
  setIsSearchOpen: (isOpen: boolean) => void
  config: StoreConfig | null
  reloadConfig: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [config, setConfig] = useState<StoreConfig | null>(null)

  // Load configuration and apply theme
  const loadConfig = () => {
    fetch('/api/settings/')
      .then(res => res.json())
      .then(data => {
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
      })
      .catch(err => console.error('Error fetching settings:', err))
  }

  useEffect(() => {
    loadConfig()
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

  const addToCart = (product: any, quantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prevCart, {
        id: product.id,
        name: product.name,
        price: Number(product.base_price || 0),
        quantity: quantity,
        image: product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop'
      }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }

  const clearCart = () => setCart([])

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0)
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      clearCart, 
      totalItems, 
      totalPrice, 
      isCartOpen, 
      setIsCartOpen, 
      isSearchOpen, 
      setIsSearchOpen,
      config,
      reloadConfig: loadConfig
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
