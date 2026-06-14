import { useEffect, useState } from 'react'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

export default function StreakWidget({ compact = false }) {
  const { token } = useStore()
  const [streak, setStreak] = useState(null)
  const [logging, setLogging] = useState(false)
  const [justLogged, setJustLogged] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`${API}/streak`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStreak).catch(() => {})
  }, [token])

  const logToday = async () => {
    if (logging || justLogged) return
    setLogging(true)
    try {
      const res = await fetch(`${API}/streak/log`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setStreak(data)
      if (!data.alreadyLogged) setJustLogged(true)
    } catch {}
    setLogging(false)
  }

  if (!streak) return null

  // Grille 7 derniers jours
  const today = new Date()
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  const history = streak.history || []

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <span style={{ fontSize: 18 }}>{streak.current >= 7 ? '🔥' : streak.current >= 3 ? '⚡' : '💫'}</span>
        <div>
          <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
            {streak.current} jour{streak.current !== 1 ? 's' : ''}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Streak</p>
        </div>
      </div>
    )
  }

  const alreadyLoggedToday = streak.lastDate === today.toISOString().slice(0, 10)

  return (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 24 }}>{streak.current >= 7 ? '🔥' : streak.current >= 3 ? '⚡' : '💫'}</span>
          <div>
            <p className="text-2xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
              {streak.current} <span className="text-base font-bold" style={{ color: 'var(--text-faint)' }}>jour{streak.current !== 1 ? 's' : ''}</span>
            </p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--text-faint)' }}>
              Record : {streak.longest} jour{streak.longest !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {!alreadyLoggedToday && !justLogged ? (
          <button onClick={logToday} disabled={logging}
            className="px-3 py-2 rounded-xl text-xs font-black text-white"
            style={{ background: 'var(--accent)', opacity: logging ? 0.6 : 1 }}>
            {logging ? '…' : '✓ Séance faite'}
          </button>
        ) : (
          <span className="text-xs font-black px-3 py-2 rounded-xl"
            style={{ background: 'rgba(39,174,96,0.15)', color: '#27ae60' }}>
            ✓ Aujourd'hui
          </span>
        )}
      </div>

      {/* Grille 7 jours */}
      <div className="flex gap-1.5 justify-between">
        {last7.map(date => {
          const done = history.includes(date)
          const isToday = date === today.toISOString().slice(0, 10)
          const label = new Date(date).toLocaleDateString('fr', { weekday: 'short' }).slice(0, 1).toUpperCase()
          return (
            <div key={date} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-full aspect-square rounded-lg flex items-center justify-center"
                style={{
                  background: done
                    ? streak.current >= 7 ? 'linear-gradient(135deg, #ff6b35, var(--accent))' : 'var(--accent)'
                    : 'var(--bg-base)',
                  border: isToday ? '2px solid var(--accent)' : '1px solid var(--border)',
                  maxWidth: 36,
                }}>
                {done && <span style={{ fontSize: 14 }}>✓</span>}
              </div>
              <p className="text-[9px] font-bold" style={{ color: isToday ? 'var(--accent)' : 'var(--text-faint)' }}>
                {label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
