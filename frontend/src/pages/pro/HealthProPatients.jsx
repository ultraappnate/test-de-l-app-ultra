import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'

export default function HealthProPatients() {
  const navigate = useNavigate()
  const { fetchConsents, fetchRecords, createRecord } = useStore()
  const [consents, setConsents] = useState([])
  const [records, setRecords]   = useState([])
  const [active, setActive]     = useState(null)   // consent en cours de dépôt
  const [form, setForm] = useState({ title: '', note: '', fileName: null, fileData: null })
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState('')
  const fileRef = useRef()

  const load = async () => {
    const [c, r] = await Promise.all([fetchConsents(), fetchRecords()])
    setConsents(c); setRecords(r)
  }
  useEffect(() => { load() }, [])

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const handleFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const rd = new FileReader()
    rd.onload = () => setForm(f => ({ ...f, fileName: file.name, fileData: rd.result }))
    rd.readAsDataURL(file)
  }

  const submit = async () => {
    if (!form.title.trim() || !form.note.trim()) { showToast('✗ Titre et note requis'); return }
    setSaving(true)
    const res = await createRecord({ consentId: active.id, ...form })
    setSaving(false)
    if (res.success) { showToast('✓ Bilan partagé au coach'); setActive(null); setForm({ title:'', note:'', fileName:null, fileData:null }); load() }
    else showToast('✗ ' + (res.error || 'Erreur'))
  }

  const recordsFor = (clientId) => records.filter(r => r.clientId === clientId)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {toast && <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: toast[0]==='✓'?'var(--accent)':'#ef4444', color:'#fff', padding:'12px 20px', borderRadius:14, fontWeight:700, fontSize:13 }}>{toast}</div>}

        <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--gold)' }}>🩺 Espace santé</p>
        <h1 className="font-black mb-1" style={{ color: 'var(--text-primary)', fontSize: 'clamp(22px,5vw,32px)' }}>Mes patients</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)', maxWidth: 540 }}>
          Les sportifs qui t'ont autorisé à partager des bilans avec leur coach.
        </p>

        {consents.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
            <p className="text-4xl mb-3">👥</p>
            <p className="font-black text-base" style={{ color: 'var(--text-primary)' }}>Aucun patient pour le moment</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>
              Tes patients t'autorisent depuis leur espace "Mes pros de santé". Tu apparais dans leur liste si tu es sur la carte.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {consents.map(c => {
              const recs = recordsFor(c.clientId)
              return (
                <div key={c.id} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0" style={{ background: '#0ea5e9' }}>
                      {c.clientName?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>{c.clientName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Coach : 🎓 {c.coachName} · {recs.length} bilan{recs.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => navigate(`/client/${c.clientId}`)}
                        className="text-xs font-bold px-3 py-2 rounded-lg"
                        style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        👤 Profil
                      </button>
                      <button onClick={() => { setActive(c); setForm({ title:'', note:'', fileName:null, fileData:null }) }}
                        className="text-xs font-bold px-3 py-2 rounded-lg"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                        + Déposer un bilan
                      </button>
                    </div>
                  </div>
                  {recs.length > 0 && (
                    <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                      {recs.map(r => (
                        <div key={r.id} className="flex items-center gap-2 text-xs">
                          <span>📋</span>
                          <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{r.title}</span>
                          <span style={{ color: 'var(--text-faint)' }}>· {new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal dépôt de bilan */}
      {active && (
        <div onClick={() => setActive(null)} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:480, background:'var(--bg-card)', borderRadius:20, border:'1px solid var(--border)', padding:20, maxHeight:'90vh', overflowY:'auto' }}>
            <p className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: 'var(--text-faint)' }}>Nouveau bilan</p>
            <h3 className="font-black text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Bilan pour {active.clientName}</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>Sera partagé à 🎓 {active.coachName}</p>

            <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Titre</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex : Entorse cheville gauche"
              style={{ width:'100%', padding:'11px 12px', borderRadius:10, fontSize:14, marginBottom:14, background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-primary)', outline:'none', boxSizing:'border-box' }} />

            <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Compte-rendu / consignes</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Ex : Repos sportif 3 semaines. Pas de saut ni de course. Renforcement progressif des chevilles autorisé."
              style={{ width:'100%', padding:'11px 12px', borderRadius:10, fontSize:14, minHeight:110, resize:'vertical', marginBottom:14, background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-primary)', outline:'none', boxSizing:'border-box' }} />

            <button onClick={() => fileRef.current?.click()} className="text-xs font-bold px-3 py-2 rounded-lg mb-4"
              style={{ background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-secondary)' }}>
              📎 {form.fileName ? form.fileName : 'Joindre un document (PDF, image)'}
            </button>
            <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFile} />

            <div className="flex gap-2">
              <button onClick={() => setActive(null)} className="flex-1 py-3 rounded-xl font-bold"
                style={{ background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-secondary)' }}>Annuler</button>
              <button onClick={submit} disabled={saving} className="flex-1 py-3 rounded-xl font-black text-white"
                style={{ background:'var(--accent)', opacity: saving?0.7:1 }}>{saving ? 'Envoi…' : 'Partager au coach'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
