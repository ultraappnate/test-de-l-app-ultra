import { useNavigate } from 'react-router-dom'

export default function PaymentCancel() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm text-center">

        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid #ef4444' }}>
          <span style={{ fontSize: 36 }}>✕</span>
        </div>

        <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-2"
          style={{ color: 'var(--text-faint)' }}>
          Paiement annulé
        </p>

        <h1 className="text-2xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>
          Pas de problème
        </h1>

        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Tu peux reprendre à tout moment depuis les paramètres ou la page d'un programme.
        </p>

        <button onClick={() => navigate(-1)}
          className="w-full py-4 rounded-2xl font-black text-white text-base mb-3"
          style={{ background: 'var(--accent)' }}>
          ← Retour
        </button>

        <button onClick={() => navigate('/dashboard')}
          className="text-xs font-bold w-full py-2"
          style={{ color: 'var(--text-faint)' }}>
          Dashboard
        </button>
      </div>
    </div>
  )
}
