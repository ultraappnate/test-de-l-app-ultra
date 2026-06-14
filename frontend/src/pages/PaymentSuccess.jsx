import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'

export default function PaymentSuccess() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { fetchMe } = useStore()
  const type = params.get('type')
  const programId = params.get('programId')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Rafraîchir le profil user (isPremium peut avoir changé via webhook)
    const init = async () => {
      if (fetchMe) await fetchMe()
      setReady(true)
    }
    init()
  }, [])

  const goNext = () => {
    if (type === 'program' && programId) navigate(`/programs/${programId}`)
    else if (type === 'premium') navigate('/settings?tab=abonnement')
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm text-center">

        {/* Icône succès */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(39,174,96,0.15)', border: '2px solid #27ae60' }}>
          <span style={{ fontSize: 36 }}>✓</span>
        </div>

        <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-2"
          style={{ color: '#27ae60' }}>
          Paiement confirmé
        </p>

        <h1 className="text-2xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>
          {type === 'premium' ? 'Bienvenue dans Premium !' : 'Accès débloqué !'}
        </h1>

        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {type === 'premium'
            ? 'Ton abonnement est actif. Tu as maintenant accès à tous les programmes, l\'Atlas 3D et bien plus.'
            : 'Ton programme est maintenant accessible. Lance-toi !'}
        </p>

        {type === 'premium' && (
          <div className="p-4 rounded-2xl mb-6 text-left"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-3"
              style={{ color: 'var(--gold)' }}>★ Premium activé</p>
            {['Tous les programmes Admin', 'Atlas Musculaire 3D', 'Analytics de progression', 'Communauté illimitée', 'Intégrations Strava & Garmin'].map(f => (
              <div key={f} className="flex items-center gap-2 mb-2">
                <span style={{ color: '#27ae60', fontSize: 12, fontWeight: 900 }}>✓</span>
                <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{f}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={goNext} disabled={!ready}
          className="w-full py-4 rounded-2xl font-black text-white text-base"
          style={{ background: type === 'premium' ? 'var(--gold)' : 'var(--accent)', opacity: ready ? 1 : 0.6 }}>
          {type === 'premium' ? '★ Découvrir mes avantages' : '🚀 Démarrer le programme'}
        </button>

        <button onClick={() => navigate('/dashboard')}
          className="mt-3 text-xs font-bold w-full py-2"
          style={{ color: 'var(--text-faint)' }}>
          Retour au dashboard
        </button>
      </div>
    </div>
  )
}
