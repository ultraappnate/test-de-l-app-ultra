import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const TYPE_CONFIG = {
  absence:     { color: '#ef4444', bg: '#ef444418', icon: '⚠️', label: 'Absence' },
  stagnation:  { color: '#f97316', bg: '#f9731618', icon: '📉', label: 'Stagnation' },
  surmenage:   { color: '#f59e0b', bg: '#f59e0b18', icon: '🔥', label: 'Surmenage' },
  record:      { color: '#22c55e', bg: '#22c55e18', icon: '🏆', label: 'Record' },
  opportunite: { color: '#6366f1', bg: '#6366f118', icon: '📈', label: 'Opportunité' },
  engagement:  { color: '#06b6d4', bg: '#06b6d418', icon: '⚡', label: 'Engagement' },
}

export default function CoachRadarWidget() {
  const navigate = useNavigate()
  const { token } = useStore()
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch(`${API}/coach/insights`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setInsights(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  async function generate() {
    setGenerating(true)
    try {
      const res = await fetch(`${API}/coach/insights/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
        borderBottom: insights.length > 0 ? '1px solid var(--border-soft)' : 'none',
        background: urgents > 0 ? 'rgba(239,68,68,0.05)' : 'transparent',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: urgents > 0 ? '#ef444420' : 'var(--accent-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🤖</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p style={{ fontWeight: 900, fontSize: 14, color: 'var(--text-primary)' }}>Radar Coach IA</p>
              {urgents > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff',
                  fontSize: 10, fontWeight: 800,
                  padding: '1px 6px', borderRadius: 20,
                }}>{urgents}</span>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {loading ? '…' : insights.length > 0 ? `${insights.length} insights actifs` : 'Aucune analyse'}
            </p>
          </div>
        </div>
        <button
          onClick={insights.length === 0 ? generate : () => navigate('/coach/insights')}
          disabled={generating}
          style={{
            padding: '7px 14px', borderRadius: 10,
            border: 'none', background: 'var(--accent)',
            color: '#fff', fontWeight: 800, fontSize: 12,
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.7 : 1,
          }}>
          {generating ? '⟳' : insights.length === 0 ? 'Analyser' : 'Voir tout'}
        </button>
      </div>

      {/* Top 3 insights */}
      {top3.map((insight, idx) => {
        const cfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.engagement
        return (
          <div key={insight.id}
            onClick={() => navigate('/coach/insights')}
            style={{
              padding: '12px 16px',
              borderBottom: idx < top3.length - 1 ? '1px solid var(--border-soft)' : 'none',
              display: 'flex', gap: 12, alignItems: 'flex-start',
              cursor: 'pointer',
              transition: 'background 0.15s',
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
                <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>
                  {insight.clientName}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  color: cfg.color, background: cfg.bg,
                  padding: '1px 6px', borderRadius: 10,
                }}>{cfg.label.toUpperCase()}</span>
                {insight.severite === 3 && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0, display: 'inline-block' }} />
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {insight.titre}
              </p>
            </div>
            <span style={{ color: 'var(--text-faint)', fontSize: 14, marginTop: 4 }}>›</span>
          </div>
        )
      })}

      {/* État vide avec CTA */}
      {!loading && insights.length === 0 && (
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
            Lance une analyse IA pour savoir exactement sur quel client agir aujourd'hui.
          </p>
          <button onClick={generate} disabled={generating} style={{
            padding: '9px 20px', borderRadius: 10,
            border: 'none', background: 'var(--accent)',
            color: '#fff', fontWeight: 800, fontSize: 13,
            cursor: generating ? 'not-allowed' : 'pointer',
          }}>
            {generating ? '⟳ Analyse en cours…' : '⟳ Analyser mes clients'}
          </button>
        </div>
      )}
    </div>
  )
}
