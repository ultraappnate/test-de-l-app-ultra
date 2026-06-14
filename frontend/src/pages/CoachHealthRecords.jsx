import { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function CoachHealthRecords() {
  const { fetchRecords, fetchConsents } = useStore()
  const [records, setRecords]   = useState([])
  const [consents, setConsents] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([fetchRecords(), fetchConsents()]).then(([r, c]) => {
      setRecords(r); setConsents(c); setLoading(false)
    })
  }, [])

  // Grouper les bilans par patient
  const byClient = {}
  records.forEach(r => { (byClient[r.clientId] ||= []).push(r) })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', padding: 'clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--gold)' }}>Coach · Suivi santé</p>
        <h1 className="font-black mb-1" style={{ color: 'var(--text-primary)', fontSize: 'clamp(22px,5vw,32px)' }}>Bilans santé</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)', maxWidth: 560 }}>
          Les bilans partagés par les professionnels de santé de tes clients. Adapte leurs programmes en conséquence.
        </p>

        {/* Patients suivis */}
        {consents.length > 0 && (
          <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[11px] font-black tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Patients avec suivi santé ({consents.length})</p>
            <div className="flex flex-wrap gap-2">
              {consents.map(c => (
                <span key={c.id} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                  {c.clientName} · 🩺 {c.proName}
                </span>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div style={{ width:30, height:30, borderRadius:'50%', border:'3px solid var(--border)', borderTopColor:'var(--accent)', animation:'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
            <p className="text-4xl mb-3">📋</p>
            <p className="font-black text-base" style={{ color: 'var(--text-primary)' }}>Aucun bilan reçu</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>
              Quand un kiné, ostéo ou médecin partage un bilan d'un de tes clients, il apparaît ici.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(byClient).map(([clientId, recs]) => (
              <div key={clientId}>
                <p className="text-sm font-black mb-2" style={{ color: 'var(--text-primary)' }}>👤 {recs[0].clientName}</p>
                <div className="space-y-2">
                  {recs.map(r => (
                    <div key={r.id} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid #0ea5e9' }}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.note}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(14,165,233,0.12)', color: '#0ea5e9' }}>
                          🩺 {r.proName} · {r.proProfession}
                        </span>
                        {r.hasFile && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-base)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>📎 {r.fileName}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
