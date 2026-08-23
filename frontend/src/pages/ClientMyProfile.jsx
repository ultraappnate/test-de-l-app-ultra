import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { compressImage } from '../utils/image'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const OBJECTIVES = [
  { id: 'weight_loss', icon: '🔥', label: 'Perdre du poids' },
  { id: 'muscle',      icon: '💪', label: 'Prise de masse' },
  { id: 'performance', icon: '⚡', label: 'Performance' },
  { id: 'health',      icon: '❤️', label: 'Santé & bien-être' },
  { id: 'nutrition',   icon: '🥗', label: 'Rééquilibrage nutri.' },
  { id: 'endurance',   icon: '🏃', label: 'Endurance' },
]
const LEVELS = [
  { id: 'beginner',     icon: '🌱', label: 'Débutant' },
  { id: 'intermediate', icon: '🌿', label: 'Intermédiaire' },
  { id: 'advanced',     icon: '🌳', label: 'Avancé' },
  { id: 'athlete',      icon: '🏆', label: 'Athlète' },
]

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 13, fontSize: 15, fontWeight: 600,
  background: 'var(--bg-card)', border: '1.5px solid var(--border)', color: 'var(--text-primary)', outline: 'none',
}
function Label({ children }) {
  return <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px' }}>{children}</p>
}
function Chips({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)}
          style={{ padding: '9px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: value === o.id ? 'var(--accent)' : 'var(--bg-card)',
            border: `1.5px solid ${value === o.id ? 'var(--accent)' : 'var(--border)'}`,
            color: value === o.id ? '#fff' : 'var(--text-secondary)' }}>
          {o.icon} {o.label}
        </button>
      ))}
    </div>
  )
}

export default function ClientMyProfile() {
  const { user, updateProfile, token } = useStore()
  const [form, setForm] = useState({ name: '', avatar: '', objective: '', level: '', weight: '', height: '', age: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '', avatar: user.avatar || '', objective: user.objective || '', level: user.level || '',
      weight: user.weight ?? '', height: user.height ?? '', age: user.age ?? '', bio: user.bio || '',
    })
  }, [user?.id])

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: typeof v === 'string' || typeof v === 'number' ? v : v.target.value }))

  const pickAvatar = async (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const b64 = await compressImage(f, 600, 0.82)
    setForm(x => ({ ...x, avatar: b64 }))
  }

  const save = async () => {
    if (!form.name.trim()) { setMsg('Ton nom est requis'); return }
    setSaving(true); setMsg('')
    const res = await updateProfile({ ...form, name: form.name.trim() })
    setSaving(false)
    setMsg(res.success ? '✓ Profil enregistré' : (res.error || 'Erreur'))
    if (res.success) setTimeout(() => setMsg(''), 2500)
  }

  const changePassword = async () => {
    setPwMsg('')
    if (pw.next.length < 8) return setPwMsg('Le nouveau mot de passe doit faire au moins 8 caractères')
    if (pw.next !== pw.confirm) return setPwMsg('Les deux mots de passe ne correspondent pas')
    setPwBusy(true)
    try {
      const r = await fetch(`${API}/account/password`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Erreur')
      setPw({ current: '', next: '', confirm: '' }); setPwMsg('✓ Mot de passe modifié')
    } catch (e) { setPwMsg(String(e.message)) }
    setPwBusy(false)
  }

  const initials = (form.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const bmi = form.weight && form.height ? (Number(form.weight) / ((Number(form.height) / 100) ** 2)).toFixed(1) : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>Client</p>
        <h1 style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: 'clamp(22px,6vw,32px)', margin: '0 0 22px' }}>Mon profil</h1>

        {/* Avatar + nom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 26 }}>
          <div onClick={() => fileRef.current?.click()} title="Changer la photo"
            style={{ width: 88, height: 88, borderRadius: 26, flexShrink: 0, cursor: 'pointer', overflow: 'hidden',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 28, fontWeight: 900, border: '3px solid var(--bg-card)', boxShadow: '0 8px 24px rgba(160,56,72,0.35)', position: 'relative' }}>
            {form.avatar ? <img src={form.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            <span style={{ position: 'absolute', bottom: 4, right: 4, width: 24, height: 24, borderRadius: 99, background: 'var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, border: '1px solid var(--border)' }}>📷</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickAvatar} style={{ display: 'none' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Label>Nom complet</Label>
            <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="Ton nom" />
            <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: '6px 0 0' }}>{user?.email}</p>
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <Label>Mon objectif</Label>
          <Chips options={OBJECTIVES} value={form.objective} onChange={set('objective')} />
        </div>
        <div style={{ marginBottom: 22 }}>
          <Label>Mon niveau</Label>
          <Chips options={LEVELS} value={form.level} onChange={set('level')} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 22 }} className="keep-2-mobile">
          <div><Label>Poids (kg)</Label><input style={inputStyle} inputMode="decimal" value={form.weight} onChange={set('weight')} placeholder="72" /></div>
          <div><Label>Taille (cm)</Label><input style={inputStyle} inputMode="numeric" value={form.height} onChange={set('height')} placeholder="178" /></div>
          <div><Label>Âge</Label><input style={inputStyle} inputMode="numeric" value={form.age} onChange={set('age')} placeholder="28" /></div>
        </div>
        {bmi && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '-12px 0 22px' }}>IMC estimé : <b style={{ color: 'var(--text-primary)' }}>{bmi}</b></p>}

        <div style={{ marginBottom: 24 }}>
          <Label>À propos de moi <span style={{ textTransform: 'none', fontWeight: 600 }}>(visible par ton coach)</span></Label>
          <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }} value={form.bio}
            onChange={set('bio')} placeholder="Blessures, contraintes horaires, ce qui te motive…" />
        </div>

        {msg && <p style={{ fontSize: 13, fontWeight: 700, color: msg.startsWith('✓') ? '#27ae60' : '#ff8a8a', margin: '0 0 12px' }}>{msg}</p>}
        <button onClick={save} disabled={saving}
          style={{ width: '100%', padding: '15px 0', borderRadius: 15, fontSize: 15, fontWeight: 900, cursor: 'pointer',
            background: 'var(--accent)', color: '#fff', border: 'none', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Enregistrement…' : 'Enregistrer mon profil'}
        </button>

        {/* Mot de passe */}
        <div style={{ marginTop: 36, padding: 20, borderRadius: 20, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 14px' }}>🔒 Changer mon mot de passe</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="password" style={{ ...inputStyle, background: 'var(--bg-base)' }} value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} placeholder="Mot de passe actuel" autoComplete="current-password" />
            <input type="password" style={{ ...inputStyle, background: 'var(--bg-base)' }} value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} placeholder="Nouveau mot de passe (8 caractères min.)" autoComplete="new-password" />
            <input type="password" style={{ ...inputStyle, background: 'var(--bg-base)' }} value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} placeholder="Confirmer le nouveau mot de passe" autoComplete="new-password" />
          </div>
          {pwMsg && <p style={{ fontSize: 13, fontWeight: 700, color: pwMsg.startsWith('✓') ? '#27ae60' : '#ff8a8a', margin: '12px 0 0' }}>{pwMsg}</p>}
          <button onClick={changePassword} disabled={pwBusy || !pw.current || !pw.next}
            style={{ marginTop: 14, width: '100%', padding: '13px 0', borderRadius: 13, fontSize: 14, fontWeight: 800, cursor: 'pointer',
              background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1.5px solid var(--border)', opacity: (pwBusy || !pw.current || !pw.next) ? 0.5 : 1 }}>
            {pwBusy ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
        </div>
      </div>
    </div>
  )
}
