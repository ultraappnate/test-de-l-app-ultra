import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { useStore } from '../store'
import { compressImage } from '../utils/image'

import API from '../config.js'

/* ── Constantes ── */
const ROLE_LABEL  = { coach:'Coach', client:'Membre', nutritionist:'Nutritionniste', admin:'Admin' }
const ROLE_COLOR  = { coach:'#a03848', client:'#3b82f6', nutritionist:'#27ae60', admin:'#f59e0b' }
const ROLE_ICON   = { coach:'🏋️', client:'💪', nutritionist:'🥗', admin:'👑' }

const POST_TYPES = [
  { id:'all',       label:'Tout',        icon:'✦' },
  { id:'workout',   label:'Entraînement',icon:'🏋️' },
  { id:'recovery',  label:'Récupération',icon:'😴' },
  { id:'nutrition', label:'Nutrition',   icon:'🥗' },
  { id:'milestone', label:'Victoire',    icon:'🏆' },
  { id:'tip',       label:'Conseil',     icon:'💡' },
  { id:'general',   label:'Général',     icon:'💬' },
]

const PLATFORM_ICONS = { strava:'🚴', garmin:'⌚', oura:'💍', polar:'🔵', apple:'🍎' }
const PLATFORM_COLORS = { strava:'#FC4C02', garmin:'#009CDE', oura:'#B8A47C', polar:'#D10000', apple:'#555' }

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'À l\'instant'
  if (m < 60) return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `il y a ${d}j`
  return new Date(iso).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
}

/* ── Avatar ── */
function Avatar({ user, size = 40 }) {
  const initials = user.userName?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?'
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, overflow:'hidden',
      background: user.userAvatar ? 'transparent' : (user.userColor || ROLE_COLOR[user.userRole] || '#6b7280'),
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontWeight:900, fontSize: size * 0.35,
      border:`2px solid ${ROLE_COLOR[user.userRole] || '#6b7280'}33` }}>
      {user.userAvatar
        ? <img src={user.userAvatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        : initials}
    </div>
  )
}

/* ── Badge rôle ── */
function RoleBadge({ role }) {
  return (
    <span style={{ fontSize:9, padding:'2px 7px', borderRadius:99, fontWeight:800,
      background:`${ROLE_COLOR[role]}18`, color:ROLE_COLOR[role],
      border:`1px solid ${ROLE_COLOR[role]}33` }}>
      {ROLE_ICON[role]} {ROLE_LABEL[role]}
    </span>
  )
}

/* ── Health Data Card ── */
function HealthCard({ data }) {
  const color = PLATFORM_COLORS[data.platform] || '#6b7280'
  return (
    <div style={{ background:`${color}10`, border:`1px solid ${color}30`,
      borderRadius:14, padding:'12px 14px', marginTop:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <span style={{ fontSize:16 }}>{data.icon}</span>
        <span style={{ fontSize:11, fontWeight:800, color, letterSpacing:'0.05em' }}>{data.label}</span>
      </div>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {data.stats?.map((s, i) => (
          <div key={i}>
            <p style={{ fontSize:15, fontWeight:900, color:'var(--text-primary)', margin:0 }}>{s.v}</p>
            <p style={{ fontSize:10, color:'var(--text-faint)', margin:0, fontWeight:600 }}>{s.k}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Formulaire de commentaires ── */
function CommentsSection({ postId, token, commentCount }) {
  const { user } = useStore()
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const load = async () => {
    if (loaded) return
    const r = await axios.get(`${API}/community/posts/${postId}/comments`, {
      headers: { Authorization:`Bearer ${token}` }
    })
    setComments(r.data)
    setLoaded(true)
  }

  const toggle = () => {
    if (!open) load()
    setOpen(v => !v)
  }

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      const r = await axios.post(`${API}/community/posts/${postId}/comments`, { text }, {
        headers: { Authorization:`Bearer ${token}` }
      })
      setComments(prev => [...prev, r.data])
      setText('')
    } catch {}
    setSending(false)
  }

  const total = comments.length || commentCount

  return (
    <div>
      <button onClick={toggle}
        style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
          color:'var(--text-secondary)', padding:0, display:'flex', alignItems:'center', gap:5 }}>
        💬 {total > 0 ? total : ''} {total === 1 ? 'commentaire' : total > 1 ? 'commentaires' : 'Commenter'}
        {total > 0 && <span style={{ fontSize:11 }}>{open ? '▲' : '▼'}</span>}
      </button>

      {open && (
        <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:10 }}>
          {comments.map(c => (
            <div key={c.id} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <Avatar user={c} size={30}/>
              <div style={{ flex:1, background:'var(--bg-base)', borderRadius:12, padding:'10px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'var(--text-primary)' }}>{c.userName}</span>
                  <RoleBadge role={c.userRole}/>
                  <span style={{ fontSize:10, color:'var(--text-faint)', marginLeft:'auto' }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0, lineHeight:1.5 }}>{c.text}</p>
              </div>
            </div>
          ))}

          {/* Input */}
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <Avatar user={{ userName:user?.name, userRole:user?.role, userColor:'var(--accent)' }} size={30}/>
            <div style={{ flex:1, display:'flex', gap:8 }}>
              <input value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
                placeholder="Ajouter un commentaire…"
                style={{ flex:1, padding:'9px 14px', borderRadius:12, fontSize:13,
                  background:'var(--bg-base)', border:'1px solid var(--border)',
                  color:'var(--text-primary)', outline:'none' }}/>
              <button onClick={send} disabled={!text.trim() || sending}
                style={{ padding:'9px 14px', borderRadius:12, fontSize:13, fontWeight:700,
                  background:'var(--accent)', color:'#fff', border:'none', cursor:'pointer',
                  opacity: (!text.trim() || sending) ? 0.5 : 1 }}>
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Post Card ── */
function PostCard({ post, token, currentUserId, currentUserRole, onLike, onDelete }) {
  const typeInfo = POST_TYPES.find(t => t.id === post.type) || POST_TYPES[POST_TYPES.length-1]
  const [likeAnim, setLikeAnim] = useState(false)

  const handleLike = () => {
    setLikeAnim(true)
    setTimeout(() => setLikeAnim(false), 400)
    onLike(post.id)
  }

  const canDelete = post.userId === currentUserId || currentUserRole === 'admin'

  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20,
      padding:'20px 22px', display:'flex', flexDirection:'column', gap:14, transition:'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 24px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Avatar user={post} size={42}/>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:14, fontWeight:900, color:'var(--text-primary)' }}>{post.userName}</span>
              <RoleBadge role={post.userRole}/>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
              <span style={{ fontSize:11, color:'var(--text-faint)' }}>{timeAgo(post.createdAt)}</span>
              <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--border)', display:'inline-block' }}/>
              <span style={{ fontSize:11, fontWeight:700,
                color: ROLE_COLOR[post.userRole] || 'var(--text-faint)',
                background:`${ROLE_COLOR[post.userRole]}12`, padding:'1px 7px', borderRadius:99 }}>
                {typeInfo.icon} {typeInfo.label}
              </span>
            </div>
          </div>
        </div>
        {canDelete && (
          <button onClick={() => onDelete(post.id)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-faint)',
              fontSize:16, padding:'4px 8px', borderRadius:8, lineHeight:1 }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.color='#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-faint)' }}>
            ×
          </button>
        )}
      </div>

      {/* Texte */}
      <p style={{ fontSize:14, color:'var(--text-primary)', lineHeight:1.65, margin:0, whiteSpace:'pre-wrap' }}>
        {post.text}
      </p>

      {/* Image */}
      {post.image && (
        <img src={post.image} alt="" style={{ width:'100%', borderRadius:14, maxHeight:360, objectFit:'cover' }}/>
      )}

      {/* Données santé */}
      {post.healthData && <HealthCard data={post.healthData}/>}

      {/* Actions */}
      <div style={{ display:'flex', alignItems:'center', gap:20, paddingTop:4,
        borderTop:'1px solid var(--border)' }}>
        <button onClick={handleLike}
          style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none',
            cursor:'pointer', fontSize:13, fontWeight:700, padding:0,
            color: post.likedByMe ? '#ef4444' : 'var(--text-secondary)',
            transform: likeAnim ? 'scale(1.35)' : 'scale(1)', transition:'transform 0.2s' }}>
          <span style={{ fontSize:16 }}>{post.likedByMe ? '❤️' : '🤍'}</span>
          {post.likes > 0 && post.likes}
        </button>

        <CommentsSection postId={post.id} token={token} commentCount={post.commentCount}/>

        <div style={{ flex:1 }}/>
        <span style={{ fontSize:11, color:'var(--text-faint)' }}>
          {new Date(post.createdAt).toLocaleDateString('fr-FR', { day:'numeric', month:'long' })}
        </span>
      </div>
    </div>
  )
}

/* ── Composer ── */
function Composer({ token, onPost }) {
  const { user } = useStore()
  const [text, setText] = useState('')
  const [type, setType] = useState('general')
  const [image, setImage] = useState(null)
  const [attachHealth, setAttachHealth] = useState(false)
  const [connections, setConnections] = useState({})
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [posting, setPosting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const imgRef = useRef()
  const textRef = useRef()

  useEffect(() => {
    axios.get(`${API}/health/connections`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => setConnections(r.data))
      .catch(() => {})
  }, [token])

  const connectedPlatforms = Object.entries(connections).filter(([,v]) => v?.connected)

  const handleImage = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    const b64 = await compressImage(f, 1200, 0.8) // photo de post compressée
    setImage(b64)
  }

  const buildHealthData = () => {
    if (!selectedPlatform) return null
    const PLATFORM_NAMES = { strava:'Strava', garmin:'Garmin Connect', oura:'Oura Ring', polar:'Polar Flow', apple:'Apple Santé' }
    const PLATFORM_MOCK_STATS = {
      strava:  [{ k:'Distance', v:'8.2 km' },{ k:'Allure', v:"5'10\"/km" },{ k:'Durée', v:'42min' },{ k:'Calories', v:'420 kcal' }],
      garmin:  [{ k:'Durée', v:'1h 05m' },{ k:'FC moy.', v:'138 bpm' },{ k:'Calories', v:'560 kcal' },{ k:'Body Battery', v:'72 %' }],
      oura:    [{ k:'Score sommeil', v:'88/100' },{ k:'HRV', v:'56 ms' },{ k:'FC repos', v:'51 bpm' },{ k:'Readiness', v:'92/100' }],
      polar:   [{ k:'Durée', v:'55min' },{ k:'FC moy.', v:'145 bpm' },{ k:'Charge cardiaque', v:'260' },{ k:'Calories', v:'490 kcal' }],
      apple:   [{ k:'Pas', v:'10 247' },{ k:'Calories', v:'2 340 kcal' },{ k:'Exercice', v:'48min' },{ k:'Debout', v:'11h' }],
    }
    return {
      platform: selectedPlatform,
      icon: PLATFORM_ICONS[selectedPlatform],
      label: PLATFORM_NAMES[selectedPlatform],
      stats: PLATFORM_MOCK_STATS[selectedPlatform] || [],
    }
  }

  const submit = async () => {
    if (!text.trim()) return
    setPosting(true)
    try {
      const r = await axios.post(`${API}/community/posts`, {
        text, type,
        image: image || null,
        healthData: attachHealth ? buildHealthData() : null,
      }, { headers:{ Authorization:`Bearer ${token}` } })
      onPost(r.data)
      setText(''); setImage(null); setType('general')
      setAttachHealth(false); setSelectedPlatform(null); setExpanded(false)
    } catch {}
    setPosting(false)
  }

  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20,
      padding:'18px 20px', marginBottom:20 }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <Avatar user={{ userName:user?.name, userRole:user?.role, userColor:'var(--accent)' }} size={42}/>
        <div style={{ flex:1 }}>
          <textarea
            ref={textRef}
            value={text}
            onChange={e => { setText(e.target.value); if (!expanded && e.target.value) setExpanded(true) }}
            onFocus={() => setExpanded(true)}
            placeholder="Partage ta séance, ta progression, un conseil…"
            rows={expanded ? 4 : 2}
            style={{ width:'100%', padding:'12px 14px', borderRadius:14, fontSize:14,
              background:'var(--bg-base)', border:'1px solid var(--border)',
              color:'var(--text-primary)', outline:'none', resize:'none',
              lineHeight:1.6, fontFamily:'inherit', boxSizing:'border-box',
              transition:'border-color 0.2s' }}
            onMouseEnter={e => e.target.style.borderColor='var(--accent)'}
            onMouseLeave={e => e.target.style.borderColor='var(--border)'}
          />

          {expanded && (
            <>
              {/* Image preview */}
              {image && (
                <div style={{ position:'relative', marginTop:8, display:'inline-block' }}>
                  <img src={image} alt="" style={{ maxHeight:200, borderRadius:12, maxWidth:'100%' }}/>
                  <button onClick={() => setImage(null)}
                    style={{ position:'absolute', top:6, right:6, width:24, height:24,
                      borderRadius:'50%', background:'rgba(0,0,0,0.6)', color:'#fff',
                      border:'none', cursor:'pointer', fontSize:14, display:'flex',
                      alignItems:'center', justifyContent:'center' }}>×</button>
                </div>
              )}

              {/* Données santé attachées */}
              {attachHealth && selectedPlatform && (
                <div style={{ marginTop:8 }}>
                  <HealthCard data={buildHealthData()}/>
                </div>
              )}

              {/* Toolbar */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, flexWrap:'wrap' }}>
                {/* Type */}
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', flex:1 }}>
                  {POST_TYPES.slice(1).map(t => (
                    <button key={t.id} onClick={() => setType(t.id)}
                      style={{ padding:'5px 10px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer',
                        background: type===t.id ? 'var(--accent)' : 'var(--bg-base)',
                        color: type===t.id ? '#fff' : 'var(--text-secondary)',
                        border:`1px solid ${type===t.id ? 'transparent' : 'var(--border)'}` }}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>

                {/* Photo */}
                <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImage}/>
                <button onClick={() => imgRef.current?.click()}
                  title="Ajouter une photo"
                  style={{ width:36, height:36, borderRadius:10, border:'1px solid var(--border)',
                    background:'var(--bg-base)', cursor:'pointer', fontSize:16, display:'flex',
                    alignItems:'center', justifyContent:'center' }}>📷</button>

                {/* Health data */}
                {connectedPlatforms.length > 0 && (
                  <div style={{ position:'relative' }}>
                    <button
                      onClick={() => setAttachHealth(v => !v)}
                      title="Attacher données santé"
                      style={{ width:36, height:36, borderRadius:10, cursor:'pointer', fontSize:16,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        border:`1px solid ${attachHealth ? 'var(--accent)' : 'var(--border)'}`,
                        background: attachHealth ? 'var(--accent-subtle)' : 'var(--bg-base)',
                        color: attachHealth ? 'var(--accent)' : 'inherit' }}>
                      🔗
                    </button>
                    {attachHealth && (
                      <div style={{ position:'absolute', bottom:'110%', left:0, zIndex:200, minWidth:180,
                        background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14,
                        boxShadow:'0 8px 24px rgba(0,0,0,0.2)', padding:8, display:'flex', flexDirection:'column', gap:4 }}>
                        {connectedPlatforms.map(([pid]) => (
                          <button key={pid} onClick={() => { setSelectedPlatform(pid) }}
                            style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:10,
                              fontSize:12, fontWeight:700, cursor:'pointer', border:'none', textAlign:'left',
                              background: selectedPlatform===pid ? `${PLATFORM_COLORS[pid]}18` : 'transparent',
                              color: selectedPlatform===pid ? PLATFORM_COLORS[pid] : 'var(--text-secondary)' }}>
                            {PLATFORM_ICONS[pid]} {pid.charAt(0).toUpperCase()+pid.slice(1)}
                            {selectedPlatform===pid && ' ✓'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button onClick={submit} disabled={!text.trim() || posting}
                  style={{ padding:'9px 20px', borderRadius:12, fontSize:13, fontWeight:800,
                    background:'var(--accent)', color:'#fff', border:'none', cursor:'pointer',
                    opacity: (!text.trim() || posting) ? 0.5 : 1, marginLeft:'auto' }}>
                  {posting ? '…' : 'Publier'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Page principale ── */
export default function Community() {
  const { token, user } = useStore()
  const [posts, setPosts]       = useState([])
  const [filter, setFilter]     = useState('all')
  const [page, setPage]         = useState(0)
  const [hasMore, setHasMore]   = useState(true)
  const [loading, setLoading]   = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const loaderRef = useRef()

  const fetchPosts = useCallback(async (p = 0, f = filter, reset = false) => {
    if (p === 0) setLoading(true); else setLoadingMore(true)
    try {
      const r = await axios.get(`${API}/community/posts?page=${p}&filter=${f}`, {
        headers: { Authorization:`Bearer ${token}` }
      })
      setPosts(prev => reset || p === 0 ? r.data.posts : [...prev, ...r.data.posts])
      setHasMore(r.data.hasMore)
      setPage(p)
    } catch {}
    setLoading(false); setLoadingMore(false)
  }, [token, filter])

  useEffect(() => { fetchPosts(0, filter, true) }, [filter])

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        fetchPosts(page + 1, filter, false)
      }
    }, { threshold: 0.1 })
    if (loaderRef.current) obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, page, filter])

  const handleLike = async (postId) => {
    try {
      const r = await axios.post(`${API}/community/posts/${postId}/like`, {}, {
        headers: { Authorization:`Bearer ${token}` }
      })
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes:r.data.likes, likedByMe:r.data.likedByMe } : p))
    } catch {}
  }

  const handleDelete = async (postId) => {
    if (!window.confirm('Supprimer ce post ?')) return
    try {
      await axios.delete(`${API}/community/posts/${postId}`, {
        headers: { Authorization:`Bearer ${token}` }
      })
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch {}
  }

  const handlePost = (newPost) => {
    setPosts(prev => [{ ...newPost, likedByMe:false, likes:0, commentCount:0 }, ...prev])
  }

  const stats = {
    total: posts.length,
    workouts: posts.filter(p => p.type==='workout').length,
    tips: posts.filter(p => p.type==='tip').length,
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)' }}>
      <div style={{ maxWidth:680, margin:'0 auto', padding:'32px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
            <span style={{ fontSize:28 }}>🌐</span>
            <h1 style={{ fontSize:26, fontWeight:900, color:'var(--text-primary)', margin:0 }}>
              Communauté
            </h1>
          </div>
          <p style={{ color:'var(--text-faint)', fontSize:14 }}>
            Partage tes entraînements, tes victoires, tes conseils — avec toute la communauté ULTRA.
          </p>

          {/* Stats mini */}
          <div style={{ display:'flex', gap:16, marginTop:14, flexWrap:'wrap' }}>
            {[
              { label:'Publications', value:posts.length, icon:'✦' },
              { label:'Entraînements', value:posts.filter(p=>p.type==='workout').length, icon:'🏋️' },
              { label:'Conseils', value:posts.filter(p=>p.type==='tip').length, icon:'💡' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:6,
                background:'var(--bg-card)', border:'1px solid var(--border)',
                borderRadius:12, padding:'7px 14px' }}>
                <span style={{ fontSize:14 }}>{s.icon}</span>
                <span style={{ fontSize:14, fontWeight:900, color:'var(--text-primary)' }}>{s.value}</span>
                <span style={{ fontSize:11, color:'var(--text-faint)', fontWeight:600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Composer */}
        <Composer token={token} onPost={handlePost}/>

        {/* Filtres */}
        <div style={{ display:'flex', gap:6, marginBottom:20, overflowX:'auto', paddingBottom:4,
          scrollbarWidth:'none' }}>
          {POST_TYPES.map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              style={{ padding:'8px 14px', borderRadius:99, fontSize:12, fontWeight:700,
                cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'all 0.15s',
                background: filter===t.id ? 'var(--accent)' : 'var(--bg-card)',
                color: filter===t.id ? '#fff' : 'var(--text-secondary)',
                border:`1px solid ${filter===t.id ? 'transparent' : 'var(--border)'}` }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
                borderRadius:20, padding:'20px 22px', opacity:0.5 }}>
                <div style={{ display:'flex', gap:12, marginBottom:16 }}>
                  <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--bg-base)' }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ height:14, background:'var(--bg-base)', borderRadius:8, width:'40%', marginBottom:8 }}/>
                    <div style={{ height:10, background:'var(--bg-base)', borderRadius:8, width:'25%' }}/>
                  </div>
                </div>
                <div style={{ height:12, background:'var(--bg-base)', borderRadius:8, marginBottom:8 }}/>
                <div style={{ height:12, background:'var(--bg-base)', borderRadius:8, width:'80%' }}/>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <p style={{ fontSize:40, marginBottom:12 }}>🌱</p>
            <p style={{ fontSize:16, fontWeight:800, color:'var(--text-primary)', marginBottom:6 }}>
              {filter === 'all' ? 'Sois le premier à publier !' : 'Aucun post dans cette catégorie'}
            </p>
            <p style={{ color:'var(--text-faint)', fontSize:13 }}>
              Partage ta première séance ou un conseil avec la communauté.
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} token={token}
                currentUserId={user?.id} currentUserRole={user?.role}
                onLike={handleLike} onDelete={handleDelete}/>
            ))}
          </div>
        )}

        {/* Loader infinite scroll */}
        <div ref={loaderRef} style={{ height:40, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {loadingMore && <p style={{ color:'var(--text-faint)', fontSize:13 }}>Chargement…</p>}
          {!hasMore && posts.length > 0 && (
            <p style={{ color:'var(--text-faint)', fontSize:12, marginTop:20 }}>— Fin du fil —</p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  )
}
