import { useParams, useNavigate } from 'react-router-dom'

export default function CoachProfile() {
  const { coachId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-bordeaux font-semibold mb-6 hover:underline">
          ← Retour
        </button>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-bordeaux to-red-700 rounded-full mx-auto flex items-center justify-center mb-4">
              <p className="text-white text-4xl font-bold">C</p>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Profil Coach</h1>
            <p className="text-gray-600 mt-2">Coach ID: {coachId}</p>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Spécialité</p>
              <p className="text-lg font-semibold text-gray-800">À déterminer</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Expérience</p>
              <p className="text-lg font-semibold text-gray-800">À déterminer</p>
            </div>
          </div>
          <button className="w-full mt-6 bg-bordeaux text-white py-2 rounded-lg font-semibold hover:bg-opacity-90">
            Contacter le Coach
          </button>
        </div>
      </div>
    </div>
  )
}
