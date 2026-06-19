import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const ROLE_CONFIG = {
  coach:         { label: 'Coach',              color: 'var(--accent)', bg: 'rgba(139,0,0,0.12)',    icon: '🏋️' },
  nutritionist:  { label: 'Nutritionniste',     color: '#22c55e',       bg: 'rgba(34,197,94,0.12)',  icon: '🥗' },
  health_pro:    { label: 'Pro de santé',       color: '#0ea5e9',       bg: 'rgba(14,165,233,0.12)', icon: '🩺' },
}

const SPECIALTIES_FILTER = [
  'Force', 'Prise de masse', 'Perte de poids', 'HIIT', 'Cardio', 'Mobilité',
  'Yoga', 'Running', 'Boxe', 'Powerlifting', 'Nutrition sportive', 'Rééquilibrage',
  'Rééducation', 'Ostéopathie',
]

function Stars({ rating, size = 13 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#f59e0b' : 'var(--border)' }}>★</span>
      ))}
    </span>
  )
}

function ProCard({ pro, onClick, isFav, onToggleFav, onContact, showActions }) {
  const cfg = ROLE_CONFIG[pro.role] || ROLE_CONFIG.coach
  const initials = pro.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Bannière avatar */}
      <div style={{
        height: 90,
        background: `linear-gradient(135deg, ${pro.avatarColor || '#a03848'}22 0%, ${pro.avatarColor || '#a03848'}44 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {/* Badges top */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 'calc(100% - 60px)' }}>
          <span style={{
            background: cfg.bg, color: cfg.color,
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
          }}>{cfg.icon} {cfg.label}</span>
          {pro.verified && (
            <span style={{ background: '#f59e0b22', color: '#f59e0b', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20 }}>
              ✓ Vérifié
            </span>
          )}
        </div>
        {/* Bouton favori */}
        {onToggleFav && (
          <button
            onClick={e => { e.stopPropagation(); onToggleFav() }}
            title={isFav ? 'Retirer des favoris' : 'Enregistrer'}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 34, height: 34, borderRadius: '50%',
              border: 'none', cursor: 'pointer',
              background: isFav ? 'rgba(220,38,38,0.15)' : 'rgba(0,0,0,0.25)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'transform 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >{isFav ? '❤️' : '🤍'}</button>
        )}
        {/* Avatar */}
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: pro.avatarColor || '#a03848',
          border: '3px solid var(--bg-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 900, color: '#fff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>{initials}</div>
        {pro.available && (
          <div style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
            background: '#22c55e', borderRadius: 20, padding: '3px 10px',
            fontSize: 10, fontWeight: 800, color: '#fff', border: '2px solid var(--bg-card)',
            whiteSpace: 'nowrap',
          }}>Disponible</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '18px 16px 14px' }}>
        <p style={{ fontWeight: 900, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>{pro.name}</p>
        {pro.location?.city && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>📍 {pro.location.city}</p>
        )}

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Stars rating={pro.avgRating || pro.rating || 0} />
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
            {(pro.avgRating || pro.rating || 0).toFixed(1)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({pro.reviewCount} avis)</span>
        </div>

        {/* Spécialités */}
        {pro.specialties?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
            {pro.specialties.slice(0, 3).map(s => (
              <span key={s} style={{
                background: 'var(--bg-hover)', color: 'var(--text-secondary)',
                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
              }}>{s}</span>
            ))}
          </div>
        )}

        {/* Prix + tags */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>{pro.price}€</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/mois</span>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {pro.online && <span style={{ fontSize: 10, background: '#6366f122', color: '#6366f1', padding: '2px 7px', borderRadius: 6, fontWeight: 700 }}>En ligne</span>}
            {pro.inPerson && <span style={{ fontSize: 10, background: 'var(--bg-hover)', color: 'var(--text-muted)', padding: '2px 7px', borderRadius: 6, fontWeight: 700 }}>Présentiel</span>}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
        {showActions && onContact && (
          <button
            onClick={e => { e.stopPropagation(); onContact() }}
            style={{
              flex: 1, padding: '10px', borderRadius: 12,
              border: '1px solid var(--accent)', background: 'var(--accent-subtle)',
              color: 'var(--accent)', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            }}>
            💬 Contacter
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onClick() }}
          style={{
            flex: 1, padding: '10px', borderRadius: 12,
            border: 'none', background: 'var(--accent)',
            color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer',
          }}>
          {showActions ? 'Profil & programmes' : 'Voir le profil'}
        </button>
      </div>
    </div>
  )
}

export default function Marketplace() {
  const navigate = useNavigate()
  const { token, user } = useStore()
  const [pros, setPros] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('tous')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [favIds, setFavIds] = useState([])
  const [favPros, setFavPros] = useState([])

  const isClient = user?.role === 'client'
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => { load() }, [typeFilter, availableOnly, onlineOnly, maxPrice])
  useEffect(() => { if (isClient) loadFavorites() }, [])

  async function loadFavorites() {
    try {
      const [ids, full] = await Promise.all([
        fetch(`${API}/favorites/ids`, { headers }).then(r => r.json()),
        fetch(`${API}/favorites`, { headers }).then(r => r.json()),
      ])
      setFavIds(Array.isArray(ids) ? ids : [])
      setFavPros(Array.isArray(full) ? full : [])
    } catch {}
  }

  async function toggleFav(proId) {
    const isFav = favIds.includes(proId)
    setFavIds(prev => isFav ? prev.filter(x => x !== proId) : [...prev, proId])
    try {
      await fetch(`${API}/favorites/${proId}`, { method: isFav ? 'DELETE' : 'POST', headers })
      loadFavorites()
    } catch { loadFavorites() }
  }

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter !== 'tous' && typeFilter !== 'favoris') params.set('type', typeFilter)
    if (availableOnly) params.set('available', 'true')
    if (onlineOnly) params.set('online', 'true')
    if (maxPrice) params.set('maxPrice', maxPrice)
    try {
      const res = await fetch(`${API}/marketplace?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setPros(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  const filtered = pros.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.specialties?.some(s => s.toLowerCase().includes(q)) || p.location?.city?.toLowerCase().includes(q)
    const matchSpecialty = !specialtyFilter || p.specialties?.some(s => s.toLowerCase().includes(specialtyFilter.toLowerCase()))
    return matchSearch && matchSpecialty
  })

  const types = [
    { key: 'tous', label: 'Tous', icon: '⭐' },
    ...(isClient ? [{ key: 'favoris', label: `Favoris${favIds.length ? ` (${favIds.length})` : ''}`, icon: '❤️' }] : []),
    { key: 'coach', label: 'Coachs', icon: '🏋️' },
    { key: 'nutritionist', label: 'Nutritionnistes', icon: '🥗' },
    { key: 'health_pro', label: 'Pros de santé', icon: '🩺' },
  ]

  const showFavorites = typeFilter === 'favoris'
  const favFiltered = favPros.filter(p => {
    const q = search.toLowerCase()
    return !q || p.name.toLowerCase().includes(q) || p.specialties?.some(s => s.toLowerCase().includes(q)) || p.location?.city?.toLowerCase().includes(q)
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(139,0,0,0.08) 100%)',
        borderBottom: '1px solid var(--border)',
        padding: 'clamp(24px,5vw,40px) clamp(16px,4vw,32px)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>
            ULTRA Marketplace
          </p>
          <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.15 }}>
            Trouve l'expert qui va<br />changer ta vie
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
            {pros.length} professionnels vérifiés · Coachs, Nutritionnistes, Kinés, Ostéos, Médecins du sport
          </p>

          {/* Barre de recherche */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nom, spécialité, ville…"
              style={{
                flex: 1, minWidth: 200,
                padding: '12px 16px', borderRadius: 14,
                border: '1px solid var(--border)', background: 'var(--bg-card)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none',
              }}
            />
            <button onClick={() => setShowFilters(v => !v)} style={{
              padding: '12px 18px', borderRadius: 14,
              border: '1px solid var(--border)', background: showFilters ? 'var(--accent)' : 'var(--bg-card)',
              color: showFilters ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              ⚙ Filtres
            </button>
          </div>

          {/* Filtres dépliables */}
          {showFilters && (
            <div style={{
              marginTop: 14, padding: 16,
              background: 'var(--bg-card)', borderRadius: 14,
              border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              {/* Spécialité */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 8 }}>Spécialité</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => setSpecialtyFilter('')} style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${!specialtyFilter ? 'var(--accent)' : 'var(--border)'}`,
                    background: !specialtyFilter ? 'var(--accent)' : 'var(--bg-hover)',
                    color: !specialtyFilter ? '#fff' : 'var(--text-secondary)',
                  }}>Toutes</button>
                  {SPECIALTIES_FILTER.map(s => (
                    <button key={s} onClick={() => setSpecialtyFilter(specialtyFilter === s ? '' : s)} style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      border: `1px solid ${specialtyFilter === s ? 'var(--accent)' : 'var(--border)'}`,
                      background: specialtyFilter === s ? 'var(--accent)' : 'var(--bg-hover)',
                      color: specialtyFilter === s ? '#fff' : 'var(--text-secondary)',
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Toggle options */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { label: 'Disponible maintenant', state: availableOnly, set: setAvailableOnly },
                  { label: 'En ligne uniquement', state: onlineOnly, set: setOnlineOnly },
                ].map(({ label, state, set }) => (
                  <button key={label} onClick={() => set(v => !v)} style={{
                    padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${state ? 'var(--accent)' : 'var(--border)'}`,
                    background: state ? 'var(--accent)' : 'var(--bg-hover)',
                    color: state ? '#fff' : 'var(--text-secondary)',
                  }}>{label}</button>
                ))}
                {/* Prix max */}
                <select value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{
                  padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-secondary)',
                  cursor: 'pointer', outline: 'none',
                }}>
                  <option value="">Tous les prix</option>
                  <option value="55">Moins de 55€/mois</option>
                  <option value="70">Moins de 70€/mois</option>
                  <option value="90">Moins de 90€/mois</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(16px,4vw,28px)' }}>

        {/* Tabs type */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {types.map(t => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)} style={{
              padding: '8px 16px', borderRadius: 22, fontSize: 13, fontWeight: 700,
              whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
              border: `1px solid ${typeFilter === t.key ? 'var(--accent)' : 'var(--border)'}`,
              background: typeFilter === t.key ? 'var(--accent)' : 'var(--bg-card)',
              color: typeFilter === t.key ? '#fff' : 'var(--text-secondary)',
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {/* Résultats */}
        {showFavorites ? (
          favFiltered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 44, marginBottom: 12 }}>🤍</p>
              <p style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', marginBottom: 6 }}>Aucun favori pour l'instant</p>
              <p style={{ fontSize: 13, maxWidth: 320, margin: '0 auto 18px' }}>
                Touche le cœur sur un expert pour l'enregistrer ici et le retrouver à tout moment.
              </p>
              <button onClick={() => setTypeFilter('tous')} style={{
                padding: '11px 22px', borderRadius: 12, border: 'none',
                background: 'var(--accent)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
              }}>Découvrir les experts</button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14, fontWeight: 600 }}>
                {favFiltered.length} expert{favFiltered.length > 1 ? 's' : ''} enregistré{favFiltered.length > 1 ? 's' : ''} · contacte-les ou choisis leurs programmes
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,260px),1fr))', gap: 16 }}>
                {favFiltered.map(pro => (
                  <ProCard key={pro.id} pro={pro}
                    onClick={() => navigate(`/marketplace/${pro.id}`)}
                    isFav={favIds.includes(pro.id)} onToggleFav={() => toggleFav(pro.id)}
                    onContact={() => navigate(`/chat/${pro.id}`)} showActions />
                ))}
              </div>
            </>
          )
        ) : loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,260px),1fr))', gap: 16 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ height: 320, background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', opacity: 0.5 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
            <p style={{ fontWeight: 700, fontSize: 16 }}>Aucun résultat</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14, fontWeight: 600 }}>
              {filtered.length} expert{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,260px),1fr))', gap: 16 }}>
              {filtered.map(pro => (
                <ProCard key={pro.id} pro={pro}
                  onClick={() => navigate(`/marketplace/${pro.id}`)}
                  isFav={isClient && favIds.includes(pro.id)}
                  onToggleFav={isClient ? () => toggleFav(pro.id) : undefined} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
