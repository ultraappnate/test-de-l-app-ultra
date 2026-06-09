import { useEffect, useState, useRef } from 'react'
import { useStore } from '../store'
import { v4 as uuidv4 } from 'uuid'

// ─── Boutique ────────────────────────────────────────────
const PRODUCT_CATEGORIES = [
  { id: 'complement',    label: 'Compléments',     icon: '💊', color: '#27ae60', bg: 'rgba(39,174,96,0.12)'   },
  { id: 'vetement',      label: 'Vêtements',       icon: '👕', color: '#4a90d9', bg: 'rgba(74,144,217,0.12)'  },
  { id: 'accessoire',    label: 'Accessoires',     icon: '🎽', color: '#8e44ad', bg: 'rgba(142,68,173,0.12)'  },
  { id: 'programme',     label: 'Programmes',      icon: '📋', color: 'var(--accent)', bg: 'var(--accent-subtle)' },
  { id: 'consultation',  label: 'Consultations',   icon: '📞', color: '#e67e22', bg: 'rgba(230,126,34,0.12)'  },
  { id: 'ebook',         label: 'Ebooks / PDF',    icon: '📚', color: '#e8a020', bg: 'rgba(232,160,32,0.12)'  },
  { id: 'collaboration', label: 'Collaborations',  icon: '🤝', color: '#c0392b', bg: 'rgba(192,57,43,0.12)'   },
  { id: 'autre',         label: 'Autre',           icon: '📦', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
]

function getCat(id) { return PRODUCT_CATEGORIES.find(c => c.id === id) || PRODUCT_CATEGORIES[7] }

function ProductForm({ product, onSave, onCancel }) {
  const [form, setForm] = useState(product || {
    name: '', type: 'programme', price: '', description: '',
    link: '', badge: '', available: true, stock: '',
  })

  return (
    <div className="p-5 rounded-2xl space-y-4" style={{ background: 'var(--bg-base)', border: '2px solid var(--accent)' }}>
      <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
        {product ? '✎ Modifier le produit' : '+ Nouveau produit / offre'}
      </p>

      <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
        placeholder="Nom du produit ou de l'offre"
        className="w-full px-3 py-2.5 rounded-xl text-sm"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />

      {/* Category pills */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>Catégorie</p>
        <div className="flex gap-2 flex-wrap">
          {PRODUCT_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setForm(f => ({...f, type: c.id}))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: form.type === c.id ? c.bg : 'var(--bg-card)',
                color: form.type === c.id ? c.color : 'var(--text-secondary)',
                border: `1px solid ${form.type === c.id ? c.color : 'var(--border)'}`,
                transform: form.type === c.id ? 'scale(1.04)' : 'scale(1)',
              }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))}
          placeholder="Prix (ex: 29€)"
          className="px-3 py-2 rounded-xl text-sm"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
        <input value={form.stock} onChange={e => setForm(f => ({...f, stock: e.target.value}))}
          placeholder="Stock (optionnel)"
          className="px-3 py-2 rounded-xl text-sm"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
        <input value={form.badge} onChange={e => setForm(f => ({...f, badge: e.target.value}))}
          placeholder="Badge (⭐ Bestseller)"
          className="px-3 py-2 rounded-xl text-sm"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
      </div>

      <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
        placeholder="Description courte (bénéfices, contenu…)"
        rows={2}
        className="w-full px-3 py-2 rounded-xl text-sm resize-none"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />

      <input value={form.link} onChange={e => setForm(f => ({...f, link: e.target.value}))}
        placeholder="Lien externe (Shopify, Gumroad, Notion…)"
        className="w-full px-3 py-2 rounded-xl text-sm"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          Annuler
        </button>
        <button onClick={() => onSave({...form, id: form.id || uuidv4()})}
          disabled={!form.name}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: form.name ? 'var(--accent)' : 'var(--border)' }}>
          {product ? 'Mettre à jour' : 'Ajouter'}
        </button>
      </div>
    </div>
  )
}

function ShopSection({ products, onUpdate }) {
  const [showForm, setShowForm]   = useState(false)
  const [editId,   setEditId]     = useState(null)
  const [filterCat, setFilterCat] = useState('all')
  const all = products || []

  const handleSave = (prod) => {
    const existing = all.findIndex(p => p.id === prod.id)
    onUpdate(existing >= 0 ? all.map(p => p.id === prod.id ? prod : p) : [...all, prod])
    setShowForm(false); setEditId(null)
  }
  const handleDelete = (id) => onUpdate(all.filter(p => p.id !== id))
  const handleToggle = (id) => onUpdate(all.map(p => p.id === id ? {...p, available: !p.available} : p))

  // Build categories that have products
  const usedCats = PRODUCT_CATEGORIES.filter(c => all.some(p => p.type === c.id))
  const availableCount = all.filter(p => p.available).length

  // Group products by category
  const grouped = PRODUCT_CATEGORIES
    .map(cat => ({ cat, items: all.filter(p => p.type === cat.id) }))
    .filter(g => g.items.length > 0)

  const filtered = filterCat === 'all' ? grouped : grouped.filter(g => g.cat.id === filterCat)

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Propose ton merchandising, programmes, consultations ou collaborations directement sur ton profil public.
      </p>

      {/* ── Overview bar ── */}
      {all.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Produits total', value: all.length,        color: 'var(--text-primary)', icon: '📦' },
            { label: 'Actifs',         value: availableCount,    color: '#27ae60',              icon: '✅' },
            { label: 'Catégories',     value: usedCats.length,   color: '#4a90d9',              icon: '🗂' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="p-3 rounded-xl text-center"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
              <p className="text-base">{icon}</p>
              <p className="text-xl font-black mt-0.5" style={{ color }}>{value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Category filter tabs ── */}
      {usedCats.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterCat('all')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: filterCat === 'all' ? 'var(--accent)' : 'var(--bg-card)',
              color: filterCat === 'all' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}>
            Tout voir ({all.length})
          </button>
          {usedCats.map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: filterCat === c.id ? c.bg : 'var(--bg-card)',
                color: filterCat === c.id ? c.color : 'var(--text-secondary)',
                border: `1px solid ${filterCat === c.id ? c.color : 'var(--border)'}`,
              }}>
              {c.icon} {c.label} ({all.filter(p => p.type === c.id).length})
            </button>
          ))}
        </div>
      )}

      {/* ── Products grouped by category ── */}
      {filtered.map(({ cat, items }) => (
        <div key={cat.id} className="space-y-2">
          {/* Category header */}
          <div className="flex items-center gap-2 py-1">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
              style={{ background: cat.bg, border: `1px solid ${cat.color}` }}>
              {cat.icon}
            </div>
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: cat.color }}>
              {cat.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: cat.bg, color: cat.color }}>
              {items.length}
            </span>
            <div className="flex-1 h-px" style={{ background: `${cat.color}33` }} />
          </div>

          {/* Product cards in this category */}
          <div className="grid grid-cols-1 gap-2 pl-1">
            {items.map(p => (
              editId === p.id ? (
                <ProductForm key={p.id} product={p} onSave={handleSave} onCancel={() => setEditId(null)} />
              ) : (
                <div key={p.id}
                  className="flex items-start gap-3 p-4 rounded-2xl transition-all"
                  style={{
                    background: 'var(--bg-base)',
                    border: `1px solid ${p.available ? 'var(--border)' : 'var(--border)'}`,
                    opacity: p.available ? 1 : 0.55,
                    borderLeft: `3px solid ${p.available ? cat.color : 'var(--border)'}`,
                  }}>
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: cat.bg, border: `1px solid ${cat.color}44` }}>
                    {cat.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                      {p.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: 'rgba(232,160,32,0.15)', color: '#e8a020' }}>
                          {p.badge}
                        </span>
                      )}
                      {!p.available && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: 'var(--border)', color: 'var(--text-faint)' }}>
                          Désactivé
                        </span>
                      )}
                    </div>

                    {p.description && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {p.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {p.price && (
                        <span className="text-sm font-black" style={{ color: cat.color }}>
                          {p.price}
                        </span>
                      )}
                      {p.stock && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
                          Stock : {p.stock}
                        </span>
                      )}
                      {p.link && (
                        <a href={p.link} target="_blank" rel="noreferrer"
                          className="text-[10px] font-bold flex items-center gap-1 hover:underline"
                          style={{ color: '#4a90d9' }}>
                          🔗 Voir le lien
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditId(p.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      ✎
                    </button>
                    <button onClick={() => handleToggle(p.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
                      style={{
                        background: p.available ? 'rgba(39,174,96,0.1)' : 'var(--bg-card)',
                        color: p.available ? '#27ae60' : 'var(--text-faint)',
                        border: '1px solid var(--border)',
                      }}>
                      {p.available ? '👁' : '🙈'}
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
                      style={{ background: 'rgba(160,56,72,0.1)', color: '#a03848', border: '1px solid var(--border)' }}>
                      ✕
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {all.length === 0 && (
        <div className="py-8 text-center rounded-2xl" style={{ background: 'var(--bg-base)', border: '1px dashed var(--border)' }}>
          <p className="text-3xl mb-2">🛍️</p>
          <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Ta boutique est vide</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Ajoute tes premiers produits ou offres</p>
        </div>
      )}

      {/* Form / Add button */}
      {showForm
        ? <ProductForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        : (
          <button onClick={() => setShowForm(true)}
            className="w-full py-3 rounded-2xl text-sm font-bold transition"
            style={{ background: 'var(--bg-card)', color: 'var(--accent)', border: '2px dashed var(--accent)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-subtle)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}>
            + Ajouter un produit / une offre
          </button>
        )
      }
    </div>
  )
}

const SPECIALTIES_OPTS = [
  'Force','Cardio','Nutrition','Mobilité','Combiné',
  'Prise de masse','Sèche','Performance','Réathlétisation','Crossfit','HIIT',
]

async function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload  = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

function ytEmbed(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  const v = url.match(/vimeo\.com\/(\d+)/)
  if (v) return `https://player.vimeo.com/video/${v[1]}`
  return null
}

export default function CoachMyProfile() {
  const { fetchProfile, updateProfile, user } = useStore()

  const [profile, setProfile] = useState({
    name: '', bio: '', specialties: [], calendlyUrl: '', avatar: null,
    instagram: '', photos: [], videoUrl: '', videoData: null, shop: [],
    banner: null,
  })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [videoTab, setVideoTab] = useState('url') // 'url' | 'local'

  const avatarRef = useRef()
  const photosRef = useRef()
  const videoRef  = useRef()
  const bannerRef = useRef()

  useEffect(() => {
    fetchProfile().then(p => {
      if (p) {
        setProfile({
          name:       p.name       || '',
          bio:        p.bio        || '',
          specialties:p.specialties|| [],
          calendlyUrl:p.calendlyUrl|| '',
          avatar:     p.avatar     || null,
          banner:     p.banner     || null,
          instagram:  p.instagram  || '',
          photos:     p.photos     || [],
          videoUrl:   p.videoUrl   || '',
          videoData:  p.videoData  || null,
        })
      }
      setLoading(false)
    })
  }, [])

  const toggleSpec = s => setProfile(p => ({
    ...p,
    specialties: p.specialties.includes(s)
      ? p.specialties.filter(x => x !== s)
      : [...p.specialties, s],
  }))

  const handleBanner = async e => {
    const f = e.target.files[0]; if (!f) return
    const b64 = await fileToBase64(f)
    setProfile(p => ({...p, banner: b64}))
    e.target.value = ''
  }

  const handleAvatar = async e => {
    const f = e.target.files[0]; if (!f) return
    setProfile(p => ({...p, avatar: null}))
    const b64 = await fileToBase64(f)
    setProfile(p => ({...p, avatar: b64}))
  }

  const handleAddPhotos = async e => {
    const files = Array.from(e.target.files)
    const b64s  = await Promise.all(files.map(fileToBase64))
    setProfile(p => ({...p, photos: [...(p.photos||[]), ...b64s].slice(0, 9)}))
    e.target.value = ''
  }

  const removePhoto = idx =>
    setProfile(p => ({...p, photos: p.photos.filter((_,i)=>i!==idx)}))

  const handleVideoFile = async e => {
    const f = e.target.files[0]; if (!f) return
    const b64 = await fileToBase64(f)
    setProfile(p => ({...p, videoData: b64, videoUrl: ''}))
  }

  const handleSave = async () => {
    setSaving(true); setSaveErr('')
    try {
      const res = await updateProfile(profile)
      if (res.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setSaveErr(res.error || 'Erreur lors de la sauvegarde')
      }
    } catch (e) {
      setSaveErr('Erreur réseau')
    }
    setSaving(false)
  }

  const initials    = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?'
  const hasCalendly = !!profile.calendlyUrl
  const embedUrl    = profile.videoUrl ? ytEmbed(profile.videoUrl) : null

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg-base)'}}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{borderColor:'var(--border)',borderTopColor:'var(--accent)'}}/>
    </div>
  )

  return (
    <div className="min-h-screen" style={{background:'var(--bg-base)'}}>

      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between"
        style={{background:'var(--bg-base)',borderBottom:'1px solid var(--border)',backdropFilter:'blur(12px)'}}>
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{color:'var(--gold)'}}>Coach</p>
          <h1 className="text-xl font-black" style={{color:'var(--text-primary)'}}>Mon Profil</h1>
        </div>
        <div className="flex items-center gap-3">
          {saved    && <span className="text-sm font-bold" style={{color:'#27ae60'}}>✓ Profil sauvegardé</span>}
          {saveErr  && <span className="text-sm font-bold" style={{color:'#a03848'}}>{saveErr}</span>}
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition"
            style={{background:'var(--accent)'}}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

        {/* ── Avatar + identité ─────────────────────────── */}
        <div className="rounded-2xl p-6" style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
          <p className="text-xs font-black tracking-widest uppercase mb-4" style={{color:'var(--text-muted)'}}>Identité</p>
          <div className="flex items-center gap-5">
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar}/>
            <button onClick={()=>avatarRef.current?.click()}
              className="relative w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center font-black text-xl text-white flex-shrink-0 group transition"
              style={{background: profile.avatar ? 'transparent' : 'var(--accent)', border:'2px solid var(--border)'}}>
              {profile.avatar
                ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover"/>
                : <span>{initials}</span>}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                style={{background:'rgba(0,0,0,0.55)'}}>
                <span className="text-white text-xs font-bold">📷 Changer</span>
              </div>
            </button>
            <div className="flex-1">
              <input
                value={profile.name}
                onChange={e => setProfile(p => ({...p, name: e.target.value}))}
                placeholder="Ton nom affiché"
                className="w-full px-3 py-2 rounded-xl text-xl font-black focus:outline-none mb-1"
                style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-primary)'}}
              />
              <p className="text-sm mt-0.5" style={{color:'var(--text-faint)'}}>Coach · {user?.email}</p>
              <p className="text-xs mt-1.5" style={{color:'var(--text-faint)'}}>Cliquer sur la photo pour la modifier</p>
            </div>
          </div>

          {/* Image de couverture (bandeau dashboard) */}
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner}/>
          <div className="flex items-center gap-3 mt-4 pt-4" style={{borderTop:'1px solid var(--border)'}}>
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{background: profile.banner ? 'transparent' : 'var(--bg-base)', border:'1px solid var(--border)'}}>
              {profile.banner
                ? <img src={profile.banner} alt="couverture" className="w-full h-full object-cover"/>
                : <span style={{fontSize:18}}>🖼</span>}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold" style={{color:'var(--text-primary)'}}>Image de couverture</p>
              <p className="text-[10px]" style={{color:'var(--text-faint)'}}>Affichée en fond sur ton tableau de bord</p>
            </div>
            <div className="flex items-center gap-2">
              {profile.banner && (
                <button onClick={() => setProfile(p => ({...p, banner: null}))}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-70"
                  style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-faint)'}}>
                  Retirer
                </button>
              )}
              <button onClick={() => bannerRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-80"
                style={{background:'var(--accent-subtle)',border:'1px solid var(--accent)',color:'var(--accent)'}}>
                {profile.banner ? 'Changer' : 'Choisir'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Bio ───────────────────────────────────────── */}
        <div className="rounded-2xl p-6" style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
          <p className="text-xs font-black tracking-widest uppercase mb-3" style={{color:'var(--text-muted)'}}>Bio</p>
          <textarea value={profile.bio}
            onChange={e=>setProfile(p=>({...p,bio:e.target.value}))}
            rows={4} placeholder="Décris ton expertise, ton approche, tes certifications, ce qui te différencie..."
            className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none leading-relaxed"
            style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
          <p className="text-[10px] mt-1.5 text-right" style={{color:'var(--text-faint)'}}>{profile.bio.length} caractères</p>
        </div>

        {/* ── Spécialités ───────────────────────────────── */}
        <div className="rounded-2xl p-6" style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
          <p className="text-xs font-black tracking-widest uppercase mb-3" style={{color:'var(--text-muted)'}}>
            Spécialités · <span style={{color:'var(--accent)'}}>{profile.specialties.length}</span> sélectionnée{profile.specialties.length>1?'s':''}
          </p>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES_OPTS.map(s => (
              <button key={s} onClick={()=>toggleSpec(s)}
                className="px-3 py-2 rounded-xl text-sm font-bold transition-all duration-150"
                style={{
                  background: profile.specialties.includes(s) ? 'var(--accent)' : 'var(--bg-base)',
                  color:      profile.specialties.includes(s) ? '#fff' : 'var(--text-muted)',
                  border:     `1px solid ${profile.specialties.includes(s) ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                {profile.specialties.includes(s) && <span className="mr-1">✓</span>}{s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Photos galerie ────────────────────────────── */}
        <div className="rounded-2xl p-6" style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black tracking-widest uppercase" style={{color:'var(--text-muted)'}}>
              Photos · <span style={{color:'var(--accent)'}}>{profile.photos?.length||0}</span>/9
            </p>
            {(profile.photos?.length||0) < 9 && (
              <button onClick={()=>photosRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
                style={{background:'var(--accent-subtle)',color:'var(--accent)',border:'1px solid var(--accent)'}}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.color='#fff'}}
                onMouseLeave={e=>{e.currentTarget.style.background='var(--accent-subtle)';e.currentTarget.style.color='var(--accent)'}}>
                + Ajouter des photos
              </button>
            )}
          </div>
          <input ref={photosRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos}/>

          {(profile.photos?.length||0) === 0 ? (
            <button onClick={()=>photosRef.current?.click()}
              className="w-full py-8 rounded-2xl flex flex-col items-center gap-2 transition"
              style={{border:'2px dashed var(--border)',color:'var(--text-faint)',background:'transparent'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-faint)'}}>
              <span className="text-3xl">📸</span>
              <span className="text-sm font-bold">Importer des photos</span>
              <span className="text-xs">Avant/après, séances, résultats — max 9 photos</span>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {profile.photos.map((photo, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden"
                  style={{aspectRatio:'1',background:'var(--bg-base)'}}>
                  <img src={photo} alt={`photo ${i+1}`} className="w-full h-full object-cover"/>
                  <button onClick={()=>removePhoto(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                    style={{background:'rgba(160,56,72,0.9)',color:'#fff'}}>✕</button>
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{background:'rgba(0,0,0,0.6)',color:'#fff'}}>Principale</span>
                  )}
                </div>
              ))}
              {(profile.photos.length < 9) && (
                <button onClick={()=>photosRef.current?.click()}
                  className="rounded-xl flex flex-col items-center justify-center gap-1 transition"
                  style={{aspectRatio:'1',border:'2px dashed var(--border)',color:'var(--text-faint)',background:'transparent'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-faint)'}}>
                  <span className="text-xl">+</span>
                  <span className="text-[10px] font-bold">Ajouter</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Vidéo de présentation ─────────────────────── */}
        <div className="rounded-2xl p-6" style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
          <p className="text-xs font-black tracking-widest uppercase mb-3" style={{color:'var(--text-muted)'}}>
            Vidéo de présentation
          </p>

          {/* Tabs URL / Local */}
          <div className="flex gap-1 p-1 rounded-xl mb-4 w-fit"
            style={{background:'var(--bg-base)',border:'1px solid var(--border)'}}>
            {[{id:'url',label:'🔗 URL YouTube / Vimeo'},{id:'local',label:'📁 Fichier local'}].map(t=>(
              <button key={t.id} onClick={()=>setVideoTab(t.id)}
                className="px-4 py-2 rounded-lg text-xs font-bold transition"
                style={{
                  background: videoTab===t.id ? 'var(--accent)' : 'transparent',
                  color:      videoTab===t.id ? '#fff' : 'var(--text-muted)',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {videoTab === 'url' ? (
            <div>
              <input value={profile.videoUrl}
                onChange={e=>setProfile(p=>({...p,videoUrl:e.target.value,videoData:null}))}
                placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                className="w-full px-4 py-3 rounded-xl text-sm font-mono focus:outline-none"
                style={{background:'var(--bg-base)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/>
              {embedUrl && (
                <div className="mt-3 rounded-xl overflow-hidden" style={{aspectRatio:'16/9'}}>
                  <iframe src={embedUrl} className="w-full h-full" frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen title="Vidéo de présentation"/>
                </div>
              )}
            </div>
          ) : (
            <div>
              <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFile}/>
              <button onClick={()=>videoRef.current?.click()}
                className="w-full py-6 rounded-xl flex flex-col items-center gap-2 transition"
                style={{border:'2px dashed var(--border)',color:'var(--text-faint)',background:'transparent'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-faint)'}}>
                <span className="text-3xl">🎬</span>
                <span className="text-sm font-bold">
                  {profile.videoData ? '✓ Vidéo chargée — Cliquer pour changer' : 'Importer une vidéo'}
                </span>
                <span className="text-xs">MP4, MOV, WebM — recommandé &lt; 50 Mo</span>
              </button>
              {profile.videoData && (
                <div className="mt-3 rounded-xl overflow-hidden" style={{aspectRatio:'16/9',background:'#000'}}>
                  <video src={profile.videoData} controls className="w-full h-full" style={{objectFit:'contain'}}/>
                </div>
              )}
            </div>
          )}

          {(profile.videoUrl || profile.videoData) && (
            <button onClick={()=>setProfile(p=>({...p,videoUrl:'',videoData:null}))}
              className="mt-2 text-xs font-bold"
              style={{color:'#a03848'}}>
              ✕ Supprimer la vidéo
            </button>
          )}
        </div>

        {/* ── Liens sociaux ─────────────────────────────── */}
        <div className="rounded-2xl p-6" style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
          <p className="text-xs font-black tracking-widest uppercase mb-4" style={{color:'var(--text-muted)'}}>Liens & Réseaux</p>

          {/* Instagram */}
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1.5" style={{color:'var(--text-secondary)'}}>
              Instagram
            </label>
            <div className="flex items-center rounded-xl overflow-hidden"
              style={{border:`1px solid ${profile.instagram?'#e040a0':'var(--border)'}`,background:'var(--bg-base)'}}>
              <span className="px-3 py-3 text-sm flex-shrink-0 flex items-center gap-1.5"
                style={{background:'var(--bg-card)',borderRight:'1px solid var(--border)',color:'var(--text-faint)'}}>
                📸 @
              </span>
              <input value={profile.instagram.replace(/^@/,'')}
                onChange={e=>setProfile(p=>({...p,instagram:e.target.value.replace(/^@/,'')}))}
                placeholder="votre.compte"
                className="flex-1 px-3 py-3 text-sm focus:outline-none bg-transparent"
                style={{color:'var(--text-primary)'}}/>
              {profile.instagram && (
                <a href={`https://instagram.com/${profile.instagram.replace(/^@/,'')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-3 text-xs font-bold flex-shrink-0"
                  style={{color:'#e040a0'}}>
                  Voir ↗
                </a>
              )}
            </div>
          </div>

          {/* Calendly */}
          <div>
            <label className="block text-xs font-bold mb-1.5 flex items-center gap-2" style={{color:'var(--text-secondary)'}}>
              Calendly
              <span className="w-1.5 h-1.5 rounded-full" style={{background: hasCalendly ? '#27ae60' : '#e8a020'}}/>
              <span className="font-normal" style={{color: hasCalendly ? '#27ae60' : '#e8a020'}}>
                {hasCalendly ? 'Configuré — Visible dans le catalogue' : 'Non configuré'}
              </span>
            </label>
            <div className="flex items-center rounded-xl overflow-hidden"
              style={{border:`1px solid ${hasCalendly?'#27ae60':'var(--border)'}`,background:'var(--bg-base)'}}>
              <span className="px-3 py-3 text-xs font-mono flex-shrink-0"
                style={{background:'var(--bg-card)',borderRight:'1px solid var(--border)',color:'var(--text-faint)'}}>
                📅 calendly.com/
              </span>
              <input
                value={profile.calendlyUrl.replace(/^https?:\/\/(www\.)?calendly\.com\//,'')}
                onChange={e=>setProfile(p=>({...p,calendlyUrl:e.target.value
                  ? `https://calendly.com/${e.target.value.replace(/^https?:\/\/(www\.)?calendly\.com\//,'')}`
                  : ''
                }))}
                placeholder="votre-nom/appel-decouverte"
                className="flex-1 px-3 py-3 text-sm font-mono focus:outline-none bg-transparent"
                style={{color:'var(--text-primary)'}}/>
              {hasCalendly && (
                <a href={profile.calendlyUrl} target="_blank" rel="noopener noreferrer"
                  className="px-3 text-xs font-bold flex-shrink-0"
                  style={{color:'#27ae60'}}>
                  Tester ↗
                </a>
              )}
            </div>
            {!hasCalendly && (
              <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{color:'var(--text-faint)'}}>
                Pas encore de compte ?
                <a href="https://calendly.com" target="_blank" rel="noopener noreferrer"
                  className="font-bold underline" style={{color:'var(--accent)'}}>Créer un compte gratuit ↗</a>
              </p>
            )}
          </div>
        </div>

        {/* ── Boutique ──────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
          <div className="px-5 py-4" style={{borderBottom:'1px solid var(--border)'}}>
            <div className="flex items-center gap-2">
              <span className="text-lg">🛍️</span>
              <div>
                <p className="font-black text-sm" style={{color:'var(--text-primary)'}}>Ma Boutique</p>
                <p className="text-xs" style={{color:'var(--text-faint)'}}>Merchandising, programmes, collaborations</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <ShopSection
              products={profile.shop || []}
              onUpdate={items => setProfile(p => ({...p, shop: items}))}
            />
          </div>
        </div>

        {/* ── Statut visibilité ─────────────────────────── */}
        <div className="rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: hasCalendly ? 'rgba(39,174,96,0.06)' : 'rgba(232,160,32,0.06)',
            border: `1px solid ${hasCalendly ? 'rgba(39,174,96,0.3)' : 'rgba(232,160,32,0.3)'}`,
          }}>
          <span className="text-2xl flex-shrink-0">{hasCalendly ? '✅' : '⚠️'}</span>
          <div className="flex-1">
            <p className="font-black text-sm" style={{color: hasCalendly ? '#27ae60' : '#e8a020'}}>
              {hasCalendly ? 'Profil visible dans le catalogue' : 'Profil non visible dans le catalogue'}
            </p>
            <p className="text-xs mt-0.5" style={{color:'var(--text-secondary)'}}>
              {hasCalendly
                ? 'Vos clients peuvent vous trouver dans l\'onglet Accompagnement et réserver un appel.'
                : 'Ajoutez votre lien Calendly pour apparaître dans l\'onglet Accompagnement.'}
            </p>
          </div>
        </div>

        {/* Bouton bas de page */}
        <div className="flex items-center justify-between pt-2 pb-10">
          {saveErr && <span className="text-sm font-bold" style={{color:'#a03848'}}>{saveErr}</span>}
          {!saveErr && <span/>}
          <button onClick={handleSave} disabled={saving}
            className="px-8 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition"
            style={{background:'var(--accent)'}}>
            {saving ? 'Sauvegarde en cours...' : 'Enregistrer le profil'}
          </button>
        </div>

      </div>
    </div>
  )
}
