import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const ROLE_LABEL = { coach: 'Coach', nutritionist: 'Nutritionniste', health_pro: 'Pro de santé', client: 'Client' }

function initials(name) {
  return String(name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

export default function Messages() {
  const { user, token } = useStore()
  const navigate = useNavigate()
  const { recipientId } = useParams()
  const isMobile = useIsMobile()

  const [convos, setConvos]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeId, setActiveId] = useState(recipientId || null)
  // Mobile : un seul panneau à la fois — liste d'abord, chat après sélection
  const [mobileChatOpen, setMobileChatOpen] = useState(!!recipientId)
  const [msgs, setMsgs]         = useState([])
  const [input, setInput]       = useState('')
  const [search, setSearch]     = useState('')
  const [sending, setSending]   = useState(false)
  // Contact ouvert par URL directe mais pas (encore) dans mes conversations
  const [extraContact, setExtraContact] = useState(null)
  const bottomRef = useRef()
  const authHeaders = { Authorization: `Bearer ${token}` }

  const loadConvos = () =>
    fetch(`${API}/conversations`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setConvos(d) })
      .catch(() => {})
      .finally(() => setLoading(false))

  const loadThread = (id) =>
    fetch(`${API}/messages/${id}`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setMsgs(d) })
      .catch(() => {})

  // Conversations : chargement + rafraîchissement (non-lus, derniers messages)
  useEffect(() => {
    loadConvos()
    const t = setInterval(loadConvos, 5000)
    return () => clearInterval(t)
  }, [])

  // Fil actif : chargement + polling
  useEffect(() => {
    if (!activeId) return
    setMsgs([])
    loadThread(activeId)
    const t = setInterval(() => loadThread(activeId), 3000)
    return () => clearInterval(t)
  }, [activeId])

  // Arrivée par URL directe (ex. bouton « Contacter » d'un profil) : résoudre le nom si inconnu
  useEffect(() => {
    if (!recipientId) return
    setActiveId(recipientId)
    setMobileChatOpen(true)
    if (!convos.some(c => c.id === recipientId)) {
      fetch(`${API}/marketplace/${recipientId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.name) setExtraContact({ id: recipientId, name: d.name, role: d.role, lastMsg: '', unread: 0 }) })
        .catch(() => {})
    }
  }, [recipientId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length])

  const allConvos = extraContact && !convos.some(c => c.id === extraContact.id)
    ? [extraContact, ...convos] : convos
  const convo = allConvos.find(c => c.id === activeId)

  const handleSend = async e => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || !activeId) return
    setSending(true)
    setInput('')
    // Affichage optimiste
    setMsgs(prev => [...prev, { id: `tmp-${Date.now()}`, senderId: user.id, recipientId: activeId, message: text, createdAt: new Date().toISOString() }])
    try {
      const res = await fetch(`${API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ recipientId: activeId, message: text }),
      })
      if (!res.ok) throw new Error()
      await loadThread(activeId)
      loadConvos()
    } catch {
      setInput(text) // rends le texte à l'utilisateur en cas d'échec
      setMsgs(prev => prev.filter(m => !String(m.id).startsWith('tmp-')))
    }
    setSending(false)
  }

  const openConvo = (id) => { setActiveId(id); setMobileChatOpen(true) }

  const filtered = allConvos.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex" style={{ background: 'var(--bg-base)', height: '100dvh', paddingBottom: isMobile ? 62 : 0 }}>

      {/* ── Left panel: conversations (mobile : plein écran, masqué quand un chat est ouvert) ── */}
      {(!isMobile || !mobileChatOpen) && (
      <div className={isMobile ? 'w-full flex flex-col' : 'w-72 flex-shrink-0 flex flex-col'}
        style={{ borderRight: isMobile ? 'none' : '1px solid var(--border)', background: 'var(--bg-card)' }}>
        {/* Header */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-lg font-black mb-3" style={{ color: 'var(--text-primary)' }}>Messages</h2>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-faint)' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs focus:outline-none"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}/>
          </div>
        </div>

        {/* Convo list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="px-5 py-6 text-xs" style={{ color: 'var(--text-faint)' }}>Chargement…</p>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p style={{ fontSize: 30, margin: '0 0 8px' }}>💬</p>
              <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Aucune conversation</p>
              <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                {user?.role === 'coach'
                  ? 'Tes clients apparaîtront ici dès qu\'ils rejoindront tes programmes.'
                  : 'Rejoins un programme ou engage un coach pour discuter avec lui ici.'}
              </p>
            </div>
          )}
          {filtered.map(c => (
            <button key={c.id} onClick={() => openConvo(c.id)}
              className="w-full px-4 py-3.5 text-left flex items-center gap-3 transition-all"
              style={{
                background: activeId === c.id ? 'var(--accent-subtle)' : 'transparent',
                borderLeft: activeId === c.id ? '3px solid var(--accent)' : '3px solid transparent',
              }}
              onMouseEnter={e => { if (activeId !== c.id) e.currentTarget.style.background = 'var(--bg-base)' }}
              onMouseLeave={e => { if (activeId !== c.id) e.currentTarget.style.background = 'transparent' }}>
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white"
                  style={{ background: 'var(--accent)' }}>
                  {initials(c.name)}
                </div>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                  <span className="text-[9px] flex-shrink-0 ml-1" style={{ color: 'var(--text-faint)' }}>{fmtTime(c.lastAt)}</span>
                </div>
                <p className="text-[11px] truncate mt-0.5" style={{ color: c.unread > 0 ? 'var(--text-primary)' : 'var(--text-faint)', fontWeight: c.unread > 0 ? 700 : 400 }}>
                  {c.lastMsg || `${ROLE_LABEL[c.role] || ''} — démarre la conversation`}
                </p>
              </div>
              {c.unread > 0 && (
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                  style={{ background: 'var(--accent)' }}>{c.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* ── Right panel: chat (mobile : plein écran avec bouton retour) ── */}
      {(!isMobile || mobileChatOpen) && (
      <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
        {!convo ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-8 text-center">
            <p style={{ fontSize: 36 }}>💬</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Sélectionne une conversation</p>
          </div>
        ) : (
        <>
        {/* Chat header */}
        <div className="px-4 md:px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          {isMobile && (
            <button onClick={() => setMobileChatOpen(false)} title="Retour aux conversations"
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-bold"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              ←
            </button>
          )}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0"
            style={{ background: 'var(--accent)' }}>
            {initials(convo.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="font-black text-sm truncate" style={{ color: 'var(--text-primary)' }}>{convo.name}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{ROLE_LABEL[convo.role] || ''}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-3">
          {msgs.length === 0 && (
            <p className="text-center text-xs pt-10" style={{ color: 'var(--text-faint)' }}>
              Aucun message pour l'instant — écris le premier 👇
            </p>
          )}
          {msgs.map(msg => {
            const isMe = msg.senderId === user?.id
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white mr-2 flex-shrink-0 self-end"
                    style={{ background: 'var(--accent)' }}>
                    {initials(convo.name)}
                  </div>
                )}
                <div className="max-w-sm">
                  <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={{
                      background: isMe ? 'var(--accent)' : 'var(--bg-card)',
                      color: isMe ? '#fff' : 'var(--text-primary)',
                      border: isMe ? 'none' : '1px solid var(--border)',
                      borderBottomRightRadius: isMe ? 4 : undefined,
                      borderBottomLeftRadius:  isMe ? undefined : 4,
                      overflowWrap: 'anywhere',
                    }}>
                    {msg.message}
                  </div>
                  <p className={`text-[9px] mt-1 ${isMe ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-faint)' }}>
                    {fmtTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="px-4 md:px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder={`Message à ${convo.name?.split(' ')[0] || ''}…`}
              className="flex-1 text-sm bg-transparent focus:outline-none"
              style={{ color: 'var(--text-primary)' }}/>
            <button type="submit" disabled={!input.trim() || sending}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition disabled:opacity-30"
              style={{ background: 'var(--accent)' }}>
              ↑
            </button>
          </div>
        </form>
        </>
        )}
      </div>
      )}
    </div>
  )
}
