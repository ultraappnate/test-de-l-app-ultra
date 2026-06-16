import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Mode LOG — saisie poids/reps uniquement (pas de modif structure)
function SessionLogger({ program, onSave, onClose }) {
  const [weekIdx, setWeekIdx] = useState(0)
  const [dayIdx, setDayIdx] = useState(0)
  const [note, setNote] = useState('')
  const [logs, setLogs] = useState({}) // { 'exerciseName': [{weight, reps}] }
  const [saving, setSaving] = useState(false)

  const week = program.weeks?.[weekIdx]
  const day = week?.days?.[dayIdx]
  const exercises = day?.exercises || []

  useEffect(() => {
    if (!day) return
    const init = {}
    exercises.forEach(ex => {
      const n = parseInt(ex.sets) || 3
      init[ex.name] = Array.from({ length: n }, () => ({ weight: '', reps: ex.reps || '' }))
    })
    setLogs(init)
  }, [weekIdx, dayIdx])

  const totalSeries = Object.values(logs).flat().filter(s => s.weight || s.reps).length
  const totalVolume = Math.round(Object.values(logs).flat().reduce((s, set) => s + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0))

  const handleSave = async () => {
    setSaving(true)
    const exerciseLogs = Object.entries(logs).map(([name, sets]) => ({
      name, sets: sets.map(s => ({ weight: s.weight, reps: s.reps }))
    })).filter(e => e.sets.some(s => s.weight || s.reps))
    await onSave({ weekIdx, dayIdx, exerciseLogs, note })
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'var(--bg-base)', overflowY: 'auto' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <button onClick={onClose} className="text-sm font-bold" style={{ color: 'var(--text-faint)' }}>← Annuler</button>
        <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>Logger une séance</p>
        <button onClick={handleSave} disabled={saving || totalSeries === 0}
          className="px-4 py-2 rounded-xl text-xs font-black text-white"
          style={{ background: 'var(--accent)', opacity: saving || totalSeries === 0 ? 0.5 : 1 }}>
          {saving ? '…' : '✓ Valider'}
        </button>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: 'clamp(12px,3vw,24px)' }}>

        {/* Sélection semaine / jour */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-faint)' }}>Semaine</p>
            <select value={weekIdx} onChange={e => { setWeekIdx(+e.target.value); setDayIdx(0) }}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              {program.weeks?.map((_, i) => <option key={i} value={i}>Semaine {i + 1}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-faint)' }}>Séance</p>
            <select value={dayIdx} onChange={e => setDayIdx(+e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              {week?.days?.map((d, i) => <option key={i} value={i}>{d.label || `Jour ${i + 1}`}</option>)}
            </select>
          </div>
        </div>

        {/* Stats live */}
        {totalSeries > 0 && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-lg font-black" style={{ color: 'var(--accent)' }}>{totalSeries}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Séries</p>
            </div>
            <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-lg font-black" style={{ color: 'var(--gold)' }}>{totalVolume}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>kg volume</p>
            </div>
          </div>
        )}

        {/* Exercices */}
        {exercises.length === 0 ? (
          <div className="p-8 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--text-faint)' }}>Aucun exercice dans cette séance</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((ex, ei) => {
              const exLogs = logs[ex.name] || []
              return (
                <div key={ei} className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{ex.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                        {ex.sets} séries × {ex.reps} reps{ex.rest ? ` · repos ${ex.rest}` : ''}
                      </p>
                    </div>
                  </div>
                  {ex.notes && (
                    <p className="text-xs italic mb-3 px-3 py-1.5 rounded-lg"
                      style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>
                      💡 {ex.notes}
                    </p>
                  )}

                  {/* En-tête colonnes */}
                  <div className="flex gap-2 mb-1">
                    <span className="w-6" />
                    <span className="flex-1 text-[9px] font-black text-center uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Poids (kg)</span>
                    <span className="w-4" />
                    <span className="flex-1 text-[9px] font-black text-center uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Reps</span>
                  </div>

                  <div className="space-y-2">
                    {exLogs.map((s, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <span className="w-6 text-center text-xs font-black" style={{ color: 'var(--text-faint)' }}>{si + 1}</span>
                        <input type="number" value={s.weight} placeholder="—"
                          onChange={e => {
                            const next = [...exLogs]; next[si] = { ...s, weight: e.target.value }
                            setLogs(prev => ({ ...prev, [ex.name]: next }))
                          }}
                          className="flex-1 px-3 py-2 rounded-xl text-sm text-center font-bold outline-none"
                          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>×</span>
                        <input type="number" value={s.reps} placeholder={ex.reps || '—'}
                          onChange={e => {
                            const next = [...exLogs]; next[si] = { ...s, reps: e.target.value }
                            setLogs(prev => ({ ...prev, [ex.name]: next }))
                          }}
                          className="flex-1 px-3 py-2 rounded-xl text-sm text-center font-bold outline-none"
                          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                      </div>
                    ))}
                    {/* Ajouter série bonus */}
                    <button onClick={() => setLogs(prev => ({ ...prev, [ex.name]: [...(prev[ex.name] || []), { weight: '', reps: '' }] }))}
                      className="w-full py-1.5 rounded-xl text-[10px] font-black"
                      style={{ background: 'var(--bg-base)', border: '1px dashed var(--border)', color: 'var(--text-faint)' }}>
                      + Série bonus
                    </button>
                  </div>
                </div>
              )
            })}

            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Note de séance (ressenti, PR, fatigue…)"
              rows={2} className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />

            <button onClick={handleSave} disabled={saving || totalSeries === 0}
              className="w-full py-4 rounded-2xl font-black text-white text-base"
              style={{ background: 'var(--accent)', opacity: saving || totalSeries === 0 ? 0.5 : 1 }}>
              {saving ? 'Enregistrement…' : `🔥 Valider la séance · ${totalSeries} série${totalSeries > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClientProgramView() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { token } = useStore()
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLogger, setShowLogger] = useState(searchParams.get('session') === '1')
  const [savedToast, setSavedToast] = useState(false)

  useEffect(() => {
    fetch(`${API}/client-programs/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { setProgram(data); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  const handleLogSave = async (logData) => {
    const res = await fetch(`${API}/client-programs/${id}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(logData),
    })
    const data = await res.json()
    if (data.success) {
      setProgram(prev => ({ ...prev, sessionLogs: [...(prev.sessionLogs || []), data.log] }))
      setShowLogger(false)
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 3000)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
    </div>
  )

  if (!program || program.error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-base)' }}>
      <p className="text-5xl">😕</p>
      <p className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>Programme introuvable</p>
      <button onClick={() => navigate('/my-programs')} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm"
        style={{ background: 'var(--accent)' }}>← Retour</button>
    </div>
  )

  const sessionLogs = program.sessionLogs || []

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {showLogger && <SessionLogger program={program} onSave={handleLogSave} onClose={() => setShowLogger(false)} />}

      {savedToast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#27ae60', color: '#fff', padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 13 }}>
          🔥 Séance enregistrée !
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <button onClick={() => navigate('/my-programs')} className="text-sm font-bold" style={{ color: 'var(--text-faint)' }}>←</button>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm truncate" style={{ color: 'var(--text-primary)' }}>{program.title}</p>
          {program.goal && <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{program.goal}</p>}
        </div>
        <button onClick={() => setShowLogger(true)}
          className="px-4 py-2 rounded-xl text-xs font-black text-white flex-shrink-0"
          style={{ background: 'var(--accent)' }}>
          🏋️ Logger
        </button>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(12px,3vw,24px)' }}>

        {/* Stats */}
        <div className="flex gap-3 mb-6">
          {[
            { label: 'Semaines', value: program.weeks?.length || 0 },
            { label: 'Séances loguées', value: sessionLogs.length },
            { label: 'Dernière', value: sessionLogs.length ? new Date(sessionLogs[sessionLogs.length - 1].loggedAt).toLocaleDateString('fr', { day: 'numeric', month: 'short' }) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 p-3 rounded-xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-sm font-black" style={{ color: 'var(--accent)' }}>{value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Structure programme */}
        <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--text-faint)' }}>Structure</p>
        <div className="space-y-4 mb-8">
          {program.weeks?.map((week, wi) => (
            <div key={wi} className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-black mb-3" style={{ color: 'var(--text-secondary)' }}>Semaine {wi + 1}</p>
              <div className="space-y-2">
                {week.days?.map((day, di) => (
                  <div key={di} className="p-3 rounded-xl" style={{ background: 'var(--bg-base)' }}>
                    <p className="text-xs font-black mb-2" style={{ color: 'var(--text-primary)' }}>{day.label || `Jour ${di + 1}`}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {day.exercises?.map((ex, ei) => (
                        <span key={ei} className="text-[10px] font-bold px-2 py-1 rounded-lg"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          {ex.name} · {ex.sets}×{ex.reps}
                        </span>
                      ))}
                      {(!day.exercises || day.exercises.length === 0) && (
                        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Aucun exercice</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Historique des séances */}
        {sessionLogs.length > 0 && (
          <>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--text-faint)' }}>
              Historique ({sessionLogs.length} séance{sessionLogs.length > 1 ? 's' : ''})
            </p>
            <div className="space-y-3">
              {[...sessionLogs].reverse().map((log, i) => {
                const totalVol = Math.round((log.exerciseLogs || []).reduce((s, e) => s + (e.sets || []).reduce((ss, set) => ss + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0), 0))
                const week = program.weeks?.[log.weekIdx]
                const day = week?.days?.[log.dayIdx]
                return (
                  <div key={i} className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                          Sem. {log.weekIdx + 1} — {day?.label || `Jour ${log.dayIdx + 1}`}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                          {new Date(log.loggedAt).toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                      {totalVol > 0 && (
                        <span className="text-xs font-black px-2 py-1 rounded-lg"
                          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                          {totalVol} kg
                        </span>
                      )}
                    </div>
                    {log.note && <p className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>"{log.note}"</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(log.exerciseLogs || []).map((ex, ei) => {
                        const best = ex.sets?.reduce((m, s) => Math.max(m, parseFloat(s.weight) || 0), 0)
                        return best > 0 ? (
                          <span key={ei} className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                            style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>
                            {ex.name} {best}kg
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {sessionLogs.length === 0 && (
          <div className="py-10 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
            <p className="text-3xl mb-3">📊</p>
            <p className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Aucune séance loguée</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>Lance ta première séance pour voir ta progression.</p>
            <button onClick={() => setShowLogger(true)}
              className="px-5 py-2.5 rounded-xl font-black text-white text-sm"
              style={{ background: 'var(--accent)' }}>
              🏋️ Démarrer maintenant
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
