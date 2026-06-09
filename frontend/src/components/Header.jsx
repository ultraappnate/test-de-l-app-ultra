import { useStore } from '../store'
import { useNavigate } from 'react-router-dom'

export default function Header({ theme, setTheme }) {
  const { user, logout } = useStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-bordeaux cursor-pointer" onClick={() => navigate('/dashboard')}>
          ULTRA
        </h1>
        <div className="flex items-center gap-6">
          <span className="text-gray-700">{user?.name}</span>
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="text-gray-600 hover:text-bordeaux">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-semibold">
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  )
}
