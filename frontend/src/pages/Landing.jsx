import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/* ── Scroll-reveal hook ───────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function Reveal({ children, delay = 0, className = '', from = 'bottom' }) {
  const [ref, visible] = useReveal()
  const transforms = {
    bottom: visible ? 'translateY(0)' : 'translateY(32px)',
    left:   visible ? 'translateX(0)' : 'translateX(-32px)',
    right:  visible ? 'translateX(0)' : 'translateX(32px)',
    scale:  visible ? 'scale(1)'       : 'scale(0.92)',
  }
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: transforms[from] || transforms.bottom,
      transition: `opacity 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

/* ── 3D Tilt Card ─────────────────────────────────── */
function TiltCard({ children, className = '', style = {}, intensity = 10, glowColor = 'var(--accent)', onClick, onMouseEnter: externalEnter, onMouseLeave: externalLeave }) {
  const ref = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })
  const animRef = useRef(null)
  const currentTilt = useRef({ x: 0, y: 0 })
  const targetTilt  = useRef({ x: 0, y: 0 })

  const lerp = (a, b, t) => a + (b - a) * t

  const animate = useCallback(() => {
    const cx = lerp(currentTilt.current.x, targetTilt.current.x, 0.12)
    const cy = lerp(currentTilt.current.y, targetTilt.current.y, 0.12)
    currentTilt.current = { x: cx, y: cy }
    setTilt({ x: cx, y: cy })
    if (Math.abs(cx - targetTilt.current.x) > 0.01 || Math.abs(cy - targetTilt.current.y) > 0.01) {
      animRef.current = requestAnimationFrame(animate)
    }
  }, [])

  const handleMouseMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top)  / rect.height
    targetTilt.current = { x: (py - 0.5) * -intensity, y: (px - 0.5) * intensity }
    setGlowPos({ x: px * 100, y: py * 100 })
    cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(animate)
  }, [intensity, animate])

  const handleMouseLeave = useCallback((e) => {
    setHovered(false)
    targetTilt.current = { x: 0, y: 0 }
    cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(animate)
    externalLeave?.(e)
  }, [animate, externalLeave])

  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  return (
    <div
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={(e) => { setHovered(true); externalEnter?.(e) }}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.025 : 1})`,
        transition: hovered ? 'box-shadow 0.3s ease, border-color 0.3s ease' : 'transform 0.6s cubic-bezier(.22,1,.36,1), box-shadow 0.4s ease',
        willChange: 'transform',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(circle 140px at ${glowPos.x}% ${glowPos.y}%, ${glowColor}22 0%, transparent 70%)`,
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

/* ── Animated CTA button ──────────────────────────── */
function GlowButton({ children, onClick, primary = true, color = 'var(--accent)', className = '' }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden ${className}`}
      style={{
        background: primary ? color : 'var(--bg-card)',
        border: primary ? 'none' : '1px solid var(--border)',
        color: primary ? '#fff' : 'var(--text-secondary)',
        transform: hovered ? 'scale(1.045) translateY(-1px)' : 'scale(1) translateY(0)',
        boxShadow: hovered && primary ? `0 8px 30px ${color}55` : 'none',
      }}
    >
      {hovered && primary && (
        <div style={{
          position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  )
}

/* ── Mock UI components ───────────────────────────── */
function MockDashboard() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#1e1219', border: '1px solid rgba(255,255,255,0.10)', fontSize: 12 }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#180e12' }}>
        <span className="font-black tracking-widest text-white text-sm">ULTRA</span>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 opacity-80" />
          <div className="w-2 h-2 rounded-full bg-yellow-400 opacity-80" />
          <div className="w-2 h-2 rounded-full bg-green-400 opacity-80" />
        </div>
      </div>
      <div className="flex">
        <div className="w-10 flex flex-col items-center gap-3 py-4" style={{ background: '#180e12', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {['⊞','📊','💬','🥗','🏆'].map((i, idx) => (
            <div key={idx} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] ${idx===0?'bg-[#a03848]':''}`}
              style={{ opacity: idx===0 ? 1 : 0.4 }}>{i}</div>
          ))}
        </div>
        <div className="flex-1 p-4 space-y-3">
          <p className="text-white font-bold text-xs">Bonjour, Alex 👋</p>
          <div className="grid grid-cols-3 gap-2">
            {[['Séances', '12', '+2'], ['Poids', '78kg', '-3.2'], ['Score', '94%', '↑']].map(([l,v,d]) => (
              <div key={l} className="p-2 rounded-lg" style={{ background: '#2c1a21', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9 }}>{l}</p>
                <p className="text-white font-black text-sm">{v}</p>
                <p style={{ color: '#e8c84a', fontSize: 9 }}>{d}</p>
              </div>
            ))}
          </div>
          <div className="p-2 rounded-lg" style={{ background: '#2c1a21', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, marginBottom: 6 }}>Progression semaine</p>
            <div className="flex items-end gap-1 h-10">
              {[4,6,5,8,7,9,10].map((h,i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h*10}%`, background: i===6?'#a03848':'rgba(160,56,72,0.3)' }} />
              ))}
            </div>
          </div>
          <div className="p-2 rounded-lg" style={{ background: '#361f28', border: '1px solid rgba(160,56,72,0.3)' }}>
            <div className="flex justify-between items-center">
              <p className="text-white font-semibold" style={{ fontSize: 10 }}>Objectif du jour</p>
              <span style={{ background: '#a03848', color: 'white', fontSize: 8, padding: '1px 6px', borderRadius: 99 }}>Aujourd'hui</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, marginTop: 4 }}>Entraînement + nutrition · 45 min</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MockChat() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: '#1e1219', border: '1px solid rgba(255,255,255,0.10)', fontSize: 12 }}>
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#180e12', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="w-7 h-7 rounded-full bg-[#a03848] flex items-center justify-center text-white text-[10px] font-black">C</div>
        <div>
          <p className="text-white font-semibold" style={{ fontSize: 11 }}>Coach Marc</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>En ligne</p>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex justify-end">
          <div className="px-3 py-1.5 rounded-xl rounded-tr-sm text-white max-w-[70%]" style={{ background: '#a03848', fontSize: 10 }}>
            J'ai du mal avec le squat lourd
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-[#a03848] flex items-center justify-center text-white text-[8px] font-black flex-shrink-0">C</div>
          <div className="px-3 py-1.5 rounded-xl rounded-tl-sm max-w-[75%]" style={{ background: '#2c1a21', color: 'rgba(255,255,255,0.8)', fontSize: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
            On va revoir ta mobilité de hanche ce jeudi. J'ai ajusté ton programme 💪
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-[#a03848] flex items-center justify-center text-white text-[8px] font-black flex-shrink-0">C</div>
          <div className="px-3 py-1.5 rounded-xl rounded-tl-sm max-w-[75%]" style={{ background: '#2c1a21', color: '#e8c84a', fontSize: 10, border: '1px solid rgba(232,200,74,0.2)' }}>
            ✓ Plan mis à jour
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          <input readOnly value="Super merci !" className="flex-1 rounded-lg px-3 py-1.5 text-white" style={{ background: '#2c1a21', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, outline: 'none' }} />
          <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#a03848' }}>
            <span className="text-white" style={{ fontSize: 10 }}>↑</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function MockNutrition() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: '#1e1219', border: '1px solid rgba(255,255,255,0.10)', fontSize: 12 }}>
      <div className="px-4 py-3" style={{ background: '#180e12', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-white font-bold" style={{ fontSize: 11 }}>Plan nutritionnel · Semaine 4</p>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
          {[['Calories', '2 180', 'kcal'], ['Protéines', '165', 'g'], ['Glucides', '220', 'g']].map(([l,v,u]) => (
            <div key={l} className="p-2 rounded-lg text-center" style={{ background: '#2c1a21', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8 }}>{l}</p>
              <p className="text-white font-black" style={{ fontSize: 13 }}>{v}</p>
              <p style={{ color: '#e8c84a', fontSize: 8 }}>{u}</p>
            </div>
          ))}
        </div>
        {['Petit-déjeuner','Déjeuner','Dîner'].map((m, i) => (
          <div key={m} className="flex items-center justify-between p-2 rounded-lg" style={{ background: '#2c1a21', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: i===1?'#a03848':'rgba(160,56,72,0.25)' }}>
                <span style={{ fontSize: 10 }}>{['🍳','🥗','🍖'][i]}</span>
              </div>
              <p className="text-white font-medium" style={{ fontSize: 10 }}>{m}</p>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>{['480','720','650'][i]} kcal</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockProgram() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: '#1e1219', border: '1px solid rgba(255,255,255,0.10)', fontSize: 12 }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#180e12', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-white font-bold" style={{ fontSize: 11 }}>Tableau de bord · Clients</p>
        <span style={{ background: '#a03848', color: 'white', fontSize: 8, padding: '2px 8px', borderRadius: 99 }}>Live</span>
      </div>
      <div className="p-3 space-y-2">
        {[
          ['Alex M.', '94%', '78kg', true],
          ['Lucie R.', '87%', '62kg', true],
          ['Tom B.', '71%', '85kg', false],
          ['Sara K.', '96%', '58kg', true],
        ].map(([name, score, weight, active]) => (
          <div key={name} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: active ? '#2c3020' : '#2c1a21', border: `1px solid ${active ? 'rgba(100,200,80,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-black flex-shrink-0"
              style={{ background: active ? '#27ae60' : '#a03848' }}>{name[0]}</div>
            <div className="flex-1">
              <p className="font-medium text-white" style={{ fontSize: 10 }}>{name}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>{weight}</p>
            </div>
            <span style={{ color: active ? '#7dc96e' : '#e8a020', fontSize: 10, fontWeight: 700 }}>{score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Data ─────────────────────────────────────────── */
const FEATURES = [
  {
    tab: 'Dashboard',
    label: 'Vue d\'ensemble',
    title: 'Tout centralisé. Rien d\'oublié.',
    desc: "Progression, séances, objectifs, messages — tout au même endroit. Que tu sois client, coach ou nutritionniste, tu sais exactement où tu en es à tout moment.",
    bullets: ["Vue d'ensemble en temps réel", "Alertes et rappels intelligents", "Synchronisation multi-appareils"],
    mock: <MockDashboard />,
  },
  {
    tab: 'Messagerie',
    label: 'Communication directe',
    title: 'Ton expert, direct dans ta poche.',
    desc: "Plus d'emails perdus, plus de suivi approximatif. Tout passe par ULTRA : messages, ajustements de plan, feedback en temps réel — entre client, coach et nutritionniste.",
    bullets: ["Messagerie instantanée avec ton expert", "Partage de fichiers et de données", "Notification dès qu'un plan est ajusté"],
    mock: <MockChat />,
  },
  {
    tab: 'Nutrition',
    label: 'Plans alimentaires',
    title: 'La nutrition pensée pour toi.',
    desc: "Plans alimentaires créés par des nutritionnistes certifiés, synchronisés avec tes entraînements. Adapté à tes goûts, tes objectifs, ton emploi du temps.",
    bullets: ["Macros calculées selon ton objectif", "Base de 10 000+ aliments", "Ajustements automatiques semaine par semaine"],
    mock: <MockNutrition />,
  },
  {
    tab: 'Suivi clients',
    label: 'Gestion pro',
    title: 'Coache, suis, développe ton activité.',
    desc: "Pour les coaches et nutritionnistes : tous tes clients en un tableau de bord. Compliance, progression, paiements — tout automatisé pour que tu te concentres sur l'essentiel.",
    bullets: ["Tous tes clients en un tableau de bord", "Programmes et plans créés en quelques clics", "Paiements automatisés, zéro relance"],
    mock: <MockProgram />,
  },
]

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'Cliente · 6 mois', result: '−14 kg', text: "En 6 mois j'ai perdu 14 kilos et retrouvé une énergie que j'avais perdue depuis des années. Le suivi de mon coach change absolument tout.", avatar: 'S', color: '#c0392b' },
  { name: 'Thomas R.', role: 'Coach sportif · 2 ans', result: '×3 revenus', text: "J'ai multiplié mes revenus par 3 en 4 mois. ULTRA m'a permis de professionnaliser mon activité et de coacher 40 clients au lieu de 12.", avatar: 'T', color: '#8e44ad' },
  { name: 'Marie D.', role: 'Cliente · 1 an', result: '1er marathon', text: "Après 5 ans de yo-yo, j'ai enfin une méthode qui tient. Mon coach ajuste mon plan en temps réel. Je n'avais jamais connu ça.", avatar: 'M', color: '#2980b9' },
  { name: 'Lucas H.', role: 'Client · 3 mois', result: '+18 kg muscle', text: "Mon premier semi-marathon en 3 mois de prépa ULTRA. Et en parallèle j'ai pris 18 kg au développé couché. Objectif largement dépassé.", avatar: 'L', color: '#27ae60' },
  { name: 'Camille V.', role: 'Nutritionniste · 18 mois', result: '60 clients', text: "Avant ULTRA je jonglais entre WhatsApp, Excel et PDF. Maintenant tout est centralisé. Je passe 3h de moins à administrer chaque semaine.", avatar: 'C', color: '#e67e22' },
]

const STEPS = [
  { num: '01', title: 'Crée ton profil', desc: "Renseigne tes objectifs et ton rôle en 2 minutes. L'IA adapte l'expérience selon que tu es client, coach ou nutritionniste.", icon: '👤' },
  { num: '02', title: 'Connecte ton équipe', desc: "Trouve le coach ou nutritionniste idéal, ou accède à ta clientèle. Tout démarre en quelques clics.", icon: '🤝' },
  { num: '03', title: 'Lance-toi', desc: "Ton espace est prêt dès le premier jour. Programmes, plans alimentaires, suivi — tout t'attend.", icon: '🚀' },
]

const COMPARE = {
  client: {
    title: "Une seule plateforme pour ta transformation.",
    before: [
      "Programmes génériques trouvés sur YouTube",
      "Aucun suivi réel de ta progression",
      "Nutrition gérée séparément (ou pas du tout)",
      "Pas de coach disponible quand tu bloques",
      "Motivation qui s'effondre après 3 semaines",
    ],
    after: [
      "Plan 100% personnalisé, ajusté chaque semaine",
      "Graphiques de progression en temps réel",
      "Nutrition synchronisée avec tes entraînements",
      "Expert certifié disponible en messagerie directe",
      "Suivi continu qui maintient ta motivation",
    ],
  },
  coach: {
    title: "Une seule plateforme pour gérer ton activité.",
    before: [
      "Excel pour suivre chaque client manuellement",
      "WhatsApp pour les messages, PDF pour les programmes",
      "Paiements relancés à la main chaque mois",
      "Aucune vision globale sur tes clients",
      "Limité à 10-15 clients par manque d'outils",
    ],
    after: [
      "Tous tes clients centralisés en un tableau de bord",
      "Programmes créés et partagés en quelques clics",
      "Paiements automatisés, zéro relance",
      "Progression de chaque client visible en direct",
      "Coacher 40+ clients sans travailler plus",
    ],
  },
  nutritionist: {
    title: "Une seule plateforme pour ta pratique.",
    before: [
      "Plans alimentaires créés dans Excel ou Word",
      "Suivi des clients par email et WhatsApp",
      "Bilans nutritionnels envoyés en PDF manuel",
      "Aucune synchronisation avec l'activité physique",
      "Impossible de gérer plus de 20 clients",
    ],
    after: [
      "Plans alimentaires créés et partagés en direct",
      "Messagerie intégrée avec chaque client",
      "Bilans automatiques semaine par semaine",
      "Données alimentaires synchronisées au programme sportif",
      "Gérer 60+ clients sans perdre en qualité",
    ],
  },
}

const PROFILE_CONTENT = {
  client: {
    label: 'Athlète / Client',
    icon: '💪',
    headline: 'Transforme ton corps.',
    subHeadline: 'Trouve ton équilibre.',
    sub: 'Programmes personnalisés, experts certifiés, nutrition sur mesure. Tout ce qu\'il faut pour atteindre tes objectifs — au même endroit.',
    cta: 'Commencer ma transformation',
    stats: [['2 400+', 'Athlètes actifs'], ['−12 kg', 'Résultat moyen en 3 mois'], ['98%', 'Satisfaction client']],
    accent: 'Transforme ton corps.',
    color: 'var(--accent)',
    bg: 'rgba(160,56,72,0.12)',
    border: 'rgba(160,56,72,0.4)',
  },
  coach: {
    label: 'Coach Sportif',
    icon: '🎓',
    headline: 'Développe ton activité.',
    subHeadline: 'Sans limite.',
    sub: 'Gère tous tes clients depuis une seule plateforme. Crée tes programmes, encaisse tes paiements, suis les résultats en temps réel.',
    cta: 'Créer mon espace coach',
    stats: [['×3', 'Revenus moyens après 4 mois'], ['40+', 'Clients gérables simultanément'], ['−3h', 'Admin économisées par jour']],
    accent: 'Développe ton activité.',
    color: '#2980b9',
    bg: 'rgba(41,128,185,0.12)',
    border: 'rgba(41,128,185,0.4)',
  },
  nutritionist: {
    label: 'Nutritionniste',
    icon: '🥗',
    headline: 'Digitalise ta pratique.',
    subHeadline: 'Suis mieux tes clients.',
    sub: 'Crée des plans alimentaires personnalisés à grande échelle. Centralise tes consultations, bilans et suivis en un seul outil professionnel.',
    cta: 'Rejoindre en tant que nutritionniste',
    stats: [['60+', 'Clients gérables en parallèle'], ['10 000+', 'Aliments en base de données'], ['−3h', 'Admin par semaine']],
    accent: 'Digitalise ta pratique.',
    color: '#27ae60',
    bg: 'rgba(39,174,96,0.12)',
    border: 'rgba(39,174,96,0.4)',
  },
}

const FAQS = [
  { q: "Est-ce que ULTRA est fait pour les débutants ?", a: "Absolument. Nos coaches et nutritionnistes s'adaptent à tous les niveaux, du grand débutant à l'athlète confirmé. Lors de l'inscription, tu renseignes ton niveau et tout est adapté en conséquence." },
  { q: "Comment fonctionne le suivi avec mon expert ?", a: "Chaque abonné est suivi par un coach ou nutritionniste certifié. Tu communiques via la messagerie intégrée, ton expert voit tes données en temps réel et ajuste ton plan chaque semaine." },
  { q: "Est-ce que la nutrition est incluse dans tous les programmes ?", a: "Non — certains programmes sont uniquement sportifs. Le suivi nutritionnel est une option, disponible seule ou combinée avec un programme d'entraînement." },
  { q: "Puis-je changer de coach ou nutritionniste ?", a: "Oui, à tout moment. Si le feeling ne passe pas, tu peux en choisir un autre depuis ton dashboard sans frais supplémentaires." },
  { q: "Comment se passe l'annulation ?", a: "En un clic depuis ton tableau de bord, sans justification ni préavis. Aucun engagement, aucune CB requise pour démarrer." },
]

/* ── Main component ───────────────────────────────── */
export default function Landing({ theme, setTheme }) {
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const [activeFeature, setActiveFeature] = useState(0)
  const [openFaq, setOpenFaq] = useState(null)
  const testimonialRef = useRef(null)
  const [profile, setProfile] = useState('client') // Beta : client uniquement
  const [hoveredProfile, setHoveredProfile] = useState(null)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const setProfileAndSave = (p) => {
    setProfile(p)
    localStorage.setItem('ultra-profile', p)
  }

  const P = PROFILE_CONTENT[profile]
  const displayProfile = hoveredProfile || profile

  const scrollTestimonials = (dir) => {
    if (testimonialRef.current) {
      testimonialRef.current.scrollBy({ left: dir * 360, behavior: 'smooth' })
    }
  }

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }} className="min-h-screen overflow-x-hidden">

      {/* ── NAV ────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 md:px-12 py-4 sticky top-0 z-50 backdrop-blur-md"
        style={{ borderBottom: '1px solid var(--border)', background: 'color-mix(in srgb, var(--bg-base) 88%, transparent)' }}>
        <span className="text-xl font-black tracking-[0.25em]" style={{ color: 'var(--text-primary)' }}>ULTRA</span>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          <a href="#innovations" className="hover:opacity-75 transition">Innovations</a>
          <a href="#fonctionnalites" className="hover:opacity-75 transition">Fonctionnalités</a>
          <a href="#temoignages" className="hover:opacity-75 transition">Témoignages</a>
          <a href="#faq" className="hover:opacity-75 transition">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-base transition-all duration-200 hover:scale-105"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {isDark ? '☀' : '☾'}
          </button>
          <button onClick={() => navigate('/login')}
            className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-xl transition hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}>
            Connexion
          </button>
          <GlowButton onClick={() => navigate('/register')} className="text-sm px-4 py-2">
            Démarrer →
          </GlowButton>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────── */}
      <section className="relative px-8 md:px-12 pt-20 pb-0 overflow-hidden">
        {/* dynamic bg glow */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-700" style={{
          backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 0%, ${PROFILE_CONTENT[displayProfile].bg.replace('0.12', '0.3')} 0%, transparent 70%)`
        }} />

        <div className="max-w-6xl mx-auto relative z-10">

          {/* ULTRA wordmark */}
          <Reveal>
            <div className="text-center mb-10">
              <span className="font-black tracking-[0.18em] select-none"
                style={{
                  fontSize: 'clamp(64px, 12vw, 140px)',
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                  letterSpacing: '0.15em',
                }}>
                ULTRA
              </span>
            </div>
          </Reveal>

          {/* Beta : sélecteur de persona retiré — inscription client uniquement */}

          {/* Dynamic headline */}
          <div key={displayProfile} style={{ animation: 'fadeSlideIn 0.35s ease' }}>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.05] text-center mb-3 max-w-4xl mx-auto"
              style={{ color: 'var(--text-primary)' }}>
              <span style={{ color: PROFILE_CONTENT[displayProfile].color }}>
                {PROFILE_CONTENT[displayProfile].headline}
              </span>
            </h1>
            <h2 className="text-4xl md:text-6xl font-black leading-[1.05] text-center mb-6 max-w-4xl mx-auto"
              style={{ color: 'var(--text-primary)', opacity: 0.6 }}>
              {PROFILE_CONTENT[displayProfile].subHeadline}
            </h2>

            <p className="text-lg md:text-xl text-center leading-relaxed max-w-2xl mx-auto mb-10"
              style={{ color: 'var(--text-secondary)' }}>
              {PROFILE_CONTENT[displayProfile].sub}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <GlowButton
                onClick={() => navigate(`/register?role=${profile}`)}
                color={P.color}
                className="px-9 py-4 text-base"
              >
                {P.cta} →
              </GlowButton>
              <GlowButton
                primary={false}
                onClick={() => navigate('/discover')}
                className="px-9 py-4 text-base"
              >
                🗺 Trouver un expert près de moi
              </GlowButton>
            </div>
            <p className="text-sm text-center" style={{ color: 'var(--text-faint)' }}>
              Accès immédiat
            </p>

            <div className="grid grid-cols-3 gap-4 mt-16 max-w-xl mx-auto">
              {PROFILE_CONTENT[displayProfile].stats.map(([v, l]) => (
                <TiltCard key={l} intensity={6} glowColor={PROFILE_CONTENT[displayProfile].color}
                  className="py-5 rounded-2xl text-center"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <p className="text-2xl font-black" style={{ color: PROFILE_CONTENT[displayProfile].color }}>{v}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{l}</p>
                </TiltCard>
              ))}
            </div>
          </div>

          {/* Hero app mockup */}
          <Reveal delay={100}>
            <div className="mt-14 relative max-w-3xl mx-auto">
              <div className="absolute -inset-10 pointer-events-none" style={{
                background: `radial-gradient(ellipse 70% 50% at 50% 100%, ${PROFILE_CONTENT[displayProfile].bg.replace('0.12', '0.4')} 0%, transparent 80%)`
              }} />
              <MockDashboard />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TRUST BAR ──────────────────────────────── */}
      <div className="py-5 mt-10 overflow-hidden" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="marquee-track flex gap-16 w-max">
          {[...Array(3)].flatMap(() =>
            ['CrossFit Paris', '·', 'BasicFit Pro', '·', 'FitNation', '·', 'SportElite', '·', 'NutriCoach', '·', 'AthleteHub', '·', 'PeakPerformance', '·', 'EliteCoach', '·']
          ).map((name, i) => (
            <span key={i} className="text-sm font-black tracking-widest uppercase flex-shrink-0"
              style={{ color: name === '·' ? 'var(--accent)' : 'var(--text-faint)', opacity: name === '·' ? 1 : 0.55 }}>
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* ── INNOVATIONS CLÉS ──────────────────────── */}
      <section id="innovations" className="px-8 md:px-12 py-24 max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>Ce qui nous différencie</p>
            <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--text-primary)' }}>
              Des fonctionnalités<br />
              <span style={{ color: 'var(--accent)' }}>qui changent vraiment tout.</span>
            </h2>
            <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              ULTRA n'est pas un simple outil de suivi. C'est une plateforme complète, pensée pour révolutionner la relation coach–client–nutritionniste.
            </p>
          </div>
        </Reveal>

        {/* Big feature cards — 2 columns */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Géolocalisation */}
          <Reveal delay={0} from="left">
            <TiltCard intensity={6} glowColor="#4a90d9"
              className="p-8 rounded-3xl h-full flex flex-col gap-5 overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg, #0a1020 0%, #0d1a3d 60%, #1a2e6b 100%)', border: '1px solid rgba(74,144,217,0.3)' }}
              onClick={() => navigate('/discover')}>
              <div className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #4a90d9, transparent 70%)' }} />
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'rgba(74,144,217,0.2)', border: '1px solid rgba(74,144,217,0.4)' }}>🗺</div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: 'rgba(74,144,217,0.2)', color: '#4a90d9' }}>NOUVEAU</span>
                </div>
                <h3 className="text-2xl font-black mb-2" style={{ color: '#fff' }}>Trouve un expert près de toi</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Géolocalisation en temps réel. Carte interactive avec tous les coaches et nutritionnistes disponibles autour de toi. Filtre par spécialité, budget, présentiel ou en ligne.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <span className="text-sm font-bold" style={{ color: '#4a90d9' }}>Explorer la carte →</span>
              </div>
              {/* Mini map preview */}
              <div className="rounded-2xl overflow-hidden mt-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(74,144,217,0.2)', height: 100 }}>
                <div className="h-full flex items-center justify-center relative">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(74,144,217,0.3) 0px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(74,144,217,0.3) 0px, transparent 1px, transparent 20px)', backgroundSize: '20px 20px' }} />
                  {[['30%','40%','#a03848','🎓'],['55%','30%','#27ae60','🥗'],['70%','60%','#a03848','🎓'],['45%','65%','#27ae60','🥗'],['20%','65%','#a03848','🎓']].map(([x,y,c,e],i) => (
                    <div key={i} style={{ position:'absolute', left:x, top:y, width:24, height:24, borderRadius:'50% 50% 50% 0', background:c, border:'2px solid white', transform:'rotate(-45deg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, boxShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>
                      <span style={{ transform:'rotate(45deg)' }}>{e}</span>
                    </div>
                  ))}
                  <div style={{ width:12, height:12, borderRadius:'50%', background:'#4a90d9', border:'2px solid white', boxShadow:'0 0 0 5px rgba(74,144,217,0.25)', position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)' }} />
                </div>
              </div>
            </TiltCard>
          </Reveal>

          {/* Interface complète par rôle */}
          <Reveal delay={80} from="right">
            <div className="flex flex-col gap-6 h-full">
              {/* Nutritionniste */}
              <TiltCard intensity={6} glowColor="#27ae60"
                className="p-6 rounded-3xl flex-1 flex gap-5 items-start overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, #041208 0%, #0d3d1a 60%, #1a6b2e 100%)', border: '1px solid rgba(39,174,96,0.3)' }}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle, #27ae60, transparent 70%)' }} />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'rgba(39,174,96,0.2)', border: '1px solid rgba(39,174,96,0.4)' }}>🥗</div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(39,174,96,0.2)', color: '#27ae60' }}>NUTRITIONNISTE</span>
                  </div>
                  <h3 className="text-lg font-black mb-1.5" style={{ color: '#fff' }}>Interface 100% dédiée nutrition</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Plans alimentaires, recettes, bilans, ebooks, consultations, suivi compliance — tout en un, rien de superflu.
                  </p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {['Plans repas','Recettes','Ebooks','Consultations','Stats'].map(f => (
                      <span key={f} className="text-[10px] px-2 py-1 rounded-lg font-bold" style={{ background: 'rgba(39,174,96,0.15)', color: '#27ae60' }}>{f}</span>
                    ))}
                  </div>
                </div>
              </TiltCard>

              {/* Boutique coach */}
              <TiltCard intensity={6} glowColor="#e8a020"
                className="p-6 rounded-3xl flex-1 flex gap-5 items-start overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, #1a0f00 0%, #3d2200 60%, #6b3d00 100%)', border: '1px solid rgba(232,160,32,0.3)' }}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle, #e8a020, transparent 70%)' }} />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'rgba(232,160,32,0.2)', border: '1px solid rgba(232,160,32,0.4)' }}>🛍</div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,160,32,0.2)', color: '#e8a020' }}>COACH</span>
                  </div>
                  <h3 className="text-lg font-black mb-1.5" style={{ color: '#fff' }}>Ta boutique intégrée</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Vêtements, compléments, programmes, consultations, ebooks — vends directement depuis ton profil ULTRA.
                  </p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {['Vêtements','Compléments','Programmes','Ebooks','Collaborations'].map(f => (
                      <span key={f} className="text-[10px] px-2 py-1 rounded-lg font-bold" style={{ background: 'rgba(232,160,32,0.15)', color: '#e8a020' }}>{f}</span>
                    ))}
                  </div>
                </div>
              </TiltCard>
            </div>
          </Reveal>
        </div>

        {/* Row 2 — 3 smaller feature cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🔔', title: 'Notifications intelligentes', color: '#8e44ad', bg: 'rgba(142,68,173,0.12)', border: 'rgba(142,68,173,0.3)',
              desc: 'Chaque action importante te parvient en temps réel — message coach, repas loggé, paiement reçu, rappel de séance.',
              tags: ['In-app','Temps réel','Par rôle'],
            },
            {
              icon: '🧙', title: 'Onboarding personnalisé', color: '#4a90d9', bg: 'rgba(74,144,217,0.12)', border: 'rgba(74,144,217,0.3)',
              desc: 'En 4 étapes, chaque nouvel utilisateur est guidé vers les experts qui correspondent exactement à ses objectifs et à son budget.',
              tags: ['Wizard 4 étapes','Matching','Géo'],
            },
            {
              icon: '🤖', title: 'IA génération de programmes', color: '#a03848', bg: 'var(--accent-subtle)', border: 'var(--accent)',
              desc: 'Claude AI génère des programmes sur mesure en quelques secondes. Objectif, niveau, équipement — l\'IA adapte chaque séance.',
              tags: ['Claude AI','Sur mesure','Auto'],
            },
          ].map(({ icon, title, color, bg, border, desc, tags }, i) => (
            <Reveal key={title} delay={i * 100} from="bottom">
              <TiltCard intensity={7} glowColor={color}
                className="p-7 rounded-3xl h-full flex flex-col gap-4"
                style={{ background: 'var(--bg-card)', border: `1px solid ${border}` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: bg, border: `1px solid ${border}` }}>{icon}</div>
                <div>
                  <h3 className="text-base font-black mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
                <div className="flex gap-2 flex-wrap mt-auto pt-2">
                  {tags.map(t => (
                    <span key={t} className="text-[10px] px-2.5 py-1 rounded-lg font-bold"
                      style={{ background: bg, color }}>{t}</span>
                  ))}
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────── */}
      <section id="fonctionnalites" className="px-8 md:px-12 py-24 max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>Fonctionnalités</p>
            <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--text-primary)' }}>
              Tout ce qu'il te faut.<br />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.75em' }}>Rien de superflu.</span>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="flex gap-2 flex-wrap justify-center mb-10">
            {FEATURES.map((f, i) => (
              <button key={i} onClick={() => setActiveFeature(i)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: activeFeature === i ? 'var(--accent)' : 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: activeFeature === i ? '#fff' : 'var(--text-secondary)',
                  transform: activeFeature === i ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: activeFeature === i ? '0 4px 16px var(--accent)44' : 'none',
                }}>
                {f.tab}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120} from="scale">
          <div className="grid lg:grid-cols-2 gap-8 items-center p-8 md:p-12 rounded-3xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div key={activeFeature} style={{ animation: 'fadeSlideIn 0.35s ease' }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--gold)' }}>
                {FEATURES[activeFeature].label}
              </p>
              <h3 className="text-2xl md:text-3xl font-black mb-4 leading-tight" style={{ color: 'var(--text-primary)' }}>
                {FEATURES[activeFeature].title}
              </h3>
              <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                {FEATURES[activeFeature].desc}
              </p>
              <ul className="space-y-3 mb-8">
                {FEATURES[activeFeature].bullets.map(b => (
                  <li key={b} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                      style={{ background: 'var(--accent)' }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <GlowButton onClick={() => navigate('/register')} className="px-6 py-3 text-sm">
                Essayer gratuitement →
              </GlowButton>
            </div>
            <div key={`mock-${activeFeature}`} style={{ animation: 'fadeSlideIn 0.35s ease' }}>
              {FEATURES[activeFeature].mock}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── COMPARE ────────────────────────────────── */}
      <section id="compare" className="px-8 md:px-12 py-24" style={{ background: 'var(--bg-card)' }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-12" key={profile} style={{ animation: 'fadeSlideIn 0.4s ease' }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>Pourquoi ULTRA</p>
              <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--text-primary)' }}>
                {COMPARE[profile].title.replace(/\.$/, '').split(' ').slice(0, -2).join(' ')}<br />
                <span style={{ color: P.color }}>
                  {COMPARE[profile].title.replace(/\.$/, '').split(' ').slice(-2).join(' ')}.
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6" key={profile} style={{ animation: 'fadeSlideIn 0.4s ease' }}>
            {(['before', 'after']).map((tab) => (
              <Reveal key={tab} delay={tab === 'after' ? 100 : 0} from={tab === 'after' ? 'right' : 'left'}>
                <div className="p-6 rounded-2xl h-full"
                  style={{
                    background: tab === 'after' ? 'var(--accent-subtle)' : 'var(--bg-base)',
                    border: `1px solid ${tab === 'after' ? P.color : 'var(--border)'}`,
                  }}>
                  <p className="text-sm font-bold mb-5" style={{ color: tab === 'after' ? P.color : 'var(--text-muted)' }}>
                    {tab === 'before' ? `✕ Sans ULTRA · ${P.label}` : `✓ Avec ULTRA · ${P.label}`}
                  </p>
                  <ul className="space-y-3">
                    {COMPARE[profile][tab].map(item => (
                      <li key={item} className="flex items-start gap-3 text-sm" style={{ color: tab === 'after' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        <span className="flex-shrink-0 mt-0.5 font-bold" style={{ color: tab === 'after' ? P.color : 'var(--text-faint)' }}>
                          {tab === 'after' ? '✓' : '✕'}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 ÉTAPES ───────────────────────────────── */}
      <section className="px-8 md:px-12 py-24 max-w-6xl mx-auto">
        <Reveal>
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>C'est simple</p>
            <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--text-primary)' }}>
              Démarre maintenant<br />
              <span style={{ color: 'var(--accent)' }}>en 3 étapes.</span>
            </h2>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6 relative">
          {STEPS.map(({ num, title, desc, icon }, i) => (
            <Reveal key={num} delay={i * 140} from="bottom">
              <TiltCard
                intensity={7}
                glowColor="var(--accent)"
                className="relative p-8 rounded-2xl flex flex-col gap-4 h-full"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black" style={{ color: 'var(--accent)', opacity: 0.25, fontFamily: 'Georgia, serif' }}>{num}</span>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)' }}>
                    {icon}
                  </div>
                </div>
                <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
        <Reveal delay={450}>
          <div className="text-center mt-10">
            <GlowButton onClick={() => navigate('/register')} className="px-10 py-4 text-base mx-auto">
              Créer mon compte gratuitement →
            </GlowButton>
          </div>
        </Reveal>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────── */}
      <section id="temoignages" className="py-24" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div className="px-8 md:px-12 mb-10">
          <Reveal>
            <div className="flex items-end justify-between max-w-7xl mx-auto">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>Témoignages</p>
                <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--text-primary)' }}>
                  Ils ont transformé<br />leur vie.
                </h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => scrollTestimonials(-1)}
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-200 hover:scale-110"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>←</button>
                <button onClick={() => scrollTestimonials(1)}
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-200 hover:scale-110"
                  style={{ background: 'var(--accent)', color: 'white' }}>→</button>
              </div>
            </div>
          </Reveal>
        </div>

        <div ref={testimonialRef} className="flex gap-5 px-8 md:px-12 overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {TESTIMONIALS.map(({ name, role, result, text, avatar, color }, i) => (
            <Reveal key={name} delay={i * 80} from="bottom">
              <TiltCard
                intensity={5}
                glowColor={color}
                className="flex-shrink-0 w-80 p-7 rounded-2xl flex flex-col gap-5"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-base flex-shrink-0"
                    style={{ background: color }}>{avatar}</div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{role}</p>
                  </div>
                  <div className="ml-auto px-3 py-1 rounded-full text-xs font-black"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                    {result}
                  </div>
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-secondary)' }}>"{text}"</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: 'var(--gold)', fontSize: 14 }}>★</span>)}
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FOR WHO ────────────────────────────────── */}
      <section className="px-8 md:px-12 py-24 max-w-6xl mx-auto">
        <Reveal>
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>Pour qui ?</p>
            <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--text-primary)' }}>ULTRA s'adapte à ton profil.</h2>
          </div>
        </Reveal>
        <div className="max-w-md mx-auto">
          {[
            { key: 'client',       title: 'Athlète & Client',  icon: '💪', desc: "Tu veux te transformer, perdre du poids, gagner en force ou améliorer tes performances. ULTRA te connecte aux meilleurs experts.", cta: 'Commencer en tant que client', color: 'var(--accent)' },
          ].map(({ key, title, icon, desc, cta, color }, i) => (
            <Reveal key={title} delay={i * 110} from="bottom">
              <TiltCard
                intensity={9}
                glowColor={color}
                className="p-8 rounded-2xl flex flex-col gap-5 h-full cursor-pointer"
                style={{
                  background: 'var(--bg-card)',
                  border: `2px solid ${profile === key ? color : 'var(--border)'}`,
                  boxShadow: profile === key ? `0 0 0 4px ${color}18` : 'none',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                  {icon}
                </div>
                <div>
                  <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
                <GlowButton
                  onClick={() => { setProfileAndSave(key); navigate(`/register?role=${key}`) }}
                  color={color}
                  className="mt-auto text-sm py-3 px-5 w-full"
                >
                  {cta} →
                </GlowButton>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────── */}
      <section id="faq" className="px-8 md:px-12 py-24" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>FAQ</p>
              <h2 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
                Les questions
                <span style={{ color: 'var(--accent)' }}> fréquentes.</span>
              </h2>
              <p className="mt-3 text-base" style={{ color: 'var(--text-secondary)' }}>
                Une autre question ? Écris-nous via le chat.
              </p>
            </div>
          </Reveal>
          <div className="space-y-2">
            {FAQS.map(({ q, a }, i) => (
              <Reveal key={i} delay={i * 70}>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left transition"
                    style={{ background: openFaq === i ? 'var(--bg-base)' : 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    <span className="font-semibold text-sm pr-4">{q}</span>
                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-transform duration-200"
                      style={{
                        background: openFaq === i ? 'var(--accent)' : 'var(--bg-hover)',
                        color: openFaq === i ? 'white' : 'var(--text-muted)',
                        transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)',
                      }}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5" style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border)' }}>
                      <p className="text-sm leading-relaxed pt-4" style={{ color: 'var(--text-secondary)' }}>{a}</p>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────── */}
      <section className="px-8 md:px-12 py-24">
        <Reveal from="scale">
          <div className="max-w-4xl mx-auto text-center p-14 md:p-20 rounded-3xl relative overflow-hidden"
            style={{ background: '#1a0a0d' }}>
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle at 30% 50%, #7d2d38 0%, transparent 50%), radial-gradient(circle at 80% 20%, #d4af37 0%, transparent 40%)',
              opacity: 0.15,
            }} />
            <div className="relative z-10">
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#d4af37' }}>Prêt ?</p>
              <h2 className="text-4xl md:text-5xl font-black mb-4 text-white leading-tight">
                Rejoins ULTRA.<br />
                <span style={{ opacity: 0.6 }}>Change ta trajectoire.</span>
              </h2>
              <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
                2 400 athlètes, coaches et nutritionnistes ont déjà transformé leur quotidien avec ULTRA.
              </p>
              <GlowButton
                onClick={() => navigate('/register')}
                color="#7d2d38"
                className="px-12 py-4 text-base mx-auto"
              >
                Rejoindre ULTRA gratuitement →
              </GlowButton>
              <div className="mt-12 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.10)',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[['2 400+', 'Membres actifs'], ['98%', 'Satisfaction'], ['3 profils', 'Client · Coach · Nutritionniste']].map(([v, l]) => (
                  <div key={l} style={{ textAlign: 'center', minWidth: 0 }}>
                    <p className="font-black text-white" style={{ fontSize: 'clamp(20px, 5vw, 28px)', whiteSpace: 'nowrap' }}>{v}</p>
                    <p className="mt-1" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'clamp(11px, 2.8vw, 14px)' }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer className="px-8 md:px-12 py-10 pb-36 md:pb-10" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-black tracking-[0.25em] text-lg" style={{ color: 'var(--text-primary)' }}>ULTRA</span>
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>© 2025 ULTRA · Coaching & Nutrition · Tous droits réservés</p>
          <div className="flex gap-6 text-sm flex-wrap justify-center" style={{ color: 'var(--text-muted)' }}>
            <a href="/legal/mentions-legales" className="hover:opacity-75 transition">Mentions légales</a>
            <a href="/legal/confidentialite" className="hover:opacity-75 transition">Confidentialité</a>
            <a href="/legal/cgu" className="hover:opacity-75 transition">CGU</a>
            <a href="/legal/cgv" className="hover:opacity-75 transition">CGV</a>
            <a href="/legal" className="hover:opacity-75 transition">Tout voir</a>
          </div>
        </div>
      </footer>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 24,
          zIndex: 9999,
          width: 44,
          height: 44,
          borderRadius: 14,
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: 20,
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(160,56,72,0.45)',
          opacity: showBackToTop ? 1 : 0,
          transform: showBackToTop ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.85)',
          pointerEvents: showBackToTop ? 'auto' : 'none',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}
        title="Retour en haut"
      >
        ↑
      </button>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        .marquee-track {
          animation: marquee 22s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
