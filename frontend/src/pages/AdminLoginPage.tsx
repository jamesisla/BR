import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Admin | Iniciar Sesión'
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('tienda_admin_token', data.token)
        navigate('/admin')
      } else {
        setError('Contraseña incorrecta. Inténtalo de nuevo.')
      }
    } catch (err) {
      setError('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">Panel de Control</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">Introduce la contraseña maestra para administrar tu tienda</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Master Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all font-mono text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-semibold bg-red-50 p-3.5 rounded-xl">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-xs font-bold justify-center rounded-xl shadow-lg mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                Entrar al Dashboard <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
