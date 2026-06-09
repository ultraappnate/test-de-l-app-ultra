import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useStore } from '../store'

const API = 'http://localhost:5001/api'

/* ─── Config des plateformes ─── */
const PLATFORMS = [
  {
    id: 'strava',
    name: 'Strava',
    logo: '🚴',
    color: '#FC4C02',
    bg: 'linear-gradient(135deg, #1a0800 0%, #7a2200 60%, #FC4C02 100%)',
    description: 'Course, vélo, natation — toutes tes activités sportives.',
    metrics: ['Distance', 'Temps', 'Calories', 'Fréquence cardiaque', 'Puissance', 'Segments'],
    dataKeys: ['activities', 'distance_week', 'elevation', 'pace'],
    authUrl: 'https://www.strava.com/oauth/authorize',
    scope: 'read,activity:read_all',
    comingSoon: false,
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    logo: '⌚',
    color: '#009CDE',
    bg: 'linear-gradient(135deg, #001220 0%, #003d6b 60%, #009CDE 100%)',
    description: 'Montre Garmin — données d\'entraînement avancées et récupération.',
    metrics: ['VO2max', 'Charge entraînement', 'Récupération', 'Sommeil', 'Body Battery', 'SpO2'],
    dataKeys: ['vo2max', 'training_load', 'body_battery', 'sleep_score'],
    authUrl: 'https://connect.garmin.com/oauthConfirm',
    scope: 'activity:read',
    comingSoon: false,
  },
  {
    id: 'oura',
    name: 'Oura Ring',
    logo: '💍',
    color: '#B8A47C',
    bg: 'linear-gradient(135deg, #0d0a05 0%, #4a3a18 60%, #B8A47C 100%)',
    description: 'Bague connectée — le meilleur suivi du sommeil et de la récupération.',
    metrics: ['Score sommeil', 'HRV', 'Température corporelle', 'Fréquence cardiaque au repos', 'Readiness', 'SPO2'],
    dataKeys: ['sleep_score', 'hrv', 'readiness', 'rhr'],
    authUrl: 'https://cloud.ouraring.com/oauth/authorize',
    scope: 'daily sleep readiness personal',
    comingSoon: false,
  },
  {
    id: 'polar',
    name: 'Polar Flow',
    logo: '🔵',
    color: '#D10000',
    bg: 'linear-gradient(135deg, #120000 0%, #5c0000 60%, #D10000 100%)',
    description: 'Montre Polar — entraînements, charge et récupération cardio.',
    metrics: ['Fréquence cardiaque', 'Zones FC', 'Charge cardiaque', 'Orthostatique', 'Nightly Recharge', 'Training Load Pro'],
    dataKeys: ['cardio_load', 'hr_zones', 'nightly_recharge', 'orthostatic'],
    authUrl: 'https://flow.polar.com/oauth2/authorization',
    scope: 'accesslink.read_all',
    comingSoon: false,
  },
  {
    id: 'apple',
    name: 'Apple Santé',
    logo: '🍎',
    color: '#555',
    bg: 'linear-gradient(135deg, #111 0%, #333 60%, #555 100%)',
    description: 'Importe tes données via export XML depuis l\'app Santé d\'Apple.',
    metrics: ['Pas', 'Fréquence cardiaque', 'Sommeil', 'Poids', 'Activité', 'SpO2'],
    dataKeys: ['steps', 'heart_rate', 'sleep', 'weight'],
    authUrl: null, // import manuel
    comingSoon: false,
    isManual: true,
  },
]

const METRIC_ICONS = {
  activities: '🏃', distance_week: '📏', elevation: '⛰', pace: '⚡',
  vo2max: '🫁', training_load: '⚡', body_battery: '🔋', sleep_score: '😴',
  sleep: '😴', hrv: '💓', readiness: '🟢', rhr: '❤️',
  cardio_load: '💪', hr_zones: '📊', nightly_recharge: '🌙', orthostatic: '📈',
  steps: '👟', heart_rate: '❤️', weight: '⚖️',
}

function MetricCard({ icon, label, value, unit, trend, color }) {
  return (
    <div style={{ background:'var(--bg-base)', border:'1px solid var(--border)', borderRadius:14,
      padding:'14px 16px', display:'flex', flexDirection:'column', gap:4 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:18 }}>{icon}</span>
        {trend != null && (
          <span style={{ fontSize:11, fontWeight:700, color: trend >= 0 ? '#4ade80' : '#ef4444' }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p style={{ fontSize:22, fontWeight:900, color: color || 'var(--text-primary)', lineHeight:1 }}>
        {value}<span style={{ fontSize:13, fontWeight:600, color:'var(--text-faint)', marginLeft:3 }}>{unit}</span>
      </p>
      <p style={{ fontSize:11, color:'var(--text-faint)', fontWeight:600 }}>{label}</p>
    </div>
  )
}

function ActivityBar({ day, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1 }}>
      <div style={{ width:'100%', height:60, display:'flex', alignItems:'flex-end', borderRadius:6, overflow:'hidden', background:'var(--bg-base)' }}>
        <div style={{ width:'100%', height:`${pct}%`, background:color, borderRadius:'4px 4px 0 0',
          minHeight: value > 0 ? 4 : 0, transition:'height 0.6s ease' }}/>
      </div>
      <span style={{ fontSize:9, color:'var(--text-faint)', fontWeight:600 }}>{day}</span>
    </div>
  )
}

function ConnectedView({ platform, data, onDisconnect, onSync, syncing }) {
  const p = PLATFORMS.find(x => x.id === platform)
  const lastSync = data?.lastSync ? new Date(data.lastSync) : null
  const metrics = data?.metrics || {}
  const activity = data?.weekActivity || []

  const MOCK_METRICS = {
    strava:  { activities:12, distance_week:'87.4 km', elevation:'1 240 m', pace:"4'32\"/km" },
    garmin:  { vo2max:52, training_load:342, body_battery:'78 %', sleep_score:'82/100' },
    oura:    { sleep_score:'86/100', hrv:'54 ms', readiness:'91/100', rhr:'52 bpm' },
    polar:   { cardio_load:280, hr_zones:'Zone 2 dominant', nightly_recharge:'Good', orthostatic:'Normal' },
    apple:   { steps:'9 847', heart_rate:'68 bpm', sleep:'7h 12m', weight:'78.2 kg' },
  }

  const displayMetrics = Object.entries(MOCK_METRICS[platform] || {})
  const WEEK = ['L','M','M','J','V','S','D']
  const weekVals = data?.weekActivity || [6400,8200,11000,7800,12400,9600,10200]
  const maxVal = Math.max(...weekVals, 1)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header connecté */}
      <div style={{ background: p.bg, borderRadius:20, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:32 }}>{p.logo}</span>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <h3 style={{ fontSize:18, fontWeight:900, color:'#fff', margin:0 }}>{p.name}</h3>
              <span style={{ background:'rgba(74,222,128,0.2)', border:'1px solid rgba(74,222,128,0.4)',
                color:'#4ade80', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99 }}>
                ● Connecté
              </span>
            </div>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, margin:'4px 0 0' }}>
              {lastSync ? `Sync. ${lastSync.toLocaleDateString('fr-FR')} à ${lastSync.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}` : 'Synchronisé'}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onSync} disabled={syncing}
            style={{ padding:'9px 16px', borderRadius:12, fontSize:12, fontWeight:700, cursor:'pointer',
              background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.25)',
              opacity: syncing ? 0.6 : 1 }}>
            {syncing ? '⟳ Sync…' : '↻ Synchroniser'}
          </button>
          <button onClick={onDisconnect}
            style={{ padding:'9px 16px', borderRadius:12, fontSize:12, fontWeight:700, cursor:'pointer',
              background:'rgba(239,68,68,0.15)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)' }}>
            Déconnecter
          </button>
        </div>
      </div>

      {/* Métriques */}
      <div>
        <p style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em',
          color:'var(--text-faint)', marginBottom:12 }}>Dernières données</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:10 }}>
          {displayMetrics.map(([key, val]) => (
            <MetricCard key={key}
              icon={METRIC_ICONS[key] || '📊'}
              label={key.replace(/_/g,' ')}
              value={val}
              color={p.color} />
          ))}
        </div>
      </div>

      {/* Activité semaine (barres) */}
      {platform !== 'oura' && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:18 }}>
          <p style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em',
            color:'var(--text-faint)', marginBottom:16 }}>
            {platform === 'apple' ? 'Pas — 7 derniers jours' : 'Activité — 7 derniers jours'}
          </p>
          <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:80 }}>
            {WEEK.map((d, i) => (
              <ActivityBar key={i} day={d} value={weekVals[i]} max={maxVal} color={p.color} />
            ))}
          </div>
          <p style={{ fontSize:11, color:'var(--text-faint)', marginTop:10, textAlign:'right' }}>
            Moy. {Math.round(weekVals.reduce((a,b)=>a+b,0)/7).toLocaleString()} {platform==='apple'?'pas':'kcal'}/jour
          </p>
        </div>
      )}

      {/* Sommeil Oura */}
      {platform === 'oura' && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:18 }}>
          <p style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em',
            color:'var(--text-faint)', marginBottom:16 }}>Qualité du sommeil — 7 nuits</p>
          <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:80 }}>
            {[72,85,68,90,88,76,86].map((v, i) => (
              <ActivityBar key={i} day={WEEK[i]} value={v} max={100}
                color={v >= 85 ? '#4ade80' : v >= 70 ? '#f59e0b' : '#ef4444'} />
            ))}
          </div>
          <p style={{ fontSize:11, color:'var(--text-faint)', marginTop:10, textAlign:'right' }}>Score moyen : 80.7/100</p>
        </div>
      )}
    </div>
  )
}

function AppleImportView({ onImport, importing }) {
  const fileRef = useRef()
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (f) => {
    if (f && (f.name.endsWith('.xml') || f.name.endsWith('.zip'))) setFile(f)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ background:'linear-gradient(135deg, #111 0%, #333 60%, #555 100%)',
        borderRadius:20, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
          <span style={{ fontSize:32 }}>🍎</span>
          <div>
            <h3 style={{ fontSize:18, fontWeight:900, color:'#fff', margin:0 }}>Apple Santé</h3>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, margin:'4px 0 0' }}>
              Import manuel via export XML
            </p>
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:'12px 16px',
          border:'1px solid rgba(255,255,255,0.12)' }}>
          <p style={{ color:'rgba(255,255,255,0.9)', fontSize:12, fontWeight:600, marginBottom:4 }}>
            ℹ️ Pourquoi un import manuel ?
          </p>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:11, lineHeight:1.6 }}>
            Apple bloque l'accès à HealthKit depuis les applications web par mesure de sécurité.
            Pour synchroniser tes données, exporte-les depuis ton iPhone et importe le fichier ici.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:20 }}>
        <p style={{ fontSize:13, fontWeight:800, color:'var(--text-primary)', marginBottom:16 }}>
          Comment exporter depuis Apple Santé
        </p>
        {[
          { num:1, text: 'Ouvre l\'app Santé sur ton iPhone' },
          { num:2, text: 'Tape ton prénom en haut à droite → ton profil' },
          { num:3, text: 'Descends et appuie sur "Exporter toutes les données santé"' },
          { num:4, text: 'Partage le fichier .zip vers ton ordinateur (AirDrop, Mail, iCloud…)' },
          { num:5, text: 'Importe le fichier zip ou XML ci-dessous' },
        ].map(s => (
          <div key={s.num} style={{ display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' }}>
            <div style={{ width:24, height:24, borderRadius:8, background:'var(--accent)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:900, color:'#fff', flexShrink:0 }}>{s.num}</div>
            <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5, margin:0 }}>{s.text}</p>
          </div>
        ))}
      </div>

      {/* Zone de dépôt */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
        style={{ border:`2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius:16, padding:'36px 20px', textAlign:'center', cursor:'pointer',
          background: dragOver ? 'var(--accent-subtle)' : 'var(--bg-card)',
          transition:'all 0.2s' }}>
        <input ref={fileRef} type="file" accept=".xml,.zip" style={{ display:'none' }}
          onChange={e => handleFile(e.target.files[0])} />
        {file ? (
          <>
            <p style={{ fontSize:28, marginBottom:8 }}>📄</p>
            <p style={{ fontWeight:800, color:'var(--text-primary)', fontSize:14 }}>{file.name}</p>
            <p style={{ color:'var(--text-faint)', fontSize:12, marginTop:4 }}>
              {(file.size / 1024 / 1024).toFixed(1)} Mo — prêt à importer
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize:36, marginBottom:8 }}>📥</p>
            <p style={{ fontWeight:700, color:'var(--text-primary)', fontSize:14 }}>Glisse ton fichier ici</p>
            <p style={{ color:'var(--text-faint)', fontSize:12, marginTop:4 }}>ou clique pour choisir • .xml ou .zip</p>
          </>
        )}
      </div>

      {file && (
        <button onClick={() => onImport(file)} disabled={importing}
          style={{ padding:'14px 0', borderRadius:14, fontSize:14, fontWeight:800, cursor:'pointer',
            background:'var(--accent)', color:'#fff', border:'none',
            opacity: importing ? 0.7 : 1 }}>
          {importing ? '⟳ Import en cours…' : '🍎 Importer mes données Apple Santé'}
        </button>
      )}
    </div>
  )
}

function PlatformCard({ p, connection, onConnect, onSelect }) {
  const isConnected = !!connection?.connected
  return (
    <div
      onClick={() => onSelect(p.id)}
      style={{ background: isConnected ? p.bg : 'var(--bg-card)',
        border:`1px solid ${isConnected ? 'transparent' : 'var(--border)'}`,
        borderRadius:20, padding:'18px 20px', cursor:'pointer', transition:'all 0.25s',
        position:'relative', overflow:'hidden' }}
      onMouseEnter={e => { if (!isConnected) e.currentTarget.style.borderColor = p.color }}
      onMouseLeave={e => { if (!isConnected) e.currentTarget.style.borderColor = 'var(--border)' }}>

      {/* Glow si connecté */}
      {isConnected && (
        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120,
          borderRadius:'50%', background:`${p.color}30`, filter:'blur(24px)', pointerEvents:'none' }}/>
      )}

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:26 }}>{p.logo}</span>
          <div>
            <p style={{ fontSize:14, fontWeight:900, color: isConnected ? '#fff' : 'var(--text-primary)', margin:0 }}>{p.name}</p>
            {isConnected && (
              <span style={{ fontSize:9, background:'rgba(74,222,128,0.25)', color:'#4ade80',
                padding:'1px 7px', borderRadius:99, fontWeight:800 }}>● Connecté</span>
            )}
          </div>
        </div>
        <div style={{ width:8, height:8, borderRadius:'50%', marginTop:4,
          background: isConnected ? '#4ade80' : 'var(--border)' }}/>
      </div>

      <p style={{ fontSize:12, color: isConnected ? 'rgba(255,255,255,0.65)' : 'var(--text-faint)',
        lineHeight:1.5, marginBottom:14 }}>{p.description}</p>

      <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:14 }}>
        {p.metrics.slice(0,3).map(m => (
          <span key={m} style={{ fontSize:10, padding:'3px 8px', borderRadius:8, fontWeight:600,
            background: isConnected ? 'rgba(255,255,255,0.12)' : 'var(--bg-base)',
            color: isConnected ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
            border:`1px solid ${isConnected ? 'rgba(255,255,255,0.15)' : 'var(--border)'}` }}>
            {m}
          </span>
        ))}
        {p.metrics.length > 3 && (
          <span style={{ fontSize:10, padding:'3px 8px', borderRadius:8, fontWeight:600,
            color:'var(--text-faint)', background:'var(--bg-base)', border:'1px solid var(--border)' }}>
            +{p.metrics.length - 3}
          </span>
        )}
      </div>

      <button
        onClick={e => { e.stopPropagation(); isConnected ? onSelect(p.id) : onConnect(p.id) }}
        style={{ width:'100%', padding:'10px 0', borderRadius:12, fontSize:12, fontWeight:800,
          cursor:'pointer', border:'none', transition:'all 0.2s',
          background: isConnected ? 'rgba(255,255,255,0.15)' : `${p.color}22`,
          color: isConnected ? '#fff' : p.color }}>
        {isConnected ? 'Voir les données →' : (p.isManual ? '📥 Importer' : '🔗 Connecter')}
      </button>
    </div>
  )
}

export default function HealthIntegrations() {
  const { token } = useStore()
  const [connections, setConnections] = useState({})
  const [selected, setSelected] = useState(null)
  const [connecting, setConnecting] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    axios.get(`${API}/health/connections`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => { setConnections(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const handleConnect = async (platformId) => {
    const p = PLATFORMS.find(x => x.id === platformId)
    if (p.isManual) { setSelected(platformId); return }

    setConnecting(platformId)
    try {
      const res = await axios.get(`${API}/health/connect/${platformId}`, {
        headers: { Authorization:`Bearer ${token}` }
      })
      // Ouvre le popup OAuth
      const popup = window.open(res.data.authUrl, `oauth_${platformId}`,
        'width=600,height=700,scrollbars=yes,resizable=yes')

      // Écoute le message de retour du popup (callback)
      const listener = (e) => {
        if (e.origin !== window.location.origin) return
        if (e.data?.type === 'oauth_success' && e.data?.platform === platformId) {
          window.removeEventListener('message', listener)
          setConnections(prev => ({ ...prev, [platformId]: { connected:true, lastSync: new Date().toISOString() } }))
          showToast(`${p.name} connecté avec succès !`)
          setSelected(platformId)
          setConnecting(null)
        }
      }
      window.addEventListener('message', listener)

      // Simule une connexion réussie après 2s (démo sans vraies clés API)
      setTimeout(async () => {
        window.removeEventListener('message', listener)
        popup?.close()
        try {
          await axios.post(`${API}/health/mock-connect/${platformId}`, {}, {
            headers: { Authorization:`Bearer ${token}` }
          })
          setConnections(prev => ({ ...prev, [platformId]: { connected:true, lastSync: new Date().toISOString() } }))
          showToast(`${p.name} connecté avec succès !`)
          setSelected(platformId)
        } catch {}
        setConnecting(null)
      }, 1800)

    } catch {
      showToast('Erreur de connexion', false)
      setConnecting(null)
    }
  }

  const handleDisconnect = async (platformId) => {
    const p = PLATFORMS.find(x => x.id === platformId)
    try {
      await axios.delete(`${API}/health/disconnect/${platformId}`, {
        headers: { Authorization:`Bearer ${token}` }
      })
      setConnections(prev => { const n = {...prev}; delete n[platformId]; return n })
      setSelected(null)
      showToast(`${p.name} déconnecté`)
    } catch { showToast('Erreur', false) }
  }

  const handleSync = async (platformId) => {
    setSyncing(true)
    try {
      await axios.post(`${API}/health/sync/${platformId}`, {}, {
        headers: { Authorization:`Bearer ${token}` }
      })
      setConnections(prev => ({ ...prev, [platformId]: { ...prev[platformId], lastSync: new Date().toISOString() } }))
      showToast('Données synchronisées !')
    } catch { showToast('Erreur de synchronisation', false) }
    setSyncing(false)
  }

  const handleAppleImport = async (file) => {
    setImporting(true)
    // Simule le parsing (en prod : envoyer le fichier au backend qui parse le XML)
    await new Promise(r => setTimeout(r, 2000))
    try {
      await axios.post(`${API}/health/mock-connect/apple`, {}, {
        headers: { Authorization:`Bearer ${token}` }
      })
      setConnections(prev => ({ ...prev, apple: { connected:true, lastSync: new Date().toISOString(), imported:true } }))
      showToast('Données Apple Santé importées !')
      setSelected('apple')
    } catch {}
    setImporting(false)
  }

  const connectedCount = Object.values(connections).filter(c => c?.connected).length
  const selectedPlatform = PLATFORMS.find(x => x.id === selected)

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', padding:'32px 28px' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:9999,
          background: toast.ok ? 'var(--accent)' : '#ef4444',
          color:'#fff', padding:'12px 20px', borderRadius:14, fontWeight:700, fontSize:13,
          boxShadow:'0 8px 24px rgba(0,0,0,0.25)', animation:'fadeDown 0.3s ease' }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <span style={{ fontSize:28 }}>🔗</span>
          <h1 style={{ fontSize:26, fontWeight:900, color:'var(--text-primary)', margin:0 }}>
            Intégrations Santé
          </h1>
        </div>
        <p style={{ color:'var(--text-faint)', fontSize:14, marginBottom:0 }}>
          Connecte tes appareils et applications pour centraliser toutes tes données dans ULTRA.
        </p>
        {connectedCount > 0 && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:10,
            background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.25)',
            borderRadius:99, padding:'4px 12px' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80' }}/>
            <span style={{ fontSize:12, fontWeight:700, color:'#4ade80' }}>
              {connectedCount} application{connectedCount > 1 ? 's' : ''} connectée{connectedCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap:24, alignItems:'start' }}>

        {/* Liste des plateformes */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {!selected && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:14 }}>
              {PLATFORMS.map(p => (
                <PlatformCard key={p.id} p={p}
                  connection={connections[p.id]}
                  onConnect={handleConnect}
                  onSelect={setSelected} />
              ))}
            </div>
          )}

          {selected && (
            <>
              {/* Bouton retour */}
              <button onClick={() => setSelected(null)}
                style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700,
                  color:'var(--text-secondary)', background:'none', border:'none', cursor:'pointer', padding:'4px 0', marginBottom:4 }}>
                ← Toutes les intégrations
              </button>

              {/* Carte sélectionnée */}
              {PLATFORMS.map(p => (
                <div key={p.id}
                  onClick={() => setSelected(p.id)}
                  style={{ background: selected===p.id ? p.bg : 'var(--bg-card)',
                    border:`1px solid ${selected===p.id ? 'transparent' : 'var(--border)'}`,
                    borderRadius:16, padding:'14px 16px', cursor:'pointer', display:'flex',
                    alignItems:'center', gap:12, transition:'all 0.2s' }}>
                  <span style={{ fontSize:22 }}>{p.logo}</span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:800, color: selected===p.id ? '#fff' : 'var(--text-primary)', margin:0 }}>{p.name}</p>
                    {connections[p.id]?.connected
                      ? <span style={{ fontSize:10, color:'#4ade80', fontWeight:700 }}>● Connecté</span>
                      : <span style={{ fontSize:10, color:'var(--text-faint)', fontWeight:600 }}>Non connecté</span>}
                  </div>
                  {!connections[p.id]?.connected && (
                    <button
                      onClick={e => { e.stopPropagation(); handleConnect(p.id) }}
                      disabled={connecting === p.id}
                      style={{ padding:'6px 12px', borderRadius:10, fontSize:11, fontWeight:700,
                        cursor:'pointer', border:'none', background:`${p.color}22`, color:p.color,
                        opacity: connecting===p.id ? 0.6 : 1 }}>
                      {connecting===p.id ? '⟳' : (p.isManual ? '📥' : '+')}
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Panneau de droite — vue détaillée */}
        {selected && (
          <div>
            {selectedPlatform?.isManual && !connections[selected]?.connected
              ? <AppleImportView onImport={handleAppleImport} importing={importing} />
              : connections[selected]?.connected
                ? <ConnectedView
                    platform={selected}
                    data={connections[selected]}
                    onDisconnect={() => handleDisconnect(selected)}
                    onSync={() => handleSync(selected)}
                    syncing={syncing} />
                : (
                  <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
                    borderRadius:20, padding:40, textAlign:'center' }}>
                    <span style={{ fontSize:48 }}>{selectedPlatform?.logo}</span>
                    <h3 style={{ fontSize:18, fontWeight:900, color:'var(--text-primary)', marginTop:12 }}>
                      Connecter {selectedPlatform?.name}
                    </h3>
                    <p style={{ color:'var(--text-faint)', fontSize:13, marginBottom:24, lineHeight:1.6 }}>
                      {selectedPlatform?.description}
                    </p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginBottom:28 }}>
                      {selectedPlatform?.metrics.map(m => (
                        <span key={m} style={{ fontSize:11, padding:'5px 12px', borderRadius:10, fontWeight:600,
                          background:'var(--bg-base)', color:'var(--text-secondary)', border:'1px solid var(--border)' }}>
                          {m}
                        </span>
                      ))}
                    </div>
                    <button onClick={() => handleConnect(selected)} disabled={connecting === selected}
                      style={{ padding:'14px 32px', borderRadius:14, fontSize:14, fontWeight:800, cursor:'pointer',
                        background: selectedPlatform?.color, color:'#fff', border:'none',
                        opacity: connecting===selected ? 0.7 : 1,
                        boxShadow:`0 8px 24px ${selectedPlatform?.color}44` }}>
                      {connecting === selected ? '⟳ Connexion…' : `🔗 Connecter ${selectedPlatform?.name}`}
                    </button>
                  </div>
                )
            }
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  )
}
