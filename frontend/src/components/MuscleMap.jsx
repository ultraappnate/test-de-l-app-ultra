import { useState, useEffect, useRef } from 'react'
import { MUSCLES, MUSCLE_COLORS, getMusclesForExercise } from '../data/muscles'

/* ════════════════════════════════════════════════════════════
   CORPS HUMAIN — chart anatomique stylisé (face avant / arrière)
   Chaque <path> porte un data-muscle ; la couleur est pilotée
   par la map `highlights`.
   ════════════════════════════════════════════════════════════ */

/* Régions face AVANT — [muscleId, pathData] (left + right symétriques) */
const FRONT = [
  ['neck',        'M110,80 L118,80 L116,98 L108,96 Z'],
  ['neck',        'M130,80 L122,80 L124,98 L132,96 Z'],
  ['traps',       'M88,96 C100,89 140,89 152,96 L150,106 C135,99 105,99 90,106 Z'],
  ['front_delts', 'M82,104 C69,107 63,121 66,140 C77,135 87,129 91,116 C90,110 86,106 82,104 Z'],
  ['front_delts', 'M158,104 C171,107 177,121 174,140 C163,135 153,129 149,116 C150,110 154,106 158,104 Z'],
  ['chest',       'M92,110 C101,108 116,111 118,121 L118,151 C116,161 100,165 88,157 C81,149 82,124 92,110 Z'],
  ['chest',       'M148,110 C139,108 124,111 122,121 L122,151 C124,161 140,165 152,157 C159,149 158,124 148,110 Z'],
  ['abs',         'M104,159 C112,157 128,157 136,159 L134,237 C130,249 110,249 106,237 Z'],
  ['obliques',    'M100,163 C93,177 93,211 105,233 L106,201 L103,169 Z'],
  ['obliques',    'M140,163 C147,177 147,211 135,233 L134,201 L137,169 Z'],
  ['biceps',      'M64,140 C57,159 57,187 64,207 C73,205 81,197 81,179 C81,161 76,146 70,140 Z'],
  ['biceps',      'M176,140 C183,159 183,187 176,207 C167,205 159,197 159,179 C159,161 164,146 170,140 Z'],
  ['forearms',    'M62,209 C57,229 57,257 64,279 C73,277 79,263 79,241 C79,225 72,213 66,209 Z'],
  ['forearms',    'M178,209 C183,229 183,257 176,279 C167,277 161,263 161,241 C161,225 168,213 174,209 Z'],
  ['quads',       'M98,251 C89,269 87,321 96,373 C105,377 113,373 115,361 L115,263 C111,253 104,249 98,251 Z'],
  ['quads',       'M142,251 C151,269 153,321 144,373 C135,377 127,373 125,361 L125,263 C129,253 136,249 142,251 Z'],
  ['adductors',   'M116,252 L124,252 L124,322 C122,332 118,332 116,322 Z'],
  ['calves',      'M98,379 C91,399 91,441 100,477 C109,475 113,457 113,433 L111,389 Z'],
  ['calves',      'M142,379 C149,399 149,441 140,477 C131,475 127,457 127,433 L129,389 Z'],
]

/* Régions face ARRIÈRE */
const BACK = [
  ['neck',        'M110,80 L130,80 L128,96 L112,96 Z'],
  ['traps',       'M92,94 C108,86 132,86 148,94 L140,142 C130,130 110,130 100,142 Z'],
  ['rear_delts',  'M82,104 C69,107 63,121 66,140 C77,135 87,129 91,116 C90,110 86,106 82,104 Z'],
  ['rear_delts',  'M158,104 C171,107 177,121 174,140 C163,135 153,129 149,116 C150,110 154,106 158,104 Z'],
  ['lats',        'M90,142 C82,162 84,202 105,226 L109,162 C105,150 96,144 90,142 Z'],
  ['lats',        'M150,142 C158,162 156,202 135,226 L131,162 C135,150 144,144 150,142 Z'],
  ['triceps',     'M64,140 C57,159 57,187 64,207 C73,205 81,197 81,179 C81,161 76,146 70,140 Z'],
  ['triceps',     'M176,140 C183,159 183,187 176,207 C167,205 159,197 159,179 C159,161 164,146 170,140 Z'],
  ['forearms',    'M62,209 C57,229 57,257 64,279 C73,277 79,263 79,241 C79,225 72,213 66,209 Z'],
  ['forearms',    'M178,209 C183,229 183,257 176,279 C167,277 161,263 161,241 C161,225 168,213 174,209 Z'],
  ['lower_back',  'M106,200 C112,198 128,198 134,200 L132,250 C126,258 114,258 108,250 Z'],
  ['glutes',      'M100,252 C91,254 89,280 100,294 C111,300 119,294 119,278 C119,262 110,252 100,252 Z'],
  ['glutes',      'M140,252 C149,254 151,280 140,294 C129,300 121,294 121,278 C121,262 130,252 140,252 Z'],
  ['hamstrings',  'M98,296 C91,318 91,354 100,382 C109,384 115,378 115,362 L115,302 C109,296 102,294 98,296 Z'],
  ['hamstrings',  'M142,296 C149,318 149,354 140,382 C131,384 125,378 125,362 L125,302 C131,296 138,294 142,296 Z'],
  ['calves',      'M98,385 C91,405 91,445 100,479 C109,477 113,459 113,435 L111,395 Z'],
  ['calves',      'M142,385 C149,405 149,445 140,479 C131,477 127,459 127,435 L129,395 Z'],
]

/* Silhouette de base (tête + contour) */
const HEAD = 'M120,12 C103,12 92,26 92,44 C92,64 104,78 120,78 C136,78 148,64 148,44 C148,26 137,12 120,12 Z'

function fillFor(muscleId, highlights) {
  const level = highlights[muscleId]
  if (level === 'primary')   return MUSCLE_COLORS.primary
  if (level === 'secondary') return MUSCLE_COLORS.secondary
  return MUSCLE_COLORS.idle
}

function BodyChart({ highlights, view }) {
  const regions = view === 'back' ? BACK : FRONT
  return (
    <svg viewBox="0 0 240 500" style={{ width: '100%', height: '100%', maxHeight: 460 }}>
      <defs>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Contour corps (base sombre) */}
      <path d={HEAD} fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

      {/* Muscles */}
      {regions.map(([id, d], i) => {
        const active = highlights[id] && highlights[id] !== 'idle'
        return (
          <path key={i} d={d}
            fill={fillFor(id, highlights)}
            stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.10)'}
            strokeWidth="0.8"
            filter={active ? 'url(#glow)' : undefined}
            style={{ transition: 'fill 0.4s ease' }} />
        )
      })}

      {/* Label vue */}
      <text x="120" y="496" textAnchor="middle"
        fontSize="11" fontWeight="800" letterSpacing="2"
        fill="rgba(255,255,255,0.35)">
        {view === 'back' ? 'ARRIÈRE' : 'AVANT'}
      </text>
    </svg>
  )
}

/* ════════════════════════════════════════════════════════════
   ANIMATION DU MOUVEMENT — figure paramétrique
   ════════════════════════════════════════════════════════════ */
function MovementFigure({ pattern, color = '#e23b4e' }) {
  const [phase, setPhase] = useState(0)
  const raf = useRef()
  useEffect(() => {
    let start
    const loop = (ts) => {
      if (!start) start = ts
      const t = ((ts - start) / 1400) % 1          // cycle 1.4s
      setPhase((Math.sin(t * Math.PI * 2) + 1) / 2) // 0..1 ping-pong
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [pattern])

  // Skeleton de base (face avant, viewBox 200x260)
  const cx = 100
  const sk = computeSkeleton(pattern, phase, cx)

  const Limb = ({ a, b, w = 6 }) => (
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
      stroke={color} strokeWidth={w} strokeLinecap="round" />
  )

  return (
    <svg viewBox="0 0 200 260" style={{ width: '100%', height: '100%', maxHeight: 220 }}>
      {/* sol */}
      <line x1="30" y1={sk.ground} x2="170" y2={sk.ground} stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      {/* jambes */}
      <Limb a={sk.hipL} b={sk.kneeL} /><Limb a={sk.kneeL} b={sk.ankleL} />
      <Limb a={sk.hipR} b={sk.kneeR} /><Limb a={sk.kneeR} b={sk.ankleR} />
      {/* tronc */}
      <Limb a={sk.pelvis} b={sk.neck} w={8} />
      {/* bras */}
      <Limb a={sk.shoulderL} b={sk.elbowL} /><Limb a={sk.elbowL} b={sk.handL} />
      <Limb a={sk.shoulderR} b={sk.elbowR} /><Limb a={sk.elbowR} b={sk.handR} />
      {/* épaules ligne */}
      <Limb a={sk.shoulderL} b={sk.shoulderR} w={8} />
      {/* tête */}
      <circle cx={sk.head[0]} cy={sk.head[1]} r="13" fill={color} />
      {/* articulations */}
      {[sk.kneeL, sk.kneeR, sk.elbowL, sk.elbowR, sk.hipL, sk.hipR].map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="rgba(255,255,255,0.5)" />
      ))}
    </svg>
  )
}

/* Cinématique simplifiée par pattern. phase 0=position haute, 1=position basse/contractée */
function computeSkeleton(pattern, p, cx) {
  const ground = 240
  // valeurs par défaut (debout)
  let pelvisY = 150, neckY = 95, headY = 70
  let kneeBend = 0, hipSpread = 14, armUp = 0, armForward = 0, torsoLean = 0, crunch = 0

  switch (pattern) {
    case 'squat':
    case 'lunge':
      pelvisY = 150 + 38 * p; neckY = 95 + 38 * p; headY = 70 + 38 * p
      kneeBend = 28 * p; hipSpread = 14 + 6 * p; break
    case 'hinge':
      torsoLean = 30 * p; pelvisY = 150 + 8 * p; kneeBend = 10 * p; break
    case 'overhead':
      armUp = -55 * p; break
    case 'lateral':
    case 'fly':
      armForward = 42 * p; armUp = -10 * p; break
    case 'curl':
      armUp = -38 * p; break
    case 'pushdown':
      armUp = 22 * p; break
    case 'push':
      armUp = -20 * p; armForward = 8 * p; break
    case 'pull_down':
      armUp = -50 * (1 - p); break   // bras tirent du haut vers le bas
    case 'row':
      armForward = 24 * (1 - p); break
    case 'crunch':
      crunch = 30 * p; neckY = 95 - 6 * p; break
    case 'shrug':
      neckY = 95 - 8 * p; break
    case 'leg_curl':
      kneeBend = 30 * p; break
    case 'leg_ext':
      kneeBend = 24 * (1 - p); break
    case 'calf':
      pelvisY = 150 - 12 * p; neckY = 95 - 12 * p; headY = 70 - 12 * p; break
    case 'plank':
      torsoLean = 70; pelvisY = 175; break
    default: break
  }

  const leanX = torsoLean
  const pelvis    = [cx, pelvisY]
  const neck      = [cx + leanX * 0.6, neckY - crunch]
  const head      = [cx + leanX * 0.9, headY - crunch]
  const shoulderL = [cx - 22 + leanX * 0.6, neckY + 4 - crunch]
  const shoulderR = [cx + 22 + leanX * 0.6, neckY + 4 - crunch]

  // bras : élévation (armUp négatif = vers le haut) + ouverture latérale
  const elbowL = [shoulderL[0] - 6 - armForward, shoulderL[1] + 30 + armUp]
  const elbowR = [shoulderR[0] + 6 + armForward, shoulderR[1] + 30 + armUp]
  const handL  = [elbowL[0] - 2 - armForward, elbowL[1] + 28 + armUp]
  const handR  = [elbowR[0] + 2 + armForward, elbowR[1] + 28 + armUp]

  // jambes
  const hipL = [cx - hipSpread, pelvisY]
  const hipR = [cx + hipSpread, pelvisY]
  const kneeL = [cx - hipSpread - kneeBend * 0.5, pelvisY + 45 - kneeBend]
  const kneeR = [cx + hipSpread + kneeBend * 0.5, pelvisY + 45 - kneeBend]
  const ankleL = [cx - hipSpread - 2, ground]
  const ankleR = [cx + hipSpread + 2, ground]

  return { ground, pelvis, neck, head, shoulderL, shoulderR,
    elbowL, elbowR, handL, handR, hipL, hipR, kneeL, kneeR, ankleL, ankleR }
}

/* ════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ════════════════════════════════════════════════════════════ */
export default function MuscleMap({ exercise, compact = false }) {
  const { primary, secondary, pattern, unknown } = getMusclesForExercise(exercise || '')
  const [view, setView] = useState('front')
  const [showMovement, setShowMovement] = useState(true)

  // Construit la map de surbrillance
  const highlights = {}
  primary.forEach(m => highlights[m] = 'primary')
  secondary.forEach(m => { if (!highlights[m]) highlights[m] = 'secondary' })

  // Choix auto de la vue selon les muscles dominants
  useEffect(() => {
    const allMain = [...primary, ...secondary]
    const backCount = allMain.filter(m => MUSCLES[m]?.view === 'back').length
    const frontCount = allMain.filter(m => MUSCLES[m]?.view === 'front').length
    setView(backCount > frontCount ? 'back' : 'front')
  }, [exercise])

  const primaryLabels   = primary.map(m => MUSCLES[m]?.label).filter(Boolean)
  const secondaryLabels = secondary.map(m => MUSCLES[m]?.label).filter(Boolean)

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 20, padding: compact ? 16 : 20 }}>

      {/* En-tête + toggles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'var(--text-faint)', margin: 0 }}>Muscles sollicités</p>
          <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', margin: '2px 0 0' }}>
            {exercise || 'Sélectionne un exercice'}
          </p>
        </div>
        {/* Switch front/back */}
        <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 12,
          background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
          {['front', 'back'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: '6px 12px', borderRadius: 9, fontSize: 11, fontWeight: 800,
                cursor: 'pointer', border: 'none',
                background: view === v ? 'var(--accent)' : 'transparent',
                color: view === v ? '#fff' : 'var(--text-muted)' }}>
              {v === 'front' ? 'Avant' : 'Arrière'}
            </button>
          ))}
        </div>
      </div>

      {unknown && exercise && (
        <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12,
          color: 'var(--text-secondary)' }}>
          ⓘ Muscles non répertoriés pour cet exercice — affichage générique.
        </div>
      )}

      {/* Corps + animation côte à côte */}
      <div style={{ display: 'grid',
        gridTemplateColumns: showMovement && pattern !== 'idle' ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)',
        gap: 12, alignItems: 'stretch' }} className="muscle-grid">

        {/* Corps anatomique */}
        <div style={{ background: 'var(--bg-base)', borderRadius: 16, padding: 12,
          display: 'flex', justifyContent: 'center', minHeight: 300 }}>
          <BodyChart highlights={highlights} view={view} />
        </div>

        {/* Animation du mouvement */}
        {showMovement && pattern !== 'idle' && (
          <div style={{ background: 'var(--bg-base)', borderRadius: 16, padding: 12,
            display: 'flex', flexDirection: 'column', minHeight: 300 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--text-faint)', marginBottom: 8, textAlign: 'center' }}>
              ▶ Mouvement
            </p>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MovementFigure pattern={pattern} color={MUSCLE_COLORS.primary} />
            </div>
          </div>
        )}
      </div>

      {/* Légende muscles */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {primaryLabels.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: MUSCLE_COLORS.primary, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', minWidth: 70 }}>Principaux</span>
            {primaryLabels.map(l => (
              <span key={l} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 8,
                background: 'rgba(226,59,78,0.12)', color: MUSCLE_COLORS.primary }}>{l}</span>
            ))}
          </div>
        )}
        {secondaryLabels.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: MUSCLE_COLORS.secondary, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', minWidth: 70 }}>Secondaires</span>
            {secondaryLabels.map(l => (
              <span key={l} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 8,
                background: 'rgba(245,166,35,0.12)', color: MUSCLE_COLORS.secondary }}>{l}</span>
            ))}
          </div>
        )}
      </div>

      <style>{`@media(max-width:520px){.muscle-grid{grid-template-columns:1fr !important;}}`}</style>
    </div>
  )
}
