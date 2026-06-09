import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store'

const SPECIALTIES = [
  'Perte de poids', 'Prise de masse', 'Nutrition sportive', 'Végétarisme / Véganisme',
  'Diabète & IG bas', 'Maladies chroniques', 'Grossesse & allaitement', 'Enfants & ados',
  'Troubles alimentaires', 'Microbiote', 'Anti-inflammatoire', 'Naturopathie',
]

const CERTIFICATIONS = [
  'Diététicien(ne) DE', 'Nutritionniste certifié(e)', 'Coach en nutrition',
  'Diplôme universitaire (DU) Nutrition', 'Naturopathe', 'Naturopathe certifié(e)',
]

async function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file)
  })
}

export default function NutriProfile() {
  const { fetchProfile, updateProfile, user } = useStore()
  const avatarRef = useRef()

  const [profile, setProfile] = useState({
    name: '', bio: '', specialties: [], certifications: [],
    calendlyUrl: '', instagram: '', linkedin: '',
    avatar: null, photos: [], tarifConsultation: '', tarifSuivi: '',
  })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile().then(p => {
      if (p) setProfile(prev => ({
        ...prev,
        name:    p.name     || user?.name || '',
        bio:     p.bio      || '',
        specialties:   p.specialties   || [],
        certifications: p.certifications || [],
        calendlyUrl:    p.calendlyUrl   || '',
        instagram:      p.instagram     || '',
        linkedin:       p.linkedin      || '',
        avatar:         p.avatar        || null,
        photos:         p.photos        || [],
        tarifConsultation: p.tarifConsultation || '',
        tarifSuivi:        p.tarifSuivi        || '',
      }))
      setLoading(false)
    }).catch(() => { setLoading(false) })
  }, [])

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const b64 = await toBase64(file)
    setProfile(p => ({ ...p, avatar: b64 }))
  }

  const toggleSpec = (s) => setProfile(p => ({
    ...p,
    specialties: p.specialties.includes(s) ? p.specialties.filter(x=>x!==s) : [...p.specialties, s]
  }))

  const toggleCert = (c) => setProfile(p => ({
    ...p,
    certifications: (p.certifications||[]).includes(c) ? (p.certifications||[]).filter(x=>x!==c) : [...(p.certifications||[]), c]
  }))

  const handleSave = async () => {
    setSaving(true); setSaveErr('')
    const res = await updateProfile(profile)
    if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else setSaveErr(res.error || 'Erreur')
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border)', borderTopColor: '#27ae60' }} />
    </div>
  )

  const initials = profile.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between"
        style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#27ae60' }}>Nutritionniste</p>
          <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Mon Profil</h1>
        </div>
        <div className="flex items-center gap-3">
          {saved   && <span className="text-sm font-bold" style={{ color: '#27ae60' }}>✓ Profil sauvegardé</span>}
          {saveErr && <span className="text-sm font-bold" style={{ color: '#a03848' }}>{saveErr}</span>}
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: '#27ae60' }}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

        {/* Identité */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>Identité</p>
          </div>
          <div className="p-5 flex items-center gap-5">
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            <button onClick={() => avatarRef.current?.click()}
              className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 group"
              style={{ background: profile.avatar ? 'transparent' : '#27ae6022', border: '2px solid rgba(39,174,96,0.3)' }}>
              {profile.avatar
                ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                : <span className="font-black text-xl" style={{ color: '#27ae60' }}>{initials}</span>}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                Changer
              </div>
            </button>
            <div className="flex-1 space-y-2">
              <input value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))}
                placeholder="Votre nom complet"
                className="w-full px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                Nutritionniste · {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>Présentation</p>
          </div>
          <div className="p-5">
            <textarea value={profile.bio} onChange={e => setProfile(p => ({...p, bio: e.target.value}))}
              placeholder="Présente ton approche nutritionnelle, ton parcours, ta philosophie…"
              rows={4} className="w-full px-4 py-3 rounded-xl text-sm resize-none"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
            <p className="text-right text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
              {profile.bio?.length || 0} caractères
            </p>
          </div>
        </div>

        {/* Spécialités */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>Spécialités</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(39,174,96,0.15)', color: '#27ae60' }}>
              {profile.specialties.length} sélectionnée{profile.specialties.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-5 flex flex-wrap gap-2">
            {SPECIALTIES.map(s => (
              <button key={s} onClick={() => toggleSpec(s)}
                className="px-3 py-2 rounded-xl text-xs font-bold transition"
                style={{
                  background: profile.specialties.includes(s) ? 'rgba(39,174,96,0.15)' : 'var(--bg-base)',
                  color: profile.specialties.includes(s) ? '#27ae60' : 'var(--text-secondary)',
                  border: `1px solid ${profile.specialties.includes(s) ? '#27ae60' : 'var(--border)'}`,
                }}>
                {profile.specialties.includes(s) && '✓ '}{s}
              </button>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>Diplômes & Certifications</p>
          </div>
          <div className="p-5 flex flex-wrap gap-2">
            {CERTIFICATIONS.map(c => (
              <button key={c} onClick={() => toggleCert(c)}
                className="px-3 py-2 rounded-xl text-xs font-bold transition"
                style={{
                  background: (profile.certifications||[]).includes(c) ? 'rgba(74,144,217,0.15)' : 'var(--bg-base)',
                  color: (profile.certifications||[]).includes(c) ? '#4a90d9' : 'var(--text-secondary)',
                  border: `1px solid ${(profile.certifications||[]).includes(c) ? '#4a90d9' : 'var(--border)'}`,
                }}>
                {(profile.certifications||[]).includes(c) && '🎓 '}{c}
              </button>
            ))}
          </div>
        </div>

        {/* Tarifs */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>Tarifs de consultation</p>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {[
              { key: 'tarifConsultation', label: '1ère consultation', placeholder: 'ex: 60€ / 1h' },
              { key: 'tarifSuivi',        label: 'Séance de suivi',   placeholder: 'ex: 45€ / 45min' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                <input value={profile[key]} onChange={e => setProfile(p => ({...p, [key]: e.target.value}))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Liens & réseaux */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>Liens & Réseaux</p>
          </div>
          <div className="p-5 space-y-3">
            {[
              { key: 'calendlyUrl', icon: '📅', label: 'Lien Calendly',    placeholder: 'https://calendly.com/ton-profil' },
              { key: 'instagram',   icon: '📸', label: 'Instagram',        placeholder: '@ton_compte' },
              { key: 'linkedin',    icon: '💼', label: 'LinkedIn',         placeholder: 'https://linkedin.com/in/...' },
            ].map(({ key, icon, label, placeholder }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-lg w-6 flex-shrink-0">{icon}</span>
                <div className="flex-1">
                  <p className="text-[10px] font-bold mb-1" style={{ color: 'var(--text-faint)' }}>{label}</p>
                  <input value={profile[key] || ''} onChange={e => setProfile(p => ({...p, [key]: e.target.value}))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statut visibilité */}
        <div className="rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: profile.calendlyUrl ? 'rgba(39,174,96,0.06)' : 'rgba(232,160,32,0.06)',
            border: `1px solid ${profile.calendlyUrl ? 'rgba(39,174,96,0.3)' : 'rgba(232,160,32,0.3)'}`,
          }}>
          <span className="text-2xl flex-shrink-0">{profile.calendlyUrl ? '✅' : '⚠️'}</span>
          <div>
            <p className="font-black text-sm" style={{ color: profile.calendlyUrl ? '#27ae60' : '#e8a020' }}>
              {profile.calendlyUrl ? 'Profil visible dans le catalogue' : 'Lien de réservation manquant'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {profile.calendlyUrl
                ? 'Tes clients peuvent prendre rendez-vous directement depuis le catalogue.'
                : 'Ajoute ton lien Calendly pour apparaître dans le catalogue et recevoir des demandes.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 pb-10">
          {saveErr && <span className="text-sm font-bold" style={{ color: '#a03848' }}>{saveErr}</span>}
          {!saveErr && <span />}
          <button onClick={handleSave} disabled={saving}
            className="px-8 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: '#27ae60' }}>
            {saving ? 'Sauvegarde...' : 'Enregistrer le profil'}
          </button>
        </div>
      </div>
    </div>
  )
}
