import { useState, useEffect, lazy, Suspense } from 'react'
import MuscleMap from '../components/MuscleMap'
import { POPULAR_EXERCISES, getMusclesForExercise, MUSCLES, MUSCLE_COLORS, ANATOMY, getBioObjectIds } from '../data/muscles'

const Body3D = lazy(() => import('../components/Body3D'))
const BioDigitalHuman = lazy(() => import('../components/BioDigitalHuman'))

const HAS_BIODIGITAL = !!import.meta.env.VITE_BIODIGITAL_KEY

function Spinner() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-faint)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 12 }}>Initialisation du modèle 3D…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function MuscleExplorer() {
  const [exercise, setExercise] = useState('Squat')
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [engine, setEngine] = useState(HAS_BIODIGITAL ? 'bio' : 'lite')  // 'bio' | 'lite'
  const [bioPick, setBioPick] = useState(null)  // { id, name } muscle cliqué dans BioDigital

  const { primary, secondary } = getMusclesForExercise(exercise || '')

  // Highlights pour le 3D maison
  const highlights = {}
  primary.forEach(m => highlights[m] = 'primary')
  secondary.forEach(m => { if (!highlights[m]) highlights[m] = 'secondary' })

  // Highlights pour BioDigital (objets du modèle médical)
  const bioObjectIds = getBioObjectIds(primary, secondary)

  // Quand on change d'exercice, on déselectionne le muscle
  useEffect(() => { setSelectedMuscle(null) }, [exercise])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) setExercise(search.trim())
  }

  const fiche = selectedMuscle ? ANATOMY[selectedMuscle] : null
  const ficheLabel = selectedMuscle ? MUSCLES[selectedMuscle]?.label : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase',
            color: 'var(--gold)', marginBottom: 6 }}>Anatomie · Modèle 3D interactif</p>
          <h1 style={{ fontSize: 'clamp(24px,6vw,38px)', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            Atlas Musculaire 3D
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, maxWidth: 560 }}>
            Fais pivoter le modèle à 360°, touche un muscle pour sa fiche anatomique complète,
            ou choisis un exercice pour visualiser les muscles sollicités.
          </p>
        </div>

        {/* Recherche exercice */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un exercice (ex: soulevé de terre)…"
            style={{ flex: 1, padding: '12px 16px', borderRadius: 14, fontSize: 14,
              background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
          <button type="submit"
            style={{ padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 800,
              background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Analyser
          </button>
        </form>

        {/* Chips exercices */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 18, scrollbarWidth: 'none' }}>
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

        {/* ── Layout principal : 3D + panneau ── */}
        <div className="atlas-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 16 }}>

          {/* Viewer 3D */}
          <div style={{ position: 'relative', minWidth: 0, background:
            engine === 'bio' ? '#0a0a0f' : 'radial-gradient(circle at 50% 30%, #2a1820 0%, #150d11 70%)',
            border: '1px solid var(--border)', borderRadius: 24, overflow: 'hidden',
            minHeight: 460, height: 'min(64vh, 560px)' }}>

            <Suspense fallback={<Spinner />}>
              {engine === 'bio' ? (
                <BioDigitalHuman
                  objectIds={bioObjectIds}
                  onSelect={(id, name) => setBioPick({ id, name })} />
              ) : (
                <Body3D highlights={highlights} selected={selectedMuscle}
                  onSelect={setSelectedMuscle} autoRotate={autoRotate} />
              )}
            </Suspense>

            {/* Contrôles flottants */}
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, flexWrap: 'wrap', zIndex: 5 }}>
              {/* Bascule moteur (uniquement si BioDigital dispo) */}
              {HAS_BIODIGITAL && (
                <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 12,
                  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                  {[['bio', '🫀 Médical'], ['lite', '⚡ Léger']].map(([v, label]) => (
                    <button key={v} onClick={() => setEngine(v)}
                      style={{ padding: '6px 10px', borderRadius: 9, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                        border: 'none', background: engine === v ? 'var(--accent)' : 'transparent',
                        color: engine === v ? '#fff' : 'rgba(255,255,255,0.65)' }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {engine === 'lite' && (
                <button onClick={() => setAutoRotate(a => !a)}
                  style={{ padding: '7px 12px', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.18)', color: '#fff' }}>
                  {autoRotate ? '⏸ Stop rotation' : '↻ Rotation auto'}
                </button>
              )}
            </div>

            {/* ID muscle cliqué (mode BioDigital) — aide au mapping */}
            {engine === 'bio' && bioPick && (
              <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 5, maxWidth: 200,
                padding: '8px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)', color: '#fff' }}>
                <p style={{ margin: 0, opacity: 0.6, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sélection</p>
                <p style={{ margin: '2px 0 0', fontWeight: 800 }}>{bioPick.name}</p>
              </div>
            )}

            {/* Hint */}
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 5,
              padding: '6px 14px', borderRadius: 99, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
              background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' }}>
              👆 Glisse pour tourner · pince pour zoomer · touche un muscle
            </div>
          </div>

          {/* Panneau d'info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>

            {fiche ? (
              /* ── Fiche anatomique universitaire ── */
              <div style={{ background: 'var(--bg-card)', border: `1px solid ${MUSCLE_COLORS.primary}`,
                borderRadius: 20, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: MUSCLE_COLORS.primary }} />
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: 'var(--text-faint)', margin: 0 }}>Fiche anatomique</p>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 2px' }}>{ficheLabel}</h3>
                <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--accent)', margin: '0 0 16px' }}>{fiche.latin}</p>

                {[
                  ['Région', fiche.region],
                  ['Origine', fiche.origin],
                  ['Insertion', fiche.insertion],
                  ['Fonction', fiche.function],
                  ['Innervation', fiche.innervation],
                ].map(([label, val]) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'var(--text-faint)', margin: '0 0 3px' }}>{label}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{val}</p>
                  </div>
                ))}
              </div>
            ) : (
              /* ── Muscles sollicités par l'exercice ── */
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 20, padding: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--text-faint)', margin: '0 0 4px' }}>Exercice analysé</p>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px' }}>{exercise}</h3>

                {primary.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: MUSCLE_COLORS.primary }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)' }}>Muscles principaux</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {primary.map(m => (
                        <button key={m} onClick={() => setSelectedMuscle(m)}
                          style={{ fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 9, cursor: 'pointer',
                            background: 'rgba(226,59,78,0.12)', color: MUSCLE_COLORS.primary,
                            border: '1px solid rgba(226,59,78,0.3)' }}>
                          {MUSCLES[m]?.label} →
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {secondary.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: MUSCLE_COLORS.secondary }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)' }}>Muscles secondaires</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {secondary.map(m => (
                        <button key={m} onClick={() => setSelectedMuscle(m)}
                          style={{ fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 9, cursor: 'pointer',
                            background: 'rgba(245,166,35,0.12)', color: MUSCLE_COLORS.secondary,
                            border: '1px solid rgba(245,166,35,0.3)' }}>
                          {MUSCLES[m]?.label} →
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 16, lineHeight: 1.5 }}>
                  💡 Touche un muscle (ici ou sur le modèle 3D) pour afficher sa fiche anatomique détaillée.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Vue 2D + animation du mouvement ── */}
        <div style={{ marginTop: 16 }}>
          <MuscleMap exercise={exercise} />
        </div>

      </div>

      <style>{`@media(min-width:880px){.atlas-grid{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) !important;}}`}</style>
    </div>
  )
}
