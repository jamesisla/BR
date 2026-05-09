
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search as SearchIcon, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      let url = `${apiUrl}/products/?q=${encodeURIComponent(query)}`
      if (category) url += `&category=${category}`
      
      fetch(url)
        .then(res => res.json())
        .then(data => setResults(data))
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, category])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 2000, padding: '100px 0', overflowY: 'auto' }}
        >
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'end', marginBottom: '50px' }}>
               <X onClick={onClose} size={40} style={{ cursor: 'pointer', opacity: 0.2 }} />
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
               <div style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '20px', marginBottom: '30px' }}>
                    <SearchIcon size={30} style={{ marginRight: '20px', opacity: 0.3 }} />
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="¿Qué estás buscando hoy?"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      style={{ background: 'none', border: 'none', fontSize: '2.5rem', width: '100%', outline: 'none', fontStyle: 'italic' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px' }}>
                     <button 
                       onClick={() => setCategory(null)}
                       style={{ padding: '8px 20px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, background: !category ? 'var(--primary)' : '#f0f0f0', color: !category ? 'white' : '#999', border: 'none', cursor: 'pointer' }}
                     >
                        Todos
                     </button>
                     {['cafes', 'accesorios'].map(cat => (
                       <button 
                         key={cat}
                         onClick={() => setCategory(cat)}
                         style={{ padding: '8px 20px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, background: category === cat ? 'var(--primary)' : '#f0f0f0', color: category === cat ? 'white' : '#999', border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}
                       >
                          {cat}
                       </button>
                     ))}
                  </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' }}>
                  {results.map(product => (
                    <Link key={product.id} href={`/product/${product.slug}`} onClick={onClose} style={{ textDecoration: 'none' }}>
                       <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '20px', background: '#f9f7f4', transition: 'all 0.3s' }}>
                          <img 
                            src={product.image_url || "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?q=80&w=200&auto=format&fit=crop"} 
                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                          />
                          <div>
                             <h4 style={{ color: 'var(--primary)', marginBottom: '5px' }}>{product.name}</h4>
                             <p style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: 800 }}>${product.base_price.toLocaleString()}</p>
                          </div>
                          <ArrowRight size={16} style={{ marginLeft: 'auto', opacity: 0.2 }} />
                       </div>
                    </Link>
                  ))}
               </div>

               {(query || category) && results.length === 0 && (
                 <p style={{ textAlign: 'center', opacity: 0.4, fontSize: '1.2rem', marginTop: '60px' }}>No encontramos productos con ese criterio.</p>
               )}

               {!query && !category && (
                 <div style={{ opacity: 0.3, marginTop: '100px' }}>
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 800, marginBottom: '20px' }}>Sugerencias</p>
                    <div style={{ display: 'flex', gap: '20px' }}>
                       <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setQuery('Etiopía')}>Etiopía</span>
                       <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setQuery('Prensa')}>Prensa</span>
                       <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setQuery('Brasil')}>Brasil</span>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
