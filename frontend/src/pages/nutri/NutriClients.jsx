import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CLIENTS = [
  { id: 1, name: 'Emma Dubois',    email: 'emma@email.com',   goal: 'Perte de poids',       plan: 'Sèche -500',       compliance: 87, weight: 68, targetWeight: 60, kcalToday: 1620, lastLog: 'Aujourd\'hui', streak: 12, status: 'actif',   since: '2024-01' },
  { id: 2, name: 'Lucas Martin',   email: 'lucas@email.com',  goal: 'Prise de masse',       plan: 'Masse +400',       compliance: 72, weight: 72, targetWeight: 80, kcalToday: 2850, lastLog: 'Hier',          streak: 5,  status: 'actif',   since: '2024-02' },
  { id: 3, name: 'Julie Bernard',  email: 'julie@email.com',  goal: 'Rééquilibrage',         plan: 'Équilibre',        compliance: 45, weight: 74, targetWeight: 68, kcalToday: 0,    lastLog: 'Il y a 3j',    streak: 0,  status: 'inactif', since: '2024-01' },
  { id: 4, name: 'Tom Laurent',    email: 'tom@email.com',    goal: 'Performance sportive', plan: 'Endurance',        compliance: 91, weight: 78, targetWeight: 76, kcalToday: 3080, lastLog: 'Aujourd\'hui', streak: 21, status: 'actif',   since: '2023-12' },
  { id: 5, name: 'Camille Roy',    email: 'camille@email.com',goal: 'Végétarisme',           plan: 'Végé équilibré',   compliance: 60, weight: 62, targetWeight: 59, kcalToday: 1890, lastLog: 'Avant-hier',   streak: 3,  status: 'actif',   since: '2024-03' },
  { id: 6, name: 'Noah Petit',     email: 'noah@email.com',   goal: 'Diabète & IG bas',     plan: 'IG contrôlé',      compliance: 78, weight: 88, targetWeight: 80, kcalToday: 1750, lastLog: 'Aujourd\'hui', streak: 9,  status: 'actif',   since: '2024-02' },
]

function ComplianceBar({ pct }) {
  const color = pct >= 80 ? '#27ae60' : pct >= 50 ? '#e8a020' : '#a03848'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-black w-8 flex-shrink-0" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function NutriClients() {
  const navigate = useNavigate()
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('Tous')
  const [selected, setSelected] = useState(null)

  const filtered = CLIENTS.filter(c => {
    if (filter === 'Actifs'   && c.status !== 'actif')   return false
    if (filter === 'Inactifs' && c.status !== 'inactif') return false
    if (filter === 'Alertes'  && c.compliance >= 50)     return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const client = selected ? CLIENTS.find(c => c.id === selected) : null
  const weightProgress = client ? Math.round(Math.abs(client.weight - client.targetWeight) / Math.abs(client.weight - (client.weight + (client.targetWeight < client.weight ? -10 : 10))) * 100) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="sticky top-0 z-20 px-6 py-4" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#27ae60' }}>Nutritionniste</p>
            <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Mes Clients</h1>
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--accent)' }}>
            + Nouveau client
          </button>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher…"
            className="flex-1 px-4 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
          {['Tous','Actifs','Inactifs','Alertes'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: filter === f ? 'var(--accent)' : 'var(--bg-card)', color: filter === f ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Liste */}
        <div className="w-80 flex-shrink-0 overflow-y-auto border-r" style={{ borderColor: 'var(--border)' }}>
          {filtered.map(c => (
            <button key={c.id} onClick={() => setSelected(c.id)}
              className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition border-b"
              style={{
                background: selected === c.id ? 'var(--accent-subtle)' : 'transparent',
                borderColor: 'var(--border)',
                borderLeft: selected === c.id ? '3px solid var(--accent)' : '3px solid transparent',
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                style={{ background: c.compliance < 50 ? '#a03848' : '#27ae60' }}>
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{c.goal}</p>
                <div className="mt-1">
                  <ComplianceBar pct={c.compliance} />
                </div>
                <p className="text-[9px] mt-0.5" style={{ color: c.lastLog === 'Aujourd\'hui' ? '#27ae60' : c.compliance < 50 ? '#a03848' : 'var(--text-faint)' }}>
                  {c.lastLog === 'Aujourd\'hui' ? '✅' : c.compliance < 50 ? '⚠️' : '⏱'} {c.lastLog}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Détail client */}
        <div className="flex-1 overflow-y-auto p-6">
          {client ? (
            <div className="max-w-xl space-y-4">
              {/* En-tête client */}
              <div className="flex items-start gap-4 p-5 rounded-2xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                  style={{ background: '#27ae60' }}>
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{client.name}</h2>
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{client.email}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-lg font-bold"
                      style={{ background: 'rgba(39,174,96,0.15)', color: '#27ae60' }}>
                      {client.goal}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-lg font-bold"
                      style={{ background: 'var(--bg-base)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
                      📋 {client.plan}
                    </span>
                    {client.streak > 0 && (
                      <span className="text-xs px-2 py-1 rounded-lg font-bold"
                        style={{ background: 'rgba(232,160,32,0.15)', color: '#e8a020' }}>
                        🔥 {client.streak}j streak
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => navigate('/chat')}
                  className="px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                  💬 Message
                </button>
              </div>

              {/* Stats du jour */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Calories aujourd\'hui', value: client.kcalToday > 0 ? `${client.kcalToday} kcal` : 'Non loggé', color: client.kcalToday > 0 ? 'var(--accent)' : '#a03848' },
                  { label: 'Compliance 7j',          value: `${client.compliance}%`, color: client.compliance >= 80 ? '#27ae60' : client.compliance >= 50 ? '#e8a020' : '#a03848' },
                  { label: 'Poids actuel',            value: `${client.weight} kg`, color: 'var(--text-primary)' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-4 rounded-xl text-center"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <p className="text-lg font-black" style={{ color }}>{value}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Progression poids */}
              <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>⚖️ Progression poids</p>
                <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <span>Départ: <b style={{ color: 'var(--text-primary)' }}>{client.weight} kg</b></span>
                  <span>Objectif: <b style={{ color: '#27ae60' }}>{client.targetWeight} kg</b></span>
                  <span>Écart: <b style={{ color: 'var(--accent)' }}>{Math.abs(client.weight - client.targetWeight)} kg</b></span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: '35%', background: '#27ae60' }} />
                </div>
                <p className="text-[10px] mt-1 text-right" style={{ color: 'var(--text-faint)' }}>35% de l'objectif atteint</p>
              </div>

              {/* Compliance hebdo */}
              <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>📊 Compliance 7 derniers jours</p>
                <div className="flex gap-1.5">
                  {['L','M','M','J','V','S','D'].map((d, i) => {
                    const logged = [1,1,0,1,1,1,0][i]
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full h-8 rounded-lg flex items-center justify-center text-xs"
                          style={{ background: logged ? 'rgba(39,174,96,0.2)' : 'var(--bg-base)', color: logged ? '#27ae60' : 'var(--text-faint)' }}>
                          {logged ? '✓' : '—'}
                        </div>
                        <span className="text-[9px]" style={{ color: 'var(--text-faint)' }}>{d}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button className="py-3 rounded-xl text-sm font-bold"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                  📋 Voir le plan nutrition
                </button>
                <button className="py-3 rounded-xl text-sm font-bold"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  📝 Ajouter une note
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: 'var(--text-faint)' }}>
              <div className="text-5xl mb-4">👈</div>
              <p className="font-black" style={{ color: 'var(--text-primary)' }}>Sélectionne un client</p>
              <p className="text-sm mt-1">pour voir son suivi nutritionnel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
