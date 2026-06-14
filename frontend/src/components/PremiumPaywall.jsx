import { useState } from 'react'
import { useStore } from '../store'

const FEATURES = [
  { icon: '💪', label: 'Tous les programmes Admin' },
  { icon: '🦾', label: 'Atlas Musculaire 3D complet' },
  { icon: '📈', label: 'Analytics de progression' },
  { icon: '🌍', label: 'Accès Communauté illimité' },
  { icon: '🔗', label: 'Intégrations Strava & Garmin' },
  { icon: '🔔', label: 'Notifications personnalisées' },
]

export default function PremiumPaywall({ onClose, onSuccess }) {
  const { activatePremium } = useStore()
  const [loading, setLoading] = useState(false)

  const handleActivate = async () => {
    setLoading(true)
    const res = await activatePremium()
    setLoading(false)
    if (res.success) onSuccess?.()
  }

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 env(safe-area-inset-bottom)' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: 'var(--bg-card)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border)', padding: 24, paddingBottom: 32 }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: 'var(--gold)', fontSize: 20 }}>★</span>
              <p className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: 'var(--gold)' }}>Premium</p>
            </div>
            <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Passe à la vitesse supérieure</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>Accède à tout le contenu de la plateforme</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'var(--bg-base)', color: 'var(--text-faint)' }}>
            ✕
          </button>
        </div>

        {/* Prix */}
        <div className="p-4 rounded-2xl mb-5 text-center"
          style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #c42840 100%)', border: '1px solid var(--accent)' }}>
          <p className="text-white/70 text-xs font-bold mb-1">Abonnement mensuel</p>
          <div className="flex items-end justify-center gap-1">
            <span className="text-4xl font-black text-white">9,99</span>
            <span className="text-white/80 text-lg font-bold mb-1">€/mois</span>
          </div>
          <p className="text-white/60 text-xs mt-1">Résiliable à tout moment</p>
        </div>

        {/* Features */}
        <div className="space-y-2.5 mb-6">
          {FEATURES.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-base">{icon}</span>
              <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              <span className="ml-auto text-xs font-black" style={{ color: '#27ae60' }}>✓</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={handleActivate} disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-white text-base"
          style={{ background: 'var(--accent)', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Activation…' : '★ Activer Premium — 9,99 €/mois'}
        </button>
        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-faint)' }}>
          Démo — aucun paiement réel requis
        </p>
      </div>
    </div>
  )
}
