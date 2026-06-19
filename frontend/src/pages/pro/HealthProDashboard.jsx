import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import ProRadarWidget from '../../components/ProRadarWidget'

export default function HealthProDashboard() {
  const { user, fetchProfile } = useStore()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => { fetchProfile().then(setProfile); const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  const p = profile || user || {}
  const initials = p.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const onMap = !!p.location
  const hasRpps = !!p.rpps

  const ACTIONS = [
    { icon: '👤', title: 'Mon profil public', sub: 'Bio, RPPS, spécialités, localisation', color: '#0ea5e9', to: '/pro/profile' },
    { icon: '🗺', title: 'Carte des sportifs', sub: 'Trouve et sois trouvé par les athlètes', color: '#27ae60', to: '/discover' },
    { icon: '◉', title: 'Messages', sub: 'Échange avec coachs et patients', color: '#a03848', to: '/chat' },
    { icon: '▦', title: 'Calendrier', sub: 'Tes consultations à venir', color: '#e8a020', to: '/calendar' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,40px)' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>

        {/* Header */}
        <div className={`mb-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--gold)' }}>
            🩺 {p.profession || 'Professionnel de santé'}
          </p>
          <h1 className="font-black" style={{ color: 'var(--text-primary)', fontSize: 'clamp(22px,5vw,32px)' }}>
            Bonjour, {p.name?.split(' ')[0] || 'Docteur'} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Ton espace pour accompagner les sportifs et collaborer avec leurs coachs.
          </p>
        </div>

        {/* Carte profil */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 overflow-hidden"
              style={{ background: p.avatarColor || '#0ea5e9' }}>
              {p.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-base truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{p.profession || 'Professionnel de santé'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {hasRpps
              ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: 'rgba(14,165,233,0.12)', color: '#0ea5e9' }}>🛡️ RPPS {p.rpps}</span>
              : <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: 'rgba(232,160,32,0.12)', color: '#e8a020' }}>⚠️ RPPS manquant</span>}
            {onMap
              ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: 'rgba(39,174,96,0.12)', color: '#27ae60' }}>📍 Visible sur la carte</span>
              : <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: 'rgba(232,160,32,0.12)', color: '#e8a020' }}>📍 Pas encore sur la carte</span>}
          </div>
          <button onClick={() => navigate('/pro/profile')}
            className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
            ✎ Compléter mon profil
          </button>
        </div>

        {/* Radar Patient IA — charge réelle & risques de rechute */}
        <ProRadarWidget />

        {/* Actions rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
          {ACTIONS.map(a => (
            <button key={a.title} onClick={() => navigate(a.to)}
              className="rounded-2xl p-5 text-left transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3"
                style={{ background: `${a.color}18` }}>{a.icon}</div>
              <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{a.sub}</p>
            </button>
          ))}
        </div>

        {/* Teaser dossiers partagés */}
        <div className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0c2230 0%, #0a1520 100%)', border: '1px solid rgba(14,165,233,0.25)' }}>
          <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: '#0ea5e9' }}>Bientôt</p>
          <h2 className="text-lg font-black mb-2 text-white">📋 Dossiers partagés coach ↔ santé</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 520 }}>
            Avec l'accord du patient, partage tes bilans (entorse, repos, contre-indications…) directement
            au coach pour qu'il adapte le programme. La collaboration santé-performance, sécurisée et conforme.
          </p>
        </div>
      </div>
    </div>
  )
}
