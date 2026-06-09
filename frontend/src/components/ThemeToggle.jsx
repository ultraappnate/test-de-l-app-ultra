export default function ThemeToggle({ theme, setTheme }) {
  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      className="fixed z-50 w-10 h-10 rounded-full flex items-center justify-center text-base transition-all duration-200"
      style={{
        /* AICoach is 56px wide at right:24 → its center is at right: 24 + 28 = 52px from edge
           ThemeToggle is 40px wide → right: 52 - 20 = 32 to align centers */
        bottom: 84,
        right: 32,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.transform = 'scale(1.1)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'scale(1)' }}
    >
      {isDark ? '☀' : '☾'}
    </button>
  )
}
