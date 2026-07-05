import { useState, useEffect, useRef } from 'react'

const MACRO_COLORS = { protein: '#a03848', carbs: '#3a52a8', fat: '#1e6b2e' }

export async function fetchFoodByBarcode(barcode) {
  try {
    const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await res.json()
    if (data.status !== 1) return null
    const p = data.product
    const n = p.nutriments || {}
    // kcal directes, sinon conversion depuis kJ
    const kcal = n['energy-kcal_100g'] || n['energy-kcal'] || (n.energy_100g ? n.energy_100g / 4.184 : 0)
    return {
      name:     p.product_name_fr || p.product_name || '',
      brand:    p.brands ? String(p.brands).split(',')[0].trim() : '',
      image:    p.image_front_small_url || p.image_front_url || '',
      serving:  Number(p.serving_quantity) || null, // grammes par portion si connu
      calories: Math.round(kcal),
      protein:  Math.round((n.proteins_100g        || 0) * 10) / 10,
      carbs:    Math.round((n.carbohydrates_100g   || 0) * 10) / 10,
      fat:      Math.round((n.fat_100g             || 0) * 10) / 10,
    }
  } catch { return null }
}

/* ── Scanner code-barres plein écran (style MyFitnessPal) ──
   Caméra live via ZXing (lazy-loadé) : fonctionne sur iOS Safari,
   contrairement à BarcodeDetector. Fallback saisie manuelle.
   onAdd reçoit { name, qty, per100:{...}, total:{...} } — chaque
   page mappe vers son modèle (per-100g ou totaux). */
export default function BarcodeScannerModal({ onAdd, onClose }) {
  const [phase, setPhase]       = useState('scan')   // scan | loading | product | notfound
  const [food, setFood]         = useState(null)
  const [qty, setQty]           = useState('100')
  const [camError, setCamError] = useState('')
  const [manualVal, setManualVal] = useState('')
  const videoRef    = useRef(null)
  const controlsRef = useRef(null)
  const busyRef     = useRef(false)

  const stopCamera = () => {
    try { controlsRef.current?.stop() } catch {}
    controlsRef.current = null
  }

  const lookup = async (code) => {
    if (busyRef.current) return
    busyRef.current = true
    stopCamera()
    if (navigator.vibrate) navigator.vibrate(60)
    setPhase('loading')
    const f = await fetchFoodByBarcode(String(code).trim())
    busyRef.current = false
    if (f && (f.calories || f.protein || f.carbs || f.fat)) {
      setFood(f)
      setQty(String(f.serving || 100))
      setPhase('product')
    } else {
      setPhase('notfound')
    }
  }

  // Démarre la caméra quand on est en phase scan
  useEffect(() => {
    if (phase !== 'scan') return
    let cancelled = false
    ;(async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (cancelled || !videoRef.current) return
        const reader = new BrowserMultiFormatReader()
        controlsRef.current = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          (result) => { if (result) lookup(result.getText()) }
        )
        if (cancelled) stopCamera()
      } catch {
        if (!cancelled) setCamError("Caméra indisponible — saisis le code-barres ci-dessous.")
      }
    })()
    return () => { cancelled = true; stopCamera() }
  }, [phase])

  const grams  = Number(qty) || 0
  const factor = grams / 100
  const calc   = food ? {
    calories: Math.round(food.calories * factor),
    protein:  Math.round(food.protein * factor * 10) / 10,
    carbs:    Math.round(food.carbs   * factor * 10) / 10,
    fat:      Math.round(food.fat     * factor * 10) / 10,
  } : null

  const confirm = () => {
    if (!food || !grams) return
    onAdd({
      name: food.brand ? `${food.name} (${food.brand})` : food.name,
      qty: grams,
      per100: { calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat },
      total:  calc,
    })
  }

  const chips = [...new Set([50, 100, 150, food?.serving].filter(Boolean))]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        style={{ width:'100%', maxWidth:480, maxHeight:'92dvh', overflowY:'auto', background:'var(--bg-card)',
                 borderRadius:'24px 24px 0 0', border:'1px solid var(--border)', borderBottom:'none' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{borderBottom:'1px solid var(--border)'}}>
          <span className="font-black text-base" style={{color:'var(--text-primary)'}}>📷 Scanner un aliment</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:14}}>✕</button>
        </div>

        {phase === 'scan' && (
          <div className="p-4">
            <div style={{ position:'relative', borderRadius:16, overflow:'hidden', background:'#000', aspectRatio:'4/3' }}>
              <video ref={videoRef} autoPlay muted playsInline
                style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              {/* Cadre de visée */}
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                <div style={{ width:'72%', height:'42%', border:'2.5px solid rgba(255,255,255,0.85)', borderRadius:14,
                              boxShadow:'0 0 0 2000px rgba(0,0,0,0.25)' }} />
              </div>
              {camError && (
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', padding:20, textAlign:'center', background:'rgba(0,0,0,0.75)', color:'#fff', fontSize:13, fontWeight:600 }}>
                  {camError}
                </div>
              )}
            </div>
            <p className="text-xs text-center mt-3" style={{color:'var(--text-muted)'}}>
              Vise le code-barres du produit — détection automatique
            </p>
            {/* Saisie manuelle */}
            <div className="flex gap-2 mt-4">
              <input value={manualVal} onChange={e=>setManualVal(e.target.value.replace(/\D/g,''))}
                inputMode="numeric" placeholder="ou saisis le code-barres…"
                className="flex-1 min-w-0 text-sm px-4 py-3 rounded-xl focus:outline-none"
                style={{background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-primary)'}}
                onKeyDown={e=>{ if(e.key==='Enter'&&manualVal.length>=8) lookup(manualVal) }} />
              <button onClick={()=>manualVal.length>=8&&lookup(manualVal)} disabled={manualVal.length<8}
                className="px-5 py-3 rounded-xl text-sm font-black disabled:opacity-40"
                style={{background:'var(--accent)', color:'#fff', border:'none'}}>OK</button>
            </div>
          </div>
        )}

        {phase === 'loading' && (
          <div className="p-10 flex flex-col items-center gap-3">
            <div className="skeleton" style={{width:64,height:64,borderRadius:16}} />
            <p className="text-sm font-bold" style={{color:'var(--text-secondary)'}}>Recherche du produit…</p>
          </div>
        )}

        {phase === 'notfound' && (
          <div className="p-8 text-center">
            <div style={{fontSize:40}}>🤷</div>
            <p className="font-black mt-2" style={{color:'var(--text-primary)'}}>Produit introuvable</p>
            <p className="text-xs mt-1 mb-5" style={{color:'var(--text-muted)'}}>Ce code-barres n'est pas dans la base Open Food Facts.</p>
            <button onClick={()=>{setManualVal('');setCamError('');setPhase('scan')}}
              className="px-6 py-3 rounded-xl text-sm font-black"
              style={{background:'var(--accent)', color:'#fff', border:'none'}}>↻ Re-scanner</button>
          </div>
        )}

        {phase === 'product' && food && (
          <div className="p-4">
            {/* Fiche produit */}
            <div className="flex items-center gap-3 p-3 rounded-2xl mb-4" style={{background:'var(--bg-base)', border:'1px solid var(--border)'}}>
              {food.image
                ? <img src={food.image} alt="" style={{width:64,height:64,objectFit:'contain',borderRadius:12,background:'#fff',flexShrink:0}} />
                : <div style={{width:64,height:64,borderRadius:12,background:'var(--bg-card-2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>🍽️</div>}
              <div style={{minWidth:0}}>
                <p className="font-black text-sm leading-tight" style={{color:'var(--text-primary)'}}>{food.name || 'Produit'}</p>
                {food.brand && <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>{food.brand}</p>}
                <p className="text-[11px] mt-1 font-bold" style={{color:'#e8a020'}}>{food.calories} kcal / 100g</p>
              </div>
            </div>

            {/* Quantité */}
            <label className="block text-[10px] font-black tracking-widest uppercase mb-2" style={{color:'var(--text-muted)'}}>Quantité (g)</label>
            <div className="flex gap-2 items-center mb-3">
              <input value={qty} onChange={e=>setQty(e.target.value.replace(/[^\d.]/g,''))}
                inputMode="decimal"
                className="w-24 text-center text-lg font-black px-3 py-3 rounded-xl focus:outline-none"
                style={{background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-primary)'}} />
              <div className="flex gap-1.5 flex-wrap">
                {chips.map(g => (
                  <button key={g} onClick={()=>setQty(String(g))}
                    className="px-3 py-2 rounded-lg text-xs font-bold"
                    style={{ background: Number(qty)===g ? 'var(--accent)' : 'var(--accent-subtle)',
                             color: Number(qty)===g ? '#fff' : 'var(--accent)', border:'none' }}>
                    {g === food.serving ? `1 portion (${g}g)` : `${g}g`}
                  </button>
                ))}
              </div>
            </div>

            {/* Macros calculées */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label:'kcal',  val: calc.calories, color:'#e8a020' },
                { label:'Prot',  val: calc.protein+'g',  color: MACRO_COLORS.protein },
                { label:'Gluc',  val: calc.carbs+'g',    color: MACRO_COLORS.carbs },
                { label:'Lip',   val: calc.fat+'g',      color: MACRO_COLORS.fat },
              ].map(m => (
                <div key={m.label} className="rounded-xl py-2.5 text-center" style={{background:'var(--bg-base)', border:'1px solid var(--border)'}}>
                  <p className="text-sm font-black" style={{color:m.color}}>{m.val}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wide" style={{color:'var(--text-faint)'}}>{m.label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={()=>{setFood(null);setManualVal('');setCamError('');setPhase('scan')}}
                className="px-4 py-3.5 rounded-xl text-sm font-bold"
                style={{background:'var(--bg-base)', color:'var(--text-secondary)', border:'1px solid var(--border)'}}>↻</button>
              <button onClick={confirm} disabled={!grams}
                className="flex-1 py-3.5 rounded-xl text-sm font-black disabled:opacity-40"
                style={{background:'var(--accent)', color:'#fff', border:'none'}}>
                Ajouter · {calc.calories} kcal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
