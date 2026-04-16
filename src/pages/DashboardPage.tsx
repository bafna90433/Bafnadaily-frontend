import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import useSettingsStore from '../store/settingsStore'
import api from '../utils/api'

export default function DashboardPage() {
  const { settings } = useSettingsStore()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(res.data.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const focusSlugs = ['belt', 'keychains', 'hand-bags', 'women-kit', 'men']
  const focusMap: Record<string, string> = {
    'belt': 'BELT',
    'keychains': 'KEYCHAIN',
    'hand-bags': 'HAND BAG',
    'women-kit': 'WOMEN KIT',
    'men': 'MEN'
  }

  // Create 8 slots (2x4)
  const dashboardCats = categories.filter(c => c.isDashboardMain === true).slice(0, 8)
  
  // Fill remaining slots if fewer than 8 dashboard cats
  const slots = [...dashboardCats]
  while (slots.length < 8) {
    slots.push({ name: 'Coming Soon', emoji: '📦', soon: true } as any)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-20">
      <header className="text-center mb-12 px-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-[10px] font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-[0.2em]">
          <Sparkles size={12}/> Official Storefront
        </div>
        <h1 className="text-3xl md:text-5xl font-heading font-black text-gray-900 mb-4 tracking-tight">
          Select <span className="text-primary text-glow">Category</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto font-medium">
          Choose a department to start browsing our premium collection
        </p>
      </header>

      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8">
          {slots.map((cat, i) => (
            cat.soon ? (
              <div key={i} className="aspect-square bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 opacity-40 grayscale transition-all">
                <span className="text-4xl md:text-5xl drop-shadow-sm">📦</span>
                <span className="text-[10px] md:text-xs font-black text-gray-400 tracking-widest uppercase">{cat.name}</span>
              </div>
            ) : (
              <Link 
                key={cat.slug || i} 
                to={`/category/${cat.slug}`}
                className="aspect-square bg-white border-2 border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 hover:border-primary hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                {cat.image ? (
                   <img src={cat.image} className="w-20 h-20 md:w-32 md:h-32 object-contain group-hover:scale-110 transition-transform duration-500 z-10" alt={cat.name} />
                ) : (
                  <span className="text-4xl md:text-6xl group-hover:scale-110 transition-transform duration-500 drop-shadow-md z-10">
                    {cat.emoji || '✨'}
                  </span>
                )}
                <span className="text-[11px] md:text-sm font-black text-gray-800 tracking-wider uppercase group-hover:text-primary transition-colors z-10 px-4 text-center">
                  {cat.name}
                </span>
              </Link>
            )
          ))}
        </div>
      </section>

      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-primary/2 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"/>
      <div className="fixed bottom-0 left-0 -z-10 w-80 h-80 bg-purple-500/2 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"/>
    </div>
  )
}
