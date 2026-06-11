import { useEffect, useState } from 'react'

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const now = new Date().getMonth()

const MONTHLY = [320,480,360,600,440,720,560,800,680,960,760,880].slice(0, now + 1)
const MONTHLY_DATA = MONTHS.slice(0, now + 1).map((m, i) => ({ label: m, value: MONTHLY[i] }))

const PROGRAMS = [
  { title: 'Force Absolue',        price: 49,  sales: 12, color: 'var(--accent)' },
  { title: 'Transformation 90j',   price: 99,  sales: 8,  color: '#3a52a8' },
  { title: 'Prise de Masse Clean', price: 89,  sales: 6,  color: '#4ade80' },
  { title: 'HIIT Brûle-Graisses',  price: 19,  sales: 18, color: '#e8a020' },
  { title: 'Nutrition HP',         price: 39,  sales: 5,  color: '#f59e0b' },
  { title: 'Athlete Elite',        price: 129, sales: 3,  color: '#a855f7' },
]

const TRANSACTIONS = [
  { name: 'Alexandre M.', program: 'Force Absolue',       amount: 49,  date: "Aujourd'hui, 09:14", status: 'paid' },
  { name: 'Marie D.',     program: 'Transformation 90j',  amount: 99,  date: "Aujourd'hui, 08:02", status: 'paid' },
  { name: 'Lucas P.',     program: 'Athlete Elite',        amount: 129, date: 'Hier, 16:45',        status: 'paid' },
  { name: 'Sophie M.',    program: 'HIIT Brûle-Graisses', amount: 19,  date: 'Hier, 11:30',        status: 'paid' },
  { name: 'Thomas B.',    program: 'Nutrition HP',         amount: 39,  date: 'Il y a 2 jours',     status: 'paid' },
  { name: 'Camille R.',   program: 'Force Absolue',        amount: 49,  date: 'Il y a 3 jours',     status: 'refunded' },
]

function RevenueBar({ data }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2" style={{ height: 140 }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="w-full rounded-t-lg transition-all duration-500 relative cursor-default"
            style={{ height: `${(d.value / max) * 100}%`, background: i === data.length - 1 ? 'var(--accent)' : 'var(--accent)', opacity: i === data.length - 1 ? 1 : 0.45, minHeight: 4 }}>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-black opacity-0 group-hover:opacity-100 transition whitespace-nowrap px-2 py-1 rounded-lg"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              {d.value}€
            </div>
          </div>
          <span className="text-[9px] font-bold" style={{ color: 'var(--text-faint)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function Revenue() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  const totalRevenue   = MONTHLY.reduce((a, b) => a + b, 0)
  const thisMonth      = MONTHLY[MONTHLY.length - 1]
  const lastMonth      = MONTHLY[MONTHLY.length - 2] || 0
  const growth         = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0
  const totalSales     = PROGRAMS.reduce((a, p) => a + p.sales, 0)
  const topProgram     = [...PROGRAMS].sort((a, b) => b.price * b.sales - a.price * a.sales)[0]
  const maxRevProg     = Math.max(...PROGRAMS.map(p => p.price * p.sales))

  const KPIs = [
    { label: 'Revenus totaux', value: `${totalRevenue.toLocaleString('fr')}€`, color: '#4ade80', icon: '💰', trend: `+${growth}% vs mois dernier` },
    { label: 'Ce mois',        value: `${thisMonth}€`,                          color: 'var(--accent)', icon: '📅', trend: growth >= 0 ? `↑ vs ${lastMonth}€` : `↓ vs ${lastMonth}€` },
    { label: 'Ventes totales', value: totalSales,                               color: '#3a52a8', icon: '🛒', trend: 'toutes périodes' },
    { label: 'Panier moyen',   value: `${Math.round(totalRevenue / totalSales)}€`, color: '#e8a020', icon: '📊', trend: 'par vente' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth:1024, margin:'0 auto' }}>

        {/* Header */}
        <div className={`mb-6 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--gold)' }}>Coach</p>
          <h1 className="font-black" style={{ color: 'var(--text-primary)', fontSize:'clamp(22px,6vw,36px)' }}>Revenus</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Suivi de tes performances financières</p>
        </div>

        {/* KPIs — 2 cols mobile, 4 desktop */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:16 }} className="rev-kpi">
          {KPIs.map((k, i) => (
            <div key={k.label}
              className={`rounded-2xl p-4 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', transitionDelay: `${i * 80}ms` }}>
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-black tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>{k.label}</p>
                <span style={{ fontSize:14 }}>{k.icon}</span>
              </div>
              <p className="font-black mb-1" style={{ color: k.color, fontSize:'clamp(18px,4vw,26px)' }}>{k.value}</p>
              <p className="text-[10px] font-bold" style={{ color: growth >= 0 ? '#4ade80' : '#f87171' }}>{k.trend}</p>
            </div>
          ))}
        </div>

        {/* Charts — 1 col mobile, 2 cols desktop */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:14, marginBottom:16 }} className="rev-charts">

          {/* Monthly revenue */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-black tracking-widest uppercase mb-5" style={{ color: 'var(--text-muted)' }}>Revenus mensuels</p>
            <RevenueBar data={MONTHLY_DATA}/>
          </div>

          {/* Top program */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-black tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Par programme</p>
            <div className="space-y-3">
              {PROGRAMS.sort((a, b) => b.price * b.sales - a.price * a.sales).map(p => {
                const rev = p.price * p.sales
                const pct = Math.round((rev / maxRevProg) * 100)
                return (
                  <div key={p.title}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="font-bold truncate max-w-[130px]" style={{ color: 'var(--text-secondary)' }}>{p.title}</span>
                      <span className="font-black" style={{ color: p.color }}>{rev}€</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: p.color }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Dernières transactions</p>
          </div>
          <div>
            {TRANSACTIONS.map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 transition"
                style={{ borderBottom: i < TRANSACTIONS.length - 1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0"
                  style={{ background: 'var(--accent)' }}>
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{t.program} · {t.date}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <p className="font-black text-sm" style={{ color: t.status === 'paid' ? '#4ade80' : '#f87171' }}>
                    {t.status === 'paid' ? '+' : '-'}{t.amount}€
                  </p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{
                      background: t.status === 'paid' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                      color:      t.status === 'paid' ? '#4ade80' : '#f87171',
                    }}>
                    {t.status === 'paid' ? 'Payé' : 'Remboursé'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        @media(min-width:768px){
          .rev-kpi    { grid-template-columns: repeat(4,1fr) !important; }
          .rev-charts { grid-template-columns: 2fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
