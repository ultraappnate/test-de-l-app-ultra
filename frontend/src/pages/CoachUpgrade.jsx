import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    color: 'var(--text-faint)',
    features: ['3 clients maximum', 'Création de programmes', 'Messagerie de base', 'Profil public'],
    missing: ['Analytics avancés', 'Badge Coach Vérifié', 'Revenus & commissions', 'Clients illimités'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    color: 'var(--accent)',
    badge: 'Le plus populaire',
    features: ['50 clients', 'Analytics complets', 'Badge ✓ Coach Vérifié', 'Revenus & commissions', 'Programmes illimités', 'Priorité dans la recherche', 'Support prioritaire'],
    missing: [],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 99,
    color: 'var(--gold)',
    features: ['Clients illimités', 'Tout le plan Pro', 'Page coach personnalisée', 'Accès API ULTRA', 'Manager dédié', 'Commission réduite 10%'],
    missing: [],
  },
]

export default function CoachUpgrade() {
  const navigate = useNavigate()
  const { user, token, fetchMe } = useStore()
  const [planInfo, setPlanInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch(`${API}/coach/plan`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setPlanInfo).catch(() => {})
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleUpgrade = async (planId) => {
    if (planId === 'free' || planId === (planInfo?.plan)) return
    setLoading(planId)
    try {
      // Essaye Stripe
      const res = await fetch(`${API}/stripe/checkout-coach-pro`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
    } catch {}

    // Fallback simulation
    try {
      await fetch(`${API}/coach/plan/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planId }),
      })
      if (fetchMe) await fetchMe()
      showToast(`✓ Plan ${planId.charAt(0).toUpperCase() + planId.slice(1)} activé !`)
      setPlanInfo(prev => ({ ...prev, plan: planId }))
    } catch {
      showToast('✗ Erreur lors de l\'activation')
    }
    setLoading(false)
  }

  const currentPlan = planInfo?.plan || user?.coachPlan || 'free'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,40px)' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: 'var(--accent)', color: '#fff', padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 13 }}>
          {toast}
        </div>
      )}

      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold mb-6"
        style={{ color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: 18 }}>←</span> Retour
      </button>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--accent)' }}>
            Plans Coach
          </p>
          <h1 className="font-black mb-2" style={{ color: 'var(--text-primary)', fontSize: 'clamp(24px,5vw,36px)' }}>
            Développe ton activité
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Passe au Pro pour débloquer plus de clients et d'outils puissants.
          </p>
        </div>

        {/* Stats actuelles */}
        {planInfo && (
          <div className="flex gap-3 mb-6">
            <div className="flex-1 p-4 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-2xl font-black" style={{ color: 'var(--accent)' }}>{planInfo.clientCount}</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>Clients actuels</p>
            </div>
            <div className="flex-1 p-4 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-2xl font-black" style={{ color: currentPlan === 'free' ? 'var(--text-faint)' : 'var(--gold)' }}>
                {planInfo.limit === Infinity ? '∞' : planInfo.limit}
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>Limite clients</p>
            </div>
            <div className="flex-1 p-4 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-sm font-black capitalize" style={{ color: currentPlan === 'pro' ? 'var(--accent)' : currentPlan === 'elite' ? 'var(--gold)' : 'var(--text-faint)' }}>
                {currentPlan}
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>Plan actuel</p>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="space-y-4">
          {PLANS.map(plan => {
            const isCurrent = plan.id === currentPlan
            const isRecommended = plan.id === 'pro'
            return (
              <div key={plan.id} className="p-5 rounded-2xl relative overflow-hidden"
                style={{
                  background: 'var(--bg-card)',
                  border: `2px solid ${isCurrent ? plan.color : isRecommended ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                {isRecommended && !isCurrent && (
                  <div className="absolute top-0 right-0 px-3 py-1.5 text-[10px] font-black text-white"
                    style={{ background: 'var(--accent)', borderRadius: '0 18px 0 14px' }}>
                    ★ Recommandé
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-0 right-0 px-3 py-1.5 text-[10px] font-black text-white"
                    style={{ background: plan.color, borderRadius: '0 18px 0 14px' }}>
                    Plan actuel
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-black text-lg" style={{ color: plan.color }}>{plan.name}</p>
                    <div className="flex items-end gap-1 mt-0.5">
                      {plan.price === 0
                        ? <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Gratuit</p>
                        : <>
                            <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{plan.price}€</p>
                            <p className="text-sm mb-1" style={{ color: 'var(--text-faint)' }}>/mois</p>
                          </>
                      }
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="text-xs font-black" style={{ color: '#27ae60' }}>✓</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                  {plan.missing.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="text-xs font-black" style={{ color: 'var(--text-faint)' }}>✕</span>
                      <span className="text-xs" style={{ color: 'var(--text-faint)', textDecoration: 'line-through' }}>{f}</span>
                    </div>
                  ))}
                </div>

                {!isCurrent && plan.price > 0 && (
                  <button onClick={() => handleUpgrade(plan.id)} disabled={!!loading}
                    className="w-full py-3 rounded-xl font-black text-sm text-white"
                    style={{
                      background: plan.id === 'elite'
                        ? 'linear-gradient(135deg, var(--gold), #c9952a)'
                        : 'var(--accent)',
                      opacity: loading === plan.id ? 0.6 : 1,
                    }}>
                    {loading === plan.id ? '→ Redirection…' : `Passer au ${plan.name} — ${plan.price}€/mois`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-faint)' }}>
          Paiement sécurisé Stripe · Résiliable à tout moment · Sans engagement
        </p>
      </div>
    </div>
  )
}
