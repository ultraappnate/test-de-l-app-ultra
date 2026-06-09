import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'

// ─── Helpers ────────────────────────────────────────────
const MACRO_COLORS = { protein: '#e05a6b', carbs: '#e8a020', fat: '#4a90d9', fiber: '#27ae60' }
const MEAL_LABELS  = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Collation']
const MEAL_ICONS   = ['☀️', '🌤️', '🌙', '🍎']
const DAYS_SHORT   = ['L','M','M','J','V','S','D']

function fmt(n) { return Math.round(n || 0) }
function pct(v, t) { return t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0 }
function today() { return new Date().toISOString().split('T')[0] }
function dateLabel(d) {
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00'); d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// ─── SVG Donut ───────────────────────────────────────────
function DonutRing({ value, max, color, size = 120, stroke = 10, children }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * Math.min(1, (value || 0) / (max || 1))
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// ─── Mini Bar ────────────────────────────────────────────
function MacroBar({ label, value, max, color, unit = 'g' }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold" style={{ color }}>{label}</span>
        <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
          {fmt(value)}<span style={{ color: 'var(--text-faint)' }}>/{fmt(max)}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct(value, max)}%`, background: color }} />
      </div>
    </div>
  )
}

// ─── Water Tracker ───────────────────────────────────────
function WaterTracker({ glasses, setGlasses, goal = 8 }) {
  return (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>💧</span>
          <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Hydratation</span>
        </div>
        <span className="text-xs font-bold" style={{ color: 'var(--text-faint)' }}>{glasses}/{goal} verres</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: goal }).map((_, i) => (
          <button key={i} onClick={() => setGlasses(i < glasses ? i : i + 1)}
            className="w-8 h-8 rounded-lg text-sm transition-all duration-150 font-bold"
            style={{
              background: i < glasses ? 'rgba(74,144,217,0.2)' : 'var(--bg-base)',
              border: `1.5px solid ${i < glasses ? '#4a90d9' : 'var(--border)'}`,
              color: i < glasses ? '#4a90d9' : 'var(--text-faint)',
            }}>
            💧
          </button>
        ))}
      </div>
      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct(glasses, goal)}%`, background: '#4a90d9' }} />
      </div>
    </div>
  )
}

// ─── Streak Badge ────────────────────────────────────────
function StreakBadge({ streak }) {
  if (!streak) return null
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(232,160,32,0.12)', border: '1px solid rgba(232,160,32,0.3)' }}>
      <span className="text-lg">🔥</span>
      <div>
        <p className="text-xs font-black" style={{ color: '#e8a020' }}>{streak} jours</p>
        <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>de régularité</p>
      </div>
    </div>
  )
}

// ─── TAB 1 : VUE D'ENSEMBLE ─────────────────────────────
function TabOverview({ log, goals, glasses, setGlasses }) {
  const totalCal  = (log?.meals || []).reduce((s, m) => s + (m.foods || []).reduce((ss, f) => ss + (f.calories || 0), 0), 0)
  const totalProt = (log?.meals || []).reduce((s, m) => s + (m.foods || []).reduce((ss, f) => ss + (f.protein || 0), 0), 0)
  const totalCarb = (log?.meals || []).reduce((s, m) => s + (m.foods || []).reduce((ss, f) => ss + (f.carbs || 0), 0), 0)
  const totalFat  = (log?.meals || []).reduce((s, m) => s + (m.foods || []).reduce((ss, f) => ss + (f.fat || 0), 0), 0)
  const calGoal   = goals?.calories || 2000
  const protGoal  = goals?.protein  || 150
  const carbGoal  = goals?.carbs    || 220
  const fatGoal   = goals?.fat      || 65
  const remaining = Math.max(0, calGoal - totalCal)
  const mealCount = (log?.meals || []).filter(m => (m.foods || []).length > 0).length

  return (
    <div className="space-y-4">
      {/* Calories hero */}
      <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-6">
          <DonutRing value={totalCal} max={calGoal} color="var(--accent)" size={130} stroke={12}>
            <p className="text-xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>{fmt(totalCal)}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>kcal</p>
          </DonutRing>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Restantes</p>
              <p className="text-2xl font-black" style={{ color: remaining > 0 ? '#27ae60' : '#a03848' }}>{fmt(remaining)} kcal</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>🎯 Objectif: <b style={{ color: 'var(--text-primary)' }}>{fmt(calGoal)}</b></span>
              <span>🍽️ Repas: <b style={{ color: 'var(--text-primary)' }}>{mealCount}/4</b></span>
              <span>🔥 Dépensé: <b style={{ color: 'var(--text-primary)' }}>—</b></span>
              <span>📊 Progression: <b style={{ color: 'var(--accent)' }}>{pct(totalCal, calGoal)}%</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Macro rings */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'protein', label: 'Protéines', value: totalProt, goal: protGoal, color: MACRO_COLORS.protein, icon: '🥩' },
          { key: 'carbs',   label: 'Glucides',  value: totalCarb, goal: carbGoal, color: MACRO_COLORS.carbs,   icon: '🌾' },
          { key: 'fat',     label: 'Lipides',   value: totalFat,  goal: fatGoal,  color: MACRO_COLORS.fat,     icon: '🥑' },
        ].map(({ key, label, value, goal, color, icon }) => (
          <div key={key} className="p-3 rounded-2xl text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <DonutRing value={value} max={goal} color={color} size={72} stroke={7}>
              <p className="text-xs font-black leading-none" style={{ color }}>{fmt(value)}</p>
            </DonutRing>
            <p className="text-[11px] font-black mt-2" style={{ color: 'var(--text-primary)' }}>{icon} {label}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{fmt(goal)}g objectif</p>
          </div>
        ))}
      </div>

      {/* Résumé repas du jour */}
      <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>Repas du jour</p>
        <div className="space-y-2">
          {MEAL_LABELS.map((label, i) => {
            const meal = (log?.meals || [])[i] || { foods: [] }
            const cal  = (meal.foods || []).reduce((s, f) => s + (f.calories || 0), 0)
            const done = (meal.foods || []).length > 0
            return (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                style={{ background: 'var(--bg-base)', opacity: done ? 1 : 0.5 }}>
                <span className="text-lg">{MEAL_ICONS[i]}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                    {done ? `${(meal.foods||[]).length} aliment(s)` : 'Non renseigné'}
                  </p>
                </div>
                <span className="text-sm font-black" style={{ color: done ? 'var(--accent)' : 'var(--text-faint)' }}>
                  {done ? `${fmt(cal)} kcal` : '—'}
                </span>
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: done ? 'rgba(39,174,96,0.2)' : 'var(--border)', color: done ? '#27ae60' : 'var(--text-faint)' }}>
                  {done ? '✓' : '○'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Water + Streak */}
      <div className="grid grid-cols-2 gap-3">
        <WaterTracker glasses={glasses} setGlasses={setGlasses} />
        <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>🏆 Régularité</p>
          <StreakBadge streak={7} />
          <p className="text-xs mt-3" style={{ color: 'var(--text-faint)' }}>7 jours consécutifs de suivi</p>
          <div className="flex gap-1 mt-2">
            {DAYS_SHORT.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-1.5 rounded-full" style={{ background: i < 5 ? '#27ae60' : 'var(--border)' }} />
                <span className="text-[9px]" style={{ color: 'var(--text-faint)' }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TAB 2 : JOURNAL ────────────────────────────────────
function AddFoodModal({ mealIndex, onAdd, onClose }) {
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', qty: 100 })
  const QUICK_FOODS = [
    { name: 'Œuf entier', calories: 155, protein: 13, carbs: 1.1, fat: 11, qty: 60 },
    { name: 'Blanc de poulet', calories: 165, protein: 31, carbs: 0, fat: 3.6, qty: 100 },
    { name: 'Riz cuit', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, qty: 100 },
    { name: 'Fromage blanc 0%', calories: 45, protein: 7.5, carbs: 4, fat: 0.1, qty: 100 },
    { name: 'Banane', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, qty: 120 },
    { name: 'Amandes', calories: 579, protein: 21, carbs: 22, fat: 50, qty: 30 },
    { name: 'Avocat', calories: 160, protein: 2, carbs: 9, fat: 15, qty: 100 },
    { name: 'Flocons d\'avoine', calories: 368, protein: 13, carbs: 66, fat: 7, qty: 50 },
  ]
  const filtered = QUICK_FOODS.filter(f => !query || f.name.toLowerCase().includes(query.toLowerCase()))

  const submit = () => {
    if (!form.name) return
    onAdd({
      id: Date.now(), name: form.name,
      calories: parseFloat(form.calories) || 0, protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0, fat: parseFloat(form.fat) || 0,
      qty: parseFloat(form.qty) || 100,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Ajouter un aliment — {MEAL_LABELS[mealIndex]}</p>
          <button onClick={onClose} style={{ color: 'var(--text-faint)' }}>✕</button>
        </div>
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Recherche rapide */}
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="🔍 Rechercher un aliment…"
            className="w-full px-3 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
          <div className="grid grid-cols-2 gap-2">
            {filtered.slice(0, 6).map(f => (
              <button key={f.name} onClick={() => setForm({ name: f.name, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, qty: f.qty })}
                className="text-left p-2.5 rounded-xl text-xs transition"
                style={{ background: form.name === f.name ? 'var(--accent-subtle)' : 'var(--bg-base)', border: `1px solid ${form.name === f.name ? 'var(--accent)' : 'var(--border)'}`, color: 'var(--text-primary)' }}>
                <p className="font-bold truncate">{f.name}</p>
                <p style={{ color: 'var(--accent)' }}>{f.calories} kcal / {f.qty}g</p>
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-faint)' }}>OU SAISIR MANUELLEMENT</p>
            <div className="space-y-2">
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                placeholder="Nom de l'aliment"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
              <div className="grid grid-cols-2 gap-2">
                {[['calories','kcal'],['protein','g prot.'],['carbs','g gluc.'],['fat','g lip.']].map(([k, unit]) => (
                  <input key={k} type="number" value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))}
                    placeholder={unit}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
                ))}
              </div>
              <input type="number" value={form.qty} onChange={e => setForm(f => ({...f, qty: e.target.value}))}
                placeholder="Quantité (g)"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
          </div>
        </div>
        <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            Annuler
          </button>
          <button onClick={submit} disabled={!form.name} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: form.name ? 'var(--accent)' : 'var(--border)', cursor: form.name ? 'pointer' : 'not-allowed' }}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}

function TabJournal({ log, goals, onUpdateMeals, selectedDate, setSelectedDate }) {
  const [addMeal, setAddMeal] = useState(null)
  const meals = log?.meals || MEAL_LABELS.map(() => ({ foods: [] }))
  const calGoal = goals?.calories || 2000

  const handleAddFood = (mealIdx, food) => {
    const updated = meals.map((m, i) => i === mealIdx ? { ...m, foods: [...(m.foods || []), food] } : m)
    onUpdateMeals(updated)
  }

  const handleRemoveFood = (mealIdx, foodIdx) => {
    const updated = meals.map((m, i) => i === mealIdx ? { ...m, foods: (m.foods || []).filter((_, fi) => fi !== foodIdx) } : m)
    onUpdateMeals(updated)
  }

  const totalCal = meals.reduce((s, m) => s + (m.foods || []).reduce((ss, f) => ss + (f.calories || 0), 0), 0)

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="flex items-center justify-between p-3 rounded-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <button onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold"
          style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>←</button>
        <div className="text-center">
          <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{dateLabel(selectedDate)}</p>
          {selectedDate === today() && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>Aujourd'hui</span>
          )}
        </div>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold"
          style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>→</button>
      </div>

      {/* Bilan jour */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Calories', value: fmt(totalCal), goal: calGoal, color: 'var(--accent)', unit: 'kcal' },
          { label: 'Protéines', value: fmt(meals.reduce((s,m)=>s+(m.foods||[]).reduce((ss,f)=>ss+(f.protein||0),0),0)), color: MACRO_COLORS.protein, unit: 'g' },
          { label: 'Glucides', value: fmt(meals.reduce((s,m)=>s+(m.foods||[]).reduce((ss,f)=>ss+(f.carbs||0),0),0)), color: MACRO_COLORS.carbs, unit: 'g' },
          { label: 'Lipides', value: fmt(meals.reduce((s,m)=>s+(m.foods||[]).reduce((ss,f)=>ss+(f.fat||0),0),0)), color: MACRO_COLORS.fat, unit: 'g' },
        ].map(({ label, value, color, unit }) => (
          <div key={label} className="p-3 rounded-xl text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-base font-black" style={{ color }}>{value}</p>
            <p className="text-[9px]" style={{ color: 'var(--text-faint)' }}>{label} {unit}</p>
          </div>
        ))}
      </div>

      {/* Repas */}
      {MEAL_LABELS.map((label, mi) => {
        const meal   = meals[mi] || { foods: [] }
        const foods  = meal.foods || []
        const mealCal = foods.reduce((s, f) => s + (f.calories || 0), 0)
        return (
          <div key={mi} className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: foods.length ? '1px solid var(--border)' : 'none' }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{MEAL_ICONS[mi]}</span>
                <div>
                  <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  {foods.length > 0 && <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{foods.length} aliment(s) · {fmt(mealCal)} kcal</p>}
                </div>
              </div>
              <button onClick={() => setAddMeal(mi)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                + Ajouter
              </button>
            </div>
            {foods.length > 0 && (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {foods.map((food, fi) => (
                  <div key={fi} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{food.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                        {food.qty}g · {fmt(food.protein)}g P · {fmt(food.carbs)}g G · {fmt(food.fat)}g L
                      </p>
                    </div>
                    <span className="text-xs font-black flex-shrink-0" style={{ color: 'var(--accent)' }}>{fmt(food.calories)} kcal</span>
                    <button onClick={() => handleRemoveFood(mi, fi)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                      style={{ background: 'rgba(160,56,72,0.1)', color: '#a03848' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {foods.length === 0 && (
              <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-faint)' }}>
                Aucun aliment enregistré
              </div>
            )}
          </div>
        )
      })}

      {addMeal !== null && (
        <AddFoodModal mealIndex={addMeal} onAdd={(food) => handleAddFood(addMeal, food)} onClose={() => setAddMeal(null)} />
      )}
    </div>
  )
}

// ─── TAB 3 : ANALYSE ────────────────────────────────────
function BarChart({ data, color, unit = 'kcal', goal }) {
  const max = Math.max(...data.map(d => d.value), goal || 0, 1)
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full relative flex items-end justify-center rounded-t-lg overflow-hidden"
            style={{ height: 88, background: 'var(--bg-base)' }}>
            {goal && (
              <div className="absolute left-0 right-0 border-t border-dashed"
                style={{ bottom: `${(goal / max) * 88}px`, borderColor: 'rgba(232,160,32,0.4)' }} />
            )}
            <div className="w-full rounded-t-lg transition-all duration-700"
              style={{
                height: `${Math.max(4, (d.value / max) * 88)}px`,
                background: d.value >= (goal || 0) * 0.9 && d.value <= (goal || 0) * 1.1
                  ? '#27ae60' : color,
              }} />
          </div>
          <span className="text-[9px]" style={{ color: 'var(--text-faint)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function TabAnalyse({ goals }) {
  const mockWeek = DAYS_SHORT.map((d, i) => ({
    label: d,
    calories: [1850, 2100, 1920, 0, 2050, 1780, 1600][i],
    protein:  [142, 158, 145, 0, 162, 138, 120][i],
    carbs:    [210, 240, 215, 0, 230, 195, 180][i],
    fat:      [62, 70, 65, 0, 68, 58, 55][i],
  }))

  const calGoal  = goals?.calories || 2000
  const protGoal = goals?.protein  || 150
  const compliance = mockWeek.filter(d => d.calories > 0).length
  const avgCal   = Math.round(mockWeek.filter(d=>d.calories>0).reduce((s,d)=>s+d.calories,0) / (compliance || 1))

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Jours suivis', value: `${compliance}/7`, color: '#27ae60', icon: '📅' },
          { label: 'Moy. calories', value: `${avgCal}`, color: 'var(--accent)', icon: '🔥' },
          { label: 'Compliance', value: `${Math.round((compliance/7)*100)}%`, color: MACRO_COLORS.protein, icon: '🎯' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="p-4 rounded-2xl text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <span className="text-xl">{icon}</span>
            <p className="text-xl font-black mt-1" style={{ color }}>{value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Calories 7j */}
      <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>🔥 Calories — 7 derniers jours</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,160,32,0.15)', color: '#e8a020' }}>
            objectif {calGoal} kcal
          </span>
        </div>
        <BarChart data={mockWeek.map(d => ({ label: d.label, value: d.calories }))} color="var(--accent)" goal={calGoal} />
      </div>

      {/* Protéines 7j */}
      <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>🥩 Protéines — 7 derniers jours</p>
        <BarChart data={mockWeek.map(d => ({ label: d.label, value: d.protein }))} color={MACRO_COLORS.protein} goal={protGoal} unit="g" />
      </div>

      {/* Distribution macros */}
      <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>📊 Distribution macros (moy. semaine)</p>
        <div className="space-y-3">
          {[
            { label: 'Protéines', pct: 29, color: MACRO_COLORS.protein, g: '148g' },
            { label: 'Glucides',  pct: 45, color: MACRO_COLORS.carbs,   g: '218g' },
            { label: 'Lipides',   pct: 26, color: MACRO_COLORS.fat,     g: '63g'  },
          ].map(({ label, pct: p, color, g }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold" style={{ color }}>{label}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{g} · <b>{p}%</b></span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width: `${p}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights texte */}
      <div className="p-4 rounded-2xl space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-black mb-2" style={{ color: 'var(--text-primary)' }}>💡 Insights de la semaine</p>
        {[
          { icon: '✅', text: 'Tu as atteint ton objectif protéines 5j/7 — excellente régularité.', color: '#27ae60' },
          { icon: '⚠️', text: 'Mercredi : aucun repas enregistré. Pense à logger même les petits repas.', color: '#e8a020' },
          { icon: '📉', text: 'Glucides légèrement en dessous de l\'objectif en fin de semaine.', color: MACRO_COLORS.carbs },
        ].map(({ icon, text, color }, i) => (
          <div key={i} className="flex gap-2 p-2.5 rounded-xl"
            style={{ background: 'var(--bg-base)', border: `1px solid ${color}33` }}>
            <span>{icon}</span>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TAB 4 : PLAN ALIMENTAIRE ───────────────────────────
function TabPlan() {
  const TEMPLATES = [
    { name: 'Prise de masse', cal: 2800, protein: 180, carbs: 340, fat: 80, color: '#a03848', icon: '💪' },
    { name: 'Sèche', cal: 1700, protein: 170, carbs: 140, fat: 55, color: '#e8a020', icon: '🔥' },
    { name: 'Maintenance', cal: 2200, protein: 150, carbs: 240, fat: 70, color: '#27ae60', icon: '⚖️' },
    { name: 'Végétarien', cal: 2000, protein: 90, carbs: 270, fat: 65, color: '#4a90d9', icon: '🥗' },
  ]

  const SAMPLE_DAY = [
    { meal: 'Petit-déjeuner', foods: ['Flocons d\'avoine', 'Banane', 'Protéine whey', 'Lait écrémé'], cal: 520 },
    { meal: 'Déjeuner', foods: ['Blanc de poulet', 'Riz complet', 'Brocolis', 'Huile d\'olive'], cal: 680 },
    { meal: 'Collation', foods: ['Fromage blanc', 'Amandes'], cal: 230 },
    { meal: 'Dîner', foods: ['Saumon', 'Patate douce', 'Salade verte'], cal: 570 },
  ]

  const [selected, setSelected] = useState(0)

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
        Applique un template nutritionnel à tes objectifs journaliers
      </p>

      {/* Templates */}
      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES.map((t, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className="p-4 rounded-2xl text-left transition-all"
            style={{
              background: selected === i ? `${t.color}15` : 'var(--bg-card)',
              border: `2px solid ${selected === i ? t.color : 'var(--border)'}`,
            }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{t.icon}</span>
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
            </div>
            <p className="text-lg font-black" style={{ color: t.color }}>{t.cal} kcal</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
              P:{t.protein}g · G:{t.carbs}g · L:{t.fat}g
            </p>
          </button>
        ))}
      </div>

      {/* Exemple de journée type */}
      <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>
          Journée type — {TEMPLATES[selected].name}
        </p>
        <div className="space-y-2">
          {SAMPLE_DAY.map(({ meal, foods, cal }, i) => (
            <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                  {MEAL_ICONS[i]} {meal}
                </p>
                <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{cal} kcal</span>
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                {foods.join(' · ')}
              </p>
            </div>
          ))}
        </div>
        <button className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: TEMPLATES[selected].color }}>
          Appliquer ce plan à mes objectifs
        </button>
      </div>
    </div>
  )
}

// ─── TAB 5 : OBJECTIFS ──────────────────────────────────
function TabObjectifs({ goals, onSaveGoals }) {
  const [form, setForm] = useState({
    calories: goals?.calories || 2000,
    protein:  goals?.protein  || 150,
    carbs:    goals?.carbs    || 220,
    fat:      goals?.fat      || 65,
    water:    goals?.water    || 8,
    weight:   goals?.weight   || '',
    targetWeight: goals?.targetWeight || '',
  })
  const [saved, setSaved] = useState(false)

  // TDEE estimator
  const [tdee, setTdee] = useState({ weight: 75, height: 175, age: 28, sex: 'M', activity: 1.55 })
  const bmr = tdee.sex === 'M'
    ? 10 * tdee.weight + 6.25 * tdee.height - 5 * tdee.age + 5
    : 10 * tdee.weight + 6.25 * tdee.height - 5 * tdee.age - 161
  const tdeeVal = Math.round(bmr * tdee.activity)

  const save = () => {
    onSaveGoals(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Objectifs macros */}
      <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>🎯 Objectifs nutritionnels</p>
        <div className="space-y-3">
          {[
            { key: 'calories', label: 'Calories', unit: 'kcal', color: 'var(--accent)', min: 1000, max: 5000 },
            { key: 'protein',  label: 'Protéines', unit: 'g',  color: MACRO_COLORS.protein, min: 50,   max: 400  },
            { key: 'carbs',    label: 'Glucides',  unit: 'g',  color: MACRO_COLORS.carbs,   min: 50,   max: 600  },
            { key: 'fat',      label: 'Lipides',   unit: 'g',  color: MACRO_COLORS.fat,     min: 20,   max: 200  },
          ].map(({ key, label, unit, color }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs font-bold w-20 flex-shrink-0" style={{ color }}>{label}</span>
              <input type="number" value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                className="flex-1 px-3 py-2 rounded-xl text-sm text-center font-black"
                style={{ background: 'var(--bg-base)', border: `1px solid ${color}44`, color: 'var(--text-primary)', outline: 'none' }} />
              <span className="text-xs w-10 flex-shrink-0" style={{ color: 'var(--text-faint)' }}>{unit}</span>
            </div>
          ))}
        </div>
        <button onClick={save}
          className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold text-white transition"
          style={{ background: saved ? '#27ae60' : 'var(--accent)' }}>
          {saved ? '✓ Sauvegardé !' : 'Enregistrer les objectifs'}
        </button>
      </div>

      {/* Calculateur TDEE */}
      <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>🧮 Calculateur TDEE</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { key: 'weight', label: 'Poids (kg)', type: 'number' },
            { key: 'height', label: 'Taille (cm)', type: 'number' },
            { key: 'age',    label: 'Âge',         type: 'number' },
          ].map(({ key, label }) => (
            <div key={key}>
              <p className="text-[10px] mb-1" style={{ color: 'var(--text-faint)' }}>{label}</p>
              <input type="number" value={tdee[key]}
                onChange={e => setTdee(t => ({ ...t, [key]: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
          ))}
          <div>
            <p className="text-[10px] mb-1" style={{ color: 'var(--text-faint)' }}>Sexe</p>
            <div className="flex gap-1">
              {['M','F'].map(s => (
                <button key={s} onClick={() => setTdee(t => ({ ...t, sex: s }))}
                  className="flex-1 py-2 rounded-xl text-xs font-bold"
                  style={{ background: tdee.sex === s ? 'var(--accent)' : 'var(--bg-base)', color: tdee.sex === s ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {s === 'M' ? '♂ Homme' : '♀ Femme'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <p className="text-[10px] mb-1" style={{ color: 'var(--text-faint)' }}>Niveau d'activité</p>
          <select value={tdee.activity} onChange={e => setTdee(t => ({ ...t, activity: parseFloat(e.target.value) }))}
            className="w-full px-3 py-2 rounded-xl text-xs"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}>
            <option value={1.2}>Sédentaire (peu ou pas d'exercice)</option>
            <option value={1.375}>Légèrement actif (1-3j/sem)</option>
            <option value={1.55}>Modérément actif (3-5j/sem)</option>
            <option value={1.725}>Très actif (6-7j/sem)</option>
            <option value={1.9}>Extrêmement actif (2× par jour)</option>
          </select>
        </div>
        <div className="mt-3 p-3 rounded-xl text-center" style={{ background: 'var(--bg-base)', border: '1px solid var(--accent)33' }}>
          <p className="text-2xl font-black" style={{ color: 'var(--accent)' }}>{tdeeVal} kcal</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>TDEE estimé / jour</p>
          <div className="flex justify-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-faint)' }}>
            <span>Sèche: <b style={{color:'#e8a020'}}>{tdeeVal - 400}</b></span>
            <span>Maintien: <b style={{color:'#27ae60'}}>{tdeeVal}</b></span>
            <span>Masse: <b style={{color:'#a03848'}}>{tdeeVal + 400}</b></span>
          </div>
        </div>
        <button onClick={() => setForm(f => ({ ...f, calories: tdeeVal, protein: Math.round(tdee.weight * 2) }))}
          className="w-full mt-2 py-2 rounded-xl text-xs font-bold"
          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
          Appliquer à mes objectifs
        </button>
      </div>

      {/* Poids cible */}
      <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>⚖️ Suivi du poids</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] mb-1" style={{ color: 'var(--text-faint)' }}>Poids actuel (kg)</p>
            <input type="number" value={form.weight}
              onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>
          <div>
            <p className="text-[10px] mb-1" style={{ color: 'var(--text-faint)' }}>Poids objectif (kg)</p>
            <input type="number" value={form.targetWeight}
              onChange={e => setForm(f => ({ ...f, targetWeight: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>
        </div>
        {form.weight && form.targetWeight && (
          <div className="mt-3 p-2.5 rounded-xl text-center text-xs"
            style={{ background: parseFloat(form.targetWeight) < parseFloat(form.weight) ? 'rgba(232,160,32,0.1)' : 'rgba(39,174,96,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {Math.abs(parseFloat(form.targetWeight) - parseFloat(form.weight)).toFixed(1)} kg
              {parseFloat(form.targetWeight) < parseFloat(form.weight) ? ' à perdre 🔥' : ' à prendre 💪'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Vue d\'ensemble', icon: '📊' },
  { id: 'journal',   label: 'Journal',         icon: '📝' },
  { id: 'analyse',   label: 'Analyse',         icon: '📈' },
  { id: 'plan',      label: 'Plan',            icon: '🍽️' },
  { id: 'objectifs', label: 'Objectifs',       icon: '🎯' },
]

export default function NutritionDashboard() {
  const { fetchNutritionLog, saveNutritionLog, fetchNutritionGoals, user } = useStore()
  const [tab, setTab]           = useState('overview')
  const [selectedDate, setSelectedDate] = useState(today())
  const [log, setLog]           = useState({ meals: MEAL_LABELS.map(() => ({ foods: [] })) })
  const [goals, setGoals]       = useState({ calories: 2000, protein: 150, carbs: 220, fat: 65, water: 8 })
  const [glasses, setGlasses]   = useState(3)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [logData, goalsData] = await Promise.all([
          fetchNutritionLog ? fetchNutritionLog(selectedDate) : null,
          fetchNutritionGoals ? fetchNutritionGoals() : null,
        ])
        if (logData?.meals) setLog(logData)
        if (goalsData) setGoals(g => ({ ...g, ...goalsData }))
      } catch {}
      setLoading(false)
    }
    load()
  }, [selectedDate])

  const handleUpdateMeals = async (meals) => {
    const newLog = { ...log, meals }
    setLog(newLog)
    if (saveNutritionLog) await saveNutritionLog(selectedDate, newLog)
  }

  const handleSaveGoals = (g) => {
    setGoals(g)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="sticky top-0 z-30" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--gold)' }}>Nutrition</p>
              <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Suivi Nutritionnel</h1>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: 'var(--text-faint)' }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{user?.name}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 pb-3 overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: tab === t.id ? 'var(--accent)' : 'var(--bg-card)',
                  color: tab === t.id ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${tab === t.id ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5 pb-28">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl skeleton" />)}
          </div>
        ) : (
          <>
            {tab === 'overview'  && <TabOverview  log={log} goals={goals} glasses={glasses} setGlasses={setGlasses} />}
            {tab === 'journal'   && <TabJournal   log={log} goals={goals} onUpdateMeals={handleUpdateMeals} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
            {tab === 'analyse'   && <TabAnalyse   goals={goals} />}
            {tab === 'plan'      && <TabPlan />}
            {tab === 'objectifs' && <TabObjectifs goals={goals} onSaveGoals={handleSaveGoals} />}
          </>
        )}
      </div>
    </div>
  )
}
