import { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function ClientHealthAccess() {
  const { fetchConsents, createConsent, revokeConsent, fetchDiscoverExperts, fetchCoaches, fetchRecords } = useStore()
  const [consents, setConsents] = useState([])
  const [records, setRecords]   = useState([])
  const [pros, setPros]   = useState([])
  const [coaches, setCoaches] = useState([])
  const [proId, setProId]     = useState('')
  const [coachId, setCoachId] = useState('')
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState('')

  const load = async () => {
    const [c, r] = await Promise.all([fetchConsents(), fetchRecords()])
    setConsents(c); setRecords(r)
  }
  useEffect(() => {
    load()
    fetchDiscoverExperts({}).then(list => setPros((list || []).filter(e => e.role === 'health_pro')))
    fetchCoaches().then(list => setCoaches(list || []))
  }, [])

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const grant = async () => {
    if (!proId || !coachId) { showToast('✗ Choisis un pro et un coach'); return }
    setSaving(true)
    const res = await createConsent(proId, coachId)
    setSaving(false)
    if (res.success) { showToast('✓ Autorisation accordée'); setProId(''); setCoachId(''); load() }
    else showToast('✗ ' + (res.error || 'Erreur'))
  }

  const revoke = async (id) => {
    await revokeConsent(id); load()
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast[0]==='✓'?'var(--accent)':'#ef4444', color: '#fff', padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 13 }}>{toast}</div>}

        <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--gold)' }}>Confidentialité & santé</p>
        <h1 className="font-black mb-1" style={{ color: 'var(--text-primary)', fontSize: 'clamp(22px,5vw,32px)' }}>Mes pros de santé</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)', maxWidth: 540 }}>
          Autorise un professionnel de santé à partager tes bilans avec ton coach. Toi seul décides — tu peux retirer l'accès à tout moment.
        </p>

        {/* Nouvelle autorisation */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] font-black tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>+ Nouvelle autorisation</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-faint)' }}>Professionnel de santé</label>
              <select value={proId} onChange={e => setProId(e.target.value)}
                style={{ width:'100%', padding:'11px 12px', borderRadius:10, fontSize:13, background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-primary)', outline:'none' }}>
                <option value="">— Choisir —</option>
                {pros.map(p => <option key={p.id} value={p.id}>{p.name} · {p.profession}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-faint)' }}>Partager avec mon coach</label>
              <select value={coachId} onChange={e => setCoachId(e.target.value)}
                style={{ width:'100%', padding:'11px 12px', borderRadius:10, fontSize:13, background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-primary)', outline:'none' }}>
                <option value="">— Choisir —</option>
                {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={grant} disabled={saving}
            className="w-full py-3 rounded-xl font-black text-white" style={{ background: 'var(--accent)', opacity: saving?0.7:1 }}>
            {saving ? 'Enregistrement…' : '🛡️ Autoriser le partage'}
          </button>
        </div>

        {/* Autorisations actives */}
        <p className="text-[11px] font-black tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Autorisations actives ({consents.length})</p>
        {consents.length === 0 ? (
          <div className="rounded-2xl p-8 text-center mb-6" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
            <p className="text-3xl mb-2">🔒</p>
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Aucune autorisation. Tes données restent privées.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {consents.map(c => (
              <div key={c.id} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(14,165,233,0.12)' }}>🩺</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>{c.proName} <span style={{ color:'var(--text-faint)', fontWeight:600 }}>· {c.proProfession}</span></p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>partage avec 🎓 {c.coachName}</p>
                </div>
                <button onClick={() => revoke(c.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bilans reçus */}
        <p className="text-[11px] font-black tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Mes bilans ({records.length})</p>
        {records.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Aucun bilan déposé pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map(r => (
              <div key={r.id} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                  <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{r.note}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Par {r.proName} ({r.proProfession}) · partagé à ton coach</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
