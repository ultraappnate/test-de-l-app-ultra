import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const SUGGESTIONS = [
  { icon: '💪', text: 'Comment progresser plus vite en force ?' },
  { icon: '🥗', text: 'Que manger avant et après l\'entraînement ?' },
  { icon: '😴', text: 'Comment optimiser ma récupération ?' },
  { icon: '📈', text: 'J\'ai un plateau depuis 3 semaines, que faire ?' },
  { icon: '🏃', text: 'Comment combiner cardio et musculation ?' },
  { icon: '🤕', text: 'J\'ai une légère douleur au genou, conseils ?' },
]

function MarkdownText({ text }) {
  // Rendu markdown minimal : gras, listes, sauts de ligne
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />
        const isList = line.trim().startsWith('- ') || line.trim().startsWith('• ') || /^\d+\./.test(line.trim())
        const formatted = line
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/^[-•]\s+/, '')
          .replace(/^\d+\.\s+/, '')
        return isList
          ? <div key={i} className="flex gap-2 items-start">
              <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>•</span>
              <span dangerouslySetInnerHTML={{ __html: formatted }} />
            </div>
          : <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
      })}
    </div>
  )
}

export default function AICoach() {
  const { user, token } = useStore()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [noKey, setNoKey] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const content = text || input.trim()
    if (!content || streaming) return
    setInput('')

    const userMsg = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setStreaming(true)

    // Placeholder réponse AI
    const aiPlaceholder = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, aiPlaceholder])

    try {
      const controller = new AbortController()
      abortRef.current = controller

      const res = await fetch(`${API}/ai/coach-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: newMessages }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        if (err.message?.includes('non configurée')) setNoKey(true)
        throw new Error(err.message || 'Erreur')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
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
            if (text) {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + text,
                }
                return updated
              })
            }
          } catch {}
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: noKey
              ? '⚠️ Le coach IA n\'est pas encore configuré. Ajoute la clé ANTHROPIC_API_KEY sur Railway pour l\'activer.'
              : '⚠️ Une erreur est survenue. Réessaie dans un instant.',
            error: true,
          }
          return updated
        })
      }
    } finally {
      setStreaming(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--bg-base)' }}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #c42840 100%)' }}>
          🤖
        </div>
        <div>
          <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>ULTRA AI Coach</p>
          <p className="text-[10px]" style={{ color: '#27ae60' }}>● En ligne · Réponse instantanée</p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])}
            className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-faint)' }}>
            Effacer
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* État vide */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center pt-6 pb-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-4"
              style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #c42840 100%)' }}>
              🤖
            </div>
            <h2 className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
              Ton coach personnel
            </h2>
            <p className="text-sm text-center mb-6 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              Je connais ton profil, ton programme et tes objectifs. Pose-moi n'importe quelle question.
            </p>

            {/* Profil résumé */}
            {user?.objective && (
              <div className="flex gap-2 flex-wrap justify-center mb-6">
                {user.objective && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    🎯 {user.objective}
                  </span>
                )}
                {user.level && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    {user.level}
                  </span>
                )}
              </div>
            )}

            {/* Suggestions */}
            <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-3"
              style={{ color: 'var(--text-faint)' }}>
              Questions fréquentes
            </p>
            <div className="w-full max-w-sm space-y-2">
              {SUGGESTIONS.map(s => (
                <button key={s.text} onClick={() => sendMessage(s.text)}
                  className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold transition-opacity hover:opacity-80"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <span>{s.icon}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-1"
                style={{ background: 'linear-gradient(135deg, var(--accent), #c42840)' }}>
                🤖
              </div>
            )}
            <div className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={{
                background: msg.role === 'user'
                  ? 'var(--accent)'
                  : msg.error
                    ? 'rgba(239,68,68,0.1)'
                    : 'var(--bg-card)',
                color: msg.role === 'user' ? '#fff' : msg.error ? '#ef4444' : 'var(--text-primary)',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
              }}>
              {msg.role === 'assistant' && msg.content
                ? <MarkdownText text={msg.content} />
                : msg.role === 'assistant' && !msg.content
                  ? <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-faint)', animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-faint)', animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-faint)', animationDelay: '300ms' }} />
                    </span>
                  : msg.content
              }
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-1"
                style={{ background: 'var(--accent)', opacity: 0.7 }}>
                {user?.name?.[0] || '?'}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2 items-end max-w-2xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
            onKeyDown={handleKey}
            placeholder="Pose ta question au coach…"
            rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm outline-none"
            style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              maxHeight: 120,
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white flex-shrink-0 transition-opacity"
            style={{ background: 'var(--accent)', opacity: !input.trim() || streaming ? 0.4 : 1 }}>
            {streaming ? '…' : '↑'}
          </button>
        </div>
        <p className="text-center text-[10px] mt-2" style={{ color: 'var(--text-faint)' }}>
          ULTRA AI · Propulsé par Claude · Ne remplace pas un avis médical
        </p>
      </div>
    </div>
  )
}
