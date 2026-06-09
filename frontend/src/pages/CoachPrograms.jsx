import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

/* ── Résumé profil coach (lecture seule) ─────────────── */
function CoachProfileSummary() {
  const { fetchProfile, user } = useStore()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    fetchProfile().then(p => setProfile(p))
  }, [])

  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?'
  const hasCalendly = !!profile?.calendlyUrl

  return (
    <div className="rounded-2xl overflow-hidden mb-8"
      style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-5 py-4">
        {/* Gauche : avatar + infos */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-base text-white flex-shrink-0 overflow-hidden"
            style={{ background: profile?.avatar ? 'transparent' : 'var(--accent)' }}>
            {profile?.avatar
              ? <img src={profile.avatar} alt="" className="w-full h-full object-cover"/>
              : initials}
          </div>
          <div>
            <p className="font-black text-sm" style={{color:'var(--text-primary)'}}>{user?.name}</p>
            {profile?.bio
              ? <p className="text-xs mt-0.5 line-clamp-1" style={{color:'var(--text-secondary)',maxWidth:280}}>{profile.bio}</p>
              : <p className="text-xs mt-0.5 italic" style={{color:'var(--text-faint)'}}>Bio non renseignée</p>}
            <div className="flex items-center gap-3 mt-1">
              {profile?.specialties?.slice(0,3).map(s => (
                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{background:'var(--accent-subtle)',color:'var(--accent)',border:'1px solid var(--accent)'}}>
                  {s}
                </span>
              ))}
              {(profile?.specialties?.length||0) > 3 && (
                <span className="text-[10px]" style={{color:'var(--text-faint)'}}>+{profile.specialties.length-3}</span>
              )}
            </div>
          </div>
        </div>

        {/* Droite : statut Calendly + bouton modifier */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{background: hasCalendly ? '#27ae60' : '#e8a020'}}/>
            <span className="text-xs font-bold hidden sm:block"
              style={{color: hasCalendly ? '#27ae60' : '#e8a020'}}>
              {hasCalendly ? 'Visible catalogue' : 'Non visible'}
            </span>
          </div>
          <button onClick={() => navigate('/coach/profile')}
            className="px-4 py-2 rounded-xl text-sm font-bold transition"
            style={{background:'var(--accent-subtle)',color:'var(--accent)',border:'1px solid var(--accent)'}}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.color='#fff'}}
            onMouseLeave={e=>{e.currentTarget.style.background='var(--accent-subtle)';e.currentTarget.style.color='var(--accent)'}}>
            ✎ Modifier
          </button>
        </div>
      </div>
    </div>
  )
}

const LEVEL_COLOR = { 'Débutant': '#27ae60', 'Intermédiaire': '#e8a020', 'Avancé': '#a03848', 'Tous niveaux': '#6b7280' }
const CAT_ICONS = { Force: '🏋️', Nutrition: '🥗', Combiné: '⚡', Cardio: '🏃', Mobilité: '🧘' }

function ProgramRow({ program, onEdit, onDelete }) {
  const [confirm, setConfirm] = useState(false)
  const sectionCount = program.sections?.length || 0

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      {/* Mini visual */}
      <div className="rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
        style={{ width: 56, height: 56, background: program.gradient || 'var(--bg-card-2)' }}>
        {CAT_ICONS[program.category] || '💪'}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-black text-sm truncate" style={{ color: 'var(--text-primary)' }}>{program.title}</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
            style={{ background: `${LEVEL_COLOR[program.level]}22`, color: LEVEL_COLOR[program.level] }}>
            {program.level}
          </span>
          {program.price === 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
              style={{ background: 'rgba(39,174,96,0.15)', color: '#27ae60' }}>
              Gratuit
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{program.description}</p>
        <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: 'var(--text-faint)' }}>
          <span>{program.category}</span>
          <span>·</span>
          <span>{program.duration}</span>
          {program.sessions && <><span>·</span><span>{program.sessions}</span></>}
          <span>·</span>
          <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{program.enrollmentCount || 0} inscrits</span>
        </div>
      </div>
      {/* Prix */}
      <div className="text-right flex-shrink-0">
        <p className="font-black text-base" style={{ color: 'var(--accent)' }}>
          {program.price === 0 ? 'Gratuit' : `${program.price}€`}
        </p>
      </div>
      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onEdit(program.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition"
          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)' || (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-subtle)'; e.currentTarget.style.color = 'var(--accent)' }}>
          Modifier
        </button>
        {confirm ? (
          <div className="flex gap-1">
            <button onClick={() => onDelete(program.id)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: '#a03848', color: '#fff' }}>
              Confirmer
            </button>
            <button onClick={() => setConfirm(false)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: 'var(--bg-card-2)', color: 'var(--text-muted)' }}>
              Annuler
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition"
            style={{ background: 'transparent', color: 'var(--text-faint)', border: '1px solid var(--border)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(160,56,72,0.1)'; e.currentTarget.style.color = '#a03848' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-faint)' }}>
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}

export default function CoachPrograms() {
  const navigate = useNavigate()
  const { fetchMyPrograms, deleteProgram, user } = useStore()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const data = await fetchMyPrograms()
    setPrograms(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    await deleteProgram(id)
    setPrograms(prev => prev.filter(p => p.id !== id))
  }

  const totalRevenue   = programs.reduce((s, p) => s + p.price * (p.enrollmentCount || 0), 0)
  const totalEnrolled  = programs.reduce((s, p) => s + (p.enrollmentCount || 0), 0)
  const freeCount      = programs.filter(p => p.price === 0).length
  const avgPrice       = programs.filter(p => p.price > 0).length
    ? Math.round(programs.filter(p => p.price > 0).reduce((s, p) => s + p.price, 0) / programs.filter(p => p.price > 0).length)
    : 0

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-5xl mx-auto">

        {/* Profil coach — lecture seule */}
        <CoachProfileSummary/>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--gold)' }}>Coach</p>
            <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Mes Programmes</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {programs.length} programme{programs.length !== 1 ? 's' : ''} créé{programs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => navigate('/coach/programs/new')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <span className="text-lg leading-none">+</span>
            Nouveau programme
          </button>
        </div>

        {/* Stats rapides */}
        {programs.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Programmes',      value: programs.length,   color: 'var(--accent)' },
              { label: 'Inscrits total',  value: totalEnrolled,     color: '#4ade80' },
              { label: 'Revenus estimés', value: `${totalRevenue}€`,color: '#e8a020' },
              { label: 'Prix moyen',      value: `${avgPrice}€`,    color: '#3a52a8' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-5 rounded-2xl text-center"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-2xl font-black" style={{ color }}>{value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Aucun programme</h2>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              Crée ton premier programme et partage-le avec tes clients.
            </p>
            <button onClick={() => navigate('/coach/programs/new')}
              className="px-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'var(--accent)' }}>
              Créer mon premier programme
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map(p => (
              <ProgramRow key={p.id} program={p}
                onEdit={id => navigate(`/coach/programs/${id}/edit`)}
                onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
