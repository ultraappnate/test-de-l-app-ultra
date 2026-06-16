import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const ROLE_CONFIG = {
  coach:        { label: 'Coach sportif',       color: 'var(--accent)', icon: '🏋️' },
  nutritionist: { label: 'Nutritionniste',      color: '#22c55e',       icon: '🥗' },
  health_pro:   { label: 'Pro de santé',        color: '#0ea5e9',       icon: '🩺' },
}

const DURATION_OPTIONS = [
  { months: 1,  label: '1 mois',    badge: '' },
  { months: 3,  label: '3 mois',    badge: '−5%' },
  { months: 6,  label: '6 mois',    badge: '−10%' },
  { months: 12, label: '12 mois',   badge: '−15%' },
]

function Stars({ rating, size = 15 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#f59e0b' : 'var(--border)' }}>★</span>
      ))}
    </span>
  )
}

function RatingBar({ label, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 40, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-faint)', width: 28, textAlign: 'right' }}>{count}</span>
    </div>
  )
}

function ReviewCard({ review }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-soft)',
      borderRadius: 14, padding: '14px 16px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 900,
          }}>{review.clientName?.[0]?.toUpperCase()}</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{review.clientName}</p>
            {review.specialty && (
              <p style={{ fontSize: 10, color: 'var(--text-faint)' }}>{review.specialty}</p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Stars rating={review.rating} size={12} />
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
            {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>
      {review.comment && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, fontStyle: 'italic' }}>
          "{review.comment}"
        </p>
      )}
    </div>
  )
}

export default function MarketplaceProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useStore()
  const [pro, setPro] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showHireModal, setShowHireModal] = useState(false)
  const [duration, setDuration] = useState(1)
  const [hiring, setHiring] = useState(false)
  const [hired, setHired] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

  useEffect(() => {
    fetch(`${API}/marketplace/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setPro(data); setHired(data.isHiredByMe || false); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id, token])

  async function handleHire() {
    setHiring(true)
    try {
      const res = await fetch(`${API}/marketplace/hire/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ duration }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      if (data.ok) { setHired(true); setShowHireModal(false) }
    } catch {}
    setHiring(false)
  }

  async function submitReview() {
    setSubmittingReview(true)
    try {
      const res = await fetch(`${API}/marketplace/review/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      })
      if (res.ok) {
        const newReview = await res.json()
        setPro(prev => ({ ...prev, reviews: [newReview, ...(prev.reviews || [])] }))
        setReviewDone(true)
        setShowReviewForm(false)
      }
    } catch {}
    setSubmittingReview(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>
    </div>
  )
  if (!pro) return null

  const cfg = ROLE_CONFIG[pro.role] || ROLE_CONFIG.coach
  const initials = pro.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
  const reviews = pro.reviews || []
  const avgRating = pro.avgRating || pro.rating || 0
  const reviewCount = reviews.length || pro.reviewCount || 0

  const ratingBreakdown = [5,4,3,2,1].map(n => ({
    label: `${n}★`, count: reviews.filter(r => r.rating === n).length
  }))

  const discountedPrice = (months) => {
    const disc = months === 3 ? 0.95 : months === 6 ? 0.90 : months === 12 ? 0.85 : 1
    return Math.round((pro.price || 80) * months * disc)
  }
  const commission = Math.round(discountedPrice(duration) * 0.10)
  const proEarns = discountedPrice(duration) - commission

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/marketplace')} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 20, cursor: 'pointer' }}>←</button>
        <p style={{ fontWeight: 900, fontSize: 15, color: 'var(--text-primary)', flex: 1 }}>{pro.name}</p>
        {!hired && user?.role === 'client' && (
          <button onClick={() => setShowHireModal(true)} style={{
            padding: '8px 18px', borderRadius: 12, border: 'none',
            background: 'var(--accent)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer',
          }}>Engager</button>
        )}
        {hired && (
          <span style={{ background: '#22c55e22', color: '#22c55e', fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 12 }}>
            ✓ Engagé
          </span>
        )}
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(0px,0vw,0px)' }}>

        {/* Hero profil */}
        <div style={{
          background: `linear-gradient(135deg, ${pro.avatarColor || '#a03848'}33 0%, ${pro.avatarColor || '#a03848'}11 100%)`,
          padding: '28px 24px',
          display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: pro.avatarColor || '#a03848',
            border: '3px solid var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 900, color: '#fff', flexShrink: 0,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>{initials}</div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{pro.name}</h1>
              {pro.verified && <span style={{ background: '#f59e0b22', color: '#f59e0b', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>✓ Vérifié</span>}
            </div>
            <p style={{ fontSize: 13, color: cfg.color, fontWeight: 700, marginBottom: 6 }}>
              {cfg.icon} {cfg.label}{pro.profession ? ` · ${pro.profession}` : ''}
            </p>
            {pro.location?.city && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>📍 {pro.location.city}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Stars rating={avgRating} size={16} />
              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{avgRating.toFixed(1)}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{reviewCount} avis</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{pro.price}€</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>par mois</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
              {pro.online && <span style={{ fontSize: 10, background: '#6366f122', color: '#6366f1', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>En ligne</span>}
              {pro.inPerson && <span style={{ fontSize: 10, background: 'var(--bg-hover)', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>Présentiel</span>}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Bio */}
          {pro.bio && (
            <Section title="À propos">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{pro.bio}</p>
            </Section>
          )}

          {/* Spécialités */}
          {pro.specialties?.length > 0 && (
            <Section title="Spécialités">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {pro.specialties.map(s => (
                  <span key={s} style={{
                    background: cfg.color + '18', color: cfg.color,
                    fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
                  }}>{s}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Certifications */}
          {pro.certifications?.length > 0 && (
            <Section title="Certifications">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pro.certifications.map(c => (
                  <div key={c} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ color: '#f59e0b', fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Avis — breakdown + liste */}
          {reviewCount > 0 && (
            <Section title={`Avis clients (${reviewCount})`}>
              <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
                {/* Score global */}
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <p style={{ fontSize: 42, fontWeight: 900, color: '#f59e0b', margin: 0 }}>{avgRating.toFixed(1)}</p>
                  <Stars rating={avgRating} size={14} />
                  <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{reviewCount} avis</p>
                </div>
                {/* Barres */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  {ratingBreakdown.map(({ label, count }) => (
                    <RatingBar key={label} label={label} count={count} total={reviewCount} />
                  ))}
                </div>
              </div>
              {reviews.slice(0, 6).map(r => <ReviewCard key={r.id} review={r} />)}
              {reviews.length > 6 && (
                <p style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', marginTop: 6 }}>
                  + {reviews.length - 6} autres avis
                </p>
              )}
            </Section>
          )}

          {/* Laisser un avis */}
          {hired && user?.role === 'client' && !reviewDone && (
            <Section title="Laisser un avis">
              {!showReviewForm ? (
                <button onClick={() => setShowReviewForm(true)} style={{
                  width: '100%', padding: '13px', borderRadius: 14,
                  border: '1px dashed var(--border)', background: 'transparent',
                  color: 'var(--text-secondary)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}>★ Évaluer {pro.name}</button>
              ) : (
                <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 16, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12, justifyContent: 'center' }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setReviewRating(n)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 28, color: n <= reviewRating ? '#f59e0b' : 'var(--border)',
                        padding: 2, transition: 'color 0.1s',
                      }}>★</button>
                    ))}
                  </div>
                  <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                    placeholder="Décris ton expérience avec ce professionnel…"
                    rows={3} style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--bg-base)',
                      color: 'var(--text-primary)', fontSize: 13, resize: 'none', outline: 'none',
                      boxSizing: 'border-box',
                    }} />
                  <button onClick={submitReview} disabled={submittingReview} style={{
                    marginTop: 10, width: '100%', padding: '12px', borderRadius: 12,
                    border: 'none', background: 'var(--accent)', color: '#fff',
                    fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  }}>
                    {submittingReview ? 'Publication…' : 'Publier l\'avis'}
                  </button>
                </div>
              )}
            </Section>
          )}
          {reviewDone && (
            <div style={{ background: '#22c55e18', border: '1px solid #22c55e40', borderRadius: 14, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ color: '#22c55e', fontWeight: 700, fontSize: 13 }}>✓ Avis publié. Merci !</p>
            </div>
          )}

          {/* CTA mobile */}
          {!hired && user?.role === 'client' && (
            <button onClick={() => setShowHireModal(true)} style={{
              width: '100%', padding: '16px', borderRadius: 16,
              border: 'none', background: 'var(--accent)', color: '#fff',
              fontWeight: 900, fontSize: 16, cursor: 'pointer',
              marginBottom: 20,
            }}>
              Engager {pro.name} — {pro.price}€/mois
            </button>
          )}
        </div>
      </div>

      {/* Modal Hire */}
      {showHireModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setShowHireModal(false)}>
          <div style={{
            width: '100%', maxWidth: 520,
            background: 'var(--bg-card)',
            borderRadius: '20px 20px 0 0',
            padding: '24px 24px 40px',
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 900, fontSize: 18, color: 'var(--text-primary)', marginBottom: 4 }}>
              Engager {pro.name}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Choisissez la durée de votre engagement.
            </p>

            {/* Durées */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {DURATION_OPTIONS.map(opt => {
                const total = discountedPrice(opt.months)
                const selected = duration === opt.months
                return (
                  <button key={opt.months} onClick={() => setDuration(opt.months)} style={{
                    padding: '14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                    background: selected ? 'rgba(139,0,0,0.08)' : 'var(--bg-hover)',
                    position: 'relative',
                  }}>
                    {opt.badge && (
                      <span style={{
                        position: 'absolute', top: -8, right: 8,
                        background: '#22c55e', color: '#fff',
                        fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 10,
                      }}>{opt.badge}</span>
                    )}
                    <p style={{ fontWeight: 800, fontSize: 14, color: selected ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 2 }}>{opt.label}</p>
                    <p style={{ fontWeight: 900, fontSize: 18, color: selected ? 'var(--accent)' : 'var(--text-primary)' }}>{total}€</p>
                    <p style={{ fontSize: 10, color: 'var(--text-faint)' }}>{Math.round(total/opt.months)}€/mois</p>
                  </button>
                )
              })}
            </div>

            {/* Total simple, sans détail commission */}
            <div style={{
              background: 'var(--bg-base)', borderRadius: 12, padding: '12px 14px',
              marginBottom: 16, fontSize: 12,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Total à payer</span>
              <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--text-primary)' }}>{discountedPrice(duration)}€</span>
            </div>

            <button onClick={handleHire} disabled={hiring} style={{
              width: '100%', padding: '15px', borderRadius: 14,
              border: 'none', background: 'var(--accent)', color: '#fff',
              fontWeight: 900, fontSize: 15, cursor: hiring ? 'not-allowed' : 'pointer',
              opacity: hiring ? 0.7 : 1,
            }}>
              {hiring ? 'Redirection…' : `Payer ${discountedPrice(duration)}€ avec Stripe`}
            </button>
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
              CB · Apple Pay · Google Pay · Virement — 100% sécurisé
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
        {title}
      </p>
      {children}
    </div>
  )
}
