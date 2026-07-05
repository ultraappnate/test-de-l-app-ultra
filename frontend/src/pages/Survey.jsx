import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const FIELD_LABELS = {
  firstName: 'Ton prénom', lastName: 'Ton nom', email: 'Ton email',
  oldProgram: 'Le programme que tu avais', hadSubscription: 'Abonnement oui/non',
  purchased: 'Acheté ou gratuit', wantedProgram: 'Le programme souhaité',
  goal: 'Ton objectif', frequency: 'Ta fréquence d\'entraînement',
  budget: 'Ton budget', feedback: 'Ce qui te manquait', wantsBeta: 'Tester la nouvelle app',
}

const GOALS = ['Perte de poids', 'Prise de muscle', 'Force', 'Remise en forme', 'Performance', 'Santé / mobilité']
const FREQS = ['1-2 / semaine', '3-4 / semaine', '5+ / semaine']
const BUDGETS = ['Moins de 20€', '20-50€', '50-100€', 'Plus de 100€', 'Aucun budget']
const PROGRAM_IDEAS = ['Force', 'Prise de masse', 'Perte de poids', 'Cardio / HIIT', 'Mobilité', 'Nutrition', 'Full body', 'Préparation physique']

function Chips({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)}
          style={{
            padding: '10px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: value === o ? 'var(--accent)' : 'var(--bg-card)',
            border: `1.5px solid ${value === o ? 'var(--accent)' : 'var(--border)'}`,
            color: value === o ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}>
          {o}
        </button>
      ))}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 900, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</label>
      {hint && <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '0 0 10px' }}>{hint}</p>}
      {!hint && <div style={{ height: 8 }} />}
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '14px 16px', borderRadius: 14, fontSize: 15,
  background: 'var(--bg-card)', border: '1.5px solid var(--border)',
  color: 'var(--text-primary)', outline: 'none', fontWeight: 600,
}

/* Merci + redirection vers la présentation de l'app */
function ThankYou({ firstName, wantsBeta }) {
  const navigate = useNavigate()
  const [count, setCount] = useState(6)
  useEffect(() => {
    const t = setInterval(() => setCount(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => { if (count <= 0) navigate('/welcome') }, [count])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: 'center', background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 28, padding: '48px 28px' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🙏</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 10 }}>
          Merci {firstName} !
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 26 }}>
          Tes réponses sont bien enregistrées. {wantsBeta === 'Oui'
            ? 'Je te recontacte très vite pour ton accès en avant-première à ULTRA 💪'
            : 'Merci pour ton temps — ça m\'aide énormément à construire la suite.'}
        </p>
        <button onClick={() => navigate('/welcome')}
          style={{ width: '100%', padding: '15px 0', borderRadius: 14, fontSize: 15, fontWeight: 900,
            background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(160,56,72,0.35)' }}>
          Découvrir ULTRA →
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 12 }}>
          Redirection automatique dans {Math.max(count, 0)}s…
        </p>
      </div>
    </div>
  )
}

export default function Survey() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', oldProgram: '', hadSubscription: '',
    purchased: '', wantedProgram: '', goal: '', frequency: '', budget: '',
    feedback: '', wantsBeta: '',
  })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: typeof v === 'string' ? v : v.target.value }))

  const submit = async () => {
    // Toutes les réponses sont obligatoires
    const missing = Object.keys(FIELD_LABELS).filter(k => !String(form[k] || '').trim())
    if (missing.length) {
      setError(`Il manque : ${missing.map(k => FIELD_LABELS[k]).join(', ')} — toutes les réponses sont nécessaires 🙏`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSending(true); setError('')
    try {
      const res = await fetch(`${API}/survey`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).message || 'Erreur')
      setDone(true)
      window.scrollTo({ top: 0 })
    } catch (e) {
      setError(String(e.message || 'Erreur — réessaie dans un instant'))
    }
    setSending(false)
  }

  if (done) return <ThankYou firstName={form.firstName} wantsBeta={form.wantsBeta} />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'clamp(16px,4vw,40px) clamp(16px,5vw,24px) 80px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.25em', color: 'var(--text-primary)', margin: '0 0 14px' }}>ULTRA</p>
          <span style={{ display: 'inline-block', background: 'var(--accent-subtle)', color: 'var(--accent)',
            fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', padding: '5px 14px', borderRadius: 20,
            textTransform: 'uppercase', marginBottom: 14 }}>Enquête · 2 min</span>
          <h1 style={{ fontSize: 'clamp(22px,6vw,30px)', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 10px', lineHeight: 1.2 }}>
            Aide-moi à construire<br />ton prochain coaching.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            Tu as suivi un de mes programmes — j'ai besoin de 2 minutes de ton temps
            pour préparer la suite, sur ma nouvelle app.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '10px 0 0' }}>
            Toutes les questions sont obligatoires
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 14, fontSize: 13, fontWeight: 700,
            background: 'var(--accent-subtle)', border: '1px solid var(--accent)', color: '#ff8a8a' }}>
            {error}
          </div>
        )}

        {/* ── Identité ── */}
        <Field label="Ton prénom *">
          <input style={inputStyle} value={form.firstName} onChange={set('firstName')} placeholder="Prénom" />
        </Field>
        <Field label="Ton nom">
          <input style={inputStyle} value={form.lastName} onChange={set('lastName')} placeholder="Nom" />
        </Field>
        <Field label="Ton email" hint="Pour te recontacter (et t'offrir l'accès à la nouvelle app si tu veux)">
          <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="ton@email.com" />
        </Field>

        {/* ── Historique ── */}
        <div style={{ height: 1, background: 'var(--border)', margin: '10px 0 30px' }} />
        <Field label="Quel(s) programme(s) avais-tu avec moi ? *" hint="Le nom du ou des programmes, comme tu t'en souviens">
          <input style={inputStyle} value={form.oldProgram} onChange={set('oldProgram')} placeholder="Ex : programme prise de masse 12 semaines…" />
        </Field>
        <Field label="Avais-tu un abonnement ?">
          <Chips options={['Oui', 'Non', 'Je ne sais plus']} value={form.hadSubscription} onChange={set('hadSubscription')} />
        </Field>
        <Field label="Ce programme, tu l'avais…">
          <Chips options={['Acheté', 'Reçu gratuitement', 'Je ne sais plus']} value={form.purchased} onChange={set('purchased')} />
        </Field>

        {/* ── Envies ── */}
        <div style={{ height: 1, background: 'var(--border)', margin: '10px 0 30px' }} />
        <Field label="Quel programme aimerais-tu avoir aujourd'hui ?" hint="Décris librement, ou inspire-toi des idées ci-dessous">
          <input style={{ ...inputStyle, marginBottom: 10 }} value={form.wantedProgram} onChange={set('wantedProgram')} placeholder="Ex : un programme force + nutrition…" />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PROGRAM_IDEAS.map(p => (
              <button key={p} type="button"
                onClick={() => setForm(f => ({ ...f, wantedProgram: f.wantedProgram ? `${f.wantedProgram}, ${p}` : p }))}
                style={{ padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: 'var(--bg-card)', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                + {p}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Ton objectif principal en ce moment">
          <Chips options={GOALS} value={form.goal} onChange={set('goal')} />
        </Field>
        <Field label="Tu t'entraînes combien de fois ?">
          <Chips options={FREQS} value={form.frequency} onChange={set('frequency')} />
        </Field>
        <Field label="Ton budget mensuel pour un coaching qui te suit vraiment">
          <Chips options={BUDGETS} value={form.budget} onChange={set('budget')} />
        </Field>

        {/* ── Feedback libre ── */}
        <div style={{ height: 1, background: 'var(--border)', margin: '10px 0 30px' }} />
        <Field label="Qu'est-ce qui te manquait avant ?" hint="Suivi, motivation, contenu, app… dis-moi tout, ça reste entre nous">
          <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
            value={form.feedback} onChange={set('feedback')} placeholder="Réponse libre (optionnel)…" />
        </Field>
        <Field label="Veux-tu tester ma nouvelle app en avant-première ?" hint="Accès gratuit pendant la beta — je t'envoie le lien perso">
          <Chips options={['Oui', 'Non']} value={form.wantsBeta} onChange={set('wantsBeta')} />
        </Field>

        <button onClick={submit} disabled={sending}
          style={{ width: '100%', padding: '17px 0', borderRadius: 16, fontSize: 16, fontWeight: 900,
            background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
            opacity: sending ? 0.6 : 1, marginTop: 6, boxShadow: '0 8px 30px rgba(160,56,72,0.35)' }}>
          {sending ? 'Envoi…' : 'Envoyer mes réponses →'}
        </button>
        <p style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', marginTop: 14 }}>
          Tes réponses ne sont partagées avec personne — elles servent uniquement à préparer les nouveaux programmes.
        </p>
      </div>
    </div>
  )
}
