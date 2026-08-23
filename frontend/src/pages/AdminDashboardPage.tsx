import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingBag, 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  TrendingUp, 
  Clock, 
  Truck, 
  X, 
  Save, 
  LogOut, 
  Eye, 
  EyeOff, 
  Upload, 
  Camera,
  Loader2, 
  Settings as SettingsIcon, 
  Palette, 
  Image as ImageIcon,
  MessageCircle,
  CreditCard,
  Phone
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, formatCLP } from '../context/CartContext'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { reloadConfig } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)
  
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders') 
  const [uploading, setUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  
  const [storeSettings, setStoreSettings] = useState({
    name: 'TIENDA DEMO PYME',
    logo_url: '',
    primary_color: '#2d1b0e',
    secondary_color: '#9c6644',
    footer_text: '© 2026 Tienda Demo. Venta directa por WhatsApp.',
    hero_title: 'Emprende con Estilo',
    hero_subtitle: 'Catálogo digital para PYMEs. Haz tu pedido directo por WhatsApp con transferencia.',
    hero_image_url: '',
    whatsapp_number: '+56912345678',
    bank_details: 'BancoEstado | CuentaRUT: 12.345.678-9 | Titular: Tienda Demo | Correo: pagos@tienda.cl',
    currency: 'CLP'
  })

  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'general',
    base_price: 19990,
    stock: 10,
    image_url: ''
  })

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
      fetchSettings()
    }
  }, [])

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
          hero_title: data.hero_title || 'Emprende con Estilo',
          hero_subtitle: data.hero_subtitle || 'Catálogo digital para PYMEs. Haz tu pedido directo por WhatsApp con transferencia.',
          hero_image_url: data.hero_image_url || '',
          whatsapp_number: data.whatsapp_number || '+56912345678',
          bank_details: data.bank_details || 'BancoEstado | CuentaRUT: 12.345.678-9 | Titular: Tienda Demo | Correo: pagos@tienda.cl',
          currency: data.currency || 'CLP'
        })
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
      setProductForm({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        category: product.category || 'general',
        base_price: Math.round(Number(product.base_price || 0)),
        stock: product.stock || 0,
        image_url: product.image_url || ''
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        name: '',
        slug: '',
        description: '',
        category: 'general',
        base_price: 19990,
        stock: 10,
        image_url: ''
      })
    }
    setIsModalOpen(true)
  }

  // Generar Slug automático al escribir el nombre
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
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/products/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setProductForm(prev => ({ ...prev, image_url: data.url }))
      } else {
        const errData = await response.json().catch(() => ({}))
        alert('Error al subir imagen: ' + (errData.detail || response.statusText))
      }
    } catch (error: any) {
      console.error(error)
      alert('Error de conexión al subir imagen: ' + error.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/products/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setStoreSettings(prev => ({ ...prev, logo_url: data.url }))
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
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/products/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setStoreSettings(prev => ({ ...prev, hero_image_url: data.url }))
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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row pb-24 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 p-6 flex-col gap-6 h-screen sticky top-0">
        <div>
           <h2 className="font-serif text-2xl font-bold text-slate-800 tracking-tight">Admin Móvil</h2>
           <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">Control de Tienda</p>
        </div>

        <nav className="flex flex-col gap-2">
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
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider transition-all ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <SettingsIcon size={18} />
            <span>Personalización</span>
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
              {activeTab === 'orders' ? 'Gestión de Pedidos' : activeTab === 'products' ? 'Catálogo de Productos' : 'Personalización & WhatsApp'}
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

        {/* Tab Content */}
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
                        <div className="flex gap-1.5">
                          {order.status === 'pending' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'paid')}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                              title="Marcar como pagado"
                            >
                              ✓ Pagado
                            </button>
                          )}
                          {order.status !== 'shipped' && order.status !== 'cancelled' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'shipped')}
                              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl"
                              title="Marcar como enviado"
                            >
                              <Truck size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'settings' ? (
            /* SETTINGS / WIZARD TAB */
            <div className="max-w-2xl">
               <form onSubmit={handleSettingsSubmit} className="space-y-6">
                  {/* WhatsApp Section */}
                  <div className="p-5 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl">
                    <h3 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                       <MessageCircle size={18} className="text-emerald-600" /> WhatsApp para Pedidos
                    </h3>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Número de WhatsApp (con código de país)</label>
                    <input 
                      type="text" 
                      value={storeSettings.whatsapp_number}
                      onChange={(e) => setStoreSettings({...storeSettings, whatsapp_number: e.target.value})}
                      placeholder="+56912345678"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-mono text-sm"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Aquí recibirás los pedidos y comprobantes de tus clientes directamente en tu teléfono.</p>
                  </div>

                  {/* Bank Details Section */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                       <CreditCard size={18} className="text-slate-600" /> Datos de Transferencia Bancaria
                    </h3>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Datos de tu Cuenta (Banco, Tipo, RUT, Titular, Email)</label>
                    <textarea 
                      rows={3}
                      value={storeSettings.bank_details}
                      onChange={(e) => setStoreSettings({...storeSettings, bank_details: e.target.value})}
                      placeholder="BancoEstado | CuentaRUT: 12.345.678-9 | Titular: Tu Nombre | Email: pagos@tuemail.cl"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  {/* Branding Section */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                       <Palette size={18} className="text-slate-400" /> Nombre & Logo de tu Negocio
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
                             <div className="w-16 h-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                                {storeSettings.logo_url ? (
                                  <img src={storeSettings.logo_url} className="w-full h-full object-contain" />
                                ) : (
                                  <Palette className="text-slate-300" size={24} />
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
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Imagen de Portada (Hero Banner)</label>
                          <label className="cursor-pointer block w-full h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden hover:border-slate-400 transition-all relative mb-3">
                             {storeSettings.hero_image_url ? (
                               <img src={storeSettings.hero_image_url} className="w-full h-full object-cover" />
                             ) : (
                               <div className="flex flex-col items-center justify-center h-full gap-1.5 text-slate-400">
                                  <Camera size={28} />
                                  <span className="text-[11px] font-bold uppercase tracking-wider">Toca para Subir Foto de Portada</span>
                               </div>
                             )}
                             <input type="file" className="sr-only" onChange={handleHeroUpload} accept="image/*" disabled={heroUploading} />
                             {heroUploading && (
                               <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                  <Loader2 className="animate-spin text-slate-900" />
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
                  
                  <button type="submit" className="btn-primary w-full py-4 text-xs font-bold rounded-2xl shadow-xl justify-center">
                     <Save size={16} /> Guardar Configuración
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
                       <img src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop"} className="w-full h-full object-cover" />
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 z-40 flex justify-around items-center shadow-lg">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold ${activeTab === 'orders' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <ShoppingBag size={20} />
          <span>Pedidos</span>
        </button>

        <button 
          onClick={() => openProductModal()}
          className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg -mt-5"
          title="Añadir Producto"
        >
          <Plus size={24} />
        </button>

        <button 
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold ${activeTab === 'products' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <Package size={20} />
          <span>Productos</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold ${activeTab === 'settings' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <SettingsIcon size={20} />
          <span>Ajustes</span>
        </button>
      </div>

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
                 {/* Photo Upload with Camera Trigger */}
                 <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1.5">Foto del Producto</label>
                    <div className="flex gap-3 items-center">
                       <label className="cursor-pointer w-20 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 relative hover:border-slate-400 transition-all">
                          {productForm.image_url ? (
                            <img src={productForm.image_url} className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="text-slate-300" size={28} />
                          )}
                          <input type="file" onChange={handleImageUpload} className="sr-only" accept="image/*" disabled={uploading} />
                       </label>

                       <div className="flex-1 space-y-2">
                          <label className="cursor-pointer w-full py-2.5 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 shadow-md">
                            <input type="file" onChange={handleImageUpload} className="sr-only" accept="image/*" disabled={uploading} />
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                            <span>{uploading ? 'Subiendo foto...' : 'Tomar Foto / Elegir Galería'}</span>
                          </label>
                          
                          <input 
                             type="text" 
                             value={productForm.image_url}
                             onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                             placeholder="O pegar URL de imagen..."
                             className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono"
                          />
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
                      <input 
                        type="text" 
                        list="cat-list"
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                        placeholder="general, cafes..."
                      />
                      <datalist id="cat-list">
                        <option value="general" />
                        <option value="accesorios" />
                        <option value="cafes" />
                        <option value="hogar" />
                        <option value="ropa" />
                      </datalist>
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
                    <button type="submit" className="btn-primary w-full py-4 text-xs font-bold justify-center rounded-2xl shadow-xl">
                       <Save size={16} /> {editingProduct ? 'Guardar Cambios' : 'Publicar Producto'}
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
