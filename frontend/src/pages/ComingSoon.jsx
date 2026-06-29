import { useNavigate } from 'react-router-dom'

export default function ComingSoon({ title = 'Bientôt disponible', emoji = '🚧', desc }) {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 24 }}>
      <div style={{
        maxWidth: 440, width: '100%', textAlign: 'center',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 28, padding: '44px 28px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 14 }}>{emoji}</div>
        <span style={{
          display: 'inline-block', marginBottom: 14,
          background: 'var(--accent-subtle)', color: 'var(--accent)',
          fontSize: 11, fontWeight: 900, letterSpacing: '0.15em',
          padding: '5px 12px', borderRadius: 20, textTransform: 'uppercase',
        }}>En finalisation</span>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 10 }}>{title}</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 26 }}>
          {desc || "Cette fonctionnalité arrive très bientôt — on met les derniers détails au point pour te l'offrir au meilleur niveau."}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(-1)} style={{
            padding: '12px 22px', borderRadius: 14, border: '1px solid var(--border)',
            background: 'var(--bg-base)', color: 'var(--text-secondary)', fontWeight: 800, fontSize: 14, cursor: 'pointer',
          }}>← Retour</button>
          <button onClick={() => navigate('/dashboard')} style={{
            padding: '12px 22px', borderRadius: 14, border: 'none',
            background: 'var(--accent)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
          }}>Accueil</button>
        </div>
      </div>
    </div>
  )
}
