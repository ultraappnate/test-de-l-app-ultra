import { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function AIInsights() {
  const { aiGetInsights } = useStore()
  const [insights, setInsights] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)

  useEffect(() => {
    aiGetInsights().then(res => {
      if (res?.success && res.insights) setInsights(res.insights)
      else setError(true)
      setLoading(false)
    })
  }, [])

  const typeColor = {
    growth:      { bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)',   text: '#4ade80' },
    retention:   { bg: 'rgba(58,82,168,0.08)',   border: 'rgba(58,82,168,0.25)',   text: '#818cf8' },
    nutrition:   { bg: 'rgba(39,174,96,0.08)',   border: 'rgba(39,174,96,0.2)',    text: '#27ae60' },
    performance: { bg: 'rgba(232,160,32,0.08)',  border: 'rgba(232,160,32,0.2)',   text: '#e8a020' },
  }

  if (error) return null

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">✦</span>
        <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Insights IA du jour
        </p>
        <span className="text-[9px] px-2 py-0.5 rounded-full font-black ml-auto"
          style={{ background: 'rgba(160,56,72,0.1)', color: 'var(--accent)', border: '1px solid rgba(160,56,72,0.2)' }}>
          Claude
        </span>
      </div>

      {loading ? (
        <div className="flex gap-3">
          {[0,1,2].map(i => (
            <div key={i} className="flex-1 h-16 rounded-xl animate-pulse" style={{ background: 'var(--bg-base)' }}/>
          ))}
        </div>
      ) : (
        <div className="flex gap-3">
          {insights.map((ins, i) => {
            const c = typeColor[ins.type] || typeColor.growth
            return (
              <div key={i} className="flex-1 rounded-xl p-3" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm">{ins.icon}</span>
                  <p className="text-[11px] font-black" style={{ color: c.text }}>{ins.title}</p>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ins.text}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
