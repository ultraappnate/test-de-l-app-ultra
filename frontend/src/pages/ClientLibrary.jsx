import { useState, useEffect } from 'react'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

/* Bibliothèque d'exercices vue CLIENT : les exercices (et vidéos) de ses coachs, en lecture. */
export default function ClientLibrary() {
  const { token } = useStore()
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [coachFilter, setCoachFilter] = useState('Tous')
  const [playing, setPlaying] = useState(null)

  useEffect(() => {
    fetch(`${API}/exercise-library`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setExercises(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const coaches = ['Tous', ...new Set(exercises.map(e => e.ownerName).filter(Boolean))]
  const q = search.toLowerCase()
  const filtered = exercises.filter(e =>
    (coachFilter === 'Tous' || e.ownerName === coachFilter) &&
    (!q || e.name.toLowerCase().includes(q) || (e.muscles || []).join(' ').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q))
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>De tes coachs</p>
        <h1 style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: 'clamp(22px,6vw,32px)', margin: '0 0 6px' }}>Exercices</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>
          Les démonstrations vidéo de {coaches.length > 2 ? 'tes coachs' : 'ton coach'} — pour revoir la technique avant une séance.
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher un exercice…"
            style={{ flex: 1, minWidth: 200, padding: '11px 14px', borderRadius: 12, fontSize: 14,
              border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }} />
          {coaches.length > 2 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {coaches.map(c => (
                <button key={c} onClick={() => setCoachFilter(c)} style={{
                  padding: '9px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: coachFilter === c ? 'var(--accent)' : 'var(--bg-card)',
                  border: `1px solid ${coachFilter === c ? 'var(--accent)' : 'var(--border)'}`,
                  color: coachFilter === c ? '#fff' : 'var(--text-secondary)' }}>{c}</button>
              ))}
            </div>
          )}
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>}

        {!loading && exercises.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24 }}>
            <p style={{ fontSize: 40, margin: '0 0 10px' }}>🎬</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 800, margin: '0 0 6px' }}>Pas encore d'exercices</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              Rejoins un programme ou engage un coach : sa bibliothèque d'exercices apparaîtra ici.
            </p>
          </div>
        )}

        {!loading && exercises.length > 0 && filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 40 }}>Aucun résultat.</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,220px), 1fr))', gap: 12 }}>
          {filtered.map(ex => (
            <div key={ex.id} onClick={() => ex.videoId && setPlaying(ex)}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
                cursor: ex.videoId ? 'pointer' : 'default' }}>
              <div style={{ height: 124, background: 'var(--bg-hover)', position: 'relative' }}>
                {ex.videoId ? (
                  <>
                    <img src={`https://i.ytimg.com/vi/${ex.videoId}/hqdefault.jpg`} alt={ex.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(160,56,72,0.92)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, paddingLeft: 3 }}>▶</div>
                    </div>
                  </>
                ) : ex.imageUrl ? (
                  <img src={ex.imageUrl} alt={ex.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🏋️</div>
                )}
                {ex.category && ex.category !== 'À classer' && (
                  <span style={{ position: 'absolute', top: 8, right: 8, background: 'var(--accent)', color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{ex.category}</span>
                )}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{ex.name}</p>
                {(ex.muscles?.length > 0 || ex.ownerName) && (
                  <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: '4px 0 0' }}>
                    {ex.muscles?.length ? ex.muscles.join(' · ') : ex.ownerName}
                  </p>
                )}
                {ex.tips && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.4 }}>{ex.tips}</p>}
              </div>
            </div>
          ))}
        </div>

        {playing && (
          <div onClick={() => setPlaying(null)} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 860 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ color: '#fff', fontWeight: 900, fontSize: 16, margin: 0 }}>🎥 {playing.name}</p>
                <button onClick={() => setPlaying(null)} style={{ width: 34, height: 34, borderRadius: 99, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>✕</button>
              </div>
              <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 16, overflow: 'hidden', background: '#000' }}>
                <iframe src={`https://www.youtube.com/embed/${playing.videoId}?autoplay=1&rel=0&modestbranding=1`}
                  title={playing.name} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
              </div>
              {playing.tips && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>{playing.tips}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
