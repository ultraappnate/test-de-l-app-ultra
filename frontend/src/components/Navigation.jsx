import { Link } from 'react-router-dom'
import { useStore } from '../store'

export default function Navigation() {
  const { user } = useStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-2 flex justify-around">
        <Link to="/dashboard" className="text-center py-2 px-4 text-gray-600 hover:text-bordeaux hover:bg-gray-50">
          📊 Accueil
        </Link>
        <Link to="/programs" className="text-center py-2 px-4 text-gray-600 hover:text-bordeaux hover:bg-gray-50">
          📚 Programmes
        </Link>
        {user?.role === 'coach' && (
          <Link to={`/coach/${user.id}`} className="text-center py-2 px-4 text-gray-600 hover:text-bordeaux hover:bg-gray-50">
            💪 Mon Profil
          </Link>
        )}
        {user?.role === 'admin' && (
          <Link to="/admin" className="text-center py-2 px-4 text-gray-600 hover:text-bordeaux hover:bg-gray-50">
            ⚙️ Admin
          </Link>
        )}
      </div>
    </nav>
  )
}
