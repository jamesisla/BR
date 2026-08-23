import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  MapPin, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Cpu, 
  Wifi, 
  Clock, 
  Shield, 
  Copy, 
  Check, 
  Compass, 
  Layers, 
  Info,
  Maximize2,
  HardDrive,
  Share2
} from 'lucide-react'

interface VisitDetailModalProps {
  visit: any | null
  onClose: () => void
}

export default function VisitDetailModal({ visit, onClose }: VisitDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!visit) return null

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'mobile':
        return <Smartphone size={18} className="text-blue-600" />
      case 'tablet':
        return <Tablet size={18} className="text-purple-600" />
      case 'bot':
        return <Cpu size={18} className="text-amber-600" />
      default:
        return <Monitor size={18} className="text-emerald-600" />
    }
  }

  const formattedDate = new Date(visit.created_at).toLocaleString('es-CL', {
    dateStyle: 'full',
    timeStyle: 'medium'
  })

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                {getDeviceIcon(visit.device_type)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-mono">{visit.ip}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                    {visit.device_type || 'Desktop'}
                  </span>
                  {visit.is_secure && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 flex items-center gap-1">
                      <Shield size={10} /> HTTPS
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{formattedDate}</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-200/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs">
            {/* Section 1: Ubicación & Proveedor de Red */}
            <div>
              <h4 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3 flex items-center gap-2">
                <MapPin size={14} className="text-rose-500" /> Ubicación Geográfica & Conexión de Red
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">País</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">{visit.country_name || 'Desconocido'} ({visit.country_code || 'CL'})</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Ciudad / Comuna</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">{visit.city || 'Desconocida'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Región / Estado</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">{visit.region || 'Región'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Proveedor / ISP</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate" title={visit.isp}>{visit.isp || 'Internet'}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Dispositivo & Hardware */}
            <div>
              <h4 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Cpu size={14} className="text-indigo-500" /> Dispositivo, Pantalla & Hardware Extraído
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Resolución de Pantalla</span>
                  <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block flex items-center gap-1">
                    <Maximize2 size={12} className="text-slate-400" /> {visit.screen_resolution || 'No disponible'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Ventana (Viewport)</span>
                  <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">{visit.viewport_size || 'No disponible'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Densidad Píxeles (DPR)</span>
                  <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">{visit.pixel_ratio ? `${visit.pixel_ratio}x (Retina/HD)` : '1x'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Profundidad de Color</span>
                  <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">{visit.color_depth ? `${visit.color_depth} bits` : '24 bits'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Núcleos de CPU</span>
                  <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">{visit.hardware_concurrency ? `${visit.hardware_concurrency} Cores` : 'No disponible'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Memoria RAM Aprox.</span>
                  <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block flex items-center gap-1">
                    <HardDrive size={12} className="text-slate-400" /> {visit.device_memory ? `${visit.device_memory} GB` : 'No disponible'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Pantalla Táctil (Touch)</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {visit.touch_points > 0 ? `Sí (${visit.touch_points} puntos)` : 'No (Mouse/Teclado)'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Plataforma</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">{visit.platform || 'Estándar'}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Navegador & Entorno */}
            <div>
              <h4 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Globe size={14} className="text-emerald-500" /> Navegador, Sistema Operativo & Red
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Navegador</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">{visit.browser} {visit.browser_version}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Sistema Operativo</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">{visit.os} {visit.os_version}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Idioma del Cliente</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate" title={visit.languages || visit.language}>
                    {visit.language || 'es-CL'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Zona Horaria (Timezone)</span>
                  <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block truncate" title={visit.timezone}>
                    {visit.timezone || 'America/Santiago'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Tipo de Conexión</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block uppercase flex items-center gap-1">
                    <Wifi size={12} className="text-slate-400" /> {visit.network_type || 'Banda Ancha / WiFi'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Velocidad Estimada</span>
                  <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">{visit.downlink ? `${visit.downlink} Mbps` : 'Alta velocidad'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Latencia RTT</span>
                  <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">{visit.rtt ? `${visit.rtt} ms` : 'Baja'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium block">Desfase Horario</span>
                  <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">{visit.timezone_offset !== undefined ? `UTC ${visit.timezone_offset > 0 ? '-' : '+'}${Math.abs(visit.timezone_offset / 60)}h` : 'UTC-3'}</span>
                </div>
              </div>
            </div>

            {/* Section 4: Navegación & Origen */}
            <div>
              <h4 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Compass size={14} className="text-amber-500" /> Página Visitada & Procedencia (Referrer)
              </h4>
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-medium block">Ruta Visitada</span>
                    <span className="font-mono font-bold text-slate-900 text-xs break-all">{visit.path}</span>
                  </div>
                  <button 
                    onClick={() => handleCopy(visit.path, 'path')}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-800"
                    title="Copiar ruta"
                  >
                    {copiedField === 'path' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-medium block">Fuente / Referente</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">{visit.referrer_domain || 'Directo'}</span>
                    {visit.referrer && visit.referrer !== visit.referrer_domain && (
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5" title={visit.referrer}>{visit.referrer}</span>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-medium block">Título de la Página</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">{visit.page_title || 'Página de la tienda'}</span>
                  </div>
                </div>

                {/* UTM Marketing Tags if present */}
                {(visit.utm_source || visit.utm_campaign) && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <Share2 size={12} /> Campaña de Marketing (Parámetros UTM)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-emerald-950">
                      {visit.utm_source && <div><span className="text-emerald-700 font-sans">Source:</span> {visit.utm_source}</div>}
                      {visit.utm_medium && <div><span className="text-emerald-700 font-sans">Medium:</span> {visit.utm_medium}</div>}
                      {visit.utm_campaign && <div><span className="text-emerald-700 font-sans">Campaign:</span> {visit.utm_campaign}</div>}
                      {visit.utm_term && <div><span className="text-emerald-700 font-sans">Term:</span> {visit.utm_term}</div>}
                      {visit.utm_content && <div><span className="text-emerald-700 font-sans">Content:</span> {visit.utm_content}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Identificadores de Sesión & User-Agent Completo */}
            <div>
              <h4 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Info size={14} className="text-slate-500" /> Identificadores & User-Agent Completo
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-medium block">ID Visitante Único</span>
                      <span className="font-mono text-[11px] text-slate-800 block truncate">{visit.visitor_id}</span>
                    </div>
                    <button 
                      onClick={() => handleCopy(visit.visitor_id, 'vid')}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-800"
                    >
                      {copiedField === 'vid' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-medium block">ID de Sesión</span>
                      <span className="font-mono text-[11px] text-slate-800 block truncate">{visit.session_id}</span>
                    </div>
                    <button 
                      onClick={() => handleCopy(visit.session_id, 'sid')}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-800"
                    >
                      {copiedField === 'sid' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl relative group">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">User-Agent Header</span>
                    <button 
                      onClick={() => handleCopy(visit.user_agent, 'ua')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      {copiedField === 'ua' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedField === 'ua' ? 'Copiado!' : 'Copiar UA'}</span>
                    </button>
                  </div>
                  <p className="font-mono text-[11px] leading-relaxed break-all text-slate-300 select-all">
                    {visit.user_agent || 'No disponible'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-md"
            >
              Cerrar Detalle
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
