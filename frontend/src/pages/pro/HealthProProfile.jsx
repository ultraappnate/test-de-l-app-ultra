import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { FR_CITIES } from '../../data/frCities'

const PROFESSIONS = ['Kinésithérapeute','Ostéopathe','Médecin du sport','Podologue','Préparateur physique','Psychologue du sport']

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-[11px] font-black tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs" style={{ color: 'var(--text-faint)' }}>{hint}</p>}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14, outline: 'none',
  background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', boxSizing: 'border-box' }

export default function HealthProProfile() {
  const { fetchProfile, updateProfile } = useStore()
  const navigate = useNavigate()
  const fileRef = useRef()
  const [f, setF] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetchProfile().then(p => setF({
      name: p?.name || '', profession: p?.profession || 'Kinésithérapeute', rpps: p?.rpps || '',
      bio: p?.bio || '', specialties: (p?.specialties || []).join(', '),
      city: p?.location?.city || '', address: p?.location?.address || '',
      lat: p?.location?.lat || null, lng: p?.location?.lng || null,
      price: p?.price || 50, calendlyUrl: p?.calendlyUrl || '', instagram: p?.instagram || '',
      avatar: p?.avatar || null,
    }))
  }, [])

  if (!f) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  const pickCity = (name) => {
    const c = FR_CITIES.find(x => x.name === name)
    if (c) setF(prev => ({ ...prev, city: c.name, lat: c.lat, lng: c.lng }))
    else set('city', name)
  }

  const handleAvatar = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader(); r.onload = () => set('avatar', r.result); r.readAsDataURL(file)
  }

  const save = async () => {
    setSaving(true)
    const payload = {
      name: f.name, profession: f.profession, rpps: f.rpps, bio: f.bio,
      specialties: f.specialties.split(',').map(s => s.trim()).filter(Boolean),
      price: Number(f.price) || 0, calendlyUrl: f.calendlyUrl, instagram: f.instagram, avatar: f.avatar,
      location: (f.lat && f.lng) ? { lat: f.lat, lng: f.lng, city: f.city, address: f.address } : undefined,
    }
    const res = await updateProfile(payload)
    setSaving(false)
    setToast(res.success ? '✓ Profil enregistré' : '✗ Erreur')
    setTimeout(() => setToast(''), 2500)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast[0] === '✓' ? 'var(--accent)' : '#ef4444', color: '#fff', padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 13 }}>{toast}</div>}

        <button onClick={() => navigate('/pro/dashboard')} className="mb-5 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>← Retour</button>
        <h1 className="font-black mb-1" style={{ color: 'var(--text-primary)', fontSize: 'clamp(22px,5vw,30px)' }}>Mon profil</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Ces infos sont visibles par les sportifs sur la carte.</p>

        <div className="rounded-2xl p-5 mb-4 flex items-center gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl overflow-hidden flex-shrink-0"
            style={{ background: '#0ea5e9' }}>
            {f.avatar ? <img src={f.avatar} alt="" className="w-full h-full object-cover" /> : (f.name?.[0] || '?')}
          </div>
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            📷 Changer la photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Nom complet"><input style={inputStyle} value={f.name} onChange={e => set('name', e.target.value)} /></Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 16 }}>
            <Field label="Profession">
              <select style={inputStyle} value={f.profession} onChange={e => set('profession', e.target.value)}>
                {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="N° RPPS / ADELI" hint="🛡️ Vérifié par notre équipe">
              <input style={inputStyle} value={f.rpps} onChange={e => set('rpps', e.target.value)} placeholder="10100456789" />
            </Field>
          </div>

          <Field label="Présentation"><textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={f.bio} onChange={e => set('bio', e.target.value)} placeholder="Ton parcours, ta spécialité, ton approche…" /></Field>

          <Field label="Spécialités" hint="Séparées par des virgules"><input style={inputStyle} value={f.specialties} onChange={e => set('specialties', e.target.value)} placeholder="Rééducation, Prévention blessures, Sport" /></Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 16 }}>
            <Field label="Ville (pour la carte)" hint={f.lat ? '✓ Localisé sur la carte' : 'Choisis une ville pour apparaître sur la carte'}>
              <input style={inputStyle} list="frcities" value={f.city} onChange={e => pickCity(e.target.value)} placeholder="Paris" />
              <datalist id="frcities">{FR_CITIES.map(c => <option key={c.name} value={c.name} />)}</datalist>
            </Field>
            <Field label="Adresse du cabinet"><input style={inputStyle} value={f.address} onChange={e => set('address', e.target.value)} placeholder="12 rue…" /></Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 16 }}>
            <Field label="Tarif consultation (€)"><input type="number" style={inputStyle} value={f.price} onChange={e => set('price', e.target.value)} /></Field>
            <Field label="Lien Calendly"><input style={inputStyle} value={f.calendlyUrl} onChange={e => set('calendlyUrl', e.target.value)} placeholder="https://calendly.com/…" /></Field>
          </div>

          <Field label="Instagram"><input style={inputStyle} value={f.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@ton.compte" /></Field>

          <button onClick={save} disabled={saving}
            className="w-full py-3.5 rounded-xl font-black text-white mt-2"
            style={{ background: 'var(--accent)', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Enregistrement…' : '💾 Enregistrer mon profil'}
          </button>
        </div>
      </div>
    </div>
  )
}
