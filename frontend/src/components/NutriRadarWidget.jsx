import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const TYPE_CONFIG = {
  non_compliance:    { color: '#ef4444', bg: '#ef444418', icon: '📵', label: 'Non-compliance' },
  deficit_proteines: { color: '#f97316', bg: '#f9731618', icon: '🥩', label: 'Déficit protéines' },
  surplus_calorique: { color: '#f59e0b', bg: '#f59e0b18', icon: '⬆️', label: 'Surplus' },
  deficit_calorique: { color: '#ef4444', bg: '#ef444418', icon: '⬇️', label: 'Déficit' },
  bonne_compliance:  { color: '#22c55e', bg: '#22c55e18', icon: '🏆', label: 'Excellente' },
  plateau:           { color: '#6366f1', bg: '#6366f118', icon: '📊', label: 'Plateau' },
  irregularite:      { color: '#f59e0b', bg: '#f59e0b18', icon: '〰️', label: 'Irrégulier' },
}

export default function NutriRadarWidget() {
  // ⚠️ BETA — Radar Nutrition IA désactivé. Retirer ce bloc pour réactiver.
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 20, padding: '16px', marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: 'rgba(34,197,94,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>🥗</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 900, fontSize: 14, color: 'var(--text-primary)' }}>Radar Nutrition IA</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bientôt disponible</p>
      </div>
      <span style={{
        background: 'rgba(34,197,94,0.12)', color: '#22c55e',
        fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, flexShrink: 0,
      }}>En finalisation</span>
    </div>
  )

  const navigate = useNavigate()
  const { token } = useStore()
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch(`${API}/nutri/insights`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setInsights(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  async function generate() {
    setGenerating(true)
    try {
      const res = await fetch(`${API}/nutri/insights/generate`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (Array.isArray(data)) setInsights(data)
    } catch {}
    setGenerating(false)
  }

  const urgents = insights.filter(i => i.severite === 3).length
  const top3 = [...insights].sort((a, b) => b.severite - a.severite).slice(0, 3)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: top3.length > 0 ? '1px solid var(--border-soft)' : 'none',
        background: urgents > 0 ? 'rgba(239,68,68,0.05)' : 'transparent',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: urgents > 0 ? '#ef444420' : 'rgba(34,197,94,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🥗</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p style={{ fontWeight: 900, fontSize: 14, color: 'var(--text-primary)' }}>Radar Nutrition IA</p>
              {urgents > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 20 }}>
                  {urgents}
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {loading ? '…' : insights.length > 0 ? `${insights.length} insights actifs` : 'Aucune analyse'}
            </p>
          </div>
        </div>
        <button
          onClick={insights.length === 0 ? generate : () => navigate('/nutri/insights')}
          disabled={generating}
          style={{
            padding: '7px 14px', borderRadius: 10, border: 'none',
            background: '#22c55e', color: '#fff', fontWeight: 800, fontSize: 12,
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.7 : 1,
          }}>
          {generating ? '⟳' : insights.length === 0 ? 'Analyser' : 'Voir tout'}
        </button>
      </div>

      {/* Top 3 */}
      {top3.map((insight, idx) => {
        const cfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.irregularite
        return (
          <div key={insight.id}
            onClick={() => navigate('/nutri/insights')}
            style={{
              padding: '12px 16px',
              borderBottom: idx < top3.length - 1 ? '1px solid var(--border-soft)' : 'none',
              display: 'flex', gap: 12, alignItems: 'flex-start',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: cfg.bg, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>{cfg.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>{insight.clientName}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '1px 6px', borderRadius: 10 }}>
                  {cfg.label.toUpperCase()}
                </span>
                {insight.severite === 3 && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{insight.titre}</p>
            </div>
            <span style={{ color: 'var(--text-faint)', fontSize: 14, marginTop: 4 }}>›</span>
          </div>
        )
      })}

      {!loading && insights.length === 0 && (
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
            Analyse la compliance et les macros de tous tes clients en un clic.
          </p>
          <button onClick={generate} disabled={generating} style={{
            padding: '9px 20px', borderRadius: 10, border: 'none',
            background: '#22c55e', color: '#fff', fontWeight: 800, fontSize: 13,
            cursor: generating ? 'not-allowed' : 'pointer',
          }}>
            {generating ? '⟳ Analyse…' : '⟳ Analyser mes clients'}
          </button>
        </div>
      )}
    </div>
  )
}
