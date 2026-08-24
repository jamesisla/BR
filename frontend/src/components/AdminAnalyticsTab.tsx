import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Cpu, 
  Wifi, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Power, 
  Shield, 
  Activity, 
  FileText, 
  MapPin, 
  Compass, 
  Info, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Zap,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Share2
} from 'lucide-react'
import VisitDetailModal from './VisitDetailModal'

interface AdminAnalyticsTabProps {
  onSettingsUpdated?: () => void
}

export default function AdminAnalyticsTab({ onSettingsUpdated }: AdminAnalyticsTabProps) {
  // Summary & Trends Data
  const [summary, setSummary] = useState<any>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  
  // Visits Table Data
  const [visits, setVisits] = useState<any[]>([])
  const [totalVisitsCount, setTotalVisitsCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingVisits, setLoadingVisits] = useState(true)
  
  // Filters & State
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('7d')
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'desktop' | 'tablet' | 'bot'>('all')
  const [includeAdminVisits, setIncludeAdminVisits] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [togglingTracking, setTogglingTracking] = useState(false)
  
  // Modals
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null)
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false)
  const [purgePeriod, setPurgePeriod] = useState<'older_than_30d' | 'older_than_90d' | 'all'>('older_than_30d')
  const [isPurging, setIsPurging] = useState(false)

  // Hovered Chart Day
  const [hoveredTrend, setHoveredTrend] = useState<any | null>(null)

  // Fetch Summary and Visits
  const fetchSummary = async (selectedPeriod = period) => {
    try {
      setLoadingSummary(true)
      const res = await fetch(`/api/analytics/summary?period=${selectedPeriod}`)
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    } catch (e) {
      console.error('Error fetching analytics summary:', e)
    } finally {
      setLoadingSummary(false)
    }
  }

  const fetchVisits = async (page = currentPage, sQuery = searchQuery, dev = deviceFilter, per = period, incAdmin = includeAdminVisits) => {
    try {
      setLoadingVisits(true)
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
        search: sQuery,
        device: dev,
        period: per,
        include_admin: incAdmin ? 'true' : 'false',
      })
      const res = await fetch(`/api/analytics/visits?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setVisits(data.items || [])
        setTotalVisitsCount(data.total || 0)
        setCurrentPage(data.page || 1)
        setTotalPages(data.total_pages || 1)
      }
    } catch (e) {
      console.error('Error fetching visits list:', e)
    } finally {
      setLoadingVisits(false)
    }
  }

  const handleRefreshAll = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchSummary(period), fetchVisits(currentPage, searchQuery, deviceFilter, period, includeAdminVisits)])
    setIsRefreshing(false)
  }

  useEffect(() => {
    fetchSummary(period)
    fetchVisits(1, searchQuery, deviceFilter, period, includeAdminVisits)
  }, [period, deviceFilter, includeAdminVisits])

  // Handle Search Input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVisits(1, searchQuery, deviceFilter, period)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Toggle Tracking on/off
  const handleToggleTracking = async () => {
    if (!summary) return
    const newState = !summary.analytics_enabled
    setTogglingTracking(true)
    try {
      const res = await fetch('/api/analytics/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState }),
      })
      if (res.ok) {
        setSummary((prev: any) => ({ ...prev, analytics_enabled: newState }))
        if (onSettingsUpdated) onSettingsUpdated()
      }
    } catch (e) {
      console.error('Error toggling analytics:', e)
    } finally {
      setTogglingTracking(false)
    }
  }

  // Purge Visits
  const handlePurgeVisits = async () => {
    setIsPurging(true)
    try {
      const res = await fetch('/api/analytics/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: purgePeriod }),
      })
      if (res.ok) {
        const data = await res.json()
        alert(`Se han eliminado ${data.deleted_count || 0} registros de visitas.`)
        setIsPurgeModalOpen(false)
        handleRefreshAll()
      } else {
        alert('No se pudieron eliminar los registros.')
      }
    } catch (e) {
      console.error('Error purging visits:', e)
    } finally {
      setIsPurging(false)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    const params = new URLSearchParams({
      period,
      device: deviceFilter,
      search: searchQuery,
    })
    window.open(`/api/analytics/export?${params.toString()}`, '_blank')
  }

  // Calculate Max for Trend Chart Scaling
  const maxVisitsInTrends = summary?.trends?.reduce((max: number, item: any) => Math.max(max, item.visits), 0) || 10

  return (
    <div className="space-y-6">
      {/* Top Controls & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Tracking On/Off Switch */}
          <button
            onClick={handleToggleTracking}
            disabled={togglingTracking || loadingSummary}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
              summary?.analytics_enabled
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            title="Activar o desactivar guardado de visitas"
          >
            <Power size={15} className={togglingTracking ? 'animate-spin' : ''} />
            <span>{summary?.analytics_enabled ? 'Rastreo en Vivo: ACTIVO' : 'Rastreo: EN PAUSA'}</span>
          </button>

          {/* Period Selector Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['today', '7d', '30d', 'all'] as const).map((p) => {
              const labels: Record<string, string> = {
                today: 'Hoy',
                '7d': '7 Días',
                '30d': '30 Días',
                all: 'Todo',
              }
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {labels[p]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Actualizar datos"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            title="Descargar informe completo en Excel / CSV"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsPurgeModalOpen(true)}
            className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all"
            title="Limpiar historial de visitas"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Pageviews */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-400 tracking-wider">Total Visitas</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Eye size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-black text-slate-900 font-mono mt-2">
            {loadingSummary ? '...' : (summary?.total_visits || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Activity size={12} className="text-blue-500" /> Páginas visualizadas
          </p>
        </div>

        {/* Unique Visitors */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-400 tracking-wider">Visitantes Únicos</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-black text-purple-900 font-mono mt-2">
            {loadingSummary ? '...' : (summary?.unique_visitors || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Shield size={12} className="text-purple-500" /> Dispositivos individuales
          </p>
        </div>

        {/* Today's Traffic */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-400 tracking-wider">Visitas Hoy</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-black text-emerald-900 font-mono mt-2">
            {loadingSummary ? '...' : (summary?.today_visits || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary?.today_visitors || 0} visitantes únicos hoy
          </p>
        </div>

        {/* Mobile vs Desktop % */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-400 tracking-wider">Tráfico Móvil</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Smartphone size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-black text-amber-900 font-mono mt-2">
            {loadingSummary ? '...' : `${Math.round(summary?.mobile_percentage || 0)}%`}
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary?.mobile_percentage || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Trend Graph: Visitas por Día */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" /> Tendencia de Visitas en el Tiempo
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Evolución diaria de visitas y visitantes únicos a la tienda.</p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
              <span>Visitas Totales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
              <span>Visitantes Únicos</span>
            </div>
          </div>
        </div>

        {/* Visual Trend Bars Chart */}
        {loadingSummary ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
            Cargando gráfico de tendencias...
          </div>
        ) : !summary?.trends || summary.trends.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <Calendar size={24} className="text-slate-300" />
            <span>Aún no hay suficiente historial para graficar en este período.</span>
          </div>
        ) : (
          <div className="relative pt-6">
            {/* Hover Tooltip display */}
            {hoveredTrend && (
              <div className="mb-3 p-2.5 bg-slate-900 text-white rounded-xl text-xs flex items-center justify-between max-w-sm mx-auto shadow-xl">
                <span className="font-bold">{hoveredTrend.date}</span>
                <div className="flex gap-3 font-mono">
                  <span className="text-blue-300 font-bold">{hoveredTrend.visits} visitas</span>
                  <span className="text-purple-300 font-bold">{hoveredTrend.unique_visitors} únicos</span>
                </div>
              </div>
            )}

            {/* Bars container */}
            <div className="h-48 flex items-end gap-2 sm:gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar">
              {summary.trends.map((item: any, idx: number) => {
                const heightPct = Math.max(8, Math.min(100, Math.round((item.visits / maxVisitsInTrends) * 100)))
                const uniqueHeightPct = Math.max(5, Math.min(heightPct, Math.round((item.unique_visitors / maxVisitsInTrends) * 100)))
                const dayLabel = item.date.length > 5 ? item.date.substring(5) : item.date

                return (
                  <div 
                    key={idx}
                    onMouseEnter={() => setHoveredTrend(item)}
                    onMouseLeave={() => setHoveredTrend(null)}
                    className="flex-1 min-w-[32px] sm:min-w-[44px] flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-full flex items-end justify-center gap-1 h-36 relative">
                      {/* Visits Bar */}
                      <div 
                        className="w-3 sm:w-4 bg-blue-500 group-hover:bg-blue-600 rounded-t-md transition-all relative"
                        style={{ height: `${heightPct}%` }}
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
                          {item.visits}
                        </span>
                      </div>

                      {/* Unique Visitors Bar */}
                      <div 
                        className="w-2.5 sm:w-3.5 bg-purple-400 group-hover:bg-purple-500 rounded-t-md transition-all"
                        style={{ height: `${uniqueHeightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-900 transition-colors">
                      {dayLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Dispositivos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Smartphone size={16} className="text-amber-500" /> Dispositivos
            </h4>
            <div className="space-y-3">
              {summary?.top_devices?.length ? summary.top_devices.map((d: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{d.name}</span>
                    <span className="font-mono text-slate-500">{d.count} ({Math.round(d.percentage)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full" 
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400">Sin datos aún</p>
              )}
            </div>
          </div>
        </div>

        {/* Navegadores */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Globe size={16} className="text-blue-500" /> Navegadores
            </h4>
            <div className="space-y-3">
              {summary?.top_browsers?.length ? summary.top_browsers.slice(0, 5).map((b: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 truncate max-w-[150px]">{b.name}</span>
                    <span className="font-mono text-slate-500">{b.count} ({Math.round(b.percentage)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full" 
                      style={{ width: `${b.percentage}%` }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400">Sin datos aún</p>
              )}
            </div>
          </div>
        </div>

        {/* Sistemas Operativos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Cpu size={16} className="text-indigo-500" /> Sistemas Operativos
            </h4>
            <div className="space-y-3">
              {summary?.top_os?.length ? summary.top_os.slice(0, 5).map((o: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{o.name}</span>
                    <span className="font-mono text-slate-500">{o.count} ({Math.round(o.percentage)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full" 
                      style={{ width: `${o.percentage}%` }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400">Sin datos aún</p>
              )}
            </div>
          </div>
        </div>

        {/* Páginas Más Vistas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-emerald-500" /> Páginas Más Visitadas
            </h4>
            <div className="space-y-2.5">
              {summary?.top_pages?.length ? summary.top_pages.slice(0, 5).map((p: any, i: number) => (
                <div key={i} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-800 truncate max-w-[180px]" title={p.name}>
                    {p.name}
                  </span>
                  <span className="font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                    {p.count} vistas
                  </span>
                </div>
              )) : (
                <p className="text-xs text-slate-400">Sin datos aún</p>
              )}
            </div>
          </div>
        </div>

        {/* Fuentes de Tráfico (Referrers) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Compass size={16} className="text-rose-500" /> Fuentes de Tráfico
            </h4>
            <div className="space-y-2.5">
              {summary?.top_referrers?.length ? summary.top_referrers.slice(0, 5).map((r: any, i: number) => (
                <div key={i} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 truncate max-w-[180px]">{r.name}</span>
                  <span className="font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-bold text-[10px]">
                    {r.count} visitas
                  </span>
                </div>
              )) : (
                <p className="text-xs text-slate-400">Sin datos aún</p>
              )}
            </div>
          </div>
        </div>

        {/* Ubicaciones (Países & Ciudades) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-teal-500" /> Ubicaciones Geográficas
            </h4>
            <div className="space-y-2.5">
              {summary?.top_countries?.length ? summary.top_countries.slice(0, 5).map((c: any, i: number) => (
                <div key={i} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{c.name} ({c.code})</span>
                  <span className="font-mono px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full font-bold text-[10px]">
                    {c.count} ({Math.round(c.percentage)}%)
                  </span>
                </div>
              )) : (
                <p className="text-xs text-slate-400">Sin datos aún</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Live Visits Table */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-emerald-600" /> Registro de Visitas en Vivo
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalVisitsCount} visitas registradas en el período seleccionado.
            </p>
          </div>

          {/* Search & Device Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar IP, ruta, ciudad..."
                className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-48 sm:w-60"
              />
            </div>

            <select
              value={deviceFilter}
              onChange={(e: any) => setDeviceFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="all">Todos los dispositivos</option>
              <option value="mobile">Smartphones</option>
              <option value="desktop">Computadores</option>
              <option value="tablet">Tablets</option>
              <option value="bot">Bots</option>
            </select>

            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-2 border border-slate-200 rounded-xl">
              <input 
                type="checkbox" 
                checked={includeAdminVisits}
                onChange={(e) => setIncludeAdminVisits(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0 w-3.5 h-3.5"
              />
              <span className="hidden sm:inline">Incluir mis visitas admin</span>
              <span className="sm:hidden">Ver admin</span>
            </label>
          </div>
        </div>

        {/* Visits List */}
        {loadingVisits ? (
          <div className="text-center py-16 text-slate-400 text-xs">Cargando registros...</div>
        ) : visits.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            No se encontraron visitas con los filtros aplicados.
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((v: any) => (
              <div 
                key={v.id}
                onClick={() => setSelectedVisit(v)}
                className="p-3.5 sm:p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm flex-shrink-0">
                    {v.device_type === 'mobile' ? <Smartphone size={18} className="text-blue-600" /> :
                     v.device_type === 'tablet' ? <Tablet size={18} className="text-purple-600" /> :
                     v.device_type === 'bot' ? <Cpu size={18} className="text-amber-600" /> :
                     <Monitor size={18} className="text-emerald-600" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-xs text-slate-900">{v.ip}</span>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md uppercase">
                        {v.country_code || 'CL'} • {v.city || 'Chile'}
                      </span>
                      {v.is_admin && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md uppercase flex items-center gap-1">
                          👑 Admin / Dueño
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-500">
                        {v.browser} ({v.os})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                      <span className="font-mono font-semibold text-slate-800">{v.path}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 truncate">{v.referrer_domain || 'Directo'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 flex-shrink-0">
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(v.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedVisit(v)
                    }}
                    className="px-3 py-1.5 bg-white group-hover:bg-slate-900 group-hover:text-white border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                  >
                    <Info size={13} />
                    <span>Detalle</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium">
              Página {currentPage} de {totalPages} ({totalVisitsCount} visitas)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchVisits(currentPage - 1, searchQuery, deviceFilter, period)}
                disabled={currentPage <= 1 || loadingVisits}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl font-bold flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <button
                onClick={() => fetchVisits(currentPage + 1, searchQuery, deviceFilter, period)}
                disabled={currentPage >= totalPages || loadingVisits}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl font-bold flex items-center gap-1"
              >
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Forensic Visit Inspection Modal */}
      <VisitDetailModal 
        visit={selectedVisit} 
        onClose={() => setSelectedVisit(null)} 
      />

      {/* Purge Modal */}
      <AnimatePresence>
        {isPurgeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsPurgeModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Limpiar Historial de Visitas</h3>
                  <p className="text-xs text-slate-400">Libera espacio eliminando visitas antiguas.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">¿Qué deseas eliminar?</label>
                <select 
                  value={purgePeriod} 
                  onChange={(e: any) => setPurgePeriod(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="older_than_30d">Visitas de más de 30 días</option>
                  <option value="older_than_90d">Visitas de más de 90 días</option>
                  <option value="all">Eliminar TODO el historial</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurgeModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handlePurgeVisits}
                  disabled={isPurging}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20"
                >
                  {isPurging ? 'Limpiando...' : 'Confirmar Limpieza'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
