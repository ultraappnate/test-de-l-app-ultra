import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { ROLE_DATA } from '../data/registerContent'

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register } = useStore()
  const initialRole = ['client','coach','nutritionist','health_pro'].includes(searchParams.get('role')) ? searchParams.get('role') : localStorage.getItem('ultra-profile') || 'client'
  const [formData, setFormData] = useState({ email: '', password: '', name: '', role: initialRole })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Pick random content per role change — memo keyed on role
  const randomContent = useMemo(() => {
    const data = ROLE_DATA[formData.role]
    return {
      headline: pick(data.headlines),
      sub: pick(data.subs),
      testimonial: pick(data.testimonials),
      features: pick(data.features),
    }
  }, [formData.role])

  const data = ROLE_DATA[formData.role]

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    const extra = formData.role === 'health_pro'
      ? { profession: formData.profession || 'Kinésithérapeute', rpps: formData.rpps || '' }
      : {}
    const result = await register(formData.email, formData.password, formData.name, formData.role, extra)
    if (result.success) {
      navigate(formData.role === 'client' ? '/onboarding' : '/dashboard')
    } else {
      setError(result.error)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a0a0d] flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #7d2d38 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #d4af37 0%, transparent 40%)`,
          }}
        />

        <div className="relative z-10 flex items-center gap-4">
          <span className="text-white text-5xl font-black tracking-[0.3em]">ULTRA</span>
          <button onClick={() => navigate('/welcome')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
            ← Accueil
          </button>
        </div>

        <div className="relative z-10">
          <p className="text-[#d4af37] text-xl font-bold tracking-[0.2em] uppercase mb-6 transition-all duration-300">
            {data.tagline}
          </p>
          <h2 className="text-white text-5xl font-black leading-tight mb-6">
            {randomContent.headline.lines.map((line, i) =>
              line.startsWith(randomContent.headline.accent) ? (
                <span key={i}><span className="text-[#7d2d38]">{line}</span><br /></span>
              ) : (
                <span key={i}>{line}<br /></span>
              )
            )}
          </h2>
          <p className="text-white/40 text-lg leading-relaxed max-w-sm transition-all duration-300">
            {randomContent.sub}
          </p>
        </div>

        <div className="relative z-10 border-l-2 border-[#7d2d38] pl-5 mb-10">
          <p className="text-white/70 text-base italic leading-relaxed">
            "{randomContent.testimonial.text}"
          </p>
          <p className="text-[#d4af37] text-sm font-semibold mt-3">{randomContent.testimonial.author}</p>
        </div>

        <div className="relative z-10 flex gap-10 pt-8 border-t border-white/10">
          <div>
            <p className="text-white text-3xl font-black">2 400+</p>
            <p className="text-white/40 text-sm mt-1">Athlètes actifs</p>
          </div>
          <div>
            <p className="text-white text-3xl font-black">98%</p>
            <p className="text-white/40 text-sm mt-1">Satisfaction</p>
          </div>
          <div>
            <p className="text-white text-3xl font-black">150+</p>
            <p className="text-white/40 text-sm mt-1">Programmes</p>
          </div>
        </div>
      </div>

      {/* Right panel — suit le thème */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
        <div className="w-full max-w-md py-10">

          <div className="lg:hidden mb-8">
            <button onClick={() => navigate('/welcome')}
              className="flex items-center gap-1.5 text-sm font-bold mb-6 transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}>
              ← Accueil
            </button>
            <div className="text-center">
              <span className="text-4xl font-black tracking-[0.3em]" style={{ color: 'var(--text-primary)' }}>ULTRA</span>
            </div>
          </div>

          <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Crée ton compte.</h1>
          <p className="text-base mb-10" style={{ color: 'var(--text-secondary)' }}>{data.subtitle}</p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)', color: '#ff8a8a' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: 'Nom complet', name: 'name', type: 'text', placeholder: 'Ton nom' },
              { label: 'Email', name: 'email', type: 'email', placeholder: 'ton@email.com' },
              { label: 'Mot de passe', name: 'password', type: 'password', placeholder: '••••••••••••' },
            ].map(({ label, name, type, placeholder }) => (
              <div key={name}>
                <label className="block text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </label>
                <input
                  type={type} name={name} required
                  value={formData[name]} onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full text-base px-5 py-4 rounded-xl focus:outline-none transition"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
                {data.roleLabel}
              </label>
              <div className="relative">
                <select
                  name="role" value={formData.role} onChange={handleChange}
                  className="w-full text-base px-5 py-4 rounded-xl focus:outline-none transition appearance-none cursor-pointer pr-12"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="client">Athlète / Client</option>
                  <option value="coach">Coach</option>
                  <option value="nutritionist">Nutritionniste</option>
                  <option value="health_pro">Professionnel de santé</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col gap-0.5">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}/>
                  </svg>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}/>
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                ↑ Clique pour choisir ton profil
              </p>
            </div>

            {/* Champs spécifiques Professionnel de santé */}
            {formData.role === 'health_pro' && (
              <>
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
                    Profession
                  </label>
                  <div className="relative">
                    <select name="profession" value={formData.profession || 'Kinésithérapeute'} onChange={handleChange}
                      className="w-full text-base px-5 py-4 rounded-xl focus:outline-none transition appearance-none cursor-pointer pr-12"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                      {['Kinésithérapeute','Ostéopathe','Médecin du sport','Podologue','Préparateur physique','Psychologue du sport'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
                    N° RPPS / ADELI <span style={{ textTransform: 'none', fontWeight: 400 }}>(gage de confiance)</span>
                  </label>
                  <input type="text" name="rpps" value={formData.rpps || ''} onChange={handleChange}
                    placeholder="Ex : 10100456789"
                    className="w-full text-base px-5 py-4 rounded-xl focus:outline-none transition"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                  <p className="mt-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                    🛡️ Vérifié par notre équipe — affiché sur ton profil public
                  </p>
                </div>
              </>
            )}

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
                  Création...
                </span>
              ) : data.cta}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>ou</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Déjà membre ?{' '}
            <a href="/login" className="font-semibold" style={{ color: 'var(--gold)' }}>Se connecter</a>
          </p>

          <div className="mt-14 space-y-3">
            {randomContent.features.map(({ icon, title, desc }) => (
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
