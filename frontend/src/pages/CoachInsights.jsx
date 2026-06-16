import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const TYPE_CONFIG = {
  absence:     { label: 'Absence',      color: '#ef4444', bg: '#ef444418', icon: '⚠️' },
  stagnation:  { label: 'Stagnation',   color: '#f97316', bg: '#f9731618', icon: '📉' },
  surmenage:   { label: 'Surmenage',    color: '#f59e0b', bg: '#f59e0b18', icon: '🔥' },
  record:      { label: 'Record',       color: '#22c55e', bg: '#22c55e18', icon: '🏆' },
  opportunite: { label: 'Opportunité',  color: '#6366f1', bg: '#6366f118', icon: '📈' },
  engagement:  { label: 'Engagement',   color: '#06b6d4', bg: '#06b6d418', icon: '⚡' },
}

const ACTION_CONFIG = {
  message:           { label: 'Envoyer un message', icon: '💬' },
  ajuster_programme: { label: 'Ajuster le programme', icon: '✏️' },
  appel:             { label: 'Appeler le client', icon: '📞' },
  feliciter:         { label: 'Féliciter', icon: '🎉' },
  rien:              { label: 'Aucune action requise', icon: '✓' },
}

const SEV_BORDER = { 1: '#22c55e', 2: '#f97316', 3: '#ef4444' }

function InsightCard({ insight, onDismiss, onAction }) {
  const cfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.engagement
  const act = ACTION_CONFIG[insight.action] || ACTION_CONFIG.rien
  const borderColor = SEV_BORDER[insight.severite] || '#6366f1'

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid var(--border)`,
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: 16,
      padding: '16px 18px',
      position: 'relative',
    }}>
      {/* Dismiss */}
      <button onClick={() => onDismiss(insight.id)} style={{
        position: 'absolute', top: 12, right: 12,
        background: 'none', border: 'none',
        color: 'var(--text-faint)', fontSize: 16, cursor: 'pointer', lineHeight: 1,
      }}>✕</button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: cfg.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>{cfg.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: 'var(--text-primary)' }}>
              {insight.clientName}
            </span>
            <span style={{
              background: cfg.bg, color: cfg.color,
              fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 20,
            }}>{cfg.label}</span>
            {insight.severite === 3 && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444' }}>URGENT</span>
            )}
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginTop: 1 }}>
            {insight.titre}
          </p>
        </div>
      </div>

      {/* Message IA */}
      <p style={{
        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55,
        marginBottom: 10,
        padding: '10px 12px',
        background: 'var(--bg-base)',
        borderRadius: 10,
      }}>{insight.message}</p>

      {/* Recommandation */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'flex-start',
        marginBottom: 14,
      }}>
        <span style={{ color: 'var(--accent)', fontWeight: 900, fontSize: 14, flexShrink: 0, marginTop: 1 }}>→</span>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {insight.recommandation}
        </p>
      </div>

      {/* Action CTA */}
      {insight.action !== 'rien' && (
        <button onClick={() => onAction(insight)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 14px',
          borderRadius: 10,
          border: 'none',
          background: 'var(--accent)',
          color: '#fff',
          fontWeight: 800, fontSize: 13,
          cursor: 'pointer',
          width: '100%', justifyContent: 'center',
        }}>
          <span>{act.icon}</span>
          <span>{act.label}</span>
        </button>
      )}
    </div>
  )
}

export default function CoachInsights() {
  const navigate = useNavigate()
  const { token } = useStore()
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filter, setFilter] = useState('tous')
  const [lastGenerated, setLastGenerated] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { loadInsights() }, [])

  async function loadInsights() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/coach/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setInsights(data)
        if (data.length > 0) setLastGenerated(data[0].createdAt)
      }
    } catch {}
    setLoading(false)
  }

  async function generate() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`${API}/coach/insights/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setInsights(Array.isArray(data) ? data : [])
      if (data.length > 0) setLastGenerated(data[0].createdAt)
    } catch (err) {
      setError(err.message)
    }
    setGenerating(false)
  }

  async function dismiss(id) {
    await fetch(`${API}/coach/insights/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setInsights(prev => prev.filter(i => i.id !== id))
  }

  function handleAction(insight) {
    if (insight.action === 'message' || insight.action === 'feliciter' || insight.action === 'appel') {
      navigate('/chat')
    } else if (insight.action === 'ajuster_programme') {
      navigate('/coach/programs')
    }
  }

  const filtered = filter === 'tous' ? insights : insights.filter(i => i.type === filter)
  const urgents = insights.filter(i => i.severite === 3).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '14px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 20, cursor: 'pointer' }}>←</button>
            <div>
              <p style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)' }}>
                Radar Coach IA
                {urgents > 0 && (
                  <span style={{
                    marginLeft: 8, background: '#ef4444', color: '#fff',
                    fontSize: 11, fontWeight: 800,
                    padding: '2px 7px', borderRadius: 20, verticalAlign: 'middle',
                  }}>{urgents}</span>
                )}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {insights.length} insights · {lastGenerated ? `Actualisé ${new Date(lastGenerated).toLocaleDateString('fr-FR')}` : 'Jamais généré'}
              </p>
            </div>
          </div>
          <button onClick={generate} disabled={generating} style={{
            padding: '8px 16px', borderRadius: 10,
            border: 'none', background: generating ? 'var(--border)' : 'var(--accent)',
            color: generating ? 'var(--text-faint)' : '#fff',
            fontWeight: 800, fontSize: 13, cursor: generating ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}>
            {generating ? '⟳ Analyse…' : '⟳ Actualiser'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(16px,4vw,24px)' }}>

        {/* Résumé rapide */}
        {insights.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: 10, marginBottom: 20,
          }}>
            {[
              { label: 'Urgents', value: insights.filter(i => i.severite === 3).length, color: '#ef4444' },
              { label: 'Attention', value: insights.filter(i => i.severite === 2).length, color: '#f97316' },
              { label: 'Positifs', value: insights.filter(i => ['record','engagement','opportunite'].includes(i.type)).length, color: '#22c55e' },
              { label: 'Total', value: insights.length, color: 'var(--text-primary)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '12px', textAlign: 'center',
              }}>
                <p style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, marginTop: 3 }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtres */}
        {insights.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {['tous', ...Object.keys(TYPE_CONFIG)].map(f => {
              const cfg = TYPE_CONFIG[f]
              const count = f === 'tous' ? insights.length : insights.filter(i => i.type === f).length
              if (f !== 'tous' && count === 0) return null
              return (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '6px 12px', borderRadius: 20,
                  border: `1px solid ${filter === f ? (cfg?.color || 'var(--accent)') : 'var(--border)'}`,
                  background: filter === f ? (cfg?.bg || 'var(--accent-subtle)') : 'var(--bg-card)',
                  color: filter === f ? (cfg?.color || 'var(--accent)') : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                  {cfg?.icon} {cfg?.label || 'Tous'} {count > 0 && `(${count})`}
                </button>
              )
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#ef444418', border: '1px solid #ef444440',
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          }}>
            <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>{error}</p>
          </div>
        )}

        {/* État vide */}
        {!loading && insights.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--bg-card)', borderRadius: 20,
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🤖</p>
            <p style={{ fontWeight: 900, fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>
              Radar Coach IA
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
              Lance une analyse pour recevoir des insights IA sur l'état de chacun de tes clients.
            </p>
            <button onClick={generate} disabled={generating} style={{
              padding: '14px 28px', borderRadius: 14,
              border: 'none', background: 'var(--accent)',
              color: '#fff', fontWeight: 900, fontSize: 15,
              cursor: generating ? 'not-allowed' : 'pointer',
            }}>
              {generating ? 'Analyse en cours…' : '⟳ Analyser mes clients'}
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                height: 160, background: 'var(--bg-card)', borderRadius: 16,
                border: '1px solid var(--border)', opacity: 0.5,
              }} />
            ))}
          </div>
        )}

        {/* Insights */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(insight => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onDismiss={dismiss}
                onAction={handleAction}
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && insights.length > 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
            Aucun insight pour ce filtre.
          </p>
        )}

      </div>
    </div>
  )
}
