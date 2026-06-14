import { useEffect, useState } from 'react'
import { useStore } from '../store'

const DAYS_FR   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const EVENT_TYPES = {
  call:     { icon: '📅', color: '#3a52a8', bg: 'rgba(58,82,168,0.12)',  label: 'Appel' },
  session:  { icon: '💪', color: 'var(--accent)', bg: 'rgba(160,56,72,0.12)', label: 'Séance' },
  checkin:  { icon: '📊', color: '#27ae60', bg: 'rgba(39,174,96,0.12)', label: 'Bilan' },
  rest:     { icon: '😴', color: '#6b7280', bg: 'rgba(107,114,128,0.08)', label: 'Repos' },
  nutrition:{ icon: '🥗', color: '#e8a020', bg: 'rgba(232,160,32,0.12)', label: 'Nutrition' },
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

  const eventsForDay   = d => events.filter(e => e.day === d)
  const selectedEvents = eventsForDay(selectedDay)

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const upcoming = events
    .filter(e => e.day >= now.getDate() || month > now.getMonth())
    .sort((a, b) => a.day - b.day)
    .slice(0, 5)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'clamp(16px, 4vw, 32px)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div className={`transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'var(--gold)', marginBottom: 4 }}>
            {user?.role === 'coach' ? 'Coach' : 'Client'}
          </p>
          <h1 style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: 'clamp(22px,6vw,36px)', margin: 0 }}>
            Calendrier
          </h1>
        </div>

        {/* ── Layout : grille + panneau latéral ── */}
        <div className="cal-layout">

          {/* ── Grille ── */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 24, padding: 'clamp(14px,4vw,24px)', minWidth: 0 }}>

            {/* Navigation mois */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button onClick={prevMonth}
                style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 20, fontWeight: 700, cursor: 'pointer',
                  background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                ‹
              </button>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>
                  {MONTHS_FR[month]}
                </h2>
                <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: 0 }}>{year}</p>
              </div>
              <button onClick={nextMonth}
                style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 20, fontWeight: 700, cursor: 'pointer',
                  background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                ›
              </button>
            </div>

            {/* En-têtes jours */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
              {DAYS_FR.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 900,
                  padding: '4px 0', color: 'var(--text-faint)', letterSpacing: '0.05em' }}>{d}</div>
              ))}
            </div>

            {/* Jours */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {Array(startOffset).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const d = i + 1
                const dayEvents = eventsForDay(d)
                const isToday    = d === now.getDate() && month === now.getMonth() && year === now.getFullYear()
                const isSelected = d === selectedDay
                return (
                  <button key={d} onClick={() => setSelectedDay(d)}
                    style={{
                      position: 'relative', padding: '8px 2px 6px', minHeight: 52,
                      borderRadius: 14, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'flex-start', cursor: 'pointer',
                      border: isSelected ? '2px solid var(--accent)' : isToday ? '2px solid var(--accent)' : '2px solid transparent',
                      background: isSelected ? 'var(--accent)' : isToday ? 'var(--accent-subtle)' : 'transparent',
                      transition: 'all 0.15s',
                    }}>
                    <span style={{ fontSize: 13, fontWeight: 900, lineHeight: 1,
                      color: isSelected ? '#fff' : isToday ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {d}
                    </span>
                    {/* Event dots */}
                    {dayEvents.length > 0 && (
                      <div style={{ display: 'flex', gap: 2, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {dayEvents.slice(0, 3).map((ev, ei) => (
                          <span key={ei} style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: isSelected ? 'rgba(255,255,255,0.7)' : EVENT_TYPES[ev.type].color,
                          }} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Types d'événements — chips compact */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 18, paddingTop: 16,
              borderTop: '1px solid var(--border)' }}>
              {Object.entries(EVENT_TYPES).map(([key, t]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                  background: t.bg, border: `1px solid ${t.color}40`, color: t.color }}>
                  <span style={{ fontSize: 9 }}>{t.icon}</span>{t.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Panneau droite ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

            {/* Jour sélectionné */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 24, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{selectedDay}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {MONTHS_FR[month]} {year}
                </span>
              </div>

              {selectedEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: 28, margin: '0 0 6px' }}>🗓</p>
                  <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: 0 }}>Rien de prévu ce jour</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedEvents.map((ev, i) => {
                    const t = EVENT_TYPES[ev.type]
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 16, background: t.bg,
                        border: `1px solid ${t.color}30` }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                          background: `${t.color}20` }}>
                          {t.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)',
                            margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.title}
                          </p>
                          {ev.time && (
                            <p style={{ fontSize: 11, color: t.color, margin: 0, fontWeight: 700 }}>{ev.time}</p>
                          )}
                        </div>
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 700,
                          background: `${t.color}15`, color: t.color, flexShrink: 0 }}>
                          {t.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* À venir */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 24, padding: 20, flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--text-faint)', margin: '0 0 14px' }}>À venir</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.map((ev, i) => {
                  const t = EVENT_TYPES[ev.type]
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Date badge */}
                      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: 'var(--bg-base)', border: '1px solid var(--border)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{ev.day}</span>
                        <span style={{ fontSize: 8, color: 'var(--text-faint)', fontWeight: 700 }}>{MONTHS_FR[month].slice(0,3)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                        {ev.time && (
                          <p style={{ fontSize: 10, color: 'var(--text-faint)', margin: '2px 0 0' }}>{ev.time}</p>
                        )}
                      </div>
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{t.icon}</span>
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
          gap: 14px;
        }
        @media (min-width: 780px) {
          .cal-layout {
            grid-template-columns: minmax(0,1.6fr) minmax(0,1fr);
            gap: 20px;
          }
        }
      `}</style>
    </div>
  )
}
