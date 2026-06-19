import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const STATUS_CFG = {
  active:    { label: 'Active',     color: '#22c55e', bg: '#22c55e18' },
  scheduled: { label: 'Programmée', color: '#0ea5e9', bg: '#0ea5e918' },
  expired:   { label: 'Expirée',    color: '#94a3b8', bg: '#94a3b818' },
  paused:    { label: 'En pause',   color: '#f59e0b', bg: '#f59e0b18' },
}

const GROUP_COLORS = ['#8b1a2e', '#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']

const QUICK_DURATIONS = [
  { label: '24h', days: 1 },
  { label: '3 jours', days: 3 },
  { label: '7 jours', days: 7 },
  { label: '14 jours', days: 14 },
  { label: '30 jours', days: 30 },
  { label: 'Sans fin', days: null },
]

function fmtDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export default function PromotionsManager() {
  const navigate = useNavigate()
  const { token, user } = useStore()
  const [tab, setTab] = useState('promos')
  const [promos, setPromos] = useState([])
  const [groups, setGroups] = useState({ manual: [], segments: [] })
  const [myPrograms, setMyPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPromoForm, setShowPromoForm] = useState(false)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [editingGroup, setEditingGroup] = useState(null)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [pr, gr, progs] = await Promise.all([
        fetch(`${API}/promotions`, { headers }).then(r => r.json()),
        fetch(`${API}/groups`, { headers }).then(r => r.json()),
        fetch(`${API}/programs`, { headers }).then(r => r.json()),
      ])
      setPromos(Array.isArray(pr) ? pr : [])
      setGroups(gr && gr.segments ? gr : { manual: [], segments: [] })
      setMyPrograms(Array.isArray(progs) ? progs.filter(p => p.coachId === user?.id && p.price > 0) : [])
    } catch {}
    setLoading(false)
  }

  async function togglePromo(p) {
    await fetch(`${API}/promotions/${p.id}`, { method: 'PUT', headers, body: JSON.stringify({ active: !p.active }) })
    loadAll()
  }
  async function deletePromo(id) {
    if (!confirm('Supprimer cette promotion ?')) return
    await fetch(`${API}/promotions/${id}`, { method: 'DELETE', headers })
    loadAll()
  }
  async function deleteGroup(id) {
    if (!confirm('Supprimer ce groupe ?')) return
    await fetch(`${API}/groups/${id}`, { method: 'DELETE', headers })
    loadAll()
  }

  const activeCount = promos.filter(p => p.status === 'active').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 20, cursor: 'pointer' }}>←</button>
          <div>
            <p style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)' }}>Promotions & Groupes</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {activeCount} promo{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''} · {groups.manual.length} groupe{groups.manual.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(16px,4vw,24px)' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[{ k: 'promos', l: '🏷️ Promotions' }, { k: 'groups', l: '👥 Groupes' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              flex: 1, padding: '11px', borderRadius: 12,
              border: `1px solid ${tab === t.k ? 'var(--accent)' : 'var(--border)'}`,
              background: tab === t.k ? 'var(--accent)' : 'var(--bg-card)',
              color: tab === t.k ? '#fff' : 'var(--text-secondary)',
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}>{t.l}</button>
          ))}
        </div>

        {/* ── PROMOS TAB ── */}
        {tab === 'promos' && (
          <>
            <button onClick={() => { setEditingPromo(null); setShowPromoForm(true) }} style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: 'var(--accent)', color: '#fff', fontWeight: 900, fontSize: 15,
              cursor: 'pointer', marginBottom: 18,
            }}>+ Nouvelle promotion</button>

            {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Chargement…</p>}

            {!loading && promos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 44, marginBottom: 12 }}>🏷️</p>
                <p style={{ fontWeight: 900, fontSize: 17, color: 'var(--text-primary)', marginBottom: 6 }}>Aucune promotion</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto' }}>
                  Crée une réduction limitée dans le temps, ciblée sur tous tes clients, un groupe précis, ou via un code public.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {promos.map(p => (
                <PromoCard key={p.id} promo={p} groups={groups}
                  onToggle={() => togglePromo(p)}
                  onEdit={() => { setEditingPromo(p); setShowPromoForm(true) }}
                  onDelete={() => deletePromo(p.id)} />
              ))}
            </div>
          </>
        )}

        {/* ── GROUPS TAB ── */}
        {tab === 'groups' && (
          <>
            <button onClick={() => { setEditingGroup(null); setShowGroupForm(true) }} style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: 'var(--accent)', color: '#fff', fontWeight: 900, fontSize: 15,
              cursor: 'pointer', marginBottom: 18,
            }}>+ Nouveau groupe</button>

            {/* Segments auto */}
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Segments automatiques
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 24 }}>
              {groups.segments.map(s => (
                <div key={s.key} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px' }}>
                  <p style={{ fontSize: 22 }}>{s.emoji}</p>
                  <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', marginTop: 4 }}>{s.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginTop: 2 }}>{s.count} client{s.count > 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>

            {/* Groupes manuels */}
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Mes groupes
            </p>
            {groups.manual.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '16px', background: 'var(--bg-card)', borderRadius: 14, border: '1px dashed var(--border)' }}>
                Aucun groupe manuel. Crée un groupe pour cibler une promo sur des clients choisis.
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {groups.manual.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ width: 10, height: 40, borderRadius: 6, background: g.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{g.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.count} client{g.count > 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => { setEditingGroup(g); setShowGroupForm(true) }} style={iconBtn}>✎</button>
                  <button onClick={() => deleteGroup(g.id)} style={{ ...iconBtn, color: '#ef4444' }}>🗑</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showPromoForm && (
        <PromoForm token={token} groups={groups} myPrograms={myPrograms} editing={editingPromo}
          onClose={() => setShowPromoForm(false)} onSaved={() => { setShowPromoForm(false); loadAll() }} />
      )}
      {showGroupForm && (
        <GroupForm token={token} editing={editingGroup}
          onClose={() => setShowGroupForm(false)} onSaved={() => { setShowGroupForm(false); loadAll() }} />
      )}
    </div>
  )
}

const iconBtn = { background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, width: 34, height: 34, fontSize: 14, cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }

function PromoCard({ promo, groups, onToggle, onEdit, onDelete }) {
  const st = STATUS_CFG[promo.status] || STATUS_CFG.active
  const discount = promo.type === 'percent' ? `-${promo.value}%` : `-${promo.value}€`
  const scopeLabel = { programs: 'Programmes', subscription: 'Abonnement', both: 'Programmes + Abo' }[promo.scope]
  let targetLabel = 'Tous les clients'
  if (promo.target === 'group') targetLabel = groups.manual.find(g => g.id === promo.groupId)?.name || 'Groupe'
  if (promo.target === 'segment') targetLabel = groups.segments.find(s => s.key === promo.segment)?.label || 'Segment'
  if (promo.target === 'code') targetLabel = `Code ${promo.code}`

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px', opacity: promo.status === 'expired' ? 0.6 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 58, height: 58, borderRadius: 14, background: 'var(--accent)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{discount}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: 'var(--text-primary)' }}>{promo.name}</span>
            <span style={{ background: st.bg, color: st.color, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>{st.label}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            {scopeLabel} · {targetLabel}{promo.target !== 'code' ? ` (${promo.audienceCount})` : ''}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
            {fmtDate(promo.startAt) || 'maintenant'} → {fmtDate(promo.endAt) || '∞'}
            {promo.usageCount > 0 && ` · ${promo.usageCount} utilisation${promo.usageCount > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={onToggle} style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-base)', color: promo.active ? '#f59e0b' : '#22c55e', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          {promo.active ? '⏸ Mettre en pause' : '▶ Réactiver'}
        </button>
        <button onClick={onEdit} style={{ ...iconBtn, width: 38 }}>✎</button>
        <button onClick={onDelete} style={{ ...iconBtn, width: 38, color: '#ef4444' }}>🗑</button>
      </div>
    </div>
  )
}

const sheetWrap = { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }
const sheet = { background: 'var(--bg-card)', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', padding: '20px' }
const label = { fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, marginTop: 16 }
const input = { width: '100%', padding: '11px 13px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' }

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} type="button" style={{
      padding: '8px 13px', borderRadius: 20,
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'var(--accent)' : 'var(--bg-base)',
      color: active ? '#fff' : 'var(--text-secondary)',
      fontSize: 13, fontWeight: 700, cursor: 'pointer',
    }}>{children}</button>
  )
}

function PromoForm({ token, groups, myPrograms, editing, onClose, onSaved }) {
  const [name, setName] = useState(editing?.name || '')
  const [scope, setScope] = useState(editing?.scope || 'both')
  const [type, setType] = useState(editing?.type || 'percent')
  const [value, setValue] = useState(editing?.value || 20)
  const [target, setTarget] = useState(editing?.target || 'all')
  const [groupId, setGroupId] = useState(editing?.groupId || (groups.manual[0]?.id || ''))
  const [segment, setSegment] = useState(editing?.segment || 'nouveaux')
  const [code, setCode] = useState(editing?.code || '')
  const [programIds, setProgramIds] = useState(editing?.programIds || [])
  const [durationDays, setDurationDays] = useState(7)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  async function save() {
    if (!name.trim()) { setError('Donne un nom à ta promo'); return }
    if (!value || value <= 0) { setError('Indique une réduction valide'); return }
    if (target === 'code' && !code.trim()) { setError('Indique un code promo'); return }
    setSaving(true); setError('')
    const startAt = new Date().toISOString()
    const endAt = durationDays ? new Date(Date.now() + durationDays * 86400000).toISOString() : null
    const body = {
      name, scope, type, value: Number(value), target,
      groupId: target === 'group' ? groupId : null,
      segment: target === 'segment' ? segment : null,
      code: target === 'code' ? code : null,
      programIds: scope !== 'subscription' ? programIds : [],
      startAt, endAt,
    }
    try {
      const url = editing ? `${API}/promotions/${editing.id}` : `${API}/promotions`
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur')
      onSaved()
    } catch (e) { setError(e.message); setSaving(false) }
  }

  function toggleProgram(id) {
    setProgramIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div style={sheetWrap} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 900, fontSize: 18, color: 'var(--text-primary)' }}>{editing ? 'Modifier la promo' : 'Nouvelle promotion'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-faint)', cursor: 'pointer' }}>✕</button>
        </div>

        <label style={label}>Nom de la promo</label>
        <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="Soldes de printemps" />

        <label style={label}>S'applique à</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Chip active={scope === 'programs'} onClick={() => setScope('programs')}>Programmes</Chip>
          <Chip active={scope === 'subscription'} onClick={() => setScope('subscription')}>Abonnement</Chip>
          <Chip active={scope === 'both'} onClick={() => setScope('both')}>Les deux</Chip>
        </div>

        <label style={label}>Réduction</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Chip active={type === 'percent'} onClick={() => setType('percent')}>%</Chip>
          <Chip active={type === 'fixed'} onClick={() => setType('fixed')}>€</Chip>
          <input style={{ ...input, width: 90 }} type="number" min="1" value={value} onChange={e => setValue(e.target.value)} />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>{type === 'percent' ? '% de remise' : '€ de remise'}</span>
        </div>

        {scope !== 'subscription' && myPrograms.length > 0 && (
          <>
            <label style={label}>Programmes concernés {programIds.length === 0 && <span style={{ color: 'var(--text-faint)', fontWeight: 600 }}>(tous par défaut)</span>}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
              {myPrograms.map(p => (
                <button key={p.id} type="button" onClick={() => toggleProgram(p.id)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10,
                  border: `1px solid ${programIds.includes(p.id) ? 'var(--accent)' : 'var(--border)'}`,
                  background: programIds.includes(p.id) ? 'var(--accent-subtle)' : 'var(--bg-base)', cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.title}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.price}€ {programIds.includes(p.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <label style={label}>Cible</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Chip active={target === 'all'} onClick={() => setTarget('all')}>Tous mes clients</Chip>
          <Chip active={target === 'segment'} onClick={() => setTarget('segment')}>Segment auto</Chip>
          <Chip active={target === 'group'} onClick={() => setTarget('group')}>Groupe</Chip>
          <Chip active={target === 'code'} onClick={() => setTarget('code')}>Code public</Chip>
        </div>

        {target === 'segment' && (
          <select style={{ ...input, marginTop: 10 }} value={segment} onChange={e => setSegment(e.target.value)}>
            {groups.segments.map(s => <option key={s.key} value={s.key}>{s.label} ({s.count})</option>)}
          </select>
        )}
        {target === 'group' && (
          groups.manual.length > 0 ? (
            <select style={{ ...input, marginTop: 10 }} value={groupId} onChange={e => setGroupId(e.target.value)}>
              {groups.manual.map(g => <option key={g.id} value={g.id}>{g.name} ({g.count})</option>)}
            </select>
          ) : (
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 10 }}>Crée d'abord un groupe dans l'onglet Groupes.</p>
          )
        )}
        {target === 'code' && (
          <input style={{ ...input, marginTop: 10, textTransform: 'uppercase' }} value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="SUMMER20" />
        )}

        <label style={label}>Durée</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUICK_DURATIONS.map(d => (
            <Chip key={d.label} active={durationDays === d.days} onClick={() => setDurationDays(d.days)}>{d.label}</Chip>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
          Démarre maintenant{durationDays ? `, se termine dans ${durationDays} jour${durationDays > 1 ? 's' : ''}` : ', sans date de fin'}.
        </p>

        {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12, fontWeight: 600 }}>{error}</p>}

        <button onClick={save} disabled={saving} style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          background: 'var(--accent)', color: '#fff', fontWeight: 900, fontSize: 15,
          cursor: saving ? 'not-allowed' : 'pointer', marginTop: 18,
        }}>{saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Lancer la promo'}</button>
      </div>
    </div>
  )
}

function GroupForm({ token, editing, onClose, onSaved }) {
  const [name, setName] = useState(editing?.name || '')
  const [color, setColor] = useState(editing?.color || GROUP_COLORS[0])
  const [selected, setSelected] = useState(editing?.clientIds || [])
  const [clients, setClients] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    fetch(`${API}/groups/clients`, { headers }).then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function save() {
    if (!name.trim()) { setError('Donne un nom au groupe'); return }
    setSaving(true); setError('')
    const body = { name, color, clientIds: selected }
    try {
      const url = editing ? `${API}/groups/${editing.id}` : `${API}/groups`
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur')
      onSaved()
    } catch (e) { setError(e.message); setSaving(false) }
  }

  return (
    <div style={sheetWrap} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 900, fontSize: 18, color: 'var(--text-primary)' }}>{editing ? 'Modifier le groupe' : 'Nouveau groupe'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-faint)', cursor: 'pointer' }}>✕</button>
        </div>

        <label style={label}>Nom du groupe</label>
        <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="Clients fidèles" />

        <label style={label}>Couleur</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {GROUP_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)} style={{
              width: 34, height: 34, borderRadius: '50%', background: c, cursor: 'pointer',
              border: color === c ? '3px solid var(--text-primary)' : '3px solid transparent',
            }} />
          ))}
        </div>

        <label style={label}>Clients ({selected.length} sélectionné{selected.length > 1 ? 's' : ''})</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
          {clients.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucun client pour le moment.</p>}
          {clients.map(c => {
            const on = selected.includes(c.id)
            return (
              <button key={c.id} type="button" onClick={() => toggle(c.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11,
                border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                background: on ? 'var(--accent-subtle)' : 'var(--bg-base)', cursor: 'pointer',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: c.avatarColor || 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}{c.isPremium && ' ⭐'}</p>
                </div>
                <span style={{ fontSize: 16, color: on ? 'var(--accent)' : 'var(--text-faint)' }}>{on ? '☑' : '☐'}</span>
              </button>
            )
          })}
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12, fontWeight: 600 }}>{error}</p>}

        <button onClick={save} disabled={saving} style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          background: 'var(--accent)', color: '#fff', fontWeight: 900, fontSize: 15,
          cursor: saving ? 'not-allowed' : 'pointer', marginTop: 18,
        }}>{saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer le groupe'}</button>
      </div>
    </div>
  )
}
