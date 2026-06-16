import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const STATUT_COLOR = {
  'Optimal': '#22c55e',
  'Léger désalignement': '#f59e0b',
  'Désalignement modéré': '#f97316',
  'Désalignement important': '#ef4444',
}

const SEVERITE_LABEL = ['', 'Optimal', 'Léger', 'Modéré', 'Important']

function ScoreRing({ score }) {
  const radius = 54
  const circ = 2 * Math.PI * radius
  const filled = (score / 100) * circ
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'
  return (
    <svg width={130} height={130} viewBox="0 0 130 130">
      <circle cx={65} cy={65} r={radius} fill="none" stroke="var(--border)" strokeWidth={10} />
      <circle cx={65} cy={65} r={radius} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 65 65)" style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={65} y={60} textAnchor="middle" fill={color} fontSize={28} fontWeight={900}>{score}</text>
      <text x={65} y={78} textAnchor="middle" fill="var(--text-faint)" fontSize={11}>/100</text>
    </svg>
  )
}

function ZoneCard({ zone }) {
  const color = STATUT_COLOR[zone.statut] || '#94a3b8'
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${color}33`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 12,
      padding: '12px 14px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{zone.zone}</span>
        <span style={{
          background: color + '22',
          color,
          fontSize: 11,
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 20,
        }}>{zone.statut}</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: zone.muscles_impliques?.length ? 8 : 0 }}>
        {zone.observations}
      </p>
      {zone.muscles_impliques?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {zone.muscles_impliques.map(m => (
            <span key={m} style={{
              background: 'var(--bg-hover)',
              color: 'var(--text-muted)',
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 6,
            }}>{m}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function RecoCard({ reco, idx }) {
  const typeColor = {
    'Renforcement': '#6366f1',
    'Étirement': '#22c55e',
    'Correction posturale': 'var(--accent)',
    'Consultation spécialiste': '#f97316',
    'Ergonomie': '#f59e0b',
  }
  const color = typeColor[reco.type] || 'var(--accent)'
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-soft)',
      borderRadius: 12,
      padding: '12px 14px',
      marginBottom: 10,
      display: 'flex',
      gap: 12,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: color + '22', color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: 14, flexShrink: 0,
      }}>{idx + 1}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '18', padding: '2px 8px', borderRadius: 6 }}>{reco.type}</span>
          {reco.professionnel && reco.professionnel !== 'null' && (
            <span style={{ fontSize: 10, color: '#f97316', fontWeight: 600 }}>👨‍⚕️ {reco.professionnel}</span>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reco.action}</p>
      </div>
    </div>
  )
}

export default function PostureAnalysis() {
  const navigate = useNavigate()
  const { token, user } = useStore()
  const [step, setStep] = useState('upload') // upload | analyzing | result
  const [imagePreview, setImagePreview] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const [analysisId, setAnalysisId] = useState(null)
  const fileRef = useRef()

  function handleFile(file) {
    if (!file) return
    const mime = file.type || 'image/jpeg'
    setMimeType(mime)
    const reader = new FileReader()
    reader.onload = e => {
      setImagePreview(e.target.result)
      setImageBase64(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  async function analyze() {
    if (!imageBase64) return
    setStep('analyzing')
    setError('')
    try {
      const res = await fetch(`${API}/posture/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageBase64, mimeType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur analyse')
      setResult(data.analysis)
      setAnalysisId(data.id)
      setStep('result')
    } catch (err) {
      setError(err.message)
      setStep('upload')
    }
  }

  async function shareWithPros() {
    if (!analysisId) return
    setSharing(true)
    // Récupérer les pros de santé liés au compte
    try {
      const res = await fetch(`${API}/posture/share/${analysisId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ proId: 'all' }),
      })
      if (res.ok) setShared(true)
    } catch {}
    setSharing(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => navigate(-1)} style={{ color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>←</button>
        <div>
          <p style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)' }}>Analyse Posturale IA</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bilan biomécanique complet · Powered by Claude AI</p>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(16px,4vw,28px)' }}>

        {/* ÉTAPE 1 — Upload */}
        {step === 'upload' && (
          <>
            {/* Explication */}
            <div style={{
              background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(var(--accent-rgb,139,0,0),0.08) 100%)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
            }}>
              <p style={{ fontWeight: 900, fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>
                Comment ça fonctionne ?
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { icon: '📸', text: 'Prends une photo debout, de face ou de profil, sur fond neutre' },
                  { icon: '🤖', text: "L'IA analyse ta posture : rachis, épaules, bassin, asymétries, longueurs" },
                  { icon: '📋', text: 'Tu reçois un rapport clinique complet avec recommandations personnalisées' },
                  { icon: '👨‍⚕️', text: 'Partage les résultats directement avec ton kiné, ostéo ou médecin du sport' },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips photo */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-soft)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Conseils pour une bonne photo</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['✅', 'Vêtements moulants ou short + débardeur'],
                  ['✅', 'Fond clair et neutre'],
                  ['✅', 'Pieds à la largeur des épaules'],
                  ['✅', 'Bras le long du corps, naturels'],
                  ['✅', 'Photo de face ET de profil idéalement'],
                  ['❌', 'Évite les vêtements larges qui cachent la silhouette'],
                ].map(([ic, t]) => (
                  <div key={t} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14 }}>{ic}</span>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{t}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone de dépôt / preview */}
            {!imagePreview ? (
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%',
                  border: '2px dashed var(--border)',
                  borderRadius: 20,
                  padding: '40px 20px',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                  transition: 'border-color 0.2s',
                }}>
                <span style={{ fontSize: 40 }}>📷</span>
                <p style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)' }}>Choisir une photo</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>JPG, PNG — Photo de face ou de profil</p>
              </button>
            ) : (
              <div style={{ position: 'relative', marginBottom: 16, borderRadius: 20, overflow: 'hidden' }}>
                <img src={imagePreview} alt="Aperçu" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', background: '#000', display: 'block' }} />
                <button
                  onClick={() => { setImagePreview(null); setImageBase64(null) }}
                  style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(0,0,0,0.7)', color: '#fff',
                    border: 'none', borderRadius: 8, padding: '6px 12px',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>Changer</button>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />

            {error && (
              <div style={{ background: '#ef444420', border: '1px solid #ef4444', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>{error}</p>
              </div>
            )}

            <button
              onClick={analyze}
              disabled={!imageBase64}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                border: 'none',
                background: imageBase64 ? 'var(--accent)' : 'var(--border)',
                color: imageBase64 ? '#fff' : 'var(--text-faint)',
                fontWeight: 900,
                fontSize: 16,
                cursor: imageBase64 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}>
              Analyser ma posture
            </button>
          </>
        )}

        {/* ÉTAPE 2 — Chargement */}
        {step === 'analyzing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 24 }}>
            <div style={{
              width: 80, height: 80,
              border: '4px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 900, fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>Analyse en cours…</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280 }}>
                Claude AI analyse ta posture avec une précision clinique. Cela prend 15 à 30 secondes.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320 }}>
              {['Détection des repères anatomiques', 'Analyse des alignements rachidiens', 'Mesure des asymétries', 'Génération des recommandations'].map((label, i) => (
                <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'center', opacity: 0.5 + i * 0.15 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</p>
                </div>
              ))}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* ÉTAPE 3 — Résultat */}
        {step === 'result' && result && (
          <>
            {/* Score global */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              marginBottom: 20,
            }}>
              {result.scoreGlobal !== undefined && <ScoreRing score={result.scoreGlobal} />}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>Score posture globale</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{result.resume}</p>
              </div>
            </div>

            {/* Analyse par zone */}
            {result.zones?.length > 0 && (
              <Section title="Analyse par zone">
                {result.zones.map((z, i) => <ZoneCard key={i} zone={z} />)}
              </Section>
            )}

            {/* Asymétries */}
            {result.asymetries?.length > 0 && (
              <Section title="Asymétries détectées">
                {result.asymetries.map((a, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 10,
                  }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{a.type}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{a.description}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{a.impact}</p>
                  </div>
                ))}
              </Section>
            )}

            {/* Longueurs */}
            {result.longueurs && (
              <Section title="Longueurs membres">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  {[
                    { label: 'Membres inférieurs', value: result.longueurs.jambes },
                    { label: 'Membres supérieurs', value: result.longueurs.bras },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 12, padding: '12px',
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{value}</p>
                    </div>
                  ))}
                </div>
                {result.longueurs.commentaire && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{result.longueurs.commentaire}</p>
                )}
              </Section>
            )}

            {/* Courbures rachis */}
            {result.courburbes_rachis && (
              <Section title="Courbures rachidiennes">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {[
                    { label: 'Cervicale', value: result.courburbes_rachis.lordose_cervicale },
                    { label: 'Thoracique', value: result.courburbes_rachis.cyphose_thoracique },
                    { label: 'Lombaire', value: result.courburbes_rachis.lordose_lombaire },
                  ].map(({ label, value }) => {
                    const color = value === 'Normale' ? '#22c55e' : value?.includes('légère') ? '#f59e0b' : '#f97316'
                    return (
                      <div key={label} style={{ background: 'var(--bg-card)', border: `1px solid ${color}33`, borderRadius: 10, padding: 10, textAlign: 'center' }}>
                        <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
                        <p style={{ fontSize: 11, color, fontWeight: 700 }}>{value}</p>
                      </div>
                    )
                  })}
                </div>
                {result.courburbes_rachis.commentaire && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{result.courburbes_rachis.commentaire}</p>
                )}
              </Section>
            )}

            {/* Recommandations */}
            {result.recommandations?.length > 0 && (
              <Section title="Plan d'action recommandé">
                {[...result.recommandations].sort((a, b) => a.priorite - b.priorite).map((r, i) => (
                  <RecoCard key={i} reco={r} idx={i} />
                ))}
              </Section>
            )}

            {/* Orientation pro */}
            {result.orientation_pro?.consultation_recommandee && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(239,68,68,0.05) 100%)',
                border: '1px solid rgba(249,115,22,0.4)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
              }}>
                <p style={{ fontWeight: 900, fontSize: 14, color: '#f97316', marginBottom: 6 }}>
                  👨‍⚕️ Consultation professionnelle recommandée
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {result.orientation_pro.urgence}
                </p>
                {result.orientation_pro.specialistes?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {result.orientation_pro.specialistes.map(s => (
                      <span key={s} style={{
                        background: 'rgba(249,115,22,0.15)', color: '#f97316',
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Partager avec pro de santé */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}>
              <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                Partager avec ton professionnel de santé
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Ton kiné, ostéopathe ou médecin du sport pourra consulter ce rapport directement dans leur espace ULTRA.
              </p>
              <button
                onClick={shareWithPros}
                disabled={sharing || shared}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 12,
                  border: 'none',
                  background: shared ? '#22c55e' : 'var(--accent)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: shared ? 'default' : 'pointer',
                  transition: 'background 0.2s',
                }}>
                {shared ? '✓ Rapport partagé avec les pros' : sharing ? 'Partage…' : '↗ Partager avec mes professionnels'}
              </button>
            </div>

            {/* Nouvelle analyse */}
            <button
              onClick={() => { setStep('upload'); setResult(null); setImagePreview(null); setImageBase64(null); setShared(false) }}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}>
              Faire une nouvelle analyse
            </button>
          </>
        )}

        {/* Résultat brut si JSON non parsé */}
        {step === 'result' && result?.raw && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 16, border: '1px solid var(--border)' }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 10 }}>Analyse posturale</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{result.raw}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontSize: 10, fontWeight: 900, color: 'var(--text-faint)',
        textTransform: 'uppercase', letterSpacing: '0.15em',
        marginBottom: 10,
      }}>{title}</p>
      {children}
    </div>
  )
}
