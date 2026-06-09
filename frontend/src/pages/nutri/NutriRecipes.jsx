import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const CATEGORIES = ['Tous', 'Petit-déjeuner', 'Déjeuner', 'Dîner', 'Collation', 'Dessert', 'Boisson']
const TAGS_OPTS  = ['Végétarien', 'Vegan', 'Sans gluten', 'Riche en protéines', 'Faible en glucides', 'Rapide (<15min)', 'Batch cooking']

const INIT_RECIPES = [
  { id: '1', name: 'Bowl protéiné au quinoa', category: 'Déjeuner', cal: 480, protein: 38, carbs: 45, fat: 12, prepTime: 20, tags: ['Végétarien', 'Riche en protéines'], ingredients: ['200g quinoa cuit', '150g pois chiches', '1 avocat', 'Épinards', 'Citron', 'Tahini'], steps: 'Cuire le quinoa. Mixer les pois chiches avec tahini et citron. Dresser le bowl avec avocat tranché.', published: true },
  { id: '2', name: 'Pancakes protéinés avoine', category: 'Petit-déjeuner', cal: 320, protein: 28, carbs: 35, fat: 6, prepTime: 10, tags: ['Rapide (<15min)', 'Riche en protéines'], ingredients: ['80g flocons d\'avoine', '2 œufs', '1 banane', '30g whey vanille', 'Cannelle'], steps: 'Mixer tous les ingrédients. Cuire en petits cercles dans une poêle antiadhésive. Servir avec fruits frais.', published: true },
  { id: '3', name: 'Smoothie vert énergie', category: 'Boisson', cal: 180, protein: 8, carbs: 28, fat: 4, prepTime: 5, tags: ['Vegan', 'Rapide (<15min)'], ingredients: ['1 banane', '100g épinards', '200ml lait végétal', '1cs graines chia', 'Gingembre'], steps: 'Mixer tous les ingrédients jusqu\'à obtenir une texture lisse. Servir immédiatement.', published: false },
  { id: '4', name: 'Riz sauté au poulet', category: 'Dîner', cal: 550, protein: 42, carbs: 60, fat: 10, prepTime: 25, tags: ['Batch cooking'], ingredients: ['200g riz complet', '150g blanc poulet', 'Légumes variés', 'Sauce soja', 'Ail', 'Huile sésame'], steps: 'Cuire le riz. Griller le poulet en morceaux. Faire sauter les légumes. Mélanger le tout avec la sauce.', published: true },
]

function RecipeCard({ recipe, onEdit, onDelete, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: recipe.published ? 1 : 0.65 }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'var(--bg-base)' }}>
            {recipe.category === 'Petit-déjeuner' ? '🌅' : recipe.category === 'Déjeuner' ? '☀️' : recipe.category === 'Dîner' ? '🌙' : recipe.category === 'Boisson' ? '🥤' : recipe.category === 'Dessert' ? '🍮' : '🍎'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{recipe.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  {recipe.category} · ⏱ {recipe.prepTime} min
                </p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => onToggle(recipe.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                  style={{ background: recipe.published ? 'rgba(39,174,96,0.15)' : 'var(--bg-base)', color: recipe.published ? '#27ae60' : 'var(--text-faint)', border: '1px solid var(--border)' }}>
                  {recipe.published ? '👁' : '🙈'}
                </button>
                <button onClick={() => onEdit(recipe)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>✎</button>
                <button onClick={() => onDelete(recipe.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                  style={{ background: 'rgba(160,56,72,0.1)', color: '#a03848', border: '1px solid var(--border)' }}>✕</button>
              </div>
            </div>
            {/* Macros */}
            <div className="flex gap-3 mt-2 text-[11px] flex-wrap">
              {[['🔥', recipe.cal, 'kcal', 'var(--accent)'], ['🥩', recipe.protein, 'g prot', '#e05a6b'], ['🌾', recipe.carbs, 'g gluc', '#e8a020'], ['🥑', recipe.fat, 'g lip', '#4a90d9']].map(([icon, val, unit, color]) => (
                <span key={unit} className="font-bold" style={{ color }}>
                  {icon} {val}<span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>{unit}</span>
                </span>
              ))}
            </div>
            {/* Tags */}
            <div className="flex gap-1 mt-2 flex-wrap">
              {recipe.tags.map(t => (
                <span key={t} className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Expand */}
        <button onClick={() => setExpanded(e => !e)}
          className="w-full mt-3 text-xs font-bold text-center py-1.5 rounded-lg"
          style={{ background: 'var(--bg-base)', color: 'var(--text-faint)' }}>
          {expanded ? 'Masquer ↑' : 'Voir la recette ↓'}
        </button>
        {expanded && (
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-faint)' }}>Ingrédients</p>
              <ul className="space-y-1">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-faint)' }}>Préparation</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{recipe.steps}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RecipeForm({ recipe, onSave, onCancel }) {
  const [form, setForm] = useState(recipe || {
    name: '', category: 'Déjeuner', cal: '', protein: '', carbs: '', fat: '',
    prepTime: '', tags: [], ingredients: [''], steps: '', published: false,
  })

  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, ''] }))
  const setIngredient = (i, v) => setForm(f => ({ ...f, ingredients: f.ingredients.map((x, idx) => idx === i ? v : x) }))
  const removeIngredient = (i) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))
  const toggleTag = (t) => setForm(f => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t] }))

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 pt-8"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
            {recipe ? '✎ Modifier la recette' : '+ Nouvelle recette'}
          </p>
          <button onClick={onCancel} style={{ color: 'var(--text-faint)' }}>✕</button>
        </div>
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
            placeholder="Nom de la recette"
            className="w-full px-3 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />

          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.slice(1).map(c => (
              <button key={c} onClick={() => setForm(f => ({...f, category: c}))}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: form.category === c ? 'var(--accent)' : 'var(--bg-base)', color: form.category === c ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[['cal', 'Calories (kcal)'], ['protein', 'Protéines (g)'], ['carbs', 'Glucides (g)'], ['fat', 'Lipides (g)'], ['prepTime', 'Temps prépa (min)']].map(([k, label]) => (
              <input key={k} type="number" value={form[k]}
                onChange={e => setForm(f => ({...f, [k]: e.target.value}))}
                placeholder={label}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
            ))}
          </div>

          <div>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-faint)' }}>Tags</p>
            <div className="flex gap-1.5 flex-wrap">
              {TAGS_OPTS.map(t => (
                <button key={t} onClick={() => toggleTag(t)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: form.tags.includes(t) ? 'var(--accent-subtle)' : 'var(--bg-base)', color: form.tags.includes(t) ? 'var(--accent)' : 'var(--text-faint)', border: `1px solid ${form.tags.includes(t) ? 'var(--accent)' : 'var(--border)'}` }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold" style={{ color: 'var(--text-faint)' }}>Ingrédients</p>
              <button onClick={addIngredient} className="text-xs font-bold" style={{ color: 'var(--accent)' }}>+ Ajouter</button>
            </div>
            <div className="space-y-1.5">
              {form.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input value={ing} onChange={e => setIngredient(i, e.target.value)}
                    placeholder={`Ingrédient ${i + 1}`}
                    className="flex-1 px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
                  {form.ingredients.length > 1 && (
                    <button onClick={() => removeIngredient(i)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                      style={{ background: 'rgba(160,56,72,0.1)', color: '#a03848' }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <textarea value={form.steps} onChange={e => setForm(f => ({...f, steps: e.target.value}))}
            placeholder="Étapes de préparation…"
            rows={4}
            className="w-full px-3 py-2 rounded-xl text-sm resize-none"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />

          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative w-10 h-6 rounded-full transition-colors"
              style={{ background: form.published ? 'var(--accent)' : 'var(--border)' }}
              onClick={() => setForm(f => ({...f, published: !f.published}))}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                style={{ transform: form.published ? 'translateX(18px)' : 'translateX(2px)' }} />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {form.published ? 'Publiée (visible clients)' : 'Brouillon'}
            </span>
          </label>
        </div>
        <div className="px-5 pb-5 flex gap-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            Annuler
          </button>
          <button onClick={() => onSave({ ...form, id: form.id || uuidv4() })} disabled={!form.name}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: form.name ? 'var(--accent)' : 'var(--border)' }}>
            {recipe ? 'Mettre à jour' : 'Créer la recette'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NutriRecipes() {
  const [recipes, setRecipes] = useState(INIT_RECIPES)
  const [filter, setFilter]   = useState('Tous')
  const [tagFilter, setTagFilter] = useState('')
  const [search, setSearch]   = useState('')
  const [editing, setEditing] = useState(null)  // null = closed, {} = new, recipe = edit
  const [showForm, setShowForm] = useState(false)

  const filtered = recipes.filter(r => {
    if (filter !== 'Tous' && r.category !== filter) return false
    if (tagFilter && !r.tags.includes(tagFilter)) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleSave = (recipe) => {
    setRecipes(prev => {
      const idx = prev.findIndex(r => r.id === recipe.id)
      return idx >= 0 ? prev.map(r => r.id === recipe.id ? recipe : r) : [...prev, recipe]
    })
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = (id) => setRecipes(prev => prev.filter(r => r.id !== id))
  const handleToggle = (id) => setRecipes(prev => prev.map(r => r.id === id ? {...r, published: !r.published} : r))

  const published = recipes.filter(r => r.published).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-6 py-4" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#27ae60' }}>Nutritionniste</p>
            <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Mes Recettes</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {published} publiée{published !== 1 ? 's' : ''} · {recipes.length} total
            </span>
            <button onClick={() => { setEditing(null); setShowForm(true) }}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: 'var(--accent)' }}>
              + Nouvelle recette
            </button>
          </div>
        </div>
        {/* Filtres catégorie */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={{ background: filter === c ? 'var(--accent)' : 'var(--bg-card)', color: filter === c ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-5 space-y-4">
        {/* Recherche + filtre tag */}
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher une recette…"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
          <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', outline: 'none' }}>
            <option value="">Tous les tags</option>
            {TAGS_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Recettes', value: recipes.length, color: 'var(--accent)' },
            { label: 'Publiées',  value: published, color: '#27ae60' },
            { label: 'Brouillons', value: recipes.length - published, color: '#e8a020' },
            { label: 'Moy. kcal', value: Math.round(recipes.reduce((s,r) => s + (r.cal||0), 0) / recipes.length), color: '#4a90d9' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3 rounded-xl text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-lg font-black" style={{ color }}>{value}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Liste */}
        {filtered.length === 0
          ? <div className="text-center py-16">
              <div className="text-5xl mb-4">🥗</div>
              <p className="font-black" style={{ color: 'var(--text-primary)' }}>Aucune recette</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>Crée ta première recette pour commencer</p>
            </div>
          : <div className="space-y-3">
              {filtered.map(r => (
                <RecipeCard key={r.id} recipe={r}
                  onEdit={(recipe) => { setEditing(recipe); setShowForm(true) }}
                  onDelete={handleDelete}
                  onToggle={handleToggle} />
              ))}
            </div>
        }
      </div>

      {showForm && (
        <RecipeForm recipe={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null) }} />
      )}
    </div>
  )
}
