import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'

// Base Adresse Nationale (officielle, gratuite, sans clé) — registre des adresses françaises
const BAN_URL = 'https://api-adresse.data.gouv.fr/search/'

export default function LocationSettings() {
  const { user, updateProfile } = useStore()
  const [enabled, setEnabled] = useState(user?.locationEnabled ?? !!user?.location)
  const [location, setLocation] = useState(user?.location || null)
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const debounceRef = useRef(null)

  useEffect(() => {
    setEnabled(user?.locationEnabled ?? !!user?.location)
    setLocation(user?.location || null)
  }, [user?.id])

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  // Recherche d'adresse (BAN) avec debounce
  useEffect(() => {
    if (!editing) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 3) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`${BAN_URL}?q=${encodeURIComponent(query)}&limit=6&autocomplete=1`)
        const data = await res.json()
        setResults(data.features || [])
      } catch { setResults([]) }
      setSearching(false)
    }, 300)
    return () => debounceRef.current && clearTimeout(debounceRef.current)
  }, [query, editing])

  async function persist(nextEnabled, nextLocation) {
    setSaving(true)
    const res = await updateProfile({ locationEnabled: nextEnabled, location: nextLocation })
    setSaving(false)
    return res?.success
  }

  async function handleToggle(val) {
    setEnabled(val)
    const ok = await persist(val, location)
    if (ok) showToast(val ? '📍 Position activée' : '🚫 Position désactivée')
    if (val && !location) setEditing(true)
  }

  async function selectAddress(feature) {
    const p = feature.properties
    const [lng, lat] = feature.geometry.coordinates
    const loc = {
      lat, lng,
      label: p.label,                       // adresse complète validée
      address: p.name || p.label,           // n° + rue
      city: p.city || '',
      postcode: p.postcode || '',
      context: p.context || '',
      validated: true,
    }
    setLocation(loc)
    setEditing(false)
    setQuery(''); setResults([])
    const ok = await persist(true, loc)
    setEnabled(true)
    if (ok) showToast('✓ Adresse enregistrée')
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast[0] === '🚫' ? '#374151' : 'var(--accent)', color: '#fff', padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 13 }}>
          {toast}
        </div>
      )}

      {/* Carte principale */}
      <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: 'var(--text-faint)' }}>Ma position</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Partage une adresse exacte (validée par le registre national français) pour apparaître sur la carte et être trouvé près de toi.
        </p>

        {/* Toggle activer/désactiver */}
        <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{enabled ? '📍' : '🚫'}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Partager ma position</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                {enabled ? 'Ta position est active' : 'Ta position est masquée'}
              </p>
            </div>
          </div>
          <button onClick={() => handleToggle(!enabled)} disabled={saving} className="relative flex-shrink-0" style={{ width: 44, height: 26, cursor: saving ? 'wait' : 'pointer' }}>
            <div className="absolute inset-0 rounded-full transition-colors duration-200" style={{ background: enabled ? 'var(--accent)' : 'var(--border)' }} />
            <div className="absolute top-[3px] rounded-full transition-all duration-200 shadow" style={{ width: 20, height: 20, background: '#fff', left: enabled ? 21 : 3 }} />
          </button>
        </div>

        {/* Zone adresse (visible si activé) */}
        {enabled && (
          <div className="mt-4">
            {/* Adresse actuelle */}
            {location && !editing && (
              <div className="p-3.5 rounded-xl flex items-start gap-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <span className="text-lg mt-0.5">🏠</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{location.label || location.address}</p>
                  {location.city && <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{location.postcode} {location.city}</p>}
                  {location.validated && (
                    <span className="inline-block text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>✓ Adresse validée</span>
                  )}
                </div>
                <button onClick={() => { setEditing(true); setQuery('') }} className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  Modifier
                </button>
              </div>
            )}

            {/* Recherche d'adresse */}
            {(editing || !location) && (
              <div>
                <label className="text-xs font-bold block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {location ? 'Nouvelle adresse' : 'Choisis ton adresse exacte'}
                </label>
                <div className="relative">
                  <input
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ex : 12 rue du Faubourg, Paris…"
                    style={{ width: '100%', padding: '11px 13px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                  />
                  {searching && <span className="absolute right-3 top-3 text-xs" style={{ color: 'var(--text-faint)' }}>…</span>}
                </div>

                {/* Suggestions BAN */}
                {results.length > 0 && (
                  <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {results.map((f, i) => (
                      <button key={i} onClick={() => selectAddress(f)}
                        className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition-colors"
                        style={{ background: 'var(--bg-card)', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}>
                        <span style={{ fontSize: 14 }}>📌</span>
                        <div className="min-w-0">
                          <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{f.properties.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{f.properties.postcode} {f.properties.city}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {query.trim().length >= 3 && !searching && results.length === 0 && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>Aucune adresse trouvée. Vérifie l'orthographe.</p>
                )}
                {query.trim().length > 0 && query.trim().length < 3 && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>Tape au moins 3 caractères…</p>
                )}

                {location && (
                  <button onClick={() => { setEditing(false); setQuery(''); setResults([]) }} className="text-xs font-bold mt-3" style={{ color: 'var(--text-muted)' }}>
                    Annuler
                  </button>
                )}
              </div>
            )}

            {!location && !editing && (
              <button onClick={() => setEditing(true)} className="w-full py-3 rounded-xl text-sm font-bold mt-1" style={{ background: 'var(--accent)', color: '#fff' }}>
                + Ajouter mon adresse
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--text-faint)' }}>
        🔒 Tu peux modifier ou désactiver ta position à tout moment.
      </p>
    </div>
  )
}
