const API = import.meta.env.VITE_API_URL || 'http://localhost:5001'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
}

export async function registerPush(token) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const { publicKey } = await fetch(`${API}/api/vapid-public-key`).then(r => r.json())

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    await fetch(`${API}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subscription }),
    })

    return true
  } catch {
    return false
  }
}

export async function fetchPrefs(token) {
  const res = await fetch(`${API}/api/push/prefs`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return { nutrition: true, programme: true, communaute: true }
  return res.json()
}

export async function savePrefs(token, prefs) {
  await fetch(`${API}/api/push/prefs`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(prefs),
  })
}
