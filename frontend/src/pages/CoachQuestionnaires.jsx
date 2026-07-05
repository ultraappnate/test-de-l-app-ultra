import { useState, useEffect } from 'react'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const inputStyle = {
  width: '100%', padding: '13px 15px', borderRadius: 13, fontSize: 14,
  background: 'var(--bg-base)', border: '1.5px solid var(--border)',
  color: 'var(--text-primary)', outline: 'none', fontWeight: 600,
}

/* ── Constructeur de questionnaire ───────────────────── */
function Builder({ token, clients, onSent, onClose }) {
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState([{ label: '', type: 'text', options: [] }])
  const [target, setTarget] = useState('all')          // 'all' | 'select'
  const [selectedIds, setSelectedIds] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const updQ = (i, patch) => setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q))
  const addQ = () => setQuestions(qs => [...qs, { label: '', type: 'text', options: [] }])
  const remQ = (i) => setQuestions(qs => qs.filter((_, idx) => idx !== i))
  const toggleClient = (id) => setSelectedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])

  const send = async () => {
    setError('')
    const validQs = questions.filter(q => q.label.trim() && (q.type === 'text' || q.options.filter(o => o.trim()).length >= 2))
    if (!title.trim()) return setError('Donne un titre à ton questionnaire')
    if (!validQs.length) return setError('Ajoute au moins une question complète (les choix multiples ont besoin de 2 options min)')
    const clientIds = target === 'all' ? 'all' : selectedIds
    if (target === 'select' && !selectedIds.length) return setError('Sélectionne au moins un client')
    setSending(true)
    try {
      const res = await fetch(`${API}/questionnaires`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, questions: validQs.map(q => ({ ...q, options: q.options.filter(o => o.trim()) })), clientIds }),
      })
      if (!res.ok) throw new Error((await res.json()).message || 'Erreur')
      onSent()
    } catch (e) { setError(String(e.message)) }
    setSending(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 620, maxHeight: '94dvh', overflowY: 'auto',
        background: 'var(--bg-card)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border)', borderBottom: 'none', padding: 22 }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>📋 Nouveau questionnaire</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, cursor: 'pointer',
            background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>✕</button>
        </div>

        {error && <p style={{ padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700, marginBottom: 14,
          background: 'var(--accent-subtle)', border: '1px solid var(--accent)', color: '#ff8a8a' }}>{error}</p>}

        <input style={{ ...inputStyle, marginBottom: 18 }} value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Titre — ex : Bilan du mois, Retour sur ton programme…" />

        {/* Questions */}
        {questions.map((q, i) => (
          <div key={i} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 16, padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--accent)', flexShrink: 0 }}>Q{i + 1}</span>
              <input style={{ ...inputStyle, background: 'var(--bg-card)', padding: '10px 12px' }} value={q.label}
                onChange={e => updQ(i, { label: e.target.value })} placeholder="Ta question…" />
              {questions.length > 1 && (
                <button onClick={() => remQ(i)} style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, cursor: 'pointer',
                  background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#e06b7e', fontSize: 12 }}>✕</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['text', '✍️ Réponse libre'], ['choice', '☑️ Choix multiples']].map(([t, label]) => (
                <button key={t} onClick={() => updQ(i, { type: t, options: t === 'choice' && !q.options.length ? ['', ''] : q.options })}
                  style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    background: q.type === t ? 'var(--accent)' : 'var(--bg-card)',
                    border: `1px solid ${q.type === t ? 'var(--accent)' : 'var(--border)'}`,
                    color: q.type === t ? '#fff' : 'var(--text-muted)' }}>{label}</button>
              ))}
            </div>
            {q.type === 'choice' && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {q.options.map((o, oi) => (
                  <div key={oi} style={{ display: 'flex', gap: 6 }}>
                    <input style={{ ...inputStyle, background: 'var(--bg-card)', padding: '8px 12px', fontSize: 13 }} value={o}
                      onChange={e => updQ(i, { options: q.options.map((x, xi) => xi === oi ? e.target.value : x) })}
                      placeholder={`Option ${oi + 1}`} />
                    {q.options.length > 2 && (
                      <button onClick={() => updQ(i, { options: q.options.filter((_, xi) => xi !== oi) })}
                        style={{ width: 30, borderRadius: 9, flexShrink: 0, cursor: 'pointer', background: 'transparent',
                          border: 'none', color: 'var(--text-faint)', fontSize: 11 }}>✕</button>
                    )}
                  </div>
                ))}
                {q.options.length < 8 && (
                  <button onClick={() => updQ(i, { options: [...q.options, ''] })}
                    style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 9, fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                    + Option
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {questions.length < 20 && (
          <button onClick={addQ} style={{ width: '100%', padding: '11px 0', borderRadius: 13, fontSize: 13, fontWeight: 800,
            cursor: 'pointer', background: 'transparent', border: '2px dashed var(--border)', color: 'var(--text-muted)', marginBottom: 20 }}>
            + Ajouter une question
          </button>
        )}

        {/* Destinataires */}
        <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--text-muted)', margin: '0 0 10px' }}>Envoyer à</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[['all', `👥 Tous mes clients (${clients.length})`], ['select', '☑️ Choisir…']].map(([t, label]) => (
            <button key={t} onClick={() => setTarget(t)}
              style={{ padding: '9px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: target === t ? 'var(--accent)' : 'var(--bg-base)',
                border: `1.5px solid ${target === t ? 'var(--accent)' : 'var(--border)'}`,
                color: target === t ? '#fff' : 'var(--text-secondary)' }}>{label}</button>
          ))}
        </div>
        {target === 'select' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {clients.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Aucun client rattaché pour l'instant.</p>}
            {clients.map(c => (
              <button key={c.id} onClick={() => toggleClient(c.id)}
                style={{ padding: '8px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: selectedIds.includes(c.id) ? 'var(--accent)' : 'var(--bg-base)',
                  border: `1.5px solid ${selectedIds.includes(c.id) ? 'var(--accent)' : 'var(--border)'}`,
                  color: selectedIds.includes(c.id) ? '#fff' : 'var(--text-secondary)' }}>
                {selectedIds.includes(c.id) ? '✓ ' : ''}{c.name}
              </button>
            ))}
          </div>
        )}

        <button onClick={send} disabled={sending}
          style={{ width: '100%', padding: '15px 0', borderRadius: 15, fontSize: 15, fontWeight: 900, cursor: 'pointer',
            background: 'var(--accent)', color: '#fff', border: 'none', opacity: sending ? 0.6 : 1, marginBottom: 8 }}>
          {sending ? 'Envoi…' : `Envoyer le questionnaire →`}
        </button>
      </div>
    </div>
  )
}

/* ── Réponses d'un questionnaire ─────────────────────── */
function ResponsesModal({ token, q, onClose }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`${API}/questionnaires/${q.id}/responses`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setData).catch(() => setData({ responses: [] }))
  }, [q.id])
  const responses = data?.responses || []

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 620, maxHeight: '94dvh', overflowY: 'auto',
        background: 'var(--bg-base)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border)', borderBottom: 'none' }}>
        <div style={{ padding: '20px 22px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{q.title}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
              {responses.length}/{q.recipients.length} réponse(s)
            </p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, cursor: 'pointer', flexShrink: 0,
            background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>✕</button>
        </div>
        <div style={{ padding: 22 }}>
          {!data && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement…</p>}
          {data && responses.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13, padding: '30px 0' }}>
              📭 Aucune réponse pour l'instant — tes clients ont été notifiés.
            </p>
          )}
          {responses.map(r => (
            <div key={r.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
              padding: 16, marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 12px' }}>
                {r.clientName} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)' }}>
                  · {new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
              </p>
              {r.answers.map((a, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', margin: '0 0 2px' }}>{a.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>{a.value}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────── */
export default function CoachQuestionnaires() {
  const { token } = useStore()
  const [list, setList] = useState([])
  const [clients, setClients] = useState([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch(`${API}/questionnaires/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setList(d.questionnaires || [])).finally(() => setLoading(false))
  }
  useEffect(() => {
    load()
    fetch(`${API}/questionnaires/clients`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setClients(d.clients || []))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>Coach</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <h1 style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: 'clamp(22px,6vw,32px)', margin: 0 }}>Questionnaires</h1>
          <button onClick={() => setShowBuilder(true)}
            style={{ padding: '11px 20px', borderRadius: 13, fontSize: 13, fontWeight: 900, cursor: 'pointer',
              background: 'var(--accent)', color: '#fff', border: 'none' }}>
            + Nouveau
          </button>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>}
        {!loading && list.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 24 }}>
            <p style={{ fontSize: 40, margin: '0 0 10px' }}>📋</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 800, margin: '0 0 6px' }}>Aucun questionnaire envoyé</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              Crée ton premier questionnaire et envoie-le à un client, un groupe ou tous tes clients.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...list].reverse().map(q => (
            <button key={q.id} onClick={() => setViewing(q)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer',
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>📋</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {q.questions.length} question(s) · envoyé à {q.recipients.length} client(s) · {new Date(q.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 900, padding: '5px 12px', borderRadius: 99, flexShrink: 0,
                background: q.answerCount > 0 ? 'rgba(39,174,96,0.15)' : 'var(--bg-base)',
                color: q.answerCount > 0 ? '#27ae60' : 'var(--text-faint)',
                border: `1px solid ${q.answerCount > 0 ? 'rgba(39,174,96,0.4)' : 'var(--border)'}` }}>
                {q.answerCount}/{q.recipients.length}
              </span>
            </button>
          ))}
        </div>

        {showBuilder && (
          <Builder token={token} clients={clients}
            onSent={() => { setShowBuilder(false); load() }}
            onClose={() => setShowBuilder(false)} />
        )}
        {viewing && <ResponsesModal token={token} q={viewing} onClose={() => setViewing(null)} />}
      </div>
    </div>
  )
}
