import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import MuscleMap from '../components/MuscleMap'
import PremiumPaywall from '../components/PremiumPaywall'

const LEVEL_COLORS = {
  'Débutant':      { bg: 'rgba(39,174,96,0.15)',   text: '#27ae60', border: 'rgba(39,174,96,0.4)' },
  'Intermédiaire': { bg: 'rgba(232,160,32,0.15)',  text: '#e8a020', border: 'rgba(232,160,32,0.4)' },
  'Avancé':        { bg: 'rgba(160,56,72,0.15)',   text: '#a03848', border: 'rgba(160,56,72,0.4)' },
  'Tous niveaux':  { bg: 'rgba(107,114,128,0.15)', text: '#6b7280', border: 'rgba(107,114,128,0.4)' },
}

const CAT_GRADIENTS = {
  Force:     'linear-gradient(135deg, #1a0a0f 0%, #3d0d1a 50%, #6b1a2e 100%)',
  Nutrition: 'linear-gradient(135deg, #0a1a0a 0%, #0d3d18 50%, #1a6b2e 100%)',
  Combiné:   'linear-gradient(135deg, #0a0a1a 0%, #0d1a3d 50%, #1a2e6b 100%)',
  Cardio:    'linear-gradient(135deg, #1a0a0a 0%, #3d1a0d 50%, #6b2e1a 100%)',
  Mobilité:  'linear-gradient(135deg, #0a1a1a 0%, #0d3d3d 50%, #1a6b6b 100%)',
}

const CAT_ICONS = { Force: '🏋️', Nutrition: '🥗', Combiné: '⚡', Cardio: '🏃', Mobilité: '🧘' }

function StatPill({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-full"
      style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
      <span className="text-sm">{icon}</span>
      <div>
        <p className="text-[11px] leading-none mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</p>
        <p className="text-xs font-black leading-none" style={{ color: '#fff' }}>{value}</p>
      </div>
    </div>
  )
}

function WeekCard({ week, index, onExercise }) {
  const [open, setOpen] = useState(index === 0)
  const days = week.days || []
  const blockCount = days.reduce((s, d) => s + (d.blocks?.length || 0), 0)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
            style={{ background: 'var(--accent)' }}>
            {index + 1}
          </div>
          <div>
            <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
              {week.title || `Semaine ${index + 1}`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
              {days.length} jour{days.length !== 1 ? 's' : ''} · {blockCount} exercice{blockCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <span className="text-xs transition-transform duration-200"
          style={{ color: 'var(--text-faint)', transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>
          ▾
        </span>
      </button>
      {open && days.length > 0 && (
        <div className="px-5 pb-4 space-y-2">
          {days.map((day, di) => (
            <div key={di} className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                J{di + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {day.name || `Jour ${di + 1}`}
                </p>
                {day.blocks?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {day.blocks.slice(0, 6).map((b, bi) => {
                      const exName = b.exercise || b.name || `Ex. ${bi + 1}`
                      return (
                        <button key={bi} onClick={() => onExercise?.(exName)}
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                          {exName} <span style={{ opacity: 0.5 }}>🦾</span>
                        </button>
                      )
                    })}
                    {day.blocks.length > 6 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: 'var(--text-faint)' }}>
                        +{day.blocks.length - 6}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProgramDetail() {
  const { id, programId } = useParams()
  const resolvedId = id || programId
  const navigate = useNavigate()
  const { programs, fetchPrograms, user } = useStore()
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [muscleEx, setMuscleEx] = useState(null)
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const { enrollProgram, fetchMyEnrollments } = useStore()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let list = programs
      if (!list?.length) list = await fetchPrograms()
      const found = (list || []).find(p => String(p.id) === String(resolvedId))
      setProgram(found || null)
      setLoading(false)
      // Vérifie si déjà inscrit
      const enrollments = await fetchMyEnrollments()
      if (enrollments.some(e => String(e.id) === String(resolvedId))) setEnrolled(true)
    }
    load()
  }, [resolvedId])

  const handleStart = async () => {
    if (enrolled) { navigate('/dashboard'); return }
    setEnrolling(true)
    const res = await enrollProgram(resolvedId)
    setEnrolling(false)
    if (res.success) {
      setEnrolled(true)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
    } else if (res.error === 'premium_required') {
      setShowPaywall(true)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 animate-spin mx-auto"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Chargement…</p>
      </div>
    </div>
  )

  if (!program) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: 'var(--bg-base)' }}>
      <div className="text-6xl">😕</div>
      <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Programme introuvable</h1>
      <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: 'var(--accent)' }}>
        Retour
      </button>
    </div>
  )

  const lvlStyle = LEVEL_COLORS[program.level] || LEVEL_COLORS['Tous niveaux']
  const gradient = program.gradient || CAT_GRADIENTS[program.category] || CAT_GRADIENTS.Force
  const icon = CAT_ICONS[program.category] || '💪'
  const weeks = program.sections || program.weeks || []
  const sessionCount = weeks.reduce((s, w) => s + (w.days?.length || 0), 0) || program.sessions || '—'
  const isCoach = user?.role === 'coach'
  const isPremiumRequired = program.source === 'admin' && program.price > 0 && !user?.isPremium

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {showPaywall && (
        <PremiumPaywall
          onClose={() => setShowPaywall(false)}
          onSuccess={() => { setShowPaywall(false); handleStart() }}
        />
      )}

      {/* ── Toast succès ── */}
      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl shadow-xl"
          style={{ background: '#27ae60', color: '#fff', animation: 'fadeUp 0.3s ease' }}>
          ✓ <span className="font-bold text-sm">Programme démarré ! Bonne séance 💪</span>
        </div>
      )}

      {/* ── Hero cinématique ── */}
      <div className="relative overflow-hidden" style={{ background: gradient, minHeight: 420 }}>
        {/* Grain */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '300px',
        }} />
        {/* Radial glow */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 25% 40%, rgba(255,255,255,0.06) 0%, transparent 65%)' }} />
        {/* Bottom fade — très subtil, n'atteint pas les stats */}
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.18))' }} />

        {/* Nav */}
        <div className="relative z-10 flex items-center justify-between px-8 pt-8">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            ← Retour
          </button>
          {isCoach && (
            <button onClick={() => navigate(`/coach/programs/${resolvedId}/edit`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
              ✎ Modifier
            </button>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 px-8 pt-8 pb-10">
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {icon} {program.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-black"
              style={{ background: lvlStyle.bg, color: lvlStyle.text, border: `1px solid ${lvlStyle.border}` }}>
              {program.level}
            </span>
            {program.price === 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-black"
                style={{ background: 'rgba(39,174,96,0.2)', color: '#4ade80', border: '1px solid rgba(39,174,96,0.4)' }}>
                Gratuit
              </span>
            )}
          </div>

          <h1 className="text-5xl font-black tracking-tight mb-4 max-w-2xl"
            style={{ color: '#fff', textShadow: '0 2px 24px rgba(0,0,0,0.5)', lineHeight: 1.1 }}>
            {program.title}
          </h1>

          {program.description && (
            <p className="text-base max-w-xl leading-relaxed mb-8"
              style={{ color: 'rgba(255,255,255,0.65)' }}>
              {program.description}
            </p>
          )}

        </div>
      </div>

      {/* ── Stat pills — hors du hero, fond propre ── */}
      <div className="max-w-3xl mx-auto px-6 pt-6 pb-2">
        <div className="flex flex-wrap gap-3">
          {program.duration && <StatPill icon="⏱" label="Durée" value={program.duration} />}
          <StatPill icon="📅" label="Séances" value={`${sessionCount}`} />
          {weeks.length > 0 && <StatPill icon="📋" label="Semaines" value={`${weeks.length}`} />}
          {(program.enrollmentCount || 0) > 0 && <StatPill icon="👥" label="Inscrits" value={program.enrollmentCount} />}
          <StatPill icon="💰" label="Prix" value={program.price === 0 ? 'Gratuit' : `${program.price}€`} />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-3xl mx-auto px-6 pb-24 mt-4">

        {/* CTA */}
        {!isCoach && (
          <div className="mb-8 p-6 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: `1px solid ${isPremiumRequired ? 'rgba(212,175,55,0.4)' : 'var(--border)'}` }}>
            {isPremiumRequired && (
              <div className="flex items-center gap-2 justify-center mb-3 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(212,175,55,0.1)' }}>
                <span style={{ color: 'var(--gold)' }}>★</span>
                <p className="text-xs font-black" style={{ color: 'var(--gold)' }}>
                  Ce programme est réservé aux membres Premium
                </p>
              </div>
            )}
            <p className="text-sm mb-4 text-center" style={{ color: 'var(--text-secondary)' }}>
              {enrolled ? '🎉 Tu suis déjà ce programme — continue comme ça !' : 'Prêt à transformer ta forme ? Lance-toi dès maintenant.'}
            </p>
            <button onClick={handleStart} disabled={enrolling}
              className="w-full py-4 rounded-xl text-base font-black text-white transition-all duration-200"
              style={{ background: enrolled ? '#27ae60' : isPremiumRequired ? 'linear-gradient(135deg, #b8960c, #d4af37)' : 'var(--accent)', opacity: enrolling ? 0.7 : 1 }}
              onMouseEnter={e => { if (!enrolling) e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { if (!enrolling) e.currentTarget.style.opacity = '1' }}>
              {enrolling
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                    Démarrage…
                  </span>
                : enrolled ? '▶ Continuer le programme'
                : isPremiumRequired ? '★ Passer Premium pour accéder'
                : '🚀 Commencer maintenant'}
            </button>
            {!enrolled && program.price > 0 && !isPremiumRequired && (
              <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-faint)' }}>
                Accès complet · Satisfait ou remboursé
              </p>
            )}
            {isPremiumRequired && (
              <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-faint)' }}>
                Premium à 9,99 €/mois · Accès à tous les programmes Admin
              </p>
            )}
          </div>
        )}

        {/* Semaines */}
        {weeks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-black mb-4" style={{ color: 'var(--text-primary)' }}>
              Programme semaine par semaine
            </h2>
            <div className="space-y-3">
              {weeks.map((w, i) => <WeekCard key={i} week={w} index={i} onExercise={setMuscleEx} />)}
            </div>
          </div>
        )}

        {/* Infos */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { icon: '🎯', label: 'Niveau', value: program.level || 'Tous niveaux' },
            { icon: '📂', label: 'Catégorie', value: program.category || '—' },
            { icon: '⏱', label: 'Durée totale', value: program.duration || '—' },
            { icon: '🔁', label: 'Semaines', value: weeks.length > 0 ? `${weeks.length} semaines` : '—' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{label}</p>
                <p className="text-sm font-black mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Coach panel */}
        {isCoach && (
          <div className="p-5 rounded-2xl flex items-center justify-between"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)' }}>
            <div>
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Mode coach</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                {program.enrollmentCount || 0} client{(program.enrollmentCount || 0) !== 1 ? 's' : ''} inscrit{(program.enrollmentCount || 0) !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={() => navigate(`/coach/programs/${resolvedId}/edit`)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              ✎ Modifier
            </button>
          </div>
        )}
      </div>

      {/* ── Modal Muscles ── */}
      {muscleEx && (
        <div onClick={() => setMuscleEx(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            animation: 'fadeIn 0.2s ease' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setMuscleEx(null)}
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, width: 32, height: 32,
                borderRadius: 10, background: 'var(--bg-base)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', cursor: 'pointer', fontSize: 16, fontWeight: 800 }}>
              ✕
            </button>
            <MuscleMap exercise={muscleEx} />
          </div>
        </div>
      )}
    </div>
  )
}
