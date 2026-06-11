import { useState } from 'react'
import MuscleMap from '../components/MuscleMap'
import { POPULAR_EXERCISES } from '../data/muscles'

export default function MuscleExplorer() {
  const [exercise, setExercise] = useState('Squat')
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) setExercise(search.trim())
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase',
            color: 'var(--gold)', marginBottom: 6 }}>Anatomie</p>
          <h1 style={{ fontSize: 'clamp(24px,6vw,36px)', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            Explorateur Musculaire
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, maxWidth: 520 }}>
            Visualise les muscles sollicités par chaque exercice et comprends le mouvement en animation.
          </p>
        </div>

        {/* Recherche */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un exercice (ex: développé couché)…"
            style={{ flex: 1, padding: '12px 16px', borderRadius: 14, fontSize: 14,
              background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
          <button type="submit"
            style={{ padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 800,
              background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Voir
          </button>
        </form>

        {/* Chips exercices populaires */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 20, scrollbarWidth: 'none' }}>
          {POPULAR_EXERCISES.map(ex => (
            <button key={ex.name} onClick={() => setExercise(ex.name)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                background: exercise === ex.name ? 'var(--accent)' : 'var(--bg-card)',
                color: exercise === ex.name ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${exercise === ex.name ? 'var(--accent)' : 'var(--border)'}` }}>
              <span>{ex.emoji}</span>{ex.name}
            </button>
          ))}
        </div>

        {/* Visualisation */}
        <MuscleMap exercise={exercise} />

      </div>
    </div>
  )
}
