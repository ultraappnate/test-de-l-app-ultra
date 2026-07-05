import { useState, useEffect } from 'react'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const COLS = [
  ['firstName', 'Prénom'], ['lastName', 'Nom'], ['email', 'Email'],
  ['oldProgram', 'Programme (avant)'], ['hadSubscription', 'Abonnement'],
  ['purchased', 'Acheté ?'], ['wantedProgram', 'Programme souhaité'],
  ['goal', 'Objectif'], ['frequency', 'Fréquence'], ['budget', 'Budget'],
  ['feedback', 'Feedback'], ['wantsBeta', 'Veut la beta'], ['createdAt', 'Date'],
]

function countBy(rows, key) {
  const m = {}
  rows.forEach(r => { const v = r[key] || '—'; m[v] = (m[v] || 0) + 1 })
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}

export default function SurveyResults() {
  const { token, user } = useStore()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch(`${API}/survey/responses`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.message)))
      .then(d => setRows(d.responses || []))
      .catch(e => setErr(String(e || 'Erreur')))
      .finally(() => setLoading(false))
  }, [])

  const exportCsv = () => {
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [COLS.map(c => c[1]).join(';'), ...rows.map(r => COLS.map(([k]) => esc(r[k])).join(';'))].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `enquete-ultra-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const betaYes = rows.filter(r => r.wantsBeta === 'Oui')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>Enquête</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <h1 style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: 'clamp(22px,6vw,32px)', margin: 0 }}>
            Réponses ({rows.length})
          </h1>
          <button onClick={exportCsv} disabled={!rows.length}
            style={{ padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer',
              background: 'var(--accent)', color: '#fff', border: 'none', opacity: rows.length ? 1 : 0.4 }}>
            ⬇ Export CSV
          </button>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>}
        {err && <p style={{ color: '#ff8a8a', fontWeight: 700 }}>{err}</p>}

        {!loading && !err && rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 24 }}>
            <p style={{ fontSize: 40, margin: '0 0 10px' }}>📭</p>
            <p style={{ color: 'var(--text-muted)', fontWeight: 700, margin: 0 }}>
              Aucune réponse pour l'instant — partage le lien <b style={{ color: 'var(--accent)' }}>/enquete</b>
            </p>
          </div>
        )}

        {rows.length > 0 && (
          <>
            {/* Synthèse */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[['budget', '💰 Budget mensuel'], ['goal', '🎯 Objectifs'], ['hadSubscription', '📋 Avaient un abonnement'], ['wantsBeta', '🚀 Veulent la beta']].map(([key, title]) => (
                <div key={key} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 10px' }}>{title}</p>
                  {countBy(rows, key).slice(0, 4).map(([v, n]) => (
                    <div key={v} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{v}</span>
                      <b style={{ color: 'var(--accent)' }}>{n}</b>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {betaYes.length > 0 && (
              <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)', borderRadius: 18, padding: 16, marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  🚀 {betaYes.length} personne(s) veulent tester ULTRA :{' '}
                  <span style={{ color: 'var(--accent)' }}>{betaYes.map(r => r.email || r.firstName).join(' · ')}</span>
                </p>
              </div>
            )}

            {/* Liste des réponses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...rows].reverse().map(r => (
                <div key={r.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                    <b style={{ color: 'var(--text-primary)', fontSize: 15 }}>{r.firstName} {r.lastName}</b>
                    {r.email && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.email}</span>}
                    {r.wantsBeta === 'Oui' && <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 99, background: 'var(--accent)', color: '#fff' }}>VEUT LA BETA</span>}
                    <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 'auto' }}>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 13 }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}><b style={{ color: 'var(--text-muted)' }}>Avant :</b> {r.oldProgram || '—'} {r.purchased && `(${r.purchased.toLowerCase()})`} {r.hadSubscription === 'Oui' ? '· abonné' : ''}</p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}><b style={{ color: 'var(--text-muted)' }}>Souhaite :</b> {r.wantedProgram || '—'}</p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}><b style={{ color: 'var(--text-muted)' }}>Objectif :</b> {r.goal || '—'} · {r.frequency || '—'} · {r.budget || '—'}</p>
                  </div>
                  {r.feedback && (
                    <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic',
                      borderLeft: '3px solid var(--accent)', paddingLeft: 12 }}>« {r.feedback} »</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
