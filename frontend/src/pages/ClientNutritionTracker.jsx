import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'
import { v4 as uuidv4 } from 'uuid'

/* ── Describe food with AI ───────────────────────────────── */
function AIFoodSearch({ onResult, onClose }) {
  const { aiAnalyzeFood } = useStore()
  const [query, setQuery]     = useState('')
  const [grams, setGrams]     = useState('100')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true); setError('')
    const res = await aiAnalyzeFood(query.trim(), Number(grams))
    setLoading(false)
    if (res?.success && res.food) {
      onResult({ name: res.food.name || query, calories: res.food.calories_per_100g, protein: res.food.protein_per_100g, carbs: res.food.carbs_per_100g, fat: res.food.fat_per_100g, qty: Number(grams) })
    } else {
      setError(res?.error || 'IA non disponible — remplis les macros manuellement')
      // Still create the item with just the name
      onResult({ name: query, calories: 0, protein: 0, carbs: 0, fat: 0, qty: Number(grams) })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">✦</span>
          <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Décrire un aliment</p>
          <button onClick={onClose} className="ml-auto text-sm" style={{ color: 'var(--text-faint)' }}>✕</button>
        </div>
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Ex: riz complet cuit, poulet grillé, banane..."
          autoFocus
          className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none mb-3"
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}/>
        <div className="flex items-center gap-2 mb-3">
          <label className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Quantité</label>
          <input type="number" value={grams} onChange={e => setGrams(e.target.value)} min="1"
            className="w-20 px-3 py-2 rounded-xl text-sm font-bold focus:outline-none"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}/>
          <span className="text-sm font-bold" style={{ color: 'var(--text-faint)' }}>g</span>
        </div>
        {error && <p className="text-xs mb-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>{error}</p>}
        <button onClick={handleSearch} disabled={loading || !query.trim()}
          className="w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, var(--accent), #c42840)' }}>
          {loading ? 'Analyse en cours…' : '✦ Analyser avec l\'IA'}
        </button>
      </div>
    </div>
  )
}

/* ── Constantes ─────────────────────────────────────────── */
const MEAL_PRESETS = [
  { name:'Petit-déjeuner',    icon:'🌅' },
  { name:'Déjeuner',          icon:'☀️' },
  { name:'Collation',         icon:'🍎' },
  { name:'Dîner',             icon:'🌙' },
  { name:'Pré-entraînement',  icon:'⚡' },
  { name:'Post-entraînement', icon:'💪' },
]
const MACRO_COLORS = { calories:'#e8a020', protein:'#a03848', carbs:'#3a52a8', fat:'#1e6b2e' }

function todayStr() { return new Date().toISOString().slice(0,10) }
function fmtDate(d) {
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })
}
function addDays(d, n) {
  const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate()+n)
  return dt.toISOString().slice(0,10)
}

async function fetchFoodByBarcode(barcode) {
  try {
    const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await res.json()
    if (data.status !== 1) return null
    const n = data.product.nutriments || {}
    return {
      name:     data.product.product_name || data.product.product_name_fr || '',
      calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
      protein:  Math.round((n.proteins_100g        || 0) * 10) / 10,
      carbs:    Math.round((n.carbohydrates_100g   || 0) * 10) / 10,
      fat:      Math.round((n.fat_100g             || 0) * 10) / 10,
    }
  } catch { return null }
}

/* ── MacroRing : anneau de progression ─────────────────── */
function MacroRing({ label, actual, goal, color, unit='g' }) {
  const pct  = goal > 0 ? Math.min(100, Math.round(actual / goal * 100)) : 0
  const r    = 30
  const circ = 2 * Math.PI * r
  const dash = circ * pct / 100

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div className="relative" style={{width:72,height:72}}>
        <svg width="72" height="72" style={{transform:'rotate(-90deg)'}}>
          <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6"
            stroke="var(--border)" />
          <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6"
            stroke={color}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{transition:'stroke-dasharray 0.5s ease'}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-black leading-none" style={{color}}>{pct}%</span>
        </div>
      </div>
      <p className="text-[10px] font-black tracking-widest uppercase text-center" style={{color}}>{label}</p>
      <p className="text-[10px] text-center" style={{color:'var(--text-faint)'}}>
        <span className="font-black" style={{color:'var(--text-secondary)'}}>{actual}</span>
        {goal > 0 && <span>/{goal}{unit}</span>}
      </p>
    </div>
  )
}

/* ── FoodItemRow ────────────────────────────────────────── */
function FoodItemRow({ item, onChange, onRemove }) {
  const [expanded,      setExpanded]      = useState(false)
  const [scanning,      setScanning]      = useState(false)
  const [barcodeInput,  setBarcodeInput]  = useState(false)
  const [barcodeVal,    setBarcodeVal]    = useState('')
  const [scanError,     setScanError]     = useState('')
  const cameraRef = useRef()

  const calcCal = () => {
    if (!item.qty || !item.calories) return null
    return Math.round(Number(item.calories) * Number(item.qty) / 100)
  }

  const handleCapture = async e => {
    const file = e.target.files[0]; if (!file) return
    setScanning(true); setScanError('')
    try {
      if ('BarcodeDetector' in window) {
        const bmp  = await createImageBitmap(file)
        const det  = new window.BarcodeDetector({ formats:['ean_13','ean_8','upc_a','upc_e','code_128'] })
        const codes = await det.detect(bmp)
        if (!codes.length) { setScanError('Code non détecté'); setScanning(false); return }
        const food = await fetchFoodByBarcode(codes[0].rawValue)
        if (food) onChange({...item, name:food.name||item.name, calories:food.calories, protein:food.protein, carbs:food.carbs, fat:food.fat})
        else { setScanError('Produit introuvable'); setBarcodeInput(true) }
      } else { setBarcodeInput(true) }
    } catch { setScanError('Erreur lecture') }
    setScanning(false)
  }

  const handleManual = async () => {
    if (!barcodeVal.trim()) return
    setScanning(true); setScanError('')
    const food = await fetchFoodByBarcode(barcodeVal.trim())
    setScanning(false)
    if (food) { onChange({...item, name:food.name||item.name, calories:food.calories, protein:food.protein, carbs:food.carbs, fat:food.fat}); setBarcodeInput(false); setBarcodeVal('') }
    else setScanError('Produit introuvable')
  }

  const cal = calcCal()

  return (
    <div className="rounded-xl mb-1.5 overflow-hidden"
      style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Scan */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={handleCapture}/>
        <button onClick={()=>cameraRef.current?.click()} disabled={scanning}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm transition"
          style={{background:'rgba(58,82,168,0.1)',color:'#3a52a8'}}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(58,82,168,0.2)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(58,82,168,0.1)'}>
          {scanning ? '⏳' : '📷'}
        </button>
        {/* Nom */}
        <input value={item.name} onChange={e=>onChange({...item,name:e.target.value})}
          placeholder="Aliment..."
          className="flex-1 text-sm font-medium focus:outline-none bg-transparent min-w-0"
          style={{color:'var(--text-primary)'}}/>
        {/* Quantité */}
        <div className="flex items-center flex-shrink-0">
          <input type="number" min="0" value={item.qty} onChange={e=>onChange({...item,qty:e.target.value})}
            placeholder="0"
            className="text-sm font-black focus:outline-none text-right px-2 py-1 rounded-l-lg"
            style={{width:52,background:'var(--bg-base)',border:'1px solid var(--border)',borderRight:'none',color:'var(--text-primary)'}}/>
          <span className="text-xs font-bold px-2 py-1 rounded-r-lg"
            style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-faint)'}}>g</span>
        </div>
        {/* Calories calculées */}
        {cal !== null && (
          <span className="text-sm font-black flex-shrink-0 min-w-[50px] text-right" style={{color:'#e8a020'}}>
            {cal} <span className="text-[9px] font-medium">kcal</span>
          </span>
        )}
        {/* Expand macros */}
        <button onClick={()=>setExpanded(o=>!o)}
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-[10px]"
          style={{color:expanded?'#3a52a8':'var(--text-faint)'}}>
          {expanded?'▴':'▾'}
        </button>
        {/* Supprimer */}
        <button onClick={onRemove}
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs"
          style={{color:'var(--text-faint)'}}
          onMouseEnter={e=>e.currentTarget.style.color='#a03848'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>✕</button>
      </div>

      {/* Macros /100g */}
      {expanded && (
        <div className="px-3 pb-3 grid grid-cols-4 gap-2" style={{borderTop:'1px solid var(--border)'}}>
          {[
            {k:'calories',label:'kcal/100g',color:'#e8a020'},
            {k:'protein', label:'Prot/100g', color:MACRO_COLORS.protein},
            {k:'carbs',   label:'Gluc/100g', color:MACRO_COLORS.carbs},
            {k:'fat',     label:'Lip/100g',  color:MACRO_COLORS.fat},
          ].map(({k,label,color})=>(
            <div key={k} className="pt-2">
              <p className="text-[9px] font-bold mb-1" style={{color}}>{label}</p>
              <input type="number" min="0" value={item[k]||''} onChange={e=>onChange({...item,[k]:e.target.value})}
                placeholder="0"
                className="w-full px-2 py-1.5 rounded-lg text-xs font-bold focus:outline-none"
                style={{background:`${color}12`,border:`1px solid ${color}30`,color}}/>
            </div>
          ))}
        </div>
      )}

      {/* Scan manuel */}
      {barcodeInput && (
        <div className="px-3 pb-3 flex gap-2 items-center" style={{borderTop:'1px solid var(--border)'}}>
          <span className="text-xs flex-shrink-0" style={{color:'var(--text-faint)'}}>Code EAN :</span>
          <input value={barcodeVal} onChange={e=>setBarcodeVal(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleManual()}
            placeholder="3017620422003"
            className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono focus:outline-none"
            style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-primary)'}}
            autoFocus/>
          <button onClick={handleManual} disabled={scanning}
            className="px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{background:'#3a52a8',color:'#fff'}}>OK</button>
          <button onClick={()=>{setBarcodeInput(false);setScanError('')}}
            className="px-2 py-1.5 rounded-lg text-xs"
            style={{background:'var(--bg-base)',color:'var(--text-faint)'}}>✕</button>
        </div>
      )}
      {scanError && (
        <p className="px-3 pb-2 text-xs" style={{color:'#a03848'}}>{scanError}</p>
      )}
    </div>
  )
}

/* ── MealSection ────────────────────────────────────────── */
function MealSection({ meal, onChange, onRemove }) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAI, setShowAI]       = useState(false)
  const items = meal.items || []

  const addItem  = () => onChange({...meal, items:[...items,{id:uuidv4(),name:'',qty:'',calories:'',protein:'',carbs:'',fat:''}]})
  const updItem  = (i,u) => { const a=[...items]; a[i]=u; onChange({...meal,items:a}) }
  const remItem  = (i)   => onChange({...meal, items:items.filter((_,idx)=>idx!==i)})
  const addAIItem = (food) => { setShowAI(false); onChange({...meal, items:[...items, { id: uuidv4(), name: food.name, qty: String(food.qty||100), calories: String(food.calories||0), protein: String(food.protein||0), carbs: String(food.carbs||0), fat: String(food.fat||0) }]}) }

  const mealCal = items.reduce((s,it)=> s + (it.qty&&it.calories ? Math.round(Number(it.calories)*Number(it.qty)/100) : 0), 0)
  const mealPro = items.reduce((s,it)=> s + (it.qty&&it.protein  ? Math.round(Number(it.protein) *Number(it.qty)/100*10)/10 : 0), 0)

  return (
    <div className="rounded-2xl overflow-hidden mb-3"
      style={{border:'1px solid var(--border)',background:'var(--bg-card)'}}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 cursor-pointer"
        style={{borderBottom: collapsed ? 'none' : '1px solid var(--border)', background:'var(--bg-card-2)'}}
        onClick={()=>setCollapsed(o=>!o)}>
        <span className="text-lg flex-shrink-0">{meal.icon||'🍽️'}</span>
        <span className="font-black text-sm flex-1" style={{color:'var(--text-primary)'}}>{meal.name}</span>
        {mealCal > 0 && (
          <span className="text-xs font-black" style={{color:'#e8a020'}}>{mealCal} kcal</span>
        )}
        {mealPro > 0 && (
          <span className="text-xs font-bold ml-1" style={{color:MACRO_COLORS.protein}}>{mealPro}g P</span>
        )}
        <span className="text-xs ml-2" style={{color:'var(--text-faint)'}}>{collapsed?'▼':'▲'}</span>
        <button onClick={e=>{e.stopPropagation();onRemove()}}
          className="w-6 h-6 rounded flex items-center justify-center text-xs ml-1"
          style={{color:'var(--text-faint)'}}
          onMouseEnter={e=>e.currentTarget.style.color='#a03848'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>✕</button>
      </div>
      {!collapsed && (
        <div className="p-3">
          {items.map((it,i)=>(
            <FoodItemRow key={it.id} item={it}
              onChange={u=>updItem(i,u)}
              onRemove={()=>remItem(i)}/>
          ))}
          {showAI && <AIFoodSearch onResult={addAIItem} onClose={() => setShowAI(false)}/>}
          <div className="flex gap-2 mt-1">
            <button onClick={addItem}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
              style={{border:'2px dashed var(--border)',color:'var(--text-faint)',background:'transparent'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-faint)'}}>
              + Ajouter
            </button>
            <button onClick={() => setShowAI(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-1.5"
              style={{background:'rgba(160,56,72,0.1)',color:'var(--accent)',border:'1px solid rgba(160,56,72,0.2)'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(160,56,72,0.2)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(160,56,72,0.1)'}>
              ✦ IA
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Page principale ─────────────────────────────────────── */
export default function ClientNutritionTracker() {
  const { fetchNutritionLog, saveNutritionLog, user } = useStore()
  const [date,    setDate]    = useState(todayStr)
  const [meals,   setMeals]   = useState([])
  const [goals,   setGoals]   = useState({ calories:2000, protein:150, carbs:220, fat:70 })
  const [syncStatus, setSyncStatus] = useState('idle') // idle | saving | saved | error
  const [showMealPicker, setShowMealPicker] = useState(false)
  const [customMeal, setCustomMeal] = useState('')
  const [loading, setLoading] = useState(true)
  const saveTimer = useRef(null)

  // Charger le log à chaque changement de date
  useEffect(() => {
    setLoading(true)
    fetchNutritionLog(date).then(data => {
      setMeals(data.meals || [])
      if (data.goals) setGoals(data.goals)
      setLoading(false)
    })
  }, [date])

  // Auto-save (debounced 1.2s)
  const autoSave = useCallback((newMeals) => {
    clearTimeout(saveTimer.current)
    setSyncStatus('saving')
    saveTimer.current = setTimeout(async () => {
      const res = await saveNutritionLog(date, newMeals)
      setSyncStatus(res.success ? 'saved' : 'error')
      if (res.success) setTimeout(() => setSyncStatus('idle'), 3000)
    }, 1200)
  }, [date, saveNutritionLog])

  const updateMeals = (newMeals) => {
    setMeals(newMeals)
    autoSave(newMeals)
  }

  const addMeal = (name, icon) => {
    const m = { id:uuidv4(), name, icon, items:[] }
    updateMeals([...meals, m])
    setShowMealPicker(false)
    setCustomMeal('')
  }
  const updateMeal = (i, m) => { const a=[...meals]; a[i]=m; updateMeals(a) }
  const removeMeal = (i)   => updateMeals(meals.filter((_,idx)=>idx!==i))

  // Totaux du jour
  const totals = meals.reduce((acc, meal) => {
    ;(meal.items||[]).forEach(it => {
      const f = it.qty ? Number(it.qty)/100 : 0
      acc.calories += Math.round((Number(it.calories)||0) * f)
      acc.protein  += Math.round((Number(it.protein) ||0) * f * 10)/10
      acc.carbs    += Math.round((Number(it.carbs)   ||0) * f * 10)/10
      acc.fat      += Math.round((Number(it.fat)     ||0) * f * 10)/10
    })
    return acc
  }, {calories:0, protein:0, carbs:0, fat:0})

  const syncBadge = {
    saving: { label:'Sauvegarde...', color:'#e8a020', dot:'#e8a020' },
    saved:  { label:'Synchronisé ✓', color:'#27ae60', dot:'#27ae60' },
    error:  { label:'Erreur sync',   color:'#a03848', dot:'#a03848' },
    idle:   { label:'Auto-save actif', color:'var(--text-faint)', dot:'var(--accent)' },
  }[syncStatus]

  return (
    <div className="min-h-screen" style={{background:'var(--bg-base)'}}>
      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{background:'var(--bg-base)',borderBottom:'1px solid var(--border)',backdropFilter:'blur(12px)'}}>
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{color:'var(--gold)'}}>Nutrition</p>
          <h1 className="text-lg font-black leading-tight" style={{color:'var(--text-primary)'}}>Mon Tracker</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:syncBadge.dot}}/>
          <span className="text-xs" style={{color:syncBadge.color}}>{syncBadge.label}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-24">

        {/* ── Date picker ──────────────────────────────── */}
        <div className="flex items-center justify-center gap-4 py-5">
          <button onClick={()=>setDate(d=>addDays(d,-1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold transition"
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-muted)'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>‹</button>
          <div className="text-center">
            <p className="text-lg font-black capitalize" style={{color:'var(--text-primary)'}}>{fmtDate(date)}</p>
            {date === todayStr() && <p className="text-xs font-bold" style={{color:'var(--accent)'}}>Aujourd'hui</p>}
          </div>
          <button onClick={()=>setDate(d=>addDays(d,1))} disabled={date >= todayStr()}
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold transition disabled:opacity-30"
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-muted)'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>›</button>
        </div>

        {/* ── Anneaux macro ─────────────────────────────── */}
        <div className="rounded-2xl p-4 mb-6" style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
          <div className="flex gap-2 mb-3">
            <MacroRing label="Calories" actual={totals.calories} goal={goals.calories} color={MACRO_COLORS.calories} unit=" kcal"/>
            <MacroRing label="Protéines" actual={totals.protein}  goal={goals.protein}  color={MACRO_COLORS.protein}/>
            <MacroRing label="Glucides"  actual={totals.carbs}    goal={goals.carbs}    color={MACRO_COLORS.carbs}/>
            <MacroRing label="Lipides"   actual={totals.fat}      goal={goals.fat}      color={MACRO_COLORS.fat}/>
          </div>
          {/* Barre calorique globale */}
          {goals.calories > 0 && (
            <div>
              <div className="flex justify-between text-[10px] mb-1" style={{color:'var(--text-faint)'}}>
                <span>{totals.calories} kcal consommées</span>
                <span>{Math.max(0, goals.calories - totals.calories)} kcal restantes</span>
              </div>
              <div className="rounded-full overflow-hidden h-2.5" style={{background:'var(--border)'}}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width:`${Math.min(100, totals.calories/goals.calories*100)}%`,
                    background: totals.calories > goals.calories
                      ? 'linear-gradient(90deg,#e8a020,#a03848)'
                      : 'linear-gradient(90deg,#e8a020,#d4af37)',
                  }}/>
              </div>
              {goals.setBy && (
                <p className="text-[9px] mt-1.5 text-right" style={{color:'var(--text-faint)'}}>
                  Objectifs définis par votre coach
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Repas ─────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{borderColor:'var(--border)',borderTopColor:'var(--accent)'}}/>
          </div>
        ) : (
          <>
            {meals.map((meal,i)=>(
              <MealSection key={meal.id} meal={meal}
                onChange={m=>updateMeal(i,m)}
                onRemove={()=>removeMeal(i)}/>
            ))}

            {/* Ajouter un repas */}
            {showMealPicker ? (
              <div className="rounded-2xl p-4 mb-3" style={{border:'1px solid var(--accent)',background:'var(--bg-card)'}}>
                <p className="text-xs font-black tracking-widest uppercase mb-3" style={{color:'var(--accent)'}}>Ajouter un repas</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {MEAL_PRESETS.filter(p=>!meals.find(m=>m.name===p.name)).map(p=>(
                    <button key={p.name} onClick={()=>addMeal(p.name,p.icon)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition text-left"
                      style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-primary)'}}
                      onMouseEnter={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.color='#fff'}}
                      onMouseLeave={e=>{e.currentTarget.style.background='var(--bg-base)';e.currentTarget.style.color='var(--text-primary)'}}>
                      <span className="text-lg">{p.icon}</span>{p.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={customMeal} onChange={e=>setCustomMeal(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&customMeal.trim()&&addMeal(customMeal.trim(),'🍽️')}
                    placeholder="Nom personnalisé..."
                    className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none"
                    style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
                  <button onClick={()=>customMeal.trim()&&addMeal(customMeal.trim(),'🍽️')}
                    className="px-4 py-2 rounded-xl text-sm font-bold"
                    style={{background:'var(--accent)',color:'#fff'}}>+</button>
                  <button onClick={()=>setShowMealPicker(false)}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{background:'var(--bg-base)',color:'var(--text-faint)',border:'1px solid var(--border)'}}>✕</button>
                </div>
              </div>
            ) : (
              <button onClick={()=>setShowMealPicker(true)}
                className="w-full py-4 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2"
                style={{border:'2px dashed var(--border)',color:'var(--text-faint)',background:'transparent'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-faint)'}}>
                <span className="text-xl">+</span> Ajouter un repas
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
