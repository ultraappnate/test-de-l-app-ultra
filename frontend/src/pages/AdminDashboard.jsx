import { useEffect, useState, useCallback } from 'react'
import { useStore } from '../store'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

import API from '../config.js'
const ROLE_COLOR = { admin: '#e8a020', coach: '#2980b9', client: '#a03848', nutritionist: '#8e44ad' }
const ROLE_LABEL = { admin: 'Admin', coach: 'Coach', client: 'Client', nutritionist: 'Nutritionniste' }
const ROLE_ICON  = { admin: '👑', coach: '🎓', client: '💪', nutritionist: '🥗' }

/* ── Utils ── */
function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  const now = new Date()
  const diff = (now - dt) / 1000
  if (diff < 60)   return 'À l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff/3600)}h`
  return dt.toLocaleDateString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
}

/* ── Shared components ── */
function RoleBadge({ role }) {
  const c = ROLE_COLOR[role] || '#6b7280'
  return <span style={{ display:'inline-flex', alignItems:'center', gap:5, whiteSpace:'nowrap',
    background:`${c}18`, color:c, border:`1px solid ${c}40`, padding:'4px 11px', borderRadius:99,
    fontSize:11, fontWeight:700, lineHeight:1.2, maxWidth:'100%' }}>
    <span>{ROLE_ICON[role]}</span>
    <span>{ROLE_LABEL[role] || role}</span>
  </span>
}

function KpiCard({ icon, label, value, sub, color='var(--accent)', delay=0 }) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(()=>setV(true), delay); return ()=>clearTimeout(t) }, [delay])
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:'20px 22px',
      opacity:v?1:0, transform:v?'translateY(0)':'translateY(16px)', transition:'opacity 0.5s ease, transform 0.5s ease' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-faint)' }}>{label}</p>
        <span style={{ fontSize:20 }}>{icon}</span>
      </div>
      <p style={{ fontSize:30, fontWeight:900, color, lineHeight:1 }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:'var(--text-faint)', marginTop:5 }}>{sub}</p>}
    </div>
  )
}

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div style={{ position:'fixed', top:24, right:24, zIndex:9999, padding:'12px 20px', borderRadius:14,
      fontWeight:700, fontSize:13, background:toast.ok?'#22c55e':'#ef4444', color:'#fff',
      boxShadow:'0 8px 24px rgba(0,0,0,0.3)', animation:'fadeDown 0.3s ease' }}>
      {toast.ok ? '✓' : '✕'} {toast.msg}
    </div>
  )
}

function ConfirmModal({ title, message, danger=true, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:24,
        padding:32, maxWidth:420, width:'90%', boxShadow:'0 24px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ width:52, height:52, borderRadius:16, marginBottom:16, fontSize:24,
          background:danger?'rgba(239,68,68,0.12)':'rgba(34,197,94,0.12)',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          {danger ? '⚠️' : '✓'}
        </div>
        <h3 style={{ fontSize:18, fontWeight:900, color:'var(--text-primary)', marginBottom:8 }}>{title}</h3>
        <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:24 }}>{message}</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:'10px 0', borderRadius:12, background:'var(--bg-base)',
            border:'1px solid var(--border)', color:'var(--text-secondary)', fontWeight:700, cursor:'pointer', fontSize:14 }}>
            Annuler
          </button>
          <button onClick={onConfirm} style={{ flex:1, padding:'10px 0', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:14,
            background:danger?'#ef4444':'#22c55e', color:'#fff', border:'none' }}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Tab: Utilisateurs ── */
/* ── User profile drawer ── */
function UserProfileDrawer({ u, token, onClose, onDelete, onToggleBan, onChangeRole }) {
  const [profileTab, setProfileTab] = useState('info')
  const [userTransactions, setUserTransactions] = useState([])
  const [userMessages, setUserMessages] = useState([])
  const [loadingTx, setLoadingTx] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const c = ROLE_COLOR[u.role] || '#6b7280'
  const initials = u.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?'

  useEffect(() => {
    if (profileTab === 'transactions' && userTransactions.length === 0) {
      setLoadingTx(true)
      axios.get(`${API}/admin/transactions`, { headers:{ Authorization:`Bearer ${token}` } })
        .then(r => { setUserTransactions(r.data.filter(t => t.fromEmail===u.email || t.toEmail===u.email)); setLoadingTx(false) })
        .catch(() => setLoadingTx(false))
    }
    if (profileTab === 'chats' && userMessages.length === 0) {
      setLoadingMsg(true)
      axios.get(`${API}/admin/messages`, { headers:{ Authorization:`Bearer ${token}` } })
        .then(r => { setUserMessages(r.data.filter(c => c.key.includes(u.id))); setLoadingMsg(false) })
        .catch(() => setLoadingMsg(false))
    }
  }, [profileTab])

  const PTABS = [
    { id:'info',         label:'Profil',       icon:'👤' },
    { id:'transactions', label:'Transactions', icon:'💶' },
    { id:'chats',        label:'Chats',        icon:'💬' },
    { id:'programs',     label:'Programmes',   icon:'📋' },
  ]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:8000, display:'flex' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div style={{ flex:1, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(3px)' }} onClick={onClose}/>
      {/* Drawer */}
      <div style={{ width:520, background:'var(--bg-base)', borderLeft:'1px solid var(--border)',
        display:'flex', flexDirection:'column', overflowY:'auto', animation:'slideIn 0.25s ease' }}>

        {/* Header */}
        <div style={{ padding:'24px 24px 0', borderBottom:'1px solid var(--border)', background:'var(--bg-card)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:56, height:56, borderRadius:16, background:u.avatar?'transparent':c,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                overflow:'hidden', color:'#fff', fontWeight:900, fontSize:20,
                boxShadow:`0 4px 16px ${c}44` }}>
                {u.avatar ? <img src={u.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : initials}
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <h2 style={{ fontSize:18, fontWeight:900, color:'var(--text-primary)', margin:0 }}>{u.name}</h2>
                  {u.banned && <span style={{ fontSize:10, background:'#ef444418', color:'#ef4444', border:'1px solid #ef444430', padding:'2px 8px', borderRadius:99, fontWeight:800 }}>Banni</span>}
                </div>
                <p style={{ fontSize:13, color:'var(--text-faint)', margin:0 }}>{u.email}</p>
                <div style={{ marginTop:6 }}><RoleBadge role={u.role}/></div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, border:'1px solid var(--border)',
              background:'var(--bg-base)', color:'var(--text-secondary)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
          {/* Tabs */}
          <div style={{ display:'flex', gap:2 }}>
            {PTABS.map(t => (
              <button key={t.id} onClick={() => setProfileTab(t.id)}
                style={{ padding:'9px 14px', borderRadius:'10px 10px 0 0', fontWeight:700, fontSize:12,
                  cursor:'pointer', border:'none', background: profileTab===t.id ? 'var(--bg-base)' : 'transparent',
                  color: profileTab===t.id ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: profileTab===t.id ? '2px solid var(--accent)' : '2px solid transparent' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, padding:24, display:'flex', flexDirection:'column', gap:16 }}>

          {/* ── INFO ── */}
          {profileTab === 'info' && (
            <>
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:18 }}>
                <p style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-faint)', marginBottom:14 }}>Informations</p>
                {[
                  ['ID', u.id],
                  ['Email', u.email],
                  ['Rôle', `${ROLE_ICON[u.role]} ${ROLE_LABEL[u.role]||u.role}`],
                  ['Statut', u.banned ? '🚫 Banni' : '✅ Actif'],
                  ['Inscription', u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}) : '—'],
                  ['Spécialités', u.specialties?.join(', ') || '—'],
                  ['Bio', u.bio || '—'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display:'flex', gap:12, marginBottom:10, fontSize:13 }}>
                    <span style={{ minWidth:90, color:'var(--text-faint)', fontWeight:600 }}>{label}</span>
                    <span style={{ color:'var(--text-primary)', flex:1, wordBreak:'break-all' }}>{val}</span>
                  </div>
                ))}
              </div>

              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:18 }}>
                <p style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-faint)', marginBottom:14 }}>Changer le rôle</p>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['client','coach','nutritionist','admin'].map(r => (
                    <button key={r} onClick={() => onChangeRole(u.id, r)}
                      style={{ padding:'8px 14px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer',
                        background: u.role===r ? `${ROLE_COLOR[r]}22` : 'var(--bg-base)',
                        color: u.role===r ? ROLE_COLOR[r] : 'var(--text-secondary)',
                        border:`1px solid ${u.role===r ? ROLE_COLOR[r]+'60' : 'var(--border)'}` }}>
                      {ROLE_ICON[r]} {ROLE_LABEL[r]} {u.role===r && '✓'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => onToggleBan(u)}
                  style={{ flex:1, padding:'11px 0', borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer', border:'none',
                    background: u.banned ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)',
                    color: u.banned ? '#4ade80' : '#ef4444' }}>
                  {u.banned ? '✅ Réactiver le compte' : '🚫 Bannir l\'utilisateur'}
                </button>
                <button onClick={() => onDelete(u)}
                  style={{ flex:1, padding:'11px 0', borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer',
                    background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)' }}>
                  🗑 Supprimer définitivement
                </button>
              </div>
            </>
          )}

          {/* ── TRANSACTIONS ── */}
          {profileTab === 'transactions' && (
            loadingTx ? <p style={{ textAlign:'center', padding:40, color:'var(--text-faint)' }}>Chargement…</p>
            : userTransactions.length === 0
              ? <div style={{ textAlign:'center', padding:60 }}><p style={{ fontSize:28, marginBottom:8 }}>💶</p><p style={{ color:'var(--text-faint)', fontSize:13 }}>Aucune transaction</p></div>
              : userTransactions.map(t => (
                <div key={t.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                    background: t.status==='paid'?'rgba(74,222,128,0.12)':'rgba(239,68,68,0.12)' }}>
                    {t.status==='paid' ? '💚' : '↩'}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{t.program}</p>
                    <p style={{ fontSize:11, color:'var(--text-faint)' }}>{t.fromName} → {t.toName}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:15, fontWeight:900, color:t.status==='paid'?'#4ade80':'#ef4444' }}>
                      {t.status==='refunded'?'-':'+' }{t.amount}€
                    </p>
                    <p style={{ fontSize:10, color:'var(--text-faint)' }}>{fmtDate(t.date)}</p>
                  </div>
                </div>
              ))
          )}

          {/* ── CHATS ── */}
          {profileTab === 'chats' && (
            loadingMsg ? <p style={{ textAlign:'center', padding:40, color:'var(--text-faint)' }}>Chargement…</p>
            : userMessages.length === 0
              ? <div style={{ textAlign:'center', padding:60 }}><p style={{ fontSize:28, marginBottom:8 }}>💬</p><p style={{ color:'var(--text-faint)', fontSize:13 }}>Aucune conversation</p></div>
              : userMessages.map(conv => (
                <div key={conv.key} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>
                      {conv.sender} <span style={{ color:'var(--text-faint)' }}>↔</span> {conv.recipient}
                    </p>
                    <span style={{ fontSize:11, color:'var(--text-faint)' }}>{conv.messages.length} msg</span>
                  </div>
                  {conv.messages.slice(-2).map((m,i) => (
                    <div key={i} style={{ fontSize:12, color:'var(--text-secondary)', padding:'6px 10px', borderRadius:8, background:'var(--bg-base)', marginBottom:4 }}>
                      <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{m.senderName||'?'} : </span>{m.text}
                    </div>
                  ))}
                </div>
              ))
          )}

          {/* ── PROGRAMMES ── */}
          {profileTab === 'programs' && (
            <div style={{ textAlign:'center', padding:48 }}>
              <p style={{ fontSize:28, marginBottom:8 }}>📋</p>
              <p style={{ fontWeight:700, color:'var(--text-primary)', fontSize:14 }}>
                {u.role === 'coach' ? 'Programmes créés par ce coach' : 'Programmes auxquels cet utilisateur est inscrit'}
              </p>
              <p style={{ color:'var(--text-faint)', fontSize:12, marginTop:8 }}>
                Les données d'inscription sont visibles dans l'onglet Programmes du panneau admin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── UserRow — composant séparé (règle des hooks) ── */
function UserRow({ u, isSelf, onOpen, onDelete, onToggleBan, onChangeRole }) {
  const [showMenu, setShowMenu] = useState(false)
  const c = ROLE_COLOR[u.role] || '#6b7280'
  const initials = u.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?'

  return (
    <tr style={{ borderBottom:'1px solid var(--border)', cursor:'pointer' }}
      onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      {/* Nom cliquable → ouvre le profil */}
      <td style={{ padding:'13px 16px' }} onClick={() => onOpen(u)}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:12, background:u.avatar?'transparent':c,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            overflow:'hidden', color:'#fff', fontWeight:900, fontSize:13 }}>
            {u.avatar ? <img src={u.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : initials}
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:6 }}>
              {u.name}
              {isSelf && <span style={{ fontSize:9, background:'var(--accent)', color:'#fff', padding:'1px 6px', borderRadius:99, fontWeight:800 }}>Vous</span>}
              {u.banned && <span style={{ fontSize:9, background:'#ef444418', color:'#ef4444', border:'1px solid #ef444440', padding:'1px 6px', borderRadius:99, fontWeight:800 }}>Banni</span>}
            </p>
            <p style={{ fontSize:11, color:'var(--text-faint)' }}>{u.email}</p>
          </div>
        </div>
      </td>
      <td style={{ padding:'13px 16px' }} onClick={() => onOpen(u)}><RoleBadge role={u.role}/></td>
      <td style={{ padding:'13px 16px' }} onClick={() => onOpen(u)}>
        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-secondary)' }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:u.banned?'#ef4444':'#4ade80', display:'inline-block' }}/>
          {u.banned ? 'Banni' : 'Actif'}
        </span>
      </td>
      <td style={{ padding:'13px 16px', fontSize:12, color:'var(--text-faint)' }} onClick={() => onOpen(u)}>
        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
      </td>
      <td style={{ padding:'13px 16px' }}>
        {!isSelf ? (
          <div style={{ display:'flex', gap:6, alignItems:'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ position:'relative' }}>
              <button onClick={() => setShowMenu(!showMenu)}
                style={{ padding:'6px 10px', borderRadius:10, fontSize:11, fontWeight:700, cursor:'pointer',
                  background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-secondary)' }}>
                Rôle ▾
              </button>
              {showMenu && (
                <div style={{ position:'absolute', right:0, top:'110%', zIndex:300, minWidth:170,
                  background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14,
                  boxShadow:'0 8px 32px rgba(0,0,0,0.3)', overflow:'hidden' }}>
                  {['client','coach','nutritionist','admin'].map(r => (
                    <button key={r} onClick={() => { onChangeRole(u.id, r); setShowMenu(false) }}
                      style={{ width:'100%', textAlign:'left', padding:'10px 14px', fontSize:12, fontWeight:700,
                        cursor:'pointer', border:'none', display:'flex', alignItems:'center', gap:8,
                        background: u.role===r ? `${ROLE_COLOR[r]}18` : 'transparent',
                        color: u.role===r ? ROLE_COLOR[r] : 'var(--text-secondary)' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background=u.role===r?`${ROLE_COLOR[r]}18`:'transparent'}>
                      {ROLE_ICON[r]} {ROLE_LABEL[r]} {u.role===r && '✓'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => onToggleBan(u)}
              style={{ padding:'6px 10px', borderRadius:10, fontSize:11, fontWeight:700, cursor:'pointer', border:'none',
                background:u.banned?'rgba(74,222,128,0.12)':'rgba(239,68,68,0.12)',
                color:u.banned?'#4ade80':'#ef4444' }}>
              {u.banned ? 'Réactiver' : 'Bannir'}
            </button>
            <button onClick={() => onDelete(u)}
              style={{ padding:'6px 10px', borderRadius:10, fontSize:11, fontWeight:700, cursor:'pointer',
                background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.25)' }}>
              🗑
            </button>
          </div>
        ) : (
          <span style={{ fontSize:11, color:'var(--text-faint)', padding:'6px 10px', display:'inline-block' }}>—</span>
        )}
      </td>
    </tr>
  )
}

function TabUsers({ users, selfId, token, onDelete, onToggleBan, onChangeRole }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [openUser, setOpenUser] = useState(null)

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (!q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      && (roleFilter === 'all' || u.role === roleFilter)
  })

  return (
    <>
      {openUser && (
        <UserProfileDrawer u={openUser} token={token} onClose={() => setOpenUser(null)}
          onDelete={u => { onDelete(u); setOpenUser(null) }}
          onToggleBan={u => { onToggleBan(u); setOpenUser(prev => prev?.id===u.id ? {...prev, banned:!prev.banned} : prev) }}
          onChangeRole={(id, role) => { onChangeRole(id, role); setOpenUser(prev => prev?.id===id ? {...prev, role} : prev) }} />
      )}

      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍  Nom, email…"
          style={{ flex:1, minWidth:200, padding:'10px 14px', borderRadius:12, fontSize:13, outline:'none',
            background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-primary)' }} />
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {['all','coach','client','nutritionist','admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              style={{ padding:'9px 13px', borderRadius:11, fontSize:11, fontWeight:700, cursor:'pointer',
                background: roleFilter===r ? (r==='all'?'var(--accent)':ROLE_COLOR[r]||'var(--accent)') : 'var(--bg-card)',
                color: roleFilter===r ? '#fff' : 'var(--text-secondary)',
                border:`1px solid ${roleFilter===r?'transparent':'var(--border)'}` }}>
              {r==='all' ? `Tous (${users.length})` : `${ROLE_ICON[r]} ${ROLE_LABEL[r]}`}
            </button>
          ))}
        </div>
      </div>
      <p style={{ fontSize:11, color:'var(--text-faint)', marginBottom:12 }}>
        💡 Clique sur un utilisateur pour voir son profil complet
      </p>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-base)', borderBottom:'1px solid var(--border)' }}>
              {['Utilisateur','Rôle','Statut','Inscription','Actions'].map(h=>(
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:10, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-faint)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={5} style={{ padding:'48px 0', textAlign:'center', color:'var(--text-faint)', fontSize:13 }}>Aucun résultat</td></tr>
              : filtered.map(u => (
                <UserRow key={u.id} u={u} isSelf={u.id===selfId}
                  onOpen={setOpenUser}
                  onDelete={onDelete}
                  onToggleBan={onToggleBan}
                  onChangeRole={onChangeRole} />
              ))
            }
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ── Tab: Programmes ── */
function TabPrograms({ programs, token, onDelete, onCreated }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title:'', description:'', price:0, duration:'', category:'Général', level:'Tous niveaux', sessions:'', nutrition:false })
  const [saving, setSaving] = useState(false)

  const CATEGORIES = ['Force','Cardio','Nutrition','Combiné','Mobilité','Général']
  const LEVELS = ['Tous niveaux','Débutant','Intermédiaire','Avancé']

  const createProgram = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const res = await axios.post(`${API}/admin/programs`, form, { headers:{ Authorization:`Bearer ${token}` } })
      onCreated(res.data)
      setShowForm(false)
      setForm({ title:'', description:'', price:0, duration:'', category:'Général', level:'Tous niveaux', sessions:'', nutrition:false })
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <p style={{ fontSize:13, color:'var(--text-faint)' }}>{programs.length} programmes · {programs.reduce((s,p)=>s+p.enrollmentCount,0)} inscriptions totales</p>
        <button onClick={()=>setShowForm(!showForm)}
          style={{ padding:'10px 20px', borderRadius:12, fontWeight:800, fontSize:13, cursor:'pointer', border:'none',
            background:'var(--accent)', color:'#fff' }}>
          + Nouveau programme générique
        </button>
      </div>

      {showForm && (
        <div style={{ background:'var(--bg-card)', border:'2px solid var(--accent)', borderRadius:20, padding:24, marginBottom:20 }}>
          <p style={{ fontSize:14, fontWeight:900, color:'var(--text-primary)', marginBottom:16 }}>🆕 Créer un programme générique ULTRA</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:12 }}>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
              placeholder="Titre du programme *"
              style={{ gridColumn:'1/-1', padding:'10px 14px', borderRadius:12, fontSize:13, outline:'none',
                background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
              placeholder="Description" rows={2}
              style={{ gridColumn:'1/-1', padding:'10px 14px', borderRadius:12, fontSize:13, outline:'none', resize:'none',
                background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:'var(--text-faint)', marginBottom:5 }}>Catégorie</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {CATEGORIES.map(c=>(
                  <button key={c} onClick={()=>setForm(f=>({...f,category:c}))}
                    style={{ padding:'5px 12px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer',
                      background:form.category===c?'var(--accent)':'var(--bg-base)',
                      color:form.category===c?'#fff':'var(--text-secondary)',
                      border:`1px solid ${form.category===c?'var(--accent)':'var(--border)'}` }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:'var(--text-faint)', marginBottom:5 }}>Niveau</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {LEVELS.map(l=>(
                  <button key={l} onClick={()=>setForm(f=>({...f,level:l}))}
                    style={{ padding:'5px 12px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer',
                      background:form.level===l?'#2980b9':'var(--bg-base)',
                      color:form.level===l?'#fff':'var(--text-secondary)',
                      border:`1px solid ${form.level===l?'#2980b9':'var(--border)'}` }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <input value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))}
              placeholder="Durée (ex: 8 semaines)"
              style={{ padding:'10px 14px', borderRadius:12, fontSize:13, outline:'none',
                background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>
            <input value={form.sessions} onChange={e=>setForm(f=>({...f,sessions:e.target.value}))}
              placeholder="Séances (ex: 3x/semaine)"
              style={{ padding:'10px 14px', borderRadius:12, fontSize:13, outline:'none',
                background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <p style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:600 }}>Prix (€) :</p>
              <input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:+e.target.value}))}
                min={0} style={{ width:80, padding:'8px 12px', borderRadius:10, fontSize:13, outline:'none',
                  background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-secondary)', cursor:'pointer' }}>
                <input type="checkbox" checked={form.nutrition} onChange={e=>setForm(f=>({...f,nutrition:e.target.checked}))}/>
                Inclut nutrition
              </label>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button onClick={()=>setShowForm(false)}
              style={{ flex:1, padding:'10px 0', borderRadius:12, background:'var(--bg-base)', border:'1px solid var(--border)',
                color:'var(--text-secondary)', fontWeight:700, cursor:'pointer' }}>Annuler</button>
            <button onClick={createProgram} disabled={!form.title.trim()||saving}
              style={{ flex:2, padding:'10px 0', borderRadius:12, background:form.title.trim()?'var(--accent)':'var(--border)',
                color:'#fff', fontWeight:700, cursor:'pointer', border:'none' }}>
              {saving ? 'Création…' : '✓ Créer le programme'}
            </button>
          </div>
        </div>
      )}

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-base)', borderBottom:'1px solid var(--border)' }}>
              {['Programme','Coach / Créateur','Catégorie','Prix','Inscrits','Créé','Action'].map(h=>(
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:10, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-faint)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {programs.length === 0
              ? <tr><td colSpan={7} style={{ padding:'48px 0', textAlign:'center', color:'var(--text-faint)', fontSize:13 }}>Aucun programme</td></tr>
              : programs.map(p=>(
                <tr key={p.id} style={{ borderBottom:'1px solid var(--border)' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'13px 16px' }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{p.title}</p>
                    <p style={{ fontSize:11, color:'var(--text-faint)', marginTop:2 }}>{p.level} · {p.duration||'—'}</p>
                  </td>
                  <td style={{ padding:'13px 16px' }}>
                    <p style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:600 }}>
                      {p.isGeneric ? <span style={{ color:'var(--gold)', fontWeight:800 }}>👑 ULTRA</span> : (p.coachName||'—')}
                    </p>
                  </td>
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                      background:'var(--bg-base)', color:'var(--text-secondary)', border:'1px solid var(--border)' }}>
                      {p.category||'—'}
                    </span>
                  </td>
                  <td style={{ padding:'13px 16px', fontWeight:800, fontSize:14, color:p.price===0?'#4ade80':'var(--gold)' }}>
                    {p.price===0?'Gratuit':`${p.price}€`}
                  </td>
                  <td style={{ padding:'13px 16px', fontWeight:900, fontSize:16, color:'var(--accent)' }}>{p.enrollmentCount||0}</td>
                  <td style={{ padding:'13px 16px', fontSize:11, color:'var(--text-faint)' }}>
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td style={{ padding:'13px 16px' }}>
                    <button onClick={()=>onDelete(p)}
                      style={{ padding:'6px 12px', borderRadius:10, fontSize:11, fontWeight:700, cursor:'pointer',
                        background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.25)' }}>
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ── Tab: Transactions ── */
function TabTransactions({ token, showToast }) {
  const [transactions, setTransactions] = useState([])
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/admin/transactions`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => { setTransactions(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const refund = async (t) => {
    try {
      const res = await axios.post(`${API}/admin/transactions/${t.id}/refund`, {}, { headers:{ Authorization:`Bearer ${token}` } })
      setTransactions(prev => prev.map(x => x.id===t.id ? res.data : x))
      showToast(`Remboursement de ${t.amount}€ effectué`)
    } catch(e) { showToast(e.response?.data?.message || 'Erreur', false) }
    setModal(null)
  }

  const total = transactions.filter(t=>t.status==='paid').reduce((s,t)=>s+t.amount, 0)
  const refunded = transactions.filter(t=>t.status==='refunded').reduce((s,t)=>s+t.amount, 0)

  if (loading) return <div style={{ textAlign:'center', padding:60, color:'var(--text-faint)' }}>Chargement…</div>

  return (
    <>
      {modal?.type === 'refund' && (
        <ConfirmModal
          title={`Rembourser ${modal.target.amount}€ ?`}
          message={`Rembourser ${modal.target.fromName} pour "${modal.target.program}". Cette opération est irréversible.`}
          danger={false}
          onConfirm={() => refund(modal.target)}
          onCancel={() => setModal(null)} />
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        <KpiCard icon="💶" label="Revenus encaissés" value={`${total}€`} color="#f59e0b" />
        <KpiCard icon="↩" label="Remboursements" value={`-${refunded}€`} color="#ef4444" delay={60} />
        <KpiCard icon="📊" label="Transactions" value={transactions.length} color="var(--text-primary)" sub={`${transactions.filter(t=>t.status==='paid').length} payées`} delay={120} />
      </div>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-base)', borderBottom:'1px solid var(--border)' }}>
              {['Client','Destinataire','Programme','Montant','Statut','Date','Action'].map(h=>(
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:10, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-faint)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0
              ? <tr><td colSpan={7} style={{ padding:'48px 0', textAlign:'center', color:'var(--text-faint)', fontSize:13 }}>Aucune transaction</td></tr>
              : transactions.map(t=>(
                <tr key={t.id} style={{ borderBottom:'1px solid var(--border)' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'13px 16px' }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{t.fromName}</p>
                    <p style={{ fontSize:11, color:'var(--text-faint)' }}>{t.fromEmail}</p>
                  </td>
                  <td style={{ padding:'13px 16px', fontSize:12, color:'var(--text-secondary)', fontWeight:600 }}>{t.toName}</td>
                  <td style={{ padding:'13px 16px', fontSize:12, color:'var(--text-secondary)' }}>{t.program}</td>
                  <td style={{ padding:'13px 16px', fontWeight:900, fontSize:15,
                    color: t.status==='refunded' ? '#ef4444' : '#4ade80',
                    textDecoration: t.status==='refunded' ? 'line-through' : 'none' }}>
                    {t.status==='refunded' ? '-' : '+'}{t.amount}€
                  </td>
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{
                      padding:'4px 12px', borderRadius:99, fontSize:11, fontWeight:700,
                      background: t.status==='paid' ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)',
                      color: t.status==='paid' ? '#4ade80' : '#ef4444',
                      border: `1px solid ${t.status==='paid'?'rgba(74,222,128,0.3)':'rgba(239,68,68,0.3)'}`,
                    }}>
                      {t.status==='paid' ? 'Payé' : 'Remboursé'}
                    </span>
                  </td>
                  <td style={{ padding:'13px 16px', fontSize:12, color:'var(--text-faint)' }}>{fmtDate(t.date)}</td>
                  <td style={{ padding:'13px 16px' }}>
                    {t.status === 'paid' && (
                      <button onClick={()=>setModal({type:'refund',target:t})}
                        style={{ padding:'6px 12px', borderRadius:10, fontSize:11, fontWeight:700, cursor:'pointer',
                          background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.25)' }}>
                        ↩ Rembourser
                      </button>
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ── Tab: Chats ── */
function TabChats({ token }) {
  const [convs, setConvs] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/admin/messages`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => { setConvs(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const openConv = async (conv) => {
    setSelected(conv)
    const ids = conv.key.split('|')
    try {
      const r = await axios.get(`${API}/admin/messages/${ids[0]}/${ids[1]}`, { headers:{ Authorization:`Bearer ${token}` } })
      setMessages(r.data)
    } catch { setMessages([]) }
  }

  if (loading) return <div style={{ textAlign:'center', padding:60, color:'var(--text-faint)' }}>Chargement…</div>

  return (
    <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:16, height:600 }}>
      {/* Conversation list */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)' }}>
          <p style={{ fontSize:12, fontWeight:800, color:'var(--text-primary)' }}>Conversations ({convs.length})</p>
        </div>
        <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none' }}>
          {convs.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'var(--text-faint)', fontSize:13 }}>
              <p style={{ fontSize:24, marginBottom:8 }}>💬</p>
              Aucune conversation
            </div>
          ) : convs.map(c => (
            <button key={c.key} onClick={()=>openConv(c)}
              style={{ width:'100%', textAlign:'left', padding:'14px 16px', border:'none', cursor:'pointer',
                background: selected?.key===c.key ? 'var(--accent-subtle)' : 'transparent',
                borderBottom:'1px solid var(--border)',
                borderLeft: selected?.key===c.key ? '3px solid var(--accent)' : '3px solid transparent' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
              onMouseLeave={e=>e.currentTarget.style.background=selected?.key===c.key?'var(--accent-subtle)':'transparent'}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <span style={{ fontSize:11, fontWeight:700, color: ROLE_COLOR[c.senderRole]||'var(--text-secondary)' }}>
                  {ROLE_ICON[c.senderRole]} {c.sender}
                </span>
                <span style={{ fontSize:10, color:'var(--text-faint)' }}>↔</span>
                <span style={{ fontSize:11, fontWeight:700, color: ROLE_COLOR[c.recipientRole]||'var(--text-secondary)' }}>
                  {ROLE_ICON[c.recipientRole]} {c.recipient}
                </span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'var(--text-faint)' }}>{c.messages.length} message{c.messages.length!==1?'s':''}</span>
                <span style={{ fontSize:10, color:'var(--text-faint)' }}>{fmtDate(c.lastAt)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Message viewer */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {!selected ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, color:'var(--text-faint)' }}>
            <span style={{ fontSize:36 }}>💬</span>
            <p style={{ fontSize:13, fontWeight:600 }}>Sélectionne une conversation</p>
            <p style={{ fontSize:11 }}>Tu peux lire tous les messages en tant qu'admin</p>
          </div>
        ) : (
          <>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:13, fontWeight:800, color:'var(--text-primary)' }}>
                {selected.sender} ↔ {selected.recipient}
              </span>
              <span style={{ fontSize:10, padding:'3px 8px', borderRadius:99, background:'rgba(239,68,68,0.1)', color:'#ef4444', fontWeight:700 }}>
                👁 Lecture admin
              </span>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'16px', scrollbarWidth:'none', display:'flex', flexDirection:'column', gap:8 }}>
              {messages.length === 0 ? (
                <p style={{ textAlign:'center', color:'var(--text-faint)', fontSize:13, marginTop:40 }}>Aucun message dans cette conversation</p>
              ) : messages.map((m,i) => {
                const isFirst = m.senderId !== selected.key.split('|')[0]
                return (
                  <div key={m.id||i} style={{ display:'flex', gap:8, alignItems:'flex-end', justifyContent: isFirst?'flex-end':'flex-start' }}>
                    <div style={{
                      maxWidth:'72%', padding:'10px 14px', borderRadius: isFirst?'18px 18px 4px 18px':'18px 18px 18px 4px',
                      background: isFirst ? 'var(--accent)' : 'var(--bg-base)',
                      border: isFirst ? 'none' : '1px solid var(--border)',
                      fontSize:13, color: isFirst ? '#fff' : 'var(--text-primary)',
                    }}>
                      <p style={{ margin:0 }}>{m.text}</p>
                      <p style={{ fontSize:9, opacity:0.6, marginTop:4, textAlign:'right' }}>{fmtDate(m.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Tab: Activité ── */
function TabActivity({ stats }) {
  const EVENTS = [
    { icon:'👤', msg:'Nouvel utilisateur inscrit',        sub:'client@ultra.com',                      time:'2 min',  color:'#27ae60' },
    { icon:'💶', msg:'Paiement reçu',                     sub:'80€ · Suivi mensuel Force Absolue',      time:'14 min', color:'#f59e0b' },
    { icon:'📋', msg:'Programme créé',                    sub:'Force Absolue · Nate Coach',             time:'1h',     color:'#2980b9' },
    { icon:'🥗', msg:'Plan nutritionnel partagé',         sub:'Sarah Dupont → Marie D.',                time:'2h',     color:'#8e44ad' },
    { icon:'💬', msg:'Message envoyé',                    sub:'Coach Nate → Alex Client',               time:'3h',     color:'var(--accent)' },
    { icon:'⭐', msg:'Avis laissé',                       sub:'5★ · Programme HIIT Brûle-Graisses',     time:'5h',     color:'#f59e0b' },
    { icon:'🎓', msg:'Nouveau coach vérifié',             sub:'Lucas T. · Diplôme BPJEPS validé',       time:'1j',     color:'#2980b9' },
    { icon:'📍', msg:'Recherche géoloc effectuée',        sub:'Rayon 10km · Paris 11e',                 time:'1j',     color:'#4a90d9' },
    { icon:'🔔', msg:'Notification envoyée en masse',     sub:'3 utilisateurs · Rappel de séance',      time:'2j',     color:'#8e44ad' },
  ]

  const SERVICES = [
    { label:'API Backend',        status:'Opérationnel',      ok:true  },
    { label:'Authentification',   status:'JWT actif',         ok:true  },
    { label:'Base de données',    status:'En mémoire (démo)', ok:true  },
    { label:'IA Claude',          status:'Disponible',        ok:true  },
    { label:'Carte géoloc',       status:'OpenStreetMap OK',  ok:true  },
    { label:'Notifications',      status:'Temps réel',        ok:true  },
  ]

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:20 }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
        <p style={{ fontSize:12, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-faint)', marginBottom:20 }}>⚡ Événements récents</p>
        {EVENTS.map((e,i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:14,
            paddingBottom:14, borderBottom:i<EVENTS.length-1?'1px solid var(--border)':'none' }}>
            <div style={{ width:34, height:34, borderRadius:10, background:`${e.color}18`,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>
              {e.icon}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>{e.msg}</p>
              <p style={{ fontSize:11, color:'var(--text-faint)', marginTop:2 }}>{e.sub}</p>
            </div>
            <span style={{ fontSize:10, color:'var(--text-faint)', flexShrink:0 }}>il y a {e.time}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
          <p style={{ fontSize:12, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-faint)', marginBottom:18 }}>🏥 État des services</p>
          {SERVICES.map(({ label, status, ok }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99,
                background:ok?'rgba(74,222,128,0.1)':'rgba(239,68,68,0.1)',
                color:ok?'#4ade80':'#ef4444',
                border:`1px solid ${ok?'rgba(74,222,128,0.25)':'rgba(239,68,68,0.25)'}` }}>
                ● {status}
              </span>
            </div>
          ))}
        </div>

        {stats && (
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
            <p style={{ fontSize:12, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-faint)', marginBottom:18 }}>📈 Résumé plateforme</p>
            {[
              ['Utilisateurs', stats.totalUsers, 'var(--text-primary)'],
              ['Coaches actifs', stats.coaches, '#2980b9'],
              ['Clients', stats.clients, 'var(--accent)'],
              ['Nutritionnistes', stats.nutritionists, '#8e44ad'],
              ['Programmes', stats.totalPrograms, '#e8a020'],
              ['Revenus générés', `${stats.totalRevenue?.toFixed(0)}€`, '#f59e0b'],
            ].map(([l,v,c]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{l}</span>
                <span style={{ fontSize:14, fontWeight:900, color:c }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user, token } = useStore()
  const navigate = useNavigate()
  const headers = { Authorization: `Bearer ${token}` }

  const [tab,      setTab]      = useState('overview')
  const [stats,    setStats]    = useState(null)
  const [users,    setUsers]    = useState([])
  const [programs, setPrograms] = useState([])
  const [modal,    setModal]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [toast,    setToast]    = useState(null)

  const showToast = useCallback((msg, ok=true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const load = useCallback(async () => {
    try {
      const [sRes, uRes, pRes] = await Promise.all([
        axios.get(`${API}/admin/stats`,    { headers }),
        axios.get(`${API}/admin/users`,    { headers }),
        axios.get(`${API}/admin/programs`, { headers }),
      ])
      setStats(sRes.data); setUsers(uRes.data); setPrograms(pRes.data)
    } catch(e) { console.error(e) }
    setLoading(false)
  }, [token])

  useEffect(() => { if (user?.role === 'admin') load() }, [user, load])

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${API}/admin/users/${id}`, { headers })
      setUsers(u => u.filter(x => x.id !== id))
      showToast('Utilisateur supprimé')
    } catch(e) { showToast(e.response?.data?.message || 'Erreur', false) }
    setModal(null)
  }

  const toggleBan = async (u) => {
    try {
      const res = await axios.put(`${API}/admin/users/${u.id}`, { banned: !u.banned }, { headers })
      setUsers(prev => prev.map(x => x.id===u.id ? res.data : x))
      showToast(u.banned ? `${u.name} réactivé` : `${u.name} banni`)
    } catch { showToast('Erreur', false) }
    setModal(null)
  }

  const changeRole = async (id, role) => {
    try {
      const res = await axios.put(`${API}/admin/users/${id}`, { role }, { headers })
      setUsers(prev => prev.map(x => x.id===id ? res.data : x))
      showToast(`Rôle changé → ${ROLE_LABEL[role]}`)
    } catch { showToast('Erreur', false) }
  }

  const deleteProgram = async (id) => {
    try {
      await axios.delete(`${API}/admin/programs/${id}`, { headers })
      setPrograms(p => p.filter(x => x.id !== id))
      showToast('Programme supprimé')
    } catch { showToast('Erreur', false) }
    setModal(null)
  }

  if (user?.role !== 'admin') return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:48, marginBottom:12 }}>🔒</p>
        <p style={{ fontSize:18, fontWeight:900, color:'var(--text-primary)' }}>Accès refusé</p>
        <button onClick={()=>navigate('/dashboard')}
          style={{ marginTop:20, padding:'10px 24px', borderRadius:12, background:'var(--accent)', color:'#fff', fontWeight:700, border:'none', cursor:'pointer' }}>
          Retour
        </button>
      </div>
    </div>
  )

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)' }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid var(--accent)', borderTopColor:'transparent', animation:'spin 0.7s linear infinite' }}/>
    </div>
  )

  const TABS = [
    { id:'overview',     label:'Vue globale',    icon:'⊞' },
    { id:'users',        label:'Utilisateurs',   icon:'👥' },
    { id:'programs',     label:'Programmes',     icon:'📋' },
    { id:'transactions', label:'Transactions',   icon:'💶' },
    { id:'chats',        label:'Chats',          icon:'💬' },
    { id:'activity',     label:'Activité',       icon:'⚡' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', color:'var(--text-primary)' }}>
      <Toast toast={toast} />

      {modal?.type === 'deleteUser'    && <ConfirmModal title={`Supprimer ${modal.target.name} ?`} message={`L'utilisateur ${modal.target.email} et toutes ses données seront supprimés définitivement.`} onConfirm={()=>deleteUser(modal.target.id)} onCancel={()=>setModal(null)} />}
      {modal?.type === 'banUser'       && <ConfirmModal title={modal.target.banned?`Réactiver ${modal.target.name} ?`:`Bannir ${modal.target.name} ?`} message={modal.target.banned?'L\'utilisateur pourra à nouveau se connecter.':'L\'utilisateur ne pourra plus se connecter.'} danger={!modal.target.banned} onConfirm={()=>toggleBan(modal.target)} onCancel={()=>setModal(null)} />}
      {modal?.type === 'deleteProgram' && <ConfirmModal title={`Supprimer "${modal.target.title}" ?`} message={`${modal.target.enrollmentCount||0} inscrits perdront l'accès.`} onConfirm={()=>deleteProgram(modal.target.id)} onCancel={()=>setModal(null)} />}

      {/* Header */}
      <div style={{ padding:'28px 32px 0', borderBottom:'1px solid var(--border)', background:'var(--bg-card)' }}>
        <div style={{ maxWidth:1300, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--gold)', marginBottom:4 }}>👑 Administration</p>
              <h1 style={{ fontSize:26, fontWeight:900, margin:0, color:'var(--text-primary)' }}>Panneau de contrôle</h1>
              <p style={{ fontSize:13, color:'var(--text-faint)', marginTop:4 }}>
                {users.length} utilisateurs · {programs.length} programmes · {user.name}
              </p>
            </div>
            <button onClick={load}
              style={{ padding:'9px 18px', borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer',
                background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-secondary)' }}>
              ↻ Actualiser
            </button>
          </div>
          <div style={{ display:'flex', gap:2 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{ padding:'10px 18px', borderRadius:'12px 12px 0 0', fontWeight:700, fontSize:13,
                  cursor:'pointer', border:'none', transition:'all 0.15s',
                  background: tab===t.id ? 'var(--bg-base)' : 'transparent',
                  color: tab===t.id ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: tab===t.id ? '2px solid var(--accent)' : '2px solid transparent' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1300, margin:'0 auto', padding:'28px 32px' }}>

        {/* ── VUE GLOBALE ── */}
        {tab === 'overview' && stats && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:14, marginBottom:24 }}>
              <KpiCard icon="👥" label="Total utilisateurs" value={stats.totalUsers} color="var(--text-primary)" delay={0}/>
              <KpiCard icon="🎓" label="Coaches" value={stats.coaches} color="#2980b9" delay={50}/>
              <KpiCard icon="💪" label="Clients" value={stats.clients} color="var(--accent)" delay={100}/>
              <KpiCard icon="🥗" label="Nutritionnistes" value={stats.nutritionists} color="#8e44ad" delay={150}/>
              <KpiCard icon="📋" label="Programmes" value={stats.totalPrograms} sub={`${stats.freePrograms} gratuits`} color="#e8a020" delay={200}/>
              <KpiCard icon="👤" label="Inscriptions" value={stats.totalEnrollments} color="#27ae60" delay={250}/>
              <KpiCard icon="💶" label="Revenus" value={`${stats.totalRevenue?.toFixed(0)}€`} color="#f59e0b" delay={300}/>
              <KpiCard icon="🚫" label="Bannis" value={stats.bannedUsers} color={stats.bannedUsers>0?'#ef4444':'var(--text-faint)'} delay={350}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:20 }}>
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
                <p style={{ fontSize:12, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-faint)', marginBottom:20 }}>Répartition des rôles</p>
                {[['coach',stats.coaches,'#2980b9'],['client',stats.clients,'var(--accent)'],['nutritionist',stats.nutritionists,'#8e44ad']].map(([role,count,c])=>{
                  const pct = stats.totalUsers>0 ? Math.round(count/stats.totalUsers*100) : 0
                  return (
                    <div key={role} style={{ marginBottom:16 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)' }}>{ROLE_ICON[role]} {ROLE_LABEL[role]}</span>
                        <span style={{ fontSize:12, fontWeight:900, color:c }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height:7, borderRadius:99, background:'var(--border)' }}>
                        <div style={{ height:'100%', borderRadius:99, background:c, width:`${pct}%`, transition:'width 0.8s ease' }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
                <p style={{ fontSize:12, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-faint)', marginBottom:20 }}>Derniers inscrits</p>
                {[...users].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,6).map(u=>(
                  <div key={u.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:`${ROLE_COLOR[u.role]||'#6b7280'}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                      {ROLE_ICON[u.role]}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</p>
                      <p style={{ fontSize:10, color:'var(--text-faint)' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}</p>
                    </div>
                    <RoleBadge role={u.role}/>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'users' && (
          <TabUsers users={users} selfId={user.id} token={token}
            onDelete={u=>setModal({type:'deleteUser',target:u})}
            onToggleBan={u=>setModal({type:'banUser',target:u})}
            onChangeRole={changeRole} />
        )}

        {tab === 'programs' && (
          <TabPrograms programs={programs} token={token}
            onDelete={p=>setModal({type:'deleteProgram',target:p})}
            onCreated={p=>{ setPrograms(prev=>[p,...prev]); showToast('Programme créé ✓') }} />
        )}

        {tab === 'transactions' && <TabTransactions token={token} showToast={showToast} />}
        {tab === 'chats'        && <TabChats token={token} />}
        {tab === 'activity'     && <TabActivity stats={stats} />}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
      `}</style>
    </div>
  )
}
