import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const ROLE_LABEL = { coach: 'Coach sportif', nutritionist: 'Nutritionniste' }
const ROLE_EMOJI = { coach: '🎓', nutritionist: '🥗' }

export default function ExpertProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchExpert, user } = useStore()
  const [expert, setExpert] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchExpert(id).then(e => { if (alive) { setExpert(e); setLoading(false) } })
    return () => { alive = false }
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!expert) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: 'var(--bg-base)', padding: 24 }}>
      <div style={{ fontSize: 56 }}>😕</div>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>Profil introuvable</h1>
      <button onClick={() => navigate(-1)}
        style={{ padding: '12px 24px', borderRadius: 14, fontWeight: 800, color: '#fff', background: 'var(--accent)', border: 'none', cursor: 'pointer' }}>
        ← Retour
      </button>
    </div>
  )

  const color = expert.avatarColor || 'var(--accent)'
  const initials = expert.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const handleContact = () => {
    if (!user) { navigate('/register?role=client'); return }
    navigate(`/chat/${expert.id}`)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Retour */}
        <button onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700,
            color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '9px 16px', cursor: 'pointer', marginBottom: 20 }}>
          ← Retour
        </button>

        {/* En-tête profil */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
          {/* Bannière dégradée */}
          <div style={{ height: 90, background: `linear-gradient(135deg, ${color} 0%, #150d11 140%)` }} />
          <div style={{ padding: '0 24px 24px', marginTop: -40 }}>
            {/* Avatar */}
            <div style={{ width: 84, height: 84, borderRadius: 22, background: color, border: '4px solid var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              color: '#fff', fontWeight: 900, fontSize: 30, marginBottom: 12 }}>
              {expert.avatar ? <img src={expert.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>

            {/* Nom + badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: 'clamp(22px,5vw,28px)', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{expert.name}</h1>
              {expert.verified && (
                <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, fontWeight: 800,
                  background: 'rgba(74,144,217,0.15)', color: '#4a90d9' }}>✓ Vérifié</span>
              )}
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
              {ROLE_EMOJI[expert.role]} {ROLE_LABEL[expert.role] || expert.role}
              {expert.location?.city && <> · 📍 {expert.location.city}</>}
            </p>

            {/* Stats rapides */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 900, color: 'var(--text-primary)' }}>⭐ {expert.rating}</span>
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>({expert.reviewCount} avis)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 900, color }}>{expert.price === 0 ? 'Gratuit' : `${expert.price}€`}</span>
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>/ séance</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12,
                background: expert.available ? 'rgba(39,174,96,0.12)' : 'var(--bg-base)',
                border: `1px solid ${expert.available ? 'rgba(39,174,96,0.3)' : 'var(--border)'}` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: expert.available ? '#27ae60' : '#888' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: expert.available ? '#27ae60' : 'var(--text-faint)' }}>
                  {expert.available ? 'Disponible' : 'Indisponible'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modes de coaching */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {expert.online && (
            <span style={{ flex: 1, minWidth: 140, padding: '12px 16px', borderRadius: 14, fontSize: 13, fontWeight: 700,
              background: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.25)', color: '#4a90d9', textAlign: 'center' }}>
              💻 Coaching en ligne
            </span>
          )}
          {expert.inPerson && (
            <span style={{ flex: 1, minWidth: 140, padding: '12px 16px', borderRadius: 14, fontSize: 13, fontWeight: 700,
              background: 'var(--accent-subtle)', border: '1px solid var(--accent)', color: 'var(--accent)', textAlign: 'center' }}>
              🤝 Séances en présentiel
            </span>
          )}
        </div>

        {/* Bio */}
        {expert.bio && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-faint)', margin: '0 0 8px' }}>À propos</p>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{expert.bio}</p>
          </div>
        )}

        {/* Spécialités */}
        {expert.specialties?.length > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-faint)', margin: '0 0 12px' }}>Spécialités</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {expert.specialties.map(s => (
                <span key={s} style={{ fontSize: 13, fontWeight: 700, padding: '7px 14px', borderRadius: 10,
                  background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Localisation */}
        {expert.location?.address && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-faint)', margin: '0 0 8px' }}>Localisation</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>📍 {expert.location.address}, {expert.location.city}</p>
          </div>
        )}

        {/* CTA contact */}
        <button onClick={handleContact}
          style={{ width: '100%', padding: '16px', borderRadius: 16, fontSize: 15, fontWeight: 800,
            background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(125,45,56,0.3)' }}>
          {user ? `💬 Contacter ${expert.name.split(' ')[0]}` : '🚀 Créer un compte pour contacter'}
        </button>
      </div>
    </div>
  )
}
