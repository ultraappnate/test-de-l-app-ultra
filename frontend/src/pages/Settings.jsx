import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { registerPush, fetchPrefs, savePrefs } from '../services/pushNotifications'
import LocationSettings from '../components/LocationSettings'

// ─── Toggle ───────────────────────────────────────────────
function Toggle({ value, onChange, label, sublabel, icon, accent }) {
  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{label}</p>
          {sublabel && <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{sublabel}</p>}
        </div>
      </div>
      <button onClick={() => onChange(!value)} className="relative flex-shrink-0" style={{ width: 44, height: 26 }}>
        <div className="absolute inset-0 rounded-full transition-colors duration-200"
          style={{ background: value ? (accent || 'var(--accent)') : 'var(--border)' }} />
        <div className="absolute top-[3px] rounded-full transition-all duration-200 shadow"
          style={{ width: 20, height: 20, background: '#fff', left: value ? 21 : 3 }} />
      </button>
    </div>
  )
}

// ─── Onglet Abonnement ────────────────────────────────────
const PREMIUM_FEATURES = [
  { icon: '💪', label: 'Tous les programmes Admin' },
  { icon: '🦾', label: 'Atlas Musculaire 3D complet' },
  { icon: '📈', label: 'Analytics de progression avancés' },
  { icon: '🌍', label: 'Communauté illimitée' },
  { icon: '🔗', label: 'Intégrations Strava & Garmin' },
  { icon: '🔔', label: 'Notifications personnalisées' },
]

const FREE_FEATURES = [
  { icon: '🎁', label: 'Programmes gratuits Admin' },
  { icon: '🗺', label: 'Carte Discover & experts' },
  { icon: '📋', label: 'Tracker nutrition basique' },
  { icon: '💬', label: 'Messages avec ton coach' },
]

function TabAbonnement() {
  const { user, activatePremium } = useStore()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const isPremium = user?.isPremium

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleActivate = async () => {
    setLoading(true)
    const res = await activatePremium()
    setLoading(false)
    if (res.success) showToast('★ Premium activé avec succès !')
    else showToast('✗ Erreur lors de l\'activation')
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast[0] === '★' ? 'var(--accent)' : '#ef4444', color: '#fff', padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 13 }}>
          {toast}
        </div>
      )}

      {/* Statut actuel */}
      <div className="p-5 rounded-2xl" style={{ background: isPremium ? 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)' : 'var(--bg-card)', border: `1px solid ${isPremium ? 'rgba(212,175,55,0.4)' : 'var(--border)'}` }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 20 }}>{isPremium ? '★' : '○'}</span>
            <p className="font-black text-base" style={{ color: isPremium ? 'var(--gold)' : 'var(--text-primary)' }}>
              {isPremium ? 'Premium actif' : 'Plan gratuit'}
            </p>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
            style={{ background: isPremium ? 'rgba(212,175,55,0.2)' : 'var(--bg-base)', color: isPremium ? 'var(--gold)' : 'var(--text-faint)', border: `1px solid ${isPremium ? 'rgba(212,175,55,0.4)' : 'var(--border)'}` }}>
            {isPremium ? 'ACTIF' : 'GRATUIT'}
          </span>
        </div>
        {isPremium && user?.premiumSince && (
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            Membre depuis le {new Date(user.premiumSince).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
        {isPremium && (
          <p className="text-xs mt-2 font-bold" style={{ color: 'var(--text-secondary)' }}>
            9,99 € / mois · Prochain renouvellement le {new Date(Date.now() + 30 * 24 * 3600000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </p>
        )}
      </div>

      {/* Plan Premium */}
      <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--gold)' }}>Premium</p>
            <div className="flex items-end gap-1 mt-0.5">
              <span className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>9,99</span>
              <span className="text-sm font-bold mb-1" style={{ color: 'var(--text-faint)' }}>€/mois</span>
            </div>
          </div>
          {isPremium && (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(212,175,55,0.15)' }}>
              ★
            </div>
          )}
        </div>

        <div className="space-y-2.5 mb-5">
          {PREMIUM_FEATURES.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm">{icon}</span>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              <span className="ml-auto text-xs font-black" style={{ color: isPremium ? 'var(--gold)' : '#27ae60' }}>✓</span>
            </div>
          ))}
        </div>

        {!isPremium ? (
          <button onClick={handleActivate} disabled={loading}
            className="w-full py-3.5 rounded-xl font-black text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #b8960c, #d4af37)', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Activation…' : '★ Passer Premium — 9,99 €/mois'}
          </button>
        ) : (
          <div className="py-3 text-center rounded-xl text-sm font-black"
            style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
            ★ Premium actif
          </div>
        )}

        {!isPremium && (
          <p className="text-xs text-center mt-2.5" style={{ color: 'var(--text-faint)' }}>
            Résiliable à tout moment · Démo (aucun paiement réel)
          </p>
        )}
      </div>

      {/* Plan gratuit */}
      <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>Gratuit</p>
            <div className="flex items-end gap-1 mt-0.5">
              <span className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>0</span>
              <span className="text-sm font-bold mb-1" style={{ color: 'var(--text-faint)' }}>€/mois</span>
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          {FREE_FEATURES.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm">{icon}</span>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              <span className="ml-auto text-xs font-black" style={{ color: 'var(--text-faint)' }}>✓</span>
            </div>
          ))}
        </div>
        {isPremium && (
          <button className="w-full mt-4 py-3 rounded-xl text-sm font-bold"
            style={{ background: 'var(--bg-base)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            Résilier l'abonnement
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Onglet Notifications ─────────────────────────────────
function TabNotifications() {
  const { token } = useStore()
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
      if (ok) { setPushEnabled(true); showToast('✓ Notifications activées') }
      else { setPermDenied(Notification.permission === 'denied'); showToast('✗ Permission refusée') }
    } else {
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
    showToast(val ? `✓ ${key.charAt(0).toUpperCase() + key.slice(1)} activé` : `🔕 En sourdine`)
  }

  const allMuted = !prefs.nutrition && !prefs.programme && !prefs.communaute

  const handleMuteAll = async (mute) => {
    const next = { nutrition: !mute, programme: !mute, communaute: !mute }
    setPrefs(next)
    await savePrefs(token, next)
    showToast(mute ? '🔕 Tout en sourdine' : '🔔 Tout réactivé')
  }

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast[0] === '✓' || toast[0] === '🔔' ? 'var(--accent)' : '#374151', color: '#fff', padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 13 }}>
          {toast}
        </div>
      )}

      <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: 'var(--text-faint)' }}>Notifications push</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Rappels quotidiens même app fermée</p>

        {permDenied && (
          <div className="mb-4 p-3 rounded-xl text-xs font-bold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            ⚠️ Notifications bloquées dans le navigateur. Autorise-les manuellement.
          </div>
        )}

        {loading ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-faint)' }}>Chargement…</p>
        ) : (
          <>
            <Toggle value={pushEnabled} onChange={handleTogglePush} icon="🔔" label="Notifications push" sublabel="Reçois des rappels même app fermée" accent="var(--accent)" />

            {pushEnabled && (
              <>
                <p className="text-[10px] font-black tracking-widest uppercase mt-5 mb-1" style={{ color: 'var(--text-faint)' }}>Catégories</p>
                <Toggle value={prefs.nutrition} onChange={v => handlePrefChange('nutrition', v)} icon="🥗" label="Nutrition" sublabel="Rappels repas & macros — 12h00" accent="#27ae60" />
                <Toggle value={prefs.programme} onChange={v => handlePrefChange('programme', v)} icon="💪" label="Programme" sublabel="Rappels séances & progression — 7h00" accent="var(--accent)" />
                <Toggle value={prefs.communaute} onChange={v => handlePrefChange('communaute', v)} icon="🌍" label="Communauté" sublabel="Rappels publications — 18h00" accent="#8b5cf6" />

                <button onClick={() => handleMuteAll(!allMuted)}
                  className="w-full mt-4 py-3 rounded-xl text-sm font-bold"
                  style={{ background: allMuted ? 'var(--accent)' : 'var(--bg-base)', color: allMuted ? '#fff' : 'var(--text-secondary)', border: `1px solid ${allMuted ? 'var(--accent)' : 'var(--border)'}` }}>
                  {allMuted ? '🔔 Tout réactiver' : '🔕 Tout mettre en sourdine'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Onglet Compte ────────────────────────────────────────
const SETTINGS_API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
const LEGAL_LINKS = [
  { slug: 'mentions-legales', label: 'Mentions légales' },
  { slug: 'confidentialite', label: 'Politique de confidentialité' },
  { slug: 'cgu', label: "Conditions d'utilisation (CGU)" },
  { slug: 'cgv', label: 'Conditions de vente (CGV)' },
  { slug: 'sante-et-ia', label: 'Données de santé & IA' },
  { slug: 'cookies', label: 'Cookies & traceurs' },
]

function TabCompte() {
  const { user, token, logout } = useStore()
  const [deleting, setDeleting] = useState(false)
  const [delPassword, setDelPassword] = useState('')
  const [delError, setDelError] = useState('')
  const [busy, setBusy] = useState(false)

  const ROLE_LABELS = { client: 'Sportif', coach: 'Coach', nutritionist: 'Nutritionniste', health_pro: 'Pro de santé', admin: 'Admin' }

  async function exportData() {
    try {
      const res = await fetch(`${SETTINGS_API}/account/export`, { headers: { Authorization: `Bearer ${token}` } })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'ultra-mes-donnees.json'; a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  async function confirmDelete() {
    if (!delPassword) { setDelError('Entre ton mot de passe pour confirmer.'); return }
    setBusy(true); setDelError('')
    try {
      const res = await fetch(`${SETTINGS_API}/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: delPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erreur')
      logout?.()
      window.location.href = '/login'
    } catch (e) { setDelError(e.message); setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-[10px] font-black tracking-widest uppercase mb-4" style={{ color: 'var(--text-faint)' }}>Profil</p>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
            style={{ background: 'var(--accent)' }}>
            {user?.name?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-black text-base" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{user?.email}</p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full mt-1 inline-block"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
        </div>
        <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Nom', value: user?.name },
            { label: 'Email', value: user?.email },
            { label: 'Membre depuis', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2">
              <p className="text-xs font-bold" style={{ color: 'var(--text-faint)' }}>{label}</p>
              <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-[10px] font-black tracking-widest uppercase mb-4" style={{ color: 'var(--text-faint)' }}>Application</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between py-2">
            <p className="text-xs font-bold" style={{ color: 'var(--text-faint)' }}>Version</p>
            <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>1.0.0</p>
          </div>
          <div className="flex items-center justify-between py-2" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs font-bold" style={{ color: 'var(--text-faint)' }}>Plateforme</p>
            <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Web App</p>
          </div>
        </div>
      </div>

      {/* Mes données — RGPD */}
      <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: 'var(--text-faint)' }}>Mes données (RGPD)</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Tu contrôles tes données : télécharge-les ou supprime ton compte à tout moment.</p>
        <button onClick={exportData}
          className="w-full py-3 rounded-xl text-sm font-bold mb-2"
          style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
          ⬇ Télécharger mes données
        </button>
        {!deleting ? (
          <button onClick={() => { setDeleting(true); setDelError('') }}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            🗑 Supprimer mon compte
          </button>
        ) : (
          <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#ef4444' }}>
              Action irréversible. Confirme avec ton mot de passe :
            </p>
            <input type="password" value={delPassword} onChange={e => setDelPassword(e.target.value)}
              placeholder="Ton mot de passe"
              className="w-full px-3 py-2.5 rounded-lg text-sm mb-2"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            {delError && <p className="text-xs mb-2" style={{ color: '#ef4444' }}>{delError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setDeleting(false); setDelPassword(''); setDelError('') }}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Annuler
              </button>
              <button onClick={confirmDelete} disabled={busy}
                className="flex-1 py-2.5 rounded-lg text-sm font-black text-white"
                style={{ background: '#ef4444', opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Informations légales */}
      <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-[10px] font-black tracking-widest uppercase mb-3" style={{ color: 'var(--text-faint)' }}>Informations légales</p>
        <div className="space-y-1">
          {LEGAL_LINKS.map(({ slug, label }) => (
            <a key={slug} href={`/legal/${slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between py-2.5"
              style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ color: 'var(--text-faint)' }}>›</span>
            </a>
          ))}
        </div>
      </div>

      <button
        onClick={() => { logout?.(); window.location.href = '/login' }}
        className="w-full py-3.5 rounded-xl text-sm font-black"
        style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
        ⏻ Se déconnecter
      </button>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────
const TABS = [
  { id: 'abonnement',    label: 'Abonnement', icon: '★' },
  { id: 'position',      label: 'Position',   icon: '📍' },
  { id: 'notifications', label: 'Notifs',     icon: '🔔' },
  { id: 'compte',        label: 'Compte',     icon: '👤' },
]

export default function Settings() {
  const { user, logout } = useStore()
  const [tab, setTab] = useState('abonnement')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'clamp(16px,4vw,32px)' }}>

        <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--accent)' }}>ULTRA</p>
        <h1 className="text-2xl font-black mb-5" style={{ color: 'var(--text-primary)' }}>Paramètres</h1>

        {/* Onglets */}
        <div className="flex gap-1 p-1 rounded-2xl mb-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all"
              style={{
                background: tab === t.id ? 'var(--accent)' : 'transparent',
                color: tab === t.id ? '#fff' : 'var(--text-muted)',
              }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {tab === 'abonnement'    && <TabAbonnement />}
        {tab === 'position'      && <LocationSettings />}
        {tab === 'notifications' && <TabNotifications />}
        {tab === 'compte'        && <TabCompte />}

      </div>
    </div>
  )
}
