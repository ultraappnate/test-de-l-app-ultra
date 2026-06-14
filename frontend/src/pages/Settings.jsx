import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { registerPush, fetchPrefs, savePrefs } from '../services/pushNotifications'

function Toggle({ value, onChange, label, sublabel, icon, accent }) {
  return (
    <div className="flex items-center justify-between py-4"
      style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{label}</p>
          {sublabel && <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{sublabel}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative flex-shrink-0"
        style={{ width: 44, height: 26 }}>
        <div className="absolute inset-0 rounded-full transition-colors duration-200"
          style={{ background: value ? (accent || 'var(--accent)') : 'var(--border)' }} />
        <div className="absolute top-[3px] rounded-full transition-all duration-200 shadow"
          style={{
            width: 20, height: 20,
            background: '#fff',
            left: value ? 21 : 3,
          }} />
      </button>
    </div>
  )
}

export default function Settings() {
  const { token, user } = useStore()
  const [pushEnabled, setPushEnabled] = useState(false)
  const [prefs, setPrefs] = useState({ nutrition: true, programme: true, communaute: true })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [permDenied, setPermDenied] = useState(false)

  useEffect(() => {
    const init = async () => {
      setPermDenied(Notification.permission === 'denied')
      const isPushActive = 'serviceWorker' in navigator &&
        (await navigator.serviceWorker.getRegistrations()).length > 0 &&
        Notification.permission === 'granted'
      setPushEnabled(isPushActive)
      const p = await fetchPrefs(token)
      setPrefs(p)
      setLoading(false)
    }
    init()
  }, [token])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const handleTogglePush = async (val) => {
    if (val) {
      const ok = await registerPush(token)
      if (ok) {
        setPushEnabled(true)
        showToast('✓ Notifications activées')
      } else {
        setPermDenied(Notification.permission === 'denied')
        showToast('✗ Permission refusée par le navigateur')
      }
    } else {
      // Désabonnement : on supprime le SW
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const reg of regs) await reg.unregister()
      setPushEnabled(false)
      showToast('🔕 Notifications désactivées')
    }
  }

  const handlePrefChange = async (key, val) => {
    const next = { ...prefs, [key]: val }
    setPrefs(next)
    await savePrefs(token, next)
    showToast(val ? `✓ ${key.charAt(0).toUpperCase() + key.slice(1)} activé` : `🔕 ${key.charAt(0).toUpperCase() + key.slice(1)} en sourdine`)
  }

  const allMuted = !prefs.nutrition && !prefs.programme && !prefs.communaute

  const handleMuteAll = async (mute) => {
    const next = { nutrition: !mute, programme: !mute, communaute: !mute }
    setPrefs(next)
    await savePrefs(token, next)
    showToast(mute ? '🔕 Toutes les notifs en sourdine' : '🔔 Toutes les notifs réactivées')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast[0] === '✓' ? 'var(--accent)' : toast[0] === '🔔' ? 'var(--accent)' : '#374151', color: '#fff', padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 13 }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'clamp(16px,4vw,32px)' }}>

        <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--accent)' }}>ULTRA</p>
        <h1 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Paramètres</h1>

        {/* Section notifications push */}
        <div className="p-5 rounded-2xl mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-black tracking-widest uppercase mb-4" style={{ color: 'var(--text-faint)' }}>Notifications push</p>

          {permDenied && (
            <div className="mb-4 p-3 rounded-xl text-xs font-bold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠️ Les notifications sont bloquées dans les réglages de ton navigateur. Autorise-les manuellement puis relance l'app.
            </div>
          )}

          {loading ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-faint)' }}>Chargement…</p>
          ) : (
            <>
              <Toggle
                value={pushEnabled}
                onChange={handleTogglePush}
                icon="🔔"
                label="Notifications push"
                sublabel="Reçois des rappels même app fermée"
                accent="var(--accent)"
              />

              {pushEnabled && (
                <>
                  <div className="mt-2 mb-1">
                    <p className="text-[10px] font-black tracking-widest uppercase mt-4 mb-1" style={{ color: 'var(--text-faint)' }}>Catégories</p>

                    <Toggle
                      value={prefs.nutrition}
                      onChange={(v) => handlePrefChange('nutrition', v)}
                      icon="🥗"
                      label="Nutrition"
                      sublabel="Rappels repas & macros — 12h00"
                      accent="#27ae60"
                    />
                    <Toggle
                      value={prefs.programme}
                      onChange={(v) => handlePrefChange('programme', v)}
                      icon="💪"
                      label="Programme"
                      sublabel="Rappels séances & progression — 7h00"
                      accent="var(--accent)"
                    />
                    <Toggle
                      value={prefs.communaute}
                      onChange={(v) => handlePrefChange('communaute', v)}
                      icon="🌍"
                      label="Communauté"
                      sublabel="Rappels publications & engagement — 18h00"
                      accent="#8b5cf6"
                    />
                  </div>

                  <button
                    onClick={() => handleMuteAll(!allMuted)}
                    className="w-full mt-4 py-3 rounded-xl text-sm font-bold"
                    style={{
                      background: allMuted ? 'var(--accent)' : 'var(--bg-base)',
                      color: allMuted ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${allMuted ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                    {allMuted ? '🔔 Tout réactiver' : '🔕 Tout mettre en sourdine'}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Compte */}
        <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-black tracking-widest uppercase mb-4" style={{ color: 'var(--text-faint)' }}>Compte</p>
          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
              style={{ background: 'var(--accent)' }}>
              {user?.name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{user?.email}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
