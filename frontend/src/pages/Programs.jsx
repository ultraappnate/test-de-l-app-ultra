import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const LEVEL_ORDER = { 'Débutant': 0, 'Tous niveaux': 1, 'Intermédiaire': 2, 'Avancé': 3 }
const LEVEL_COLOR = { 'Débutant': '#27ae60', 'Intermédiaire': '#e8a020', 'Avancé': '#a03848', 'Tous niveaux': '#6b7280' }
const ICONS = { Force: '🏋️', Nutrition: '🥗', Combiné: '⚡', Cardio: '🏃', Mobilité: '🧘' }
const CAT_ORDER = ['Force', 'Cardio', 'Mobilité', 'Nutrition', 'Combiné']
const SPECIALTIES_OPTS = ['Force','Cardio','Nutrition','Mobilité','Combiné','Prise de masse','Sèche','Performance','Réathlétisation']

/* ════════════════════════════════════════════════════════
   ONGLET PROGRAMMES
════════════════════════════════════════════════════════ */

function FeaturedCard({ program, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onClick}
      className="rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 transition-all duration-300"
      style={{
        width: 280, height: 340,
        border: `1px solid ${hov ? 'rgba(255,255,255,0.25)' : 'var(--border)'}`,
        transform: hov ? 'translateY(-6px) scale(1.02)' : 'none',
        boxShadow: hov ? '0 24px 50px rgba(0,0,0,0.22)' : '0 4px 12px rgba(0,0,0,0.08)',
      }}>
      <div className="w-full h-full relative" style={{ background: program.gradient || 'var(--bg-card)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.18) 0%, transparent 55%), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: 'auto, 24px 24px, 24px 24px',
        }} />
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(8px)' }}>
            {program.category}
          </span>
          {program.price === 0 && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ background: 'rgba(39,174,96,0.4)', border: '1px solid rgba(39,174,96,0.6)', color: '#b0f0c0', backdropFilter: 'blur(8px)' }}>
              Gratuit
            </span>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center transition-all duration-300"
          style={{ fontSize: hov ? 64 : 52, opacity: hov ? 0.3 : 0.85, transform: hov ? 'scale(1.1) translateY(-8px)' : 'none' }}>
          {program.coverImage
            ? <img src={program.coverImage} alt="" className="w-full h-full object-cover absolute inset-0" style={{opacity: hov?0.3:0.85}}/>
            : ICONS[program.category] || '💪'}
        </div>
        <div className="absolute inset-0 flex items-center justify-center px-6 transition-all duration-300"
          style={{ opacity: hov ? 1 : 0 }}>
          <p className="text-white text-sm text-center leading-relaxed" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {program.description}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)' }}>
          <h3 className="text-white font-black text-base leading-tight mb-2">{program.title}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${LEVEL_COLOR[program.level]}40`, color: LEVEL_COLOR[program.level] }}>
                {program.level}
              </span>
              <span className="text-white/45 text-[11px]">{program.duration}</span>
            </div>
            <span className="text-white font-black text-lg flex-shrink-0 ml-2">
              {program.price === 0 ? '—' : `${program.price}€`}
            </span>
          </div>
          <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: hov ? 28 : 0 }}>
            <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <span className="text-white/40 text-[11px]">{program.enrollmentCount || 0} inscrits</span>
              <span className="text-white text-[11px] font-bold">Voir →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RowCard({ program, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onClick}
      className="rounded-xl overflow-hidden cursor-pointer flex-shrink-0 transition-all duration-300"
      style={{
        width: 200,
        border: `1px solid ${hov ? 'var(--accent)' : 'var(--border)'}`,
        background: 'var(--bg-card)',
        transform: hov ? 'translateY(-4px) scale(1.03)' : 'none',
        boxShadow: hov ? '0 14px 32px rgba(0,0,0,0.16)' : 'none',
      }}>
      <div className="relative overflow-hidden transition-all duration-300"
        style={{ height: hov ? 110 : 88, background: program.gradient || 'var(--bg-card-2)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 30%, rgba(255,255,255,0.2) 0%, transparent 55%)',
        }} />
        {program.coverImage
          ? <img src={program.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover"/>
          : <div className="absolute inset-0 flex items-center justify-center transition-all duration-300"
              style={{ fontSize: hov ? 32 : 26 }}>
              {ICONS[program.category] || '💪'}
            </div>}
        {program.nutrition && (
          <div className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(39,174,96,0.45)', color: '#b0f0c0', border: '1px solid rgba(39,174,96,0.5)' }}>
            🥗
          </div>
        )}
        {program.source === 'admin' && program.price > 0 && (
          <div className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(212,175,55,0.45)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.5)' }}>
            ★
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-black leading-tight mb-1.5" style={{ color: 'var(--text-primary)' }}>{program.title}</p>
        <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: hov ? 48 : 0, opacity: hov ? 1 : 0 }}>
          <p className="text-[11px] leading-relaxed mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {program.description?.slice(0, 72)}…
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
            style={{ background: `${LEVEL_COLOR[program.level]}22`, color: LEVEL_COLOR[program.level] }}>
            {program.level}
          </span>
          <span className="text-xs font-black" style={{ color: 'var(--accent)' }}>
            {program.price === 0 ? 'Gratuit' : `${program.price}€`}
          </span>
        </div>
        {hov && (
          <p className="text-[11px] font-bold mt-2 pt-2" style={{ color: 'var(--accent)', borderTop: '1px solid var(--border)' }}>
            Voir le programme →
          </p>
        )}
      </div>
    </div>
  )
}

function CategoryRow({ title, programs, navigate, badge }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {badge && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
            {badge}
          </span>
        )}
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{programs.length} programme{programs.length > 1 ? 's' : ''}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {programs.map(p => (
          <RowCard key={p.id} program={p} onClick={() => navigate(`/programs/${p.id}`)} />
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   ONGLET ACCOMPAGNEMENT — Calendly inline
════════════════════════════════════════════════════════ */

/* ── Modal Calendly inline ──────────────────────────── */
function CalendlyModal({ coach, onClose }) {
  const iframeUrl = `${coach.calendlyUrl}?hide_landing_page_details=1&hide_gdpr_banner=1&primary_color=7d2d38`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '92vh' }}>
        {/* Header modal */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--gold)' }}>Réservation</p>
            <h3 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>Appel avec {coach.name}</h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition"
            style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(160,56,72,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-base)'}>✕</button>
        </div>
        {/* Calendly iframe */}
        <div className="flex-1 overflow-hidden" style={{ minHeight: 500 }}>
          <iframe
            src={iframeUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            title={`Réserver un appel avec ${coach.name}`}
            style={{ minHeight: 560 }}
          />
        </div>
      </div>
    </div>
  )
}

/* ── Coach card ─────────────────────────────────────── */
function CoachCard({ coach, onBook }) {
  const [hov, setHov] = useState(false)
  const initials = coach.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${hov ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: hov ? '0 16px 40px rgba(0,0,0,0.14)' : 'none',
        transform: hov ? 'translateY(-4px)' : 'none',
      }}>
      {/* Cover gradient */}
      <div className="h-24 relative flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#1a0a0d 0%,#7d2d38 60%,#a03848 100%)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.12) 0%, transparent 60%)',
        }}/>
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white absolute -bottom-8"
          style={{ background: 'var(--accent)', border: '3px solid var(--bg-card)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          {initials}
        </div>
      </div>

      <div className="px-5 pt-12 pb-5">
        <h3 className="font-black text-base text-center mb-1" style={{ color: 'var(--text-primary)' }}>{coach.name}</h3>
        <p className="text-xs text-center mb-3" style={{ color: 'var(--text-faint)' }}>
          {coach.programCount} programme{coach.programCount !== 1 ? 's' : ''} disponible{coach.programCount !== 1 ? 's' : ''}
        </p>

        {/* Bio */}
        {coach.bio && (
          <p className="text-xs text-center leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            {coach.bio}
          </p>
        )}
        {!coach.bio && (
          <p className="text-xs text-center leading-relaxed mb-4 italic" style={{ color: 'var(--text-faint)' }}>
            Coach certifié ULTRA
          </p>
        )}

        {/* Spécialités */}
        {coach.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center mb-4">
            {coach.specialties.slice(0,4).map(s => (
              <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Bouton réserver */}
        {coach.calendlyUrl ? (
          <button onClick={() => onBook(coach)}
            className="w-full py-3 rounded-xl text-sm font-black transition flex items-center justify-center gap-2"
            style={{
              background: hov ? 'var(--accent)' : 'var(--accent-subtle)',
              color: hov ? '#fff' : 'var(--accent)',
              border: '1px solid var(--accent)',
            }}>
            <span>📅</span> Réserver un appel
          </button>
        ) : (
          <div className="w-full py-3 rounded-xl text-sm font-medium text-center"
            style={{ background: 'var(--bg-base)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>
            Réservation non disponible
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Onglet Accompagnement ──────────────────────────── */
function AccompagnementTab() {
  const { fetchCoaches } = useStore()
  const [coaches,  setCoaches]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [booking,  setBooking]  = useState(null)  // coach sélectionné

  useEffect(() => {
    fetchCoaches().then(list => { setCoaches(list); setLoading(false) })
  }, [])

  return (
    <div>
      {/* Hero */}
      <div className="rounded-3xl p-8 mb-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1a0a0d 0%,#7d2d38 50%,#3a52a8 100%)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: 'auto, 32px 32px, 32px 32px',
        }}/>
        <div className="relative z-10 max-w-xl">
          <p className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Accompagnement Personnalisé</p>
          <h2 className="text-3xl font-black text-white leading-tight mb-3">
            Suivi 1-1 avec<br/>votre coach
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Un appel découverte gratuit pour analyser vos objectifs, votre programme et construire une stratégie sur mesure.
          </p>
          <div className="flex flex-wrap gap-3">
            {['✓ Bilan personnalisé', '✓ Plan d\'action adapté', '✓ Suivi régulier'].map(f => (
              <span key={f} className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Coachs */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}/>
        </div>
      ) : coaches.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👨‍💼</div>
          <h3 className="font-black text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Aucun coach disponible</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Les coachs apparaîtront ici une fois leur profil configuré.
          </p>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-black mb-5" style={{ color: 'var(--text-primary)' }}>
            Nos coachs · {coaches.length} disponible{coaches.length > 1 ? 's' : ''}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {coaches.map(coach => (
              <CoachCard key={coach.id} coach={coach} onBook={setBooking}/>
            ))}
          </div>
        </>
      )}

      {/* Modal Calendly */}
      {booking && (
        <CalendlyModal coach={booking} onClose={() => setBooking(null)}/>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   PAGE PRINCIPALE avec onglets
════════════════════════════════════════════════════════ */
export default function Programs() {
  const { programs, fetchPrograms, user } = useStore()
  const navigate = useNavigate()
  const [loading, setLoading]   = useState(true)
  const [tab,     setTab]       = useState('programmes') // 'programmes' | 'accompagnement'
  const [search,  setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('Tous')

  useEffect(() => { fetchPrograms().finally(() => setLoading(false)) }, [])

  // Filtres
  const filtered = programs.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
    const matchCat    = catFilter === 'Tous' || p.category === catFilter
    return matchSearch && matchCat
  })

  const featured   = [...filtered].sort((a,b) => (b.enrollmentCount||0) - (a.enrollmentCount||0)).slice(0,4)
  const byCategory = CAT_ORDER.map(cat => ({
    cat,
    items: filtered.filter(p => p.category === cat).sort((a,b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]),
  })).filter(({ items }) => items.length > 0)
  const free = filtered.filter(p => p.price === 0).sort((a,b) => (b.enrollmentCount||0) - (a.enrollmentCount||0))

  const TABS = [
    { id: 'programmes',      label: '📚 Programmes',           count: programs.length },
    { id: 'accompagnement',  label: '🤝 Accompagnement',       count: null },
  ]

  return (
    <div className="min-h-screen p-6 lg:p-8" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--gold)' }}>Catalogue</p>
          <h1 className="text-4xl font-black">Programmes</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {programs.length} programmes · Du débutant à l'élite
          </p>
        </div>

        {/* Onglets */}
        <div className="flex items-center gap-1 mb-8 p-1 rounded-2xl w-fit"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
              style={{
                background: tab === t.id ? 'var(--accent)' : 'transparent',
                color: tab === t.id ? '#fff' : 'var(--text-muted)',
              }}>
              {t.label}
              {t.count !== null && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
                  style={{ background: tab === t.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-base)', color: tab === t.id ? '#fff' : 'var(--text-faint)' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Onglet Programmes ── */}
        {tab === 'programmes' && (
          <>
            {/* Barre de recherche + filtres catégorie */}
            <div className="flex items-center gap-3 mb-8 flex-wrap">
              <div className="relative flex-1" style={{ maxWidth: 320, minWidth: 200 }}>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-faint)' }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un programme..."
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}/>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['Tous', ...CAT_ORDER].map(cat => (
                  <button key={cat} onClick={() => setCatFilter(cat)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
                    style={{
                      background: catFilter === cat ? 'var(--accent)' : 'var(--bg-card)',
                      color: catFilter === cat ? '#fff' : 'var(--text-muted)',
                      border: `1px solid ${catFilter === cat ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                    {cat === 'Tous' ? 'Tous' : `${ICONS[cat]} ${cat}`}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="w-10 h-10 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}/>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <p className="font-black text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Aucun résultat</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Essayez avec d'autres termes</p>
              </div>
            ) : (
              <>
                {/* Vedette */}
                {!search && catFilter === 'Tous' && (
                  <div className="mb-12">
                    <div className="flex items-center gap-3 mb-5">
                      <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>⭐ Les plus populaires</h2>
                      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Par nombre d'inscrits</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                      {featured.map(p => (
                        <FeaturedCard key={p.id} program={p} onClick={() => navigate(`/programs/${p.id}`)}/>
                      ))}
                    </div>
                  </div>
                )}

                <div className="h-px mb-10" style={{ background: 'var(--border)' }}/>

                {/* Gratuits */}
                {!search && catFilter === 'Tous' && free.length > 0 && (
                  <CategoryRow title="🎁 Accès gratuit" programs={free} navigate={navigate} badge="Gratuit"/>
                )}

                {/* Par catégorie */}
                {byCategory.map(({ cat, items }) => (
                  <CategoryRow key={cat} title={`${ICONS[cat]} ${cat}`} programs={items} navigate={navigate}/>
                ))}

                {/* Mode recherche — liste plate */}
                {(search || catFilter !== 'Tous') && filtered.length > 0 && byCategory.length === 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map(p => (
                      <RowCard key={p.id} program={p} onClick={() => navigate(`/programs/${p.id}`)}/>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Onglet Accompagnement ── */}
        {tab === 'accompagnement' && <AccompagnementTab/>}
      </div>
    </div>
  )
}
