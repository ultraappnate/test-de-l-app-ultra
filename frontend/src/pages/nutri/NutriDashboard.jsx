import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import NutriRadarWidget from '../../components/NutriRadarWidget'

const CLIENTS = [
  { id: 1, name: 'Emma Dubois',   initials: 'ED', goal: 'Perte de poids',    compliance: 87, lastLog: 'Aujourd\'hui', kcal: 1650, plan: 'Sèche −500',   alert: false, streak: 12 },
  { id: 2, name: 'Lucas Martin',  initials: 'LM', goal: 'Prise de masse',    compliance: 72, lastLog: 'Hier',          kcal: 2900, plan: 'Masse +400',   alert: false, streak: 5  },
  { id: 3, name: 'Julie Bernard', initials: 'JB', goal: 'Rééquilibrage',     compliance: 45, lastLog: 'Il y a 3j',    kcal: 0,    plan: 'Équilibre',    alert: true,  streak: 0  },
  { id: 4, name: 'Tom Laurent',   initials: 'TL', goal: 'Performance',       compliance: 91, lastLog: 'Aujourd\'hui', kcal: 3100, plan: 'Endurance',    alert: false, streak: 21 },
  { id: 5, name: 'Camille Roy',   initials: 'CR', goal: 'Végétarisme',       compliance: 60, lastLog: 'Avant-hier',   kcal: 1950, plan: 'Végé équilibré',alert: false, streak: 3  },
]

const CONSULTS = [
  { time: '09h00', name: 'Emma Dubois',   type: 'Bilan mensuel',            color: '#27ae60', dot: '#27ae60' },
  { time: '11h00', name: 'Tom Laurent',   type: 'Suivi nutrition sportive', color: '#4a90d9', dot: '#4a90d9' },
  { time: '14h30', name: 'Nouveau client',type: '1ère consultation',        color: '#e8a020', dot: '#e8a020' },
  { time: '16h00', name: 'Lucas Martin',  type: 'Ajustement macros',        color: '#a03848', dot: '#a03848' },
]

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
  const { user } = useStore()
  const navigate  = useNavigate()
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const firstName = user?.name?.split(' ')[0] || 'Coach'
  const alerts    = CLIENTS.filter(c => c.alert)
  const avgCompliance = Math.round(CLIENTS.reduce((s, c) => s + c.compliance, 0) / CLIENTS.length)
  const todayLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

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
              {alerts.length > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(232,160,32,0.2)', color: '#fbbf24', border: '1px solid rgba(232,160,32,0.3)' }}>
                  ⚠ {alerts.length} alerte{alerts.length > 1 ? 's' : ''}
                </span>
              )}
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
            { icon: '👥', label: 'Clients actifs',    value: 5,      delta: '+2 ce mois',          color: '#4a90d9',   to: '/nutri/clients'   },
            { icon: '📋', label: 'Plans actifs',       value: 8,      delta: '3 partagés',          color: '#27ae60',   to: '/nutri/plans'     },
            { icon: '🥗', label: 'Recettes',           value: 24,     delta: '6 nouvelles',         color: '#e8a020',   to: '/nutri/recipes'   },
            { icon: '📚', label: 'Ebooks',             value: 3,      delta: '47 ventes',           color: '#9b59b6',   to: '/nutri/resources' },
            { icon: '🎯', label: 'Compliance',         value: `${avgCompliance}%`, delta: '7 derniers jours', color: avgCompliance >= 75 ? '#27ae60' : '#e8a020', to: '/nutri/stats' },
            { icon: '💶', label: 'Revenus / mois',     value: '640€', delta: '↑ +18%',              color: '#27ae60',   to: '/revenue'         },
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
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${color}12`, color }}>
                  {delta}
                </span>
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
                  {CLIENTS.filter(c => c.lastLog === 'Aujourd\'hui').length} ont loggé aujourd'hui
                </p>
              </div>
              <button onClick={() => navigate('/nutri/clients')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition"
                style={{ color: '#27ae60', background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)' }}>
                Voir tous →
              </button>
            </div>

            {/* Tableau clients */}
            <div>
              {/* Header tableau */}
              <div className="grid grid-cols-12 px-5 py-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-faint)', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                <span className="col-span-4">Client</span>
                <span className="col-span-3">Plan</span>
                <span className="col-span-2 text-center">Calories</span>
                <span className="col-span-2 text-center">Dernier log</span>
                <span className="col-span-1 text-center">%</span>
              </div>
              {CLIENTS.map((c, i) => (
                <button key={c.id} onClick={() => navigate('/nutri/clients')}
                  className="w-full grid grid-cols-12 items-center px-5 py-3.5 text-left transition"
                  style={{
                    borderBottom: i < CLIENTS.length - 1 ? '1px solid var(--border)' : 'none',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {/* Avatar + nom */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                      style={{ background: c.alert ? '#e05a6b' : c.compliance >= 80 ? '#27ae60' : '#e8a020' }}>
                      {c.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                      <p className="text-[9px] truncate" style={{ color: 'var(--text-faint)' }}>{c.goal}</p>
                    </div>
                  </div>
                  {/* Plan */}
                  <div className="col-span-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      {c.plan}
                    </span>
                  </div>
                  {/* Calories */}
                  <div className="col-span-2 text-center">
                    <span className="text-xs font-bold" style={{ color: c.kcal > 0 ? 'var(--accent)' : 'var(--text-faint)' }}>
                      {c.kcal > 0 ? `${c.kcal.toLocaleString()}` : '—'}
                    </span>
                  </div>
                  {/* Dernier log */}
                  <div className="col-span-2 text-center">
                    <span className="text-[10px] font-bold"
                      style={{ color: c.lastLog === 'Aujourd\'hui' ? '#27ae60' : c.alert ? '#e05a6b' : 'var(--text-faint)' }}>
                      {c.lastLog === 'Aujourd\'hui' ? '✓ Aujourd\'hui' : c.lastLog}
                    </span>
                  </div>
                  {/* Ring compliance */}
                  <div className="col-span-1 flex justify-center">
                    <Ring pct={c.compliance} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Agenda du jour — 1 colonne */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Agenda</p>
              <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-faint)' }}>{todayLabel}</p>
            </div>
            <div className="p-4 space-y-2.5">
              {CONSULTS.map((c, i) => (
                <div key={i} className="relative flex gap-3 p-3.5 rounded-xl overflow-hidden"
                  style={{ background: 'var(--bg-base)', borderLeft: `3px solid ${c.color}` }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black" style={{ color: c.color }}>{c.time}</p>
                    <p className="text-sm font-black mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-faint)' }}>{c.type}</p>
                  </div>
                </div>
              ))}
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

          {/* Alerte clients inactifs */}
          {alerts.length > 0 && (
            <div className="col-span-1 p-5 rounded-2xl"
              style={{ background: 'rgba(224,90,107,0.06)', border: '1px solid rgba(224,90,107,0.2)' }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">⚠️</span>
                <p className="text-sm font-black" style={{ color: '#e05a6b' }}>À relancer</p>
              </div>
              {alerts.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl mb-2 last:mb-0"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background: '#e05a6b' }}>
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                    <p className="text-[9px]" style={{ color: 'var(--text-faint)' }}>Dernier log : {c.lastLog}</p>
                  </div>
                  <button className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex-shrink-0"
                    style={{ background: 'rgba(224,90,107,0.15)', color: '#e05a6b' }}>
                    Relancer
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Raccourcis */}
          <div className={`${alerts.length > 0 ? 'col-span-2' : 'col-span-3'} grid grid-cols-4 gap-3 content-start`}>
            {[
              { icon: '📋', label: 'Créer un plan',      sub: '8 plans actifs',     to: '/nutri/plans',     color: '#27ae60' },
              { icon: '🥗', label: 'Nouvelle recette',   sub: '24 recettes',        to: '/nutri/recipes',   color: '#e8a020' },
              { icon: '📚', label: 'Nouvel ebook',       sub: '3 publiés',          to: '/nutri/resources', color: '#9b59b6' },
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
