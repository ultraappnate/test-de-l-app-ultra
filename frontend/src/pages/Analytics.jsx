import { useEffect, useState } from 'react'
import { useStore } from '../store'

/* ─── Bar chart ────────────────────────────────────────── */
function BarChart({ data, color = 'var(--accent)', height = 120, label }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div>
      {label && <p className="text-[10px] font-black tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>{label}</p>}
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full rounded-t-lg transition-all duration-500 relative"
              style={{ height: `${(d.value / max) * 100}%`, background: color, opacity: 0.85, minHeight: 4 }}>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black opacity-0 group-hover:opacity-100 transition whitespace-nowrap px-1.5 py-0.5 rounded-md"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                {d.value}
              </div>
            </div>
            <span className="text-[9px] font-bold" style={{ color: 'var(--text-faint)' }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Ring stat ────────────────────────────────────────── */
function RingStat({ value, max, label, color, size = 72 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (value / max) * circ
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={5}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
        </svg>
        <span className="absolute font-black text-sm" style={{ color }}>{value}%</span>
      </div>
      <p className="text-[10px] font-bold text-center" style={{ color: 'var(--text-faint)' }}>{label}</p>
    </div>
  )
}

/* ─── Heatmap (état vide — grille neutre, aucune donnée inventée) ─── */
function ActivityHeatmap() {
  const days = ['L','M','M','J','V','S','D']
  const weeks = 12
  return (
    <div>
      <div className="flex gap-1 mb-1">
        {days.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] font-bold" style={{ color: 'var(--text-faint)' }}>{d}</div>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {Array.from({ length: weeks }, (_, wi) => (
          <div key={wi} className="flex gap-1">
            {Array.from({ length: 7 }, (_, di) => (
              <div key={di} className="flex-1 rounded-sm"
                style={{ height: 11, background: 'var(--bg-base)', border: '1px solid var(--border-soft)' }}/>
            ))}
          </div>
        ))}
      </div>
      <p className="text-[9px] text-center mt-2" style={{ color: 'var(--text-faint)' }}>
        Ton activité apparaîtra ici au fil de tes sessions
      </p>
    </div>
  )
}

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const now = new Date().getMonth()

export default function Analytics() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  const enrollData = MONTHS.slice(0, now + 1).map((m) => ({ label: m, value: 0 }))
  const revData    = MONTHS.slice(0, now + 1).map((m) => ({ label: m, value: 0 }))
  const sessData   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((m) => ({ label: m, value: 0 }))

  const KPIs = [
    { label: 'Nouveaux clients', value: '—', sub: 'ce mois',    color: 'var(--text-secondary)', trend: '' },
    { label: 'Rétention',        value: '—', sub: 'sur 3 mois', color: 'var(--text-secondary)', trend: '' },
    { label: 'Note moyenne',     value: '—', sub: '/ 5',        color: 'var(--text-secondary)', trend: '' },
    { label: 'Programmes actifs',value: '—', sub: 'en cours',   color: 'var(--text-secondary)', trend: '' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px, 4vw, 32px)' }}>
      <div style={{ maxWidth: 1024, margin: '0 auto' }}>

        {/* Header */}
        <div className={`mb-6 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--gold)' }}>Coach</p>
          <h1 className="font-black" style={{ color: 'var(--text-primary)', fontSize: 'clamp(22px, 6vw, 36px)' }}>Statistiques</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Vue d'ensemble de tes performances</p>
        </div>

        {/* KPI cards — 2 colonnes sur mobile, 4 sur desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}
          className="md-grid-4">
          {KPIs.map((k, i) => (
            <div key={k.label}
              className={`rounded-2xl p-4 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', transitionDelay: `${i * 80}ms` }}>
              <p className="text-[9px] font-black tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>{k.label}</p>
              <p className="font-black mb-1" style={{ color: k.color, fontSize: 'clamp(20px, 5vw, 30px)' }}>{k.value}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {k.trend && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: k.trend.startsWith('+') ? 'rgba(74,222,128,0.1)' : 'rgba(232,160,32,0.1)',
                             color:      k.trend.startsWith('+') ? '#4ade80' : '#e8a020' }}>
                    {k.trend}
                  </span>
                )}
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{k.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row — 1 colonne sur mobile, 2 sur desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 12, marginBottom: 12 }}
          className="charts-row">
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <BarChart data={enrollData} color="var(--accent)" label="Inscriptions par mois" height={110}/>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <BarChart data={revData} color="#4ade80" label="Revenus mensuels (€)" height={110}/>
          </div>
        </div>

        {/* Bottom row — 1 colonne sur mobile, 3 sur desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 12 }}
          className="bottom-row">

          {/* Sessions par jour */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <BarChart data={sessData} color="#3a52a8" label="Sessions par jour" height={100}/>
          </div>

          {/* Completion rings */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-black tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Taux de complétion</p>
            <div className="flex justify-around items-center">
              <RingStat value={0} max={100} label="Programmes" color="var(--accent)" size={72}/>
              <RingStat value={0} max={100} label="Nutrition"  color="#27ae60"       size={72}/>
              <RingStat value={0} max={100} label="Objectifs"  color="#e8a020"       size={72}/>
            </div>
          </div>

          {/* Heatmap */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-black tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Activité 12 semaines</p>
            <ActivityHeatmap/>
          </div>

        </div>
      </div>

      {/* Responsive styles inline — desktop overrides */}
      <style>{`
        @media (min-width: 768px) {
          .md-grid-4  { grid-template-columns: repeat(4, 1fr) !important; }
          .charts-row { grid-template-columns: repeat(2, 1fr) !important; }
          .bottom-row { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
