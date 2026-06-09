import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'

const MACRO_COLORS = { calories:'#e8a020', protein:'#a03848', carbs:'#3a52a8', fat:'#1e6b2e' }

function todayStr() { return new Date().toISOString().slice(0,10) }
function fmtDate(d) {
  const dt = new Date(d+'T12:00:00')
  return dt.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})
}
function addDays(d,n) {
  const dt=new Date(d+'T12:00:00'); dt.setDate(dt.getDate()+n)
  return dt.toISOString().slice(0,10)
}

/* ── Barre macro objectif vs réalisé ──────────────────── */
function MacroBar({ label, actual, goal, color, unit='g' }) {
  const pct    = goal > 0 ? Math.min(100, Math.round(actual/goal*100)) : 0
  const over   = actual > goal && goal > 0
  const status = pct >= 90 ? '✓' : pct >= 60 ? '~' : '✗'
  const statusColor = pct >= 90 ? '#27ae60' : pct >= 60 ? '#e8a020' : '#a03848'

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:color}}/>
          <span className="text-sm font-black" style={{color:'var(--text-primary)'}}>{label}</span>
          <span className="text-sm font-black" style={{color:statusColor}}>{status}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-black" style={{color: over ? '#a03848' : color}}>{actual}{unit}</span>
          <span style={{color:'var(--text-faint)'}}>/ {goal}{unit}</span>
          <span className="px-1.5 py-0.5 rounded font-bold text-[10px]"
            style={{background:`${over?'#a03848':color}18`, color: over?'#a03848':color}}>
            {pct}%
          </span>
        </div>
      </div>
      <div className="rounded-full overflow-hidden h-3" style={{background:'var(--border)'}}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{width:`${pct}%`, background: over ? 'linear-gradient(90deg,'+color+',#a03848)' : color}}/>
      </div>
    </div>
  )
}

/* ── Modal objectifs ──────────────────────────────────── */
function GoalsModal({ goals, clientName, onSave, onClose }) {
  const [vals, setVals] = useState({
    calories: goals?.calories || 2000,
    protein:  goals?.protein  || 150,
    carbs:    goals?.carbs    || 220,
    fat:      goals?.fat      || 70,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:'rgba(0,0,0,0.6)'}}>
      <div className="rounded-2xl p-6 w-full max-w-sm"
        style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
        <h2 className="text-lg font-black mb-1" style={{color:'var(--text-primary)'}}>Objectifs Nutrition</h2>
        <p className="text-sm mb-5" style={{color:'var(--text-secondary)'}}>Pour {clientName}</p>
        <div className="space-y-3">
          {[
            {k:'calories',label:'Calories (kcal/jour)',color:'#e8a020'},
            {k:'protein', label:'Protéines (g/jour)',   color:MACRO_COLORS.protein},
            {k:'carbs',   label:'Glucides (g/jour)',    color:MACRO_COLORS.carbs},
            {k:'fat',     label:'Lipides (g/jour)',     color:MACRO_COLORS.fat},
          ].map(({k,label,color})=>(
            <div key={k}>
              <label className="block text-xs font-bold mb-1" style={{color}}>{label}</label>
              <input type="number" min="0" value={vals[k]}
                onChange={e=>setVals(v=>({...v,[k]:Number(e.target.value)}))}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-bold focus:outline-none"
                style={{background:`${color}10`,border:`1px solid ${color}30`,color:'var(--text-primary)'}}/>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={()=>onSave(vals)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{background:'var(--accent)'}}>Enregistrer</button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{background:'var(--bg-base)',color:'var(--text-muted)',border:'1px solid var(--border)'}}>Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ── Log repas lecture seule ──────────────────────────── */
function ReadOnlyLog({ meals, goals }) {
  if (!meals || meals.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{border:'2px dashed var(--border)'}}>
        <div className="text-4xl mb-3">🍽️</div>
        <p className="font-black text-sm" style={{color:'var(--text-primary)'}}>Aucun repas enregistré</p>
        <p className="text-xs mt-1" style={{color:'var(--text-faint)'}}>Le client n'a pas encore saisi son alimentation pour ce jour</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {meals.map(meal => {
        const mealCal = (meal.items||[]).reduce((s,it)=>
          s+(it.qty&&it.calories?Math.round(Number(it.calories)*Number(it.qty)/100):0), 0)
        return (
          <div key={meal.id} className="rounded-2xl overflow-hidden"
            style={{border:'1px solid var(--border)',background:'var(--bg-card)'}}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{borderBottom:'1px solid var(--border)',background:'var(--bg-card-2)'}}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{meal.icon||'🍽️'}</span>
                <span className="font-black text-sm" style={{color:'var(--text-primary)'}}>{meal.name}</span>
              </div>
              {mealCal > 0 && <span className="font-black text-sm" style={{color:'#e8a020'}}>{mealCal} kcal</span>}
            </div>
            <div className="divide-y" style={{borderColor:'var(--border)'}}>
              {(meal.items||[]).map(item => {
                const cal = item.qty && item.calories ? Math.round(Number(item.calories)*Number(item.qty)/100) : null
                const pro = item.qty && item.protein  ? Math.round(Number(item.protein) *Number(item.qty)/100*10)/10 : null
                return (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm font-medium" style={{color:'var(--text-primary)'}}>{item.name||'—'}</span>
                    <div className="flex items-center gap-3 text-xs flex-shrink-0">
                      {item.qty && <span className="font-bold" style={{color:'var(--text-secondary)'}}>{item.qty}g</span>}
                      {cal !== null && <span className="font-black" style={{color:'#e8a020'}}>{cal} kcal</span>}
                      {pro !== null && <span className="font-bold" style={{color:MACRO_COLORS.protein}}>{pro}g P</span>}
                    </div>
                  </div>
                )
              })}
              {(!meal.items||meal.items.length===0) && (
                <p className="px-4 py-3 text-xs italic" style={{color:'var(--text-faint)'}}>Aucun aliment</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Page principale Coach ──────────────────────────────── */
export default function CoachNutritionMonitor() {
  const { fetchCoachClients, fetchClientNutrition, setClientGoals, token } = useStore()
  const [clients,     setClients]     = useState([])
  const [clientId,    setClientId]    = useState('')
  const [date,        setDate]        = useState(todayStr)
  const [data,        setData]        = useState(null)   // { meals, goals, updatedAt, client }
  const [loading,     setLoading]     = useState(false)
  const [liveStatus,  setLiveStatus]  = useState('idle') // idle | live | reconnecting
  const [lastUpdated, setLastUpdated] = useState(null)
  const [showGoals,   setShowGoals]   = useState(false)
  const sseRef = useRef(null)

  // Charger clients au montage
  useEffect(() => {
    fetchCoachClients().then(list => {
      setClients(list)
      if (list.length > 0 && !clientId) setClientId(list[0].id)
    })
  }, [])

  // Ouvrir SSE quand clientId ou date change
  useEffect(() => {
    if (!clientId || !token) return
    // Fermer ancienne connexion
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null }

    // Chargement initial
    setLoading(true)
    fetchClientNutrition(clientId, date).then(d => {
      if (d) { setData(d); setLastUpdated(new Date()) }
      setLoading(false)
    })

    // SSE pour mises à jour live
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
    const es = new EventSource(
      `${base}/coach/clients/${clientId}/nutrition/stream?date=${date}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    es.onopen    = () => setLiveStatus('live')
    es.onmessage = e => {
      try {
        const payload = JSON.parse(e.data)
        setData(prev => prev ? {...prev, meals:payload.meals, goals:payload.goals, updatedAt:payload.updatedAt} : payload)
        setLastUpdated(new Date())
      } catch {}
    }
    es.onerror = () => setLiveStatus('reconnecting')
    sseRef.current = es

    return () => { es.close(); sseRef.current = null; setLiveStatus('idle') }
  }, [clientId, date, token])

  const handleSaveGoals = async (vals) => {
    await setClientGoals(clientId, vals)
    setData(prev => prev ? {...prev, goals:{...vals, setBy:'coach'}} : prev)
    setShowGoals(false)
  }

  // Totaux
  const meals  = data?.meals  || []
  const goals  = data?.goals  || { calories:2000, protein:150, carbs:220, fat:70 }
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

  const liveColor = { live:'#27ae60', reconnecting:'#e8a020', idle:'var(--text-faint)' }[liveStatus]

  const selectedClient = clients.find(c=>c.id===clientId)

  return (
    <div className="min-h-screen" style={{background:'var(--bg-base)'}}>
      {/* ── Top bar ────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between flex-wrap gap-3"
        style={{background:'var(--bg-base)',borderBottom:'1px solid var(--border)',backdropFilter:'blur(12px)'}}>
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{color:'var(--gold)'}}>Coach</p>
          <h1 className="text-xl font-black" style={{color:'var(--text-primary)'}}>Suivi Nutrition</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sélecteur client */}
          <div className="relative">
            <select value={clientId} onChange={e=>setClientId(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-bold focus:outline-none appearance-none pr-8 cursor-pointer"
              style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)',minWidth:160}}>
              {clients.length === 0 && <option value="">Aucun client</option>}
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{color:'var(--text-faint)'}}>▾</span>
          </div>
          {/* Badge live */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:liveColor,
              boxShadow: liveStatus==='live' ? `0 0 6px ${liveColor}` : 'none',
              animation: liveStatus==='live' ? 'pulse 2s infinite' : 'none'}}/>
            <span className="text-xs font-bold" style={{color:liveColor}}>
              {liveStatus==='live' ? 'En direct' : liveStatus==='reconnecting' ? 'Reconnexion...' : 'Hors ligne'}
            </span>
            {lastUpdated && (
              <span className="text-[10px]" style={{color:'var(--text-faint)'}}>
                · màj {lastUpdated.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* ── Date picker ──────────────────────────────── */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={()=>setDate(d=>addDays(d,-1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold transition"
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-muted)'}}>‹</button>
          <p className="text-base font-black capitalize" style={{color:'var(--text-primary)'}}>{fmtDate(date)}</p>
          <button onClick={()=>setDate(d=>addDays(d,1))} disabled={date>=todayStr()}
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold disabled:opacity-30 transition"
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-muted)'}}>›</button>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">👥</div>
            <h2 className="text-xl font-black mb-2" style={{color:'var(--text-primary)'}}>Aucun client</h2>
            <p className="text-sm" style={{color:'var(--text-secondary)'}}>Vos clients apparaîtront ici dès qu'ils s'inscriront.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{borderColor:'var(--border)',borderTopColor:'var(--accent)'}}/>
          </div>
        ) : (
          <>
            {/* ── Objectifs vs Réalisé ──────────────────── */}
            <div className="rounded-2xl p-5 mb-5" style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-black text-base" style={{color:'var(--text-primary)'}}>
                    Objectifs vs Réalisé
                  </h2>
                  <p className="text-xs" style={{color:'var(--text-secondary)'}}>
                    {selectedClient?.name}
                  </p>
                </div>
                <button onClick={()=>setShowGoals(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  style={{background:'var(--accent-subtle)',color:'var(--accent)',border:'1px solid var(--accent)'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.color='#fff'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='var(--accent-subtle)';e.currentTarget.style.color='var(--accent)'}}>
                  ✎ Modifier les objectifs
                </button>
              </div>
              <MacroBar label="Calories"  actual={totals.calories} goal={goals.calories} color={MACRO_COLORS.calories} unit=" kcal"/>
              <MacroBar label="Protéines" actual={totals.protein}  goal={goals.protein}  color={MACRO_COLORS.protein}/>
              <MacroBar label="Glucides"  actual={totals.carbs}    goal={goals.carbs}    color={MACRO_COLORS.carbs}/>
              <MacroBar label="Lipides"   actual={totals.fat}      goal={goals.fat}      color={MACRO_COLORS.fat}/>

              {/* Score global */}
              {goals.calories > 0 && (() => {
                const score = Math.round((
                  Math.min(1, totals.calories/goals.calories) * 0.4 +
                  Math.min(1, totals.protein /goals.protein ) * 0.3 +
                  Math.min(1, totals.carbs   /goals.carbs  ) * 0.2 +
                  Math.min(1, totals.fat     /goals.fat    ) * 0.1
                ) * 100)
                const scoreColor = score >= 85 ? '#27ae60' : score >= 60 ? '#e8a020' : '#a03848'
                const scoreLabel = score >= 85 ? '✓ Excellente journée' : score >= 60 ? '~ En bonne voie' : '✗ Objectifs non atteints'
                return (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl mt-3"
                    style={{background:`${scoreColor}10`,border:`1px solid ${scoreColor}30`}}>
                    <span className="font-black text-sm" style={{color:scoreColor}}>{scoreLabel}</span>
                    <span className="text-2xl font-black" style={{color:scoreColor}}>{score}%</span>
                  </div>
                )
              })()}
            </div>

            {/* ── Log des repas ─────────────────────────── */}
            <div>
              <h3 className="text-sm font-black tracking-widest uppercase mb-3" style={{color:'var(--text-muted)'}}>
                Repas du jour
              </h3>
              <ReadOnlyLog meals={meals} goals={goals}/>
            </div>
          </>
        )}
      </div>

      {/* ── Modal objectifs ──────────────────────────── */}
      {showGoals && selectedClient && (
        <GoalsModal
          goals={goals}
          clientName={selectedClient.name}
          onSave={handleSaveGoals}
          onClose={()=>setShowGoals(false)}/>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
