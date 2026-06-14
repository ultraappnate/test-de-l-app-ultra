import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import PremiumPaywall from '../components/PremiumPaywall'

const ICONS = { Force: '🏋️', Nutrition: '🥗', Combiné: '⚡', Cardio: '🏃', Mobilité: '🧘' }

export default function CoachProfile() {
  const { coachId } = useParams()
  const navigate = useNavigate()
  const { fetchCoachPublic, enrollProgram, fetchMyEnrollments, user } = useStore()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [myEnrollments, setMyEnrollments] = useState([])
  const [enrolling, setEnrolling] = useState(null)
  const [toast, setToast] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallTarget, setPaywallTarget] = useState(null)

  useEffect(() => {
    const init = async () => {
      const [coachData, enrollments] = await Promise.all([
        fetchCoachPublic(coachId),
        fetchMyEnrollments(),
      ])
      setData(coachData)
      setMyEnrollments(enrollments.map(e => e.id))
      setLoading(false)
    }
    init()
  }, [coachId])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const handleEnroll = async (program) => {
    if (enrolling) return
    setEnrolling(program.id)
    const res = await enrollProgram(program.id)
    setEnrolling(null)

    if (res.success) {
      setMyEnrollments(prev => [...prev, program.id])
      showToast(`✓ Inscrit à « ${program.title} »`)
    } else if (res.error === 'premium_required') {
      setPaywallTarget(program)
      setShowPaywall(true)
    } else {
      showToast('✗ Erreur lors de l\'inscription')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-faint)' }}>Chargement…</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>Coach introuvable</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'var(--accent)', color: '#fff' }}>← Retour</button>
        </div>
      </div>
    )
  }

  const { coach, programs } = data
  const initials = coach.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast[0] === '✓' ? 'var(--accent)' : '#ef4444', color: '#fff', padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 13 }}>
          {toast}
        </div>
      )}

      {showPaywall && (
        <PremiumPaywall
          onClose={() => setShowPaywall(false)}
          onSuccess={async () => {
            setShowPaywall(false)
            showToast('★ Premium activé !')
            if (paywallTarget) await handleEnroll(paywallTarget)
          }}
        />
      )}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(16px,4vw,32px)' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold mb-6"
          style={{ color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: 18 }}>←</span> Retour
        </button>

        {/* Header coach */}
        <div className="p-5 rounded-2xl mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
              style={{ background: 'var(--accent)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{coach.name}</h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  🎓 Coach certifié
                </span>
              </div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>{coach.email}</p>
              {coach.specialties?.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {coach.specialties.map(s => (
                    <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => navigate('/chat')}
              className="px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              💬 Message
            </button>
          </div>

          {coach.bio && (
            <p className="mt-4 text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              {coach.bio}
            </p>
          )}
        </div>

        {/* Programmes du coach */}
        <div>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--text-faint)' }}>
            Programmes de {coach.name.split(' ')[0]}
          </p>

          {programs.length === 0 ? (
            <div className="p-8 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
              <p className="text-3xl mb-2">📭</p>
              <p className="font-bold text-sm" style={{ color: 'var(--text-faint)' }}>Aucun programme pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map(prog => {
                const enrolled = myEnrollments.includes(prog.id)
                const isLoading = enrolling === prog.id
                return (
                  <div key={prog.id} className="p-4 rounded-2xl"
                    style={{ background: 'var(--bg-card)', border: `1px solid ${enrolled ? 'var(--accent)' : 'var(--border)'}` }}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 overflow-hidden"
                        style={{ background: prog.gradient || 'var(--bg-base)' }}>
                        {prog.coverImage
                          ? <img src={prog.coverImage} className="w-full h-full object-cover" alt="" />
                          : ICONS[prog.category] || '💪'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{prog.title}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                              {prog.category} · {prog.duration} · {prog.level}
                            </p>
                          </div>
                          <p className="text-base font-black flex-shrink-0"
                            style={{ color: prog.price === 0 ? '#27ae60' : 'var(--text-primary)' }}>
                            {prog.price === 0 ? 'Gratuit' : `${prog.price} €`}
                          </p>
                        </div>
                        {prog.description && (
                          <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                            {prog.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 flex items-center justify-between"
                      style={{ borderTop: '1px solid var(--border)' }}>
                      <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                        {prog.enrollmentCount || 0} inscrits · {prog.sessions || '—'}
                      </p>
                      {enrolled ? (
                        <span className="text-xs font-black px-3 py-1.5 rounded-xl"
                          style={{ background: 'rgba(39,174,96,0.15)', color: '#27ae60' }}>
                          ✓ Inscrit
                        </span>
                      ) : (
                        <button onClick={() => handleEnroll(prog)} disabled={isLoading}
                          className="text-xs font-black px-4 py-1.5 rounded-xl text-white"
                          style={{ background: prog.price === 0 ? '#27ae60' : 'var(--accent)', opacity: isLoading ? 0.6 : 1 }}>
                          {isLoading ? '…' : prog.price === 0 ? '+ Rejoindre' : `Acheter — ${prog.price} €`}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
