import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const STEPS = 4

const OBJECTIVES = [
  { id: 'weight_loss',   icon: '🔥', label: 'Perdre du poids',     desc: 'Brûler les graisses, retrouver la forme' },
  { id: 'muscle',        icon: '💪', label: 'Prise de masse',       desc: 'Gagner en muscle, prendre du volume' },
  { id: 'performance',   icon: '⚡', label: 'Performance sportive', desc: 'Améliorer mes résultats en compétition' },
  { id: 'health',        icon: '❤️', label: 'Santé & bien-être',    desc: 'Me sentir mieux dans mon corps' },
  { id: 'nutrition',     icon: '🥗', label: 'Rééquilibrage nutri.',  desc: 'Mieux manger sans frustration' },
  { id: 'endurance',     icon: '🏃', label: 'Endurance',            desc: 'Running, triathlon, cardio général' },
]

const LEVELS = [
  { id: 'beginner',      icon: '🌱', label: 'Débutant',     desc: 'Je commence tout juste' },
  { id: 'intermediate',  icon: '🌿', label: 'Intermédiaire', desc: 'Je pratique depuis 1-3 ans' },
  { id: 'advanced',      icon: '🌳', label: 'Avancé',        desc: 'Je pratique depuis 3+ ans' },
  { id: 'athlete',       icon: '🏆', label: 'Athlète',       desc: 'Je compète ou vise la haute performance' },
]

const PREFERENCES = [
  { id: 'in_person',     icon: '🏋', label: 'Présentiel',          desc: 'Je veux des séances en salle / à domicile' },
  { id: 'online',        icon: '💻', label: 'En ligne',             desc: 'Je préfère être suivi à distance' },
  { id: 'both',          icon: '🌍', label: 'Les deux',             desc: 'J\'aime avoir les deux options' },
]

const BUDGETS = [
  { id: 'low',    label: '< 50€/séance',   range: [0, 50] },
  { id: 'mid',    label: '50–100€/séance',  range: [50, 100] },
  { id: 'high',   label: '100€+/séance',   range: [100, 200] },
  { id: 'open',   label: 'Peu importe',    range: [0, 200] },
]

const NEEDS = [
  { id: 'coach',          icon: '🎓', label: 'Un coach sportif',     desc: 'Programme entraînement + suivi' },
  { id: 'nutritionist',   icon: '🥗', label: 'Un nutritionniste',    desc: 'Plan alimentaire + bilans' },
  { id: 'both',           icon: '⚡', label: 'Les deux',             desc: 'Coaching sport + nutrition combinés' },
]

function StepIndicator({ current }) {
  const labels = ['Objectif', 'Profil', 'Préférences', 'Résumé']
  return (
    <div className="flex items-center gap-0 mb-10">
      {labels.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300"
                style={{
                  background: done ? '#27ae60' : active ? 'var(--accent)' : 'var(--bg-card)',
                  color: done || active ? '#fff' : 'var(--text-faint)',
                  border: `2px solid ${done ? '#27ae60' : active ? 'var(--accent)' : 'var(--border)'}`,
                  transform: active ? 'scale(1.1)' : 'scale(1)',
                }}>
                {done ? '✓' : i + 1}
              </div>
              <span className="text-[9px] mt-1 font-bold"
                style={{ color: active ? 'var(--accent)' : done ? '#27ae60' : 'var(--text-faint)' }}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className="h-0.5 w-16 mx-1 mb-4 transition-all duration-500"
                style={{ background: done ? '#27ae60' : 'var(--border)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function OptionGrid({ options, value, onChange, cols = 2 }) {
  return (
    <div className={`grid grid-cols-${cols} gap-3`}>
      {options.map(opt => {
        const active = Array.isArray(value) ? value.includes(opt.id) : value === opt.id
        return (
          <button key={opt.id} onClick={() => onChange(opt.id)}
            className="p-4 rounded-2xl text-left transition-all duration-200"
            style={{
              background: active ? 'var(--accent-subtle)' : 'var(--bg-card)',
              border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              transform: active ? 'scale(1.02)' : 'scale(1)',
            }}>
            <div className="text-2xl mb-2">{opt.icon}</div>
            <p className="text-sm font-black" style={{ color: active ? 'var(--accent)' : 'var(--text-primary)' }}>{opt.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{opt.desc}</p>
          </button>
        )
      })}
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { updateProfile, user } = useStore()

  const [step, setStep]   = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm]   = useState({
    objective: '', level: '', preference: '', budget: 'open',
    need: 'coach', city: '',
  })

  const set = (key, val) => setForm(f => ({...f, [key]: val}))

  const canNext = () => {
    if (step === 0) return !!form.objective
    if (step === 1) return !!form.level
    if (step === 2) return !!form.preference
    return true
  }

  const handleNext = async () => {
    if (step < STEPS - 1) { setStep(s => s + 1); return }
    // Final step — save + redirect
    setSaving(true)
    await updateProfile({ onboardingDone: true, ...form })
    setSaving(false)
    navigate('/discover')
  }

  const stepContent = [
    // Step 0 — Objectif
    <div key="0">
      <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>Quel est ton objectif principal ?</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>On va t'aider à trouver l'expert parfait pour toi.</p>
      <OptionGrid options={OBJECTIVES} value={form.objective} onChange={v => set('objective', v)} cols={2} />
    </div>,

    // Step 1 — Niveau + besoin
    <div key="1">
      <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>Ton niveau & ton besoin</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Sois honnête — on s'adapte à chaque profil.</p>
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>Niveau</p>
      <OptionGrid options={LEVELS} value={form.level} onChange={v => set('level', v)} cols={2} />
      <p className="text-xs font-bold uppercase tracking-widest mt-5 mb-3" style={{ color: 'var(--text-faint)' }}>Tu cherches…</p>
      <OptionGrid options={NEEDS} value={form.need} onChange={v => set('need', v)} cols={3} />
    </div>,

    // Step 2 — Préférences
    <div key="2">
      <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>Comment veux-tu être suivi ?</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Présentiel, en ligne, ou les deux ?</p>
      <OptionGrid options={PREFERENCES} value={form.preference} onChange={v => set('preference', v)} cols={3} />

      <p className="text-xs font-bold uppercase tracking-widest mt-5 mb-3" style={{ color: 'var(--text-faint)' }}>Budget par séance</p>
      <div className="grid grid-cols-4 gap-2">
        {BUDGETS.map(b => (
          <button key={b.id} onClick={() => set('budget', b.id)}
            className="py-3 px-2 rounded-xl text-xs font-bold text-center transition-all"
            style={{
              background: form.budget === b.id ? 'var(--accent-subtle)' : 'var(--bg-card)',
              color: form.budget === b.id ? 'var(--accent)' : 'var(--text-secondary)',
              border: `2px solid ${form.budget === b.id ? 'var(--accent)' : 'var(--border)'}`,
            }}>
            {b.label}
          </button>
        ))}
      </div>

      <p className="text-xs font-bold uppercase tracking-widest mt-5 mb-2" style={{ color: 'var(--text-faint)' }}>Ta ville (optionnel)</p>
      <input
        value={form.city}
        onChange={e => set('city', e.target.value)}
        placeholder="Paris, Lyon, Bordeaux…"
        className="w-full px-4 py-3 rounded-xl text-sm"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
      />
    </div>,

    // Step 3 — Résumé + CTA
    <div key="3">
      <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
        Parfait, {user?.name?.split(' ')[0] || 'toi'} ! 🎉
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Voici ce qu'on a retenu pour te proposer les meilleurs experts.
      </p>

      <div className="space-y-3 mb-6">
        {[
          ['🎯 Objectif',   OBJECTIVES.find(o => o.id === form.objective)?.label || '—'],
          ['📊 Niveau',     LEVELS.find(l => l.id === form.level)?.label || '—'],
          ['🔍 Je cherche', NEEDS.find(n => n.id === form.need)?.label || '—'],
          ['🌍 Format',     PREFERENCES.find(p => p.id === form.preference)?.label || '—'],
          ['💶 Budget',     BUDGETS.find(b => b.id === form.budget)?.label || '—'],
          ...(form.city ? [['📍 Ville', form.city]] : []),
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{value}</span>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl flex items-start gap-3"
        style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)' }}>
        <span className="text-xl">🗺</span>
        <div>
          <p className="text-sm font-black" style={{ color: '#27ae60' }}>On a trouvé des experts pour toi !</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Explore la carte et contacte directement les coaches et nutritionnistes disponibles près de toi.
          </p>
        </div>
      </div>
    </div>,
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      {/* Bg glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 0%, var(--accent-subtle) 0%, transparent 60%)' }} />

      <div className="w-full max-w-xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-black tracking-[0.2em] text-3xl" style={{ color: 'var(--text-primary)' }}>ULTRA</span>
          <p className="text-xs mt-1 font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>
            Configuration de ton profil
          </p>
        </div>

        <div className="p-8 rounded-3xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <StepIndicator current={step} />

          <div key={step} style={{ animation: 'fadeSlideIn 0.3s ease' }}>
            {stepContent[step]}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="px-6 py-3 rounded-2xl text-sm font-bold transition-all hover:opacity-70"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                ← Retour
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canNext() || saving}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all"
              style={{
                background: canNext() && !saving ? 'var(--accent)' : 'var(--border)',
                transform: canNext() ? 'scale(1)' : 'scale(0.98)',
                boxShadow: canNext() ? '0 4px 20px var(--accent)44' : 'none',
              }}>
              {saving ? '⏳ Enregistrement…' : step === STEPS - 1 ? '🗺 Explorer les experts →' : 'Continuer →'}
            </button>
          </div>

          {/* Skip */}
          {step < STEPS - 1 && (
            <button onClick={() => navigate('/discover')}
              className="w-full mt-3 text-xs font-medium transition hover:opacity-70"
              style={{ color: 'var(--text-faint)' }}>
              Passer cette étape
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  )
}
