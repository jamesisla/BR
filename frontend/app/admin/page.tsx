
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingBag, 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink,
  ChevronRight,
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
  Image
} from 'lucide-react'
import { useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// UI Components
const Card = ({ children, className = "" }: any) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
)

const Badge = ({ children, color = "blue" }: any) => {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-50 text-slate-600",
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  )
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export default function AdminDashboard() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState('orders') 
  const [uploading, setUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [showInactive, setShowInactive] = useState(true) // Always true for admin
  
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
    category: 'cafes',
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
      router.push('/admin/login')
    } else {
      fetchData()
      fetchSettings()
    }
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings/`)
      const data = await res.json()
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
    } catch (e) {
      console.error(e)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/orders/`),
        fetch(`${API_URL}/products/all`)
      ])
      
      const ordersData = await ordersRes.json()
      const productsData = await productsRes.json()
      
      setOrders(Array.isArray(ordersData) ? ordersData.reverse() : [])
      setProducts(Array.isArray(productsData) ? productsData : [])
      
      const sales = Array.isArray(ordersData) ? ordersData.reduce((acc: number, curr: any) => acc + Number(curr.total), 0) : 0
      const pending = Array.isArray(ordersData) ? ordersData.filter((o: any) => o.status === 'pending').length : 0
      const active = Array.isArray(productsData) ? productsData.filter((p: any) => p.is_active).length : 0
      
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
    router.push('/admin/login')
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`${API_URL}/orders/${orderId}/status?status=${newStatus}`, {
        method: 'PATCH'
      })
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const toggleProductStatus = async (productId: string) => {
    try {
      await fetch(`${API_URL}/products/${productId}/toggle-active`, {
        method: 'PATCH'
      })
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const deleteProductPermanent = async (productId: string) => {
    if (!confirm('¿Estás SEGURO de eliminar este producto para SIEMPRE? Esta acción no se puede deshacer.')) return
    try {
      await fetch(`${API_URL}/products/${productId}`, {
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
        category: product.category || 'cafes',
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
        category: 'cafes',
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
      ? `${API_URL}/products/${editingProduct.id}`
      : `${API_URL}/products/`

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
      const response = await fetch(`${API_URL}/products/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setProductForm({ ...productForm, image_url: data.url })
      } else {
        alert('Error al subir la imagen')
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
      const response = await fetch(`${API_URL}/products/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setStoreSettings({ ...storeSettings, logo_url: data.url })
      } else {
        alert('Error al subir el logo')
      }
    } catch (error) {
      console.error(error)
      alert('Error de conexión al subir el logo')
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
      const response = await fetch(`${API_URL}/products/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setStoreSettings({ ...storeSettings, hero_image_url: data.url })
      } else {
        alert('Error al subir la imagen del hero')
      }
    } catch (error) {
      console.error(error)
      alert('Error de conexión al subir la imagen')
    } finally {
      setHeroUploading(false)
    }
  }

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/settings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeSettings)
      })
      if (res.ok) {
        alert('Configuración actualizada con éxito')
        window.location.reload() // Reload to apply changes globally
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 h-screen sticky top-0">
        <div>
           <h2 className="font-serif text-2xl font-bold text-slate-800 tracking-tight">Management</h2>
           <p className="text-[10px] uppercase tracking-widest font-bold opacity-30 mt-1">Store Admin Console</p>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ShoppingBag size={20} />
            <span className="font-semibold text-sm">Pedidos</span>
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Package size={20} />
            <span className="font-semibold text-sm">Productos</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <SettingsIcon size={20} />
            <span className="font-semibold text-sm">Configuración</span>
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-4 pt-6 border-t border-slate-100">
           <Link href="/" target="_blank" className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors">
              <ExternalLink size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Ver Tienda</span>
           </Link>
           <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-600 transition-colors">
              <LogOut size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Cerrar Sesión</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 capitalize">{activeTab === 'orders' ? 'Gestión de Pedidos' : 'Catálogo de Productos'}</h1>
            <p className="text-slate-500 mt-1">Aquí tienes un resumen de la actividad de tu tienda.</p>
          </div>
          
          {activeTab === 'products' && (
            <button 
              onClick={() => openProductModal()}
              className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
            >
              <Plus size={18} /> Añadir Producto
            </button>
          )}
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <Card>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <Badge color="green">+12%</Badge>
            </div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Ventas Totales</h4>
            <p className="text-3xl font-bold text-slate-900 mt-1">${stats.totalSales.toLocaleString()}</p>
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock size={20} />
              </div>
            </div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pedidos Pendientes</h4>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.pendingOrders}</p>
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 text-slate-900 rounded-xl">
                <Package size={20} />
              </div>
            </div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Productos Activos</h4>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.activeProducts}</p>
          </Card>
        </div>

        {/* Content Table */}
        <Card className="overflow-hidden p-0 border-none shadow-xl shadow-slate-200/40">
          {activeTab === 'orders' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                   <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">ID / Cliente</th>
                   <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                   <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Total</th>
                   <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                   <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                       <div className="font-bold text-slate-900">OD-{order.id.substring(0, 5).toUpperCase()}</div>
                       <div className="text-xs text-slate-400">{order.first_name} {order.last_name}</div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">
                       {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-900">
                       ${Number(order.total).toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                       {order.status === 'pending' ? (
                         <Badge color="amber">Pendiente</Badge>
                       ) : order.status === 'shipped' ? (
                         <Badge color="blue">Enviado</Badge>
                       ) : (
                         <Badge color="green">Completado</Badge>
                       )}
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'shipped')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Marcar como enviado"
                            >
                              <Truck size={18} />
                            </button>
                          )}
                          <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
                             <ChevronRight size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'settings' ? (
            <div className="p-10 max-w-2xl">
               <form onSubmit={handleSettingsSubmit} className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                       <Palette className="text-slate-400" /> Identidad Visual
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="col-span-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Nombre de la Tienda</label>
                          <input 
                            type="text" 
                            value={storeSettings.name}
                            onChange={(e) => setStoreSettings({...storeSettings, name: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-bold"
                          />
                       </div>
                       <div className="col-span-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Logo de la Tienda</label>
                          <div className="flex gap-4 items-center">
                             <div className="w-20 h-20 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                                {storeSettings.logo_url ? (
                                  <img src={storeSettings.logo_url} className="w-full h-full object-contain" />
                                ) : (
                                  <Palette className="text-slate-200" size={30} />
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
                                <p className="text-[10px] text-slate-400 mt-2 italic">
                                   Recomendado: 400x100px (Horizontal) o 200x200px (Cuadrado). Fondos transparentes (PNG) sugeridos.
                                </p>
                             </div>
                          </div>
                       </div>

                       <div className="col-span-2 mt-4 pt-4 border-t border-slate-100">
                          <h4 className="text-[11px] font-bold text-slate-900 mb-6 flex items-center gap-2">
                             <Palette size={14} className="text-slate-400" />
                             CONFIGURACIÓN PÁGINA DE INICIO (HERO)
                          </h4>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="col-span-2">
                                <div className="flex justify-between items-center mb-2">
                                   <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Imagen de Portada (Hero)</label>
                                   <div className="group relative">
                                      <AlertCircle size={14} className="text-slate-300 cursor-help" />
                                      <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 text-white text-[10px] p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                         <strong>Tip:</strong> Usa imágenes panorámicas de alta calidad.<br/>
                                         <strong>Recomendado:</strong> 1920x1080px o superior. Formato JPG o WebP.
                                      </div>
                                   </div>
                                </div>
                                <div 
                                  className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden cursor-pointer hover:border-slate-400 transition-all group relative"
                                  onClick={() => heroInputRef.current?.click()}
                                >
                                   {storeSettings.hero_image_url ? (
                                     <img src={storeSettings.hero_image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                   ) : (
                                     <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-30">
                                        <Image size={40} />
                                        <span className="text-xs font-bold uppercase tracking-widest">Subir Imagen Gran Formato</span>
                                     </div>
                                   )}
                                   <input type="file" ref={heroInputRef} className="hidden" onChange={handleHeroUpload} accept="image/*" />
                                   {heroUploading && (
                                     <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-slate-900" />
                                     </div>
                                   )}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic text-center">
                                   Imagen sugerida: Panorámica (16:9). Se aplicará un filtro de oscuridad para mejorar la lectura del texto.
                                </p>
                             </div>
                             <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Título Hero</label>
                                <input 
                                  type="text" 
                                  value={storeSettings.hero_title}
                                  onChange={(e) => setStoreSettings({...storeSettings, hero_title: e.target.value})}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-serif italic text-lg"
                                />
                             </div>
                             <div>
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Subtítulo Hero</label>
                                <input 
                                  type="text" 
                                  value={storeSettings.hero_subtitle}
                                  onChange={(e) => setStoreSettings({...storeSettings, hero_subtitle: e.target.value})}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                                />
                             </div>
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Color Primario</label>
                          <div className="flex gap-3">
                             <input 
                                type="color" 
                                value={storeSettings.primary_color}
                                onChange={(e) => setStoreSettings({...storeSettings, primary_color: e.target.value})}
                                className="h-12 w-12 rounded-lg border-none cursor-pointer"
                             />
                             <input 
                                type="text" 
                                value={storeSettings.primary_color}
                                onChange={(e) => setStoreSettings({...storeSettings, primary_color: e.target.value})}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs"
                             />
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Color Secundario</label>
                          <div className="flex gap-3">
                             <input 
                                type="color" 
                                value={storeSettings.secondary_color}
                                onChange={(e) => setStoreSettings({...storeSettings, secondary_color: e.target.value})}
                                className="h-12 w-12 rounded-lg border-none cursor-pointer"
                             />
                             <input 
                                type="text" 
                                value={storeSettings.secondary_color}
                                onChange={(e) => setStoreSettings({...storeSettings, secondary_color: e.target.value})}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs"
                             />
                          </div>
                       </div>
                       <div className="col-span-2">
                          <div className="flex justify-between items-center mb-2">
                             <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Texto del Pie de Página</label>
                             <div className="group relative">
                                <AlertCircle size={14} className="text-slate-300 cursor-help" />
                                <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 text-white text-[10px] p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                   <strong>Tip:</strong> Mantén el mensaje corto (máx. 100 caracteres) para que se vea elegante.<br/>
                                   <strong>Ejemplo:</strong> "© 2026 Sensorial Coffee. El arte de la pureza en cada grano."
                                </div>
                             </div>
                          </div>
                          <textarea 
                            rows={3}
                            value={storeSettings.footer_text}
                            onChange={(e) => setStoreSettings({...storeSettings, footer_text: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all resize-none"
                            placeholder="Ej: © 2026 Tu Tienda. Todos los derechos reservados."
                          ></textarea>
                       </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-100">
                     <button type="submit" className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]">
                        <Save size={20} /> Guardar Configuración
                     </button>
                  </div>
               </form>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Producto</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Categoría</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Precio</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product: any) => (
                  <tr key={product.id} className={`hover:bg-slate-50/50 transition-colors ${!product.is_active ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                             <img src={product.image_url || "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?q=80&w=100&auto=format&fit=crop"} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{product.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Stock: {product.stock}</div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5 capitalize text-sm text-slate-500">
                       {product.category}
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-900">
                       ${Number(product.base_price).toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex gap-1">
                          <button 
                            onClick={() => openProductModal(product)}
                            className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all"
                            title="Editar"
                          >
                             <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => toggleProductStatus(product.id)}
                            className={`p-2 rounded-lg transition-all ${product.is_active ? 'text-slate-300 hover:bg-red-50 hover:text-red-600' : 'text-green-400 hover:bg-green-50'}`}
                            title={product.is_active ? 'Desactivar' : 'Reactivar'}
                          >
                             {product.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                          <button 
                            onClick={() => deleteProductPermanent(product.id)}
                            className="p-2 text-slate-300 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all"
                            title="Eliminar Permanentemente"
                          >
                             <Trash2 size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!loading && ((activeTab === 'orders' && orders.length === 0) || (activeTab === 'products' && products.length === 0)) && (
            <div className="p-20 text-center">
               <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
               <p className="text-slate-400 font-medium">No se encontraron registros en esta sección.</p>
            </div>
          )}
        </Card>
      </main>

      {/* Modal for Add/Edit Product */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                 <div>
                   <h3 className="text-2xl font-bold text-slate-900">{editingProduct ? 'Editar Producto' : 'Añadir Producto'}</h3>
                   <p className="text-slate-400 text-sm">Completa la información del producto</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleProductSubmit} className="grid grid-cols-2 gap-5">
                 <div className="col-span-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Nombre del Producto</label>
                    <input 
                      type="text" 
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Slug (URL)</label>
                    <input 
                      type="text" 
                      required
                      value={productForm.slug}
                      onChange={(e) => setProductForm({...productForm, slug: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-mono text-xs"
                      placeholder="ej: cafe-etiopia"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Categoría</label>
                    <select 
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                    >
                       <option value="cafes">Cafés</option>
                       <option value="accesorios">Accesorios</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Precio Base ($)</label>
                    <input 
                      type="number" 
                      required
                      value={productForm.base_price}
                      onChange={(e) => setProductForm({...productForm, base_price: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Stock Inicial</label>
                    <input 
                      type="number" 
                      required
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                    />
                 </div>
                 <div className="col-span-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Imagen del Producto</label>
                    <div className="flex gap-3">
                       <input 
                          type="text" 
                          value={productForm.image_url}
                          onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                          placeholder="URL de la imagen o sube un archivo..."
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-mono text-xs"
                       />
                       <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          className="hidden" 
                          accept="image/*"
                       />
                       <button 
                          type="button"
                          disabled={uploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                       >
                          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                          <span className="text-xs font-bold">Subir</span>
                       </button>
                    </div>
                 </div>
                 <div className="col-span-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-2">Descripción</label>
                    <textarea 
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all resize-none"
                    ></textarea>
                 </div>

                 <div className="col-span-2 pt-4">
                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]">
                       <Save size={20} /> {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
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