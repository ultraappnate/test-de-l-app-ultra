import { useEffect, useRef, useState } from 'react'

/* ════════════════════════════════════════════════════════════
   BIODIGITAL HUMAN — moteur d'anatomie 3D médical professionnel
   Pilote le modèle via la HumanAPI : surbrillance, sélection, caméra.

   Config (variables d'env Vite) :
     VITE_BIODIGITAL_KEY   = clé développeur (gratuite sur developer.biodigital.com)
     VITE_BIODIGITAL_MODEL = id du contenu (ex: "production/maleAdult/male_region_...")

   Props :
     objectIds   : { '<biodigitalObjectId>': 'primary'|'secondary' }  → muscles à surligner
     onSelect    : (objectId, objectName) => void   → clic sur un muscle
     onReady     : () => void
   ════════════════════════════════════════════════════════════ */

const API_SRC = 'https://developer.biodigital.com/builds/api/human-api-3.0.0.min.js'

// Couleurs de surbrillance (RVB 0-1 pour BioDigital)
const COLORS = {
  primary:   { r: 0.886, g: 0.231, b: 0.305 }, // rouge
  secondary: { r: 0.961, g: 0.651, b: 0.137 }, // orange
}

let apiScriptPromise = null
function loadHumanApi() {
  if (window.HumanAPI) return Promise.resolve()
  if (apiScriptPromise) return apiScriptPromise
  apiScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = API_SRC
    s.async = true
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
  return apiScriptPromise
}

export default function BioDigitalHuman({ objectIds = {}, onSelect = () => {}, onReady = () => {} }) {
  const KEY   = import.meta.env.VITE_BIODIGITAL_KEY
  const MODEL = import.meta.env.VITE_BIODIGITAL_MODEL || 'production/maleAdult/male_region_muscular_system'

  const iframeId = useRef(`biodigital-${Math.random().toString(36).slice(2, 8)}`)
  const humanRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)

  // URL du widget
  const src = `https://human.biodigital.com/widget/?be=${encodeURIComponent(MODEL)}&dk=${KEY}` +
    `&ui-anatomy-descriptions=false&ui-anatomy-pronunciations=false&ui-anatomy-labels=false` +
    `&ui-audio=false&ui-chapter-list=false&ui-fullscreen=true&ui-help=false&ui-info=false` +
    `&ui-label-list=false&ui-layers=false&ui-loader=circle&ui-media-controls=none&ui-menu=false` +
    `&ui-nav=false&ui-search=false&ui-tools=false&ui-tutorial=false&ui-undo=false&ui-whiteboard=false` +
    `&initial.none=true&disable-scroll=false&uaid=ultra`

  useEffect(() => {
    if (!KEY) return
    let human
    loadHumanApi().then(() => {
      // Attendre que l'iframe soit dans le DOM
      human = new window.HumanAPI(iframeId.current)
      humanRef.current = human
      human.on('human.ready', () => {
        setReady(true)
        onReady()
      })
      // Clic sur un objet → remonter l'id + le nom
      human.on('scene.picked', (evt) => {
        if (evt && evt.objectId) {
          human.send('scene.info', { objectId: evt.objectId }, (info) => {
            onSelect(evt.objectId, info?.name || evt.objectId)
          })
        }
      })
      human.on('scene.objectsSelected', (evt) => {
        const id = Object.keys(evt || {}).find(k => evt[k])
        if (id) onSelect(id, id)
      })
    }).catch(() => setError(true))

    return () => { humanRef.current = null }
  }, [KEY])

  // Applique la surbrillance quand objectIds change
  useEffect(() => {
    const human = humanRef.current
    if (!human || !ready) return

    // 1) Tout réinitialiser
    human.send('scene.colorObjects', { colors: [], reset: true })

    // 2) Colorer les muscles ciblés
    const colors = Object.entries(objectIds).map(([objectId, level]) => ({
      objectId,
      ambient:  COLORS[level] || COLORS.primary,
      diffuse:  COLORS[level] || COLORS.primary,
      opacity:  1,
    }))
    if (colors.length) {
      human.send('scene.colorObjects', { colors })
      // Cadrer la caméra sur le premier muscle
      human.send('camera.set', { objectId: colors[0].objectId, animate: true })
    }
  }, [objectIds, ready])

  // ── Pas de clé : message d'aide ──
  if (!KEY) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>🔑</div>
        <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Modèle 3D médical en attente de clé
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
          Ajoute ta clé développeur BioDigital (gratuite) dans <code>VITE_BIODIGITAL_KEY</code> pour
          activer l'atlas anatomique professionnel.
        </p>
        <a href="https://developer.biodigital.com/" target="_blank" rel="noreferrer"
          style={{ marginTop: 4, padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 800,
            textDecoration: 'none', background: 'var(--accent)', color: '#fff' }}>
          Obtenir ma clé gratuite →
        </a>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--text-faint)', fontSize: 13, padding: 24, textAlign: 'center' }}>
        Impossible de charger le modèle 3D BioDigital. Vérifie la clé et le modèle.
      </div>
    )
  }

  return (
    <iframe
      id={iframeId.current}
      title="Atlas anatomique 3D"
      src={src}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
      allow="autoplay; fullscreen"
      loading="lazy"
    />
  )
}
