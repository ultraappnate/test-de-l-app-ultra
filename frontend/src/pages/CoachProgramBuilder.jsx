import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { searchExercises } from '../data/exerciseCatalog'
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

/* ── Carte exercice (fresque) ───────────────────────────── */
function ExoCard({ block, onChange, onRemove, onMove, onLink, linkable, dropHandlers, handleProps, dragging, dropTarget }) {
  const set = (k, v) => onChange({ ...block, [k]: v })
  const [showVid, setShowVid] = useState(!!block.url)
  const yt = ytId(block.url)
  const vm = vimeoId(block.url)
  const inputStyle = { background: 'var(--bg-base)', border: '1px solid var(--border-soft, var(--border))', color: 'var(--text-primary)' }

  // Autocomplete : suggestions du catalogue pendant la frappe du nom
  const [suggestions, setSuggestions] = useState([])
  const [showSugg, setShowSugg] = useState(false)
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
        scrollSnapAlign: 'center',
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
          onBlur={() => setTimeout(() => setShowSugg(false), 180)}
          placeholder="Nom de l'exercice"
          className="w-full font-black text-base rounded-lg px-2 py-1.5 focus:outline-none"
          style={{ ...inputStyle, color: 'var(--text-primary)' }}
        />
        {showSugg && suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4,
            background: 'var(--bg-card-2, var(--bg-card))', border: '1px solid var(--accent)', borderRadius: 12,
            overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.45)' }}>
            {suggestions.map(ex => (
              <button key={ex.name} type="button"
                onMouseDown={e => { e.preventDefault(); pickSuggestion(ex) }}
                className="w-full text-left px-3 py-2 flex items-center justify-between gap-2"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
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

      {/* Séries / reps / repos / RPE */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {[
          { k: 'sets', label: 'Séries', ph: '4' },
          { k: 'reps', label: 'Reps', ph: '10' },
          { k: 'rest', label: 'Repos', ph: '90s' },
          { k: 'rpe', label: 'RPE', ph: '8' },
        ].map(({ k, label, ph }) => (
          <div key={k}>
            <label className="block text-[8px] font-black uppercase tracking-wide mb-1 text-center" style={{ color: 'var(--text-muted)' }}>{label}</label>
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
            <div className="mt-2 rounded-lg overflow-hidden relative" style={{ aspectRatio: '16/9', background: '#000' }}>
              <img src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span style={{ fontSize: 30, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}>▶️</span>
              </div>
            </div>
          )}
          {!yt && vm && (
            <p className="text-[10px] mt-2" style={{ color: 'var(--text-faint)' }}>🎬 Vidéo Vimeo liée</p>
          )}
        </>
      ) : (
        <button onClick={() => setShowVid(true)}
          className="text-xs font-bold" style={{ color: 'var(--accent)' }}>🎬 Ajouter une vidéo</button>
      )}
    </div>
  )
}

/* ── Composant principal ────────────────────────────────── */
export default function CoachProgramBuilder() {
  const navigate = useNavigate()
  const { programId } = useParams()
  const isEdit = !!programId
  const { createProgram, updateProgram, fetchProgram } = useStore()

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [draftMsg, setDraftMsg] = useState('')
  const [weekIdx, setWeekIdx] = useState(0)
  const [selDay, setSelDay] = useState(null) // weekday 0-6 sélectionné
  const [showMeta, setShowMeta] = useState(!isEdit)

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
      // Grouper : même `group` que la cible, inséré juste après
      const gid = arr[tIdx].group || uuidv4()
      arr[tIdx] = { ...arr[tIdx], group: gid }
      arr.splice(tIdx + 1, 0, { ...moved, group: gid })
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
    arr[i] = { ...arr[i], group: gid }
    arr[i + 1] = { ...arr[i + 1], group: gid }
    updateDayBlocks(arr)
  }
  function ungroupSegment(gid) {
    updateDayBlocks(blocks.map(b => b.group === gid ? { ...b, group: null } : b))
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
            <div className="flex items-center justify-between mb-3">
              <input value={curDay?.label || DAYS_FR[selDay]} onChange={e => updateWeek(w => ({ ...w, days: w.days.map(d => d.weekday === selDay ? { ...d, label: e.target.value } : d) }))}
                className="font-black text-lg bg-transparent focus:outline-none" style={{ color: 'var(--text-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{blocks.length} exo{blocks.length > 1 ? 's' : ''}</span>
            </div>

            {blocks.length > 0 && (
              <p className="text-[11px] mb-2" style={{ color: 'var(--text-faint)' }}>
                💡 Glisse une carte <strong>sur</strong> une autre pour créer un <strong>superset/circuit</strong>, ou <strong>entre</strong> deux pour réordonner.
              </p>
            )}

            {/* La fresque */}
            <div ref={scrollRef} onScroll={animateFresco}
              className="flex gap-3 overflow-x-auto pb-4"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>

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
                      <button onClick={() => ungroupSegment(seg.group)} title="Dissocier"
                        className="flex-shrink-0 self-center text-[10px] font-bold px-2 py-1 rounded-lg"
                        style={{ background: 'var(--bg-card)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>⛓ Dissocier</button>
                    )}
                  </div>
                )
                return inner
              })}

              {/* Carte "ajouter" */}
              <button onClick={addExo}
                style={{ scrollSnapAlign: 'center', flexShrink: 0, width: 'min(60vw, 200px)', minHeight: 240, borderRadius: 20, border: '2px dashed var(--border)', background: 'transparent', color: 'var(--text-faint)', fontWeight: 800, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-faint)' }}>
                + Ajouter un exercice
              </button>
            </div>

            {blocks.length === 0 && (
              <p className="text-center text-xs mt-2" style={{ color: 'var(--text-faint)' }}>Ajoute ton premier exercice pour démarrer la fresque.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
