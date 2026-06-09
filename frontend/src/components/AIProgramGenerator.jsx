import { useState } from 'react'
import { useStore } from '../store'

const LEVELS    = ['Débutant', 'Intermédiaire', 'Avancé']
const GOALS     = ['Prise de masse', 'Sèche / Perte de poids', 'Force & Performance', 'Endurance', 'Mobilité & Récupération', 'Remise en forme générale']
const EQUIPMENT = ['Salle complète', 'Haltères seulement', 'Barres & haltères', 'Poids de corps (maison)', 'Accès limité']
const FOCUS     = ['Haut du corps', 'Bas du corps', 'Full body', 'Push/Pull/Legs', 'Cardio', 'Core & Gainage']

export default function AIProgramGenerator({ onGenerated, onClose }) {
  const { aiGenerateProgram } = useStore()

  const [params, setParams] = useState({
    goal: GOALS[0], level: LEVELS[0], daysPerWeek: 4,
    equipment: EQUIPMENT[0], duration: 8,
    focusAreas: ['Full body'], includeNutrition: false,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [step,    setStep]    = useState(0) // 0=form, 1=generating, 2=done

  const toggleFocus = f => setParams(p => ({
    ...p,
    focusAreas: p.focusAreas.includes(f)
      ? p.focusAreas.filter(x => x !== f)
      : [...p.focusAreas, f],
  }))

  const generate = async () => {
    setLoading(true); setStep(1); setError('')
    const res = await aiGenerateProgram(params)
    if (res?.success && res.program) {
      setStep(2)
      onGenerated(res.program)
    } else {
      setError(res?.error || 'Erreur lors de la génération')
      setStep(0)
    }
    setLoading(false)
  }

  const S = ({ label, children }) => (
    <div className="mb-5">
      <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {children}
    </div>
  )

  if (step === 1) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="rounded-3xl p-10 flex flex-col items-center gap-5 text-center max-w-sm mx-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: 'linear-gradient(135deg, var(--accent), #c42840)', boxShadow: '0 8px 32px rgba(160,56,72,0.4)' }}>
          ✦
        </div>
        <div>
          <p className="font-black text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Génération en cours…</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Claude analyse tes paramètres et crée ton programme personnalisé</p>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: 'var(--accent)', animationDelay: `${i * 120}ms` }}/>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="px-6 py-5 flex items-center gap-3" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: 'linear-gradient(135deg, var(--accent), #c42840)' }}>✦</div>
          <div className="flex-1">
            <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Générateur IA de programme</p>
            <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Propulsé par Claude · Anthropic</p>
          </div>
          <button onClick={onClose} className="text-sm" style={{ color: 'var(--text-faint)' }}>✕</button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
              {error}
            </div>
          )}

          <S label="Objectif principal">
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => (
                <button key={g} onClick={() => setParams(p => ({...p, goal: g}))}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  style={{ background: params.goal === g ? 'var(--accent)' : 'var(--bg-card)', color: params.goal === g ? '#fff' : 'var(--text-muted)', border: `1px solid ${params.goal === g ? 'var(--accent)' : 'var(--border)'}` }}>
                  {g}
                </button>
              ))}
            </div>
          </S>

          <S label="Niveau">
            <div className="flex gap-2">
              {LEVELS.map(l => (
                <button key={l} onClick={() => setParams(p => ({...p, level: l}))}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition"
                  style={{ background: params.level === l ? 'var(--accent)' : 'var(--bg-card)', color: params.level === l ? '#fff' : 'var(--text-muted)', border: `1px solid ${params.level === l ? 'var(--accent)' : 'var(--border)'}` }}>
                  {l}
                </button>
              ))}
            </div>
          </S>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Jours / semaine</p>
              <div className="flex gap-1">
                {[2,3,4,5,6].map(d => (
                  <button key={d} onClick={() => setParams(p => ({...p, daysPerWeek: d}))}
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition"
                    style={{ background: params.daysPerWeek === d ? 'var(--accent)' : 'var(--bg-card)', color: params.daysPerWeek === d ? '#fff' : 'var(--text-muted)', border: `1px solid ${params.daysPerWeek === d ? 'var(--accent)' : 'var(--border)'}` }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Durée (semaines)</p>
              <div className="flex gap-1">
                {[4,6,8,12].map(d => (
                  <button key={d} onClick={() => setParams(p => ({...p, duration: d}))}
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition"
                    style={{ background: params.duration === d ? 'var(--accent)' : 'var(--bg-card)', color: params.duration === d ? '#fff' : 'var(--text-muted)', border: `1px solid ${params.duration === d ? 'var(--accent)' : 'var(--border)'}` }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <S label="Équipement disponible">
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map(e => (
                <button key={e} onClick={() => setParams(p => ({...p, equipment: e}))}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  style={{ background: params.equipment === e ? 'var(--accent)' : 'var(--bg-card)', color: params.equipment === e ? '#fff' : 'var(--text-muted)', border: `1px solid ${params.equipment === e ? 'var(--accent)' : 'var(--border)'}` }}>
                  {e}
                </button>
              ))}
            </div>
          </S>

          <S label="Focus (multi-sélection)">
            <div className="flex flex-wrap gap-2">
              {FOCUS.map(f => (
                <button key={f} onClick={() => toggleFocus(f)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  style={{ background: params.focusAreas.includes(f) ? '#3a52a8' : 'var(--bg-card)', color: params.focusAreas.includes(f) ? '#fff' : 'var(--text-muted)', border: `1px solid ${params.focusAreas.includes(f) ? '#3a52a8' : 'var(--border)'}` }}>
                  {params.focusAreas.includes(f) && '✓ '}{f}
                </button>
              ))}
            </div>
          </S>

          <div className="flex items-center gap-3 p-4 rounded-xl mb-2"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Inclure plan nutrition</p>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Ajouter des jours nutrition au programme</p>
            </div>
            <button onClick={() => setParams(p => ({...p, includeNutrition: !p.includeNutrition}))}
              className="w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
              style={{ background: params.includeNutrition ? 'var(--accent)' : 'var(--border)' }}>
              <div className="w-4 h-4 rounded-full bg-white transition-all duration-200 mx-1"
                style={{ transform: params.includeNutrition ? 'translateX(20px)' : 'translateX(0)' }}/>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <button onClick={generate} disabled={loading}
            className="w-full py-3.5 rounded-xl font-black text-sm text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #c42840 100%)', boxShadow: '0 4px 20px rgba(160,56,72,0.35)' }}>
            <span>✦</span>
            Générer mon programme avec l'IA
          </button>
        </div>
      </div>
    </div>
  )
}
