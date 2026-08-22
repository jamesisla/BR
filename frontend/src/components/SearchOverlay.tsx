import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search as SearchIcon, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SearchOverlay({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    if (query.trim() === '' && !category) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(() => {
      let url = `/api/products/?q=${encodeURIComponent(query)}`
      if (category) url += `&category=${category}`
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setResults(data)
        })
        .catch(err => console.error(err))
    }, 250)

    return () => clearTimeout(timeoutId)
  }, [query, category])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 bg-white z-50 py-16 px-6 overflow-y-auto"
        >
          <div className="container max-w-4xl">
            <div className="flex justify-end mb-8">
               <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-50 transition-colors">
                  <X size={28} />
               </button>
            </div>

            <div className="max-w-2xl mx-auto">
               <div className="mb-10">
                  <div className="flex items-center border-b-2 border-slate-900 pb-4 mb-6">
                    <SearchIcon size={28} className="mr-4 text-slate-400" />
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="¿Qué estás buscando hoy?"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="bg-transparent border-none text-2xl md:text-3xl w-full outline-none font-serif italic text-slate-900 placeholder:text-slate-300"
                    />
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                     <button 
                       onClick={() => setCategory(null)}
                       className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!category ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                     >
                        Todos
                     </button>
                     {['accesorios', 'general', 'cafes'].map(cat => (
                       <button 
                         key={cat}
                         onClick={() => setCategory(cat)}
                         className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${category === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                       >
                          {cat}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.map(product => (
                    <Link key={product.id} to={`/product/${product.slug}`} onClick={onClose} className="block">
                       <div className="flex gap-4 items-center p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl transition-all border border-slate-100">
                          <img 
                            src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop"} 
                            className="w-16 h-16 object-cover rounded-xl bg-white"
                            alt={product.name}
                          />
                          <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-slate-900 text-sm truncate">{product.name}</h4>
                             <p className="text-xs font-bold text-secondary mt-0.5">${Number(product.base_price || 0).toLocaleString()}</p>
                          </div>
                          <ArrowRight size={16} className="text-slate-300 ml-auto" />
                       </div>
                    </Link>
                  ))}
               </div>

               {(query || category) && results.length === 0 && (
                 <p className="text-center text-slate-400 text-sm mt-12 font-medium">No se encontraron productos con ese criterio.</p>
               )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
