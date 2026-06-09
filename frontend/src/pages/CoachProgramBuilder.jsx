import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { v4 as uuidv4 } from 'uuid'
import AIProgramGenerator from '../components/AIProgramGenerator'

/* ── Constantes ─────────────────────────────────────────── */
const CATEGORIES = ['Force', 'Cardio', 'Mobilité', 'Nutrition', 'Combiné']
const LEVELS     = ['Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux']
const CAT_ICONS  = { Force:'🏋️', Nutrition:'🥗', Combiné:'⚡', Cardio:'🏃', Mobilité:'🧘' }
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
const DAYS_FR = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
const BLOCK_TYPES = [
  // Entraînement
  { type:'exercise', label:'Exercice',   icon:'💪', group:'training' },
  { type:'video',    label:'Vidéo',      icon:'🎬', group:'training' },
  { type:'note',     label:'Note',       icon:'📝', group:'training' },
  // Nutrition
  { type:'recipe',   label:'Recette',    icon:'🍽️', group:'nutrition' },
  { type:'ebook',    label:'eBook / PDF', icon:'📖', group:'nutrition' },
  { type:'tracker',  label:'Tracker macros', icon:'📊', group:'nutrition' },
]
const MACRO_COLORS = { calories:'#e8a020', protein:'#a03848', carbs:'#3a52a8', fat:'#1e6b2e' }

/* ── Utilitaires ─────────────────────────────────────────── */
function ytEmbed(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    let id = u.searchParams.get('v')
    if (!id && u.hostname==='youtu.be') id = u.pathname.slice(1)
    if (!id && u.pathname.includes('/shorts/')) id = u.pathname.split('/shorts/')[1]
    if (id) return `https://www.youtube.com/embed/${id}`
  } catch {}
  if (url.includes('vimeo.com')) {
    const m = url.match(/vimeo\.com\/(\d+)/)
    if (m) return `https://player.vimeo.com/video/${m[1]}`
  }
  return null
}
function fileToBase64(file) {
  return new Promise(res => { const r=new FileReader(); r.onload=e=>res(e.target.result); r.readAsDataURL(file) })
}

/* ── VideoInput ─────────────────────────────────────────── */
function VideoInput({ urlKey='url', localKey='localVideo', block, onChange, compact=false }) {
  const fileRef = useRef()
  const [tab, setTab] = useState(block[localKey] ? 'local' : 'url')
  const embedUrl = ytEmbed(block[urlKey]||'')
  const localSrc = block[localKey]||null
  const handleFile = async e => {
    const f=e.target.files[0]; if(!f) return
    onChange({...block,[localKey]:await fileToBase64(f),[urlKey]:''})
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {[{id:'url',label:'🔗 URL'},{id:'local',label:'📂 Fichier'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${compact?'py-0.5':''}`}
            style={{background:tab===t.id?'var(--accent)':'var(--bg-base)',color:tab===t.id?'#fff':'var(--text-muted)',border:'1px solid var(--border)'}}>
            {t.label}
          </button>
        ))}
        {(block[localKey]||block[urlKey]) && (
          <button onClick={()=>onChange({...block,[urlKey]:'', [localKey]:''})}
            className="ml-auto text-[10px]" style={{color:'#a03848'}}>✕ Retirer</button>
        )}
      </div>
      {tab==='url'
        ? <input value={block[urlKey]||''} onChange={e=>onChange({...block,[urlKey]:e.target.value,[localKey]:''})}
            placeholder="youtube.com/watch?v=... ou vimeo.com/..."
            className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none"
            style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-primary)'}} />
        : <div>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile}/>
            <button onClick={()=>fileRef.current?.click()}
              className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
              style={{border:'2px dashed var(--border)',background:'var(--bg-base)',color:'var(--text-muted)'}}>
              📁 {block[localKey]?'Changer la vidéo':'Choisir un fichier'}
            </button>
            {block[localKey] && <p className="text-[10px] mt-1 text-center" style={{color:'#27ae60'}}>✓ Vidéo chargée</p>}
          </div>
      }
      {localSrc && <video src={localSrc} controls className="w-full rounded-lg" style={{maxHeight:160}}/>}
      {!localSrc && embedUrl && (
        <div className="rounded-lg overflow-hidden" style={{aspectRatio:'16/9',background:'#000'}}>
          <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="preview"/>
        </div>
      )}
    </div>
  )
}

/* ── Boutons actions partagés ────────────────────────────── */
function CardActions({ open, onToggle, confirmDel, onAskDel, onConfirmDel, onCancelDel, accentColor }) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
      {/* Toggle réduire/déployer — icône seule */}
      <button onClick={onToggle} title={open?'Réduire':'Voir les détails'}
        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black transition flex-shrink-0"
        style={{background: open ? accentColor : 'var(--bg-card)', color: open ? '#fff' : 'var(--text-muted)', border:'1px solid var(--border)'}}>
        {open ? '▲' : '▼'}
      </button>
      {/* Supprimer */}
      {confirmDel ? (
        <>
          <button onClick={onConfirmDel}
            className="px-2 py-1 rounded-lg text-[10px] font-black flex-shrink-0"
            style={{background:'#a03848',color:'#fff'}}>Oui</button>
          <button onClick={onCancelDel}
            className="px-1.5 py-1 rounded-lg text-[10px] flex-shrink-0"
            style={{background:'var(--bg-card)',color:'var(--text-muted)'}}>Non</button>
        </>
      ) : (
        <button onClick={onAskDel} title="Supprimer"
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-sm transition"
          style={{background:'transparent',color:'var(--text-faint)'}}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(160,56,72,0.15)';e.currentTarget.style.color='#a03848'}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-faint)'}}>
          🗑
        </button>
      )}
    </div>
  )
}

/* ── MiniBlock : exercice dans une colonne jour ──────────── */
function ExerciseCard({ block, onChange, onRemove }) {
  const [open, setOpen] = useState(true)
  const [showVideo, setShowVideo] = useState(!!(block.url||block.localVideo))
  const [confirmDel, setConfirmDel] = useState(false)

  return (
    <div className="rounded-xl overflow-hidden mb-2 transition-all duration-200"
      style={{border:`1px solid ${open?'var(--accent)':'var(--border)'}`,background:'var(--bg-base)'}}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-2 py-2 min-w-0"
        style={{background:open?'rgba(125,45,56,0.06)':'transparent'}}>
        <span className="text-sm flex-shrink-0">💪</span>
        <input value={block.title||''} onChange={e=>onChange({...block,title:e.target.value})}
          placeholder="Nom de l'exercice"
          className="min-w-0 text-xs font-black focus:outline-none bg-transparent"
          style={{color:'var(--text-primary)', flex:'1 1 60px'}}/>
        {/* Résumé quand replié */}
        {!open && (block.sets||block.reps||block.rest) && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
            style={{background:'rgba(125,45,56,0.12)',color:'var(--accent)'}}>
            {[block.sets,block.reps,block.rest&&`⏱${block.rest}`].filter(Boolean).join(' · ')}
          </span>
        )}
        {!open && (block.url||block.localVideo) && (
          <span className="text-[10px] flex-shrink-0" style={{color:'#9b6fca'}}>🎬</span>
        )}
        <CardActions open={open} onToggle={()=>setOpen(o=>!o)} accentColor="var(--accent)"
          confirmDel={confirmDel} onAskDel={()=>setConfirmDel(true)}
          onConfirmDel={onRemove} onCancelDel={()=>setConfirmDel(false)}/>
      </div>

      {/* ── Détails ── */}
      {open && (
        <div className="px-2 pb-3 space-y-2 border-t" style={{borderColor:'var(--border)'}}>
          <div className="grid grid-cols-2 gap-1.5 pt-2">
            {[
              {key:'sets',ph:'Séries (ex: 4)'},
              {key:'reps',ph:'Reps (ex: 8-10)'},
              {key:'rest',ph:'Repos (ex: 2min)'},
              {key:'rpe', ph:'Intensité (RPE)'},
            ].map(({key,ph})=>(
              <input key={key} value={block[key]||''} onChange={e=>onChange({...block,[key]:e.target.value})}
                placeholder={ph}
                className="w-full px-2 py-1.5 rounded-lg text-xs focus:outline-none min-w-0"
                style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
            ))}
          </div>
          <textarea value={block.notes||''} onChange={e=>onChange({...block,notes:e.target.value})}
            rows={2} placeholder="Notes coaching..."
            className="w-full px-2 py-1.5 rounded-lg text-xs resize-none focus:outline-none"
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
          {!showVideo
            ? <button onClick={()=>setShowVideo(true)}
                className="w-full py-2 rounded-lg text-xs font-black flex items-center justify-center gap-2"
                style={{background:'linear-gradient(135deg,#2d1a4a,#5a2d82)',color:'#d4b8f0',border:'1px solid #7b3fa8'}}>
                🎬 Ajouter une vidéo de démo
              </button>
            : <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold" style={{color:'var(--text-muted)'}}>VIDÉO DE DÉMO</span>
                  <button onClick={()=>{setShowVideo(false);onChange({...block,url:'',localVideo:''})}}
                    className="text-[10px]" style={{color:'#a03848'}}>Masquer</button>
                </div>
                <VideoInput block={block} onChange={onChange} compact/>
              </div>
          }
        </div>
      )}
    </div>
  )
}

/* ── VideoCard ───────────────────────────────────────────── */
function VideoCard({ block, onChange, onRemove }) {
  const [open, setOpen] = useState(true)
  const [confirmDel, setConfirmDel] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden mb-2"
      style={{border:`1px solid ${open?'rgba(90,45,130,0.5)':'var(--border)'}`,background:'var(--bg-base)'}}>
      <div className="flex items-center gap-2 px-2 py-2 min-w-0"
        style={{background:open?'rgba(90,45,130,0.06)':'transparent'}}>
        <span className="text-sm flex-shrink-0">🎬</span>
        <input value={block.title||''} onChange={e=>onChange({...block,title:e.target.value})}
          placeholder="Titre de la vidéo"
          className="text-xs font-black focus:outline-none bg-transparent min-w-0"
          style={{color:'var(--text-primary)',flex:'1 1 60px'}}/>
        {!open && (block.url||block.localVideo) && (
          <span className="text-[10px] flex-shrink-0" style={{color:'#9b6fca'}}>
            {block.localVideo?'📂':'🔗'}
          </span>
        )}
        <CardActions open={open} onToggle={()=>setOpen(o=>!o)} accentColor="#5a2d82"
          confirmDel={confirmDel} onAskDel={()=>setConfirmDel(true)}
          onConfirmDel={onRemove} onCancelDel={()=>setConfirmDel(false)}/>
      </div>
      {open && (
        <div className="px-2 pb-3 border-t" style={{borderColor:'var(--border)'}}>
          <div className="pt-2"><VideoInput block={block} onChange={onChange} compact/></div>
          <textarea value={block.notes||''} onChange={e=>onChange({...block,notes:e.target.value})}
            rows={2} placeholder="Notes sur la vidéo..."
            className="w-full mt-2 px-2 py-1.5 rounded-lg text-xs resize-none focus:outline-none"
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
        </div>
      )}
    </div>
  )
}

/* ── NoteCard ────────────────────────────────────────────── */
function NoteCard({ block, onChange, onRemove }) {
  const [open, setOpen] = useState(true)
  const [confirmDel, setConfirmDel] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden mb-2"
      style={{border:`1px solid ${open?'rgba(30,107,46,0.5)':'var(--border)'}`,background:'var(--bg-base)'}}>
      <div className="flex items-center gap-2 px-2 py-2 min-w-0"
        style={{background:open?'rgba(30,107,46,0.06)':'transparent'}}>
        <span className="text-sm flex-shrink-0">📝</span>
        <input value={block.title||''} onChange={e=>onChange({...block,title:e.target.value})}
          placeholder="Titre de la note"
          className="text-xs font-black focus:outline-none bg-transparent min-w-0"
          style={{color:'var(--text-primary)',flex:'1 1 60px'}}/>
        {!open && block.content && (
          <span className="text-[10px] truncate flex-shrink min-w-0"
            style={{color:'var(--text-faint)',maxWidth:80}}>
            {block.content.slice(0,30)}{block.content.length>30?'…':''}
          </span>
        )}
        <CardActions open={open} onToggle={()=>setOpen(o=>!o)} accentColor="#1e6b2e"
          confirmDel={confirmDel} onAskDel={()=>setConfirmDel(true)}
          onConfirmDel={onRemove} onCancelDel={()=>setConfirmDel(false)}/>
      </div>
      {open && (
        <div className="px-2 pb-3 border-t" style={{borderColor:'var(--border)'}}>
          <textarea value={block.content||''} onChange={e=>onChange({...block,content:e.target.value})}
            rows={3} placeholder="Instructions, conseils..."
            className="w-full mt-2 px-2 py-1.5 rounded-lg text-xs resize-none focus:outline-none"
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
        </div>
      )}
    </div>
  )
}

function DayBlock({ block, onChange, onRemove }) {
  if (block.type==='exercise') return <ExerciseCard block={block} onChange={onChange} onRemove={onRemove}/>
  if (block.type==='video')    return <VideoCard    block={block} onChange={onChange} onRemove={onRemove}/>
  if (block.type==='note')     return <NoteCard     block={block} onChange={onChange} onRemove={onRemove}/>
  if (block.type==='recipe')   return <RecipeCard   block={block} onChange={onChange} onRemove={onRemove}/>
  if (block.type==='ebook')    return <EbookCard    block={block} onChange={onChange} onRemove={onRemove}/>
  if (block.type==='tracker')  return <TrackerCard  block={block} onChange={onChange} onRemove={onRemove}/>
  return null
}

/* ══════════════════════════════════════════════════════════
   BLOCS NUTRITION
══════════════════════════════════════════════════════════ */

/* ── IngredientRow : simplifié — nom + grammes ───────────── */
function IngredientRow({ ing, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-1.5">
      <input value={ing.name} onChange={e=>onChange('name',e.target.value)}
        placeholder="Ingrédient"
        className="flex-1 px-2 py-1 rounded text-[10px] focus:outline-none min-w-0"
        style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <input type="number" min="0" value={ing.qty} onChange={e=>onChange('qty',e.target.value)}
          placeholder="0"
          className="px-1.5 py-1 rounded-l text-[10px] focus:outline-none text-right"
          style={{width:44,background:'var(--bg-card)',border:'1px solid var(--border)',borderRight:'none',color:'var(--text-primary)'}}/>
        <span className="px-1.5 py-1 rounded-r text-[10px] font-bold flex-shrink-0"
          style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-faint)'}}>g</span>
      </div>
      <button onClick={onRemove}
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px]"
        style={{background:'rgba(160,56,72,0.12)',color:'#a03848'}}>✕</button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   NUTRITION DAY — scan code-barres + repas par sous-catégorie
══════════════════════════════════════════════════════════ */

const MEAL_PRESETS = [
  { name:'Petit-déjeuner',    icon:'🌅' },
  { name:'Déjeuner',          icon:'☀️' },
  { name:'Collation',         icon:'🍎' },
  { name:'Dîner',             icon:'🌙' },
  { name:'Pré-entraînement',  icon:'⚡' },
  { name:'Post-entraînement', icon:'💪' },
]

// Fetch Open Food Facts par code-barres (EAN)
async function fetchFoodByBarcode(barcode) {
  try {
    const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await res.json()
    if (data.status !== 1) return null
    const n = data.product.nutriments || {}
    return {
      name:     data.product.product_name || data.product.product_name_fr || '',
      calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
      protein:  Math.round((n.proteins_100g   || 0) * 10) / 10,
      carbs:    Math.round((n.carbohydrates_100g || 0) * 10) / 10,
      fat:      Math.round((n.fat_100g         || 0) * 10) / 10,
    }
  } catch { return null }
}

/* ── FoodItemRow : aliment + scan code-barres ──────────── */
function FoodItemRow({ item, onChange, onRemove }) {
  const [scanning,  setScanning]  = useState(false)
  const [barcodeInput, setBarcodeInput] = useState(false)
  const [barcodeVal, setBarcodeVal]     = useState('')
  const [scanError, setScanError]       = useState('')
  const [expanded,  setExpanded]        = useState(false)
  const cameraRef = useRef()

  // Calcul calories à partir du grammage saisi
  const calcCal = () => {
    if (!item.qty || !item.calories) return ''
    return Math.round(Number(item.calories) * Number(item.qty) / 100)
  }

  const handleCameraCapture = async e => {
    const file = e.target.files[0]; if (!file) return
    setScanning(true); setScanError('')
    try {
      if ('BarcodeDetector' in window) {
        const bmp      = await createImageBitmap(file)
        const detector = new window.BarcodeDetector({ formats:['ean_13','ean_8','upc_a','upc_e','code_128'] })
        const codes    = await detector.detect(bmp)
        if (codes.length === 0) { setScanError('Code-barres non détecté'); setScanning(false); return }
        const food = await fetchFoodByBarcode(codes[0].rawValue)
        if (food) onChange({...item, name:food.name||item.name, calories:food.calories, protein:food.protein, carbs:food.carbs, fat:food.fat })
        else setScanError('Produit introuvable')
      } else {
        // BarcodeDetector non dispo → demande saisie manuelle
        setBarcodeInput(true)
      }
    } catch { setScanError('Erreur de lecture') }
    setScanning(false)
  }

  const handleManualBarcode = async () => {
    if (!barcodeVal.trim()) return
    setScanning(true); setScanError('')
    const food = await fetchFoodByBarcode(barcodeVal.trim())
    setScanning(false)
    if (food) { onChange({...item, name:food.name||item.name, calories:food.calories, protein:food.protein, carbs:food.carbs, fat:food.fat}); setBarcodeInput(false); setBarcodeVal('') }
    else setScanError('Produit introuvable')
  }

  return (
    <div className="rounded-lg mb-1 overflow-hidden" style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
      {/* Ligne principale */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        {/* Nom */}
        <input value={item.name} onChange={e=>onChange({...item,name:e.target.value})}
          placeholder="Aliment..."
          className="flex-1 text-[11px] focus:outline-none bg-transparent min-w-0 font-medium"
          style={{color:'var(--text-primary)'}}/>
        {/* Quantité g */}
        <div className="flex items-center flex-shrink-0">
          <input type="number" min="0" value={item.qty} onChange={e=>onChange({...item,qty:e.target.value})}
            placeholder="0"
            className="text-[11px] px-1.5 py-0.5 rounded-l focus:outline-none text-right font-bold"
            style={{width:42,background:'var(--bg-base)',border:'1px solid var(--border)',borderRight:'none',color:'var(--text-primary)'}}/>
          <span className="text-[10px] px-1 py-0.5 rounded-r flex-shrink-0 font-bold"
            style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-faint)'}}>g</span>
        </div>
        {/* Calories calculées */}
        {calcCal() && (
          <span className="text-[10px] font-black flex-shrink-0" style={{color:'#e8a020'}}>
            {calcCal()} kcal
          </span>
        )}
        {/* Bouton macros expand */}
        <button onClick={()=>setExpanded(o=>!o)} title="Détails nutritionnels"
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] transition"
          style={{background:expanded?'rgba(58,82,168,0.15)':'transparent',color:expanded?'#6b82d4':'var(--text-faint)'}}>
          {expanded?'▴':'▾'}
        </button>
        {/* Scan code-barres */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={handleCameraCapture}/>
        <button onClick={()=>cameraRef.current?.click()} disabled={scanning} title="Scanner code-barres"
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[11px] transition"
          style={{background:'rgba(58,82,168,0.12)',color:'#3a52a8'}}>
          {scanning ? '⏳' : '📷'}
        </button>
        {/* Supprimer */}
        <button onClick={onRemove}
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px]"
          style={{background:'rgba(160,56,72,0.1)',color:'#a03848'}}>✕</button>
      </div>

      {/* Macros expand */}
      {expanded && (
        <div className="px-2 pb-2 grid grid-cols-4 gap-1" style={{borderTop:'1px solid var(--border)'}}>
          {[
            {k:'calories',label:'kcal/100g',color:'#e8a020'},
            {k:'protein', label:'Prot. g/100g', color:MACRO_COLORS.protein},
            {k:'carbs',   label:'Gluc. g/100g', color:MACRO_COLORS.carbs},
            {k:'fat',     label:'Lip. g/100g',  color:MACRO_COLORS.fat},
          ].map(({k,label,color})=>(
            <div key={k} className="pt-1.5">
              <p className="text-[9px] font-bold mb-0.5" style={{color}}>{label}</p>
              <input type="number" min="0" value={item[k]||''} onChange={e=>onChange({...item,[k]:e.target.value})}
                placeholder="0"
                className="w-full px-1.5 py-1 rounded text-[10px] focus:outline-none font-bold"
                style={{background:`${color}10`,border:`1px solid ${color}30`,color}}/>
            </div>
          ))}
        </div>
      )}

      {/* Saisie code-barres manuelle */}
      {barcodeInput && (
        <div className="px-2 pb-2 flex gap-1.5 items-center" style={{borderTop:'1px solid var(--border)'}}>
          <span className="text-[10px] flex-shrink-0" style={{color:'var(--text-faint)'}}>EAN :</span>
          <input value={barcodeVal} onChange={e=>setBarcodeVal(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleManualBarcode()}
            placeholder="Ex : 3017620422003"
            className="flex-1 px-2 py-1 rounded text-[10px] font-mono focus:outline-none"
            style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-primary)'}}
            autoFocus/>
          <button onClick={handleManualBarcode} disabled={scanning}
            className="px-2 py-1 rounded text-[10px] font-bold"
            style={{background:'#3a52a8',color:'#fff'}}>OK</button>
          <button onClick={()=>{setBarcodeInput(false);setScanError('')}}
            className="px-2 py-1 rounded text-[10px]"
            style={{background:'var(--bg-base)',color:'var(--text-faint)'}}>✕</button>
        </div>
      )}
      {scanError && (
        <p className="px-2 pb-1.5 text-[10px]" style={{color:'#a03848'}}>{scanError}</p>
      )}
    </div>
  )
}

/* ── MealSection : un repas (petit-dej, dej…) ─────────── */
function MealSection({ meal, onChange, onRemove }) {
  const [collapsed, setCollapsed] = useState(false)
  const items = meal.items || []

  const addItem = () => onChange({...meal, items:[...items,{id:uuidv4(),name:'',qty:'',calories:'',protein:'',carbs:'',fat:''}]})
  const updateItem = (i,upd) => { const arr=[...items]; arr[i]=upd; onChange({...meal,items:arr}) }
  const removeItem = (i)     => onChange({...meal, items:items.filter((_,idx)=>idx!==i)})

  // Totaux du repas
  const mealCal = items.reduce((s,it)=> s + (it.qty&&it.calories ? Math.round(Number(it.calories)*Number(it.qty)/100) : 0), 0)

  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{border:'1px solid rgba(39,174,96,0.25)',background:'var(--bg-base)'}}>
      {/* Header repas */}
      <div className="flex items-center gap-1.5 px-2 py-1.5" style={{background:'rgba(39,174,96,0.06)'}}>
        <span className="text-sm flex-shrink-0">{meal.icon||'🍽️'}</span>
        <input value={meal.name} onChange={e=>onChange({...meal,name:e.target.value})}
          className="flex-1 text-[11px] font-black focus:outline-none bg-transparent min-w-0"
          style={{color:'var(--text-primary)'}}/>
        {mealCal > 0 && (
          <span className="text-[10px] font-black flex-shrink-0 px-1.5 py-0.5 rounded"
            style={{background:'rgba(232,160,32,0.15)',color:'#e8a020'}}>{mealCal} kcal</span>
        )}
        <button onClick={()=>setCollapsed(o=>!o)}
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px]"
          style={{color:'var(--text-faint)'}}>{collapsed?'▼':'▲'}</button>
        <button onClick={onRemove}
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px]"
          style={{background:'rgba(160,56,72,0.1)',color:'#a03848'}}>✕</button>
      </div>
      {/* Aliments */}
      {!collapsed && (
        <div className="px-2 pb-2 pt-1.5">
          {items.map((it,i)=>(
            <FoodItemRow key={it.id} item={it}
              onChange={upd=>updateItem(i,upd)}
              onRemove={()=>removeItem(i)}/>
          ))}
          <button onClick={addItem}
            className="w-full py-1.5 rounded-lg text-[10px] font-bold mt-0.5 transition"
            style={{border:'1px dashed rgba(39,174,96,0.3)',color:'#27ae60',background:'transparent'}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(39,174,96,0.06)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
            + Ajouter un aliment
          </button>
        </div>
      )}
    </div>
  )
}

/* ── NutritionDayColumn : colonne jour nutrition ───────── */
function NutritionDayColumn({ day, onUpdateDay, onRemoveDay, onDuplicateDay, onMoveDay, isFirst, isLast }) {
  const [showMealPicker, setShowMealPicker] = useState(false)
  const [customMeal,     setCustomMeal]     = useState('')
  const [confirmDel,     setConfirmDel]     = useState(false)
  const [width, setWidth] = useState(280)
  const dragging = useRef(false); const startX = useRef(0); const startW = useRef(0)

  const meals = day.meals || []

  const onMouseDown = e => {
    e.preventDefault(); dragging.current=true; startX.current=e.clientX; startW.current=width
    const onMove = ev => { if(!dragging.current)return; setWidth(Math.max(230,Math.min(600,startW.current+ev.clientX-startX.current))) }
    const onUp   = ()  => { dragging.current=false; window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp) }
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp)
  }

  const addMeal = (name, icon) => {
    onUpdateDay({...day, meals:[...meals,{id:uuidv4(),name,icon,items:[]}]})
    setShowMealPicker(false); setCustomMeal('')
  }
  const updateMeal = (i,m) => { const arr=[...meals]; arr[i]=m; onUpdateDay({...day,meals:arr}) }
  const removeMeal = (i)   => onUpdateDay({...day, meals:meals.filter((_,idx)=>idx!==i)})

  // Totaux jour (calories calculées)
  const dayTotals = meals.reduce((acc,meal)=>{
    ;(meal.items||[]).forEach(it=>{
      const factor = it.qty ? Number(it.qty)/100 : 0
      acc.calories += Math.round((Number(it.calories)||0) * factor)
      acc.protein  += Math.round((Number(it.protein) ||0) * factor * 10)/10
      acc.carbs    += Math.round((Number(it.carbs)   ||0) * factor * 10)/10
      acc.fat      += Math.round((Number(it.fat)     ||0) * factor * 10)/10
    })
    return acc
  }, {calories:0,protein:0,carbs:0,fat:0})

  return (
    <div className="flex-shrink-0 flex relative" style={{width}}>
      <div className="flex flex-col rounded-2xl overflow-hidden flex-1"
        style={{background:'var(--bg-card)',border:'1px solid rgba(39,174,96,0.3)'}}>

        {/* Header */}
        <div className="px-2 py-2" style={{borderBottom:'1px solid rgba(39,174,96,0.15)',background:'rgba(39,174,96,0.04)'}}>
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[10px] flex-shrink-0">🥗</span>
            <input value={day.label||''} onChange={e=>onUpdateDay({...day,label:e.target.value})}
              className="text-xs font-black focus:outline-none bg-transparent flex-1 min-w-0"
              style={{color:'var(--text-primary)'}}/>
            {confirmDel ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={onRemoveDay} className="px-1.5 py-0.5 rounded text-[10px] font-black" style={{background:'#a03848',color:'#fff'}}>Oui</button>
                <button onClick={()=>setConfirmDel(false)} className="px-1.5 py-0.5 rounded text-[10px]" style={{background:'var(--bg-base)',color:'var(--text-muted)'}}>Non</button>
              </div>
            ) : (
              <button onClick={()=>setConfirmDel(true)}
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs"
                style={{background:'rgba(160,56,72,0.12)',color:'#a03848'}}>✕</button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={()=>onMoveDay(-1)} disabled={isFirst}
              className="flex-1 py-0.5 rounded text-[10px] font-bold transition disabled:opacity-20"
              style={{background:'var(--bg-base)',color:'var(--text-muted)',border:'1px solid var(--border)'}}>←</button>
            <button onClick={onDuplicateDay}
              className="flex-1 py-0.5 rounded text-[10px] font-bold transition"
              style={{background:'var(--bg-base)',color:'var(--text-muted)',border:'1px solid var(--border)'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#27ae60';e.currentTarget.style.color='#27ae60'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-muted)'}}>⧉ Copier</button>
            <button onClick={()=>onMoveDay(1)} disabled={isLast}
              className="flex-1 py-0.5 rounded text-[10px] font-bold transition disabled:opacity-20"
              style={{background:'var(--bg-base)',color:'var(--text-muted)',border:'1px solid var(--border)'}}>→</button>
          </div>
        </div>

        {/* Repas */}
        <div className="flex-1 p-2 overflow-y-auto" style={{minHeight:120,maxHeight:600}}>
          {meals.map((meal,i)=>(
            <MealSection key={meal.id} meal={meal}
              onChange={m=>updateMeal(i,m)}
              onRemove={()=>removeMeal(i)}/>
          ))}

          {/* Picker repas */}
          {showMealPicker ? (
            <div className="rounded-xl p-2 mt-1" style={{background:'var(--bg-base)',border:'1px solid #27ae60'}}>
              <p className="text-[9px] font-black tracking-widest uppercase px-1 pb-1" style={{color:'#27ae60'}}>Ajouter un repas</p>
              {MEAL_PRESETS.filter(p=>!meals.find(m=>m.name===p.name)).map(p=>(
                <button key={p.name} onClick={()=>addMeal(p.name,p.icon)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold text-left transition mb-0.5"
                  style={{background:'var(--bg-card)',color:'var(--text-primary)'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#27ae60';e.currentTarget.style.color='#fff'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='var(--bg-card)';e.currentTarget.style.color='var(--text-primary)'}}>
                  <span>{p.icon}</span>{p.name}
                </button>
              ))}
              <div className="flex gap-1 mt-1">
                <input value={customMeal} onChange={e=>setCustomMeal(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&customMeal.trim()&&addMeal(customMeal.trim(),'🍽️')}
                  placeholder="Personnalisé…"
                  className="flex-1 px-2 py-1 rounded text-[10px] focus:outline-none"
                  style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
                <button onClick={()=>customMeal.trim()&&addMeal(customMeal.trim(),'🍽️')}
                  className="px-2 py-1 rounded text-[10px] font-bold"
                  style={{background:'#27ae60',color:'#fff'}}>+</button>
              </div>
              <button onClick={()=>setShowMealPicker(false)} className="w-full text-[10px] py-1 text-center mt-1"
                style={{color:'var(--text-faint)'}}>Annuler</button>
            </div>
          ) : (
            <button onClick={()=>setShowMealPicker(true)}
              className="w-full py-2 rounded-xl text-xs font-bold transition mt-1"
              style={{border:'1.5px dashed rgba(39,174,96,0.3)',color:'#27ae60',background:'transparent'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#27ae60';e.currentTarget.style.background='rgba(39,174,96,0.04)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(39,174,96,0.3)';e.currentTarget.style.background='transparent'}}>
              + Ajouter un repas
            </button>
          )}
        </div>

        {/* Footer — totaux automatiques */}
        {(dayTotals.calories>0||dayTotals.protein>0) && (
          <div className="px-3 py-2" style={{borderTop:'1px solid rgba(39,174,96,0.15)',background:'rgba(39,174,96,0.04)'}}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black tracking-widest uppercase" style={{color:'#27ae60'}}>Total du jour</span>
              <span className="text-xs font-black" style={{color:'#e8a020'}}>{dayTotals.calories} kcal</span>
            </div>
            <div className="flex gap-2 text-[10px] font-bold">
              <span style={{color:MACRO_COLORS.protein}}>P {dayTotals.protein}g</span>
              <span style={{color:MACRO_COLORS.carbs}}>G {dayTotals.carbs}g</span>
              <span style={{color:MACRO_COLORS.fat}}>L {dayTotals.fat}g</span>
            </div>
            {dayTotals.calories>0 && (() => {
              const p=dayTotals.protein*4; const c=dayTotals.carbs*4; const f=dayTotals.fat*9
              const tot=p+c+f||1
              return (
                <div className="flex rounded-full overflow-hidden h-1.5 mt-1.5">
                  <div style={{width:`${p/tot*100}%`,background:MACRO_COLORS.protein}}/>
                  <div style={{width:`${c/tot*100}%`,background:MACRO_COLORS.carbs}}/>
                  <div style={{width:`${f/tot*100}%`,background:MACRO_COLORS.fat}}/>
                </div>
              )
            })()}
            <p className="text-[9px] mt-1" style={{color:'var(--text-faint)'}}>{meals.length} repas · {meals.reduce((s,m)=>s+(m.items||[]).length,0)} aliments</p>
          </div>
        )}
        {!(dayTotals.calories>0||dayTotals.protein>0) && (
          <div className="px-3 py-1.5 text-[10px] flex items-center justify-between"
            style={{borderTop:'1px solid rgba(39,174,96,0.1)',color:'var(--text-faint)'}}>
            <span>{meals.length} repas</span>
            <span>{width}px</span>
          </div>
        )}
      </div>

      {/* Poignée de redimensionnement */}
      <div onMouseDown={onMouseDown}
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center cursor-col-resize group"
        style={{width:12,zIndex:10}}>
        <div className="rounded-full transition-all duration-150 group-hover:opacity-100 opacity-0"
          style={{width:4,height:40,background:'#27ae60'}}/>
      </div>
    </div>
  )
}

/* ── RecipeCard ─────────────────────────────────────────── */
function RecipeCard({ block, onChange, onRemove }) {
  const [open, setOpen] = useState(true)
  const [confirmDel, setConfirmDel] = useState(false)
  const imgRef = useRef()

  const addIngredient = () => onChange({...block,
    ingredients:[...(block.ingredients||[]), {id:uuidv4(),name:'',qty:'',unit:'g',photo:''}]})
  const updateIngredient = (i,field,val) => {
    const ingredients=[...(block.ingredients||[])]; ingredients[i]={...ingredients[i],[field]:val}
    onChange({...block,ingredients})
  }
  const removeIngredient = (i) => onChange({...block,
    ingredients:(block.ingredients||[]).filter((_,idx)=>idx!==i)})
  const handleImg = async e => {
    const f=e.target.files[0]; if(!f) return
    onChange({...block, coverImage: await fileToBase64(f)})
  }

  return (
    <div className="rounded-xl overflow-hidden mb-2"
      style={{border:`1px solid ${open?'rgba(39,174,96,0.6)':'var(--border)'}`,background:'var(--bg-base)'}}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-2 min-w-0"
        style={{background:open?'rgba(39,174,96,0.08)':'transparent'}}>
        <span className="text-sm flex-shrink-0">🍽️</span>
        <input value={block.title||''} onChange={e=>onChange({...block,title:e.target.value})}
          placeholder="Nom de la recette"
          className="text-xs font-black focus:outline-none bg-transparent min-w-0"
          style={{color:'var(--text-primary)',flex:'1 1 60px'}}/>
        {!open && block.macros?.calories && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0"
            style={{background:'rgba(232,160,32,0.15)',color:'#e8a020'}}>
            {block.macros.calories} kcal
          </span>
        )}
        <CardActions open={open} onToggle={()=>setOpen(o=>!o)} accentColor="#27ae60"
          confirmDel={confirmDel} onAskDel={()=>setConfirmDel(true)}
          onConfirmDel={onRemove} onCancelDel={()=>setConfirmDel(false)}/>
      </div>

      {open && (
        <div className="px-2 pb-3 border-t space-y-3" style={{borderColor:'rgba(39,174,96,0.2)'}}>
          {/* Photo + infos rapides */}
          <div className="flex gap-2 pt-2">
            <div className="flex-shrink-0">
              <input ref={imgRef} type="file" accept="image/*" className="hidden"
                onChange={handleImg}/>
              <button onClick={()=>imgRef.current?.click()}
                className="rounded-lg overflow-hidden flex items-center justify-center transition"
                style={{width:64,height:64,background:'var(--bg-card)',border:'2px dashed var(--border)'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#27ae60'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                {block.coverImage
                  ? <img src={block.coverImage} alt="" className="w-full h-full object-cover"/>
                  : <span className="text-xl">📷</span>}
              </button>
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="grid grid-cols-2 gap-1">
                {[{k:'servings',ph:'Portions',icon:'🍴'},{k:'prepTime',ph:'Prep',icon:'⏱'},{k:'cookTime',ph:'Cuisson',icon:'🔥'},{k:'difficulty',ph:'Difficulté',icon:'⭐'}].map(({k,ph,icon})=>(
                  <div key={k} className="flex items-center gap-1">
                    <span className="text-[10px] flex-shrink-0">{icon}</span>
                    <input value={block[k]||''} onChange={e=>onChange({...block,[k]:e.target.value})}
                      placeholder={ph}
                      className="w-full px-1.5 py-1 rounded text-[10px] focus:outline-none min-w-0"
                      style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Macros */}
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase mb-1.5" style={{color:'#27ae60'}}>Valeurs nutritionnelles</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                {k:'calories',label:'Calories (kcal)',color:MACRO_COLORS.calories},
                {k:'protein', label:'Protéines (g)',  color:MACRO_COLORS.protein},
                {k:'carbs',   label:'Glucides (g)',   color:MACRO_COLORS.carbs},
                {k:'fat',     label:'Lipides (g)',    color:MACRO_COLORS.fat},
              ].map(({k,label,color})=>(
                <div key={k} className="relative">
                  <input type="number" min="0"
                    value={block.macros?.[k]||''} onChange={e=>onChange({...block,macros:{...(block.macros||{}),[k]:e.target.value}})}
                    placeholder={label}
                    className="w-full px-2 py-1.5 rounded-lg text-[10px] focus:outline-none pl-2"
                    style={{background:`${color}12`,border:`1px solid ${color}40`,color:'var(--text-primary)'}}/>
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg" style={{background:color}}/>
                </div>
              ))}
            </div>
            {/* Barre visuelle macros */}
            {(block.macros?.protein||block.macros?.carbs||block.macros?.fat) && (() => {
              const p=Number(block.macros?.protein||0)*4
              const c=Number(block.macros?.carbs||0)*4
              const f=Number(block.macros?.fat||0)*9
              const total=p+c+f||1
              return (
                <div className="flex rounded-full overflow-hidden h-2 mt-2">
                  <div style={{width:`${p/total*100}%`,background:MACRO_COLORS.protein}} title={`Protéines ${Math.round(p/total*100)}%`}/>
                  <div style={{width:`${c/total*100}%`,background:MACRO_COLORS.carbs}} title={`Glucides ${Math.round(c/total*100)}%`}/>
                  <div style={{width:`${f/total*100}%`,background:MACRO_COLORS.fat}} title={`Lipides ${Math.round(f/total*100)}%`}/>
                </div>
              )
            })()}
          </div>

          {/* Ingrédients */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-black tracking-widest uppercase" style={{color:'#27ae60'}}>Ingrédients</p>
              <button onClick={addIngredient}
                className="text-[10px] px-2 py-0.5 rounded font-bold"
                style={{background:'rgba(39,174,96,0.15)',color:'#27ae60'}}>+ Ajouter</button>
            </div>
            <div className="space-y-1">
              {(block.ingredients||[]).map((ing,i)=>(
                <IngredientRow key={ing.id} ing={ing}
                  onChange={(field,val)=>updateIngredient(i,field,val)}
                  onRemove={()=>removeIngredient(i)}/>
              ))}
              {(!block.ingredients||block.ingredients.length===0) && (
                <p className="text-[10px] text-center py-2" style={{color:'var(--text-faint)'}}>Aucun ingrédient · La photo s'ajoute automatiquement 🪄</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase mb-1.5" style={{color:'#27ae60'}}>Instructions</p>
            <textarea value={block.instructions||''} onChange={e=>onChange({...block,instructions:e.target.value})}
              rows={3} placeholder="Étapes de préparation..."
              className="w-full px-2 py-1.5 rounded-lg text-xs resize-none focus:outline-none"
              style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── EbookCard ──────────────────────────────────────────── */
function EbookCard({ block, onChange, onRemove }) {
  const [open, setOpen] = useState(true)
  const [confirmDel, setConfirmDel] = useState(false)
  const fileRef  = useRef()
  const coverRef = useRef()

  const handleFile = async e => {
    const f=e.target.files[0]; if(!f) return
    const b64 = await fileToBase64(f)
    onChange({...block, fileData:b64, fileName:f.name, fileSize:Math.round(f.size/1024)+'ko', fileUrl:''})
  }
  const handleCover = async e => {
    const f=e.target.files[0]; if(!f) return
    onChange({...block, coverImage: await fileToBase64(f)})
  }

  const openDocument = () => {
    if (block.fileUrl) {
      window.open(block.fileUrl, '_blank', 'noopener')
      return
    }
    if (block.fileData) {
      // Convertir base64 → blob → URL temporaire
      try {
        const base64 = block.fileData.split(',')[1] || block.fileData
        const binary  = atob(base64)
        const bytes   = new Uint8Array(binary.length)
        for (let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i)
        const mime = block.fileName?.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'
        const blob = new Blob([bytes], {type: mime})
        const url  = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener')
        setTimeout(()=>URL.revokeObjectURL(url), 60000)
      } catch(e) { console.error('Impossible d\'ouvrir le fichier', e) }
    }
  }

  const hasFile = !!(block.fileData || block.fileUrl)

  return (
    <div className="rounded-xl overflow-hidden mb-2"
      style={{border:`1px solid ${open?'rgba(212,175,55,0.6)':'var(--border)'}`,background:'var(--bg-base)'}}>
      <div className="flex items-center gap-2 px-2 py-2 min-w-0"
        style={{background:open?'rgba(212,175,55,0.06)':'transparent'}}>
        <span className="text-sm flex-shrink-0">📖</span>
        <input value={block.title||''} onChange={e=>onChange({...block,title:e.target.value})}
          placeholder="Titre du document"
          className="text-xs font-black focus:outline-none bg-transparent min-w-0"
          style={{color:'var(--text-primary)',flex:'1 1 60px'}}/>
        {!open && hasFile && (
          <button onClick={e=>{e.stopPropagation();openDocument()}}
            className="text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 flex items-center gap-1"
            style={{background:'rgba(212,175,55,0.15)',color:'#d4af37',border:'1px solid rgba(212,175,55,0.3)'}}>
            📂 Ouvrir
          </button>
        )}
        <CardActions open={open} onToggle={()=>setOpen(o=>!o)} accentColor="#c9a020"
          confirmDel={confirmDel} onAskDel={()=>setConfirmDel(true)}
          onConfirmDel={onRemove} onCancelDel={()=>setConfirmDel(false)}/>
      </div>

      {open && (
        <div className="px-2 pb-3 border-t space-y-3" style={{borderColor:'rgba(212,175,55,0.2)'}}>
          <div className="pt-2 grid grid-cols-2 gap-2">
            {/* Couverture */}
            <div>
              <p className="text-[10px] font-bold uppercase mb-1" style={{color:'#d4af37'}}>Couverture</p>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCover}/>
              <button onClick={()=>coverRef.current?.click()}
                className="w-full rounded-xl overflow-hidden flex items-center justify-center"
                style={{height:80,background:'var(--bg-card)',border:'2px dashed rgba(212,175,55,0.3)'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#d4af37'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(212,175,55,0.3)'}>
                {block.coverImage
                  ? <img src={block.coverImage} alt="" className="w-full h-full object-cover"/>
                  : <div className="text-center"><div className="text-2xl">📗</div><p className="text-[9px] mt-1" style={{color:'#d4af37'}}>Importer</p></div>}
              </button>
            </div>
            {/* Infos */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase mb-1" style={{color:'#d4af37'}}>Détails</p>
              {[{k:'author',ph:'Auteur'},{k:'pages',ph:'Nb de pages'},{k:'language',ph:'Langue'}].map(({k,ph})=>(
                <input key={k} value={block[k]||''} onChange={e=>onChange({...block,[k]:e.target.value})}
                  placeholder={ph}
                  className="w-full px-2 py-1 rounded text-[10px] focus:outline-none"
                  style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
              ))}
            </div>
          </div>

          <textarea value={block.description||''} onChange={e=>onChange({...block,description:e.target.value})}
            rows={2} placeholder="Description du contenu..."
            className="w-full px-2 py-1.5 rounded-lg text-xs resize-none focus:outline-none"
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>

          {/* Upload PDF */}
          <div>
            <p className="text-[10px] font-bold uppercase mb-1.5" style={{color:'#d4af37'}}>Fichier</p>
            <div className="flex gap-2">
              {[{id:'local',label:'📁 Importer PDF'},{id:'url',label:'🔗 URL externe'}].map(t=>(
                <button key={t.id} onClick={()=>onChange({...block,_tab:t.id})}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition"
                  style={{background:(block._tab||'local')===t.id?'rgba(212,175,55,0.2)':'var(--bg-card)',
                    border:`1px solid ${(block._tab||'local')===t.id?'#d4af37':'var(--border)'}`,
                    color:(block._tab||'local')===t.id?'#d4af37':'var(--text-muted)'}}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mt-2">
              {(block._tab||'local')==='local' ? (
                <div>
                  <input ref={fileRef} type="file" accept=".pdf,.epub,.doc,.docx" className="hidden" onChange={handleFile}/>
                  <button onClick={()=>fileRef.current?.click()}
                    className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition"
                    style={{border:'2px dashed rgba(212,175,55,0.4)',background:'var(--bg-base)',color:'#d4af37'}}>
                    📎 {block.fileName ? `${block.fileName} (${block.fileSize})` : 'Choisir un fichier PDF / EPUB'}
                  </button>
                  {block.fileData && <p className="text-[10px] mt-1 text-center" style={{color:'#27ae60'}}>✓ Fichier chargé</p>}
                </div>
              ) : (
                <input value={block.fileUrl||''} onChange={e=>onChange({...block,fileUrl:e.target.value,fileData:''})}
                  placeholder="https://... lien vers le PDF"
                  className="w-full px-2 py-2 rounded-lg text-xs font-mono focus:outline-none"
                  style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
              )}
            </div>
          </div>

          {/* Bouton ouvrir séparément */}
          {hasFile && (
            <button onClick={openDocument}
              className="w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition"
              style={{background:'linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.25))',
                border:'1px solid rgba(212,175,55,0.5)',color:'#d4af37'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(212,175,55,0.3)';e.currentTarget.style.borderColor='#d4af37'}}
              onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.25))';e.currentTarget.style.borderColor='rgba(212,175,55,0.5)'}}>
              <span className="text-sm">📂</span>
              Ouvrir le document dans un nouvel onglet
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── TrackerCard ────────────────────────────────────────── */
function TrackerCard({ block, onChange, onRemove }) {
  const [open, setOpen] = useState(true)
  const [confirmDel, setConfirmDel] = useState(false)

  const totalCals = (Number(block.proteinGoal||0)*4) + (Number(block.carbsGoal||0)*4) + (Number(block.fatGoal||0)*9)

  return (
    <div className="rounded-xl overflow-hidden mb-2"
      style={{border:`1px solid ${open?'rgba(58,82,168,0.6)':'var(--border)'}`,background:'var(--bg-base)'}}>
      <div className="flex items-center gap-2 px-2 py-2 min-w-0"
        style={{background:open?'rgba(58,82,168,0.08)':'transparent'}}>
        <span className="text-sm flex-shrink-0">📊</span>
        <input value={block.title||''} onChange={e=>onChange({...block,title:e.target.value})}
          placeholder="Nom du tracker"
          className="text-xs font-black focus:outline-none bg-transparent min-w-0"
          style={{color:'var(--text-primary)',flex:'1 1 60px'}}/>
        {!open && block.caloriesGoal && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0"
            style={{background:'rgba(232,160,32,0.15)',color:'#e8a020'}}>
            {block.caloriesGoal} kcal
          </span>
        )}
        <CardActions open={open} onToggle={()=>setOpen(o=>!o)} accentColor="#3a52a8"
          confirmDel={confirmDel} onAskDel={()=>setConfirmDel(true)}
          onConfirmDel={onRemove} onCancelDel={()=>setConfirmDel(false)}/>
      </div>

      {open && (
        <div className="px-2 pb-3 border-t space-y-3" style={{borderColor:'rgba(58,82,168,0.2)'}}>
          <div className="pt-2">
            <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{color:'#6b82d4'}}>Objectifs quotidiens</p>

            {/* Calories */}
            <div className="rounded-xl p-3 mb-2" style={{background:'rgba(232,160,32,0.08)',border:'1px solid rgba(232,160,32,0.2)'}}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black" style={{color:'#e8a020'}}>🔥 Calories totales</span>
                {totalCals>0 && <span className="text-[10px]" style={{color:'var(--text-faint)'}}>Calc: {totalCals} kcal</span>}
              </div>
              <input type="number" min="0" value={block.caloriesGoal||''} onChange={e=>onChange({...block,caloriesGoal:e.target.value})}
                placeholder="Ex: 2200"
                className="w-full px-3 py-2 rounded-lg text-sm font-black focus:outline-none"
                style={{background:'var(--bg-base)',border:'1px solid rgba(232,160,32,0.4)',color:'#e8a020'}}/>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                {k:'proteinGoal',label:'Protéines',unit:'g',color:MACRO_COLORS.protein},
                {k:'carbsGoal',  label:'Glucides',  unit:'g',color:MACRO_COLORS.carbs},
                {k:'fatGoal',    label:'Lipides',   unit:'g',color:MACRO_COLORS.fat},
              ].map(({k,label,unit,color})=>(
                <div key={k} className="rounded-lg p-2 text-center"
                  style={{background:`${color}10`,border:`1px solid ${color}30`}}>
                  <p className="text-[9px] font-bold mb-1" style={{color}}>{label}</p>
                  <input type="number" min="0" value={block[k]||''} onChange={e=>onChange({...block,[k]:e.target.value})}
                    placeholder="0"
                    className="w-full text-center text-sm font-black focus:outline-none bg-transparent"
                    style={{color}}/>
                  <p className="text-[9px] mt-0.5" style={{color:'var(--text-faint)'}}>{unit}</p>
                </div>
              ))}
            </div>

            {/* Barre visuelle */}
            {totalCals>0 && (() => {
              const p=Number(block.proteinGoal||0)*4
              const c=Number(block.carbsGoal||0)*4
              const f=Number(block.fatGoal||0)*9
              return (
                <div className="mt-3">
                  <div className="flex rounded-full overflow-hidden h-2.5">
                    <div style={{width:`${p/totalCals*100}%`,background:MACRO_COLORS.protein}}/>
                    <div style={{width:`${c/totalCals*100}%`,background:MACRO_COLORS.carbs}}/>
                    <div style={{width:`${f/totalCals*100}%`,background:MACRO_COLORS.fat}}/>
                  </div>
                  <div className="flex justify-between mt-1">
                    {[{label:`P ${Math.round(p/totalCals*100)}%`,color:MACRO_COLORS.protein},
                      {label:`G ${Math.round(c/totalCals*100)}%`,color:MACRO_COLORS.carbs},
                      {label:`L ${Math.round(f/totalCals*100)}%`,color:MACRO_COLORS.fat}].map(({label,color})=>(
                      <span key={label} className="text-[9px] font-bold" style={{color}}>{label}</span>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Repas planifiés */}
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase mb-1.5" style={{color:'#6b82d4'}}>Répartition repas</p>
            <div className="grid grid-cols-2 gap-1">
              {['Petit-déjeuner','Déjeuner','Collation','Dîner'].map(meal=>(
                <div key={meal} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                  style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
                  <span className="text-[10px]">{meal==='Petit-déjeuner'?'🌅':meal==='Déjeuner'?'☀️':meal==='Collation'?'🍎':'🌙'}</span>
                  <input value={block[`meal_${meal}`]||''} onChange={e=>onChange({...block,[`meal_${meal}`]:e.target.value})}
                    placeholder={`${meal}...`}
                    className="flex-1 text-[10px] focus:outline-none bg-transparent min-w-0"
                    style={{color:'var(--text-secondary)'}}/>
                </div>
              ))}
            </div>
          </div>

          <textarea value={block.notes||''} onChange={e=>onChange({...block,notes:e.target.value})}
            rows={2} placeholder="Conseils nutritionnels, stratégies..."
            className="w-full px-2 py-1.5 rounded-lg text-xs resize-none focus:outline-none"
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
        </div>
      )}
    </div>
  )
}

/* ── Colonne jour redimensionnable ───────────────────────── */
function DayColumn({ day, onUpdateDay, onRemoveDay, onDuplicateDay, onMoveDay, isFirst, isLast, viewMode }) {
  const [showPicker, setShowPicker] = useState(false)
  const [width, setWidth] = useState(260 < 230 ? 230 : 260)
  const [confirmDelDay, setConfirmDelDay] = useState(false)
  const dragging = useRef(false)
  const startX   = useRef(0)
  const startW   = useRef(0)

  const onMouseDown = (e) => {
    e.preventDefault()
    dragging.current = true
    startX.current   = e.clientX
    startW.current   = width
    const onMove = (ev) => {
      if (!dragging.current) return
      const next = Math.max(230, Math.min(600, startW.current + ev.clientX - startX.current))
      setWidth(next)
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  const addBlock = (type) => {
    onUpdateDay({ ...day, blocks:[...day.blocks, { id:uuidv4(), type, title:'' }] })
    setShowPicker(false)
  }
  const updateBlock = (i, updated) => {
    const blocks=[...day.blocks]; blocks[i]=updated; onUpdateDay({...day,blocks})
  }
  const removeBlock = (i) => onUpdateDay({...day, blocks:day.blocks.filter((_,idx)=>idx!==i)})

  return (
    <div className="flex-shrink-0 flex relative" style={{width}}>
      {/* Carte principale */}
      <div className="flex flex-col rounded-2xl overflow-hidden flex-1"
        style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>

        {/* Header jour */}
        <div className="px-2 py-2" style={{borderBottom:'1px solid var(--border)',background:'var(--bg-card-2)'}}>
          {/* Ligne 1 : label + supprimer */}
          <div className="flex items-center gap-1 mb-1.5">
            <input value={day.label||''} onChange={e=>onUpdateDay({...day,label:e.target.value})}
              className="text-xs font-black focus:outline-none bg-transparent flex-1 min-w-0"
              style={{color:'var(--text-primary)'}}/>
            {confirmDelDay ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={onRemoveDay}
                  className="px-1.5 py-0.5 rounded text-[10px] font-black"
                  style={{background:'#a03848',color:'#fff'}}>Oui</button>
                <button onClick={()=>setConfirmDelDay(false)}
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{background:'var(--bg-base)',color:'var(--text-muted)'}}>Non</button>
              </div>
            ) : (
              <button onClick={()=>setConfirmDelDay(true)} title="Supprimer ce jour"
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs"
                style={{background:'rgba(160,56,72,0.12)',color:'#a03848'}}>✕</button>
            )}
          </div>
          {/* Ligne 2 : actions déplacer + dupliquer */}
          <div className="flex items-center gap-1">
            <button onClick={()=>onMoveDay(-1)} disabled={isFirst} title="Déplacer à gauche"
              className="flex-1 py-0.5 rounded text-[10px] font-bold transition disabled:opacity-20"
              style={{background:'var(--bg-base)',color:'var(--text-muted)',border:'1px solid var(--border)'}}>
              ←
            </button>
            <button onClick={onDuplicateDay} title="Dupliquer ce jour"
              className="flex-1 py-0.5 rounded text-[10px] font-bold transition"
              style={{background:'var(--bg-base)',color:'var(--text-muted)',border:'1px solid var(--border)'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-muted)'}}>
              ⧉ Copier
            </button>
            <button onClick={()=>onMoveDay(1)} disabled={isLast} title="Déplacer à droite"
              className="flex-1 py-0.5 rounded text-[10px] font-bold transition disabled:opacity-20"
              style={{background:'var(--bg-base)',color:'var(--text-muted)',border:'1px solid var(--border)'}}>
              →
            </button>
          </div>
        </div>

        {/* Blocs */}
        <div className="flex-1 p-2 overflow-y-auto" style={{minHeight:120,maxHeight:560}}>
          {day.blocks.map((block,i)=>(
            <DayBlock key={block.id} block={block}
              onChange={u=>updateBlock(i,u)}
              onRemove={()=>removeBlock(i)}/>
          ))}
          {showPicker ? (() => {
            const isNutrition = viewMode === 'nutrition'
            const pickerColor = isNutrition ? '#27ae60' : 'var(--accent)'
            const relevantBlocks = BLOCK_TYPES.filter(b => b.group === (isNutrition ? 'nutrition' : 'training'))
            return (
              <div className="rounded-xl p-2 mt-1" style={{background:'var(--bg-base)',border:`1px solid ${pickerColor}`}}>
                <p className="text-[9px] font-black tracking-widest uppercase px-1 pb-1 pt-0.5"
                  style={{color:pickerColor}}>{isNutrition ? '🥗 Nutrition' : '💪 Entraînement'}</p>
                <div className="space-y-0.5">
                  {relevantBlocks.map(({type,label,icon})=>(
                    <button key={type} onClick={()=>addBlock(type)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold text-left transition"
                      style={{background:'var(--bg-card)',color:'var(--text-primary)'}}
                      onMouseEnter={e=>{e.currentTarget.style.background=pickerColor;e.currentTarget.style.color='#fff'}}
                      onMouseLeave={e=>{e.currentTarget.style.background='var(--bg-card)';e.currentTarget.style.color='var(--text-primary)'}}>
                      <span>{icon}</span>{label}
                    </button>
                  ))}
                </div>
                <button onClick={()=>setShowPicker(false)} className="w-full text-[10px] py-1.5 text-center mt-1"
                  style={{color:'var(--text-faint)'}}>Annuler</button>
              </div>
            )
          })() : (
            <button onClick={()=>setShowPicker(true)}
              className="w-full py-2 rounded-xl text-xs font-bold transition mt-1"
              style={{border:`1.5px dashed ${viewMode==='nutrition'?'rgba(39,174,96,0.4)':'var(--border)'}`,color:'var(--text-faint)',background:'transparent'}}
              onMouseEnter={e=>{const c=viewMode==='nutrition'?'#27ae60':'var(--accent)';e.currentTarget.style.borderColor=c;e.currentTarget.style.color=c}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=viewMode==='nutrition'?'rgba(39,174,96,0.4)':'var(--border)';e.currentTarget.style.color='var(--text-faint)'}}>
              + Ajouter
            </button>
          )}
        </div>

        {/* Footer compteur */}
        <div className="px-3 py-1.5 text-[10px] flex items-center justify-between"
          style={{borderTop:'1px solid var(--border)',color:'var(--text-faint)'}}>
          <span>{day.blocks.length} élément{day.blocks.length!==1?'s':''}</span>
          <span className="text-[10px]" style={{color:'var(--text-faint)'}}>{width}px</span>
        </div>
      </div>

      {/* ── Poignée de redimensionnement ── */}
      <div onMouseDown={onMouseDown}
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center cursor-col-resize group"
        style={{width:12,zIndex:10}}>
        <div className="rounded-full transition-all duration-150 group-hover:opacity-100 opacity-0"
          style={{width:4,height:40,background:'var(--accent)'}}>
        </div>
      </div>
    </div>
  )
}

/* ── Semaine ─────────────────────────────────────────────── */
function WeekPlanner({ week, weekIdx, totalWeeks, onUpdateWeek, onRemoveWeek, onDuplicateWeek, onMoveWeek, viewMode }) {
  const [showDayPicker, setShowDayPicker] = useState(false)
  const [customDay, setCustomDay] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  // Clé du tableau selon le mode actif
  const daysKey = viewMode === 'nutrition' ? 'nutritionDays' : 'days'
  const activeDays = week[daysKey] || []

  const addDay = (label) => {
    const newDay = viewMode === 'nutrition'
      ? { id:uuidv4(), label, meals:[] }
      : { id:uuidv4(), label, blocks:[] }
    onUpdateWeek({...week, [daysKey]:[...activeDays, newDay]})
  }
  const updateDay = (i, updated) => {
    const arr=[...activeDays]; arr[i]=updated; onUpdateWeek({...week,[daysKey]:arr})
  }
  const removeDay = (i) => onUpdateWeek({...week, [daysKey]:activeDays.filter((_,idx)=>idx!==i)})
  const duplicateDay = (i) => {
    const copy = JSON.parse(JSON.stringify(activeDays[i]))
    copy.id = uuidv4()
    copy.label = (copy.label||'') + ' (copie)'
    if (copy.blocks) copy.blocks = copy.blocks.map(b=>({...b,id:uuidv4()}))
    if (copy.meals)  copy.meals  = copy.meals.map(m=>({...m,id:uuidv4(),items:(m.items||[]).map(it=>({...it,id:uuidv4()}))}))
    const arr = [...activeDays]
    arr.splice(i+1, 0, copy)
    onUpdateWeek({...week, [daysKey]:arr})
  }
  const moveDay = (i, dir) => {
    const arr = [...activeDays]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    onUpdateWeek({...week, [daysKey]:arr})
  }

  return (
    <div className="mb-8 rounded-2xl overflow-hidden"
      style={{border:'1px solid var(--border)',background:'var(--bg-card)'}}>

      {/* ── Header semaine ── */}
      <div className="flex items-center gap-2 px-4 py-3 flex-wrap"
        style={{borderBottom:'1px solid var(--border)',background:'var(--bg-card-2)'}}>
        {/* Badge + titre */}
        <span className="text-xs font-black px-2.5 py-1 rounded-lg flex-shrink-0"
          style={{background:'var(--accent)',color:'#fff'}}>
          S{weekIdx+1}
        </span>
        <input value={week.title||''} onChange={e=>onUpdateWeek({...week,title:e.target.value})}
          placeholder={`Semaine ${weekIdx+1} — titre optionnel`}
          className="text-sm font-black focus:outline-none bg-transparent flex-1 min-w-0"
          style={{color:'var(--text-primary)',minWidth:140}}/>

        {/* Actions semaine */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Déplacer haut/bas */}
          <button onClick={()=>onMoveWeek(-1)} disabled={weekIdx===0} title="Remonter la semaine"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition disabled:opacity-20"
            style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-muted)'}}>↑</button>
          <button onClick={()=>onMoveWeek(1)} disabled={weekIdx===totalWeeks-1} title="Descendre la semaine"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition disabled:opacity-20"
            style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-muted)'}}>↓</button>

          {/* Dupliquer */}
          <button onClick={onDuplicateWeek} title="Dupliquer cette semaine"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition"
            style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-secondary)'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-secondary)'}}>
            ⧉ Dupliquer
          </button>

          {/* Ajouter un jour */}
          {showDayPicker ? (
            <div className="flex items-center gap-1 flex-wrap">
              {DAYS_FR.filter(d=>!activeDays.find(dd=>dd.label===d)).slice(0,4).map(d=>(
                <button key={d} onClick={()=>{addDay(d);setShowDayPicker(false)}}
                  className="px-2 py-1 rounded-lg text-xs font-bold"
                  style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}>
                  {d}
                </button>
              ))}
              <input value={customDay} onChange={e=>setCustomDay(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&customDay.trim()){addDay(customDay.trim());setCustomDay('');setShowDayPicker(false)}}}
                placeholder="Personnalisé…"
                className="px-2 py-1 rounded-lg text-xs focus:outline-none"
                style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-primary)',width:100}}/>
              <button onClick={()=>setShowDayPicker(false)} className="text-xs" style={{color:'var(--text-faint)'}}>✕</button>
            </div>
          ) : (
            <button onClick={()=>setShowDayPicker(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition"
              style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-secondary)'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-secondary)'}}>
              + Jour
            </button>
          )}

          {/* Supprimer */}
          {confirmDel ? (
            <>
              <button onClick={onRemoveWeek}
                className="px-2.5 py-1.5 rounded-lg text-xs font-black"
                style={{background:'#a03848',color:'#fff'}}>Supprimer</button>
              <button onClick={()=>setConfirmDel(false)}
                className="px-2 py-1.5 rounded-lg text-xs"
                style={{background:'var(--bg-base)',color:'var(--text-muted)'}}>Annuler</button>
            </>
          ) : (
            <button onClick={()=>setConfirmDel(true)} title="Supprimer cette semaine"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition"
              style={{background:'transparent',color:'var(--text-faint)'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(160,56,72,0.15)';e.currentTarget.style.color='#a03848'}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-faint)'}}>
              🗑
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Description */}
        <input value={week.description||''} onChange={e=>onUpdateWeek({...week,description:e.target.value})}
          placeholder="Description / objectif de la semaine (optionnel)"
          className="w-full px-3 py-2 rounded-xl text-xs mb-4 focus:outline-none"
          style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-secondary)'}}/>

        {/* Colonnes jours */}
        {activeDays.length===0 ? (
          <div className="rounded-2xl p-8 text-center" style={{border:`2px dashed ${viewMode==='nutrition'?'rgba(39,174,96,0.3)':'var(--border)'}`}}>
            <p className="text-sm font-black mb-1" style={{color:'var(--text-primary)'}}>
              {viewMode==='nutrition' ? '🥗 Aucun jour de nutrition' : 'Aucun jour'}
            </p>
            <p className="text-xs mb-3" style={{color:'var(--text-faint)'}}>
              {viewMode==='nutrition' ? 'Ajoute des jours pour ton plan alimentaire' : "Ajoute des jours d'entraînement"}
            </p>
            <button onClick={()=>setShowDayPicker(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{background:viewMode==='nutrition'?'#27ae60':'var(--accent)',color:'#fff'}}>+ Ajouter un jour</button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth:'none'}}>
            {activeDays.map((day,i)=>
              viewMode === 'nutrition' ? (
                <NutritionDayColumn key={day.id} day={day}
                  isFirst={i===0} isLast={i===activeDays.length-1}
                  onUpdateDay={u=>updateDay(i,u)}
                  onRemoveDay={()=>removeDay(i)}
                  onDuplicateDay={()=>duplicateDay(i)}
                  onMoveDay={dir=>moveDay(i,dir)}/>
              ) : (
                <DayColumn key={day.id} day={day}
                  viewMode={viewMode}
                  isFirst={i===0} isLast={i===activeDays.length-1}
                  onUpdateDay={u=>updateDay(i,u)}
                  onRemoveDay={()=>removeDay(i)}
                  onDuplicateDay={()=>duplicateDay(i)}
                  onMoveDay={dir=>moveDay(i,dir)}/>
              )
            )}
            <button onClick={()=>setShowDayPicker(true)}
              className="flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-2 transition"
              style={{width:50,minHeight:140,border:'2px dashed var(--border)',color:'var(--text-faint)',background:'transparent'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-faint)'}}>
              <span className="text-lg">+</span>
              <span className="text-[9px] font-bold" style={{writingMode:'vertical-rl',transform:'rotate(180deg)'}}>Jour</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Page principale ─────────────────────────────────────── */
export default function CoachProgramBuilder() {
  const navigate     = useNavigate()
  const { programId } = useParams()
  const isEdit       = !!programId
  const { createProgram, updateProgram, fetchProgram } = useStore()
  const [darkMode, setDarkMode]   = useState(()=>(localStorage.getItem('ultra-theme')||'light')==='dark')
  const [viewMode, setViewMode]   = useState('training')  // 'training' | 'nutrition'
  const [showAIGen, setShowAIGen] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saveMsg, setSaveMsg]   = useState('')
  const [draftMsg, setDraftMsg] = useState('')
  const [metaOpen, setMetaOpen] = useState(true)
  const coverRef    = useRef()
  const draftTimer  = useRef(null)
  const history     = useRef([])   // pile d'historique pour undo
  const isUndoing   = useRef(false) // évite de push l'état restauré dans l'historique

  const DRAFT_KEY = `ultra-draft-${programId || 'new'}`

  const EMPTY_FORM = {
    title:'', description:'', category:'Force', level:'Tous niveaux',
    price:0, duration:'', sessions:'', nutrition:false,
    gradient:GRADIENTS[0], coverImage:null,
    weeks:[{ id:uuidv4(), title:'', description:'', days:[], nutritionDays:[] }],
  }

  // Init : brouillon localStorage en priorité (sauf édition)
  const [form, setForm] = useState(()=>{
    if (!isEdit) {
      try {
        const draft = localStorage.getItem(DRAFT_KEY)
        if (draft) return JSON.parse(draft)
      } catch {}
    }
    return EMPTY_FORM
  })

  // Charger depuis le backend en mode édition (écrase le brouillon local)
  useEffect(()=>{
    if (isEdit) fetchProgram(programId).then(()=>{
      const s = useStore.getState().currentProgram
      if (s) {
        const loaded = {...s, weeks:s.weeks||[{id:uuidv4(),title:'',description:'',days:[]}], coverImage:s.coverImage||null}
        // Fusionner avec brouillon local si plus récent
        try {
          const draft = localStorage.getItem(DRAFT_KEY)
          if (draft) {
            const parsed = JSON.parse(draft)
            // Utiliser le brouillon s'il a un contenu significatif
            if (parsed.title || (parsed.weeks && parsed.weeks.some(w=>w.days.length>0))) {
              setForm(parsed); return
            }
          }
        } catch {}
        setForm(loaded)
      }
    })
  },[programId])

  // Sauvegarde immédiate dans localStorage à chaque changement
  useEffect(()=>{
    // Push dans l'historique undo (sauf si on est en train de défaire)
    if (!isUndoing.current) {
      history.current.push(JSON.stringify(form))
      if (history.current.length > 50) history.current.shift() // max 50 étapes
    }
    isUndoing.current = false

    // Sauvegarde instantanée (pas de debounce — on veut 0 perte)
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    } catch {}

    // Indicateur visuel debounced
    clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(()=>{
      setDraftMsg('✓ Brouillon sauvegardé')
      setTimeout(()=>setDraftMsg(''), 2000)
    }, 600)
    return ()=>clearTimeout(draftTimer.current)
  },[form])

  // Sauvegarde aussi sur fermeture onglet / navigation browser
  useEffect(()=>{
    const save = () => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)) } catch {}
    }
    window.addEventListener('beforeunload', save)
    return ()=>window.removeEventListener('beforeunload', save)
  },[form])

  // Ctrl+Z / Cmd+Z → undo
  useEffect(()=>{
    const onKey = (e) => {
      if ((e.ctrlKey||e.metaKey) && e.key==='z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  },[])

  // Undo
  const handleUndo = () => {
    if (history.current.length < 2) return
    history.current.pop() // retire l'état courant
    const prev = history.current[history.current.length - 1]
    if (!prev) return
    isUndoing.current = true
    try { setForm(JSON.parse(prev)) } catch {}
  }
  const canUndo = history.current.length >= 2

  const handleThemeToggle=()=>{
    const next=darkMode?'light':'dark'
    setDarkMode(!darkMode)
    document.documentElement.setAttribute('data-theme',next)
    localStorage.setItem('ultra-theme',next)
  }

  const setField=(k,v)=>setForm(f=>({...f,[k]:v}))
  const handleCoverImage=async e=>{const f=e.target.files[0];if(f)setField('coverImage',await fileToBase64(f))}

  const addWeek=()=>setForm(f=>({...f,weeks:[...f.weeks,{id:uuidv4(),title:'',description:'',days:[],nutritionDays:[]}]}))
  const updateWeek=(i,w)=>setForm(f=>{const ws=[...f.weeks];ws[i]=w;return{...f,weeks:ws}})
  const removeWeek=(i)=>setForm(f=>({...f,weeks:f.weeks.filter((_,idx)=>idx!==i)}))
  const duplicateWeek=(i)=>setForm(f=>{
    const copy=JSON.parse(JSON.stringify(f.weeks[i]))
    copy.id=uuidv4()
    copy.title=(copy.title||`Semaine ${i+1}`)+' (copie)'
    copy.days=(copy.days||[]).map(d=>({...d,id:uuidv4(),blocks:d.blocks.map(b=>({...b,id:uuidv4()}))}))
    copy.nutritionDays=(copy.nutritionDays||[]).map(d=>({...d,id:uuidv4(),blocks:d.blocks.map(b=>({...b,id:uuidv4()}))}))
    const ws=[...f.weeks]; ws.splice(i+1,0,copy); return{...f,weeks:ws}
  })
  const moveWeek=(i,dir)=>setForm(f=>{
    const ws=[...f.weeks]; const j=i+dir
    if(j<0||j>=ws.length) return f
    ;[ws[i],ws[j]]=[ws[j],ws[i]]; return{...f,weeks:ws}
  })

  const handleAIGenerated = (program) => {
    setShowAIGen(false)
    // Merge le programme généré dans le formulaire
    setForm(prev => ({
      ...prev,
      title:       program.title || prev.title,
      description: program.description || prev.description,
      weeks:       (program.weeks || []).map(w => ({
        ...w,
        id: w.id || uuidv4(),
        nutritionDays: w.nutritionDays || [],
        days: (w.days || []).map(d => ({
          ...d,
          id: d.id || uuidv4(),
          blocks: (d.blocks || []).map(b => ({ ...b, id: b.id || uuidv4() })),
        })),
      })),
    }))
    setSaveMsg('✦ Programme IA importé !')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const handleSave=async()=>{
    if(!form.title.trim()){setSaveMsg('Le titre est requis.');return}
    setSaving(true);setSaveMsg('')
    const payload={...form,sections:form.weeks}
    const res=isEdit?await updateProgram(programId,payload):await createProgram(payload)
    setSaving(false)
    if(res.success){
      localStorage.removeItem(DRAFT_KEY)
      history.current = []
      setSaveMsg('✓ Enregistré')
      setTimeout(()=>navigate('/coach/programs'),800)
    } else setSaveMsg(res.error||'Erreur')
  }

  const handleDiscardDraft=()=>{
    if (!window.confirm('Effacer le brouillon et repartir de zéro ?')) return
    localStorage.removeItem(DRAFT_KEY)
    setForm(EMPTY_FORM)
    // Ne pas vider history.current — l'undo reste disponible
  }

  const iStyle={background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-primary)'}
  const lCls='block text-xs font-bold tracking-widest uppercase mb-2'

  return (
    <div className="min-h-screen" style={{background:'var(--bg-base)'}}>

      {/* ── AI Generator modal ── */}
      {showAIGen && (
        <AIProgramGenerator
          onGenerated={handleAIGenerated}
          onClose={() => setShowAIGen(false)}
        />
      )}

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-3"
        style={{background:'var(--bg-base)',borderBottom:'1px solid var(--border)',backdropFilter:'blur(12px)'}}>
        <div className="flex items-center gap-3">
          <button onClick={()=>navigate('/coach/programs')}
            className="text-sm font-bold px-3 py-1.5 rounded-lg"
            style={{color:'var(--text-muted)',background:'var(--bg-card)',border:'1px solid var(--border)'}}>
            ← Retour
          </button>
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{color:'var(--gold)'}}>
              {isEdit?'Modifier':'Nouveau'}
            </p>
            <h1 className="text-lg font-black leading-tight" style={{color:'var(--text-primary)'}}>
              {form.title||'Programme sans titre'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Undo */}
          {/* Bouton IA */}
          <button onClick={()=>setShowAIGen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition"
            style={{background:'linear-gradient(135deg,var(--accent),#c42840)',color:'#fff',boxShadow:'0 2px 12px rgba(160,56,72,0.3)'}}>
            ✦ Générer avec l'IA
          </button>

          <button onClick={handleUndo} disabled={!canUndo} title="Annuler la dernière action (Ctrl+Z)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-30"
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-secondary)'}}>
            ↩ Annuler
          </button>

          <button onClick={handleThemeToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-secondary)'}}>
            <span>{darkMode?'☀':'☾'}</span><span>{darkMode?'Clair':'Sombre'}</span>
          </button>

          {/* Statut brouillon */}
          {draftMsg
            ? <span className="flex items-center gap-1.5 text-xs font-semibold" style={{color:'#27ae60'}}>
                <span className="w-1.5 h-1.5 rounded-full" style={{background:'#27ae60'}}/>
                {draftMsg}
              </span>
            : <span className="flex items-center gap-2 text-xs" style={{color:'var(--text-faint)'}}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:'#e8a020'}}/>
                Auto-save activé
                <button onClick={handleDiscardDraft} className="underline text-[10px]" style={{color:'var(--text-faint)'}}>
                  Effacer
                </button>
              </span>
          }

          {saveMsg && <span className="text-sm font-bold" style={{color:saveMsg.startsWith('✓')?'#27ae60':'#a03848'}}>{saveMsg}</span>}
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{background:'var(--accent)'}}>
            {saving?'Sauvegarde...':(isEdit?'Enregistrer':'Créer le programme')}
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-57px)]">

        {/* ── Panneau gauche métadonnées (collapsible) ── */}
        <div className="flex-shrink-0 transition-all duration-300 overflow-hidden"
          style={{width:metaOpen?300:44,borderRight:'1px solid var(--border)',background:'var(--bg-card)'}}>

          {/* Toggle */}
          <button onClick={()=>setMetaOpen(o=>!o)}
            className="w-full flex items-center gap-2 px-3 py-3 text-xs font-bold"
            style={{borderBottom:'1px solid var(--border)',color:'var(--text-muted)'}}>
            <span>{metaOpen?'‹':'›'}</span>
            {metaOpen && <span className="tracking-widest uppercase">Paramètres</span>}
          </button>

          {metaOpen && (
            <div className="p-4 space-y-4 overflow-y-auto" style={{maxHeight:'calc(100vh - 105px)'}}>

              <div>
                <label className={lCls} style={{color:'var(--text-muted)'}}>Titre *</label>
                <input value={form.title} onChange={e=>setField('title',e.target.value)}
                  placeholder="Nom du programme"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none font-bold" style={iStyle}/>
              </div>

              <div>
                <label className={lCls} style={{color:'var(--text-muted)'}}>Description</label>
                <textarea value={form.description} onChange={e=>setField('description',e.target.value)}
                  rows={3} placeholder="Objectif du programme..."
                  className="w-full px-3 py-2 rounded-xl text-sm resize-none focus:outline-none" style={iStyle}/>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lCls} style={{color:'var(--text-muted)'}}>Catégorie</label>
                  <div className="relative">
                    <select value={form.category} onChange={e=>setField('category',e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none appearance-none cursor-pointer" style={iStyle}>
                      {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{color:'var(--text-faint)'}}>▾</span>
                  </div>
                </div>
                <div>
                  <label className={lCls} style={{color:'var(--text-muted)'}}>Niveau</label>
                  <div className="relative">
                    <select value={form.level} onChange={e=>setField('level',e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none appearance-none cursor-pointer" style={iStyle}>
                      {LEVELS.map(l=><option key={l}>{l}</option>)}
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{color:'var(--text-faint)'}}>▾</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lCls} style={{color:'var(--text-muted)'}}>Prix (€)</label>
                  <input type="number" min="0" value={form.price} onChange={e=>setField('price',Number(e.target.value))}
                    placeholder="0 = Gratuit" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={iStyle}/>
                </div>
                <div>
                  <label className={lCls} style={{color:'var(--text-muted)'}}>Durée</label>
                  <input value={form.duration} onChange={e=>setField('duration',e.target.value)}
                    placeholder="8 semaines" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={iStyle}/>
                </div>
              </div>

              <div>
                <label className={lCls} style={{color:'var(--text-muted)'}}>Fréquence</label>
                <input value={form.sessions} onChange={e=>setField('sessions',e.target.value)}
                  placeholder="4x/semaine" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={iStyle}/>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={()=>{ if(form.nutrition) setViewMode('training'); setField('nutrition',!form.nutrition) }}
                  className="w-9 h-5 rounded-full transition-all relative flex-shrink-0"
                  style={{background:form.nutrition?'var(--accent)':'var(--border)'}}>
                  <div className="absolute top-0.5 rounded-full w-4 h-4 bg-white transition-all"
                    style={{left:form.nutrition?'1.1rem':'0.125rem',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}}/>
                </div>
                <span className="text-xs font-medium" style={{color:'var(--text-secondary)'}}>Inclut nutrition</span>
              </label>

              {/* Visuel */}
              <div className="pt-2" style={{borderTop:'1px solid var(--border)'}}>
                <p className={lCls} style={{color:'var(--text-muted)'}}>Visuel</p>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverImage}/>
                <button onClick={()=>coverRef.current?.click()}
                  className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 mb-3"
                  style={{border:'2px dashed var(--border)',background:'var(--bg-base)',color:'var(--text-muted)'}}>
                  🖼️ {form.coverImage?'Changer la photo':'Importer une photo'}
                </button>
                {form.coverImage && (
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs" style={{color:'#27ae60'}}>✓ Photo importée</p>
                    <button onClick={()=>setField('coverImage',null)} className="text-xs" style={{color:'#a03848'}}>Supprimer</button>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {GRADIENTS.map((g,i)=>(
                    <button key={i} onClick={()=>setField('gradient',g)}
                      className="rounded-lg transition-all"
                      style={{height:28,background:g,outline:!form.coverImage&&form.gradient===g?'2px solid var(--accent)':'none',outlineOffset:2}}/>
                  ))}
                </div>
                <div className="rounded-xl overflow-hidden h-14 flex items-center justify-center relative"
                  style={{background:form.coverImage?'transparent':form.gradient}}>
                  {form.coverImage
                    ? <img src={form.coverImage} alt="cover" className="w-full h-full object-cover rounded-xl"/>
                    : <span style={{fontSize:28}}>{CAT_ICONS[form.category]||'💪'}</span>}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── Zone planning ── */}
        <div className="flex-1 overflow-auto p-6">

          {/* En-tête planning */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{color:'var(--gold)'}}>Planning</p>
              <p className="text-sm" style={{color:'var(--text-secondary)'}}>
                {form.weeks.length} semaine{form.weeks.length!==1?'s':''} ·{' '}
                {form.weeks.reduce((s,w)=>s+(viewMode==='nutrition'?(w.nutritionDays||[]).length:w.days.length),0)} jours ·{' '}
                {form.weeks.reduce((s,w)=>{
                  const days = viewMode==='nutrition' ? (w.nutritionDays||[]) : w.days
                  return s + days.reduce((ss,d)=>ss+d.blocks.length,0)
                },0)} éléments
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Toggle Exercices / Nutrition — visible seulement si nutrition activée */}
              {form.nutrition && (
                <div className="flex items-center rounded-xl overflow-hidden"
                  style={{border:'1px solid var(--border)',background:'var(--bg-card)'}}>
                  <button onClick={()=>setViewMode('training')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-black transition"
                    style={{
                      background:viewMode==='training'?'var(--accent)':'transparent',
                      color:viewMode==='training'?'#fff':'var(--text-muted)',
                    }}>
                    💪 Exercices
                  </button>
                  <button onClick={()=>setViewMode('nutrition')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-black transition"
                    style={{
                      background:viewMode==='nutrition'?'#27ae60':'transparent',
                      color:viewMode==='nutrition'?'#fff':'var(--text-muted)',
                    }}>
                    🥗 Nutrition
                  </button>
                </div>
              )}
              <button onClick={addWeek}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{background:viewMode==='nutrition'?'#27ae60':'var(--accent)'}}>
                + Ajouter une semaine
              </button>
            </div>
          </div>

          {/* Semaines */}
          {form.weeks.map((week,i)=>(
            <WeekPlanner key={week.id} week={week} weekIdx={i} totalWeeks={form.weeks.length}
              viewMode={viewMode}
              onUpdateWeek={w=>updateWeek(i,w)}
              onRemoveWeek={()=>removeWeek(i)}
              onDuplicateWeek={()=>duplicateWeek(i)}
              onMoveWeek={dir=>moveWeek(i,dir)}/>
          ))}
        </div>
      </div>
    </div>
  )
}
