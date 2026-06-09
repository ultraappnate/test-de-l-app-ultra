import { useNavigate } from 'react-router-dom'

export default function Success() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-green-600 mb-2">Paiement Réussi!</h1>
        <p className="text-gray-600 mb-6">
          Ton accès au programme a été activé. Tu peux maintenant commencer.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-bordeaux text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 w-full">
          Retourner au tableau de bord
        </button>
      </div>
    </div>
  )
}
