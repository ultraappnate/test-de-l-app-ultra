import { useRef, useEffect, useState } from 'react'
import { useStore } from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

export default function ShareCard({ program, streak, onClose }) {
  const canvasRef = useRef(null)
  const { user, token } = useStore()
  const [imageUrl, setImageUrl] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 1080, H = 1080
    canvas.width = W
    canvas.height = H

    // Fond dégradé
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#0d0408')
    bg.addColorStop(0.5, '#1a0810')
    bg.addColorStop(1, '#0d0408')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Grille subtile
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // Cercle glow accent
    const glow = ctx.createRadialGradient(W * 0.8, H * 0.2, 0, W * 0.8, H * 0.2, 400)
    glow.addColorStop(0, 'rgba(160,56,72,0.35)')
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // Logo ULTRA
    ctx.font = '900 52px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.letterSpacing = '8px'
    ctx.fillText('ULTRA', 80, 100)
    ctx.font = '400 22px system-ui'
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.letterSpacing = '4px'
    ctx.fillText('COACHING & NUTRITION', 82, 132)

    // Séparateur
    ctx.fillStyle = '#a03848'
    ctx.fillRect(80, 160, 120, 3)

    // Flamme streak
    if (streak?.current > 0) {
      ctx.font = '900 180px system-ui'
      ctx.fillText('🔥', W - 260, 260)
      ctx.font = '900 96px system-ui, sans-serif'
      ctx.fillStyle = '#ff6b35'
      ctx.textAlign = 'right'
      ctx.fillText(`${streak.current}`, W - 80, 310)
      ctx.font = '700 28px system-ui'
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillText('JOURS', W - 80, 348)
      ctx.textAlign = 'left'
    }

    // Titre programme
    const title = program?.title || 'Programme terminé'
    ctx.font = '900 88px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#ffffff'
    const words = title.split(' ')
    let line = '', y = 480
    for (const word of words) {
      const test = line ? line + ' ' + word : word
      if (ctx.measureText(test).width > W - 160) { ctx.fillText(line, 80, y); line = word; y += 96 }
      else line = test
    }
    ctx.fillText(line, 80, y)
    y += 60

    // Durée
    if (program?.duration) {
      ctx.font = '700 36px system-ui'
      ctx.fillStyle = '#a03848'
      ctx.fillText(`── ${program.duration}`, 80, y + 20)
      y += 70
    }

    // Stats ligne
    const stats = []
    if (program?.sessions) stats.push({ icon: '💪', label: program.sessions })
    if (program?.level) stats.push({ icon: '📊', label: program.level })
    if (program?.category) stats.push({ icon: '🏆', label: program.category })

    let sx = 80
    ctx.font = '700 28px system-ui'
    for (const stat of stats) {
      const text = `${stat.icon}  ${stat.label}`
      const tw = ctx.measureText(text).width
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.beginPath()
      ctx.roundRect(sx - 16, y, tw + 32, 52, 14)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText(text, sx, y + 35)
      sx += tw + 56
    }

    // Nom user
    ctx.font = '700 30px system-ui'
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillText(user?.name || 'Athlète ULTRA', 80, H - 80)

    // URL
    ctx.font = '500 26px system-ui'
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillText('ultra-app.com', 80, H - 44)

    // Badge étoile
    ctx.font = '500 24px system-ui'
    ctx.fillStyle = '#d4af37'
    ctx.textAlign = 'right'
    ctx.fillText('★ ULTRA Member', W - 80, H - 60)
    ctx.textAlign = 'left'

    setImageUrl(canvas.toDataURL('image/png'))
  }, [program, streak, user])

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `ultra-${program?.title?.replace(/\s+/g, '-').toLowerCase() || 'seance'}.png`
    a.click()
  }

  const handleShare = async () => {
    if (navigator.share && imageUrl) {
      try {
        const res = await fetch(imageUrl)
        const blob = await res.blob()
        const file = new File([blob], 'ultra-result.png', { type: 'image/png' })
        await navigator.share({ title: `ULTRA · ${program?.title}`, files: [file] })
        return
      } catch {}
    }
    // Fallback : copier le lien
    navigator.clipboard.writeText('https://test-de-l-app-ultra.vercel.app')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 0 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: 'var(--bg-card)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border)', padding: 20, paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>

        <div className="flex items-center justify-between mb-4">
          <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Partage ta perf 🔥</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-faint)' }}>✕</button>
        </div>

        {/* Preview carte */}
        {imageUrl && (
          <div className="rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: '1', maxHeight: 300 }}>
            <img src={imageUrl} alt="Carte résultat" className="w-full h-full object-cover" />
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="flex gap-2">
          <button onClick={handleShare}
            className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm"
            style={{ background: 'var(--accent)' }}>
            {copied ? '✓ Lien copié !' : '↗ Partager'}
          </button>
          <button onClick={handleDownload}
            className="flex-1 py-3.5 rounded-2xl font-black text-sm"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            ↓ Télécharger
          </button>
        </div>
        <p className="text-center text-[10px] mt-3" style={{ color: 'var(--text-faint)' }}>
          1080×1080 · Parfait pour Instagram & TikTok
        </p>
      </div>
    </div>
  )
}
