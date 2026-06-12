import { useEffect, useState } from 'react'
import { useStore } from '../store'

const DAYS_FR   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const EVENT_TYPES = {
  call:     { icon: '📅', color: '#3a52a8', bg: 'rgba(58,82,168,0.15)',  label: 'Appel' },
  session:  { icon: '💪', color: 'var(--accent)', bg: 'rgba(160,56,72,0.15)', label: 'Séance' },
  checkin:  { icon: '📊', color: '#27ae60', bg: 'rgba(39,174,96,0.15)', label: 'Bilan' },
  rest:     { icon: '😴', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Repos' },
  nutrition:{ icon: '🥗', color: '#e8a020', bg: 'rgba(232,160,32,0.15)', label: 'Nutrition' },
}

function buildEvents(year, month) {
  return [
    { day: 1,  type: 'session',   title: 'Séance Alex M.',            time: '09:00' },
    { day: 2,  type: 'call',      title: 'Appel découverte — Camille', time: '14:30' },
    { day: 3,  type: 'checkin',   title: 'Bilan semaine Marie D.',     time: '11:00' },
    { day: 5,  type: 'session',   title: 'Séance Thomas B.',           time: '08:00' },
    { day: 7,  type: 'nutrition', title: 'Suivi nutrition Lucas',      time: '10:00' },
    { day: 8,  type: 'call',      title: 'Onboarding Sophie M.',       time: '15:00' },
    { day: 10, type: 'session',   title: 'Séance groupe HIIT',         time: '07:00' },
    { day: 12, type: 'checkin',   title: 'Bilan mensuel Alex',         time: '12:00' },
    { day: 14, type: 'rest',      title: 'Jour de repos',              time: '' },
    { day: 15, type: 'call',      title: 'Présentation programme',     time: '16:00' },
    { day: 17, type: 'session',   title: 'Séance Marie D.',            time: '09:30' },
    { day: 19, type: 'nutrition', title: 'Ajustement macros — Thomas', time: '11:30' },
    { day: 21, type: 'session',   title: 'Séance Lucas P.',            time: '08:00' },
    { day: 22, type: 'call',      title: 'Appel bilan Q2',             time: '17:00' },
    { day: 24, type: 'checkin',   title: 'Contrôle poids Marie',       time: '09:00' },
    { day: 28, type: 'session',   title: 'Séance test 1RM',            time: '10:00' },
  ].filter(e => e.day <= new Date(year, month + 1, 0).getDate())
}

export default function CalendarPage() {
  const { user } = useStore()
  const now = new Date()
  const [year,        setYear]        = useState(now.getFullYear())
  const [month,       setMonth]       = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(now.getDate())
  const [visible,     setVisible]     = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  const firstDay    = new Date(year, month, 1).getDay()
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const events      = buildEvents(year, month)

  const eventsForDay    = d => events.filter(e => e.day === d)
  const selectedEvents  = eventsForDay(selectedDay)

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const upcoming = events
    .filter(e => e.day >= now.getDate() || month > now.getMonth())
    .sort((a, b) => a.day - b.day)
    .slice(0, 5)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px, 4vw, 32px)' }}>
      <div style={{ maxWidth: 1024, margin: '0 auto' }}>

        {/* Header */}
        <div className={`mb-6 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--gold)' }}>
            {user?.role === 'coach' ? 'Coach' : 'Client'}
          </p>
          <h1 className="font-black" style={{ color: 'var(--text-primary)', fontSize: 'clamp(22px, 6vw, 36px)' }}>Calendrier</h1>
        </div>

        {/* Layout: colonne sur mobile, 2 colonnes sur desktop */}
        <div className="cal-layout">

          {/* ── Grille du calendrier ── */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

            {/* Navigation mois */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition font-bold text-lg"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                ‹
              </button>
              <h2 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
                {MONTHS_FR[month]} {year}
              </h2>
              <button onClick={nextMonth}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition font-bold text-lg"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                ›
              </button>
            </div>

            {/* En-têtes jours */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
              {DAYS_FR.map(d => (
                <div key={d} className="text-center text-[10px] font-black py-1" style={{ color: 'var(--text-muted)' }}>{d}</div>
              ))}
            </div>

            {/* Jours */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {Array(startOffset).fill(null).map((_, i) => <div key={`e${i}`}/>)}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const d = i + 1
                const dayEvents = eventsForDay(d)
                const isToday    = d === now.getDate() && month === now.getMonth() && year === now.getFullYear()
                const isSelected = d === selectedDay
                return (
                  <button key={d} onClick={() => setSelectedDay(d)}
                    className="relative rounded-xl text-center transition-all duration-150 flex flex-col items-center justify-center"
                    style={{
                      padding: '6px 2px',
                      minHeight: 44,
                      background: isSelected ? 'var(--accent)' : isToday ? 'var(--accent-subtle)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--accent)' : isToday ? 'var(--accent)' : 'transparent'}`,
                    }}>
                    <span className="text-xs font-black"
                      style={{ color: isSelected ? '#fff' : isToday ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {d}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                        {dayEvents.slice(0, 2).map((ev, ei) => (
                          <span key={ei} style={{ fontSize: 8 }}>{EVENT_TYPES[ev.type].icon}</span>
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Panneau droite ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Événements du jour sélectionné */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] font-black tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
                {selectedDay} {MONTHS_FR[month]}
              </p>
              {selectedEvents.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-2xl mb-1">🗓</p>
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Rien de prévu</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((ev, i) => {
                    const t = EVENT_TYPES[ev.type]
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: t.bg, border: `1px solid ${t.color}30` }}>
                        <span className="text-base flex-shrink-0">{t.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black truncate" style={{ color: 'var(--text-primary)' }}>{ev.title}</p>
                          {ev.time && <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{ev.time}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* À venir */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', flex: 1 }}>
              <p className="text-[10px] font-black tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>À venir</p>
              <div className="space-y-2">
                {upcoming.map((ev, i) => {
                  const t = EVENT_TYPES[ev.type]
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                        style={{ background: t.bg }}>
                        {t.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{ev.title}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                          {MONTHS_FR[month].slice(0,3)} {ev.day}{ev.time ? ` · ${ev.time}` : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .cal-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .cal-layout {
            grid-template-columns: 2fr 1fr;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  )
}
