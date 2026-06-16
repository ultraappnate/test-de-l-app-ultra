import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const NAV_CLIENT = [
  { to: '/dashboard',  label: 'Accueil',          icon: '⌂' },
  { to: '/ai-coach',   label: 'Coach IA',          icon: '🤖', short: 'Coach IA', highlight: true },
  { to: '/posture',    label: 'Analyse posturale', icon: '🧍', short: 'Posture' },
  { to: '/discover',   label: 'Découvrir',         icon: '🗺' },
  { to: '/programs',    label: 'Programmes',        icon: '◈', short: 'Prog' },
  { to: '/my-programs', label: 'Mes créations',   icon: '✏️', short: 'Créa' },
  { to: '/muscles',    label: 'Muscles 3D',        icon: '🦾', short: 'Muscles' },
  { to: '/nutrition',  label: 'Mon Tracker',       icon: '◎', short: 'Tracker' },
  { to: '/progress',   label: 'Ma progression',    icon: '↑', short: 'Progrès' },
  { to: '/health',       label: 'Applis Santé',    icon: '🔗' },
  { to: '/health-access',label: 'Pros de santé',   icon: '🩺', short: 'Santé' },
  { to: '/community',    label: 'Communauté',      icon: '🌐' },
  { to: '/chat',         label: 'Messages',        icon: '◉' },
  { to: '/calendar',     label: 'Calendrier',      icon: '▦' },
  { to: '/settings',     label: 'Paramètres',      icon: '⚙️' },
]
const NAV_COACH = [
  { to: '/dashboard',        label: 'Accueil',          icon: '⌂', short: 'Accueil' },
  { to: '/ai-coach',         label: 'Coach IA',         icon: '🤖', short: 'Coach IA', highlight: true },
  { to: '/coach/insights',   label: 'Radar Clients',    icon: '📡', short: 'Radar', highlight: true },
  { to: '/coach/profile',    label: 'Profil',            icon: '◈', short: 'Profil' },
  { to: '/programs',         label: 'Catalogue',        icon: '◉', short: 'Catal.' },
  { to: '/coach/programs',   label: 'Mes programmes',   icon: '▦', short: 'Prog' },
  { to: '/discover',         label: 'Carte experts',    icon: '🗺', short: 'Carte' },
  { to: '/muscles',          label: 'Muscles 3D',       icon: '🦾' },
  { to: '/coach/nutrition',  label: 'Suivi Nutrition',  icon: '◎' },
  { to: '/coach/sante',      label: 'Bilans santé',     icon: '🩺' },
  { to: '/clients',          label: 'Mes clients',      icon: '❯❯' },
  { to: '/health',           label: 'Applis Santé',     icon: '🔗' },
  { to: '/community',        label: 'Communauté',       icon: '🌐' },
  { to: '/chat',             label: 'Messages',         icon: '◆' },
  { to: '/analytics',        label: 'Statistiques',     icon: '↑' },
  { to: '/revenue',          label: 'Revenus',          icon: '◇' },
  { to: '/coach/upgrade',    label: 'Plan Coach',       icon: '★' },
  { to: '/calendar',         label: 'Calendrier',       icon: '▤' },
  { to: '/settings',         label: 'Paramètres',       icon: '⚙️' },
]
const NAV_NUTRITIONIST = [
  { to: '/nutri/dashboard',  label: 'Accueil',              icon: '⌂', short: 'Accueil' },
  { to: '/nutri/profile',    label: 'Profil',               icon: '◈', short: 'Profil' },
  { to: '/nutri/clients',    label: 'Mes clients',          icon: '❯❯', short: 'Clients' },
  { to: '/nutri/plans',      label: 'Plans nutritionnels',  icon: '◎', short: 'Plans' },
  { to: '/discover',         label: 'Carte experts',        icon: '🗺' },
  { to: '/nutri/recipes',    label: 'Mes recettes',         icon: '◆' },
  { to: '/nutri/resources',  label: 'Ebooks & Ressources',  icon: '▦' },
  { to: '/health',           label: 'Applis Santé',         icon: '🔗' },
  { to: '/community',        label: 'Communauté',           icon: '🌐' },
  { to: '/chat',             label: 'Messages',             icon: '◉' },
  { to: '/nutri/stats',      label: 'Statistiques',         icon: '↑' },
  { to: '/revenue',          label: 'Revenus',              icon: '◇' },
  { to: '/calendar',         label: 'Calendrier',           icon: '▤' },
  { to: '/settings',         label: 'Paramètres',           icon: '⚙️' },
]
const NAV_HEALTH_PRO = [
  { to: '/pro/dashboard', label: 'Accueil',       icon: '⌂', short: 'Accueil' },
  { to: '/pro/profile',   label: 'Profil',        icon: '◈', short: 'Profil' },
  { to: '/pro/patients',  label: 'Mes patients',  icon: '👥', short: 'Patients' },
  { to: '/discover',      label: 'Carte sportifs',icon: '🗺', short: 'Carte' },
  { to: '/chat',          label: 'Messages',      icon: '◉', short: 'Messages' },
  { to: '/calendar',      label: 'Calendrier',    icon: '▦', short: 'Agenda' },
  { to: '/community',     label: 'Communauté',    icon: '🌐', short: 'Commu' },
  { to: '/settings',     label: 'Paramètres',    icon: '⚙️', short: 'Params' },
]
const NAV_ADMIN = [
  { to: '/admin',             label: 'Panneau admin',      icon: '👑' },
  { to: '/programs',          label: 'Programmes',         icon: '◉' },
  { to: '/admin/exercises',   label: 'Biblio. exercices',  icon: '🏋️' },
  { to: '/analytics',         label: 'Analytiques',        icon: '↑' },
]

// Raccourcis bottom nav mobile (5 max)
const MOBILE_NAV = {
  coach:        ['/dashboard', '/coach/programs', '/community', '/chat', '/analytics'],
  client:       ['/dashboard', '/programs', '/community', '/chat', '/progress'],
  nutritionist: ['/nutri/dashboard', '/nutri/clients', '/community', '/chat', '/nutri/stats'],
  admin:        ['/admin', '/programs', '/analytics'],
}

function getNav(role) {
  if (role === 'coach') return NAV_COACH
  if (role === 'nutritionist') return NAV_NUTRITIONIST
  if (role === 'health_pro') return NAV_HEALTH_PRO
  if (role === 'admin') return NAV_ADMIN
  return NAV_CLIENT
}

function getRoleLabel(role) {
  if (role === 'coach') return 'Espace Coach'
  if (role === 'nutritionist') return 'Espace Nutrition'
  if (role === 'health_pro') return 'Espace Santé'
  if (role === 'admin') return 'Administration'
  return 'Coaching & Nutrition'
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

function NotificationBell({ collapsed }) {
  const { notifications, fetchNotifications, markNotifRead, markAllNotifsRead } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => { fetchNotifications() }, [])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const NOTIF_ICONS = { message: '💬', nutrition: '🥗', client: '👥', revenue: '💶', program: '📋', reminder: '⏰' }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        title={collapsed ? `Notifications${unread ? ` (${unread})` : ''}` : undefined}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition w-full text-left relative"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        <span className="text-base leading-none flex-shrink-0 relative">
          🔔
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
              style={{ background: 'var(--accent)', fontSize: 8 }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
        {!collapsed && <span>Notifications {unread > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black text-white" style={{ background: 'var(--accent)' }}>{unread}</span>}</span>}
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 rounded-2xl overflow-hidden shadow-2xl z-50"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Notifications</p>
            {unread > 0 && (
              <button onClick={markAllNotifsRead} className="text-[10px] font-bold hover:opacity-70 transition" style={{ color: 'var(--accent)' }}>
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-2xl mb-1">🔔</p>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Aucune notification</p>
              </div>
            ) : notifications.map(n => (
              <button key={n.id} onClick={() => { markNotifRead(n.id); if (n.link) { setOpen(false); navigate(n.link) } }}
                className="w-full text-left flex items-start gap-3 px-4 py-3 transition-all"
                style={{ background: n.read ? 'transparent' : 'var(--accent-subtle)', borderBottom: '1px solid var(--border)', cursor: n.link ? 'pointer' : 'default' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'var(--accent-subtle)'}>
                <span className="text-base flex-shrink-0 mt-0.5">{NOTIF_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.body}</p>
                  <p className="text-[9px] mt-1" style={{ color: 'var(--text-faint)' }}>Il y a {n.time}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {!n.read && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />}
                  {n.link && <span className="text-[9px] font-bold" style={{ color: 'var(--text-faint)' }}>→</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Bottom Nav Mobile ── */
function MobileBottomNav({ links, theme, setTheme, user }) {
  const navigate = useNavigate()
  const { logout } = useStore()
  const isDark = theme === 'dark'
  const [menuOpen, setMenuOpen] = useState(false)

  // Les 4 premiers liens + menu "Plus"
  const mainLinks = links.slice(0, 4)

  return (
    <>
      {/* Overlay menu "Plus" */}
      {menuOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:998, background:'rgba(0,0,0,0.5)' }}
          onClick={() => setMenuOpen(false)}>
          <div style={{ position:'absolute', bottom:70, left:0, right:0, margin:'0 12px',
            background:'var(--bg-card)', borderRadius:20, padding:16,
            border:'1px solid var(--border)', boxShadow:'0 -8px 32px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:12 }}>
              {links.slice(4).map(({ to, label, icon }) => (
                <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
                  style={({ isActive }) => ({
                    display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    padding:'10px 4px', borderRadius:14, textDecoration:'none',
                    background: isActive ? 'var(--accent)' : 'var(--bg-base)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                  })}>
                  <span style={{ fontSize:18 }}>{icon}</span>
                  <span style={{ fontSize:9, fontWeight:700, textAlign:'center', lineHeight:1.2 }}>{label}</span>
                </NavLink>
              ))}
            </div>
            {/* Actions */}
            <div style={{ display:'flex', gap:8, borderTop:'1px solid var(--border)', paddingTop:12 }}>
              <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
                style={{ flex:1, padding:'10px 0', borderRadius:12, fontSize:12, fontWeight:700,
                  background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer' }}>
                {isDark ? '☀ Clair' : '☾ Sombre'}
              </button>
              <button onClick={() => { logout(); navigate('/login'); setMenuOpen(false) }}
                style={{ flex:1, padding:'10px 0', borderRadius:12, fontSize:12, fontWeight:700,
                  background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
                  color:'#ef4444', cursor:'pointer' }}>
                ⏻ Quitter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barre du bas */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:999,
        background:'var(--sidebar-bg)', borderTop:'1px solid var(--sidebar-border)',
        display:'flex', alignItems:'center', paddingBottom:'env(safe-area-inset-bottom)',
        height: 60 }}>
        {mainLinks.map(({ to, label, icon, short }) => (
          <NavLink key={to} to={to} end={to === '/dashboard'}
            style={({ isActive }) => ({
              flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', gap:3, padding:'6px 0', textDecoration:'none',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            })}>
            <span style={{ fontSize:20, lineHeight:1 }}>{icon}</span>
            <span style={{ fontSize:9, fontWeight:700, lineHeight:1 }}>{short || label.split(' ')[0]}</span>
          </NavLink>
        ))}
        {/* Bouton Plus */}
        <button onClick={() => setMenuOpen(!menuOpen)}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', gap:3, padding:'6px 0', background:'none', border:'none',
            color: menuOpen ? 'var(--accent)' : 'var(--text-muted)', cursor:'pointer' }}>
          <span style={{ fontSize:20, lineHeight:1 }}>☰</span>
          <span style={{ fontSize:9, fontWeight:700, lineHeight:1 }}>Plus</span>
        </button>
      </nav>
    </>
  )
}

export default function Sidebar({ theme, setTheme, collapsed, setCollapsed }) {
  const { user, logout } = useStore()
  const navigate = useNavigate()
  const links = getNav(user?.role)
  const isMobile = useIsMobile()
  const isDark = theme === 'dark'

  // Sur mobile → barre de navigation en bas
  if (isMobile) {
    return <MobileBottomNav links={links} theme={theme} setTheme={setTheme} user={user} />
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col z-40 transition-all duration-300"
      style={{
        width: collapsed ? '60px' : '216px',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 min-h-[64px]"
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        {!collapsed && (
          <div>
            <span className="font-black tracking-[0.22em] text-lg" style={{ color: 'var(--text-primary)' }}>ULTRA</span>
            <p className="text-[10px] font-bold tracking-widest uppercase mt-0.5" style={{ color: 'var(--gold)' }}>
              {getRoleLabel(user?.role)}
            </p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 transition ml-auto text-sm font-bold"
          style={{ color: 'var(--text-muted)', background: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {links.map(({ to, label, icon, highlight }) => (
          <NavLink key={to} to={to} end={to === '/dashboard'} title={collapsed ? label : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={({ isActive }) => ({
              background: isActive ? 'var(--accent)' : highlight && !isActive ? 'rgba(39,174,96,0.08)' : 'transparent',
              color: isActive ? '#fff' : highlight ? '#27ae60' : 'var(--text-muted)',
              border: highlight && !isActive ? '1px solid rgba(39,174,96,0.25)' : '1px solid transparent',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.getAttribute('aria-current')) {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.getAttribute('aria-current')) {
                e.currentTarget.style.background = highlight ? 'rgba(39,174,96,0.08)' : 'transparent'
                e.currentTarget.style.color = highlight ? '#27ae60' : 'var(--text-muted)'
              }
            }}>
            <span className="w-4 text-center text-xs flex-shrink-0 leading-none font-black">{icon}</span>
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 pt-3 space-y-0.5" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={collapsed ? (isDark ? 'Mode clair' : 'Mode sombre') : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition w-full text-left"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}>
          <span className="text-base leading-none flex-shrink-0">{isDark ? '☀' : '☾'}</span>
          {!collapsed && <span>{isDark ? 'Mode clair' : 'Mode sombre'}</span>}
        </button>

        <NotificationBell collapsed={collapsed} />

        <button onClick={() => { logout(); navigate('/login') }}
          title={collapsed ? 'Déconnexion' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition w-full text-left"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(125,45,56,0.08)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}>
          <span className="text-base leading-none flex-shrink-0">⏻</span>
          {!collapsed && <span>Déconnexion</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mt-2 rounded-xl"
            style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border-soft)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
              style={{ background: 'var(--accent)' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>{user?.name}</p>
              <p className="text-[10px] capitalize" style={{ color: 'var(--text-faint)' }}>{user?.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
