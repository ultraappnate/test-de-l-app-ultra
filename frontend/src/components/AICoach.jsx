import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'

import API from '../config.js'

const SUGGESTIONS = [
  { role: 'coach',  text: 'Comment améliorer la rétention de mes clients ?' },
  { role: 'coach',  text: 'Génère un plan de séance HIIT pour débutant' },
  { role: 'coach',  text: 'Quels sont les meilleurs protocoles pour la prise de masse ?' },
  { role: 'client', text: 'Comment optimiser ma récupération post-séance ?' },
  { role: 'client', text: 'Quelle alimentation avant une séance de force ?' },
  { role: 'client', text: 'Comment progresser sur le squat stagnant ?' },
]

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm w-fit"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {[0,1,2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ background: 'var(--text-faint)', animationDelay: `${i * 150}ms` }}/>
      ))}
    </div>
  )
}

export default function AICoach() {
  const { user, token } = useStore()
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState(false)
  const bottomRef = useRef()
  const inputRef  = useRef()

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Bonjour ${user?.name?.split(' ')[0]} 👋 Je suis **ULTRA AI**, ton assistant coaching intelligent.\n\nJe peux t'aider avec :\n• Programmes d'entraînement personnalisés\n• Conseils nutrition & macros\n• Analyse de ta progression\n• Stratégies de coaching\n\nQue puis-je faire pour toi ?`,
        id: 'welcome',
      }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setApiError(false)

    const history = [...messages, userMsg]
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.ok) {
        const err = await res.json()
        if (res.status === 503) setApiError(true)
        throw new Error(err.message)
      }

      const aiMsg = { role: 'assistant', content: '', id: Date.now() + 1 }
      setMessages(prev => [...prev, aiMsg])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const { text, error } = JSON.parse(data)
            if (error) throw new Error(error)
            if (text) setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, content: m.content + text } : m))
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: apiError
          ? '⚠️ La clé API Anthropic n\'est pas configurée. Ajoute `ANTHROPIC_API_KEY` dans les variables d\'environnement du backend.'
          : `❌ Erreur: ${err.message}`,
        id: Date.now() + 2,
        isError: true,
      }])
    }
    setLoading(false)
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  // Render markdown bold/italic/bullets
  function renderContent(text) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      let el = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^• /, '• ')
      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: el }}/>
          {i < lines.length - 1 && <br/>}
        </span>
      )
    })
  }

  const suggestions = SUGGESTIONS.filter(s => s.role === user?.role || s.role === 'both').slice(0, 3)

  if (!user) return null

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)}
        className="fixed z-50 flex items-center justify-center transition-all duration-300 shadow-2xl"
        style={{
          bottom: 24, right: 24,
          width: open ? 48 : 56,
          height: open ? 48 : 56,
          borderRadius: open ? 14 : '50%',
          background: open ? 'var(--bg-card)' : 'linear-gradient(135deg, var(--accent) 0%, #c42840 100%)',
          border: open ? '1px solid var(--border)' : 'none',
          boxShadow: open ? 'none' : '0 8px 32px rgba(160,56,72,0.45)',
          color: open ? 'var(--text-muted)' : '#fff',
          fontSize: open ? 18 : 24,
        }}
        title={open ? 'Fermer' : 'ULTRA AI'}>
        {open ? '✕' : '✦'}
      </button>

      {/* Chat panel */}
      <div className={`fixed z-40 flex flex-col transition-all duration-300 origin-bottom-right ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        style={{
          bottom: 88, right: 24,
          width: 380, height: 560,
          borderRadius: 20,
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
          style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), #c42840)' }}>
            ✦
          </div>
          <div className="flex-1">
            <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>ULTRA AI</p>
            <p className="text-[10px] flex items-center gap-1" style={{ color: '#4ade80' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse"/>
              Coach IA · Disponible 24h/24
            </p>
          </div>
          <span className="text-[10px] font-black px-2 py-1 rounded-full"
            style={{ background: 'rgba(160,56,72,0.1)', color: 'var(--accent)', border: '1px solid rgba(160,56,72,0.2)' }}>
            Claude
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs mr-2 mt-0.5 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--accent), #c42840)', color: '#fff' }}>✦</div>
              )}
              <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={{
                  background: msg.role === 'user' ? 'var(--accent)' : msg.isError ? 'rgba(248,113,113,0.1)' : 'var(--bg-card)',
                  color: msg.role === 'user' ? '#fff' : msg.isError ? '#f87171' : 'var(--text-primary)',
                  border: msg.role === 'user' ? 'none' : `1px solid ${msg.isError ? 'rgba(248,113,113,0.2)' : 'var(--border)'}`,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : undefined,
                  borderBottomLeftRadius:  msg.role === 'assistant' ? 4 : undefined,
                }}>
                {renderContent(msg.content || '…')}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs mr-2 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--accent), #c42840)', color: '#fff' }}>✦</div>
              <TypingDots/>
            </div>
          )}

          {/* Suggestions (only when no convo yet) */}
          {messages.length <= 1 && !loading && (
            <div className="space-y-2 pt-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.text)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                  {s.text}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div className="flex items-end gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Pose ta question…"
              rows={1} className="flex-1 text-sm bg-transparent focus:outline-none resize-none leading-relaxed"
              style={{ color: 'var(--text-primary)', maxHeight: 80 }}/>
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition disabled:opacity-30 flex-shrink-0"
              style={{ background: 'var(--accent)' }}>
              ↑
            </button>
          </div>
          <p className="text-[9px] text-center mt-1.5" style={{ color: 'var(--text-faint)' }}>
            Propulsé par Claude · Anthropic
          </p>
        </div>
      </div>
    </>
  )
}
