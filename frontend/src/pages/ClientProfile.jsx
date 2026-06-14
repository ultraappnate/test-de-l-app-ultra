import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'

// Données mock unifiées (coach + nutri + health pro)
const ALL_CLIENTS = {
  c1: { id: 'c1', name: 'Alexandre Martin', email: 'alex@mail.com', goal: 'Prise de masse', program: 'Force Absolue', programWeek: 3, programTotal: 12, compliance: 94, streak: 14, weight: 82, targetWeight: 88, kcalToday: 2950, plan: 'Masse +400', lastLog: 'il y a 12 min', status: 'active', since: '2023-11', age: 28, sport: 'Musculation', notes: '' },
  c2: { id: 'c2', name: 'Marie Dubois',     email: 'marie@mail.com', goal: 'Sèche',          program: 'Transformation 90j', programWeek: 7, programTotal: 12, compliance: 87, streak: 21, weight: 61, targetWeight: 56, kcalToday: 1580, plan: 'Sèche -500', lastLog: 'il y a 1h', status: 'active', since: '2024-01', age: 31, sport: 'CrossFit', notes: '' },
  c3: { id: 'c3', name: 'Thomas Bernard',  email: 'thomas@mail.com', goal: 'Perte de poids', program: 'HIIT Brûle-Graisses', programWeek: 2, programTotal: 6, compliance: 72, streak: 5, weight: 94, targetWeight: 82, kcalToday: 2100, plan: 'Déficit -600', lastLog: 'il y a 3h', status: 'active', since: '2024-02', age: 44, sport: 'HIIT', notes: '' },
  c4: { id: 'c4', name: 'Lucas Petit',     email: 'lucas@mail.com', goal: 'Performance',   program: 'Powerlifting 8 sem.', programWeek: 5, programTotal: 8, compliance: 98, streak: 32, weight: 88, targetWeight: 86, kcalToday: 3200, plan: 'Endurance', lastLog: 'il y a 12 min', status: 'active', since: '2023-12', age: 26, sport: 'Powerlifting', notes: '' },
  c5: { id: 'c5', name: 'Sophie Moreau',   email: 'sophie@mail.com', goal: 'Mobilité',       program: 'Yoga Athlète', programWeek: 1, programTotal: 8, compliance: 55, streak: 3, weight: 58, targetWeight: 58, kcalToday: 0, plan: 'Équilibre', lastLog: 'il y a 2j', status: 'inactive', since: '2024-03', age: 35, sport: 'Yoga', notes: '' },
  c6: { id: 'c6', name: 'Nicolas Leroy',   email: 'nico@mail.com', goal: 'À définir',        program: '—', programWeek: 0, programTotal: 0, compliance: 0, streak: 0, weight: 77, targetWeight: 75, kcalToday: 0, plan: '—', lastLog: 'il y a 5j', status: 'new', since: '2024-04', age: 22, sport: '—', notes: '' },
  // Nutri clients
  '1': { id: '1', name: 'Emma Dubois',    email: 'emma@email.com',   goal: 'Perte de poids',       program: '—', programWeek: 0, programTotal: 0, compliance: 87, streak: 12, weight: 68, targetWeight: 60, kcalToday: 1620, plan: 'Sèche -500',     lastLog: "Aujourd'hui", status: 'active',   since: '2024-01', age: 29, sport: 'Running', notes: '' },
  '2': { id: '2', name: 'Lucas Martin',   email: 'lucas@email.com',  goal: 'Prise de masse',       program: '—', programWeek: 0, programTotal: 0, compliance: 72, streak: 5,  weight: 72, targetWeight: 80, kcalToday: 2850, plan: 'Masse +400',     lastLog: 'Hier',          status: 'active',   since: '2024-02', age: 24, sport: 'Musculation', notes: '' },
  '3': { id: '3', name: 'Julie Bernard',  email: 'julie@email.com',  goal: 'Rééquilibrage',         program: '—', programWeek: 0, programTotal: 0, compliance: 45, streak: 0,  weight: 74, targetWeight: 68, kcalToday: 0,    plan: 'Équilibre',      lastLog: 'Il y a 3j',    status: 'inactive', since: '2024-01', age: 38, sport: 'Natation', notes: '' },
  '4': { id: '4', name: 'Tom Laurent',    email: 'tom@email.com',    goal: 'Performance sportive', program: '—', programWeek: 0, programTotal: 0, compliance: 91, streak: 21, weight: 78, targetWeight: 76, kcalToday: 3080, plan: 'Endurance',      lastLog: "Aujourd'hui", status: 'active',   since: '2023-12', age: 33, sport: 'Triathlon', notes: '' },
  '5': { id: '5', name: 'Camille Roy',    email: 'camille@email.com',goal: 'Végétarisme',           program: '—', programWeek: 0, programTotal: 0, compliance: 60, streak: 3,  weight: 62, targetWeight: 59, kcalToday: 1890, plan: 'Végé équilibré', lastLog: 'Avant-hier',   status: 'active',   since: '2024-03', age: 27, sport: 'Pilates', notes: '' },
  '6': { id: '6', name: 'Noah Petit',     email: 'noah@email.com',   goal: 'Diabète & IG bas',     program: '—', programWeek: 0, programTotal: 0, compliance: 78, streak: 9,  weight: 88, targetWeight: 80, kcalToday: 1750, plan: 'IG contrôlé',    lastLog: "Aujourd'hui", status: 'active',   since: '2024-02', age: 52, sport: 'Marche', notes: '' },
}

function StatCard({ label, value, color, sub }) {
  return (
    <div className="p-4 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-xl font-black" style={{ color: color || 'var(--text-primary)' }}>{value}</p>
      <p className="text-[10px] font-bold mt-0.5 uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

function complianceColor(v) {
  if (v >= 80) return '#27ae60'
  if (v >= 50) return '#e8a020'
  return '#ef4444'
}

function statusInfo(s) {
  if (s === 'active')   return { label: 'Actif',    bg: 'rgba(39,174,96,0.12)',  color: '#27ae60' }
  if (s === 'inactive') return { label: 'Inactif',  bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' }
  return                       { label: 'Nouveau',  bg: 'rgba(232,160,32,0.12)', color: '#e8a020' }
}

export default function ClientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useStore()

  const client = ALL_CLIENTS[id]

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>Client introuvable</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'var(--accent)', color: '#fff' }}>← Retour</button>
        </div>
      </div>
    )
  }

  const badge = statusInfo(client.status)
  const cc = complianceColor(client.compliance)
  const weightDiff = Math.abs(client.weight - client.targetWeight)
  const weightPct = weightDiff === 0 ? 100 : Math.max(0, Math.round((1 - weightDiff / 15) * 100))
  const programPct = client.programTotal > 0 ? Math.round((client.programWeek / client.programTotal) * 100) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(16px,4vw,32px)' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold mb-6 group"
          style={{ color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
          <span className="group-hover:underline">Retour</span>
        </button>

        {/* Header */}
        <div className="p-5 rounded-2xl mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
              style={{ background: 'var(--accent)' }}>
              {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{client.name}</h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
              </div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-faint)' }}>{client.email}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 rounded-lg font-bold"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>🎯 {client.goal}</span>
                {client.age > 0 && (
                  <span className="text-xs px-2 py-1 rounded-lg font-bold"
                    style={{ background: 'var(--bg-base)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
                    {client.age} ans
                  </span>
                )}
                {client.sport !== '—' && (
                  <span className="text-xs px-2 py-1 rounded-lg font-bold"
                    style={{ background: 'var(--bg-base)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
                    🏃 {client.sport}
                  </span>
                )}
                {client.since && (
                  <span className="text-xs px-2 py-1 rounded-lg font-bold"
                    style={{ background: 'var(--bg-base)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
                    Depuis {client.since}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => navigate('/chat')}
              className="px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              💬 Message
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="Compliance" value={`${client.compliance}%`} color={cc} />
          <StatCard label="Streak" value={client.streak > 0 ? `🔥 ${client.streak}j` : '—'} color="#e8a020" />
          <StatCard label="Poids actuel" value={`${client.weight} kg`} sub={`→ ${client.targetWeight} kg`} />
        </div>

        {/* Progression poids */}
        <div className="p-4 rounded-2xl mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>⚖️ Progression poids</p>
          <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
            <span>Poids : <b style={{ color: 'var(--text-primary)' }}>{client.weight} kg</b></span>
            <span>Objectif : <b style={{ color: '#27ae60' }}>{client.targetWeight} kg</b></span>
            <span>Écart : <b style={{ color: 'var(--accent)' }}>{weightDiff} kg</b></span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${weightPct}%`, background: '#27ae60' }} />
          </div>
          <p className="text-[10px] mt-1 text-right" style={{ color: 'var(--text-faint)' }}>{weightPct}% de l'objectif atteint</p>
        </div>

        {/* Programme (si existe) */}
        {client.program !== '—' && (
          <div className="p-4 rounded-2xl mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>💪 Programme en cours</p>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{client.program}</p>
              {client.programTotal > 0 && (
                <p className="text-xs font-bold" style={{ color: 'var(--text-faint)' }}>Semaine {client.programWeek}/{client.programTotal}</p>
              )}
            </div>
            {client.programTotal > 0 && (
              <>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
                  <div className="h-full rounded-full" style={{ width: `${programPct}%`, background: 'var(--accent)' }} />
                </div>
                <p className="text-[10px] mt-1 text-right" style={{ color: 'var(--text-faint)' }}>{programPct}% complété</p>
              </>
            )}
          </div>
        )}

        {/* Nutrition */}
        {client.plan !== '—' && (
          <div className="p-4 rounded-2xl mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>🥗 Plan nutritionnel</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{client.plan}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  {client.kcalToday > 0 ? `${client.kcalToday} kcal aujourd'hui` : 'Non loggé aujourd\'hui'}
                </p>
              </div>
              <div className="text-2xl font-black" style={{ color: client.kcalToday > 0 ? '#27ae60' : '#ef4444' }}>
                {client.kcalToday > 0 ? '✓' : '✗'}
              </div>
            </div>
          </div>
        )}

        {/* Compliance 7 jours */}
        <div className="p-4 rounded-2xl mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>📊 Activité — 7 derniers jours</p>
          <div className="flex gap-1.5">
            {['L','M','M','J','V','S','D'].map((d, i) => {
              const logged = Math.random() > 0.35 ? 1 : 0
              const colors = logged
                ? { bg: `${cc}22`, color: cc }
                : { bg: 'var(--bg-base)', color: 'var(--text-faint)' }
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: colors.bg, color: colors.color }}>
                    {logged ? '✓' : '—'}
                  </div>
                  <span className="text-[9px] font-bold" style={{ color: 'var(--text-faint)' }}>{d}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dernière activité */}
        <div className="p-4 rounded-2xl mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>⏱ Dernière activité</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{client.lastLog}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/chat')}
            className="py-3 rounded-xl text-sm font-bold"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            💬 Envoyer un message
          </button>
          <button className="py-3 rounded-xl text-sm font-bold"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            📝 Ajouter une note
          </button>
        </div>

      </div>
    </div>
  )
}
