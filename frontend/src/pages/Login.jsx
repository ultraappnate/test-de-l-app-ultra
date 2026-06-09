import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

// Couleurs fixes pour le panel gauche (toujours sombre, branding)
const L = {
  panelBg:   '#1a0a0d',
  panelBg2:  '#0f0507',
  border:    'rgba(255,255,255,0.08)',
  text:      '#ffffff',
  textMuted: 'rgba(255,255,255,0.45)',
  textFaint: 'rgba(255,255,255,0.25)',
  gold:      '#d4af37',
  accent:    '#7d2d38',
  inputBg:   'rgba(255,255,255,0.05)',
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useStore()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    const result = await login(formData.email, formData.password)
    if (result.success) navigate('/dashboard')
    else setError(result.error)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex">

      {/* Left — branding (toujours sombre) */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: L.panelBg }}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #7d2d38 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, #d4af37 0%, transparent 40%)`,
        }} />

        <div className="relative z-10 flex items-center gap-4">
          <span className="text-5xl font-black tracking-[0.3em]" style={{ color: L.text }}>ULTRA</span>
          <button onClick={() => navigate('/welcome')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
            ← Accueil
          </button>
        </div>

        <div className="relative z-10">
          <p className="text-sm font-bold tracking-[0.2em] uppercase mb-6" style={{ color: L.gold }}>
            Coaching & Nutrition
          </p>
          <h2 className="text-5xl font-black leading-tight mb-6" style={{ color: L.text }}>
            Transforme<br />ton corps.<br />
            <span style={{ color: L.accent }}>Dépasse</span><br />tes limites.
          </h2>
          <p className="text-lg leading-relaxed max-w-sm" style={{ color: L.textMuted }}>
            La plateforme premium réservée aux athlètes qui refusent la médiocrité.
          </p>
        </div>

        <div className="relative z-10 pl-5 mb-10" style={{ borderLeft: `2px solid ${L.accent}` }}>
          <p className="text-base italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)' }}>
            "En 3 mois avec ULTRA, j'ai perdu 12kg et battu mon record personnel au squat. Le suivi est incomparable."
          </p>
          <p className="text-sm font-semibold mt-3" style={{ color: L.gold }}>— Lucas M., 28 ans · Client depuis 2023</p>
        </div>

        <div className="relative z-10 flex gap-10 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          {[['2 400+', 'Athlètes actifs'], ['98%', 'Satisfaction'], ['150+', 'Programmes']].map(([v, l]) => (
            <div key={l}>
              <p className="text-3xl font-black" style={{ color: L.text }}>{v}</p>
              <p className="text-sm mt-1" style={{ color: L.textFaint }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form (suit le thème) */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-8"
        style={{ background: 'var(--bg-base)' }}
      >
        <div className="w-full max-w-md">

          <div className="lg:hidden mb-10 text-center">
            <span className="text-5xl font-black tracking-[0.3em]" style={{ color: 'var(--text-primary)' }}>ULTRA</span>
          </div>

          <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Bon retour.</h1>
          <p className="text-base mb-10" style={{ color: 'var(--text-secondary)' }}>
            Connecte-toi pour accéder à tes programmes.
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)', color: '#ff8a8a' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
                Email
              </label>
              <input
                type="email" name="email" required
                value={formData.email} onChange={handleChange}
                placeholder="ton@email.com"
                className="w-full text-base px-5 py-4 rounded-xl focus:outline-none transition"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                  Mot de passe
                </label>
                <a href="#" className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>Oublié ?</a>
              </div>
              <input
                type="password" name="password" required
                value={formData.password} onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full text-base px-5 py-4 rounded-xl focus:outline-none transition"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full text-white text-base font-bold py-4 rounded-xl transition-all duration-200 mt-2 disabled:opacity-40 tracking-wide"
              style={{ background: 'var(--accent)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Connexion...
                </span>
              ) : 'Se connecter'}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>ou</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Pas encore membre ?{' '}
            <a href="/register" className="font-semibold" style={{ color: 'var(--gold)' }}>Créer un compte</a>
          </p>

          <div className="mt-14 space-y-3">
            {[
              { icon: '⚡', title: 'Programmes sur mesure', desc: 'Adaptés à ton niveau et tes objectifs.' },
              { icon: '🎯', title: 'Suivi en temps réel', desc: 'Tes coaches te guident à chaque étape.' },
              { icon: '🏆', title: 'Communauté élite', desc: "Rejoins des milliers d'athlètes motivés." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-4 rounded-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
            © 2025 ULTRA · Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  )
}
