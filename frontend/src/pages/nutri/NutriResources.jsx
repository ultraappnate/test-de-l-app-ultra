import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const RESOURCE_TYPES = [
  { id: 'ebook',       label: 'Ebook',               icon: '📚', color: '#4a90d9' },
  { id: 'guide',       label: 'Guide PDF',            icon: '📄', color: '#27ae60' },
  { id: 'plan_repas',  label: 'Plan de repas',        icon: '🍽️', color: '#e8a020' },
  { id: 'programme',   label: 'Programme nutrition',  icon: '📋', color: '#a03848' },
  { id: 'checklist',   label: 'Checklist / Fiche',    icon: '✅', color: '#6b7280' },
  { id: 'video',       label: 'Vidéo / Formation',    icon: '🎬', color: '#9b59b6' },
]

const INIT_RESOURCES = [
  { id: '1', title: 'Guide complet de la nutrition sportive', type: 'ebook', description: '85 pages · Nutrition avant/pendant/après l\'effort, supplémentation, hydratation.', price: '19€', sales: 47, published: true, tags: ['Sportif', 'Bestseller'], pages: 85, link: '' },
  { id: '2', title: 'Meal prep 30 minutes : 21 recettes', type: 'ebook', description: '21 recettes pour préparer ses repas de la semaine en moins de 30 minutes.', price: '12€', sales: 31, published: true, tags: ['Pratique', 'Batch cooking'], pages: 52, link: '' },
  { id: '3', title: 'Plan repas sèche 4 semaines', type: 'plan_repas', description: 'Plan alimentaire complet 4 semaines avec liste de courses intégrée.', price: '9€', sales: 18, published: true, tags: ['Sèche', 'Débutant'], pages: 28, link: '' },
  { id: '4', title: 'Guide des compléments alimentaires', type: 'guide', description: 'Tour complet des compléments : whey, créatine, BCAA, vitamines. Ce qui vaut vraiment le coup.', price: 'Gratuit', sales: 124, published: true, tags: ['Gratuit', 'Populaire'], pages: 20, link: '' },
  { id: '5', title: 'Cuisine végétarienne protéinée', type: 'ebook', description: 'En cours de rédaction — 60 recettes végétariennes riches en protéines.', price: '15€', sales: 0, published: false, tags: ['Végétarien', 'À venir'], pages: 60, link: '' },
]

function ResourceCard({ resource, onEdit, onDelete, onToggle }) {
  const typeObj = RESOURCE_TYPES.find(t => t.id === resource.type) || RESOURCE_TYPES[0]
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl transition-all"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: resource.published ? 1 : 0.6 }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
        style={{ background: `${typeObj.color}15`, border: `1px solid ${typeObj.color}33` }}>
        {typeObj.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{resource.title}</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{resource.description}</p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => onToggle(resource.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
              style={{ background: resource.published ? 'rgba(39,174,96,0.15)' : 'var(--bg-base)', color: resource.published ? '#27ae60' : 'var(--text-faint)', border: '1px solid var(--border)' }}>
              {resource.published ? '👁' : '🙈'}
            </button>
            <button onClick={() => onEdit(resource)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
              style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>✎</button>
            <button onClick={() => onDelete(resource.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
              style={{ background: 'rgba(160,56,72,0.1)', color: '#a03848', border: '1px solid var(--border)' }}>✕</button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className="text-sm font-black" style={{ color: typeObj.color }}>
            {resource.price}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: `${typeObj.color}15`, color: typeObj.color }}>
            {typeObj.icon} {typeObj.label}
          </span>
          {resource.pages && (
            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{resource.pages} pages</span>
          )}
          {resource.sales > 0 && (
            <span className="text-[10px] font-bold" style={{ color: '#27ae60' }}>
              {resource.sales} vente{resource.sales > 1 ? 's' : ''}
            </span>
          )}
          {resource.tags.map(t => (
            <span key={t} className="text-[9px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'var(--bg-base)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
              {t}
            </span>
          ))}
        </div>
        {resource.link && (
          <a href={resource.link} target="_blank" rel="noreferrer"
            className="text-xs mt-2 inline-block font-bold"
            style={{ color: 'var(--accent)' }}>
            Voir en ligne ↗
          </a>
        )}
      </div>
    </div>
  )
}

function ResourceForm({ resource, onSave, onCancel }) {
  const [form, setForm] = useState(resource || {
    title: '', type: 'ebook', description: '', price: '', pages: '', link: '', tags: '', published: false,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
            {resource ? '✎ Modifier la ressource' : '+ Nouvelle ressource'}
          </p>
          <button onClick={onCancel} style={{ color: 'var(--text-faint)' }}>✕</button>
        </div>
        <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
          <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
            placeholder="Titre de la ressource"
            className="w-full px-3 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />

          <div className="grid grid-cols-2 gap-2">
            {RESOURCE_TYPES.map(t => (
              <button key={t.id} onClick={() => setForm(f => ({...f, type: t.id}))}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: form.type === t.id ? `${t.color}15` : 'var(--bg-base)', color: form.type === t.id ? t.color : 'var(--text-secondary)', border: `1px solid ${form.type === t.id ? t.color : 'var(--border)'}` }}>
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
            placeholder="Description (ce que contient la ressource)…"
            rows={3} className="w-full px-3 py-2 rounded-xl text-sm resize-none"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />

          <div className="grid grid-cols-2 gap-2">
            <input value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))}
              placeholder="Prix (ex: 19€ ou Gratuit)"
              className="px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
            <input type="number" value={form.pages} onChange={e => setForm(f => ({...f, pages: e.target.value}))}
              placeholder="Nb de pages"
              className="px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>

          <input value={form.link} onChange={e => setForm(f => ({...f, link: e.target.value}))}
            placeholder="Lien de vente (Gumroad, Shopify, Notion…)"
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />

          <input value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))}
            placeholder="Tags séparés par virgule (ex: Végétarien, Sèche)"
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />

          <label className="flex items-center gap-3 cursor-pointer"
            onClick={() => setForm(f => ({...f, published: !f.published}))}>
            <div className="relative w-10 h-6 rounded-full transition-colors"
              style={{ background: form.published ? 'var(--accent)' : 'var(--border)' }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                style={{ transform: form.published ? 'translateX(18px)' : 'translateX(2px)' }} />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {form.published ? 'Publiée (visible)' : 'Brouillon'}
            </span>
          </label>
        </div>
        <div className="px-5 pb-5 flex gap-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            Annuler
          </button>
          <button onClick={() => onSave({ ...form, id: form.id || uuidv4(), tags: typeof form.tags === 'string' ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : form.tags })}
            disabled={!form.title}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: form.title ? 'var(--accent)' : 'var(--border)' }}>
            {resource ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NutriResources() {
  const [resources, setResources] = useState(INIT_RESOURCES)
  const [filter, setFilter]       = useState('Tous')
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState(null)

  const filtered = filter === 'Tous' ? resources : resources.filter(r => r.type === filter)

  const handleSave = (r) => {
    setResources(prev => {
      const idx = prev.findIndex(x => x.id === r.id)
      return idx >= 0 ? prev.map(x => x.id === r.id ? r : x) : [...prev, r]
    })
    setShowForm(false); setEditing(null)
  }

  const totalRevenue = resources.reduce((s, r) => {
    const price = parseFloat((r.price || '').replace('€', '')) || 0
    return s + price * (r.sales || 0)
  }, 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="sticky top-0 z-20 px-6 py-4" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#27ae60' }}>Nutritionniste</p>
            <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Ebooks & Ressources</h1>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true) }}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: 'var(--accent)' }}>
            + Nouvelle ressource
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['Tous', ...RESOURCE_TYPES.map(t => t.id)].map(f => {
            const label = f === 'Tous' ? 'Tous' : RESOURCE_TYPES.find(t => t.id === f)?.label || f
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0"
                style={{ background: filter === f ? 'var(--accent)' : 'var(--bg-card)', color: filter === f ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Ressources', value: resources.length, color: 'var(--accent)' },
            { label: 'Publiées', value: resources.filter(r=>r.published).length, color: '#27ae60' },
            { label: 'Ventes totales', value: resources.reduce((s,r)=>s+(r.sales||0),0), color: '#4a90d9' },
            { label: 'Revenus est.', value: `${Math.round(totalRevenue)}€`, color: '#e8a020' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3 rounded-xl text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-lg font-black" style={{ color }}>{value}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Astuce lien vente */}
        <div className="p-4 rounded-2xl flex items-start gap-3"
          style={{ background: 'rgba(74,144,217,0.06)', border: '1px solid rgba(74,144,217,0.25)' }}>
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-black" style={{ color: '#4a90d9' }}>Vendre tes ressources</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Utilise <b>Gumroad</b>, <b>Payhip</b> ou <b>Notion + Stripe</b> pour vendre tes ebooks. Colle simplement le lien dans chaque ressource.
            </p>
          </div>
        </div>

        {/* Liste */}
        {filtered.length === 0
          ? <div className="text-center py-16">
              <div className="text-5xl mb-4">📚</div>
              <p className="font-black" style={{ color: 'var(--text-primary)' }}>Aucune ressource</p>
            </div>
          : <div className="space-y-3">
              {filtered.map(r => (
                <ResourceCard key={r.id} resource={r}
                  onEdit={(res) => { setEditing(res); setShowForm(true) }}
                  onDelete={(id) => setResources(prev => prev.filter(r => r.id !== id))}
                  onToggle={(id) => setResources(prev => prev.map(r => r.id === id ? {...r, published: !r.published} : r))} />
              ))}
            </div>
        }
      </div>

      {showForm && <ResourceForm resource={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null) }} />}
    </div>
  )
}
