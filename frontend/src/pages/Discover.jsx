import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

/* ── Custom marker icons (no default-icon hack needed) ── */
function makeColorIcon(color, emoji) {
  return divIcon({
    className: '',
    html: `<div style="
      width:42px;height:42px;border-radius:50% 50% 50% 0;
      background:${color};border:3px solid white;
      box-shadow:0 3px 14px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;
      transform:rotate(-45deg);font-size:17px;
    "><span style="transform:rotate(45deg);display:block">${emoji}</span></div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -46],
  })
}

function makeUserIcon() {
  return divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:#4a90d9;border:3px solid white;
      box-shadow:0 0 0 7px rgba(74,144,217,0.22);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

/* Re-center map when flyCenter changes */
function FlyTo({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1 })
  }, [center, map])
  return null
}

/* Corrige la taille de la carte quand elle (re)devient visible
   (Leaflet ne calcule pas ses tuiles si le conteneur était display:none) */
function ResizeFix({ active }) {
  const map = useMap()
  useEffect(() => {
    if (!active) return
    const t1 = setTimeout(() => map.invalidateSize(), 120)
    const t2 = setTimeout(() => map.invalidateSize(), 400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [active, map])
  return null
}

/* ── Constants ──────────────────────────────────────── */
const ROLE_COLOR = { coach: '#a03848', nutritionist: '#27ae60' }
const ROLE_EMOJI = { coach: '🎓', nutritionist: '🥗' }
const SPECIALTIES = ['Force','HIIT','Cardio','Yoga','Mobilité','Running','Boxe','Powerlifting','Nutrition sportive','Rééquilibrage','Végétarisme','Triathlon','Perte de poids','Prise de masse']
const PARIS = { lat: 48.8566, lng: 2.3522 }

/* Carte sobre / minimaliste (CartoDB Dark Matter — sans labels superflus) */
const MAP_TILES = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
  attribution: '&copy; OpenStreetMap &copy; CARTO',
}

function useIsMobile() {
  const [m, setM] = useState(typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}

/* ── Main page ──────────────────────────────────────── */
export default function Discover() {
  const navigate = useNavigate()
  const { fetchDiscoverExperts } = useStore()
  const isMobile = useIsMobile()
  const [mobileView, setMobileView] = useState('list')   // 'list' | 'map'
  const [geoHidden, setGeoHidden]   = useState(false)

  const [experts,    setExperts]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [userPos,    setUserPos]    = useState(null)
  const [selected,   setSelected]   = useState(null)
  const [flyCenter,  setFlyCenter]  = useState(null)
  const [locStatus,  setLocStatus]  = useState('pending')

  const [radius,      setRadius]     = useState(20)
  const [roleFilter,  setRoleFilter] = useState('all')
  const [maxPrice,    setMaxPrice]   = useState(200)
  const [onlineOnly,  setOnlineOnly] = useState(false)
  const [specialty,   setSpecialty]  = useState('')
  const [search,      setSearch]     = useState('')

  /* Geolocation */
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserPos(PARIS); setLocStatus('default'); return
    }
    navigator.geolocation.getCurrentPosition(
      pos => { setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocStatus('ok') },
      ()  => { setUserPos(PARIS); setLocStatus('denied') },
      { timeout: 6000 }
    )
  }, [])

  /* Load experts */
  const load = useCallback(async () => {
    if (!userPos) return
    setLoading(true)
    const params = {
      lat: userPos.lat, lng: userPos.lng, radius,
      ...(roleFilter !== 'all' && { role: roleFilter }),
      ...(onlineOnly && { online: 'true' }),
      ...(specialty  && { specialty }),
      maxPrice,
    }
    const data = await fetchDiscoverExperts(params)
    setExperts(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [userPos, radius, roleFilter, onlineOnly, specialty, maxPrice, fetchDiscoverExperts])

  useEffect(() => { load() }, [load])

  /* Search filter (client-side) */
  const filtered = experts.filter(e => {
    if (!search) return true
    const q = search.toLowerCase()
    return e.name.toLowerCase().includes(q)
      || e.location?.city?.toLowerCase().includes(q)
      || (e.specialties || []).some(s => s.toLowerCase().includes(q))
  })

  const handleSelect = (expert) => {
    setSelected(expert)
    if (expert?.location) setFlyCenter([expert.location.lat, expert.location.lng])
  }

  const mapCenter = userPos ? [userPos.lat, userPos.lng] : [PARIS.lat, PARIS.lng]

  const showList = !isMobile || mobileView === 'list'
  const showMap  = !isMobile || mobileView === 'map'

  return (
    <div style={{ display: 'flex', height: '100vh', maxHeight: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>

      {/* ── LEFT PANEL ──────────────────────────── */}
      <div style={{ width: isMobile ? '100%' : 380, flexShrink: 0,
        display: showList ? 'flex' : 'none', flexDirection: 'column',
        borderRight: isMobile ? 'none' : '1px solid var(--border)', overflow: 'hidden', height: '100vh' }}>

        {/* Header */}
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 2 }}>Géolocalisation</p>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Experts à proximité</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', margin: 0, lineHeight: 1 }}>{filtered.length}</p>
              <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>résultats</p>
            </div>
          </div>
          {/* Geo status badge (fermable) */}
          {!geoHidden && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, fontSize: 11,
              background: locStatus === 'ok' ? 'rgba(39,174,96,0.1)' : 'rgba(232,160,32,0.1)',
              border: `1px solid ${locStatus === 'ok' ? 'rgba(39,174,96,0.3)' : 'rgba(232,160,32,0.3)'}`,
              color: locStatus === 'ok' ? '#27ae60' : '#e8a020',
            }}>
              <span>{locStatus === 'ok' ? '📍' : '🗺'}</span>
              <span style={{ fontWeight: 600, flex: 1 }}>
                {locStatus === 'ok' ? 'Position GPS détectée' : locStatus === 'denied' ? 'Accès refusé — Paris par défaut' : 'Paris par défaut'}
              </span>
              {locStatus === 'denied' && (
                <button onClick={() => { setLocStatus('pending'); navigator.geolocation?.getCurrentPosition(
                    pos => { setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocStatus('ok') },
                    () => setLocStatus('denied'), { timeout: 6000 }) }}
                  style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 800, cursor: 'pointer', fontSize: 11, textDecoration: 'underline', padding: 0 }}>
                  Réessayer
                </button>
              )}
              <button onClick={() => setGeoHidden(true)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 13, fontWeight: 800, padding: '0 2px', lineHeight: 1 }}>
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: '10px 16px 0' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Nom, ville, spécialité…"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13, outline: 'none',
              background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', boxSizing: 'border-box',
            }} />
        </div>

        {/* Filters */}
        <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Role tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all','Tous 🌟'], ['coach','Coaches 🎓'], ['nutritionist','Nutritionnistes 🥗']].map(([v, label]) => (
              <button key={v} onClick={() => setRoleFilter(v)}
                style={{
                  flex: 1, padding: '7px 4px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: roleFilter === v ? 'var(--accent)' : 'var(--bg-card)',
                  color: roleFilter === v ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${roleFilter === v ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Sliders */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 4 }}>Rayon : {radius} km</p>
              <input type="range" min={2} max={50} value={radius} onChange={e => setRadius(+e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 4 }}>Max : {maxPrice}€/séance</p>
              <input type="range" min={20} max={200} step={10} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
          </div>

          {/* Specialty + online */}
          <div style={{ display: 'flex', gap: 6 }}>
            <select value={specialty} onChange={e => setSpecialty(e.target.value)}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 10, fontSize: 11, outline: 'none',
                background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
              }}>
              <option value="">Toutes spécialités</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => setOnlineOnly(!onlineOnly)}
              style={{
                padding: '8px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                background: onlineOnly ? 'rgba(74,144,217,0.15)' : 'var(--bg-card)',
                color: onlineOnly ? '#4a90d9' : 'var(--text-secondary)',
                border: `1px solid ${onlineOnly ? '#4a90d9' : 'var(--border)'}`,
              }}>
              💻 En ligne
            </button>
          </div>
        </div>

        {/* Expert list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0 12px 150px' : '0 12px 12px', scrollbarWidth: 'none' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Recherche en cours…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Aucun résultat</p>
              <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Augmente le rayon ou change les filtres</p>
            </div>
          ) : filtered.map(e => (
            <ExpertCard key={e.id} expert={e} selected={selected?.id === e.id}
              onClick={() => handleSelect(e)}
              onProfile={() => navigate(`/expert/${e.id}`)} />
          ))}
        </div>
      </div>

      {/* ── MAP ─────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', height: '100vh', minHeight: 0, display: showMap ? 'block' : 'none' }}>

        {/* Overlay: selected expert */}
        {selected && (
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, width: 300 }}>
            <ExpertDetail expert={selected} onClose={() => setSelected(null)}
              onProfile={() => navigate(`/expert/${selected.id}`)} />
          </div>
        )}

        {/* Map fills parent absolutely — most reliable cross-browser approach */}
        <div style={{ position: 'absolute', inset: 0 }}>
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} />

          <ResizeFix active={showMap} />
          {flyCenter && <FlyTo center={flyCenter} />}

          {/* User position */}
          {userPos && (
            <>
              <Marker position={[userPos.lat, userPos.lng]} icon={makeUserIcon()} />
              <Circle
                center={[userPos.lat, userPos.lng]}
                radius={radius * 1000}
                pathOptions={{ color: '#4a90d9', fillColor: '#4a90d9', fillOpacity: 0.04, weight: 1.5, dashArray: '6 4' }}
              />
            </>
          )}

          {/* Expert markers */}
          {filtered.map(e => (
            <Marker
              key={e.id}
              position={[e.location.lat, e.location.lng]}
              icon={makeColorIcon(e.avatarColor || ROLE_COLOR[e.role], ROLE_EMOJI[e.role] || '👤')}
              eventHandlers={{ click: () => handleSelect(e) }}
            >
              <Popup>
                <div style={{ minWidth: 170, fontFamily: 'inherit' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 2px' }}>{e.name}</p>
                  <p style={{ fontSize: 11, color: '#888', margin: 0 }}>
                    {ROLE_EMOJI[e.role]} {e.role === 'nutritionist' ? 'Nutritionniste' : 'Coach'} · {e.location.city}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: '4px 0 8px', color: e.avatarColor || ROLE_COLOR[e.role] }}>
                    {e.price}€/séance &nbsp;⭐ {e.rating}
                  </p>
                  <button onClick={() => navigate(`/expert/${e.id}`)}
                    style={{ width: '100%', padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 800,
                      cursor: 'pointer', border: 'none', color: '#fff',
                      background: e.avatarColor || ROLE_COLOR[e.role] }}>
                    Voir le profil →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        </div>{/* /absolute map wrapper */}

        {/* Legend (cachée sur mobile pour ne pas gêner) */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
          display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 14,
          padding: '10px 16px', borderRadius: 14, fontSize: 11,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          {[['#4a90d9','Ta position'],['#a03848','Coach'],['#27ae60','Nutritionniste']].map(([c, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bouton bascule Liste / Carte (mobile) ── */}
      {isMobile && (
        <button onClick={() => setMobileView(v => v === 'list' ? 'map' : 'list')}
          style={{
            position: 'fixed', bottom: 78, left: '50%', transform: 'translateX(-50%)', zIndex: 1500,
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 99,
            background: 'var(--accent)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 800,
            cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,0,0,0.4)', whiteSpace: 'nowrap',
          }}>
          {mobileView === 'list' ? '🗺  Voir la carte' : '☰  Voir la liste'}
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

/* ── Expert card ────────────────────────────────────── */
function ExpertCard({ expert: e, selected, onClick, onProfile }) {
  const color = e.avatarColor || ROLE_COLOR[e.role]
  return (
    <div onClick={onClick}
      style={{
        padding: '12px', borderRadius: 16, cursor: 'pointer', marginBottom: 8, marginTop: 4,
        background: selected ? 'var(--accent-subtle)' : 'var(--bg-card)',
        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        transition: 'all 0.15s ease',
      }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 900, fontSize: 17,
        }}>
          {e.avatar ? <img src={e.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} alt="" /> : e.name[0]}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 2 }}>
            <p style={{ fontSize: 13, fontWeight: 900, margin: 0, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</p>
            {e.verified && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, fontWeight: 700, background: 'rgba(74,144,217,0.15)', color: '#4a90d9' }}>✓ Vérifié</span>}
            {!e.available && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, fontWeight: 700, background: 'var(--border)', color: 'var(--text-faint)' }}>Indispo</span>}
          </div>

          <p style={{ fontSize: 10, color: 'var(--text-faint)', margin: '0 0 6px' }}>
            {ROLE_EMOJI[e.role]} {e.role === 'nutritionist' ? 'Nutritionniste' : 'Coach'} · 📍 {e.location?.city}
          </p>

          {/* Price + rating + distance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 900, color }}>{e.price}€/séance</span>
            <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>⭐ {e.rating} ({e.reviewCount})</span>
            {e.distance != null && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'var(--bg-base)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
                {e.distance < 1 ? `${Math.round(e.distance * 1000)}m` : `${e.distance}km`}
              </span>
            )}
          </div>

          {/* Specialty pills */}
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {(e.specialties || []).slice(0, 3).map(s => (
              <span key={s} style={{
                fontSize: 9, padding: '2px 7px', borderRadius: 99, fontWeight: 700,
                background: `${color}18`, color, border: `1px solid ${color}33`,
              }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Voir le profil */}
      <button onClick={(ev) => { ev.stopPropagation(); onProfile?.() }}
        style={{ width: '100%', marginTop: 10, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 800,
          cursor: 'pointer', background: 'var(--bg-base)', border: `1px solid ${color}`, color }}>
        Voir le profil →
      </button>
    </div>
  )
}

/* ── Expert detail overlay ──────────────────────────── */
function ExpertDetail({ expert: e, onClose, onProfile }) {
  const color = e.avatarColor || ROLE_COLOR[e.role]
  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ padding: 18, background: `linear-gradient(135deg, ${color}dd, ${color}88)`, position: 'relative' }}>
        <button onClick={onClose}
          style={{
            position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 12,
          }}>✕</button>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: 22, border: '2px solid rgba(255,255,255,0.3)',
          }}>{e.name[0]}</div>
          <div>
            <p style={{ fontWeight: 900, color: 'white', fontSize: 15, margin: 0 }}>{e.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, margin: '2px 0 0' }}>{ROLE_EMOJI[e.role]} {e.role === 'nutritionist' ? 'Nutritionniste' : 'Coach'}</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>📍 {e.location?.city}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[[`${e.price}€`, 'par séance'], [`⭐ ${e.rating}`, `${e.reviewCount} avis`], [e.distance != null ? `${e.distance}km` : '—', 'de vous']].map(([v, l]) => (
            <div key={l} style={{ padding: '8px 4px', borderRadius: 12, textAlign: 'center', background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 13, fontWeight: 900, color, margin: 0 }}>{v}</p>
              <p style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>{l}</p>
            </div>
          ))}
        </div>

        {e.bio && <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>{e.bio}</p>}

        {/* Specialties */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {(e.specialties || []).map(s => (
            <span key={s} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, fontWeight: 700, background: `${color}18`, color }}>
              {s}
            </span>
          ))}
        </div>

        {/* Mode */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {e.inPerson && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 8, fontWeight: 700, background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>🏋 Présentiel</span>}
          {e.online   && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 8, fontWeight: 700, background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>💻 En ligne</span>}
        </div>

        {/* CTA */}
        <button onClick={onProfile}
          style={{
            width: '100%', padding: '11px', borderRadius: 14, fontSize: 13, fontWeight: 800,
            color: 'white', background: color, border: 'none', cursor: 'pointer',
          }}>
          Voir le profil complet →
        </button>
      </div>
    </div>
  )
}
