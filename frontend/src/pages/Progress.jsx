import { useEffect, useState } from 'react'
import { useStore } from '../store'

/* ─── Sparkline ────────────────────────────────────────── */
function Sparkline({ data, color, height = 40, width = 120 }) {
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={(data.length - 1) / (data.length - 1) * width} cy={height - ((data[data.length-1] - min) / range) * (height - 4) - 2} r="3" fill={color}/>
    </svg>
  )
}

/* ─── Progress ring ────────────────────────────────────── */
function ProgressRing({ value, max, size = 100, stroke = 7, color, label, sub }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min((value / max) * circ, circ)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }}/>
        </svg>
        <div className="absolute text-center">
          <p className="font-black text-lg leading-none" style={{ color }}>{Math.round(value / max * 100)}%</p>
        </div>
      </div>
      <p className="text-xs font-black text-center" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {sub && <p className="text-[10px] text-center" style={{ color: 'var(--text-faint)' }}>{sub}</p>}
    </div>
  )
}

const WEIGHT_DATA    = [84, 83.5, 83, 82.5, 82, 81.8, 81.5, 81, 80.8, 80.5, 80.2, 80]
const BODYFAT_DATA   = [18, 17.8, 17.5, 17.2, 17, 16.8, 16.5, 16.2, 16, 15.8, 15.5, 15.2]
const MUSCLE_DATA    = [70, 70.2, 70.5, 70.8, 71, 71.3, 71.6, 72, 72.3, 72.6, 73, 73.5]

const PRS = [
  { exercise: 'Back Squat', value: '120 kg', date: 'Il y a 3j', trend: '+5kg', color: 'var(--accent)' },
  { exercise: 'Deadlift',   value: '145 kg', date: 'Hier',      trend: '+10kg',color: '#3a52a8' },
  { exercise: 'Bench Press',value: '90 kg',  date: 'Hier',      trend: '+2.5kg',color: '#e8a020' },
  { exercise: 'OHP',        value: '65 kg',  date: 'Il y a 1 sem', trend: '+2.5kg', color: '#27ae60' },
]

const WEEKS = ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S12']

export default function Progress() {
  const { user } = useStore()
  const [visible, setVisible] = useState(false)
  const [activeMetric, setActiveMetric] = useState('weight')
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  const metrics = { weight: WEIGHT_DATA, bodyfat: BODYFAT_DATA, muscle: MUSCLE_DATA }
  const metricConfig = {
    weight:  { label: 'Poids', unit: 'kg', color: 'var(--accent)', icon: '⚖️' },
    bodyfat: { label: '% Graisses', unit: '%', color: '#f87171', icon: '📉' },
    muscle:  { label: 'Masse maigre', unit: 'kg', color: '#4ade80', icon: '💪' },
  }

  const current = metrics[activeMetric]
  const cfg = metricConfig[activeMetric]
  const delta = (current[current.length - 1] - current[0]).toFixed(1)
  const isPositive = activeMetric === 'muscle' ? delta > 0 : delta < 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth:1024, margin:'0 auto' }}>

        {/* Header */}
        <div className={`mb-6 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--gold)' }}>Athlète</p>
          <h1 className="font-black" style={{ color: 'var(--text-primary)', fontSize:'clamp(22px,6vw,36px)' }}>Ma Progression</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Suivi de tes performances depuis le début</p>
        </div>

        {/* Program progress rings — empilé mobile */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:14, marginBottom:16 }} className="prog-top">
          <div className={`rounded-2xl p-5 flex flex-col items-center justify-center transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-black tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Programme actif</p>
            <ProgressRing value={7} max={12} color="var(--accent)" label="Force Absolue" sub="Semaine 7 / 12" size={90}/>
          </div>
          <div className={`rounded-2xl p-5 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', transitionDelay: '80ms' }}>
            <p className="text-[10px] font-black tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Semaines complétées</p>
            <div className="flex gap-2">
              {WEEKS.map((w, i) => (
                <div key={w} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-lg transition-all duration-300"
                    style={{ height: 32, background: i < 7 ? 'var(--accent)' : 'var(--bg-base)', border: `1px solid ${i === 6 ? 'var(--accent)' : 'var(--border)'}`, opacity: i < 7 ? 1 : 0.4 }}/>
                  <span className="text-[8px] font-bold" style={{ color: i < 7 ? 'var(--accent)' : 'var(--text-faint)' }}>{w}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Metric chart — empilé mobile */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:14, marginBottom:16 }} className="prog-chart">

          {/* Chart */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {/* Tabs */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {Object.entries(metricConfig).map(([key, mc]) => (
                <button key={key} onClick={() => setActiveMetric(key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition"
                  style={{
                    background: activeMetric === key ? mc.color : 'var(--bg-base)',
                    color: activeMetric === key ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${activeMetric === key ? mc.color : 'var(--border)'}`,
                  }}>
                  {mc.icon} {mc.label}
                </button>
              ))}
            </div>
            {/* Chart area */}
            <div className="flex items-end gap-2 mb-2" style={{ height: 140 }}>
              {current.map((v, i) => {
                const max = Math.max(...current), min = Math.min(...current)
                const pct = ((v - min) / (max - min || 1)) * 100
                const heightPct = activeMetric === 'weight' || activeMetric === 'bodyfat'
                  ? 100 - pct : pct
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full rounded-t-lg transition-all duration-700 relative cursor-default"
                      style={{ height: `${Math.max(heightPct, 8)}%`, background: cfg.color, opacity: i === current.length - 1 ? 1 : 0.45 }}>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black opacity-0 group-hover:opacity-100 transition whitespace-nowrap px-1.5 py-0.5 rounded-md"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                        {v}{cfg.unit}
                      </div>
                    </div>
                    <span className="text-[8px]" style={{ color: 'var(--text-faint)' }}>S{i+1}</span>
                  </div>
                )
              })}
            </div>
            {/* Delta */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs font-black px-2 py-1 rounded-full"
                style={{ background: isPositive ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', color: isPositive ? '#4ade80' : '#f87171' }}>
                {delta > 0 ? '+' : ''}{delta}{cfg.unit}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>depuis le début du programme</span>
            </div>
          </div>

          {/* Stats — 2 cols mobile */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }} className="prog-stats">
            {[
              { label: 'Poids actuel',   value: `${WEIGHT_DATA[WEIGHT_DATA.length-1]} kg`,  color: 'var(--accent)', icon: '⚖️' },
              { label: '% Graisses',     value: `${BODYFAT_DATA[BODYFAT_DATA.length-1]}%`,  color: '#f87171',       icon: '📉' },
              { label: 'Masse maigre',   value: `${MUSCLE_DATA[MUSCLE_DATA.length-1]} kg`,  color: '#4ade80',       icon: '💪' },
              { label: 'Streak actuel',  value: '21 jours',                                  color: '#f59e0b',       icon: '🔥' },
            ].map((s, i) => (
              <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <span className="text-xl">{s.icon}</span>
                <div>
                  <p className="text-[10px] font-black" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                  <p className="font-black text-xl" style={{ color: s.color }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRs — 2 cols mobile, 4 desktop */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>🏆 Records personnels</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)' }} className="prog-prs">
            {PRS.map((pr, i) => (
              <div key={pr.exercise} className="p-4 text-center"
                style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>{pr.exercise}</p>
                <p className="font-black text-2xl mb-1" style={{ color: pr.color }}>{pr.value}</p>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>
                  {pr.trend}
                </span>
                <p className="text-[9px] mt-1.5" style={{ color: 'var(--text-faint)' }}>{pr.date}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        @media(min-width:768px){
          .prog-top   { grid-template-columns: 1fr 3fr !important; }
          .prog-chart { grid-template-columns: 2fr 1fr !important; }
          .prog-stats { grid-template-columns: 1fr !important; }
          .prog-prs   { grid-template-columns: repeat(4,1fr) !important; }
        }
      `}</style>
    </div>
  )
}
