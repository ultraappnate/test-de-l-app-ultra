import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const ITEM_TYPES = [
  { key: 'programme',   label: 'Programme',     icon: '🏋️' },
  { key: 'diete',       label: 'Diète',         icon: '🥗' },
  { key: 'merch',       label: 'Merch',         icon: '👕' },
  { key: 'masterclass', label: 'Masterclass',   icon: '🎬' },
  { key: 'ebook',       label: 'Ebook',         icon: '📚' },
  { key: 'seance',      label: 'Séance',        icon: '🎯' },
  { key: 'autre',       label: 'Autre',         icon: '✨' },
]
const itemCfg = (t) => ITEM_TYPES.find(x => x.key === t) || ITEM_TYPES[6]
const EMOJIS = ['📦', '🔥', '💎', '🏆', '⚡', '🚀', '👑', '🎁']

export default function PackagesManager() {
  const navigate = useNavigate()
  const { token, user } = useStore()
  const [packages, setPackages] = useState([])
  const [myPrograms, setMyPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [pk, progs] = await Promise.all([
        fetch(`${API}/packages`, { headers }).then(r => r.json()),
        fetch(`${API}/programs`, { headers }).then(r => r.json()),
      ])
      setPackages(Array.isArray(pk) ? pk : [])
      setMyPrograms(Array.isArray(progs) ? progs.filter(p => p.coachId === user?.id) : [])
    } catch {}
    setLoading(false)
  }

  async function toggleActive(pkg) {
    await fetch(`${API}/packages/${pkg.id}`, { method: 'PUT', headers, body: JSON.stringify({ active: !pkg.active }) })
    loadAll()
  }
  async function del(id) {
    if (!confirm('Supprimer ce package ?')) return
    await fetch(`${API}/packages/${id}`, { method: 'DELETE', headers })
    loadAll()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 20, cursor: 'pointer' }}>←</button>
          <div>
            <p style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)' }}>Mes Packages</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{packages.length} package{packages.length > 1 ? 's' : ''} · vends tes offres groupées</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(16px,4vw,24px)' }}>
        <button onClick={() => { setEditing(null); setShowForm(true) }} style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          background: 'var(--accent)', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', marginBottom: 18,
        }}>+ Nouveau package</button>

        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Chargement…</p>}

        {!loading && packages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 44, marginBottom: 12 }}>📦</p>
            <p style={{ fontWeight: 900, fontSize: 17, color: 'var(--text-primary)', marginBottom: 6 }}>Aucun package</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 340, margin: '0 auto' }}>
              Combine plusieurs offres — programme + diète + ebook + masterclass + merch… — en une seule vente à prix groupé.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {packages.map(pkg => (
            <PackageCard key={pkg.id} pkg={pkg}
              onToggle={() => toggleActive(pkg)}
              onEdit={() => { setEditing(pkg); setShowForm(true) }}
              onDelete={() => del(pkg.id)} />
          ))}
        </div>
      </div>

      {showForm && (
        <PackageForm token={token} myPrograms={myPrograms} editing={editing}
          onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadAll() }} />
      )}
    </div>
  )
}

const iconBtn = { background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, width: 38, height: 38, fontSize: 14, cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }

function PackageCard({ pkg, onToggle, onEdit, onDelete }) {
  const savings = Math.max(0, (pkg.totalValue || 0) - pkg.price)
  const savePct = pkg.totalValue > 0 ? Math.round((savings / pkg.totalValue) * 100) : 0
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px', opacity: pkg.active ? 1 : 0.6 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 50, height: 50, borderRadius: 14, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{pkg.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: 'var(--text-primary)' }}>{pkg.name}</span>
            {!pkg.active && <span style={{ background: '#f59e0b18', color: '#f59e0b', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>En pause</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>{pkg.price}€</span>
            {savings > 0 && <span style={{ fontSize: 12, color: 'var(--text-faint)', textDecoration: 'line-through' }}>{pkg.totalValue}€</span>}
            {savings > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>−{savePct}% · {savings}€ économisés</span>}
          </div>
          {pkg.salesCount > 0 && <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{pkg.salesCount} vente{pkg.salesCount > 1 ? 's' : ''}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
        {pkg.items.map((it, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 9px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {itemCfg(it.type).icon} {it.name}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={onToggle} style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-base)', color: pkg.active ? '#f59e0b' : '#22c55e', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          {pkg.active ? '⏸ Mettre en pause' : '▶ Réactiver'}
        </button>
        <button onClick={onEdit} style={iconBtn}>✎</button>
        <button onClick={onDelete} style={{ ...iconBtn, color: '#ef4444' }}>🗑</button>
      </div>
    </div>
  )
}

const sheetWrap = { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }
const sheet = { background: 'var(--bg-card)', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', padding: '20px' }
const label = { fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, marginTop: 16 }
const input = { width: '100%', padding: '11px 13px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }

function PackageForm({ token, myPrograms, editing, onClose, onSaved }) {
  const [name, setName] = useState(editing?.name || '')
  const [description, setDescription] = useState(editing?.description || '')
  const [emoji, setEmoji] = useState(editing?.emoji || '📦')
  const [items, setItems] = useState(editing?.items?.length ? editing.items : [
    { type: 'programme', name: '', value: '' },
    { type: 'diete', name: '', value: '' },
  ])
  const [price, setPrice] = useState(editing?.price || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const totalValue = items.reduce((s, it) => s + (Number(it.value) || 0), 0)
  const savings = Math.max(0, totalValue - (Number(price) || 0))

  function updateItem(i, patch) { setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it)) }
  function addItem() { setItems(prev => [...prev, { type: 'autre', name: '', value: '' }]) }
  function removeItem(i) { setItems(prev => prev.filter((_, idx) => idx !== i)) }
  function pickProgram(i, prog) { updateItem(i, { programId: prog.id, name: prog.title, value: prog.price || 0, type: 'programme' }) }

  async function save() {
    if (!name.trim()) { setError('Donne un nom au package'); return }
    const valid = items.filter(it => it.name.trim() || it.programId)
    if (valid.length < 2) { setError('Ajoute au moins 2 éléments'); return }
    if (!price || Number(price) <= 0) { setError('Indique un prix de vente'); return }
    setSaving(true); setError('')
    try {
      const url = editing ? `${API}/packages/${editing.id}` : `${API}/packages`
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers, body: JSON.stringify({ name, description, emoji, items: valid, price: Number(price) }) })
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur')
      onSaved()
    } catch (e) { setError(e.message); setSaving(false) }
  }

  return (
    <div style={sheetWrap} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 900, fontSize: 18, color: 'var(--text-primary)' }}>{editing ? 'Modifier le package' : 'Nouveau package'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-faint)', cursor: 'pointer' }}>✕</button>
        </div>

        <label style={label}>Nom du package</label>
        <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="Transformation Totale 90 jours" />

        <label style={label}>Description</label>
        <textarea style={{ ...input, minHeight: 60, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Tout ce qu'il te faut pour atteindre ton objectif." />

        <label style={label}>Icône</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => setEmoji(e)} style={{
              width: 42, height: 42, borderRadius: 12, fontSize: 20, cursor: 'pointer',
              border: emoji === e ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: emoji === e ? 'var(--accent-subtle)' : 'var(--bg-base)',
            }}>{e}</button>
          ))}
        </div>

        <label style={label}>Éléments du package</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((it, i) => (
            <div key={i} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {ITEM_TYPES.map(t => (
                  <button key={t.key} type="button" onClick={() => updateItem(i, { type: t.key })} style={{
                    padding: '5px 9px', borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${it.type === t.key ? 'var(--accent)' : 'var(--border)'}`,
                    background: it.type === t.key ? 'var(--accent)' : 'var(--bg-card)',
                    color: it.type === t.key ? '#fff' : 'var(--text-secondary)',
                  }}>{t.icon} {t.label}</button>
                ))}
              </div>
              {it.type === 'programme' && myPrograms.length > 0 && (
                <select style={{ ...input, marginBottom: 8 }} value={it.programId || ''} onChange={e => {
                  const prog = myPrograms.find(p => p.id === e.target.value)
                  if (prog) pickProgram(i, prog); else updateItem(i, { programId: null })
                }}>
                  <option value="">— Choisir un de mes programmes (ou saisir ci-dessous) —</option>
                  {myPrograms.map(p => <option key={p.id} value={p.id}>{p.title} ({p.price}€)</option>)}
                </select>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...input, flex: 1 }} value={it.name} onChange={e => updateItem(i, { name: e.target.value, programId: null })} placeholder="Nom de l'élément" />
                <div style={{ position: 'relative', width: 100 }}>
                  <input style={{ ...input, paddingRight: 24 }} type="number" min="0" value={it.value} onChange={e => updateItem(i, { value: e.target.value })} placeholder="Valeur" />
                  <span style={{ position: 'absolute', right: 10, top: 12, color: 'var(--text-faint)', fontSize: 13 }}>€</span>
                </div>
                {items.length > 2 && (
                  <button type="button" onClick={() => removeItem(i)} style={{ ...iconBtn, color: '#ef4444' }}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem} style={{
          marginTop: 10, width: '100%', padding: '10px', borderRadius: 11,
          border: '1px dashed var(--border)', background: 'var(--bg-base)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>+ Ajouter un élément</button>

        <label style={label}>Prix de vente du package</label>
        <div style={{ position: 'relative' }}>
          <input style={{ ...input, paddingRight: 26 }} type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} placeholder="99" />
          <span style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-faint)' }}>€</span>
        </div>

        {/* Récap valeur / économie */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--bg-base)' }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 700 }}>Valeur cumulée</p>
            <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', textDecoration: savings > 0 ? 'line-through' : 'none' }}>{totalValue}€</p>
          </div>
          {savings > 0 && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>Le client économise</p>
              <p style={{ fontSize: 16, fontWeight: 900, color: '#16a34a' }}>{savings}€</p>
            </div>
          )}
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12, fontWeight: 600 }}>{error}</p>}

        <button onClick={save} disabled={saving} style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          background: 'var(--accent)', color: '#fff', fontWeight: 900, fontSize: 15,
          cursor: saving ? 'not-allowed' : 'pointer', marginTop: 18,
        }}>{saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer le package'}</button>
      </div>
    </div>
  )
}
