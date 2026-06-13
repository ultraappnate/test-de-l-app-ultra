import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const ROLE_LABEL = { coach: 'Coach sportif', nutritionist: 'Nutritionniste', health_pro: 'Professionnel de santé' }
const ROLE_EMOJI = { coach: '🎓', nutritionist: '🥗', health_pro: '🩺' }

/* Normalise un handle/URL Instagram → URL complète + @handle d'affichage */
function instaInfo(value) {
  if (!value) return null
  let handle = value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/$/, '')
  return { url: `https://instagram.com/${handle}`, handle: `@${handle}` }
}

/* Convertit une URL YouTube/Vimeo en URL d'embed */
function videoEmbed(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vi = url.match(/vimeo\.com\/(\d+)/)
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`
  return null
}

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

  const insta = instaInfo(expert.instagram)
  const embed = videoEmbed(expert.videoUrl)
  const hasShop = expert.shop?.length > 0
  const sectionTitle = (t) => (
    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-faint)', margin: '0 0 12px' }}>{t}</p>
  )
  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 16 }

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
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
              {ROLE_EMOJI[expert.role]} {expert.profession || ROLE_LABEL[expert.role] || expert.role}
              {expert.location?.city && <> · 📍 {expert.location.city}</>}
            </p>
            {/* Badge RPPS pour les pros de santé (gage de sérieux) */}
            {expert.role === 'health_pro' && expert.rpps && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
                padding: '4px 12px', borderRadius: 99, background: 'rgba(14,165,233,0.12)',
                border: '1px solid rgba(14,165,233,0.3)' }}>
                <span style={{ fontSize: 12 }}>🛡️</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9' }}>N° RPPS {expert.rpps}</span>
              </div>
            )}

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
          <div style={cardStyle}>
            {sectionTitle('Spécialités')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {expert.specialties.map(s => (
                <span key={s} style={{ fontSize: 13, fontWeight: 700, padding: '7px 14px', borderRadius: 10,
                  background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {expert.certifications?.length > 0 && (
          <div style={cardStyle}>
            {sectionTitle('Diplômes & certifications')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {expert.certifications.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#4a90d9' }}>🎓</span>{c}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vidéo de présentation */}
        {(embed || expert.videoData) && (
          <div style={cardStyle}>
            {sectionTitle('Vidéo de présentation')}
            <div style={{ position: 'relative', width: '100%', borderRadius: 14, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
              {embed ? (
                <iframe src={embed} title="Présentation" allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
              ) : (
                <video src={expert.videoData} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
          </div>
        )}

        {/* Galerie photos */}
        {expert.photos?.length > 0 && (
          <div style={cardStyle}>
            {sectionTitle(`Galerie · ${expert.photos.length}`)}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
              {expert.photos.map((p, i) => (
                <img key={i} src={p} alt="" loading="lazy"
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} />
              ))}
            </div>
          </div>
        )}

        {/* Boutique */}
        {hasShop && (
          <div style={cardStyle}>
            {sectionTitle('🛍 Boutique')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {expert.shop.map((p, i) => (
                <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14,
                  background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, background: 'var(--accent-subtle)' }}>📦</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{p.name}</p>
                      {p.badge && <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 99, fontWeight: 800, background: 'var(--gold-subtle)', color: 'var(--gold)' }}>{p.badge}</span>}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent)', margin: '2px 0 0' }}>{p.price === 0 ? 'Gratuit' : `${p.price}€`}</p>
                  </div>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noreferrer"
                      style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800, textDecoration: 'none',
                        background: 'var(--accent)', color: '#fff', whiteSpace: 'nowrap' }}>
                      Voir →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liens & réseaux */}
        {(insta || expert.linkedin) && (
          <div style={cardStyle}>
            {sectionTitle('Réseaux & liens')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {insta && (
                <a href={insta.url} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, textDecoration: 'none',
                    fontSize: 13, fontWeight: 700, color: '#fff',
                    background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)' }}>
                  📷 {insta.handle}
                </a>
              )}
              {expert.linkedin && (
                <a href={expert.linkedin.startsWith('http') ? expert.linkedin : `https://${expert.linkedin}`} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, textDecoration: 'none',
                    fontSize: 13, fontWeight: 700, color: '#fff', background: '#0a66c2' }}>
                  in LinkedIn
                </a>
              )}
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

        {/* ── Zone d'action (contact + réservation) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          {expert.calendlyUrl && (
            <a href={expert.calendlyUrl} target="_blank" rel="noreferrer"
              style={{ width: '100%', padding: '15px', borderRadius: 16, fontSize: 15, fontWeight: 800, textAlign: 'center',
                textDecoration: 'none', background: '#006bff', color: '#fff', boxShadow: '0 8px 24px rgba(0,107,255,0.3)' }}>
              📅 Réserver un créneau
            </a>
          )}
          <button onClick={handleContact}
            style={{ width: '100%', padding: '15px', borderRadius: 16, fontSize: 15, fontWeight: 800,
              background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(125,45,56,0.3)' }}>
            {user ? `💬 Contacter ${expert.name.split(' ')[0]}` : '🚀 Créer un compte pour contacter'}
          </button>
        </div>
      </div>
    </div>
  )
}
