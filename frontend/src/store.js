import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

import API from './config.js'

export const useStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      programs: [],
      currentProgram: null,
      messages: [],
      notifications: [],

      login: async (email, password) => {
        try {
          const res = await axios.post(`${API}/auth/login`, { email, password })
          set({ user: res.data.user, token: res.data.token })
          return { success: true }
        } catch (err) {
          return { success: false, error: err.response?.data?.message || 'Erreur de connexion' }
        }
      },

      register: async (email, password, name, role, extra = {}) => {
        try {
          const res = await axios.post(`${API}/auth/register`, { email, password, name, role, ...extra })
          set({ user: res.data.user, token: res.data.token })
          return { success: true }
        } catch (err) {
          return { success: false, error: err.response?.data?.message || "Erreur d'inscription" }
        }
      },

      logout: () => set({ user: null, token: null, programs: [], currentProgram: null, messages: [], notifications: [] }),

      fetchNotifications: async () => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
          set({ notifications: res.data })
        } catch { /* silent */ }
      },
      markNotifRead: async (id) => {
        try {
          const { token } = get()
          await axios.put(`${API}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } })
          set(s => ({ notifications: s.notifications.map(n => n.id === id ? {...n, read: true} : n) }))
        } catch { /* silent */ }
      },
      markAllNotifsRead: async () => {
        try {
          const { token } = get()
          await axios.put(`${API}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } })
          set(s => ({ notifications: s.notifications.map(n => ({...n, read: true})) }))
        } catch { /* silent */ }
      },
      fetchDiscoverExperts: async (params = {}) => {
        try {
          const { token } = get()
          const headers = token ? { Authorization: `Bearer ${token}` } : {}
          const res = await axios.get(`${API}/discover`, { params, headers })
          return res.data
        } catch { return [] }
      },

      fetchExpert: async (id) => {
        try {
          const { token } = get()
          const headers = token ? { Authorization: `Bearer ${token}` } : {}
          const res = await axios.get(`${API}/discover/${id}`, { headers })
          return res.data
        } catch { return null }
      },

      // ── Dossiers partagés (consentements + bilans) ──
      fetchConsents: async () => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/consents`, { headers: { Authorization: `Bearer ${token}` } })
          return res.data
        } catch { return [] }
      },
      createConsent: async (proId, coachId) => {
        try {
          const { token } = get()
          const res = await axios.post(`${API}/consents`, { proId, coachId }, { headers: { Authorization: `Bearer ${token}` } })
          return { success: true, consent: res.data }
        } catch (err) { return { success: false, error: err.response?.data?.message || 'Erreur' } }
      },
      revokeConsent: async (id) => {
        try {
          const { token } = get()
          await axios.delete(`${API}/consents/${id}`, { headers: { Authorization: `Bearer ${token}` } })
          return { success: true }
        } catch { return { success: false } }
      },
      fetchRecords: async () => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/records`, { headers: { Authorization: `Bearer ${token}` } })
          return res.data
        } catch { return [] }
      },
      createRecord: async (data) => {
        try {
          const { token } = get()
          const res = await axios.post(`${API}/records`, data, { headers: { Authorization: `Bearer ${token}` } })
          return { success: true, record: res.data }
        } catch (err) { return { success: false, error: err.response?.data?.message || 'Erreur' } }
      },
      fetchRecordFile: async (id) => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/records/${id}/file`, { headers: { Authorization: `Bearer ${token}` } })
          return res.data  // { fileName, fileData }
        } catch { return null }
      },

      fetchPrograms: async () => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/programs`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          set({ programs: res.data })
        } catch (err) {
          console.error('fetchPrograms error:', err)
        }
      },

      fetchProgram: async (id) => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/programs/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          set({ currentProgram: res.data })
        } catch (err) {
          console.error('fetchProgram error:', err)
        }
      },

      fetchMessages: async (recipientId) => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/messages/${recipientId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          set({ messages: res.data })
        } catch (err) {
          console.error('fetchMessages error:', err)
        }
      },

      createProgram: async (data) => {
        try {
          const { token } = get()
          const res = await axios.post(`${API}/programs`, data, {
            headers: { Authorization: `Bearer ${token}` }
          })
          return { success: true, program: res.data }
        } catch (err) {
          return { success: false, error: err.response?.data?.message || 'Erreur création programme' }
        }
      },

      updateProgram: async (id, data) => {
        try {
          const { token } = get()
          const res = await axios.put(`${API}/programs/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
          })
          return { success: true, program: res.data }
        } catch (err) {
          return { success: false, error: err.response?.data?.message || 'Erreur mise à jour' }
        }
      },

      deleteProgram: async (id) => {
        try {
          const { token } = get()
          await axios.delete(`${API}/programs/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          set(state => ({ programs: state.programs.filter(p => p.id !== id) }))
          return { success: true }
        } catch (err) {
          return { success: false, error: err.response?.data?.message || 'Erreur suppression' }
        }
      },

      fetchMyPrograms: async () => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/coach/programs`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          return res.data
        } catch (err) {
          console.error('fetchMyPrograms error:', err)
          return []
        }
      },

      // ── Nutrition ──────────────────────────────────────
      fetchNutritionLog: async (date) => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/nutrition/log`, { params: { date }, headers: { Authorization: `Bearer ${token}` } })
          return res.data
        } catch { return { meals: [], goals: null } }
      },
      saveNutritionLog: async (date, meals) => {
        try {
          const { token } = get()
          await axios.put(`${API}/nutrition/log`, { date, meals }, { headers: { Authorization: `Bearer ${token}` } })
          return { success: true }
        } catch { return { success: false } }
      },

      // ── Calendrier personnel ────────────────────────────
      fetchCalendarEvents: async () => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/calendar/events`, { headers: { Authorization: `Bearer ${token}` } })
          return Array.isArray(res.data.events) ? res.data.events : []
        } catch { return [] }
      },
      saveCalendarEvents: async (events) => {
        try {
          const { token } = get()
          await axios.put(`${API}/calendar/events`, { events }, { headers: { Authorization: `Bearer ${token}` } })
          return { success: true }
        } catch { return { success: false } }
      },
      fetchCoaches: async () => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/coaches`, { headers: { Authorization: `Bearer ${token}` } })
          return res.data
        } catch { return [] }
      },
      fetchProfile: async () => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
          set({ user: res.data })
          return res.data
        } catch { return null }
      },
      updateProfile: async (data) => {
        try {
          const { token } = get()
          const res = await axios.put(`${API}/profile`, data, { headers: { Authorization: `Bearer ${token}` } })
          set({ user: res.data })
          return { success: true, user: res.data }
        } catch (err) { return { success: false, error: err.response?.data?.message || 'Erreur' } }
      },

      fetchCoachClients: async () => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/coach/clients`, { headers: { Authorization: `Bearer ${token}` } })
          return res.data
        } catch { return [] }
      },
      fetchClientNutrition: async (clientId, date) => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/coach/clients/${clientId}/nutrition`, { params: { date }, headers: { Authorization: `Bearer ${token}` } })
          return res.data
        } catch { return null }
      },
      setClientGoals: async (clientId, goals) => {
        try {
          const { token } = get()
          await axios.put(`${API}/coach/clients/${clientId}/nutrition/goals`, goals, { headers: { Authorization: `Bearer ${token}` } })
          return { success: true }
        } catch { return { success: false } }
      },

      // ── IA ──────────────────────────────────────────────
      aiGenerateProgram: async (params) => {
        try {
          const { token } = get()
          const res = await axios.post(`${API}/ai/generate-program`, params, { headers: { Authorization: `Bearer ${token}` } })
          return res.data
        } catch (err) { return { success: false, error: err.response?.data?.message || 'Erreur IA' } }
      },
      aiAnalyzeFood: async (description, grams) => {
        try {
          const { token } = get()
          const res = await axios.post(`${API}/ai/food-analyze`, { description, grams }, { headers: { Authorization: `Bearer ${token}` } })
          return res.data
        } catch (err) { return { success: false, error: err.response?.data?.message || 'Erreur IA' } }
      },
      aiGetInsights: async () => {
        try {
          const { token } = get()
          const res = await axios.post(`${API}/ai/insights`, {}, { headers: { Authorization: `Bearer ${token}` } })
          return res.data
        } catch { return { success: false } }
      },
      aiNutritionReview: async (meals, goals) => {
        try {
          const { token } = get()
          const res = await axios.post(`${API}/ai/nutrition-review`, { meals, goals }, { headers: { Authorization: `Bearer ${token}` } })
          return res.data
        } catch { return { success: false } }
      },

      sendMessage: async (recipientId, message) => {
        try {
          const { token } = get()
          await axios.post(
            `${API}/messages`,
            { recipientId, message },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          return { success: true }
        } catch (err) {
          return { success: false, error: err.response?.data?.message || 'Erreur envoi message' }
        }
      },

      enrollProgram: async (programId) => {
        try {
          const { token } = get()
          const res = await axios.post(`${API}/programs/${programId}/enroll`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          })
          return { success: true, enrollment: res.data.enrollment }
        } catch (err) {
          const error = err.response?.data?.error || 'Erreur'
          return { success: false, error }
        }
      },

      fetchMyEnrollments: async () => {
        try {
          const { token } = get()
          const res = await axios.get(`${API}/my/enrollments`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          return res.data
        } catch { return [] }
      },

      activatePremium: async () => {
        try {
          const { token } = get()
          const res = await axios.post(`${API}/premium/activate`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          })
          set({ user: res.data.user })
          return { success: true }
        } catch (err) {
          return { success: false, error: err.response?.data?.error || 'Erreur' }
        }
      },

      fetchCoachPublic: async (coachId) => {
        try {
          const res = await axios.get(`${API}/coach/${coachId}/public`)
          return res.data
        } catch { return null }
      },

      // Rafraîchit le profil user depuis l'API (après webhook Stripe)
      fetchMe: async () => {
        try {
          const { token } = get()
          if (!token) return
          const res = await axios.get(`${API}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          set({ user: res.data })
        } catch {}
      },

      // Redirige vers Stripe Checkout pour le Premium
      startCheckoutPremium: async () => {
        try {
          const { token } = get()
          const res = await axios.post(`${API}/stripe/checkout-premium`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          })
          window.location.href = res.data.url
          return { success: true }
        } catch (err) {
          return { success: false, error: err.response?.data?.error || 'Stripe non disponible' }
        }
      },

      // Redirige vers Stripe Checkout pour un programme
      startCheckoutProgram: async (programId) => {
        try {
          const { token } = get()
          const res = await axios.post(`${API}/stripe/checkout-program/${programId}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          })
          window.location.href = res.data.url
          return { success: true }
        } catch (err) {
          return { success: false, error: err.response?.data?.error || 'Stripe non disponible' }
        }
      },
    }),
    {
      name: 'ultra-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
