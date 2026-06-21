import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import NutriRadarWidget from '../../components/NutriRadarWidget'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

function initialsOf(name = '') {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??'
}

function Ring({ pct, size = 44, stroke = 4 }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const fill = circ * (Math.min(pct, 100) / 100)
  const color = pct >= 80 ? '#27ae60' : pct >= 55 ? '#e8a020' : '#e05a6b'
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .6s ease' }}/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-black" style={{ fontSize: 10, color }}>{pct}%</span>
      </div>
    </div>
  )
}

export default function NutriDashboard() {
  const { user, token } = useStore()
  const navigate  = useNavigate()
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const firstName = user?.name?.split(' ')[0] || 'Coach'
  const todayLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const [clients, setClients] = useState([])

  useEffect(() => {
    if (!token) return
    fetch(`${API}/coach/clients`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => (r.ok ? r.json() : []))
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]))
  }, [token])

  const clientCount = clients.length

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ minHeight: 200 }}>
        {/* Fond dégradé végétal */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #071a0a 0%, #0e3318 45%, #1a5c2e 100%)' }}/>
        {/* Grille géométrique subtile */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px' }}/>
        {/* Cercles décoratifs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #27ae60 0%, transparent 70%)' }}/>
        <div className="absolute bottom-0 left-0 right-0 h-20"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-base))' }}/>

        <div className="relative z-10 px-8 pt-8 pb-14 flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                style={{ background: 'rgba(39,174,96,0.2)', color: '#4ade80', border: '1px solid rgba(39,174,96,0.3)' }}>
                Espace Nutritionniste
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight"
              style={{ color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-sm mt-1.5 capitalize" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {todayLabel}
            </p>
          </div>
          <button onClick={() => navigate('/nutri/plans')}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all"
            style={{ background: '#27ae60', color: '#fff', boxShadow: '0 4px 20px rgba(39,174,96,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <span className="text-base leading-none">+</span> Nouveau plan
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* ── Radar Nutrition IA ─────────────────────────── */}
        <NutriRadarWidget />

        {/* ── KPIs ───────────────────────────────────────── */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { icon: '👥', label: 'Clients',            value: clientCount, delta: null,          color: '#4a90d9',   to: '/nutri/clients'   },
            { icon: '📋', label: 'Plans actifs',       value: 0,           delta: null,          color: '#27ae60',   to: '/nutri/plans'     },
            { icon: '🥗', label: 'Recettes',           value: 0,           delta: null,          color: '#e8a020',   to: '/nutri/recipes'   },
            { icon: '📚', label: 'Ebooks',             value: 0,           delta: null,          color: '#9b59b6',   to: '/nutri/resources' },
            { icon: '🎯', label: 'Compliance',         value: '—',         delta: null,          color: '#e8a020',   to: '/nutri/stats' },
            { icon: '💶', label: 'Revenus / mois',     value: '0€',        delta: null,          color: '#27ae60',   to: '/revenue'         },
          ].map(({ icon, label, value, delta, color, to }) => (
            <button key={label} onClick={() => navigate(to)}
              className="p-4 rounded-2xl text-left group transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                  style={{ background: `${color}15` }}>
                  {icon}
                </div>
                {delta && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${color}12`, color }}>
                    {delta}
                  </span>
                )}
              </div>
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-[10px] mt-0.5 font-medium" style={{ color: 'var(--text-faint)' }}>{label}</p>
            </button>
          ))}
        </div>

        {/* ── Grille principale ─────────────────────────── */}
        <div className="grid grid-cols-3 gap-5">

          {/* Suivi clients — 2 colonnes */}
          <div className="col-span-2 rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Suivi clients</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  {clientCount > 0 ? `${clientCount} client${clientCount > 1 ? 's' : ''}` : 'Aucun client pour l\'instant'}
                </p>
              </div>
              {clientCount > 0 && (
                <button onClick={() => navigate('/nutri/clients')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition"
                  style={{ color: '#27ae60', background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)' }}>
                  Voir tous →
                </button>
              )}
            </div>

            {/* Tableau clients */}
            {clientCount === 0 ? (
              <div className="flex flex-col items-center justify-center text-center px-6 py-16">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: 'rgba(39,174,96,0.1)' }}>👥</div>
                <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Aucun client pour l'instant</p>
                <p className="text-xs mt-1.5 max-w-xs" style={{ color: 'var(--text-faint)' }}>
                  Vos clients apparaîtront ici dès qu'ils rejoindront votre suivi.
                </p>
                <button onClick={() => navigate('/nutri/clients')}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold transition"
                  style={{ background: '#27ae60', color: '#fff' }}>
                  Gérer mes clients
                </button>
              </div>
            ) : (
              <div>
                {/* Header tableau */}
                <div className="grid grid-cols-12 px-5 py-2 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-faint)', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                  <span className="col-span-7">Client</span>
                  <span className="col-span-5">Objectif</span>
                </div>
                {clients.map((c, i) => (
                  <button key={c.id || i} onClick={() => navigate('/nutri/clients')}
                    className="w-full grid grid-cols-12 items-center px-5 py-3.5 text-left transition"
                    style={{
                      borderBottom: i < clients.length - 1 ? '1px solid var(--border)' : 'none',
                      background: 'transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {/* Avatar + nom */}
                    <div className="col-span-7 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                        style={{ background: '#27ae60' }}>
                        {initialsOf(c.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black truncate" style={{ color: 'var(--text-primary)' }}>{c.name || 'Client'}</p>
                        {c.email && <p className="text-[9px] truncate" style={{ color: 'var(--text-faint)' }}>{c.email}</p>}
                      </div>
                    </div>
                    {/* Objectif */}
                    <div className="col-span-5">
                      <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {c.goal || '—'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Agenda du jour — 1 colonne */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Agenda</p>
              <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-faint)' }}>{todayLabel}</p>
            </div>
            <div className="p-4 space-y-2.5">
              <div className="flex flex-col items-center justify-center text-center px-4 py-8">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-3"
                  style={{ background: 'rgba(39,174,96,0.1)' }}>📅</div>
                <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>Aucun rendez-vous</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
                  Aucune consultation planifiée aujourd'hui.
                </p>
              </div>
              <button onClick={() => navigate('/calendar')}
                className="w-full py-2.5 rounded-xl text-xs font-bold mt-1 transition"
                style={{ background: 'transparent', color: 'var(--text-faint)', border: '1px dashed var(--border)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#27ae60'; e.currentTarget.style.color = '#27ae60' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-faint)' }}>
                + Ajouter un RDV
              </button>
            </div>
          </div>
        </div>

        {/* ── Alertes + Raccourcis ──────────────────────── */}
        <div className="grid grid-cols-3 gap-5">

          {/* Raccourcis */}
          <div className="col-span-3 grid grid-cols-4 gap-3 content-start">
            {[
              { icon: '📋', label: 'Créer un plan',      sub: 'Nouveau plan',       to: '/nutri/plans',     color: '#27ae60' },
              { icon: '🥗', label: 'Nouvelle recette',   sub: 'Ajouter',            to: '/nutri/recipes',   color: '#e8a020' },
              { icon: '📚', label: 'Nouvel ebook',       sub: 'Publier',            to: '/nutri/resources', color: '#9b59b6' },
              { icon: '◈',  label: 'Mon profil public',  sub: 'Modifier',           to: '/nutri/profile',   color: '#4a90d9' },
            ].map(({ icon, label, sub, to, color }) => (
              <button key={to} onClick={() => navigate(to)}
                className="p-5 rounded-2xl text-left transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                  style={{ background: `${color}15` }}>
                  {icon}
                </div>
                <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{sub}</p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
