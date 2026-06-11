import { useEffect, useState, useRef } from 'react'
import { useStore } from '../store'
import { useNavigate } from 'react-router-dom'
import AIInsights from '../components/AIInsights'

/* ─── Helpers ──────────────────────────────────────────── */
function ytEmbed(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  const v = url.match(/vimeo\.com\/(\d+)/)
  if (v) return `https://player.vimeo.com/video/${v[1]}`
  return null
}

function getTimeBlock() {
  const h = new Date().getHours()
  if (h < 6)  return { label: 'Bonne nuit',  icon: '🌙', sub: 'Le monde dort. Toi tu construis.' }
  if (h < 12) return { label: 'Bonjour',     icon: '🌅', sub: 'Une nouvelle page blanche.' }
  if (h < 18) return { label: 'Bon après-midi', icon: '☀️', sub: 'L\'élan est là. Continue.' }
  return               { label: 'Bonsoir',    icon: '🌆', sub: 'Bilan du jour. Tu avances.' }
}

function formatDate() {
  return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const QUOTES = [
  { text: "La discipline est le pont entre les objectifs et les accomplissements.", author: "Jim Rohn" },
  { text: "Ce n'est pas qui tu es qui te retient. C'est qui tu crois ne pas être.", author: "Denis Waitley" },
  { text: "Le succès n'est pas final. L'échec n'est pas fatal. C'est le courage de continuer qui compte.", author: "Winston Churchill" },
  { text: "Chaque champion était un jour un inconnu qui a refusé d'abandonner.", author: "Simon Sinek" },
  { text: "La force ne vient pas de la capacité physique. Elle vient d'une volonté indomptable.", author: "Gandhi" },
  { text: "Le corps réalise ce que l'esprit croit.", author: "Jim Loehr" },
  { text: "Ne comptez pas les jours. Faites que les jours comptent.", author: "Muhammad Ali" },
]

function todaysQuote() {
  const day = new Date().getDay()
  return QUOTES[day % QUOTES.length]
}

/* ─── Sparkline SVG ────────────────────────────────────── */
function Sparkline({ data, color = 'var(--accent)', height = 32 }) {
  if (!data?.length) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80, h = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ─── Stat card with sparkline ─────────────────────────── */
function MetricCard({ label, value, unit, trend, trendLabel, sparkData, color, icon, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [])
  const isUp = trend > 0
  return (
    <div className={`rounded-2xl p-5 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <span className="text-base leading-none">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-black leading-none" style={{ fontSize: 28, color }}>{value}<span className="text-base font-bold ml-1" style={{ color: 'var(--text-faint)' }}>{unit}</span></p>
          {trendLabel && (
            <p className="text-[11px] mt-2 flex items-center gap-1 font-bold"
              style={{ color: trend === 0 ? 'var(--text-faint)' : isUp ? '#4ade80' : '#f87171' }}>
              <span>{trend === 0 ? '—' : isUp ? '↑' : '↓'}</span>
              {trendLabel}
            </p>
          )}
        </div>
        {sparkData && <Sparkline data={sparkData} color={color}/>}
      </div>
    </div>
  )
}

/* ─── Activity item ────────────────────────────────────── */
function ActivityItem({ icon, title, sub, time, accent, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [])
  return (
    <div className={`flex items-center gap-3 py-3 transition-all duration-400 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`}
      style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
        style={{ background: accent + '18', border: `1px solid ${accent}30` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-[11px] truncate" style={{ color: 'var(--text-faint)' }}>{sub}</p>
      </div>
      <span className="text-[10px] font-bold flex-shrink-0" style={{ color: 'var(--text-faint)' }}>{time}</span>
    </div>
  )
}

/* ─── Cinematic coach hero ─────────────────────────────── */
function CoachHero({ profile, user, navigate }) {
  const [visible, setVisible] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const timeBlock = getTimeBlock()

  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const hasCalendly = !!profile?.calendlyUrl
  const heroImage = profile?.banner || profile?.photos?.[0] || null

  return (
    <div className="relative w-full overflow-hidden rounded-3xl mb-5"
      style={{ minHeight: 400, background: '#080810' }}>

      {heroImage && (
        <img src={heroImage} alt="" onLoad={() => setImgLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: imgLoaded ? (profile?.banner ? 0.45 : 0.28) : 0, filter: profile?.banner ? 'none' : 'saturate(0.5) contrast(1.15)', transform: 'scale(1.05)', transition: 'opacity 1.2s ease' }}/>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, rgba(8,8,16,0.97) 0%, rgba(8,8,16,0.65) 50%, rgba(8,8,16,0.2) 100%)' }}/>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 30%, rgba(160,56,72,0.12) 0%, transparent 60%)' }}/>
      <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 100%)' }}/>

      {/* Top row */}
      <div className="relative z-10 px-10 pt-8 flex items-start justify-between">
        <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
          <p className="text-[10px] font-black tracking-[0.35em] uppercase" style={{ color: 'rgba(232,160,32,0.7)' }}>
            {formatDate()}
          </p>
        </div>
        <div className={`flex items-center gap-2 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
          style={{ transitionDelay: '50ms' }}>
          {hasCalendly && (
            <span className="text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.25)', color: '#4ade80', backdropFilter: 'blur(8px)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"/>
              Disponible
            </span>
          )}
          {profile?.instagram && (
            <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(8px)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#e040a0'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
              📸 @{profile.instagram}
            </a>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 px-10 pt-6 pb-10">
        {/* Greeting */}
        <div className={`mb-5 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '100ms' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {timeBlock.icon} {timeBlock.label}, <span style={{ color: 'rgba(255,255,255,0.6)' }}>{user?.name}</span>
          </p>
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.22)' }}>{timeBlock.sub}</p>
        </div>

        {/* Avatar + name */}
        <div className={`flex items-end gap-5 mb-5 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '180ms' }}>
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-xl text-white"
            style={{ background: profile?.avatar ? 'transparent' : 'var(--accent)', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            {profile?.avatar ? <img src={profile.avatar} alt="" className="w-full h-full object-cover"/> : initials}
          </div>
          <div>
            <p className="text-[11px] font-black tracking-[0.28em] uppercase mb-0.5" style={{ color: 'rgba(232,160,32,0.7)' }}>Coach certifié</p>
            <h1 className="font-black tracking-tight leading-none" style={{ fontSize: 42, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>
              {user?.name}
            </h1>
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p className={`text-base leading-relaxed max-w-xl mb-5 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ color: 'rgba(255,255,255,0.45)', transitionDelay: '260ms' }}>
            {profile.bio.length > 180 ? profile.bio.slice(0, 180) + '…' : profile.bio}
          </p>
        )}

        {/* Specialties */}
        {profile?.specialties?.length > 0 && (
          <div className={`flex flex-wrap gap-2 mb-7 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '320ms' }}>
            {profile.specialties.map(s => (
              <span key={s} className="text-[11px] font-bold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)' }}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className={`flex items-center gap-3 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '380ms' }}>
          <button onClick={() => navigate('/coach/profile')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'var(--accent)', boxShadow: '0 4px 24px rgba(160,56,72,0.35)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            ✎ Modifier le profil
          </button>
          <button onClick={() => navigate('/coach/programs')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}>
            Mes programmes →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Daily quote ───────────────────────────────────────── */
function DailyQuote() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 900); return () => clearTimeout(t) }, [])
  const q = todaysQuote()
  return (
    <div className={`relative rounded-2xl p-7 overflow-hidden transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="absolute top-4 left-7 text-6xl font-black leading-none pointer-events-none select-none"
        style={{ color: 'var(--accent)', opacity: 0.08, fontFamily: 'Georgia, serif' }}>"</div>
      <div className="relative z-10">
        <p className="text-base font-semibold leading-relaxed italic mb-3" style={{ color: 'var(--text-secondary)' }}>
          « {q.text} »
        </p>
        <p className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>— {q.author}</p>
      </div>
    </div>
  )
}

/* ─── Photos strip ─────────────────────────────────────── */
function PhotoStrip({ photos }) {
  if (!photos?.length) return null
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
      {photos.map((p, i) => (
        <div key={i} className="flex-shrink-0 rounded-2xl overflow-hidden"
          style={{ width: 130, height: 90, background: 'var(--bg-card)', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <img src={p} alt="" className="w-full h-full object-cover"/>
        </div>
      ))}
    </div>
  )
}

/* ─── Video ─────────────────────────────────────────────── */
function VideoCard({ profile }) {
  const embedUrl = profile?.videoUrl ? ytEmbed(profile.videoUrl) : null
  if (!embedUrl && !profile?.videoData) return null
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '1px solid var(--border)', aspectRatio: '16/9', background: '#000' }}>
      {embedUrl
        ? <iframe src={embedUrl} className="w-full h-full" frameBorder="0" allowFullScreen title="Présentation"/>
        : <video src={profile.videoData} controls className="w-full h-full" style={{ objectFit: 'contain' }}/>}
    </div>
  )
}

/* ─── Quick action card ─────────────────────────────────── */
function QuickAction({ icon, title, sub, color, onClick, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [])
  return (
    <button onClick={onClick}
      className={`relative p-5 rounded-2xl text-left overflow-hidden w-full transition-all duration-500 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at 0% 100%, ${color}10 0%, transparent 65%)` }}/>
      <p className="text-xl mb-2">{icon}</p>
      <p className="font-black text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{sub}</p>
    </button>
  )
}

/* ─── Coach Dashboard ───────────────────────────────────── */
function CoachDashboard({ user, navigate }) {
  const { fetchProfile, fetchMyPrograms } = useStore()
  const [profile,  setProfile]  = useState(null)
  const [programs, setPrograms] = useState([])

  useEffect(() => {
    fetchProfile().then(p => setProfile(p || {}))
    fetchMyPrograms().then(p => setPrograms(p || []))
  }, [])

  const MOCK_SPARK = [4, 7, 5, 9, 6, 11, 8, 13, 10, 15, 12, 14]

  const ACTIVITIES = [
    { icon: '🥗', title: 'Alex a complété son suivi nutrition', sub: 'Objectif atteint à 94%', time: 'il y a 12 min', accent: '#27ae60' },
    { icon: '💪', title: 'Marie a terminé Semaine 3', sub: 'Programme Force Absolue', time: 'il y a 1h', accent: 'var(--accent)' },
    { icon: '📅', title: 'Nouveau RDV Calendly', sub: 'Thomas — Appel découverte 30min', time: 'il y a 2h', accent: '#e8a020' },
    { icon: '⭐', title: 'Avis 5 étoiles reçu', sub: '"Meilleur coach que j\'ai eu"', time: 'hier', accent: '#f59e0b' },
    { icon: '📈', title: 'Lucas progresse sur le squat', sub: '+12 kg en 3 semaines', time: 'hier', accent: '#3a52a8' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-4xl mx-auto" style={{ padding: 'clamp(16px, 4vw, 32px)' }}>

        {/* Hero cinématique */}
        {profile !== null && <CoachHero profile={profile} user={user} navigate={navigate}/>}

        {/* Photos */}
        {profile?.photos?.length > 1 && <PhotoStrip photos={profile.photos.slice(1)}/>}

        {/* Vidéo */}
        <VideoCard profile={profile}/>

        {/* Metrics row — 2 cols mobile, 4 desktop */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:16 }} className="dash-kpi">
          <MetricCard label="Programmes" value={programs.length || 0} color="var(--accent)" icon="📋" trend={1} trendLabel="créés" sparkData={MOCK_SPARK} delay={500}/>
          <MetricCard label="Inscrits" value={programs.reduce((s,p)=>s+(p.enrollmentCount||0),0)} color="#3a52a8" icon="👥" trend={1} trendLabel="total" sparkData={[3,5,4,7,6,8,9,8,11,10,12,11]} delay={580}/>
          <MetricCard label="Revenus" unit="€" value={programs.reduce((s,p)=>s+p.price*(p.enrollmentCount||0),0)} color="#4ade80" icon="💰" trend={1} trendLabel="estimés" sparkData={[200,280,240,380,320,450,380,500,440,560,490,540]} delay={660}/>
          <MetricCard label="Gratuits" value={programs.filter(p=>p.price===0).length} color="#e8a020" icon="🎁" trend={0} trendLabel="programmes" sparkData={[70,72,68,75,74,78,76,80,79,82,81,83]} delay={740}/>
        </div>

        {/* Activité + Actions — colonne unique mobile */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12, marginBottom:16 }} className="dash-activity">
          {/* Activity feed */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Activité récente</p>
              <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#4ade80' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"/>
                Live
              </span>
            </div>
            {ACTIVITIES.map((a, i) => (
              <ActivityItem key={i} {...a} delay={600 + i * 80}/>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <QuickAction icon="➕" title="Nouveau programme" sub="Créer et vendre un programme" color="var(--accent)"
              onClick={() => navigate('/coach/programs/new')} delay={600}/>
            <QuickAction icon="🥗" title="Suivi nutrition" sub="Macros clients en temps réel" color="#27ae60"
              onClick={() => navigate('/coach/nutrition')} delay={700}/>
            <QuickAction icon="📋" title="Mes programmes" sub="Gérer le catalogue" color="#3a52a8"
              onClick={() => navigate('/coach/programs')} delay={800}/>
          </div>
        </div>

        <style>{`
          @media(min-width:768px){
            .dash-kpi { grid-template-columns: repeat(4,1fr) !important; }
            .dash-activity { grid-template-columns: 3fr 2fr !important; }
          }
        `}</style>

        {/* AI Insights */}
        <AIInsights/>

        {/* Quote of the day */}
        <DailyQuote/>

      </div>
    </div>
  )
}

/* ─── Client Dashboard ─────────────────────────────────── */
function ClientDashboard({ user, navigate }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t) }, [])
  const timeBlock = getTimeBlock()
  const PHRASES = [
    `Prêt à tout déchirer, ${user.name.split(' ')[0]} ?`,
    `C'est ton jour, ${user.name.split(' ')[0]}.`,
    `${user.name.split(' ')[0]}, la transformation continue.`,
    `Ne lâche rien, ${user.name.split(' ')[0]}.`,
  ]
  const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,40px)' }}>
      <div className={`mb-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--gold)' }}>
          {timeBlock.icon} {timeBlock.label} · {formatDate()}
        </p>
        <h1 className="font-black leading-snug" style={{ color: 'var(--text-primary)', fontSize: 'clamp(20px,5vw,30px)' }}>{phrase}</h1>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }} className="client-kpi">
        <MetricCard label="Programmes actifs" value="0" color="var(--accent)" icon="💪" delay={200}/>
        <MetricCard label="Coaches" value="0" color="var(--gold)" icon="🏆" delay={300}/>
        <MetricCard label="Progression" unit="%" value="0" color="#4ade80" icon="📈" delay={400}/>
      </div>
      <div className="rounded-2xl p-8 mb-5 relative overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 85% 50%, var(--accent-subtle) 0%, transparent 60%)' }}/>
        <div className="relative z-10">
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>Par où commencer</p>
          <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Explore les programmes disponibles</h2>
          <p className="text-sm mb-5 max-w-lg" style={{ color: 'var(--text-secondary)' }}>Des programmes conçus par des experts certifiés. Choisis celui qui correspond à tes objectifs.</p>
          <button onClick={() => navigate('/programs')}
            className="text-white px-5 py-2.5 rounded-xl font-bold text-sm"
            style={{ background: 'var(--accent)' }}>
            Voir les programmes
          </button>
        </div>
      </div>
      <DailyQuote/>
    </div>
  )
}

/* ─── Main ──────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useStore()
  const navigate = useNavigate()
  if (!user) return null
  if (user.role !== 'coach') return <ClientDashboard user={user} navigate={navigate}/>
  return <CoachDashboard user={user} navigate={navigate}/>
}
