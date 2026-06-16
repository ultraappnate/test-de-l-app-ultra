import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import PremiumPaywall from '../components/PremiumPaywall'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const GOALS = ['Prise de masse', 'Perte de poids', 'Force', 'Endurance', 'Mobilité', 'Autre']
const DEFAULT_EXERCISE = { name: '', sets: '3', reps: '10', rest: '60s', notes: '' }

function ExerciseRow({ ex, onChange, onDelete }) {
  return (
    <div className="p-3 rounded-xl space-y-2" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
      <div className="flex gap-2">
        <input value={ex.name} onChange={e => onChange({ ...ex, name: e.target.value })}
          placeholder="Nom de l'exercice (ex: Squat)"
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-bold"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        <button onClick={onDelete} className="w-8 h-9 rounded-lg text-xs flex items-center justify-center"
          style={{ background: 'var(--bg-card)', color: 'var(--text-faint)' }}>✕</button>
      </div>
      <div className="flex gap-2">
        {[
          { key: 'sets', placeholder: 'Séries', label: 'Séries' },
          { key: 'reps', placeholder: 'Reps', label: 'Reps' },
          { key: 'rest', placeholder: 'Repos', label: 'Repos' },
        ].map(({ key, placeholder, label }) => (
          <div key={key} className="flex-1">
            <p className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>{label}</p>
            <input value={ex[key]} onChange={e => onChange({ ...ex, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full px-2 py-1.5 rounded-lg text-xs text-center font-bold outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>
        ))}
      </div>
      <input value={ex.notes} onChange={e => onChange({ ...ex, notes: e.target.value })}
        placeholder="Note ou conseil (facultatif)"
        className="w-full px-3 py-1.5 rounded-lg text-xs outline-none italic"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} />
    </div>
  )
}

function DayEditor({ day, onChange, onDelete }) {
  const addEx = () => onChange({ ...day, exercises: [...(day.exercises || []), { ...DEFAULT_EXERCISE, id: Date.now() }] })
  const updateEx = (i, val) => { const exs = [...day.exercises]; exs[i] = val; onChange({ ...day, exercises: exs }) }
  const deleteEx = (i) => onChange({ ...day, exercises: day.exercises.filter((_, idx) => idx !== i) })

  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <input value={day.label} onChange={e => onChange({ ...day, label: e.target.value })}
          placeholder="Ex: Lundi — Push"
          className="flex-1 px-3 py-2 rounded-lg text-sm font-black outline-none"
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        <button onClick={onDelete} className="text-xs px-2 py-2 rounded-lg"
          style={{ color: 'var(--text-faint)', background: 'var(--bg-base)' }}>🗑</button>
      </div>
      <div className="space-y-2 mb-2">
        {(day.exercises || []).map((ex, i) => (
          <ExerciseRow key={ex.id || i} ex={ex} onChange={v => updateEx(i, v)} onDelete={() => deleteEx(i)} />
        ))}
      </div>
      <button onClick={addEx}
        className="w-full py-2 rounded-lg text-xs font-black"
        style={{ background: 'var(--bg-base)', border: '1px dashed var(--border)', color: 'var(--text-faint)' }}>
        + Exercice
      </button>
    </div>
  )
}

function WeekEditor({ week, weekIdx, onChange, onDelete }) {
  const addDay = () => onChange({ ...week, days: [...(week.days || []), { id: Date.now(), label: `Jour ${(week.days?.length || 0) + 1}`, exercises: [] }] })
  const updateDay = (i, val) => { const days = [...week.days]; days[i] = val; onChange({ ...week, days }) }
  const deleteDay = (i) => onChange({ ...week, days: week.days.filter((_, idx) => idx !== i) })

  return (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Semaine {weekIdx + 1}</p>
        <button onClick={onDelete} className="text-xs px-2 py-1 rounded-lg"
          style={{ color: 'var(--text-faint)', background: 'var(--bg-card)' }}>Supprimer</button>
      </div>
      <div className="space-y-3 mb-3">
        {(week.days || []).map((day, i) => (
          <DayEditor key={day.id || i} day={day} onChange={v => updateDay(i, v)} onDelete={() => deleteDay(i)} />
        ))}
      </div>
      <button onClick={addDay}
        className="w-full py-2.5 rounded-xl text-xs font-black"
        style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', color: 'var(--accent)' }}>
        + Ajouter un jour
      </button>
    </div>
  )
}

export default function ClientProgramBuilder() {
  const navigate = useNavigate()
  const { token } = useStore()
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [weeks, setWeeks] = useState([
    { id: 1, days: [{ id: Date.now(), label: 'Jour 1', exercises: [] }] }
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)

  const addWeek = () => setWeeks(prev => [...prev, { id: Date.now(), days: [] }])
  const updateWeek = (i, val) => { const w = [...weeks]; w[i] = val; setWeeks(w) }
  const deleteWeek = (i) => setWeeks(weeks.filter((_, idx) => idx !== i))

  const totalExercises = weeks.reduce((s, w) => s + w.days.reduce((s2, d) => s2 + (d.exercises?.length || 0), 0), 0)

  const handleSave = async () => {
    if (!title.trim()) { setError('Donne un nom à ton programme.'); return }
    if (weeks.length === 0) { setError('Ajoute au moins une semaine.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API}/client-programs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), goal, weeks }),
      })
      const data = await res.json()
      if (res.status === 403 && data.error === 'premium_required') {
        setShowPaywall(true)
        setSaving(false)
        return
      }
      if (!res.ok) { setError(data.error || 'Erreur'); setSaving(false); return }
      navigate(`/my-programs/${data.id}`)
    } catch {
      setError('Erreur réseau')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {showPaywall && (
        <PremiumPaywall
          onClose={() => setShowPaywall(false)}
          onSuccess={async () => { setShowPaywall(false); await handleSave() }}
        />
      )}

      {/* Header sticky */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => navigate('/my-programs')} className="text-sm font-bold" style={{ color: 'var(--text-faint)' }}>← Annuler</button>
        <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Nouveau programme</p>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 rounded-xl text-xs font-black text-white"
          style={{ background: 'var(--accent)', opacity: saving ? 0.6 : 1 }}>
          {saving ? '…' : 'Enregistrer'}
        </button>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(16px,4vw,28px)' }}>

        {/* Infos de base */}
        <div className="space-y-3 mb-6">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1.5" style={{ color: 'var(--text-faint)' }}>Nom du programme *</p>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Mon programme Force 8 semaines"
              className="w-full px-4 py-3 rounded-2xl text-sm font-bold outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1.5" style={{ color: 'var(--text-faint)' }}>Objectif</p>
            <div className="flex gap-2 flex-wrap">
              {GOALS.map(g => (
                <button key={g} onClick={() => setGoal(g === goal ? '' : g)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{
                    background: goal === g ? 'var(--accent)' : 'var(--bg-card)',
                    color: goal === g ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${goal === g ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Résumé */}
        {totalExercises > 0 && (
          <div className="flex gap-3 mb-5">
            {[
              { label: 'Semaines', value: weeks.length },
              { label: 'Séances/sem.', value: weeks[0]?.days?.length || 0 },
              { label: 'Exercices', value: totalExercises },
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 p-3 rounded-xl text-center"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-xl font-black" style={{ color: 'var(--accent)' }}>{value}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Semaines */}
        <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--text-faint)' }}>
          Structure du programme
        </p>
        <div className="space-y-4 mb-4">
          {weeks.map((week, i) => (
            <WeekEditor key={week.id || i} week={week} weekIdx={i}
              onChange={v => updateWeek(i, v)} onDelete={() => deleteWeek(i)} />
          ))}
        </div>

        <button onClick={addWeek}
          className="w-full py-3 rounded-2xl text-sm font-black mb-6"
          style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
          + Ajouter une semaine
        </button>

        {error && (
          <p className="text-xs font-bold text-center mb-4" style={{ color: '#ef4444' }}>{error}</p>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 rounded-2xl font-black text-white text-base"
          style={{ background: 'var(--accent)', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Enregistrement…' : '✓ Créer mon programme'}
        </button>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-faint)' }}>
          La structure sera figée après création. Tu pourras modifier tes poids et séries lors des séances.
        </p>
      </div>
    </div>
  )
}
