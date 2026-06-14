import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const MOCK_CLIENTS = [
  { id: 'c1', name: 'Alexandre Martin', email: 'alex@mail.com', program: 'Force Absolue', week: 3, totalWeeks: 12, lastActive: 'il y a 12 min', compliance: 94, streak: 14, weight: 82, goal: 'Prise de masse', status: 'active' },
  { id: 'c2', name: 'Marie Dubois',     email: 'marie@mail.com', program: 'Transformation 90j', week: 7, totalWeeks: 12, lastActive: 'il y a 1h', compliance: 87, streak: 21, weight: 61, goal: 'Sèche', status: 'active' },
  { id: 'c3', name: 'Thomas Bernard',  email: 'thomas@mail.com', program: 'HIIT Brûle-Graisses', week: 2, totalWeeks: 6, lastActive: 'il y a 3h', compliance: 72, streak: 5, weight: 94, goal: 'Perte de poids', status: 'active' },
  { id: 'c4', name: 'Lucas Petit',     email: 'lucas@mail.com', program: 'Powerlifting 8 sem.', week: 5, totalWeeks: 8, lastActive: 'hier', compliance: 98, streak: 32, weight: 88, goal: 'Performance', status: 'active' },
  { id: 'c5', name: 'Sophie Moreau',   email: 'sophie@mail.com', program: 'Yoga Athlète', week: 1, totalWeeks: 8, lastActive: 'il y a 2j', compliance: 55, streak: 3, weight: 58, goal: 'Mobilité', status: 'inactive' },
  { id: 'c6', name: 'Nicolas Leroy',   email: 'nico@mail.com', program: '—', week: 0, totalWeeks: 0, lastActive: 'il y a 5j', compliance: 0, streak: 0, weight: 77, goal: 'Définir', status: 'new' },
]

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

export default function Clients() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  const filters = [
    { id: 'all',      label: 'Tous' },
    { id: 'active',   label: 'Actifs' },
    { id: 'inactive', label: 'Inactifs' },
    { id: 'new',      label: 'Nouveaux' },
  ]

  const filtered = MOCK_CLIENTS.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const active = MOCK_CLIENTS.filter(c => c.status === 'active').length
  const avgCompliance = Math.round(MOCK_CLIENTS.filter(c => c.compliance > 0).reduce((s, c) => s + c.compliance, 0) / MOCK_CLIENTS.filter(c => c.compliance > 0).length)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth:1152, margin:'0 auto' }}>

        {/* Header */}
        <div className={`mb-6 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--gold)' }}>Coach</p>
          <h1 className="font-black" style={{ color: 'var(--text-primary)', fontSize:'clamp(22px,6vw,36px)' }}>Mes clients</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{MOCK_CLIENTS.length} clients · {active} actifs en ce moment</p>
        </div>

        {/* Summary stats — 2 cols mobile, 4 desktop */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 }} className="cli-stats">
          {[
            { label: 'Total clients', value: MOCK_CLIENTS.length, color: 'var(--accent)', icon: '👥' },
            { label: 'Actifs', value: active, color: '#4ade80', icon: '🟢' },
            { label: 'Compliance moy.', value: `${avgCompliance}%`, color: '#e8a020', icon: '📊' },
            { label: 'Streak record', value: `${Math.max(...MOCK_CLIENTS.map(c => c.streak))}j`, color: '#f59e0b', icon: '🔥' },
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

        {/* Search + filters — empilé mobile */}
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
      </div>

      <style>{`@media(min-width:768px){.cli-stats{grid-template-columns:repeat(4,1fr)!important;}}`}</style>
    </div>
  )
}
