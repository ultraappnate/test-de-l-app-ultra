import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const GOALS = ['Perte de poids', 'Prise de masse', 'Rééquilibrage alimentaire', 'Performance sportive', 'Végétarien/Vegan', 'Diabète / IG bas', 'Personnalisé']
const MEALS  = ['Petit-déjeuner', 'Collation matin', 'Déjeuner', 'Collation après-midi', 'Dîner']

const TEMPLATES = [
  {
    id: 'seche', name: 'Sèche (-500 kcal)', goal: 'Perte de poids',
    cal: 1700, protein: 170, carbs: 140, fat: 55, color: '#e8a020',
    days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((d, i) => ({
      day: d, meals: [
        { name: 'Petit-déjeuner', foods: 'Flocons d\'avoine, lait écrémé, fruits rouges', cal: 320 },
        { name: 'Déjeuner',       foods: 'Poulet grillé, légumes vapeur, riz complet',    cal: 520 },
        { name: 'Collation',      foods: 'Fromage blanc 0%, amandes (15g)',               cal: 170 },
        { name: 'Dîner',          foods: 'Saumon, brocolis, patate douce (100g)',         cal: 480 },
      ], total: 1490 + (i % 2 ? 200 : 0),
    })),
  },
  {
    id: 'masse', name: 'Prise de masse (+400 kcal)', goal: 'Prise de masse',
    cal: 2900, protein: 180, carbs: 340, fat: 85, color: '#a03848',
    days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((d, i) => ({
      day: d, meals: [
        { name: 'Petit-déjeuner', foods: 'Œufs brouillés (3), pain complet, avocat',        cal: 550 },
        { name: 'Collation',      foods: 'Banane, beurre de cacahuète, whey shake',          cal: 400 },
        { name: 'Déjeuner',       foods: 'Steak haché, pâtes complètes, sauce tomate',       cal: 750 },
        { name: 'Collation',      foods: 'Riz au lait protéiné, fruits secs',                cal: 380 },
        { name: 'Dîner',          foods: 'Poulet en sauce crémeuse, légumes rôtis, quinoa',  cal: 680 },
      ], total: 2760 + (i % 3 ? 140 : 0),
    })),
  },
]

const INIT_PLANS = [
  { id: '1', name: 'Plan Sèche Emma', goal: 'Perte de poids', client: 'Emma Dubois', cal: 1650, protein: 165, carbs: 135, fat: 52, duration: '12 semaines', active: true, template: 'seche' },
  { id: '2', name: 'Plan Masse Lucas', goal: 'Prise de masse', client: 'Lucas Martin', cal: 2900, protein: 180, carbs: 340, fat: 85, duration: '16 semaines', active: true, template: 'masse' },
  { id: '3', name: 'Équilibre végétarien', goal: 'Végétarien/Vegan', client: null, cal: 2000, protein: 90, carbs: 260, fat: 68, duration: '8 semaines', active: false, template: null },
]

function MacroBadge({ label, value, unit, color }) {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${color}18`, color }}>
      {label}: {value}{unit}
    </span>
  )
}

function PlanCard({ plan, onEdit, onDelete, onAssign }) {
  const [showDay, setShowDay] = useState(null)
  const template = TEMPLATES.find(t => t.id === plan.template)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{plan.name}</p>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: plan.active ? 'rgba(39,174,96,0.15)' : 'var(--border)', color: plan.active ? '#27ae60' : 'var(--text-faint)' }}>
                {plan.active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {plan.goal} · {plan.duration}
              {plan.client && <> · <span style={{ color: 'var(--accent)' }}>👤 {plan.client}</span></>}
            </p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => onEdit(plan)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
              style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>✎</button>
            <button onClick={() => onDelete(plan.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
              style={{ background: 'rgba(160,56,72,0.1)', color: '#a03848', border: '1px solid var(--border)' }}>✕</button>
          </div>
        </div>
        {/* Macros */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          <MacroBadge label="🔥" value={plan.cal} unit=" kcal" color="var(--accent)" />
          <MacroBadge label="🥩" value={plan.protein} unit="g" color="#e05a6b" />
          <MacroBadge label="🌾" value={plan.carbs} unit="g" color="#e8a020" />
          <MacroBadge label="🥑" value={plan.fat} unit="g" color="#4a90d9" />
        </div>
        {/* Actions */}
        <div className="flex gap-2">
          {!plan.client && (
            <button onClick={() => onAssign(plan.id)}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
              Assigner à un client
            </button>
          )}
          {template && (
            <button onClick={() => setShowDay(showDay ? null : 'Lundi')}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {showDay ? 'Masquer ↑' : 'Voir le planning ↓'}
            </button>
          )}
        </div>
      </div>

      {/* Planning hebdo */}
      {showDay && template && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {/* Nav jours */}
          <div className="flex gap-1 p-3 overflow-x-auto">
            {template.days.map(d => (
              <button key={d.day} onClick={() => setShowDay(d.day)}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap flex-shrink-0"
                style={{ background: showDay === d.day ? 'var(--accent)' : 'var(--bg-base)', color: showDay === d.day ? '#fff' : 'var(--text-faint)', border: '1px solid var(--border)' }}>
                {d.day.slice(0, 3)}
              </button>
            ))}
          </div>
          {/* Repas du jour */}
          <div className="px-4 pb-4 space-y-2">
            {template.days.find(d => d.day === showDay)?.meals.map((m, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl"
                style={{ background: 'var(--bg-base)' }}>
                <span className="text-sm">{['☀️', '🍎', '☀️', '🍪', '🌙'][i]}</span>
                <div className="flex-1">
                  <p className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{m.foods}</p>
                </div>
                <span className="text-[10px] font-bold flex-shrink-0" style={{ color: 'var(--accent)' }}>{m.cal} kcal</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NutriPlans() {
  const [plans, setPlans]   = useState(INIT_PLANS)
  const [filter, setFilter] = useState('Tous')
  const [showNew, setShowNew] = useState(false)
  const [newPlan, setNewPlan] = useState({ name: '', goal: GOALS[0], cal: 2000, protein: 150, carbs: 220, fat: 65, duration: '8 semaines', template: '' })

  const filtered = plans.filter(p => filter === 'Tous' || p.goal === filter)

  const handleCreate = () => {
    setPlans(prev => [...prev, { ...newPlan, id: uuidv4(), active: true, client: null }])
    setShowNew(false)
    setNewPlan({ name: '', goal: GOALS[0], cal: 2000, protein: 150, carbs: 220, fat: 65, duration: '8 semaines', template: '' })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="sticky top-0 z-20 px-6 py-4" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#27ae60' }}>Nutritionniste</p>
            <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Plans Nutritionnels</h1>
          </div>
          <button onClick={() => setShowNew(s => !s)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: 'var(--accent)' }}>
            + Nouveau plan
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['Tous', ...GOALS.slice(0, 5)].map(g => (
            <button key={g} onClick={() => setFilter(g)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={{ background: filter === g ? 'var(--accent)' : 'var(--bg-card)', color: filter === g ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-5 space-y-4">

        {/* Formulaire nouveau plan */}
        {showNew && (
          <div className="p-5 rounded-2xl space-y-3" style={{ background: 'var(--bg-card)', border: '2px solid var(--accent)' }}>
            <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>+ Nouveau plan nutritionnel</p>
            <input value={newPlan.name} onChange={e => setNewPlan(p => ({...p, name: e.target.value}))}
              placeholder="Nom du plan (ex: Plan sèche Emma)"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
            <div className="grid grid-cols-2 gap-2">
              <select value={newPlan.goal} onChange={e => setNewPlan(p => ({...p, goal: e.target.value}))}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)', outline: 'none' }}>
                {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input value={newPlan.duration} onChange={e => setNewPlan(p => ({...p, duration: e.target.value}))}
                placeholder="Durée (ex: 8 semaines)"
                className="px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { k: 'cal',     label: '🔥 Calories', unit: 'kcal', color: 'var(--accent)' },
                { k: 'protein', label: '🥩 Protéines', unit: 'g',   color: '#e05a6b' },
                { k: 'carbs',   label: '🌾 Glucides',  unit: 'g',   color: '#e8a020' },
                { k: 'fat',     label: '🥑 Lipides',   unit: 'g',   color: '#4a90d9' },
              ].map(({ k, label, unit, color }) => (
                <div key={k}>
                  <p className="text-[10px] font-bold mb-1" style={{ color }}>{label}</p>
                  <div className="flex items-center rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${color}44`, background: 'var(--bg-base)' }}>
                    <input type="number" value={newPlan[k]} onChange={e => setNewPlan(p => ({...p, [k]: parseInt(e.target.value)||0}))}
                      className="flex-1 px-3 py-2 text-sm font-bold w-full"
                      style={{ background: 'transparent', color: 'var(--text-primary)', outline: 'none' }} />
                    <span className="pr-2 text-[10px] flex-shrink-0" style={{ color: 'var(--text-faint)' }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-faint)' }}>Partir d'un template</p>
            <div className="flex gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setNewPlan(p => ({...p, template: t.id, cal: t.cal, protein: t.protein, carbs: t.carbs, fat: t.fat}))}
                  className="flex-1 py-2 rounded-xl text-xs font-bold"
                  style={{ background: newPlan.template === t.id ? t.color : 'var(--bg-base)', color: newPlan.template === t.id ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {t.name}
                </button>
              ))}
              <button onClick={() => setNewPlan(p => ({...p, template: ''}))}
                className="flex-1 py-2 rounded-xl text-xs font-bold"
                style={{ background: !newPlan.template ? 'var(--bg-base)' : 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Vierge
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Annuler
              </button>
              <button onClick={handleCreate} disabled={!newPlan.name} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: newPlan.name ? 'var(--accent)' : 'var(--border)' }}>
                Créer le plan
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Plans créés',   value: plans.length, color: 'var(--accent)' },
            { label: 'Plans actifs',  value: plans.filter(p=>p.active).length, color: '#27ae60' },
            { label: 'Clients suivis', value: plans.filter(p=>p.client).length, color: '#4a90d9' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 rounded-2xl text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Liste plans */}
        {filtered.length === 0
          ? <div className="text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <p className="font-black" style={{ color: 'var(--text-primary)' }}>Aucun plan</p>
            </div>
          : <div className="space-y-3">
              {filtered.map(p => (
                <PlanCard key={p.id} plan={p}
                  onEdit={() => {}}
                  onDelete={(id) => setPlans(prev => prev.filter(p => p.id !== id))}
                  onAssign={() => {}} />
              ))}
            </div>
        }
      </div>
    </div>
  )
}
