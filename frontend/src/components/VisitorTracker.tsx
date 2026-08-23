import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// Generador de UUID para clientes sin crypto.randomUUID
function getUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Obtener o inicializar ID único del visitante (persistente)
function getVisitorId(): string {
  try {
    let vid = localStorage.getItem('tienda_vid')
    if (!vid) {
      vid = 'v_' + getUUID()
      localStorage.setItem('tienda_vid', vid)
    }
    return vid
  } catch (e) {
    return 'v_' + getUUID()
  }
}

// Obtener o inicializar ID de sesión (expira a los 30 minutos de inactividad)
function getSessionId(): string {
  try {
    const now = Date.now()
    const rawSession = sessionStorage.getItem('tienda_sid_data')
    if (rawSession) {
      const data = JSON.parse(rawSession)
      if (now - data.timestamp < 30 * 60 * 1000) {
        data.timestamp = now
        sessionStorage.setItem('tienda_sid_data', JSON.stringify(data))
        return data.id
      }
    }
    const newSession = {
      id: 's_' + getUUID(),
      timestamp: now
    }
    sessionStorage.setItem('tienda_sid_data', JSON.stringify(newSession))
    return newSession.id
  } catch (e) {
    return 's_' + getUUID()
  }
}

export default function VisitorTracker() {
  const location = useLocation()
  const visitStartRef = useRef<number>(Date.now())
  const lastPathRef = useRef<string>('')

  useEffect(() => {
    const fullPath = location.pathname + location.search + location.hash
    if (lastPathRef.current === fullPath) return
    lastPathRef.current = fullPath

    visitStartRef.current = Date.now()

    // 1. Extraer parámetros UTM de la URL
    const searchParams = new URLSearchParams(location.search)
    const utmSource = searchParams.get('utm_source') || ''
    const utmMedium = searchParams.get('utm_medium') || ''
    const utmCampaign = searchParams.get('utm_campaign') || ''
    const utmTerm = searchParams.get('utm_term') || ''
    const utmContent = searchParams.get('utm_content') || ''

    // 2. Extraer información profunda del dispositivo y pantalla
    const screenRes = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : ''
    const viewportSize = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : ''
    const colorDepth = typeof window !== 'undefined' ? (window.screen.colorDepth || 24) : 24
    const pixelRatio = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1

    // 3. Extraer información de hardware y procesador
    const nav = typeof navigator !== 'undefined' ? navigator : ({} as any)
    const hardwareConcurrency = nav.hardwareConcurrency || 0
    const deviceMemory = (nav as any).deviceMemory || 0
    const touchPoints = nav.maxTouchPoints || 0
    const platform = nav.platform || ''
    const language = nav.language || ''
    const languages = Array.isArray(nav.languages) ? nav.languages.join(', ') : language

    // 4. Extraer información de conexión y red
    const conn = (nav as any).connection || (nav as any).mozConnection || (nav as any).webkitConnection
    const networkType = conn?.effectiveType || ''
    const downlink = conn?.downlink || 0
    const rtt = conn?.rtt || 0

    // 5. Extraer zona horaria
    let timezone = ''
    let timezoneOffset = 0
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      timezoneOffset = new Date().getTimezoneOffset()
    } catch (e) {
      // ignore
    }

    // 6. Verificar si es visita de un administrador logueado
    const isAdmin = location.pathname.startsWith('/admin') || !!localStorage.getItem('tienda_admin_token')

    const payload = {
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      path: fullPath,
      page_url: window.location.href,
      page_title: document.title || 'Tienda',
      referrer: document.referrer || '',
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_term: utmTerm,
      utm_content: utmContent,
      screen_resolution: screenRes,
      viewport_size: viewportSize,
      color_depth: colorDepth,
      pixel_ratio: pixelRatio,
      hardware_concurrency: hardwareConcurrency,
      device_memory: deviceMemory,
      touch_points: touchPoints,
      network_type: networkType,
      downlink: downlink,
      rtt: rtt,
      language: language,
      languages: languages,
      timezone: timezone,
      timezone_offset: timezoneOffset,
      platform: platform,
      is_admin: isAdmin,
      duration_seconds: 0,
    }

    // Enviar evento de visita al servidor (silencioso y seguro)
    try {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Ignorar fallos de red silenciosamente
      })
    } catch (e) {
      // ignore
    }
  }, [location.pathname, location.search])

  return null
}
