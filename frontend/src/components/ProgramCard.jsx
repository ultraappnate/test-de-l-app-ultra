import { useNavigate } from 'react-router-dom'

export default function ProgramCard({ program }) {
  const navigate = useNavigate()

  return (
    <div onClick={() => navigate(`/programs/${program.id}`)}
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer">
      <div className="h-48 bg-gradient-to-r from-bordeaux to-red-700 flex items-center justify-center">
        <p className="text-white text-4xl font-bold">{program.title.charAt(0)}</p>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{program.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{program.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-bordeaux">
            {program.price === 0 ? 'Gratuit' : `${program.price}€`}
          </span>
          <span className="text-sm text-gray-500">{program.enrollmentCount} inscrits</span>
        </div>
      </div>
    </div>
  )
}
