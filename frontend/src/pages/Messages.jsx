import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'

const MOCK_CONVOS = [
  { id: 'c1', name: 'Alexandre Martin', role: 'client', lastMsg: 'Merci coach, j\'ai fait la séance 💪', time: 'il y a 12 min', unread: 2, online: true,  avatar: null },
  { id: 'c2', name: 'Marie Dubois',     role: 'client', lastMsg: 'Est-ce que je peux modifier le plan ?', time: 'il y a 1h',    unread: 0, online: true,  avatar: null },
  { id: 'c3', name: 'Thomas Bernard',  role: 'client', lastMsg: 'Ok j\'ai compris, merci !',             time: 'il y a 3h',    unread: 0, online: false, avatar: null },
  { id: 'c4', name: 'Lucas Petit',     role: 'client', lastMsg: 'Nouveau PR au deadlift 🔥 230kg',       time: 'hier',         unread: 1, online: false, avatar: null },
  { id: 'c5', name: 'Sophie Moreau',   role: 'client', lastMsg: 'Je n\'ai pas pu faire la session...',   time: 'il y a 2j',    unread: 0, online: false, avatar: null },
]

const MOCK_MSGS = {
  c1: [
    { id: 1, from: 'c1',   text: 'Bonjour coach !',                               time: '09:12' },
    { id: 2, from: 'me',   text: 'Bonjour Alex ! Comment ça se passe ?',           time: '09:14' },
    { id: 3, from: 'c1',   text: 'Super, j\'ai suivi le programme à la lettre 💪', time: '09:15' },
    { id: 4, from: 'me',   text: 'Excellent ! Les sensations sur le squat ?',       time: '09:16' },
    { id: 5, from: 'c1',   text: 'Très bien, j\'ai pris 5kg depuis la semaine dernière sur le back squat', time: '09:18' },
    { id: 6, from: 'me',   text: 'Parfait, continue comme ça. Semaine prochaine on passe à 80% du max.',  time: '09:20' },
    { id: 7, from: 'c1',   text: 'Merci coach, j\'ai fait la séance 💪',           time: 'il y a 12 min' },
  ],
  c2: [
    { id: 1, from: 'c2',   text: 'Bonjour, je voulais vous parler du plan nutrition', time: '10:00' },
    { id: 2, from: 'me',   text: 'Bien sûr Marie, dites-moi',                          time: '10:02' },
    { id: 3, from: 'c2',   text: 'Est-ce que je peux modifier le plan ?',              time: '10:05' },
  ],
}

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function Messages() {
  const { user } = useStore()
  const navigate = useNavigate()
  const { recipientId } = useParams()

  const [activeId, setActiveId] = useState(recipientId || 'c1')
  const [msgs, setMsgs]         = useState(MOCK_MSGS[activeId] || [])
  const [input, setInput]       = useState('')
  const [search, setSearch]     = useState('')
  const bottomRef               = useRef()

  const convo = MOCK_CONVOS.find(c => c.id === activeId)

  useEffect(() => {
    setMsgs(MOCK_MSGS[activeId] || [])
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const handleSend = e => {
    e.preventDefault()
    if (!input.trim()) return
    const newMsg = { id: msgs.length + 1, from: 'me', text: input.trim(), time: 'à l\'instant' }
    setMsgs(prev => [...prev, newMsg])
    setInput('')
  }

  const filtered = MOCK_CONVOS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ── Left panel: conversations ── */}
      <div className="w-72 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-card)' }}>
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
          {filtered.map(c => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
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
                {c.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400"
                    style={{ border: '2px solid var(--bg-card)' }}/>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                  <span className="text-[9px] flex-shrink-0 ml-1" style={{ color: 'var(--text-faint)' }}>{c.time}</span>
                </div>
                <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-faint)' }}>{c.lastMsg}</p>
              </div>
              {c.unread > 0 && (
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                  style={{ background: 'var(--accent)' }}>{c.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right panel: chat ── */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white"
              style={{ background: 'var(--accent)' }}>
              {convo ? initials(convo.name) : '?'}
            </div>
            {convo?.online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400" style={{ border: '2px solid var(--bg-card)' }}/>}
          </div>
          <div>
            <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{convo?.name}</p>
            <p className="text-[10px]" style={{ color: convo?.online ? '#4ade80' : 'var(--text-faint)' }}>
              {convo?.online ? '● En ligne' : '○ Hors ligne'}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <button className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
              style={{ background: 'rgba(39,174,96,0.1)', color: '#4ade80', border: '1px solid rgba(39,174,96,0.2)' }}>
              🥗 Nutrition
            </button>
            <button className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
              📋 Programme
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {msgs.map(msg => {
            const isMe = msg.from === 'me'
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white mr-2 flex-shrink-0 self-end"
                    style={{ background: 'var(--accent)' }}>
                    {convo ? initials(convo.name) : '?'}
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
                    }}>
                    {msg.text}
                  </div>
                  <p className={`text-[9px] mt-1 ${isMe ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-faint)' }}>
                    {msg.time}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder={`Message à ${convo?.name?.split(' ')[0] || ''}…`}
              className="flex-1 text-sm bg-transparent focus:outline-none"
              style={{ color: 'var(--text-primary)' }}/>
            <button type="submit" disabled={!input.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition disabled:opacity-30"
              style={{ background: 'var(--accent)' }}>
              ↑
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
