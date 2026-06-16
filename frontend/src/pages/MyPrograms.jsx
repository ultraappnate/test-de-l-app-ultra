import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import PremiumPaywall from '../components/PremiumPaywall'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const GOAL_ICONS = { 'Prise de masse': '💪', 'Perte de poids': '🔥', 'Force': '🏋️', 'Endurance': '🏃', 'Mobilité': '🧘', 'Autre': '⚡' }

export default function MyPrograms() {
  const navigate = useNavigate()
  const { user, token } = useStore()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = async () => {
    try {
      const res = await fetch(`${API}/client-programs`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setPrograms(Array.isArray(data) ? data : [])
    } catch { setPrograms([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = () => {
    if (programs.length >= 1 && !user?.isPremium) {
      setShowPaywall(true)
      return
    }
    navigate('/my-programs/new')
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce programme ?')) return
    setDeleting(id)
    await fetch(`${API}/client-programs/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setPrograms(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  const totalSessions = programs.reduce((sum, p) => sum + (p.sessionLogs?.length || 0), 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      {showPaywall && (
        <PremiumPaywall
          onClose={() => setShowPaywall(false)}
          onSuccess={() => { setShowPaywall(false); navigate('/my-programs/new') }}
        />
      )}

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--accent)' }}>
              Mes programmes
            </p>
            <h1 className="font-black" style={{ color: 'var(--text-primary)', fontSize: 'clamp(22px,5vw,32px)' }}>
              Mes créations
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {programs.length === 0 ? 'Crée ton premier programme sur-mesure' : `${programs.length} programme${programs.length > 1 ? 's' : ''} · ${totalSessions} séance${totalSessions > 1 ? 's' : ''} loguée${totalSessions > 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={handleCreate}
            className="px-4 py-2.5 rounded-xl text-sm font-black text-white flex-shrink-0"
            style={{ background: 'var(--accent)' }}>
            + Créer
          </button>
        </div>

        {/* Bannière essai gratuit */}
        {!user?.isPremium && (
          <div className="mb-5 p-4 rounded-2xl flex items-center gap-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'var(--accent-subtle)' }}>🎁</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                {programs.length === 0 ? 'Essai gratuit' : programs.length >= 1 ? 'Limite atteinte' : '1 programme inclus'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {programs.length >= 1
                  ? 'Passe Premium pour créer des programmes illimités.'
                  : '1 programme personnalisé gratuit. Premium = illimité.'}
              </p>
            </div>
            {programs.length >= 1 && (
              <button onClick={() => setShowPaywall(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-black text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--gold), #c9952a)' }}>
                ★ Premium
              </button>
            )}
          </div>
        )}

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
          </div>
        ) : programs.length === 0 ? (
          <div className="py-12 rounded-2xl text-center"
            style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
            <p className="text-5xl mb-4">📋</p>
            <p className="font-black text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Aucun programme</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-faint)' }}>
              Crée ton programme sur-mesure en quelques minutes.
            </p>
            <button onClick={handleCreate}
              className="px-6 py-3 rounded-xl font-black text-white"
              style={{ background: 'var(--accent)' }}>
              🚀 Créer mon programme
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map(prog => {
              const weekCount = prog.weeks?.length || 0
              const dayCount = prog.weeks?.reduce((s, w) => s + (w.days?.length || 0), 0) || 0
              const sessions = prog.sessionLogs?.length || 0
              const lastLog = prog.sessionLogs?.[prog.sessionLogs.length - 1]
              const icon = GOAL_ICONS[prog.goal] || '💪'

              return (
                <div key={prog.id} className="p-4 rounded-2xl"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: 'var(--bg-base)' }}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{prog.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                        {weekCount} semaine{weekCount > 1 ? 's' : ''} · {dayCount} séance{dayCount > 1 ? 's' : ''}/semaine
                        {prog.goal ? ` · ${prog.goal}` : ''}
                      </p>
                      {lastLog && (
                        <p className="text-[10px] mt-1" style={{ color: 'var(--accent)' }}>
                          Dernière séance : {new Date(lastLog.loggedAt).toLocaleDateString('fr')}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                        {sessions} séance{sessions > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <button onClick={() => navigate(`/my-programs/${prog.id}`)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black text-white"
                      style={{ background: 'var(--accent)' }}>
                      ▶ Ouvrir
                    </button>
                    <button onClick={() => navigate(`/my-programs/${prog.id}/session`)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black"
                      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      🏋️ Logger séance
                    </button>
                    <button onClick={() => handleDelete(prog.id)} disabled={deleting === prog.id}
                      className="w-10 py-2.5 rounded-xl text-xs font-black"
                      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>
                      {deleting === prog.id ? '…' : '🗑'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
