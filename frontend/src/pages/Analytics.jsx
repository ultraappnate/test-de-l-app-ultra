import { useEffect, useState } from 'react'
import { useStore } from '../store'

/* ─── Bar chart ────────────────────────────────────────── */
function BarChart({ data, color = 'var(--accent)', height = 120, label }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div>
      {label && <p className="text-[10px] font-black tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>{label}</p>}
      <div className="flex items-end gap-1.5" style={{ height }}>
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
function RingStat({ value, max, label, color, size = 80 }) {
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

/* ─── Heatmap ──────────────────────────────────────────── */
function ActivityHeatmap() {
  const days = ['L','M','M','J','V','S','D']
  const weeks = 12
  const data = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => ({
      v: d === 5 || d === 6 ? Math.random() * 0.3 : Math.random()
    }))
  )
  function cellColor(v) {
    if (v < 0.15) return 'var(--bg-base)'
    if (v < 0.4)  return 'rgba(160,56,72,0.2)'
    if (v < 0.7)  return 'rgba(160,56,72,0.5)'
    return 'var(--accent)'
  }
  return (
    <div>
      <div className="flex gap-1 mb-1">
        {days.map(d => (
          <div key={d} className="flex-1 text-center text-[9px] font-bold" style={{ color: 'var(--text-faint)' }}>{d}</div>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {data.map((week, wi) => (
          <div key={wi} className="flex gap-1">
            {week.map((cell, di) => (
              <div key={di} className="flex-1 rounded-sm transition-transform duration-150 hover:scale-110"
                style={{ height: 12, background: cellColor(cell.v), cursor: 'default' }}/>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 justify-end">
        <span className="text-[9px]" style={{ color: 'var(--text-faint)' }}>Moins</span>
        {['var(--bg-base)', 'rgba(160,56,72,0.2)', 'rgba(160,56,72,0.5)', 'var(--accent)'].map((c, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: c }}/>
        ))}
        <span className="text-[9px]" style={{ color: 'var(--text-faint)' }}>Plus</span>
      </div>
    </div>
  )
}

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const now = new Date().getMonth()

export default function Analytics() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  const enrollData = MONTHS.slice(0, now + 1).map((m, i) => ({ label: m, value: [8,12,9,15,11,18,14,20,17,24,19,22][i] || 0 }))
  const revData    = MONTHS.slice(0, now + 1).map((m, i) => ({ label: m, value: [320,480,360,600,440,720,560,800,680,960,760,880][i] || 0 }))
  const sessData   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((m, i) => ({ label: m, value: [18,24,20,28,22,12,8][i] }))

  const KPIs = [
    { label: 'Nouveaux clients', value: '+8', sub: 'ce mois', color: '#4ade80',      trend: '+33%' },
    { label: 'Taux de rétention', value: '87%', sub: 'sur 3 mois', color: 'var(--accent)', trend: '+5%' },
    { label: 'Note moyenne', value: '4.8', sub: '/ 5 ⭐', color: '#f59e0b',         trend: 'stable' },
    { label: 'Programmes actifs', value: '23', sub: 'en cours', color: '#3a52a8',   trend: '+4' },
  ]

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className={`mb-8 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--gold)' }}>Coach</p>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Statistiques</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Vue d'ensemble de tes performances</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {KPIs.map((k, i) => (
            <div key={k.label}
              className={`rounded-2xl p-5 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', transitionDelay: `${i * 80}ms` }}>
              <p className="text-[10px] font-black tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>{k.label}</p>
              <p className="font-black text-3xl mb-1" style={{ color: k.color }}>{k.value}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: k.trend.startsWith('+') ? 'rgba(74,222,128,0.1)' : 'rgba(232,160,32,0.1)',
                           color:      k.trend.startsWith('+') ? '#4ade80' : '#e8a020' }}>
                  {k.trend}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{k.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <BarChart data={enrollData} color="var(--accent)" label="Inscriptions par mois" height={130}/>
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <BarChart data={revData} color="#4ade80" label="Revenus mensuels (€)" height={130}/>
          </div>
        </div>

        {/* Bottom row: sessions + rings + heatmap */}
        <div className="grid grid-cols-3 gap-5">

          {/* Sessions par jour */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <BarChart data={sessData} color="#3a52a8" label="Sessions par jour" height={110}/>
          </div>

          {/* Completion rings */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-black tracking-widest uppercase mb-5" style={{ color: 'var(--text-muted)' }}>Taux de complétion</p>
            <div className="flex justify-around">
              <RingStat value={87} max={100} label="Programmes" color="var(--accent)"/>
              <RingStat value={73} max={100} label="Nutrition" color="#27ae60"/>
              <RingStat value={94} max={100} label="Objectifs" color="#e8a020"/>
            </div>
          </div>

          {/* Heatmap */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-black tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Activité 12 semaines</p>
            <ActivityHeatmap/>
          </div>

        </div>
      </div>
    </div>
  )
}
