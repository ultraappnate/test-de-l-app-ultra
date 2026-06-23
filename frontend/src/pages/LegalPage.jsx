import { useParams, useNavigate, Link } from 'react-router-dom'
import { LEGAL_DOCS, legalBySlug } from '../data/legal'

export default function LegalPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const doc = slug ? legalBySlug(slug) : null

  // Index : liste de tous les documents
  if (!slug || !doc) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Header onBack={() => navigate(-1)} title="Informations légales" />
        <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(16px,4vw,28px)' }}>
          {!doc && slug && (
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Document introuvable.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LEGAL_DOCS.map(d => (
              <Link key={d.slug} to={`/legal/${d.slug}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 18px', borderRadius: 14, textDecoration: 'none',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
              }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{d.title}</span>
                <span style={{ color: 'var(--text-faint)' }}>›</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Header onBack={() => navigate(-1)} title={doc.title} />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(16px,4vw,28px)' }}>

        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 22 }}>
          {doc.intro}
        </p>

        {doc.sections.map((s, i) => (
          <section key={i} style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>{s.heading}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{s.body}</p>
          </section>
        ))}

        {/* Liens vers les autres documents */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Autres documents
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LEGAL_DOCS.filter(d => d.slug !== doc.slug).map(d => (
              <Link key={d.slug} to={`/legal/${d.slug}`} style={{
                fontSize: 12, fontWeight: 700, padding: '7px 12px', borderRadius: 20,
                textDecoration: 'none', background: 'var(--bg-card)',
                border: '1px solid var(--border)', color: 'var(--text-secondary)',
              }}>{d.title}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Header({ onBack, title }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 20, cursor: 'pointer' }}>←</button>
      <p style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)' }}>{title}</p>
    </div>
  )
}
