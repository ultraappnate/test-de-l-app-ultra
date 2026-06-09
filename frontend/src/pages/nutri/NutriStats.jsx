import { useState } from 'react'

const WEEKLY_DATA = [
  { week: 'S-6', newClients: 0, revenue: 480, compliance: 72, consultations: 8 },
  { week: 'S-5', newClients: 1, revenue: 540, compliance: 68, consultations: 9 },
  { week: 'S-4', newClients: 0, revenue: 510, compliance: 75, consultations: 9 },
  { week: 'S-3', newClients: 2, revenue: 640, compliance: 80, consultations: 11 },
  { week: 'S-2', newClients: 1, revenue: 590, compliance: 77, consultations: 10 },
  { week: 'S-1', newClients: 0, revenue: 610, compliance: 82, consultations: 10 },
  { week: 'Cette sem.', newClients: 1, revenue: 320, compliance: 79, consultations: 5 },
]

function BarChart({ data, color, max, label }) {
  const maxVal = Math.max(...data.map(d => d.value), max || 1)
  return (
    <div>
      <p className="text-xs font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <div className="flex items-end gap-1.5 h-24">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-md transition-all duration-700"
              style={{ height: `${Math.max(4, (d.value / maxVal) * 80)}px`, background: i === data.length - 1 ? color : `${color}66` }} />
            <span className="text-[8px]" style={{ color: 'var(--text-faint)' }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NutriStats() {
  const [period, setPeriod] = useState('7j')

  const totalRevenue    = WEEKLY_DATA.reduce((s,d) => s + d.revenue, 0)
  const avgCompliance   = Math.round(WEEKLY_DATA.reduce((s,d) => s + d.compliance, 0) / WEEKLY_DATA.length)
  const totalConsults   = WEEKLY_DATA.reduce((s,d) => s + d.consultations, 0)
  const newClientsTotal = WEEKLY_DATA.reduce((s,d) => s + d.newClients, 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between"
        style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#27ae60' }}>Nutritionniste</p>
          <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Statistiques</h1>
        </div>
        <div className="flex gap-1.5">
          {['7j', '30j', '3m'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: period === p ? 'var(--accent)' : 'var(--bg-card)', color: period === p ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: '💶', label: 'Revenus (7 sem.)',     value: `${totalRevenue}€`,  color: '#27ae60', delta: '+18%' },
            { icon: '📊', label: 'Compliance moy.',      value: `${avgCompliance}%`, color: 'var(--accent)', delta: '+5%' },
            { icon: '📅', label: 'Consultations',         value: totalConsults,       color: '#4a90d9', delta: 'stable' },
            { icon: '👥', label: 'Nouveaux clients',      value: newClientsTotal,     color: '#e8a020', delta: '+2' },
          ].map(({ icon, label, value, color, delta }) => (
            <div key={label} className="p-4 rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <span className="text-xl">{icon}</span>
              <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{label}</p>
              <p className="text-[10px] font-bold mt-1" style={{ color: delta.startsWith('+') ? '#27ae60' : 'var(--text-faint)' }}>{delta}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <BarChart
              label="💶 Revenus par semaine (€)"
              data={WEEKLY_DATA.map(d => ({ label: d.week.replace('Cet','★'), value: d.revenue }))}
              color="#27ae60" />
          </div>
          <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <BarChart
              label="📊 Compliance clients (%)"
              data={WEEKLY_DATA.map(d => ({ label: d.week.replace('Cet','★'), value: d.compliance }))}
              color="var(--accent)" max={100} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <BarChart
              label="📅 Consultations par semaine"
              data={WEEKLY_DATA.map(d => ({ label: d.week.replace('Cet','★'), value: d.consultations }))}
              color="#4a90d9" />
          </div>
          <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <BarChart
              label="👥 Nouveaux clients"
              data={WEEKLY_DATA.map(d => ({ label: d.week.replace('Cet','★'), value: d.newClients }))}
              color="#e8a020" />
          </div>
        </div>

        {/* Top objectifs clients */}
        <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>🎯 Répartition des objectifs clients</p>
          <div className="space-y-2.5">
            {[
              { label: 'Perte de poids',       count: 2, pct: 33, color: '#e8a020' },
              { label: 'Performance sportive', count: 1, pct: 17, color: '#4a90d9' },
              { label: 'Prise de masse',       count: 1, pct: 17, color: '#a03848' },
              { label: 'Diabète & IG bas',     count: 1, pct: 17, color: '#27ae60' },
              { label: 'Rééquilibrage',        count: 1, pct: 17, color: '#6b7280' },
            ].map(({ label, count, pct, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs w-40 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="text-xs font-black w-6 flex-shrink-0 text-right" style={{ color }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sources de revenus */}
        <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>💶 Sources de revenus</p>
          <div className="space-y-3">
            {[
              { label: 'Consultations',   amount: 1980, pct: 55, icon: '📅', color: '#4a90d9' },
              { label: 'Suivis mensuels', amount: 900,  pct: 25, icon: '📋', color: '#27ae60' },
              { label: 'Ebooks vendus',   amount: 437,  pct: 12, icon: '📚', color: '#e8a020' },
              { label: 'Plans PDF',       amount: 283,  pct: 8,  icon: '📄', color: '#a03848' },
            ].map(({ label, amount, pct, icon, color }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--bg-base)' }}>
                <span className="text-lg w-8 flex-shrink-0">{icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span className="font-black" style={{ color }}>{amount}€</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
