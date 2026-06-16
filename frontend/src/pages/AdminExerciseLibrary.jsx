import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const CATEGORIES = ['Force', 'Cardio', 'Core', 'Mobilité', 'Fonctionnel']
const MUSCLES_PRESETS = [
  'Quadriceps', 'Ischio-jambiers', 'Fessiers', 'Mollets',
  'Pectoraux', 'Grand dorsal', 'Épaules', 'Biceps', 'Triceps',
  'Abdominaux', 'Lombaires', 'Core', 'Trapèzes', 'Rhomboïdes',
  'Full body', 'Cardio',
]

const EMPTY_FORM = {
  name: '',
  category: 'Force',
  muscles: [],
  equipment: '',
  imageUrl: '',
  videoId: '',
  tips: '',
}

function MuscleTag({ label, selected, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      padding: '4px 10px',
      borderRadius: 20,
      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
      background: selected ? 'var(--accent)' : 'var(--bg-hover)',
      color: selected ? '#fff' : 'var(--text-secondary)',
      fontSize: 11, fontWeight: 700, cursor: 'pointer',
      transition: 'all 0.15s',
    }}>{label}</button>
  )
}

function ExerciseCard({ ex, onEdit, onDelete }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'transform 0.15s',
    }}>
      {/* Image */}
      <div style={{ height: 120, background: 'var(--bg-hover)', position: 'relative', overflow: 'hidden' }}>
        {ex.imageUrl ? (
          <img src={ex.imageUrl} alt={ex.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🏋️</div>
        )}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'var(--accent)',
          color: '#fff', fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 6,
        }}>{ex.category}</div>
        {ex.videoId && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: 'rgba(0,0,0,0.7)', color: '#fff',
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
          }}>▶ Vidéo</div>
        )}
      </div>

      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{ex.name}</p>
        {ex.muscles?.length > 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
            {ex.muscles.join(' · ')}
          </p>
        )}
        {ex.equipment && (
          <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 8 }}>{ex.equipment}</p>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onEdit} style={{
            flex: 1, padding: '7px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg-hover)',
            color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>Modifier</button>
          <button onClick={onDelete} style={{
            width: 36, height: 36, borderRadius: 8,
            border: 'none', background: '#ef444420',
            color: '#ef4444', fontSize: 14, cursor: 'pointer',
          }}>🗑</button>
        </div>
      </div>
    </div>
  )
}

function ExerciseForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const { token } = useStore()

  function toggleMuscle(m) {
    setForm(f => ({
      ...f,
      muscles: f.muscles.includes(m) ? f.muscles.filter(x => x !== m) : [...f.muscles, m],
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const method = form.id ? 'PUT' : 'POST'
    const url = form.id ? `${API}/exercise-library/${form.id}` : `${API}/exercise-library`
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) onSave(data)
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--bg-hover)',
    color: 'var(--text-primary)', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 640,
        background: 'var(--bg-card)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px 36px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontWeight: 900, fontSize: 17, color: 'var(--text-primary)' }}>
            {form.id ? 'Modifier l\'exercice' : 'Nouvel exercice'}
          </p>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <Field label="Nom de l'exercice *">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Squat barre" style={inputStyle} />
          </Field>

          <Field label="Catégorie">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))} style={{
                  padding: '6px 12px', borderRadius: 20,
                  border: `1px solid ${form.category === c ? 'var(--accent)' : 'var(--border)'}`,
                  background: form.category === c ? 'var(--accent)' : 'var(--bg-hover)',
                  color: form.category === c ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>{c}</button>
              ))}
            </div>
          </Field>

          <Field label="Muscles ciblés">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MUSCLES_PRESETS.map(m => (
                <MuscleTag key={m} label={m} selected={form.muscles.includes(m)} onToggle={() => toggleMuscle(m)} />
              ))}
            </div>
          </Field>

          <Field label="Équipement">
            <input value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}
              placeholder="Ex: Barre, Haltères, Poids du corps…" style={inputStyle} />
          </Field>

          <Field label="URL de la photo" hint="Lien direct vers une image (jpg, png)">
            <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://…/photo.jpg" style={inputStyle} />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginTop: 8 }}
                onError={e => e.target.style.display = 'none'} />
            )}
          </Field>

          <Field label="ID vidéo YouTube" hint="Juste l'ID, ex: dZgVxmf6jkA (pas l'URL complète)">
            <input value={form.videoId} onChange={e => setForm(f => ({ ...f, videoId: e.target.value }))}
              placeholder="dZgVxmf6jkA" style={inputStyle} />
            {form.videoId && (
              <div style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${form.videoId}?rel=0&modestbranding=1`}
                  allowFullScreen style={{ width: '100%', height: '100%', border: 'none' }} />
              </div>
            )}
          </Field>

          <Field label="Conseil technique">
            <textarea value={form.tips} onChange={e => setForm(f => ({ ...f, tips: e.target.value }))}
              placeholder="Conseil clé pour bien exécuter l'exercice…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>

        </div>

        <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{
          marginTop: 20, width: '100%',
          padding: '15px',
          borderRadius: 14,
          border: 'none',
          background: 'var(--accent)',
          color: '#fff', fontWeight: 900, fontSize: 15,
          cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
          opacity: saving || !form.name.trim() ? 0.6 : 1,
        }}>{saving ? 'Enregistrement…' : '✓ Enregistrer l\'exercice'}</button>
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
        {label}
        {hint && <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, marginLeft: 6, fontSize: 10 }}>— {hint}</span>}
      </p>
      {children}
    </div>
  )
}

export default function AdminExerciseLibrary() {
  const navigate = useNavigate()
  const { token, user } = useStore()
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEx, setEditingEx] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('Tous')

  useEffect(() => {
    fetch(`${API}/exercise-library`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setExercises(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  function handleSaved(ex) {
    setExercises(prev => {
      const idx = prev.findIndex(e => e.id === ex.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = ex; return next }
      return [...prev, ex]
    })
    setShowForm(false)
    setEditingEx(null)
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cet exercice ?')) return
    await fetch(`${API}/exercise-library/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  const filtered = exercises.filter(ex => {
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscles?.join(' ').toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'Tous' || ex.category === filterCat
    return matchSearch && matchCat
  })

  if (user?.role !== 'admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Accès réservé à l'admin.
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 20, cursor: 'pointer' }}>←</button>
          <div>
            <p style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)' }}>Bibliothèque d'exercices</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{exercises.length} exercice{exercises.length !== 1 ? 's' : ''} · Admin</p>
          </div>
        </div>
        <button onClick={() => { setEditingEx(null); setShowForm(true) }} style={{
          padding: '8px 16px', borderRadius: 10,
          border: 'none', background: 'var(--accent)',
          color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer',
        }}>+ Ajouter</button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(16px,4vw,28px)' }}>

        {/* Recherche + filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un exercice ou un muscle…"
            style={{
              flex: 1, minWidth: 180,
              padding: '9px 14px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--bg-card)',
              color: 'var(--text-primary)', fontSize: 13, outline: 'none',
            }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {['Tous', ...CATEGORIES].map(c => (
              <button key={c} onClick={() => setFilterCat(c)} style={{
                padding: '8px 12px', borderRadius: 10,
                border: `1px solid ${filterCat === c ? 'var(--accent)' : 'var(--border)'}`,
                background: filterCat === c ? 'var(--accent)' : 'var(--bg-card)',
                color: filterCat === c ? '#fff' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Grille */}
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Chargement…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🏋️</p>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
              {exercises.length === 0 ? 'Bibliothèque vide' : 'Aucun résultat'}
            </p>
            <p style={{ fontSize: 13 }}>
              {exercises.length === 0 ? 'Commence à ajouter tes exercices !' : 'Essaie une autre recherche.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,260px), 1fr))',
            gap: 14,
          }}>
            {filtered.map(ex => (
              <ExerciseCard
                key={ex.id}
                ex={ex}
                onEdit={() => { setEditingEx(ex); setShowForm(true) }}
                onDelete={() => handleDelete(ex.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ExerciseForm
          initial={editingEx}
          onSave={handleSaved}
          onCancel={() => { setShowForm(false); setEditingEx(null) }}
        />
      )}
    </div>
  )
}
