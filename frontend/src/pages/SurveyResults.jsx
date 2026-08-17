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

const DETAIL_SECTIONS = [
  { title: '📦 Son historique', fields: [['oldProgram', 'Programme suivi'], ['hadSubscription', 'Avait un abonnement'], ['purchased', 'Acheté ou gratuit']] },
  { title: '🎯 Ses envies', fields: [['wantedProgram', 'Programme souhaité'], ['goal', 'Objectif actuel'], ['frequency', 'Fréquence d\'entraînement'], ['budget', 'Budget mensuel coaching']] },
  { title: '💬 Son retour', fields: [['feedback', 'Ce qui lui manquait'], ['wantsBeta', 'Veut tester ULTRA']] },
]

function DetailModal({ r, onClose }) {
  const [copied, setCopied] = useState(false)
  const copyEmail = () => {
    navigator.clipboard?.writeText(r.email)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '92dvh',
        overflowY: 'auto', background: 'var(--bg-base)', borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border)', borderBottom: 'none' }}>

        {/* En-tête personne */}
        <div style={{ padding: '24px 22px 18px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20, fontWeight: 900, background: 'var(--accent)', color: '#fff' }}>
              {(r.firstName || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                {r.firstName} {r.lastName}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {r.wantsBeta === 'Oui' && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 900, padding: '2px 8px',
                  borderRadius: 99, background: 'var(--accent)', color: '#fff' }}>VEUT LA BETA</span>}
              </p>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, flexShrink: 0, cursor: 'pointer',
              background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>✕</button>
          </div>
          {r.email && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <a href={`mailto:${r.email}`} style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 12,
                fontSize: 13, fontWeight: 800, background: 'var(--accent)', color: '#fff', textDecoration: 'none' }}>
                ✉️ Écrire à {r.firstName}
              </a>
              <button onClick={copyEmail} style={{ padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {copied ? '✓ Copié' : '⧉ Email'}
              </button>
            </div>
          )}
        </div>

        {/* Réponses par section */}
        <div style={{ padding: '18px 22px 34px' }}>
          {DETAIL_SECTIONS.map(sec => (
            <div key={sec.title} style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--text-muted)', margin: '0 0 10px' }}>{sec.title}</p>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {sec.fields.map(([k, label], i) => (
                  <div key={k} style={{ padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border-soft, var(--border))' : 'none' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', margin: '0 0 3px' }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                      {r[k] || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SurveyResults() {
  const { token, user } = useStore()
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
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

  const deleteRow = async (e, r) => {
    e.stopPropagation()
    if (!window.confirm(`Supprimer la réponse de ${r.firstName} ${r.lastName} ? (définitif)`)) return
    const res = await fetch(`${API}/survey/responses/${r.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null)
    if (res?.ok) setRows(prev => prev.filter(x => x.id !== r.id))
  }

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

            {/* Liste compacte — clique pour ouvrir la fiche */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...rows].reverse().map(r => (
                <button key={r.id} onClick={() => setSelected(r)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer',
                    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 16, fontWeight: 900, background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    {(r.firstName || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.firstName} {r.lastName}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.goal || '—'} · {r.budget || '—'}
                    </p>
                  </div>
                  {r.wantsBeta === 'Oui' && <span style={{ fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 99,
                    background: 'var(--accent)', color: '#fff', flexShrink: 0 }}>BETA</span>}
                  <span onClick={e => deleteRow(e, r)} title="Supprimer cette réponse" role="button"
                    style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 12, color: 'var(--text-faint)',
                      background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#e06b7e'; e.currentTarget.style.borderColor = '#e06b7e' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                    ✕
                  </span>
                  <span style={{ color: 'var(--text-faint)', flexShrink: 0 }}>›</span>
                </button>
              ))}
            </div>
          </>
        )}

        {selected && <DetailModal r={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  )
}
