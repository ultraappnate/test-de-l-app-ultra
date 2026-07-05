import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

function Timer({ running }) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!running) return
    const i = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(i)
  }, [running])
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return <span>{m}:{s}</span>
}

function SetRow({ set, index, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 text-center text-xs font-black" style={{ color: 'var(--text-faint)' }}>{index + 1}</span>
      <input
        type="number" placeholder="kg" value={set.weight}
        onChange={e => onChange({ ...set, weight: e.target.value })}
        className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm text-center font-bold outline-none"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>×</span>
      <input
        type="number" placeholder="reps" value={set.reps}
        onChange={e => onChange({ ...set, reps: e.target.value })}
        className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm text-center font-bold outline-none"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
      <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
        style={{ background: 'var(--bg-hover)', color: 'var(--text-faint)' }}>✕</button>
    </div>
  )
}

function ExerciseCard({ exercise, logs, onChange }) {
  const addSet = () => onChange([...logs, { weight: '', reps: '', done: false }])
  const updateSet = (i, val) => { const n = [...logs]; n[i] = val; onChange(n) }
  const deleteSet = (i) => onChange(logs.filter((_, idx) => idx !== i))

  const bestWeight = logs.reduce((m, s) => Math.max(m, parseFloat(s.weight) || 0), 0)

  return (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{exercise.title}</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
            {exercise.sets} × {exercise.reps}
            {exercise.rest && ` · repos ${exercise.rest}`}
          </p>
        </div>
        {bestWeight > 0 && (
          <span className="text-xs font-black px-2 py-1 rounded-lg"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            🏆 {bestWeight} kg
          </span>
        )}
      </div>

      {exercise.notes && (
        <p className="text-xs mb-3 px-3 py-2 rounded-xl italic"
          style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>
          💡 {exercise.notes}
        </p>
      )}

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-6" />
          <span className="flex-1 text-[10px] font-black text-center uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Poids (kg)</span>
          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}> </span>
          <span className="flex-1 text-[10px] font-black text-center uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Reps</span>
          <span className="w-7" />
        </div>
        {logs.map((s, i) => (
          <SetRow key={i} set={s} index={i} onChange={v => updateSet(i, v)} onDelete={() => deleteSet(i)} />
        ))}
      </div>

      <button onClick={addSet}
        className="w-full py-2 rounded-xl text-xs font-black"
        style={{ background: 'var(--bg-base)', border: '1px dashed var(--border)', color: 'var(--text-faint)' }}>
        + Ajouter une série
      </button>
    </div>
  )
}

export default function WorkoutSession() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { token } = useStore()
  const programId = params.get('program')
  const dayLabel = params.get('day') || 'Séance libre'

  const [exercises, setExercises] = useState([])
  const [logs, setLogs] = useState({}) // { exerciseTitle: [sets] }
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [note, setNote] = useState('')
  const startTime = useRef(Date.now())

  // Exercises passés via sessionStorage par ProgramDetail
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('workout_exercises')
      if (stored) {
        const exs = JSON.parse(stored)
        setExercises(exs)
        const initial = {}
        exs.forEach(e => {
          const n = parseInt(e.sets) || 3
          initial[e.title] = Array.from({ length: n }, () => ({ weight: '', reps: e.reps || '', done: false }))
        })
        setLogs(initial)
      }
    } catch {}
  }, [])

  const totalSets = Object.values(logs).flat().filter(s => s.weight || s.reps).length
  const totalVolume = Object.values(logs).flat().reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0)

  const handleSave = async () => {
    setSaving(true)
    const exerciseLogs = Object.entries(logs).map(([name, sets]) => ({
      name,
      sets: sets.map(s => ({ weight: s.weight, reps: s.reps })),
    })).filter(e => e.sets.some(s => s.weight || s.reps))

    try {
      await fetch(`${API}/workout/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ programId, exerciseLogs, note, dayLabel, duration: Math.round((Date.now() - startTime.current) / 60000) }),
      })
      sessionStorage.removeItem('workout_exercises')
      setSaved(true)
      setTimeout(() => navigate('/progress'), 1800)
    } catch {}
    setSaving(false)
  }

  if (saved) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: 'var(--bg-base)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{ background: 'rgba(39,174,96,0.15)', border: '2px solid #27ae60' }}>🔥</div>
        <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Séance enregistrée !</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{totalSets} séries · {Math.round(totalVolume)} kg de volume total</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header fixe */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => navigate(-1)} className="text-sm font-bold" style={{ color: 'var(--text-faint)' }}>← Quitter</button>
        <div className="text-center">
          <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{dayLabel}</p>
          <p className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>
            ⏱ <Timer running={true} />
          </p>
        </div>
        <button onClick={handleSave} disabled={saving || totalSets === 0}
          className="px-4 py-2 rounded-xl text-xs font-black text-white"
          style={{ background: 'var(--accent)', opacity: saving || totalSets === 0 ? 0.5 : 1 }}>
          {saving ? '…' : 'Terminer'}
        </button>
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px)', maxWidth: 640, margin: '0 auto' }}>
        {/* Stats live */}
        {totalSets > 0 && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-lg font-black" style={{ color: 'var(--accent)' }}>{totalSets}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Séries</p>
            </div>
            <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-lg font-black" style={{ color: 'var(--gold)' }}>{Math.round(totalVolume)}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>kg volume</p>
            </div>
          </div>
        )}

        {exercises.length === 0 ? (
          <div className="p-8 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
            <p className="text-3xl mb-3">🏋️</p>
            <p className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Aucun exercice chargé</p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Lance une séance depuis un programme</p>
            <button onClick={() => navigate('/programs')}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-black text-white"
              style={{ background: 'var(--accent)' }}>
              Voir les programmes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map(ex => (
              <ExerciseCard
                key={ex.title}
                exercise={ex}
                logs={logs[ex.title] || []}
                onChange={sets => setLogs(prev => ({ ...prev, [ex.title]: sets }))}
              />
            ))}

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note de séance (facultatif)…"
              rows={2}
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />

            <button onClick={handleSave} disabled={saving || totalSets === 0}
              className="w-full py-4 rounded-2xl font-black text-white text-base"
              style={{ background: 'var(--accent)', opacity: saving || totalSets === 0 ? 0.5 : 1 }}>
              {saving ? 'Enregistrement…' : `🔥 Terminer la séance · ${totalSets} série${totalSets > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
