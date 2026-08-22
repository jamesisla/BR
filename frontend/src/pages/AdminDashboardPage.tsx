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
  AlertCircle, 
  Truck, 
  X, 
  Save, 
  LogOut, 
  Eye, 
  EyeOff, 
  Upload, 
  Loader2, 
  Settings as SettingsIcon, 
  Palette, 
  Image as ImageIcon 
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { reloadConfig } = useCart()
  const fileInputRef = useRef<HTMLInputElement>(null)
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
    name: 'TIENDA ARTISAN',
    logo_url: '',
    primary_color: '#3d2b1f',
    secondary_color: '#a67c52',
    footer_text: '© 2026 Tienda Artisan. Crafted for purity.',
    hero_title: 'El Arte de la Pureza',
    hero_subtitle: 'Descubre nuestra selección artesanal única.',
    hero_image_url: ''
  })

  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'general',
    base_price: 0,
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
          name: data.name || 'TIENDA ARTISAN',
          logo_url: data.logo_url || '',
          primary_color: data.primary_color || '#3d2b1f',
          secondary_color: data.secondary_color || '#a67c52',
          footer_text: data.footer_text || '© 2026 Tienda Artisan. Crafted for purity.',
          hero_title: data.hero_title || 'El Arte de la Pureza',
          hero_subtitle: data.hero_subtitle || 'Descubre nuestra selección artesanal única.',
          hero_image_url: data.hero_image_url || ''
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
    if (!confirm('¿Estás seguro de eliminar este producto de forma permanente?')) return
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
        base_price: product.base_price,
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
        base_price: 0,
        stock: 10,
        image_url: ''
      })
    }
    setIsModalOpen(true)
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
        body: JSON.stringify(productForm)
      })

      if (response.ok) {
        setIsModalOpen(false)
        fetchData()
      } else {
        const errData = await response.json()
        alert('Error al guardar: ' + (errData.detail || 'Error desconocido'))
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
        setProductForm({ ...productForm, image_url: data.url })
      } else {
        alert('Error al subir imagen')
      }
    } catch (error) {
      console.error(error)
      alert('Error de conexión al subir imagen')
    } finally {
      setUploading(false)
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
        setStoreSettings({ ...storeSettings, logo_url: data.url })
      } else {
        alert('Error al subir logo')
      }
    } catch (error) {
      console.error(error)
      alert('Error de conexión al subir logo')
    } finally {
      setLogoUploading(false)
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
        setStoreSettings({ ...storeSettings, hero_image_url: data.url })
      } else {
        alert('Error al subir imagen del hero')
      }
    } catch (error) {
      console.error(error)
      alert('Error al subir imagen')
    } finally {
      setHeroUploading(false)
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
        alert('¡Configuración de tienda guardada con éxito!')
        reloadConfig()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 md:h-screen md:sticky md:top-0">
        <div>
           <h2 className="font-serif text-2xl font-bold text-slate-800 tracking-tight">Admin Console</h2>
           <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">Gestión de Tienda</p>
        </div>

        <nav className="flex md:flex-col gap-2 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ShoppingBag size={18} />
            <span>Pedidos</span>
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Package size={18} />
            <span>Productos</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wider transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
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

      {/* Main Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl">
        <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 capitalize">
              {activeTab === 'orders' ? 'Gestión de Pedidos' : activeTab === 'products' ? 'Catálogo de Productos' : 'Identidad y Marca (Wizard)'}
            </h1>
            <p className="text-slate-400 text-xs mt-1">Administra tus ventas, catálogo y personalización en tiempo real.</p>
          </div>
          
          {activeTab === 'products' && (
            <button 
              onClick={() => openProductModal()}
              className="btn-primary py-3 px-5 text-xs font-bold rounded-xl shadow-lg self-start sm:self-auto"
            >
              <Plus size={16} /> Añadir Producto
            </button>
          )}
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp size={20} />
              </div>
            </div>
            <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Ventas Totales</h4>
            <p className="text-2xl font-bold text-slate-900 mt-1">${stats.totalSales.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock size={20} />
              </div>
            </div>
            <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pedidos Pendientes</h4>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.pendingOrders}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 text-slate-900 rounded-xl">
                <Package size={20} />
              </div>
            </div>
            <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Productos Activos</h4>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.activeProducts}</p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {activeTab === 'orders' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID / Cliente</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="font-bold text-slate-900 font-mono text-xs">OD-{order.id.substring(0, 5).toUpperCase()}</div>
                         <div className="text-xs text-slate-400">{order.first_name} {order.last_name} ({order.email})</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                         {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                         ${Number(order.total || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                           order.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                           order.status === 'shipped' ? 'bg-blue-50 text-blue-600' :
                           order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                           'bg-amber-50 text-amber-600'
                         }`}>
                           {order.status === 'paid' ? 'Pagado' : order.status === 'shipped' ? 'Enviado' : order.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex gap-2">
                            {order.status !== 'shipped' && order.status !== 'cancelled' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'shipped')}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold"
                                title="Marcar como enviado"
                              >
                                <Truck size={16} />
                              </button>
                            )}
                            {order.status === 'pending' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'paid')}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold"
                                title="Marcar como pagado manualmente"
                              >
                                ✓
                              </button>
                            )}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'settings' ? (
            <div className="p-8 max-w-2xl">
               <form onSubmit={handleSettingsSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                       <Palette size={18} className="text-slate-400" /> Identidad Visual
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                       <div className="sm:col-span-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Nombre de la Tienda</label>
                          <input 
                            type="text" 
                            value={storeSettings.name}
                            onChange={(e) => setStoreSettings({...storeSettings, name: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                          />
                       </div>

                       <div className="sm:col-span-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Logo de la Tienda</label>
                          <div className="flex gap-4 items-center">
                             <div className="w-16 h-16 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                                {storeSettings.logo_url ? (
                                  <img src={storeSettings.logo_url} className="w-full h-full object-contain" />
                                ) : (
                                  <Palette className="text-slate-300" size={24} />
                                )}
                             </div>
                             <div className="flex-1">
                                <input 
                                  type="file" 
                                  ref={logoInputRef}
                                  onChange={handleLogoUpload}
                                  className="hidden" 
                                  accept="image/*"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => logoInputRef.current?.click()}
                                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                                >
                                  {logoUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                  Subir Logo
                                </button>
                             </div>
                          </div>
                       </div>

                       <div className="sm:col-span-2 pt-4 border-t border-slate-100">
                          <h4 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
                             <ImageIcon size={14} className="text-slate-400" />
                             PORTADA PRINCIPAL (HERO BANNER)
                          </h4>
                          
                          <div className="mb-4">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Imagen de Portada</label>
                            <div 
                              className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-slate-400 transition-all relative flex items-center justify-center"
                              onClick={() => heroInputRef.current?.click()}
                            >
                               {storeSettings.hero_image_url ? (
                                 <img src={storeSettings.hero_image_url} className="w-full h-full object-cover" />
                               ) : (
                                 <div className="flex flex-col items-center gap-2 text-slate-400">
                                    <ImageIcon size={32} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Subir Imagen de Portada</span>
                                 </div>
                               )}
                               <input type="file" ref={heroInputRef} className="hidden" onChange={handleHeroUpload} accept="image/*" />
                               {heroUploading && (
                                 <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-slate-900" />
                                 </div>
                               )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Título Hero</label>
                                <input 
                                  type="text" 
                                  value={storeSettings.hero_title}
                                  onChange={(e) => setStoreSettings({...storeSettings, hero_title: e.target.value})}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-serif italic"
                                />
                             </div>
                             <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Subtítulo Hero</label>
                                <input 
                                  type="text" 
                                  value={storeSettings.hero_subtitle}
                                  onChange={(e) => setStoreSettings({...storeSettings, hero_subtitle: e.target.value})}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                />
                             </div>
                          </div>
                       </div>

                       <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Color Primario</label>
                          <div className="flex gap-2 items-center">
                             <input 
                                type="color" 
                                value={storeSettings.primary_color}
                                onChange={(e) => setStoreSettings({...storeSettings, primary_color: e.target.value})}
                                className="h-10 w-10 rounded-lg border-none cursor-pointer"
                             />
                             <input 
                                type="text" 
                                value={storeSettings.primary_color}
                                onChange={(e) => setStoreSettings({...storeSettings, primary_color: e.target.value})}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                             />
                          </div>
                       </div>

                       <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Color Secundario</label>
                          <div className="flex gap-2 items-center">
                             <input 
                                type="color" 
                                value={storeSettings.secondary_color}
                                onChange={(e) => setStoreSettings({...storeSettings, secondary_color: e.target.value})}
                                className="h-10 w-10 rounded-lg border-none cursor-pointer"
                             />
                             <input 
                                type="text" 
                                value={storeSettings.secondary_color}
                                onChange={(e) => setStoreSettings({...storeSettings, secondary_color: e.target.value})}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                             />
                          </div>
                       </div>

                       <div className="sm:col-span-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Texto del Pie de Página</label>
                          <textarea 
                            rows={2}
                            value={storeSettings.footer_text}
                            onChange={(e) => setStoreSettings({...storeSettings, footer_text: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          ></textarea>
                       </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                     <button type="submit" className="btn-primary py-3.5 px-8 text-xs font-bold rounded-xl shadow-lg">
                        <Save size={16} /> Guardar Configuración
                     </button>
                  </div>
               </form>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Producto</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoría</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precio</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {products.map((product: any) => (
                    <tr key={product.id} className={`hover:bg-slate-50/50 transition-colors ${!product.is_active ? 'opacity-40' : ''}`}>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                               <img src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=100&auto=format&fit=crop"} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{product.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">Stock: {product.stock}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 capitalize text-xs text-slate-500">
                         {product.category}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-xs">
                         ${Number(product.base_price || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex gap-2">
                            <button 
                              onClick={() => openProductModal(product)}
                              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg"
                              title="Editar"
                            >
                               <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => toggleProductStatus(product.id)}
                              className={`p-1.5 rounded-lg ${product.is_active ? 'text-slate-300 hover:text-red-500' : 'text-emerald-500 hover:text-emerald-700'}`}
                              title={product.is_active ? 'Desactivar' : 'Activar'}
                            >
                               {product.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button 
                              onClick={() => deleteProductPermanent(product.id)}
                              className="p-1.5 text-slate-300 hover:text-red-600 rounded-lg"
                              title="Eliminar"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Add/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-900">{editingProduct ? 'Editar Producto' : 'Añadir Producto'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleProductSubmit} className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Nombre</label>
                    <input 
                      type="text" 
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Slug (URL)</label>
                    <input 
                      type="text" 
                      required
                      value={productForm.slug}
                      onChange={(e) => setProductForm({...productForm, slug: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                      placeholder="reloj-minimalista"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Categoría</label>
                    <input 
                      type="text" 
                      list="cat-list"
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <datalist id="cat-list">
                      <option value="general" />
                      <option value="accesorios" />
                      <option value="ropa" />
                      <option value="tecnologia" />
                      <option value="hogar" />
                    </datalist>
                 </div>
                 <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Precio Base ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={productForm.base_price}
                      onChange={(e) => setProductForm({...productForm, base_price: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Stock</label>
                    <input 
                      type="number" 
                      required
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                 </div>
                 <div className="col-span-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Imagen del Producto</label>
                    <div className="flex gap-2">
                       <input 
                          type="text" 
                          value={productForm.image_url}
                          onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                          placeholder="URL o sube un archivo..."
                          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                       />
                       <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                       <button 
                          type="button"
                          disabled={uploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200"
                       >
                          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          Subir
                       </button>
                    </div>
                 </div>
                 <div className="col-span-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Descripción</label>
                    <textarea 
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    ></textarea>
                 </div>

                 <div className="col-span-2 pt-2">
                    <button type="submit" className="btn-primary w-full py-3.5 text-xs font-bold justify-center rounded-xl shadow-lg">
                       <Save size={16} /> {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
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
