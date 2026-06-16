import { useState, useRef, useEffect } from 'react'
import { searchExercises } from '../data/exerciseLibrary'

export default function ExerciseSearch({ value, onChange, placeholder = 'Ex: Squat, Développé couché…' }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const [imgError, setImgError] = useState({})
  const wrapRef = useRef(null)

  useEffect(() => {
    const r = searchExercises(query)
    setResults(r)
    setOpen(r.length > 0 && query.length >= 2)
  }, [query])

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setPreview(null)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function select(ex) {
    setQuery(ex.name)
    onChange({ name: ex.name, image: ex.image, videoId: ex.videoId, muscles: ex.muscles })
    setOpen(false)
    setPreview(null)
  }

  function handleInput(e) {
    const v = e.target.value
    setQuery(v)
    onChange({ name: v, image: null, videoId: null, muscles: [] })
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => { if (results.length > 0) setOpen(true) }}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'var(--bg-hover)',
          border: '1px solid var(--border-soft)',
          borderRadius: 8,
          padding: '8px 12px',
          color: 'var(--text-primary)',
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          marginTop: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          maxHeight: 320,
          overflowY: 'auto',
        }}>
          {results.map(ex => (
            <div
              key={ex.id}
              onClick={() => select(ex)}
              onMouseEnter={() => setPreview(ex)}
              onMouseLeave={() => setPreview(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-soft)',
                transition: 'background 0.15s',
                background: preview?.id === ex.id ? 'var(--bg-hover)' : 'transparent',
              }}
            >
              {/* Miniature */}
              <div style={{
                width: 52,
                height: 36,
                borderRadius: 6,
                overflow: 'hidden',
                flexShrink: 0,
                background: 'var(--bg-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {!imgError[ex.id] ? (
                  <img
                    src={ex.image}
                    alt={ex.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setImgError(prev => ({ ...prev, [ex.id]: true }))}
                  />
                ) : (
                  <span style={{ fontSize: 18 }}>🏋️</span>
                )}
              </div>

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {ex.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                  }}>{ex.category}</span>
                  <span>{ex.muscles.slice(0, 2).join(' · ')}</span>
                </div>
              </div>

              {/* Icône vidéo si dispo */}
              {ex.videoId && (
                <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>▶</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Panneau de prévisualisation au survol */}
      {preview && open && (
        <ExercisePreviewPanel ex={preview} />
      )}
    </div>
  )
}

function ExercisePreviewPanel({ ex }) {
  const [showVideo, setShowVideo] = useState(false)
  const [imgError, setImgError] = useState(false)

  return (
    <div style={{
      position: 'fixed',
      zIndex: 10000,
      left: '50%',
      bottom: 80,
      transform: 'translateX(-50%)',
      width: 300,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
      pointerEvents: 'none',
    }}>
      {/* Photo ou Vidéo */}
      <div style={{ position: 'relative', width: '100%', height: 160, background: 'var(--bg-hover)' }}>
        {!imgError ? (
          <img
            src={ex.image}
            alt={ex.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 40 }}>🏋️</div>
        )}
        {ex.videoId && (
          <div style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: 10,
            padding: '3px 8px',
            borderRadius: 4,
            fontWeight: 600,
          }}>▶ Vidéo dispo</div>
        )}
      </div>

      {/* Détails */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{ex.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
          {ex.muscles.join(' · ')} · {ex.equipment}
        </div>
        {ex.tips && (
          <div style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            lineHeight: 1.4,
            borderLeft: '2px solid var(--accent)',
            paddingLeft: 8,
          }}>
            {ex.tips}
          </div>
        )}
      </div>
    </div>
  )
}
