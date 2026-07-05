import { useState, useEffect } from 'react'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

/* ── Formulaire de réponse ───────────────────────────── */
function AnswerForm({ token, q, onDone, onClose }) {
  const [values, setValues] = useState({})
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    const missing = q.questions.filter(question => !String(values[question.id] || '').trim())
    if (missing.length) {
      setError(`Toutes les questions sont obligatoires — il en reste ${missing.length} sans réponse.`)
      return
    }
    setSending(true); setError('')
    try {
      const res = await fetch(`${API}/questionnaires/${q.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: q.questions.map(question => ({ qid: question.id, value: values[question.id] })) }),
      })
      if (!res.ok) throw new Error((await res.json()).message || 'Erreur')
      onDone()
    } catch (e) { setError(String(e.message)) }
    setSending(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '94dvh', overflowY: 'auto',
        background: 'var(--bg-card)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border)', borderBottom: 'none', padding: 22 }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{q.title}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, cursor: 'pointer', flexShrink: 0,
            background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '0 0 18px' }}>
          De {q.coachName} · toutes les questions sont obligatoires
        </p>

        {error && <p style={{ padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700, marginBottom: 14,
          background: 'var(--accent-subtle)', border: '1px solid var(--accent)', color: '#ff8a8a' }}>{error}</p>}

        {q.questions.map((question, i) => (
          <div key={question.id} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              <span style={{ color: 'var(--accent)' }}>Q{i + 1}.</span> {question.label}
            </p>
            {question.type === 'choice' ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {question.options.map(o => (
                  <button key={o} onClick={() => setValues(v => ({ ...v, [question.id]: o }))}
                    style={{ padding: '10px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      background: values[question.id] === o ? 'var(--accent)' : 'var(--bg-base)',
                      border: `1.5px solid ${values[question.id] === o ? 'var(--accent)' : 'var(--border)'}`,
                      color: values[question.id] === o ? '#fff' : 'var(--text-secondary)' }}>
                    {o}
                  </button>
                ))}
              </div>
            ) : (
              <textarea value={values[question.id] || ''} rows={2}
                onChange={e => setValues(v => ({ ...v, [question.id]: e.target.value }))}
                placeholder="Ta réponse…"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 13, fontSize: 14, fontWeight: 600,
                  background: 'var(--bg-base)', border: '1.5px solid var(--border)', color: 'var(--text-primary)',
                  outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
            )}
          </div>
        ))}

        <button onClick={submit} disabled={sending}
          style={{ width: '100%', padding: '15px 0', borderRadius: 15, fontSize: 15, fontWeight: 900, cursor: 'pointer',
            background: 'var(--accent)', color: '#fff', border: 'none', opacity: sending ? 0.6 : 1 }}>
          {sending ? 'Envoi…' : 'Envoyer mes réponses →'}
        </button>
      </div>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────── */
export default function ClientQuestionnaires() {
  const { token } = useStore()
  const [pending, setPending] = useState([])
  const [answeredCount, setAnsweredCount] = useState(0)
  const [answering, setAnswering] = useState(null)
  const [loading, setLoading] = useState(true)
  const [justDone, setJustDone] = useState(false)

  const load = () => {
    fetch(`${API}/questionnaires/pending`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setPending(d.pending || []); setAnsweredCount(d.answeredCount || 0) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>De ton coach</p>
        <h1 style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: 'clamp(22px,6vw,32px)', margin: '0 0 24px' }}>Questionnaires</h1>

        {justDone && (
          <div style={{ padding: '14px 18px', borderRadius: 16, marginBottom: 16, fontSize: 13, fontWeight: 700,
            background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.4)', color: '#27ae60' }}>
            ✓ Réponses envoyées — ton coach a été prévenu, merci !
          </div>
        )}

        {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>}

        {!loading && pending.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 24 }}>
            <p style={{ fontSize: 40, margin: '0 0 10px' }}>✅</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 800, margin: '0 0 6px' }}>Tout est à jour</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              {answeredCount > 0
                ? `Tu as répondu à ${answeredCount} questionnaire(s). Ton coach te préviendra s'il y en a un nouveau.`
                : 'Aucun questionnaire en attente pour l\'instant.'}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pending.map(q => (
            <button key={q.id} onClick={() => setAnswering(q)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer',
                background: 'var(--bg-card)', border: '1.5px solid var(--accent)', borderRadius: 16, padding: '16px 18px',
                boxShadow: '0 4px 20px rgba(160,56,72,0.15)' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>📋</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{q.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  De {q.coachName} · {q.questions.length} question(s)
                </p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 900, padding: '5px 12px', borderRadius: 99, flexShrink: 0,
                background: 'var(--accent)', color: '#fff' }}>Répondre</span>
            </button>
          ))}
        </div>

        {answering && (
          <AnswerForm token={token} q={answering}
            onDone={() => { setAnswering(null); setJustDone(true); load() }}
            onClose={() => setAnswering(null)} />
        )}
      </div>
    </div>
  )
}
