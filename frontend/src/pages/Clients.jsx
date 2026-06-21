import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Adapte un client réel renvoyé par l'API au format attendu par les cartes.
function adaptClient(u) {
  return {
    id: u.id,
    name: u.name || u.email || 'Client',
    email: u.email || '',
    program: u.program || u.currentProgram?.title || '—',
    week: u.week ?? 0,
    totalWeeks: u.totalWeeks ?? u.currentProgram?.weeks ?? 0,
    lastActive: u.lastActive || '—',
    compliance: u.compliance ?? 0,
    streak: u.streak ?? 0,
    weight: u.weight ?? '—',
    goal: u.goal || '—',
    status: u.status || 'new',
  }
}

function complianceColor(v) {
  if (v >= 90) return '#4ade80'
  if (v >= 70) return '#e8a020'
  return '#f87171'
}

function statusBadge(s) {
  if (s === 'active')   return { label: 'Actif',     bg: 'rgba(74,222,128,0.1)',  color: '#4ade80',  border: 'rgba(74,222,128,0.25)' }
  if (s === 'inactive') return { label: 'Inactif',   bg: 'rgba(248,113,113,0.1)', color: '#f87171',  border: 'rgba(248,113,113,0.25)' }
  return                       { label: 'Nouveau',   bg: 'rgba(232,160,32,0.1)',  color: '#e8a020',  border: 'rgba(232,160,32,0.25)' }
}

function CircleProgress({ value, size = 44, stroke = 3, color }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
    </svg>
  )
}

function ClientCard({ client, onMessage, onNutrition, onProfile }) {
  const badge = statusBadge(client.status)
  const cc = complianceColor(client.compliance)
  const pct = client.totalWeeks ? Math.round((client.week / client.totalWeeks) * 100) : 0

  return (
    <div className="rounded-2xl p-5 transition-all duration-200 group"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
            style={{ background: 'var(--accent)' }}>
            {client.name.split(' ').map(n => n[0]).join('').slice(0,2)}
          </div>
          <div>
            <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{client.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{client.email}</p>
          </div>
        </div>
        <span className="text-[10px] font-black px-2 py-1 rounded-full"
          style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
          {badge.label}
        </span>
      </div>

      {/* Program progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold truncate max-w-[160px]" style={{ color: 'var(--text-secondary)' }}>{client.program}</p>
          {client.totalWeeks > 0 && (
            <p className="text-[10px] font-bold" style={{ color: 'var(--text-faint)' }}>S{client.week}/{client.totalWeeks}</p>
          )}
        </div>
        {client.totalWeeks > 0 && (
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'var(--accent)' }}/>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center py-2 rounded-xl" style={{ background: 'var(--bg-base)' }}>
          <div className="relative flex items-center justify-center mb-0.5">
            <CircleProgress value={client.compliance} color={cc}/>
            <span className="absolute text-[10px] font-black" style={{ color: cc }}>{client.compliance}%</span>
          </div>
          <p className="text-[9px] font-bold" style={{ color: 'var(--text-faint)' }}>Compliance</p>
        </div>
        <div className="text-center py-2 rounded-xl" style={{ background: 'var(--bg-base)' }}>
          <p className="font-black text-lg" style={{ color: '#e8a020' }}>{client.streak}</p>
          <p className="text-[9px] font-bold" style={{ color: 'var(--text-faint)' }}>Jours 🔥</p>
        </div>
        <div className="text-center py-2 rounded-xl" style={{ background: 'var(--bg-base)' }}>
          <p className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>{client.weight}<span className="text-xs font-bold" style={{ color: 'var(--text-faint)' }}>kg</span></p>
          <p className="text-[9px] font-bold" style={{ color: 'var(--text-faint)' }}>Poids</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>⏱ {client.lastActive}</p>
        <div className="flex gap-2">
          <button onClick={() => onProfile(client)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition"
            style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            👤 Profil
          </button>
          <button onClick={() => onNutrition(client)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition"
            style={{ background: 'rgba(39,174,96,0.1)', color: '#4ade80', border: '1px solid rgba(39,174,96,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(39,174,96,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(39,174,96,0.1)'}>
            🥗 Nutrition
          </button>
          <button onClick={() => onMessage(client)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)' || (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-subtle)'; e.currentTarget.style.color = 'var(--accent)' }}>
            💬 Message
          </button>
        </div>
      </div>
    </div>
  )
}

const COACH_LIMIT_FREE = 3

export default function Clients() {
  const navigate = useNavigate()
  const { user, token } = useStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [visible, setVisible] = useState(false)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  useEffect(() => {
    let cancelled = false
    if (!token) { setLoading(false); return }
    axios.get(`${API}/coach/clients`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!cancelled) setClients(Array.isArray(res.data) ? res.data.map(adaptClient) : []) })
      .catch(() => { if (!cancelled) setClients([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token])

  const isFreePlan = !user?.coachPlan || user?.coachPlan === 'free'
  const atLimit = isFreePlan && clients.length >= COACH_LIMIT_FREE

  const filters = [
    { id: 'all',      label: 'Tous' },
    { id: 'active',   label: 'Actifs' },
    { id: 'inactive', label: 'Inactifs' },
    { id: 'new',      label: 'Nouveaux' },
  ]

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const active = clients.filter(c => c.status === 'active').length
  const compliant = clients.filter(c => c.compliance > 0)
  const avgCompliance = compliant.length ? Math.round(compliant.reduce((s, c) => s + c.compliance, 0) / compliant.length) : 0
  const bestStreak = clients.length ? Math.max(...clients.map(c => c.streak || 0)) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth:1152, margin:'0 auto' }}>

        {/* Header */}
        <div className={`mb-6 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--gold)' }}>Coach</p>
          <h1 className="font-black" style={{ color: 'var(--text-primary)', fontSize:'clamp(22px,6vw,36px)' }}>Mes clients</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{clients.length} client{clients.length > 1 ? 's' : ''} · {active} actif{active > 1 ? 's' : ''} en ce moment</p>
        </div>

        {/* Bannière limite plan gratuit */}
        {isFreePlan && clients.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl flex items-center justify-between gap-3"
            style={{ background: atLimit ? 'rgba(160,56,72,0.12)' : 'var(--bg-card)', border: `1px solid ${atLimit ? 'var(--accent)' : 'var(--border)'}` }}>
            <div>
              <p className="text-sm font-black" style={{ color: atLimit ? 'var(--accent)' : 'var(--text-primary)' }}>
                {atLimit ? '⚠️ Limite atteinte — plan Gratuit' : `Plan Gratuit · ${clients.length}/${COACH_LIMIT_FREE} clients`}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                {atLimit ? 'Passe au Pro pour accueillir jusqu\'à 50 clients.' : `Il te reste ${Math.max(0, COACH_LIMIT_FREE - clients.length)} place(s).`}
              </p>
            </div>
            <button onClick={() => navigate('/coach/upgrade')}
              className="px-4 py-2 rounded-xl text-xs font-black text-white flex-shrink-0"
              style={{ background: 'var(--accent)' }}>
              Passer Pro
            </button>
          </div>
        )}

        {/* Summary stats — 2 cols mobile, 4 desktop */}
        {clients.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 }} className="cli-stats">
          {[
            { label: 'Total clients', value: clients.length, color: 'var(--accent)', icon: '👥' },
            { label: 'Actifs', value: active, color: '#4ade80', icon: '🟢' },
            { label: 'Compliance moy.', value: `${avgCompliance}%`, color: '#e8a020', icon: '📊' },
            { label: 'Streak record', value: `${bestStreak}j`, color: '#f59e0b', icon: '🔥' },
          ].map((s, i) => (
            <div key={s.label} className={`rounded-2xl p-4 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', transitionDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                <span style={{ fontSize:14 }}>{s.icon}</span>
              </div>
              <p className="font-black" style={{ color: s.color, fontSize:'clamp(20px,5vw,28px)' }}>{s.value}</p>
            </div>
          ))}
        </div>
        )}

        {/* État vide — coach sans clients */}
        {!loading && clients.length === 0 && (
          <div className="rounded-2xl text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 'clamp(32px,8vw,64px) 24px' }}>
            <p className="text-5xl mb-4">👥</p>
            <h2 className="font-black mb-2" style={{ color: 'var(--text-primary)', fontSize: 'clamp(18px,4vw,24px)' }}>Aucun client pour l'instant</h2>
            <p className="text-sm mb-6 mx-auto" style={{ color: 'var(--text-secondary)', maxWidth: 380 }}>
              Partage ton profil sur la Marketplace pour être contacté par des sportifs.
            </p>
            <button onClick={() => navigate('/marketplace')}
              className="px-6 py-3 rounded-xl text-sm font-black text-white"
              style={{ background: 'var(--accent)' }}>
              Aller sur la Marketplace
            </button>
          </div>
        )}

        {/* Search + filters — empilé mobile */}
        {clients.length > 0 && (
        <>
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1" style={{ minWidth:180 }}>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-faint)' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un client..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}/>
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {filters.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className="px-4 py-2 rounded-lg text-xs font-bold transition"
                style={{ background: filter === f.id ? 'var(--accent)' : 'transparent', color: filter === f.id ? '#fff' : 'var(--text-muted)' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid — 1 col mobile, 2 tablette, 3 desktop */}
        <div style={{ display:'grid', gap:14,
          gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
          {filtered.map((c, i) => (
            <div key={c.id} className={`transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${200 + i * 60}ms` }}>
              <ClientCard client={c}
                onProfile={cl => navigate(`/client/${cl.id}`)}
                onMessage={cl => navigate(`/chat/${cl.id}`)}
                onNutrition={cl => navigate('/coach/nutrition')}/>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>Aucun client trouvé</p>
          </div>
        )}
        </>
        )}
      </div>

      <style>{`@media(min-width:768px){.cli-stats{grid-template-columns:repeat(4,1fr)!important;}}`}</style>
    </div>
  )
}
