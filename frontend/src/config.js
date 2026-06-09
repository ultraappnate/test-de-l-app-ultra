// URL de l'API — pointe vers Railway en prod, localhost en dev
const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
export default API
