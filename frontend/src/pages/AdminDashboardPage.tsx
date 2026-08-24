import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingBag, 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  X, 
  Save, 
  LogOut, 
  Eye, 
  EyeOff, 
  Camera,
  Loader2, 
  Settings as SettingsIcon, 
  Palette, 
  MessageCircle,
  CreditCard,
  Layers,
  Tag,
  Megaphone,
  Instagram,
  Truck,
  CheckCircle,
  Sparkles,
  BarChart3,
  Activity,
  Shield,
  Star,
  Images as ImagesIcon,
  Upload,
  Globe,
  Bell,
  Send,
  Printer
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, formatCLP, formatImageUrl } from '../context/CartContext'
import AdminAnalyticsTab from '../components/AdminAnalyticsTab'

// Compresor y Optimizador Retina/4K para Smartphones y Notebooks
async function compressImage(file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.88): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (readerEvent) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Escalado proporcional de alta fidelidad
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        // Suavizado bicúbico de máxima calidad para pantallas Retina y OLED
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Rellenar fondo blanco limpio para evitar fondo negro en PNGs transparentes
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_") + ".jpg"
              const newFile = new File([blob], cleanName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(newFile)
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = readerEvent.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { reloadConfig, reloadCategories } = useCart()
  
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'analytics' | 'settings'>('orders') 
  const [uploading, setUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)
  
  const [productImagePreview, setProductImagePreview] = useState<string>('')
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [heroPreview, setHeroPreview] = useState<string>('')

  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  
  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    icon: 'tag',
    order: 0
  })

  const [storeSettings, setStoreSettings] = useState({
    name: 'TIENDA DEMO PYME',
    logo_url: '',
    primary_color: '#2d1b0e',
    secondary_color: '#9c6644',
    footer_text: '© 2026 Tienda Demo. Venta directa por WhatsApp.',
    hero_size: 'half',
    hero_title: 'Emprende con Estilo',
    hero_subtitle: 'Catálogo digital para PYMEs. Haz tu pedido directo por WhatsApp con transferencia.',
    hero_image_url: '',
    whatsapp_number: '+56912345678',
    whatsapp_message: '¡Hola! Me gustaría hacer un pedido de:',
    bank_details: 'BancoEstado | CuentaRUT: 12.345.678-9 | Titular: Tienda Demo | Correo: pagos@tienda.cl',
    shipping_info: 'Envíos a todo Chile vía Starken / Chilexpress o retiro acordado por WhatsApp.',
    instagram_url: '',
    announcement_bar: '🚚 ¡Envíos a todo Chile! Paga fácil y seguro con Transferencia Bancaria',
    announcement_active: true,
    currency: 'CLP',
    analytics_enabled: true,
    ignore_admin_visits: false,
    payment_whatsapp_enabled: true,
    payment_mercadopago_enabled: false,
    mercadopago_public_key: '',
    mercadopago_access_token: '',
    mercadopago_sandbox: true,
    payment_flow_enabled: false,
    flow_api_key: '',
    flow_secret_key: '',
    flow_sandbox: true,
    telegram_notifications_enabled: false,
    telegram_bot_token: '',
    telegram_chat_id: ''
  })

  const [testingTelegram, setTestingTelegram] = useState(false)

  const [productForm, setProductForm] = useState<{
    name: string
    slug: string
    description: string
    category: string
    base_price: number
    stock: number
    image_url: string
    images: string[]
  }>({
    name: '',
    slug: '',
    description: '',
    category: 'general',
    base_price: 19990,
    stock: 10,
    image_url: '',
    images: []
  })

  const [newImageUrlInput, setNewImageUrlInput] = useState('')

  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    activeProducts: 0
  })

  // Auth Guard
  useEffect(() => {
    const token = localStorage.getItem('tienda_admin_token')
    if (!token) {
      navigate('/admin/login')
    } else {
      fetchData()
      fetchCategories()
      fetchSettings()
    }
  }, [])

  // Dynamic Document Title
  useEffect(() => {
    document.title = storeSettings?.name ? `Admin | ${storeSettings.name}` : 'Admin'
  }, [storeSettings?.name])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/')
      const data = await res.json()
      if (data) {
        setStoreSettings({
          name: data.name || 'TIENDA DEMO PYME',
          logo_url: data.logo_url || '',
          primary_color: data.primary_color || '#2d1b0e',
          secondary_color: data.secondary_color || '#9c6644',
          footer_text: data.footer_text || '© 2026 Tienda Demo. Venta directa por WhatsApp.',
          hero_size: data.hero_size || 'half',
          hero_title: data.hero_title || 'Emprende con Estilo',
          hero_subtitle: data.hero_subtitle || 'Catálogo digital para PYMEs. Haz tu pedido directo por WhatsApp con transferencia.',
          hero_image_url: data.hero_image_url || '',
          whatsapp_number: data.whatsapp_number || '+56912345678',
          whatsapp_message: data.whatsapp_message || '¡Hola! Me gustaría hacer un pedido de:',
          bank_details: data.bank_details || 'BancoEstado | CuentaRUT: 12.345.678-9 | Titular: Tienda Demo | Correo: pagos@tienda.cl',
          shipping_info: data.shipping_info || 'Envíos a todo Chile vía Starken / Chilexpress o retiro acordado por WhatsApp.',
          instagram_url: data.instagram_url || '',
          announcement_bar: data.announcement_bar || '🚚 ¡Envíos a todo Chile! Paga fácil y seguro con Transferencia Bancaria',
          announcement_active: data.announcement_active !== false,
          currency: data.currency || 'CLP',
          analytics_enabled: data.analytics_enabled !== false,
          ignore_admin_visits: data.ignore_admin_visits === true,
          payment_whatsapp_enabled: data.payment_whatsapp_enabled !== false,
          payment_mercadopago_enabled: data.payment_mercadopago_enabled === true,
          mercadopago_public_key: data.mercadopago_public_key || '',
          mercadopago_access_token: data.mercadopago_access_token || '',
          mercadopago_sandbox: data.mercadopago_sandbox !== false,
          payment_flow_enabled: data.payment_flow_enabled === true,
          flow_api_key: data.flow_api_key || '',
          flow_secret_key: data.flow_secret_key || '',
          flow_sandbox: data.flow_sandbox !== false,
          telegram_notifications_enabled: data.telegram_notifications_enabled === true,
          telegram_bot_token: data.telegram_bot_token || '',
          telegram_chat_id: data.telegram_chat_id || ''
        })
        setLogoPreview(data.logo_url || '')
        setHeroPreview(data.hero_image_url || '')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories/?all=true')
      const data = await res.json()
      if (Array.isArray(data)) {
        setCategories(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/orders/'),
        fetch('/api/products/all')
      ])
      
      const ordersData = await ordersRes.json()
      const productsData = await productsRes.json()
      
      const ords = Array.isArray(ordersData) ? ordersData : []
      const prods = Array.isArray(productsData) ? productsData : []
      
      setOrders(ords)
      setProducts(prods)
      
      const sales = ords.reduce((acc: number, curr: any) => acc + Number(curr.total || 0), 0)
      const pending = ords.filter((o: any) => o.status === 'pending').length
      const active = prods.filter((p: any) => p.is_active).length
      
      setStats({
        totalSales: sales,
        pendingOrders: pending,
        activeProducts: active
      })
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('tienda_admin_token')
    navigate('/admin/login')
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/orders/${orderId}/status?status=${newStatus}`, {
        method: 'PATCH'
      })
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const toggleProductStatus = async (productId: string) => {
    try {
      await fetch(`/api/products/${productId}/toggle-active`, {
        method: 'PATCH'
      })
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const deleteProductPermanent = async (productId: string) => {
    if (!confirm('¿Eliminar este producto de forma definitiva?')) return
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const openProductModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product)
      const rawImgs = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : (product.image_url ? [product.image_url] : [])

      setProductForm({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        category: product.category || 'general',
        base_price: Math.round(Number(product.base_price || 0)),
        stock: product.stock || 0,
        image_url: product.image_url || (rawImgs[0] || ''),
        images: rawImgs
      })
      setProductImagePreview(rawImgs[0] || '')
    } else {
      setEditingProduct(null)
      setProductForm({
        name: '',
        slug: '',
        description: '',
        category: categories.length > 0 ? categories[0].slug : 'general',
        base_price: 19990,
        stock: 10,
        image_url: '',
        images: []
      })
      setProductImagePreview('')
    }
    setNewImageUrlInput('')
    setIsModalOpen(true)
  }

  // Categories CRUD Handlers
  const openCategoryModal = (cat: any = null) => {
    if (cat) {
      setEditingCategory(cat)
      setCategoryForm({
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon || 'tag',
        order: cat.order || 0
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({
        name: '',
        slug: '',
        icon: 'tag',
        order: categories.length + 1
      })
    }
    setIsCategoryModalOpen(true)
  }

  const handleCategoryNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    setCategoryForm(prev => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : slug
    }))
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingCategory ? 'PUT' : 'POST'
    const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories/'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      })

      if (res.ok) {
        setIsCategoryModalOpen(false)
        fetchCategories()
        reloadCategories()
      } else {
        const data = await res.json()
        alert('Error al guardar categoría: ' + (data.detail || 'Verifique los datos'))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const toggleCategoryStatus = async (catId: string) => {
    try {
      await fetch(`/api/categories/${catId}/toggle-active`, { method: 'PATCH' })
      fetchCategories()
      reloadCategories()
    } catch (e) {
      console.error(e)
    }
  }

  const deleteCategoryPermanent = async (catId: string) => {
    if (!confirm('¿Eliminar esta categoría? Los productos asociados permanecerán pero sin categoría activa.')) return
    try {
      await fetch(`/api/categories/${catId}`, { method: 'DELETE' })
      fetchCategories()
      reloadCategories()
    } catch (e) {
      console.error(e)
    }
  }

  // Generar Slug automático al escribir el nombre del producto
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    setProductForm(prev => ({
      ...prev,
      name,
      slug: editingProduct ? prev.slug : slug
    }))
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (uploading) {
      alert('Por favor espera un momento a que las fotos terminen de subirse.')
      return
    }

    const currentImages = productForm.images || []
    let finalImageUrl = productForm.image_url || (currentImages[0] || '')

    const method = editingProduct ? 'PUT' : 'POST'
    const url = editingProduct 
      ? `/api/products/${editingProduct.id}`
      : `/api/products/`

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productForm,
          image_url: finalImageUrl,
          images: currentImages,
          base_price: Math.round(Number(productForm.base_price))
        })
      })

      if (response.ok) {
        setIsModalOpen(false)
        fetchData()
      } else {
        const errData = await response.json()
        alert('Error al guardar: ' + (errData.detail || 'Verifique los campos'))
      }
    } catch (error) {
      console.error(error)
      alert('Error de conexión con el servidor')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        // 1. Comprimir y optimizar a resolución Retina 1600px en el navegador
        const compressed = await compressImage(file, 1600, 1600, 0.88)

        // 2. Subir archivo al backend
        const formData = new FormData()
        formData.append('file', compressed)

        const response = await fetch('/api/products/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          if (data.url) {
            uploadedUrls.push(data.url)
          }
        } else {
          const errData = await response.json().catch(() => ({}))
          console.error('Error al subir una de las imágenes:', errData)
        }
      }

      if (uploadedUrls.length > 0) {
        setProductForm(prev => {
          const nextImages = [...(prev.images || []), ...uploadedUrls]
          return {
            ...prev,
            images: nextImages,
            image_url: nextImages[0] || prev.image_url
          }
        })
        setProductImagePreview(prev => prev || uploadedUrls[0])
      }
    } catch (error: any) {
      console.error(error)
      alert('Error al procesar/subir imagen: ' + error.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setProductForm(prev => {
      const nextImages = prev.images.filter((_, idx) => idx !== indexToRemove)
      const nextCover = nextImages[0] || ''
      return {
        ...prev,
        images: nextImages,
        image_url: nextCover
      }
    })
  }

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    setProductForm(prev => {
      const target = prev.images[indexToPrimary]
      const remaining = prev.images.filter((_, idx) => idx !== indexToPrimary)
      const nextImages = [target, ...remaining]
      return {
        ...prev,
        images: nextImages,
        image_url: target
      }
    })
    setProductImagePreview(productForm.images[indexToPrimary])
  }

  const handleAddImageUrl = () => {
    const trimmed = newImageUrlInput.trim()
    if (!trimmed) return
    setProductForm(prev => {
      const nextImages = [...(prev.images || []), trimmed]
      return {
        ...prev,
        images: nextImages,
        image_url: nextImages[0] || ''
      }
    })
    setNewImageUrlInput('')
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoUploading(true)
    try {
      const compressed = await compressImage(file, 800, 800, 0.92)
      const preview = URL.createObjectURL(compressed)
      setLogoPreview(preview)

      const formData = new FormData()
      formData.append('file', compressed)

      const response = await fetch('/api/products/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setStoreSettings(prev => ({ ...prev, logo_url: data.url }))
        setLogoPreview(data.url)
      } else {
        const errData = await response.json().catch(() => ({}))
        alert('Error al subir logo: ' + (errData.detail || response.statusText))
      }
    } catch (error: any) {
      console.error(error)
      alert('Error de conexión al subir logo: ' + error.message)
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setHeroUploading(true)
    try {
      const compressed = await compressImage(file, 2048, 1200, 0.88)
      const preview = URL.createObjectURL(compressed)
      setHeroPreview(preview)

      const formData = new FormData()
      formData.append('file', compressed)

      const response = await fetch('/api/products/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setStoreSettings(prev => ({ ...prev, hero_image_url: data.url }))
        setHeroPreview(data.url)
      } else {
        const errData = await response.json().catch(() => ({}))
        alert('Error al subir portada: ' + (errData.detail || response.statusText))
      }
    } catch (error: any) {
      console.error(error)
      alert('Error de conexión al subir portada: ' + error.message)
    } finally {
      setHeroUploading(false)
      e.target.value = ''
    }
  }

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (logoUploading || heroUploading) {
      alert('Por favor espera a que las fotos terminen de subirse.')
      return
    }

    try {
      const res = await fetch('/api/settings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeSettings)
      })
      if (res.ok) {
        alert('¡Configuración de la tienda guardada con éxito!')
        reloadConfig()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleTestTelegram = async () => {
    if (!storeSettings.telegram_bot_token || !storeSettings.telegram_chat_id) {
      alert('⚠️ Por favor ingresa el Bot Token y el Chat ID antes de realizar la prueba.')
      return
    }

    setTestingTelegram(true)
    try {
      const res = await fetch('/api/settings/test-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_token: storeSettings.telegram_bot_token,
          chat_id: storeSettings.telegram_chat_id
        })
      })
      const data = await res.json()
      if (res.ok) {
        alert('🎉 ' + (data.message || '¡Mensaje enviado con éxito a tu Telegram! Revisa la app en tu teléfono.'))
      } else {
        alert('❌ Error al enviar mensaje: ' + (data.detail || 'Verifica que el Bot Token y Chat ID sean válidos.'))
      }
    } catch (e: any) {
      alert('❌ Error de conexión: ' + (e?.message || 'No se pudo contactar al servidor'))
    } finally {
      setTestingTelegram(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row pb-24 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 p-6 flex-col gap-6 h-screen sticky top-0">
        <div>
           <h2 className="font-serif text-lg font-bold text-slate-800 tracking-tight truncate" title={storeSettings.name || 'Admin'}>
             {storeSettings.name || 'Admin'}
           </h2>
           <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">Panel de Control</p>
        </div>

        <nav className="flex flex-col gap-1.5">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider transition-all ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ShoppingBag size={18} />
            <span>Pedidos</span>
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider transition-all ${activeTab === 'products' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Package size={18} />
            <span>Productos</span>
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider transition-all ${activeTab === 'categories' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Layers size={18} />
            <span>Categorías</span>
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider transition-all ${activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <BarChart3 size={18} />
            <span>Visitas & Métricas</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider transition-all ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <SettingsIcon size={18} />
            <span>Configuración</span>
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-slate-100">
           <Link to="/" target="_blank" className="flex items-center gap-2.5 text-slate-400 hover:text-slate-900 text-xs font-bold uppercase tracking-wider transition-colors">
              <ExternalLink size={16} />
              <span>Ver Tienda</span>
           </Link>
           <button onClick={handleLogout} className="flex items-center gap-2.5 text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-wider transition-colors text-left">
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 md:p-10 max-w-7xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block md:hidden">Panel de Control</span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 capitalize">
              {activeTab === 'orders' ? 'Gestión de Pedidos' : 
               activeTab === 'products' ? 'Catálogo de Productos' : 
               activeTab === 'categories' ? 'Gestión de Categorías' : 
               activeTab === 'analytics' ? 'Analítica & Visitas al Sitio' : 'Personalización de Tienda'}
            </h1>
          </div>
          
          <div className="flex gap-2">
            <Link to="/" target="_blank" className="md:hidden p-2.5 bg-slate-100 text-slate-700 rounded-xl" title="Ver Tienda">
              <ExternalLink size={18} />
            </Link>
            {activeTab === 'products' && (
              <button 
                onClick={() => openProductModal()}
                className="btn-primary !py-2.5 !px-4 text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Plus size={16} /> <span className="hidden sm:inline">Añadir Producto</span><span className="sm:hidden">Nuevo</span>
              </button>
            )}
            {activeTab === 'categories' && (
              <button 
                onClick={() => openCategoryModal()}
                className="btn-primary !py-2.5 !px-4 text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Plus size={16} /> <span className="hidden sm:inline">Añadir Categoría</span><span className="sm:hidden">Nueva</span>
              </button>
            )}
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6">
          <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate">Ventas</h4>
            <p className="text-sm sm:text-2xl font-bold text-slate-900 mt-1 font-mono">{formatCLP(stats.totalSales)}</p>
          </div>

          <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate">Pendientes</h4>
            <p className="text-sm sm:text-2xl font-bold text-amber-600 mt-1 font-mono">{stats.pendingOrders}</p>
          </div>

          <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate">Productos</h4>
            <p className="text-sm sm:text-2xl font-bold text-slate-900 mt-1 font-mono">{stats.activeProducts}</p>
          </div>
        </div>

        {/* Tab Content Container */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 sm:p-6">
          {/* ORDERS TAB */}
          {activeTab === 'orders' ? (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs font-medium">
                  No hay pedidos registrados por el momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {orders.map((order: any) => (
                    <div key={order.id} className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs font-mono text-slate-900">PEDIDO #{order.id.substring(0, 6).toUpperCase()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {order.status === 'paid' ? 'Pagado' : order.status === 'shipped' ? 'Enviado' : order.status === 'cancelled' ? 'Cancelado' : 'Pendiente Transferencia'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-semibold">{order.first_name} {order.last_name}</p>
                        <p className="text-[11px] text-slate-400">{order.address} • {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                        <span className="font-bold text-base text-slate-900 font-mono">{formatCLP(order.total)}</span>
                        <div className="flex gap-1.5 items-center">
                          <a
                            href={`/checkout/success?order_id=${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                            title="Ver e Imprimir Comprobante PDF"
                          >
                            <Printer size={15} />
                          </a>
                          {order.status === 'pending' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'paid')}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                              title="Marcar como pagado"
                            >
                              Confirmar Pago
                            </button>
                          )}
                          {order.status === 'paid' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'shipped')}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                            >
                              Marcar Enviado
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'categories' ? (
            /* CATEGORIES TAB */
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                 <div>
                    <h3 className="font-bold text-base text-slate-900">Categorías de la Tienda</h3>
                    <p className="text-xs text-slate-400">Organiza tus productos en secciones visibles en la barra superior.</p>
                 </div>
                 <button 
                    onClick={() => openCategoryModal()}
                    className="btn-primary !py-2.5 !px-4 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                 >
                    <Plus size={16} /> Añadir Categoría
                 </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat: any) => {
                  const prodCount = products.filter(p => p.category?.toLowerCase() === cat.slug?.toLowerCase()).length
                  return (
                    <div key={cat.id} className={`p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between ${!cat.is_active ? 'opacity-40' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                           <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold">
                              <Tag size={16} />
                           </div>
                           <div>
                              <h4 className="font-bold text-sm text-slate-900 capitalize">{cat.name}</h4>
                              <span className="text-[10px] font-mono text-slate-400">/{cat.slug}</span>
                           </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                           {prodCount} prods
                        </span>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-slate-200 justify-end">
                        <button 
                          onClick={() => openCategoryModal(cat)}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <Edit3 size={14} /> Editar
                        </button>
                        <button 
                          onClick={() => toggleCategoryStatus(cat.id)}
                          className={`p-2 rounded-xl border ${cat.is_active ? 'border-slate-200 text-slate-400 hover:text-red-500' : 'border-emerald-200 text-emerald-600 bg-emerald-50'}`}
                          title={cat.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {cat.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button 
                          onClick={() => deleteCategoryPermanent(cat.id)}
                          className="p-2 border border-slate-200 text-slate-300 hover:text-red-600 rounded-xl"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : activeTab === 'analytics' ? (
            /* ANALYTICS & VISITS TAB */
            <AdminAnalyticsTab onSettingsUpdated={fetchSettings} />
          ) : activeTab === 'settings' ? (
            /* SETTINGS TAB */
            <div className="max-w-2xl mx-auto py-2">
                <form onSubmit={handleSettingsSubmit} className="space-y-6">
                  {/* Analytics & Visitor Telemetry Options */}
                  <div className="p-5 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                        <BarChart3 size={18} className="text-purple-600" /> Analítica y Métricas de Visitas
                      </h3>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-950">
                        <input 
                          type="checkbox" 
                          checked={storeSettings.analytics_enabled}
                          onChange={(e) => setStoreSettings({...storeSettings, analytics_enabled: e.target.checked})}
                          className="rounded border-purple-300 text-purple-900 focus:ring-0 w-4 h-4"
                        />
                        <span>{storeSettings.analytics_enabled ? 'Habilitado' : 'Deshabilitado'}</span>
                      </label>
                    </div>
                    <p className="text-xs text-purple-800/80">
                      Guarda información estadística y técnica de clientes (dispositivos, ubicaciones, páginas más visitadas y fuentes de tráfico).
                    </p>
                    <div className="pt-2 border-t border-purple-100">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-purple-900">
                        <input 
                          type="checkbox" 
                          checked={storeSettings.ignore_admin_visits}
                          onChange={(e) => setStoreSettings({...storeSettings, ignore_admin_visits: e.target.checked})}
                          className="rounded border-purple-300 text-purple-900 focus:ring-0 w-4 h-4"
                        />
                        <span>Ignorar mis visitas como administrador (para no alterar estadísticas)</span>
                      </label>
                    </div>
                  </div>

                  {/* Announcement Bar */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                     <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                           <Megaphone size={18} className="text-emerald-600" /> Barra de Anuncios Superior
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                           <input 
                              type="checkbox" 
                              checked={storeSettings.announcement_active}
                              onChange={(e) => setStoreSettings({...storeSettings, announcement_active: e.target.checked})}
                              className="rounded border-slate-300 text-slate-900 focus:ring-0 w-4 h-4"
                           />
                           <span>{storeSettings.announcement_active ? 'Visible' : 'Oculta'}</span>
                        </label>
                     </div>
                     <input 
                        type="text" 
                        value={storeSettings.announcement_bar}
                        onChange={(e) => setStoreSettings({...storeSettings, announcement_bar: e.target.value})}
                        placeholder="Ej: 🚚 ¡Envíos gratis sobre $30.000 a todo Chile!"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                     />
                  </div>

                  {/* WhatsApp Sales Flow */}
                  <div className="p-5 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                    <h3 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                       <MessageCircle size={18} className="text-emerald-600" /> Canal de Ventas por WhatsApp
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1">Número de WhatsApp (con código +569)</label>
                        <input 
                          type="text" 
                          value={storeSettings.whatsapp_number}
                          onChange={(e) => setStoreSettings({...storeSettings, whatsapp_number: e.target.value})}
                          placeholder="+56912345678"
                          className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl font-bold font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1">Mensaje de Inicio</label>
                        <input 
                          type="text" 
                          value={storeSettings.whatsapp_message}
                          onChange={(e) => setStoreSettings({...storeSettings, whatsapp_message: e.target.value})}
                          placeholder="¡Hola! Me gustaría hacer un pedido de:"
                          className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="p-5 bg-amber-50/60 border border-amber-100 rounded-2xl">
                    <h3 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                       <CreditCard size={18} className="text-amber-600" /> Datos Bancarios para Transferencia (Chile)
                    </h3>
                    <p className="text-xs text-amber-700/80 mb-3">Estos datos se le solicitarán al cliente para acordar el pago por WhatsApp.</p>
                    <textarea 
                      rows={2}
                      value={storeSettings.bank_details}
                      onChange={(e) => setStoreSettings({...storeSettings, bank_details: e.target.value})}
                      placeholder="BancoEstado | CuentaRUT: 12.345.678-9 | Titular: Tu Nombre | Email: pagos@tuemail.cl"
                      className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  {/* Shipping Info */}
                  <div className="p-5 bg-blue-50/60 border border-blue-100 rounded-2xl">
                    <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                       <Truck size={18} className="text-blue-600" /> Información de Envíos y Retiros
                    </h3>
                    <input 
                      type="text"
                      value={storeSettings.shipping_info}
                      onChange={(e) => setStoreSettings({...storeSettings, shipping_info: e.target.value})}
                      placeholder="Envíos a todo Chile vía Starken / Chilexpress o retiro acordado por WhatsApp."
                      className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-xs"
                    />
                  </div>

                  {/* Branding Section */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                       <Palette size={18} className="text-slate-400" /> Nombre, Logo & Portada
                    </h3>
                    
                    <div className="space-y-4">
                       <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Nombre de la Tienda</label>
                          <input 
                            type="text" 
                            value={storeSettings.name}
                            onChange={(e) => setStoreSettings({...storeSettings, name: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                          />
                       </div>

                       <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Logo de la Tienda</label>
                          <div className="flex gap-4 items-center">
                             <div className="w-16 h-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden relative">
                                {(logoPreview || storeSettings.logo_url) ? (
                                  <img src={formatImageUrl(logoPreview || storeSettings.logo_url)} className="w-full h-full object-contain" alt="Logo" />
                                ) : (
                                  <Palette className="text-slate-300" size={24} />
                                )}
                                {logoUploading && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                     <Loader2 className="animate-spin text-white" size={16} />
                                  </div>
                                )}
                             </div>
                             <div className="flex-1">
                                <label className="cursor-pointer px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-md">
                                  <input 
                                    type="file" 
                                    onChange={handleLogoUpload}
                                    className="sr-only" 
                                    accept="image/*"
                                    disabled={logoUploading}
                                  />
                                  {logoUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                                  <span>{logoUploading ? 'Subiendo...' : 'Subir Logo (Foto/Galería)'}</span>
                                </label>
                             </div>
                          </div>
                       </div>

                       {/* Portada Hero Banner */}
                       <div className="pt-4 border-t border-slate-100">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Imagen de Portada (Hero Banner Retina/4K)</label>
                          <label className="cursor-pointer block w-full h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden hover:border-slate-400 transition-all relative mb-3">
                             {(heroPreview || storeSettings.hero_image_url) ? (
                               <img src={formatImageUrl(heroPreview || storeSettings.hero_image_url)} className="w-full h-full object-cover" alt="Portada" />
                             ) : (
                               <div className="flex flex-col items-center justify-center h-full gap-1.5 text-slate-400">
                                  <Camera size={28} />
                                  <span className="text-[11px] font-bold uppercase tracking-wider">Toca para Subir Foto de Portada</span>
                               </div>
                             )}
                             <input type="file" className="sr-only" onChange={handleHeroUpload} accept="image/*" disabled={heroUploading} />
                             {heroUploading && (
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Loader2 className="animate-spin text-white" size={24} />
                               </div>
                             )}
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Título de Portada</label>
                                <input 
                                  type="text" 
                                  value={storeSettings.hero_title}
                                  onChange={(e) => setStoreSettings({...storeSettings, hero_title: e.target.value})}
                                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-serif"
                                />
                             </div>
                             <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Subtítulo de Portada</label>
                                <input 
                                   type="text" 
                                   value={storeSettings.hero_subtitle}
                                   onChange={(e) => setStoreSettings({...storeSettings, hero_subtitle: e.target.value})}
                                   className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                                 />
                              </div>
                           </div>

                           {/* Tamaño y Altura del Banner Portada */}
                           <div className="mt-3 pt-3 border-t border-slate-100">
                             <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1.5">
                               Tamaño y Altura del Banner Portada (Hero)
                             </label>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                               <button
                                 type="button"
                                 onClick={() => setStoreSettings({...storeSettings, hero_size: 'half'})}
                                 className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                   (storeSettings.hero_size || 'half') === 'half'
                                     ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                     : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                 }`}
                               >
                                 <span className="text-xs font-bold block">📱 Mitad Pantalla</span>
                                 <span className="text-[9px] opacity-80 block leading-tight mt-0.5">Recomendado. Muestra productos arriba.</span>
                               </button>

                               <button
                                 type="button"
                                 onClick={() => setStoreSettings({...storeSettings, hero_size: 'full'})}
                                 className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                   storeSettings.hero_size === 'full'
                                     ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                     : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                 }`}
                               >
                                 <span className="text-xs font-bold block">🖼️ Completa</span>
                                 <span className="text-[9px] opacity-80 block leading-tight mt-0.5">Banner grande e inmersivo (80% pantalla).</span>
                               </button>

                               <button
                                 type="button"
                                 onClick={() => setStoreSettings({...storeSettings, hero_size: 'compact'})}
                                 className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                   storeSettings.hero_size === 'compact'
                                     ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                     : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                 }`}
                               >
                                 <span className="text-xs font-bold block">⚡ Compacto</span>
                                 <span className="text-[9px] opacity-80 block leading-tight mt-0.5">Barra delgada tipo encabezado (30% pantalla).</span>
                               </button>

                               <button
                                 type="button"
                                 onClick={() => setStoreSettings({...storeSettings, hero_size: 'hidden'})}
                                 className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                   storeSettings.hero_size === 'hidden'
                                     ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                     : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                 }`}
                               >
                                 <span className="text-xs font-bold block">🚫 Ocultar</span>
                                 <span className="text-[9px] opacity-80 block leading-tight mt-0.5">Sin portada. Va directo al catálogo.</span>
                               </button>
                             </div>
                           </div>
                        </div>

                       {/* Footer Copyright Text */}
                       <div className="pt-4 border-t border-slate-100">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Texto del Pie de Página (Footer / Copyright)</label>
                          <input 
                            type="text" 
                            value={storeSettings.footer_text}
                            onChange={(e) => setStoreSettings({...storeSettings, footer_text: e.target.value})}
                            placeholder="© 2026 Mi Tienda. Todos los derechos reservados."
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          />
                       </div>

                       {/* Instagram URL */}
                       <div className="pt-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Enlace de Instagram (Opcional)</label>
                          <input 
                            type="text" 
                            value={storeSettings.instagram_url}
                            onChange={(e) => setStoreSettings({...storeSettings, instagram_url: e.target.value})}
                            placeholder="https://instagram.com/tutienda"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          />
                       </div>

                       {/* Colores */}
                       <div className="grid grid-cols-2 gap-3 pt-2">
                         <div>
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Color Principal</label>
                            <div className="flex gap-2 items-center">
                               <input 
                                  type="color" 
                                  value={storeSettings.primary_color}
                                  onChange={(e) => setStoreSettings({...storeSettings, primary_color: e.target.value})}
                                  className="h-10 w-10 rounded-xl border-none cursor-pointer"
                               />
                               <span className="font-mono text-xs text-slate-600">{storeSettings.primary_color}</span>
                            </div>
                         </div>

                         <div>
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Color Secundario</label>
                            <div className="flex gap-2 items-center">
                               <input 
                                  type="color" 
                                  value={storeSettings.secondary_color}
                                  onChange={(e) => setStoreSettings({...storeSettings, secondary_color: e.target.value})}
                                  className="h-10 w-10 rounded-xl border-none cursor-pointer"
                               />
                               <span className="font-mono text-xs text-slate-600">{storeSettings.secondary_color}</span>
                            </div>
                         </div>
                       </div>
                    </div>
                  </div>

                  {/* SECCIÓN MODULAR DE MEDIOS Y PASARELAS DE PAGO */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                             <CreditCard size={18} className="text-emerald-600" /> Pasarelas y Medios de Pago
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                             Activa o desactiva las opciones de cobro disponibles para tus clientes en el checkout.
                          </p>
                        </div>
                      </div>

                      {/* Módulo 1: WhatsApp y Transferencia Bancaria Manual */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                               <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                                  <MessageCircle size={18} />
                               </div>
                               <div>
                                  <h5 className="font-bold text-xs text-slate-900">Transferencia Bancaria & Pedidos por WhatsApp</h5>
                                  <p className="text-[11px] text-slate-400">Ventas directas sin comisión de pasarelas (CuentaRUT / Cta Corriente)</p>
                               </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                               <input 
                                  type="checkbox" 
                                  checked={storeSettings.payment_whatsapp_enabled} 
                                  onChange={(e) => setStoreSettings({...storeSettings, payment_whatsapp_enabled: e.target.checked})} 
                                  className="sr-only peer"
                               />
                               <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                         </div>

                         {storeSettings.payment_whatsapp_enabled && (
                            <div className="pt-2 border-t border-slate-200/60">
                               <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">
                                  Datos de Transferencia Bancaria (CuentaRUT / Banco / Titular)
                               </label>
                               <textarea 
                                  value={storeSettings.bank_details}
                                  onChange={(e) => setStoreSettings({...storeSettings, bank_details: e.target.value})}
                                  rows={2}
                                  placeholder="BancoEstado | CuentaRUT: 12.345.678-9 | Titular: ... | Correo: ..."
                                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs"
                               />
                            </div>
                         )}
                      </div>

                      {/* Módulo 2: Mercado Pago (Checkout Pro) */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                               <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                                  <CreditCard size={18} />
                               </div>
                               <div>
                                  <h5 className="font-bold text-xs text-slate-900">Mercado Pago (Tarjetas Débito y Crédito)</h5>
                                  <p className="text-[11px] text-slate-400">Cobro automático con Redcompra, Visa, Mastercard, Mach y Cuotas</p>
                               </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                               <input 
                                  type="checkbox" 
                                  checked={storeSettings.payment_mercadopago_enabled} 
                                  onChange={(e) => setStoreSettings({...storeSettings, payment_mercadopago_enabled: e.target.checked})} 
                                  className="sr-only peer"
                               />
                               <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                         </div>

                         {storeSettings.payment_mercadopago_enabled && (
                            <div className="pt-3 border-t border-slate-200/60 space-y-3">
                               <div className="flex items-center justify-between bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 text-xs">
                                  <span className="font-bold text-blue-900">Modo de Pruebas (Sandbox):</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                     <input 
                                        type="checkbox" 
                                        checked={storeSettings.mercadopago_sandbox} 
                                        onChange={(e) => setStoreSettings({...storeSettings, mercadopago_sandbox: e.target.checked})} 
                                        className="sr-only peer"
                                     />
                                     <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                                  </label>
                               </div>

                               <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Access Token (Producción o Sandbox)</label>
                                  <input 
                                     type="password"
                                     value={storeSettings.mercadopago_access_token}
                                     onChange={(e) => setStoreSettings({...storeSettings, mercadopago_access_token: e.target.value})}
                                     placeholder="APP_USR-..."
                                     className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                                  />
                               </div>

                               <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Public Key (Opcional)</label>
                                  <input 
                                     type="text"
                                     value={storeSettings.mercadopago_public_key}
                                     onChange={(e) => setStoreSettings({...storeSettings, mercadopago_public_key: e.target.value})}
                                     placeholder="APP_USR-..."
                                     className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                                  />
                               </div>
                            </div>
                         )}
                      </div>

                      {/* Módulo 3: Flow.cl */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                               <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                                  <Globe size={18} />
                               </div>
                               <div>
                                  <h5 className="font-bold text-xs text-slate-900">Flow.cl (Webpay Plus, Servipag, Multicaja)</h5>
                                  <p className="text-[11px] text-slate-400">Pasarela chilena multicanal</p>
                               </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                               <input 
                                  type="checkbox" 
                                  checked={storeSettings.payment_flow_enabled} 
                                  onChange={(e) => setStoreSettings({...storeSettings, payment_flow_enabled: e.target.checked})} 
                                  className="sr-only peer"
                               />
                               <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                         </div>

                         {storeSettings.payment_flow_enabled && (
                            <div className="pt-3 border-t border-slate-200/60 space-y-3">
                               <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">API Key Flow</label>
                                  <input 
                                     type="text"
                                     value={storeSettings.flow_api_key}
                                     onChange={(e) => setStoreSettings({...storeSettings, flow_api_key: e.target.value})}
                                     placeholder="API Key de Flow"
                                     className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                                  />
                               </div>
                               <div>
                                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Secret Key Flow</label>
                                  <input 
                                     type="password"
                                     value={storeSettings.flow_secret_key}
                                     onChange={(e) => setStoreSettings({...storeSettings, flow_secret_key: e.target.value})}
                                     placeholder="Secret Key de Flow"
                                     className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                                  />
                               </div>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* SECCIÓN NOTIFICACIONES TELEGRAM */}
                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                             <Bell size={18} className="text-sky-500" /> Notificaciones de Pedidos por Telegram
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                             Recibe una alerta instantánea con sonido en tu teléfono cada vez que un cliente registre una compra.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                           <input 
                              type="checkbox" 
                              checked={storeSettings.telegram_notifications_enabled} 
                              onChange={(e) => setStoreSettings({...storeSettings, telegram_notifications_enabled: e.target.checked})} 
                              className="sr-only peer"
                           />
                           <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                      </div>

                      {storeSettings.telegram_notifications_enabled && (
                        <div className="space-y-4 pt-1">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                 <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">
                                    Telegram Bot Token
                                 </label>
                                 <input 
                                    type="password"
                                    value={storeSettings.telegram_bot_token}
                                    onChange={(e) => setStoreSettings({...storeSettings, telegram_bot_token: e.target.value})}
                                    placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                                 />
                                 <span className="text-[10px] text-slate-400 mt-1 block">Obtenido de @BotFather en Telegram</span>
                              </div>

                              <div>
                                 <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">
                                    Telegram Chat ID
                                 </label>
                                 <input 
                                    type="text"
                                    value={storeSettings.telegram_chat_id}
                                    onChange={(e) => setStoreSettings({...storeSettings, telegram_chat_id: e.target.value})}
                                    placeholder="ej: 987654321 o -100123456789"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                                 />
                                 <span className="text-[10px] text-slate-400 mt-1 block">Tu ID personal o el del grupo de ventas</span>
                              </div>
                           </div>

                           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl">
                              <p className="text-[11px] text-sky-800 leading-relaxed">
                                 💡 <strong>¿Cómo configurarlo en 1 minuto?</strong><br />
                                 1. Crea un bot hablando con <code>@BotFather</code> y copia el Token.<br />
                                 2. Inicia tu bot o habla con <code>@userinfobot</code> para obtener tu Chat ID.
                              </p>
                              <button
                                 type="button"
                                 onClick={handleTestTelegram}
                                 disabled={testingTelegram}
                                 className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm flex-shrink-0"
                              >
                                 {testingTelegram ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                 <span>Probar Conexión</span>
                              </button>
                           </div>
                        </div>
                      )}
                   </div>
                  
                  <button type="submit" disabled={logoUploading || heroUploading} className="btn-primary w-full py-4 text-xs font-bold rounded-2xl shadow-xl justify-center">
                     <Save size={16} /> Guardar Toda la Configuración
                  </button>
               </form>
            </div>
          ) : (
            /* PRODUCTS TAB */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product: any) => (
                <div key={product.id} className={`p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between ${!product.is_active ? 'opacity-40' : ''}`}>
                  <div className="flex gap-3 mb-3">
                    <div className="w-16 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                       <img 
                         src={formatImageUrl(product.image_url) || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop"} 
                         className="w-full h-full object-cover" 
                         alt={product.name}
                         onError={(e: any) => {
                           e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop"
                         }}
                       />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 capitalize">{product.category}</span>
                      <h4 className="font-bold text-sm text-slate-900 truncate">{product.name}</h4>
                      <p className="font-bold text-sm text-slate-900 font-mono mt-1">{formatCLP(product.base_price)}</p>
                      <p className="text-[11px] text-slate-400">Stock: {product.stock} un.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200 justify-end">
                    <button 
                      onClick={() => openProductModal(product)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Edit3 size={14} /> Editar
                    </button>
                    <button 
                      onClick={() => toggleProductStatus(product.id)}
                      className={`p-2 rounded-xl border ${product.is_active ? 'border-slate-200 text-slate-400 hover:text-red-500' : 'border-emerald-200 text-emerald-600 bg-emerald-50'}`}
                      title={product.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {product.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button 
                      onClick={() => deleteProductPermanent(product.id)}
                      className="p-2 border border-slate-200 text-slate-300 hover:text-red-600 rounded-xl"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-1 z-40 flex justify-around items-center shadow-lg">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl text-[9px] font-bold ${activeTab === 'orders' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <ShoppingBag size={18} />
          <span>Pedidos</span>
        </button>

        <button 
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl text-[9px] font-bold ${activeTab === 'products' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <Package size={18} />
          <span>Productos</span>
        </button>

        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl text-[9px] font-bold ${activeTab === 'analytics' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <BarChart3 size={18} />
          <span>Visitas</span>
        </button>

        <button 
          onClick={() => setActiveTab('categories')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl text-[9px] font-bold ${activeTab === 'categories' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <Layers size={18} />
          <span>Categorías</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl text-[9px] font-bold ${activeTab === 'settings' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <SettingsIcon size={18} />
          <span>Ajustes</span>
        </button>
      </div>

      {/* Modal Add/Edit Category */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-5">
                 <div>
                   <h3 className="text-lg font-bold text-slate-900">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                   <p className="text-[10px] uppercase font-bold text-slate-400">Sección de Productos</p>
                 </div>
                 <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                   <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Nombre de la Categoría *</label>
                   <input 
                     type="text" 
                     required
                     value={categoryForm.name}
                     onChange={(e) => handleCategoryNameChange(e.target.value)}
                     placeholder="Ej: Calzado, Cafés, Joyería..."
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                   />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Slug (URL)</label>
                    <input 
                      type="text" 
                      required
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})}
                      placeholder="calzado"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Orden en Menú</label>
                    <input 
                      type="number" 
                      value={categoryForm.order}
                      onChange={(e) => setCategoryForm({...categoryForm, order: Number(e.target.value)})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                   <button type="submit" className="btn-primary w-full py-3.5 text-xs font-bold justify-center rounded-2xl shadow-xl">
                      <Save size={16} /> {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Add/Edit Product (Mobile Optimized Bottom-sheet) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="text-lg sm:text-xl font-bold text-slate-900">{editingProduct ? 'Editar Producto' : 'Añadir Producto'}</h3>
                   <p className="text-[10px] uppercase font-bold text-slate-400">Precios en Pesos Chilenos (CLP)</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                 {/* Multi-Photo Manager with Camera Trigger */}
                 <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                        Fotos del Producto ({productForm.images?.length || 0})
                      </label>
                      <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                        <Star size={11} className="fill-current text-amber-500" /> La primera foto es la portada
                      </span>
                    </div>

                    {/* Thumbnails grid */}
                    {productForm.images && productForm.images.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-3">
                        {productForm.images.map((imgUrl, idx) => (
                          <div 
                            key={idx} 
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 group bg-slate-50 ${
                              idx === 0 ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
                            }`}
                          >
                            <img 
                              src={formatImageUrl(imgUrl)} 
                              alt={`Foto ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e: any) => {
                                e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop"
                              }}
                            />

                            {/* Badge principal */}
                            {idx === 0 && (
                              <span className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                                <Star size={8} className="fill-current" /> Principal
                              </span>
                            )}

                            {/* Action Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                              {idx !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(idx)}
                                  className="w-full py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[8px] font-bold flex items-center justify-center gap-0.5"
                                  title="Marcar como foto principal de portada"
                                >
                                  <Star size={9} /> Portada
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="w-full py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[8px] font-bold flex items-center justify-center gap-0.5"
                                title="Eliminar foto"
                              >
                                <Trash2 size={9} /> Quitar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Controls & URL input */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <label className="cursor-pointer flex-1 py-2.5 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 shadow-md transition-all">
                          <input 
                            type="file" 
                            multiple 
                            onChange={handleImageUpload} 
                            className="sr-only" 
                            accept="image/*" 
                            disabled={uploading} 
                          />
                          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                          <span>{uploading ? 'Procesando y subiendo...' : 'Subir Fotos (Múltiples / Galería / Cámara)'}</span>
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newImageUrlInput}
                          onChange={(e) => setNewImageUrlInput(e.target.value)}
                          placeholder="O pegar URL de imagen directa..."
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddImageUrl()
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          disabled={!newImageUrlInput.trim()}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold disabled:opacity-40 transition-colors"
                        >
                          + Añadir
                        </button>
                      </div>
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Nombre del Producto *</label>
                    <input 
                      type="text" 
                      required
                      value={productForm.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ej: Café de Grano 500g"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Precio en CLP ($) *</label>
                      <input 
                        type="number" 
                        required
                        value={productForm.base_price}
                        onChange={(e) => setProductForm({...productForm, base_price: Number(e.target.value)})}
                        placeholder="19990"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
                      />
                   </div>

                   <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Stock Disponible *</label>
                      <input 
                        type="number" 
                        required
                        value={productForm.stock}
                        onChange={(e) => setProductForm({...productForm, stock: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                      />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Categoría</label>
                      <select 
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold capitalize"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                        <option value="general">General</option>
                      </select>
                   </div>

                   <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Slug (URL)</label>
                      <input 
                        type="text" 
                        required
                        value={productForm.slug}
                        onChange={(e) => setProductForm({...productForm, slug: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                      />
                   </div>
                 </div>

                 <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Descripción</label>
                    <textarea 
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      placeholder="Detalles, materiales, modo de uso..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    ></textarea>
                 </div>

                 <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={uploading}
                      className="btn-primary w-full py-4 text-xs font-bold justify-center rounded-2xl shadow-xl"
                    >
                       {uploading ? (
                         <><Loader2 className="animate-spin" size={16} /> Subiendo imagen...</>
                       ) : (
                         <><Save size={16} /> {editingProduct ? 'Guardar Cambios' : 'Publicar Producto'}</>
                       )}
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
