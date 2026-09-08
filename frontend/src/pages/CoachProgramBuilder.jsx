import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { searchExercises, setLibraryExercises, getLibraryExercises } from '../data/exerciseCatalog'
import { v4 as uuidv4 } from 'uuid'

/* ── Constantes ─────────────────────────────────────────── */
const CATEGORIES = ['Force', 'Cardio', 'Mobilité', 'Nutrition', 'Combiné']
const LEVELS     = ['Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux']
const CAT_ICONS  = { Force: '🏋️', Nutrition: '🥗', Combiné: '⚡', Cardio: '🏃', Mobilité: '🧘' }
const DAYS_FR    = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const GRADIENTS  = [
  'linear-gradient(135deg,#1a0a0d 0%,#7d2d38 60%,#a03848 100%)',
  'linear-gradient(135deg,#0d1f0f 0%,#1e6b2e 60%,#27ae60 100%)',
  'linear-gradient(135deg,#0a0d1f 0%,#2d3e7d 60%,#3a52a8 100%)',
  'linear-gradient(135deg,#1f0a0a 0%,#8b0000 40%,#a03848 70%,#d4af37 100%)',
  'linear-gradient(135deg,#001a1a 0%,#006b6b 60%,#00a8a8 100%)',
  'linear-gradient(135deg,#100a1f 0%,#5a2d82 60%,#7b3fa8 100%)',
  'linear-gradient(135deg,#1a0f00 0%,#8b4a00 60%,#c96a00 100%)',
  'linear-gradient(135deg,#05051f 0%,#1e1e8b 50%,#2e2ec9 100%)',
]

function fileToBase64(file) {
  return new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file) })
}

// Extrait l'ID YouTube (pour la miniature)
function ytId(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.searchParams.get('v')) return u.searchParams.get('v')
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    if (u.pathname.includes('/shorts/')) return u.pathname.split('/shorts/')[1].split(/[/?]/)[0]
    if (u.pathname.includes('/embed/')) return u.pathname.split('/embed/')[1].split(/[/?]/)[0]
  } catch {}
  return null
}
function vimeoId(url) {
  if (!url) return null
  const m = String(url).match(/vimeo\.com\/(\d+)/)
  return m ? m[1] : null
}

// Regroupe les blocs consécutifs partageant le même `group` en segments
function segmentBlocks(blocks) {
  const segs = []
  for (const b of blocks) {
    const last = segs[segs.length - 1]
    if (b.group && last && last.group === b.group) last.items.push(b)
    else segs.push({ group: b.group || null, items: [b] })
  }
  return segs
}

/* ── Estimation de la séance (durée + kcal) ─────────────── */
// "90s" → 90 · "2min" → 120 · "1,5 min" → 90
function parseSecs(v, dflt = 0) {
  if (!v) return dflt
  const s = String(v).toLowerCase().replace(',', '.')
  const m = s.match(/(\d+(?:\.\d+)?)\s*(min|mn)/)
  if (m) return Math.round(parseFloat(m[1]) * 60)
  const n = s.match(/(\d+(?:\.\d+)?)/)
  return n ? Math.round(parseFloat(n[1])) : dflt
}
// "10-12" → 11 · "10" → 10
function avgNum(v, dflt) {
  const nums = String(v || '').match(/\d+(?:\.\d+)?/g)
  if (!nums || !nums.length) return dflt
  return nums.map(Number).reduce((a, b) => a + b, 0) / nums.length
}
// Temps de travail d'une série (secondes) : temps affiché, ou ~4s par rep
function setWorkSecs(b) {
  if (b.unit === 'time') return parseSecs(b.reps, 40)
  return Math.max(20, Math.round(avgNum(b.reps, 10) * 4))
}
function estimateSession(blocks) {
  const parts = []
  let total = 0
  segmentBlocks(blocks).forEach(seg => {
    const rounds = Math.max(1, ...seg.items.map(b => Math.round(avgNum(b.sets, 3))))
    const work = seg.items.reduce((s, b) => s + setWorkSecs(b), 0)
    const rest = parseSecs(seg.items[0]?.rest, 60)
    const secs = rounds * work + Math.max(0, rounds - 1) * rest + 45 // +45s installation/transition
    parts.push({ label: seg.items.map(b => b.title || 'Exercice').join(' + '), secs, group: !!seg.group, count: seg.items.length })
    total += secs
  })
  return { totalSecs: total, parts }
}
// kcal ≈ MET × 75 kg × heures (Force ~5, Combiné ~6.5, Cardio ~8)
function estimateKcal(totalSecs, category) {
  const MET = category === 'Cardio' ? 8 : category === 'Combiné' ? 6.5 : 5
  return Math.round((MET * 75 * (totalSecs / 3600)) / 10) * 10
}

/* ── Carte exercice (fresque) ───────────────────────────── */
function ExoCard({ block, onChange, onRemove, onMove, onLink, linkable, inGroup, dropHandlers, handleProps, dragging, dropTarget }) {
  const set = (k, v) => onChange({ ...block, [k]: v })
  const [showVid, setShowVid] = useState(!!block.url)
  const [playing, setPlaying] = useState(false) // lecteur vidéo plein écran
  const [unitMenu, setUnitMenu] = useState(false) // petit menu reps ⇄ temps
  const isTime = block.unit === 'time'
  useEffect(() => {
    if (!unitMenu) return
    const close = () => setUnitMenu(false)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [unitMenu])
  const yt = ytId(block.url)
  const vm = vimeoId(block.url)
  const inputStyle = { background: 'var(--bg-base)', border: '1px solid var(--border-soft, var(--border))', color: 'var(--text-primary)' }

  // Autocomplete : suggestions du catalogue pendant la frappe du nom
  const [suggestions, setSuggestions] = useState([])
  const [showSugg, setShowSugg] = useState(false)
  // Aperçu vidéo au survol (>1s) d'une suggestion — desktop uniquement
  const [preview, setPreview] = useState(null) // { url, name, x, y, left }
  const previewTimer = useRef(null)
  const startPreview = (ex, el) => {
    clearTimeout(previewTimer.current)
    if (!ex.url) return
    const r = el.getBoundingClientRect()
    previewTimer.current = setTimeout(() => {
      const W = 300, H = 190
      const vw = window.innerWidth || document.documentElement.clientWidth
      const vh = window.innerHeight || document.documentElement.clientHeight
      const fitsRight = r.right + W + 12 < vw
      setPreview({
        url: ex.url, name: ex.name,
        x: fitsRight ? r.right + 10 : Math.max(8, r.left - W - 10),
        y: Math.min(Math.max(8, r.top - 40), Math.max(8, vh - H - 8)),
      })
    }, 1000)
  }
  const stopPreview = () => { clearTimeout(previewTimer.current); setPreview(null) }
  const handleTitleChange = (v) => {
    set('title', v)
    setSuggestions(searchExercises(v))
    setShowSugg(true)
  }
  const pickSuggestion = (ex) => {
    // Remplit le nom + les défauts UNIQUEMENT sur les champs encore vides,
    // et attache la vidéo de démo si l'exercice en a une (vidéos de Nate)
    onChange({
      ...block, title: ex.name,
      sets: block.sets || ex.sets, reps: block.reps || ex.reps,
      rest: block.rest || ex.rest, rpe: block.rpe || ex.rpe,
      url: block.url || ex.url || '',
    })
    if (ex.url && !block.url) setShowVid(true)
    setShowSugg(false)
  }

  return (
    <div
      {...dropHandlers}
      style={{
        flexShrink: 0,
        width: 'min(80vw, 300px)',
        background: 'var(--bg-card)',
        border: `1.5px solid ${dropTarget ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: dropTarget ? '0 0 0 3px var(--accent)' : '0 10px 30px rgba(0,0,0,0.35)',
        borderRadius: 20,
        padding: 14,
        opacity: dragging ? 0.4 : 1,
        transition: 'opacity .15s, box-shadow .15s, border-color .15s',
      }}
    >
      {/* Barre de liaison (poignée de glisser) — explicite */}
      <div className="flex items-center gap-1.5 mb-3">
        <div {...handleProps} title="Glisse cette carte sur une autre pour créer un superset/circuit"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5"
          style={{ cursor: 'grab', background: 'var(--accent-subtle)', border: '1px dashed var(--accent)',
                   touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
          <span style={{ fontSize: 13, color: 'var(--accent)' }}>⠿</span>
          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Glisser pour lier</span>
        </div>
        {linkable && (
          <button onClick={onLink} title="Lier à l'exercice suivant (superset)"
            style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)', borderRadius: 7, width: 26, height: 26, color: 'var(--accent)', cursor: 'pointer', fontSize: 12 }}>🔗</button>
        )}
        <button onClick={() => onMove(-1)} title="Déplacer à gauche" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 7, width: 26, height: 26, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>←</button>
        <button onClick={() => onMove(1)} title="Déplacer à droite" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 7, width: 26, height: 26, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>→</button>
        <button onClick={onRemove} title="Supprimer" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 7, width: 26, height: 26, color: '#e06b7e', cursor: 'pointer', fontSize: 13 }}>✕</button>
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          value={block.title || ''} onChange={e => handleTitleChange(e.target.value)}
          onFocus={() => { setSuggestions(searchExercises(block.title || '')); setShowSugg(true) }}
          onBlur={() => { setTimeout(() => setShowSugg(false), 180); stopPreview() }}
          placeholder="Nom de l'exercice"
          className="w-full font-black text-base rounded-lg px-2 py-1.5 focus:outline-none"
          style={{ ...inputStyle, color: 'var(--text-primary)' }}
        />
        {preview && createPortal(
          <div style={{ position: 'fixed', left: preview.x, top: preview.y, zIndex: 2000, width: 300,
            background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 14,
            boxShadow: '0 16px 44px rgba(0,0,0,0.55)', overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
              <iframe src={`https://www.youtube.com/embed/${ytId(preview.url)}?autoplay=1&mute=1&rel=0&controls=0&modestbranding=1`}
                title={preview.name} allow="autoplay; encrypted-media"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} />
            </div>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', margin: 0, padding: '7px 10px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🎥 {preview.name}</p>
          </div>,
          document.body
        )}
        {showSugg && suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4,
            background: 'var(--bg-card-2, var(--bg-card))', border: '1px solid var(--accent)', borderRadius: 12,
            overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.45)' }}>
            {suggestions.map(ex => (
              <button key={ex.name} type="button"
                onMouseDown={e => { e.preventDefault(); pickSuggestion(ex) }}
                className="w-full text-left px-3 py-2 flex items-center justify-between gap-2"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-subtle)'; startPreview(ex, e.currentTarget) }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; stopPreview() }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ex.url && <span title="Ta vidéo de démo" style={{ marginRight: 5 }}>🎥</span>}{ex.name}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                  {ex.cat} · {ex.sets}×{ex.reps}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Séries / reps ou temps / repos / RPE — en superset, séries et repos sont communs au groupe */}
      <div className={`grid ${inGroup ? 'grid-cols-2' : 'grid-cols-4'} gap-1.5 mb-3`}>
        {[
          ...(inGroup ? [] : [{ k: 'sets', label: 'Séries', ph: '4' }]),
          { k: 'reps', label: isTime ? 'Temps' : 'Reps', ph: isTime ? '45s' : '10', switchable: true },
          ...(inGroup ? [] : [{ k: 'rest', label: 'Repos', ph: '90s' }]),
          { k: 'rpe', label: 'RPE', ph: '8' },
        ].map(({ k, label, ph, switchable }) => (
          <div key={k} style={switchable ? { position: 'relative' } : undefined}>
            {switchable ? (
              <>
                <button type="button"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => setUnitMenu(m => !m)}
                  title="Basculer entre répétitions et temps"
                  className="block w-full text-[8px] font-black uppercase tracking-wide mb-1 text-center"
                  style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {label} ▾
                </button>
                {unitMenu && (
                  <div onPointerDown={e => e.stopPropagation()}
                    style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', zIndex: 60, marginTop: 2,
                      background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 10, overflow: 'hidden',
                      boxShadow: '0 10px 26px rgba(0,0,0,0.5)', width: 132 }}>
                    {[['reps', '🔁 Répétitions'], ['time', '⏱ Temps (sec)']].map(([u, lbl]) => {
                      const on = isTime ? u === 'time' : u === 'reps'
                      return (
                        <button key={u} type="button" onClick={() => { set('unit', u); setUnitMenu(false) }}
                          className="w-full text-left px-3 py-2"
                          style={{ background: on ? 'var(--accent-subtle)' : 'transparent', border: 'none', cursor: 'pointer',
                            fontSize: 11, fontWeight: 800, color: on ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          {lbl}{on ? ' ✓' : ''}
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <label className="block text-[8px] font-black uppercase tracking-wide mb-1 text-center" style={{ color: 'var(--text-muted)' }}>{label}</label>
            )}
            <input value={block[k] || ''} onChange={e => set(k, e.target.value)} placeholder={ph}
              className="w-full text-center text-sm font-bold rounded-lg px-0.5 py-2 focus:outline-none"
              style={inputStyle} />
          </div>
        ))}
      </div>

      {/* Notes */}
      <textarea value={block.notes || ''} onChange={e => set('notes', e.target.value)}
        placeholder="Note / consigne (tempo, technique…)" rows={2}
        className="w-full text-xs rounded-lg px-3 py-2 mb-2 resize-none focus:outline-none"
        style={{ ...inputStyle, color: 'var(--text-secondary)' }} />

      {/* Vidéo + miniature */}
      {showVid || block.url ? (
        <>
          <input value={block.url || ''} onChange={e => set('url', e.target.value)}
            placeholder="Lien vidéo (YouTube/Vimeo)"
            className="w-full text-xs rounded-lg px-3 py-2 focus:outline-none"
            style={inputStyle} />
          {yt && (
            <div onClick={() => setPlaying(true)} title="Lire la vidéo"
              className="mt-2 rounded-lg overflow-hidden relative" style={{ aspectRatio: '16/9', background: '#000', cursor: 'pointer' }}>
              <img src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(160,56,72,0.92)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, paddingLeft: 3,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>▶</div>
              </div>
            </div>
          )}
          {!yt && vm && (
            <button onClick={() => setPlaying(true)} type="button"
              className="text-[10px] mt-2 font-bold" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              🎬 Vidéo Vimeo liée — ▶ lire
            </button>
          )}
          {/* Lecteur plein écran (portail : hors des cartes transformées) */}
          {playing && (yt || vm) && createPortal(
            <div onClick={() => setPlaying(false)} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.88)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 860 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ color: '#fff', fontWeight: 900, fontSize: 16, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    🎥 {block.title || 'Vidéo de démo'}
                  </p>
                  <button onClick={() => setPlaying(false)} style={{ width: 34, height: 34, borderRadius: 99, cursor: 'pointer', flexShrink: 0,
                    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>✕</button>
                </div>
                <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 16, overflow: 'hidden', background: '#000' }}>
                  <iframe
                    src={yt ? `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1`
                            : `https://player.vimeo.com/video/${vm}?autoplay=1`}
                    title={block.title || 'Vidéo'} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      ) : (
        <button onClick={() => setShowVid(true)}
          className="text-xs font-bold" style={{ color: 'var(--accent)' }}>🎬 Ajouter une vidéo</button>
      )}
    </div>
  )
}

/* ── Pop-up bibliothèque : ajout d'un exercice en un clic ── */
const normName = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

function LibraryPicker({ onClose, onAdd, existing }) {
  const all = getLibraryExercises()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Tous')
  const [added, setAdded] = useState(0)
  const [flash, setFlash] = useState(null)
  // Aperçu vidéo quand la souris reste sur la miniature (>1s)
  const [preview, setPreview] = useState(null) // { id, name, x, y }
  const previewTimer = useRef(null)
  useEffect(() => () => clearTimeout(previewTimer.current), [])
  const startPreview = (ex, el) => {
    clearTimeout(previewTimer.current)
    const vid = ytId(ex.url)
    if (!vid) return
    const r = el.getBoundingClientRect()
    previewTimer.current = setTimeout(() => {
      const W = 300, H = 200
      const vw = window.innerWidth || document.documentElement.clientWidth
      const vh = window.innerHeight || document.documentElement.clientHeight
      const fitsRight = r.right + W + 12 < vw
      setPreview({
        id: vid, name: ex.name,
        x: fitsRight ? r.right + 10 : Math.max(8, r.left - W - 10),
        y: Math.min(Math.max(8, r.top - 60), Math.max(8, vh - H - 8)),
      })
    }, 1000)
  }
  const stopPreview = () => { clearTimeout(previewTimer.current); setPreview(null) }

  const inDay = new Set((existing || []).map(normName))
  const cats = ['Tous', ...[...new Set(all.map(e => e.cat))].sort((a, b) => a.localeCompare(b, 'fr'))]
  const list = all
    .filter(e => cat === 'Tous' || e.cat === cat)
    .filter(e => !q || normName(e.name).includes(normName(q)))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const pick = (ex) => {
    stopPreview()
    onAdd(ex)
    setAdded(n => n + 1)
    setFlash(ex.name)
    setTimeout(() => setFlash(f => (f === ex.name ? null : f)), 900)
  }

  return createPortal(
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2600, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: 'min(94vw, 620px)', maxHeight: '76vh', display: 'flex', flexDirection: 'column',
          background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 22,
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}>

        {/* En-tête */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>📚 Bibliothèque d'exercices</p>
            <p style={{ fontSize: 10, color: 'var(--text-faint)', margin: '2px 0 0' }}>Clique un exercice pour l'ajouter à la séance</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 99, cursor: 'pointer', flexShrink: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>✕</button>
        </div>

        {/* Recherche + catégories */}
        <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un exercice…"
            className="w-full text-sm font-bold rounded-xl px-3 py-2.5 focus:outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          {cats.length > 2 && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              {cats.map(c => (
                <button key={c} onClick={() => setCat(c)}
                  className="flex-shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full"
                  style={{ cursor: 'pointer',
                    background: cat === c ? 'var(--accent)' : 'var(--bg-card)',
                    border: `1px solid ${cat === c ? 'var(--accent)' : 'var(--border)'}`,
                    color: cat === c ? '#fff' : 'var(--text-secondary)' }}>{c}</button>
              ))}
            </div>
          )}
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 120 }} onScroll={stopPreview}>
          {all.length === 0 ? (
            <p className="text-center text-xs px-6 py-10" style={{ color: 'var(--text-muted)' }}>
              Ta bibliothèque est vide.<br />Ajoute tes vidéos dans l'onglet <b>Bibliothèque</b> (import par liens).
            </p>
          ) : list.length === 0 ? (
            <p className="text-center text-xs px-6 py-10" style={{ color: 'var(--text-muted)' }}>Aucun exercice ne correspond à « {q} ».</p>
          ) : list.map(ex => {
            const y = ytId(ex.url)
            const already = inDay.has(normName(ex.name))
            const flashing = flash === ex.name
            return (
              <button key={ex.name} onClick={() => pick(ex)}
                className="w-full flex items-center gap-3 px-4 py-2 text-left"
                style={{ background: flashing ? 'rgba(39,174,96,0.14)' : 'transparent', border: 'none',
                  borderBottom: '1px solid var(--border-soft, var(--border))', cursor: 'pointer', transition: 'background .15s' }}
                onMouseEnter={e => { if (!flashing) e.currentTarget.style.background = 'var(--accent-subtle)' }}
                onMouseLeave={e => { e.currentTarget.style.background = flashing ? 'rgba(39,174,96,0.14)' : 'transparent' }}>
                {y ? (
                  <img src={`https://i.ytimg.com/vi/${y}/mqdefault.jpg`} alt="" loading="lazy"
                    onMouseEnter={e => startPreview(ex, e.currentTarget)} onMouseLeave={stopPreview}
                    style={{ width: 68, height: 40, objectFit: 'cover', borderRadius: 8, flexShrink: 0, background: '#000' }} />
                ) : (
                  <div style={{ width: 68, height: 40, borderRadius: 8, flexShrink: 0, background: 'var(--bg-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🎬</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', margin: '2px 0 0' }}>
                    {ex.cat} · {ex.sets}×{ex.reps}{already ? ' · déjà dans la séance' : ''}
                  </p>
                </div>
                <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 900,
                  color: flashing ? '#27ae60' : 'var(--accent)' }}>{flashing ? '✓ Ajouté' : '+ Ajouter'}</span>
              </button>
            )
          })}
        </div>

        {/* Pied */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: added > 0 ? '#27ae60' : 'var(--text-faint)' }}>
            {added > 0 ? `✓ ${added} exercice${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''}` : `${list.length} exercice${list.length > 1 ? 's' : ''}`}
          </span>
          <button onClick={onClose} className="text-xs font-black px-4 py-2 rounded-xl"
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>Terminé</button>
        </div>
      </div>

      {/* Aperçu vidéo au survol d'une miniature */}
      {preview && (
        <div style={{ position: 'fixed', left: preview.x, top: preview.y, zIndex: 2700, width: 300,
          background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 14,
          boxShadow: '0 16px 44px rgba(0,0,0,0.55)', overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
            <iframe src={`https://www.youtube.com/embed/${preview.id}?autoplay=1&mute=1&rel=0&controls=0&modestbranding=1`}
              title={preview.name} allow="autoplay; encrypted-media"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', margin: 0, padding: '7px 10px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🎥 {preview.name}</p>
        </div>
      )}
    </div>,
    document.body
  )
}

/* ── Composant principal ────────────────────────────────── */
export default function CoachProgramBuilder() {
  const navigate = useNavigate()
  const { programId } = useParams()
  const isEdit = !!programId
  const { createProgram, updateProgram, fetchProgram, token } = useStore()

  // Bibliothèque d'exercices admin (vidéos) → alimente l'autocomplete
  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
    fetch(`${API}/exercise-library`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(list => setLibraryExercises(list))
      .catch(() => {})
  }, [token])

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [draftMsg, setDraftMsg] = useState('')
  const [weekIdx, setWeekIdx] = useState(0)
  const [selDay, setSelDay] = useState(null) // weekday 0-6 sélectionné
  const [showMeta, setShowMeta] = useState(!isEdit)
  const [libOpen, setLibOpen] = useState(false) // pop-up bibliothèque

  const DRAFT_KEY = `ultra-draft-${programId || 'new'}`
  const draftTimer = useRef()

  const EMPTY_FORM = {
    title: '', description: '', category: 'Force', level: 'Tous niveaux',
    price: 0, duration: '', gradient: GRADIENTS[0], coverImage: null,
    weeks: [{ id: uuidv4(), title: '', days: [] }],
  }

  // Normalise les jours : chaque jour a un weekday (0-6)
  const normalizeWeeks = (weeks) => (weeks || []).map(w => ({
    ...w,
    days: (w.days || []).map((d, i) => ({ ...d, weekday: d.weekday ?? Math.min(i, 6) })),
  }))

  const [form, setForm] = useState(() => {
    if (!isEdit) {
      try { const draft = localStorage.getItem(DRAFT_KEY); if (draft) return JSON.parse(draft) } catch {}
    }
    return EMPTY_FORM
  })

  useEffect(() => {
    if (isEdit) fetchProgram(programId).then(() => {
      const s = useStore.getState().currentProgram
      if (s) {
        try {
          const draft = localStorage.getItem(DRAFT_KEY)
          if (draft) { const p = JSON.parse(draft); if (p.title || p.weeks?.some(w => w.days?.length)) { setForm({ ...p, weeks: normalizeWeeks(p.weeks) }); return } }
        } catch {}
        setForm({ ...s, weeks: normalizeWeeks(s.weeks || s.sections || [{ id: uuidv4(), title: '', days: [] }]), coverImage: s.coverImage || null })
      }
    })
  }, [programId])

  // Autosave brouillon
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)) } catch {}
    clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => { setDraftMsg('✓ Brouillon sauvegardé'); setTimeout(() => setDraftMsg(''), 1500) }, 600)
    return () => clearTimeout(draftTimer.current)
  }, [form])

  const week = form.weeks[weekIdx] || form.weeks[0]
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function updateWeek(updater) {
    setForm(f => {
      const weeks = [...f.weeks]
      weeks[weekIdx] = typeof updater === 'function' ? updater(weeks[weekIdx]) : updater
      return { ...f, weeks }
    })
  }
  const addWeek = () => setForm(f => ({ ...f, weeks: [...f.weeks, { id: uuidv4(), title: '', days: [] }] }))
  const removeWeek = () => {
    if (form.weeks.length <= 1) return
    if (!window.confirm('Supprimer cette semaine ?')) return
    setForm(f => ({ ...f, weeks: f.weeks.filter((_, i) => i !== weekIdx) }))
    setWeekIdx(i => Math.max(0, i - 1)); setSelDay(null)
  }
  const duplicateWeek = () => {
    setForm(f => {
      const copy = JSON.parse(JSON.stringify(f.weeks[weekIdx]))
      copy.id = uuidv4(); copy.title = (copy.title || `Semaine ${weekIdx + 1}`) + ' (copie)'
      copy.days = (copy.days || []).map(d => ({ ...d, id: uuidv4(), blocks: (d.blocks || []).map(b => ({ ...b, id: uuidv4() })) }))
      const weeks = [...f.weeks]; weeks.splice(weekIdx + 1, 0, copy); return { ...f, weeks }
    })
    setWeekIdx(weekIdx + 1) // bascule sur la copie pour la voir
    setSelDay(null)
    setSaveMsg('✓ Semaine dupliquée'); setTimeout(() => setSaveMsg(''), 1500)
  }

  const dayByWeekday = (wd) => (week.days || []).find(d => d.weekday === wd)

  function selectDay(wd) {
    if (!dayByWeekday(wd)) {
      updateWeek(w => ({ ...w, days: [...(w.days || []), { id: uuidv4(), weekday: wd, label: DAYS_FR[wd], blocks: [] }] }))
    }
    setSelDay(wd)
  }

  function updateDayBlocks(blocks) {
    updateWeek(w => ({ ...w, days: (w.days || []).map(d => d.weekday === selDay ? { ...d, blocks } : d) }))
  }
  const curDay = selDay != null ? dayByWeekday(selDay) : null
  const blocks = curDay?.blocks || []

  const addExo = () => updateDayBlocks([...blocks, { id: uuidv4(), type: 'exercise', title: '', sets: '', reps: '', rest: '', notes: '', url: '' }])
  // Ajout en un clic depuis la pop-up bibliothèque : nom + défauts + vidéo, puis scroll en bout de fresque
  const addFromLibrary = (ex) => {
    updateDayBlocks([...blocks, { id: uuidv4(), type: 'exercise', title: ex.name, sets: ex.sets || '', reps: ex.reps || '', rest: ex.rest || '', rpe: ex.rpe || '', notes: '', url: ex.url || '' }])
    setTimeout(() => { const sc = scrollRef.current; if (sc) sc.scrollLeft = sc.scrollWidth }, 60)
  }
  const updateBlock = (id, nb) => updateDayBlocks(blocks.map(b => b.id === id ? nb : b))
  const removeBlock = (id) => updateDayBlocks(blocks.filter(b => b.id !== id))
  const moveBlock = (id, dir) => {
    const arr = [...blocks]
    const i = arr.findIndex(b => b.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    updateDayBlocks(arr)
  }

  // ── Glisser-déposer : réordonner + grouper ──
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const dragRef = useRef({ id: null, over: null })

  function applyDrop(sourceId, targetId, mode) {
    if (!sourceId || sourceId === targetId) { setDragId(null); setOverId(null); return }
    const arr = [...blocks]
    const from = arr.findIndex(b => b.id === sourceId)
    if (from < 0) { setDragId(null); setOverId(null); return }
    const [moved] = arr.splice(from, 1)
    const tIdx = arr.findIndex(b => b.id === targetId)
    if (tIdx < 0) { setDragId(null); setOverId(null); return }
    if (mode === 'group') {
      // Grouper : même `group` que la cible, inséré juste après.
      // Le repos devient commun à tout le groupe (celui de la cible en priorité).
      const gid = arr[tIdx].group || uuidv4()
      arr[tIdx] = { ...arr[tIdx], group: gid }
      arr.splice(tIdx + 1, 0, { ...moved, group: gid })
      const commonRest = arr[tIdx].rest || moved.rest || ''
      const commonSets = arr[tIdx].sets || moved.sets || ''
      for (let k = 0; k < arr.length; k++) if (arr[k].group === gid) arr[k] = { ...arr[k], rest: commonRest, sets: commonSets }
    } else {
      // Réordonner avant la cible, hors groupe
      arr.splice(tIdx, 0, { ...moved, group: null })
    }
    updateDayBlocks(arr)
    setDragId(null); setOverId(null)
  }

  // Drag unifié souris + tactile (Pointer Events). Le HTML5 DnD ne fonctionne pas
  // sur mobile (aucun événement drag) et déclenche la sélection de texte au doigt.
  function startPointerDrag(e, id) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { id, over: null, x: 0, y: 0 }
    setDragId(id); setOverId(null)

    const evalOver = (x, y) => {
      const el = document.elementFromPoint(x, y)
      const card = el && el.closest('[data-block-id]')
      const over = card ? card.getAttribute('data-block-id') : null
      if (over !== dragRef.current.over) {
        dragRef.current.over = over
        setOverId(over && over !== id ? over : null)
      }
    }
    const move = (ev) => {
      ev.preventDefault()
      dragRef.current.x = ev.clientX
      dragRef.current.y = ev.clientY
      evalOver(ev.clientX, ev.clientY)
    }
    // Auto-scroll horizontal quand le doigt approche d'un bord (cartes larges = cible hors écran)
    let raf
    const EDGE = 60, SPEED = 14
    const tick = () => {
      const sc = scrollRef.current
      const { x, y } = dragRef.current
      if (sc && x > 0) {
        if (x > window.innerWidth - EDGE) { sc.scrollLeft += SPEED; evalOver(x, y) }
        else if (x < EDGE) { sc.scrollLeft -= SPEED; evalOver(x, y) }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const end = () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      const { id: dId, over } = dragRef.current
      dragRef.current = { id: null, over: null, x: 0, y: 0 }
      if (over && over !== dId) applyDrop(dId, over, 'group')
      else { setDragId(null); setOverId(null) }
    }
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }
  // Alternative tactile au glisser : lier une carte à la suivante en un tap
  function linkWithNext(id) {
    const arr = [...blocks]
    const i = arr.findIndex(b => b.id === id)
    if (i < 0 || i >= arr.length - 1) return
    const gid = arr[i].group || arr[i + 1].group || uuidv4()
    const commonRest = arr[i].rest || arr[i + 1].rest || ''
    const commonSets = arr[i].sets || arr[i + 1].sets || ''
    arr[i] = { ...arr[i], group: gid }
    arr[i + 1] = { ...arr[i + 1], group: gid }
    updateDayBlocks(arr.map(b => b.group === gid ? { ...b, rest: commonRest, sets: commonSets } : b))
  }
  function ungroupSegment(gid) {
    updateDayBlocks(blocks.map(b => b.group === gid ? { ...b, group: null } : b))
  }
  // Repos et séries communs d'un superset/circuit : une seule valeur pour tout le groupe
  function setGroupRest(gid, v) {
    updateDayBlocks(blocks.map(b => b.group === gid ? { ...b, rest: v } : b))
  }
  function setGroupSets(gid, v) {
    updateDayBlocks(blocks.map(b => b.group === gid ? { ...b, sets: v } : b))
  }

  async function handleSave() {
    if (!form.title.trim()) { setSaveMsg('Le titre est requis.'); setShowMeta(true); return }
    setSaving(true); setSaveMsg('')
    // Nettoie : retire les jours vides (repos), enlève les groupes orphelins (1 seul membre)
    const cleanWeeks = form.weeks.map(w => {
      const days = (w.days || []).filter(d => d.blocks?.length)
        .map(d => {
          const counts = {}
          d.blocks.forEach(b => { if (b.group) counts[b.group] = (counts[b.group] || 0) + 1 })
          return { ...d, blocks: d.blocks.map(b => (b.group && counts[b.group] < 2) ? { ...b, group: null } : b) }
        })
      return { ...w, days }
    })
    const payload = { ...form, weeks: cleanWeeks, sections: cleanWeeks }
    const res = isEdit ? await updateProgram(programId, payload) : await createProgram(payload)
    setSaving(false)
    if (res.success) { localStorage.removeItem(DRAFT_KEY); setSaveMsg('✓ Enregistré'); setTimeout(() => navigate('/coach/programs'), 700) }
    else setSaveMsg(res.error || 'Erreur')
  }

  // Pan à la souris : agripper le fond de la fresque (hors cartes/boutons) pour
  // la faire défiler librement, sans dépendre de la barre de défilement
  function startPanDrag(e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    if (e.target.closest('[data-card], button, input, textarea, select, a')) return
    const sc = scrollRef.current
    if (!sc) return
    e.preventDefault()
    const startX = e.clientX, startLeft = sc.scrollLeft
    sc.style.cursor = 'grabbing'
    const move = ev => { sc.scrollLeft = startLeft - (ev.clientX - startX) }
    const up = () => { sc.style.cursor = 'grab'; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // Animation fresque : scale/opacité selon distance au centre
  const scrollRef = useRef(null)
  const rafRef = useRef(null)
  const animateFresco = () => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const el = scrollRef.current
      if (!el) return
      const center = el.scrollLeft + el.clientWidth / 2
      ;[...el.querySelectorAll('[data-card]')].forEach(card => {
        const cc = card.offsetLeft + card.offsetWidth / 2
        const dist = Math.min(Math.abs(center - cc) / (el.clientWidth / 2), 1)
        card.style.transform = `scale(${1 - dist * 0.08})`
        card.style.opacity = `${1 - dist * 0.35}`
      })
    })
  }
  useEffect(() => { animateFresco() }, [selDay, blocks.length, weekIdx])

  const iStyle = { background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => navigate('/coach/programs')} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-faint)', cursor: 'pointer' }}>←</button>
        <div className="flex-1 min-w-0">
          <input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Titre du programme…"
            className="w-full font-black text-base bg-transparent focus:outline-none" style={{ color: 'var(--text-primary)' }} />
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{draftMsg || `${CAT_ICONS[form.category] || ''} ${form.category} · ${form.level}`}</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-black text-white"
          style={{ background: 'var(--accent)', opacity: saving ? 0.6 : 1 }}>{saving ? '…' : '✓ Enregistrer'}</button>
      </div>

      {saveMsg && (
        <div style={{ position: 'fixed', top: 70, right: 16, zIndex: 50, background: saveMsg[0] === '✓' ? '#27ae60' : '#ef4444', color: '#fff', padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13 }}>{saveMsg}</div>
      )}

      <div style={{ maxWidth: 920, margin: '0 auto', padding: 'clamp(12px,3vw,24px)' }}>

        {/* ── Détails du programme (onglet dépliable au-dessus des semaines) ── */}
        <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <button onClick={() => setShowMeta(s => !s)} className="w-full flex items-center justify-between px-4 py-3.5">
            <span className="font-black text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>⚙ Détails du programme</span>
            <span className="text-xs transition-transform" style={{ color: 'var(--text-faint)', transform: showMeta ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
          </button>
          {showMeta && (
          <div className="p-4 pt-1 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
            <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={2}
              placeholder="Description du programme" className="w-full text-sm rounded-xl px-3 py-2 resize-none focus:outline-none" style={iStyle} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>Catégorie</label>
                <select value={form.category} onChange={e => setField('category', e.target.value)} className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none" style={iStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>Niveau</label>
                <select value={form.level} onChange={e => setField('level', e.target.value)} className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none" style={iStyle}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>Durée</label>
                <input value={form.duration} onChange={e => setField('duration', e.target.value)} placeholder="8 semaines" className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none" style={iStyle} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>Prix (€)</label>
                <input type="number" value={form.price} onChange={e => setField('price', Number(e.target.value))} placeholder="0" className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none" style={iStyle} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>Couleur</label>
              <div className="flex gap-2 flex-wrap">
                {GRADIENTS.map(g => (
                  <button key={g} onClick={() => setField('gradient', g)} style={{ width: 34, height: 34, borderRadius: 10, background: g, border: form.gradient === g ? '3px solid var(--text-primary)' : '3px solid transparent', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
          </div>
          )}
        </div>

        {/* ── Sélecteur de semaine ── */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {form.weeks.map((w, i) => (
            <button key={w.id} onClick={() => { setWeekIdx(i); setSelDay(null) }}
              className="px-4 py-2 rounded-xl text-sm font-black whitespace-nowrap flex-shrink-0"
              style={{ background: i === weekIdx ? 'var(--accent)' : 'var(--bg-card)', color: i === weekIdx ? '#fff' : 'var(--text-secondary)', border: `1px solid ${i === weekIdx ? 'var(--accent)' : 'var(--border)'}` }}>
              Semaine {i + 1}
            </button>
          ))}
          <button onClick={addWeek} className="px-3 py-2 rounded-xl text-sm font-black flex-shrink-0"
            style={{ background: 'var(--bg-card)', color: 'var(--accent)', border: '1px dashed var(--accent)' }}>+ Semaine</button>
        </div>

        {/* ── Calendrier des jours ── */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: 'var(--text-faint)' }}>Clique un jour pour bâtir la séance</p>
          <div className="flex gap-2">
            <button onClick={duplicateWeek} className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>⧉ Dupliquer</button>
            {form.weeks.length > 1 && <button onClick={removeWeek} className="text-[11px] font-bold" style={{ color: '#a03848' }}>✕ Semaine</button>}
          </div>
        </div>
        <div className="mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
          {DAYS_FR.map((dName, wd) => {
            const d = dayByWeekday(wd)
            const n = d?.blocks?.length || 0
            const active = selDay === wd
            return (
              <button key={wd} onClick={() => selectDay(wd)}
                className="rounded-xl py-3 px-1 flex flex-col items-center gap-1 transition-all"
                style={{
                  background: active ? 'var(--accent)' : (n > 0 ? 'var(--accent-subtle)' : 'var(--bg-card)'),
                  border: `1.5px solid ${active ? 'var(--accent)' : (n > 0 ? 'var(--accent)' : 'var(--border)')}`,
                  transform: active ? 'translateY(-2px)' : 'none',
                  boxShadow: active ? '0 8px 20px rgba(160,56,72,0.4)' : '0 2px 10px rgba(0,0,0,0.25)',
                }}>
                <span className="text-[10px] font-black uppercase" style={{ color: active ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)' }}>{DAYS_SHORT[wd]}</span>
                {n > 0 ? (
                  <span className="text-base font-black" style={{ color: active ? '#fff' : 'var(--accent)' }}>{n}</span>
                ) : (
                  <span className="text-base font-black" style={{ color: active ? 'rgba(255,255,255,0.6)' : 'var(--text-faint)' }}>·</span>
                )}
                <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: active ? 'rgba(255,255,255,0.8)' : (n > 0 ? 'var(--accent)' : 'var(--text-faint)') }}>{n > 0 ? 'exos' : 'repos'}</span>
              </button>
            )
          })}
        </div>

        {/* ── Fresque latérale de la séance ── */}
        {selDay == null ? (
          <div className="rounded-2xl py-16 text-center" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Choisis un jour ci-dessus pour composer ta séance.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3 gap-2">
              <input value={curDay?.label || DAYS_FR[selDay]} onChange={e => updateWeek(w => ({ ...w, days: w.days.map(d => d.weekday === selDay ? { ...d, label: e.target.value } : d) }))}
                className="font-black text-lg bg-transparent focus:outline-none" style={{ color: 'var(--text-primary)', minWidth: 0, flex: 1 }} />
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setLibOpen(true)}
                  className="text-[11px] font-black px-3 py-1.5 rounded-xl"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)', cursor: 'pointer' }}>
                  📚 Bibliothèque
                </button>
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{blocks.length} exo{blocks.length > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* ── Résumé de la séance : durée, kcal, exos ── */}
            {blocks.length > 0 && (() => {
              const { totalSecs } = estimateSession(blocks)
              const mins = Math.max(1, Math.round(totalSecs / 60))
              const kcal = estimateKcal(totalSecs, form.category)
              const stats = [
                { icon: '⏱', v: `~${mins} min`, l: 'Durée totale' },
                { icon: '🔥', v: `≈${kcal} kcal`, l: 'Dépense estimée' },
                { icon: '🏋️', v: blocks.length, l: `Exercice${blocks.length > 1 ? 's' : ''}` },
              ]
              return (
                <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--gold)', margin: 0 }}>Résumé de la séance</p>
                    <p className="text-[9px] font-bold" style={{ color: 'var(--text-faint)', margin: 0 }}>estimation</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {stats.map(s => (
                      <div key={s.l} className="rounded-xl py-2.5 px-1 text-center" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-soft, var(--border))' }}>
                        <p style={{ fontSize: 'clamp(13px,3.5vw,16px)', fontWeight: 900, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap' }}>{s.icon} {s.v}</p>
                        <p className="text-[8px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)', margin: '3px 0 0' }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {blocks.length > 0 && (
              <p className="text-[11px] mb-2" style={{ color: 'var(--text-faint)' }}>
                💡 Glisse une carte <strong>sur</strong> une autre pour créer un <strong>superset/circuit</strong>, ou <strong>entre</strong> deux pour réordonner.
              </p>
            )}

            {/* La fresque */}
            <div ref={scrollRef} onScroll={animateFresco}
              className="flex gap-3 overflow-x-auto pb-4"
              onPointerDown={startPanDrag}
              style={{ WebkitOverflowScrolling: 'touch', cursor: 'grab' }}>

              {segmentBlocks(blocks).map((seg, si) => {
                const inner = (
                  <div key={si} className="flex gap-2" style={{
                    flexShrink: 0,
                    ...(seg.group ? {
                      padding: 10, borderRadius: 24,
                      background: 'linear-gradient(135deg, rgba(160,56,72,0.07), rgba(160,56,72,0.02))',
                      border: '1.5px dashed var(--accent)',
                    } : {}),
                  }}>
                    {seg.group && (
                      <div className="flex flex-col items-center justify-center flex-shrink-0 px-1" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
                          {seg.items.length === 2 ? 'Superset' : `Circuit ×${seg.items.length}`}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {seg.items.map(b => (
                        <div key={b.id} data-card data-block-id={b.id} style={{ transition: 'transform .15s, opacity .15s' }}>
                          <ExoCard
                            block={b}
                            onChange={nb => updateBlock(b.id, nb)}
                            onRemove={() => removeBlock(b.id)}
                            onMove={dir => moveBlock(b.id, dir)}
                            onLink={() => linkWithNext(b.id)}
                            linkable={(() => { const i = blocks.findIndex(x => x.id === b.id); return i >= 0 && i < blocks.length - 1 && !(blocks[i].group && blocks[i].group === blocks[i + 1].group) })()}
                            inGroup={!!seg.group}
                            dragging={dragId === b.id}
                            dropTarget={overId === b.id && dragId && dragId !== b.id}
                            handleProps={{
                              onPointerDown: e => startPointerDrag(e, b.id),
                            }}
                            dropHandlers={{}}
                          />
                        </div>
                      ))}
                    </div>
                    {seg.group && (
                      <div className="flex flex-col items-center justify-center gap-3 flex-shrink-0 self-center px-1">
                        {/* Séries + repos communs à tout le superset/circuit */}
                        <div className="flex flex-col items-center">
                          <label className="text-[8px] font-black uppercase tracking-wide mb-1" style={{ color: 'var(--accent)' }}>Séries</label>
                          <input value={seg.items[0]?.sets || ''} onChange={e => setGroupSets(seg.group, e.target.value)}
                            placeholder="4" inputMode="numeric"
                            className="text-center text-sm font-bold rounded-lg py-2 focus:outline-none"
                            style={{ width: 58, background: 'var(--bg-card)', border: '1.5px solid var(--accent)', color: 'var(--text-primary)' }} />
                        </div>
                        <div className="flex flex-col items-center">
                          <label className="text-[8px] font-black uppercase tracking-wide mb-1" style={{ color: 'var(--accent)' }}>Repos</label>
                          <input value={seg.items[0]?.rest || ''} onChange={e => setGroupRest(seg.group, e.target.value)}
                            placeholder="90s" inputMode="text"
                            className="text-center text-sm font-bold rounded-lg py-2 focus:outline-none"
                            style={{ width: 58, background: 'var(--bg-card)', border: '1.5px solid var(--accent)', color: 'var(--text-primary)' }} />
                          <span className="text-[8px] font-bold mt-1" style={{ color: 'var(--text-faint)' }}>communs</span>
                        </div>
                        <button onClick={() => ungroupSegment(seg.group)} title="Dissocier"
                          className="text-[10px] font-bold px-2 py-1 rounded-lg"
                          style={{ background: 'var(--bg-card)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>⛓ Dissocier</button>
                      </div>
                    )}
                  </div>
                )
                return inner
              })}

              {/* Carte "ajouter" : exercice vide ou depuis la bibliothèque */}
              <div style={{ flexShrink: 0, width: 'min(60vw, 200px)', minHeight: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={addExo}
                  style={{ flex: 1, borderRadius: 20, border: '2px dashed var(--border)', background: 'transparent', color: 'var(--text-faint)', fontWeight: 800, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-faint)' }}>
                  + Ajouter un exercice
                </button>
                <button onClick={() => setLibOpen(true)}
                  style={{ padding: '12px 0', borderRadius: 16, border: '1.5px solid var(--accent)', background: 'var(--accent-subtle)',
                    color: 'var(--accent)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                  📚 Bibliothèque
                </button>
              </div>
            </div>

            {blocks.length === 0 && (
              <p className="text-center text-xs mt-2" style={{ color: 'var(--text-faint)' }}>Ajoute ton premier exercice pour démarrer la fresque.</p>
            )}

            {libOpen && (
              <LibraryPicker onClose={() => setLibOpen(false)} onAdd={addFromLibrary} existing={blocks.map(b => b.title)} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
