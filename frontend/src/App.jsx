import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './store'

export const SidebarContext = createContext({ collapsed: false, setCollapsed: () => {} })

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Programs from './pages/Programs'
import ProgramDetail from './pages/ProgramDetail'
import AdminDashboard from './pages/AdminDashboard'
import CoachProfile from './pages/CoachProfile'
import CoachPrograms from './pages/CoachPrograms'
import CoachProgramBuilder from './pages/CoachProgramBuilder'
import CoachNutritionMonitor from './pages/CoachNutritionMonitor'
import CoachMyProfile from './pages/CoachMyProfile'
import ClientNutritionTracker from './pages/ClientNutritionTracker'
import NutritionDashboard from './pages/NutritionDashboard'
import NutriDashboard  from './pages/nutri/NutriDashboard'
import NutriClients    from './pages/nutri/NutriClients'
import NutriPlans      from './pages/nutri/NutriPlans'
import NutriRecipes    from './pages/nutri/NutriRecipes'
import NutriResources  from './pages/nutri/NutriResources'
import NutriProfile    from './pages/nutri/NutriProfile'
import NutriStats      from './pages/nutri/NutriStats'
import Clients from './pages/Clients'
import Messages from './pages/Messages'
import Analytics from './pages/Analytics'
import Revenue from './pages/Revenue'
import CalendarPage from './pages/CalendarPage'
import Progress from './pages/Progress'
import Success from './pages/Success'
import Sidebar from './components/Sidebar'
import ThemeToggle from './components/ThemeToggle'
import AICoach from './components/AICoach'
import Landing from './pages/Landing'
import Discover from './pages/Discover'
import Onboarding from './pages/Onboarding'
import Community from './pages/Community'
import MuscleExplorer from './pages/MuscleExplorer'
import ExpertProfile from './pages/ExpertProfile'
import HealthProDashboard from './pages/pro/HealthProDashboard'
import HealthProProfile from './pages/pro/HealthProProfile'
import HealthProPatients from './pages/pro/HealthProPatients'
import ClientHealthAccess from './pages/ClientHealthAccess'
import CoachHealthRecords from './pages/CoachHealthRecords'
import ClientProfile from './pages/ClientProfile'
import Settings from './pages/Settings'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'
import AICoachPage from './pages/AICoachPage'
import WorkoutSession from './pages/WorkoutSession'
import CoachUpgrade from './pages/CoachUpgrade'
import MyPrograms from './pages/MyPrograms'
import ClientProgramBuilder from './pages/ClientProgramBuilder'
import ClientProgramView from './pages/ClientProgramView'
import PostureAnalysis from './pages/PostureAnalysis'
import AdminExerciseLibrary from './pages/AdminExerciseLibrary'
import CoachInsights from './pages/CoachInsights'
import NutriInsights from './pages/NutriInsights'
import ProInsights from './pages/ProInsights'
import Marketplace from './pages/Marketplace'
import MarketplaceProfile from './pages/MarketplaceProfile'
import PromotionsManager from './pages/PromotionsManager'
import PackagesManager from './pages/PackagesManager'
import LegalPage from './pages/LegalPage'
import ComingSoon from './pages/ComingSoon'
import Survey from './pages/Survey'
import SurveyResults from './pages/SurveyResults'
import CoachQuestionnaires from './pages/CoachQuestionnaires'
import ClientQuestionnaires from './pages/ClientQuestionnaires'
import ClientLibrary from './pages/ClientLibrary'
import ClientMyProfile from './pages/ClientMyProfile'
import { registerPush } from './services/pushNotifications'

function PrivateRoute({ children }) {
  const { user } = useStore()
  return user ? children : <Navigate to="/login" replace />
}

function NutriRedirect({ children }) {
  const { user } = useStore()
  if (user?.role === 'nutritionist') return <Navigate to="/nutri/dashboard" replace />
  if (user?.role === 'health_pro') return <Navigate to="/pro/dashboard" replace />
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return children
}

function LandingOrDashboard({ theme, setTheme }) {
  const { user } = useStore()
  if (!user) return <Landing theme={theme} setTheme={setTheme} />
  if (user.role === 'nutritionist') return <Navigate to="/nutri/dashboard" replace />
  if (user.role === 'health_pro') return <Navigate to="/pro/dashboard" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'client' && !user.onboardingDone) return <Navigate to="/onboarding" replace />
  return <Navigate to="/dashboard" replace />
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

// Remonte en haut de page à chaque navigation (sinon on arrive au milieu de la nouvelle page)
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Layout({ theme, setTheme, children }) {
  const { user, token } = useStore()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const isMobile = useIsMobile()

  // Demande permission push au premier login (silencieux si déjà accordé/refusé)
  useEffect(() => {
    if (user && token && Notification.permission === 'default') {
      registerPush(token)
    }
  }, [user?.id, token])
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/'
  const isBuilderPage = pathname.startsWith('/coach/programs/') || pathname === '/coach/programs/new'
  const isFullscreen = pathname === '/discover'

  if (isAuthPage || !user) return (
    <>
      {children}
      {pathname !== '/' && <ThemeToggle theme={theme} setTheme={setTheme} />}
    </>
  )

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <Sidebar theme={theme} setTheme={setTheme} collapsed={collapsed} setCollapsed={setCollapsed} />
        <main
          className="flex-1 transition-all duration-300"
          style={{
            minWidth: 0,
            maxWidth: '100%',
            marginLeft: isMobile ? 0 : (collapsed ? '60px' : '216px'),
            paddingBottom: isMobile ? '70px' : undefined,
            height: isFullscreen ? '100vh' : undefined,
            minHeight: isFullscreen ? undefined : '100vh',
            overflowX: 'hidden',
            overflow: isFullscreen ? 'hidden' : undefined,
          }}
        >
          {children}
        </main>
        {!isBuilderPage && !isMobile && <ThemeToggle theme={theme} setTheme={setTheme} />}
        {/* Coach IA flottant désactivé en beta (IA non disponible) */}
      </div>
    </SidebarContext.Provider>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ultra-theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ultra-theme', theme)
  }, [theme])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout theme={theme} setTheme={setTheme}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/welcome" element={<Landing theme={theme} setTheme={setTheme} />} />
          <Route path="/enquete" element={<Survey />} />
          <Route path="/enquete/resultats" element={<PrivateRoute><SurveyResults /></PrivateRoute>} />
          <Route path="/coach/questionnaires" element={<PrivateRoute><CoachQuestionnaires /></PrivateRoute>} />
          <Route path="/questionnaires" element={<PrivateRoute><ClientQuestionnaires /></PrivateRoute>} />
          <Route path="/coach/bibliotheque" element={<PrivateRoute><AdminExerciseLibrary /></PrivateRoute>} />
          <Route path="/bibliotheque" element={<PrivateRoute><ClientLibrary /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ClientMyProfile /></PrivateRoute>} />
          {/* ── Pages légales (publiques) ── */}
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/legal/:slug" element={<LegalPage />} />
          <Route path="/" element={<LandingOrDashboard theme={theme} setTheme={setTheme} />} />
          <Route path="/dashboard" element={<PrivateRoute><NutriRedirect><Dashboard /></NutriRedirect></PrivateRoute>} />
          {/* ── Espace Nutritionniste ── */}
          <Route path="/nutri/dashboard"  element={<PrivateRoute><NutriDashboard /></PrivateRoute>} />
          <Route path="/nutri/clients"    element={<PrivateRoute><NutriClients /></PrivateRoute>} />
          <Route path="/nutri/plans"      element={<PrivateRoute><NutriPlans /></PrivateRoute>} />
          <Route path="/nutri/recipes"    element={<PrivateRoute><NutriRecipes /></PrivateRoute>} />
          <Route path="/nutri/resources"  element={<PrivateRoute><NutriResources /></PrivateRoute>} />
          <Route path="/nutri/profile"    element={<PrivateRoute><NutriProfile /></PrivateRoute>} />
          <Route path="/nutri/stats"      element={<PrivateRoute><NutriStats /></PrivateRoute>} />
          {/* Géolocalisation — désactivée en beta */}
          <Route path="/discover"   element={<ComingSoon title="Carte des experts" emoji="🗺️" desc="La géolocalisation et la carte des experts à proximité arrivent très bientôt." />} />
          <Route path="/expert/:id" element={<ComingSoon title="Carte des experts" emoji="🗺️" desc="La géolocalisation et la carte des experts à proximité arrivent très bientôt." />} />
          {/* ── Espace Professionnel de santé ── */}
          <Route path="/pro/dashboard" element={<PrivateRoute><HealthProDashboard /></PrivateRoute>} />
          <Route path="/pro/profile"   element={<PrivateRoute><HealthProProfile /></PrivateRoute>} />
          <Route path="/pro/patients"  element={<PrivateRoute><HealthProPatients /></PrivateRoute>} />
          {/* ── Dossiers partagés ── */}
          <Route path="/health-access" element={<PrivateRoute><ClientHealthAccess /></PrivateRoute>} />
          <Route path="/coach/sante"   element={<PrivateRoute><CoachHealthRecords /></PrivateRoute>} />
          <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          <Route path="/programs" element={<PrivateRoute><Programs /></PrivateRoute>} />
          <Route path="/programs/:programId" element={<PrivateRoute><ProgramDetail /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          <Route path="/coach/:coachId" element={<PrivateRoute><CoachProfile /></PrivateRoute>} />
          <Route path="/success" element={<PrivateRoute><Success /></PrivateRoute>} />
          <Route path="/coach/programs" element={<PrivateRoute><CoachPrograms /></PrivateRoute>} />
          <Route path="/coach/programs/new" element={<PrivateRoute><CoachProgramBuilder /></PrivateRoute>} />
          <Route path="/coach/programs/:programId/edit" element={<PrivateRoute><CoachProgramBuilder /></PrivateRoute>} />
          <Route path="/coach/nutrition" element={<PrivateRoute><CoachNutritionMonitor /></PrivateRoute>} />
          <Route path="/coach/profile" element={<PrivateRoute><CoachMyProfile /></PrivateRoute>} />
          <Route path="/nutrition" element={<PrivateRoute><NutritionDashboard /></PrivateRoute>} />
          <Route path="/nutrition/legacy" element={<PrivateRoute><ClientNutritionTracker /></PrivateRoute>} />
          <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/chat/:recipientId" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
          <Route path="/revenue" element={<PrivateRoute><Revenue /></PrivateRoute>} />
          <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
          <Route path="/progress" element={<PrivateRoute><Progress /></PrivateRoute>} />
          <Route path="/health" element={<PrivateRoute><ComingSoon title="Applis Santé" emoji="🔗" desc="La synchronisation avec Strava, Garmin, Oura, Polar et Apple Santé arrive très bientôt — on finalise les connexions sécurisées à chaque plateforme." /></PrivateRoute>} />
          <Route path="/community" element={<PrivateRoute><Community /></PrivateRoute>} />
          <Route path="/muscles" element={<PrivateRoute><ComingSoon title="Atlas Musculaire 3D" emoji="🦾" desc="L'explorateur musculaire 3D interactif arrive très bientôt." /></PrivateRoute>} />
          <Route path="/client/:id" element={<PrivateRoute><ClientProfile /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/ai-coach" element={<PrivateRoute><ComingSoon title="Coach IA" emoji="🤖" desc="Ton assistant IA personnel arrive très bientôt. On peaufine ses réponses pour qu'il soit vraiment au top." /></PrivateRoute>} />
          <Route path="/workout" element={<PrivateRoute><WorkoutSession /></PrivateRoute>} />
          <Route path="/coach/upgrade" element={<PrivateRoute><CoachUpgrade /></PrivateRoute>} />
          <Route path="/my-programs" element={<PrivateRoute><MyPrograms /></PrivateRoute>} />
          <Route path="/my-programs/new" element={<PrivateRoute><ClientProgramBuilder /></PrivateRoute>} />
          <Route path="/my-programs/:id" element={<PrivateRoute><ClientProgramView /></PrivateRoute>} />
          <Route path="/my-programs/:id/session" element={<PrivateRoute><ClientProgramView /></PrivateRoute>} />
          <Route path="/posture" element={<PrivateRoute><ComingSoon title="Analyse posturale IA" emoji="🧍" desc="L'analyse de ta posture par intelligence artificielle arrive très bientôt." /></PrivateRoute>} />
          <Route path="/admin/exercises" element={<PrivateRoute><AdminExerciseLibrary /></PrivateRoute>} />
          <Route path="/coach/insights" element={<PrivateRoute><ComingSoon title="Radar Clients IA" emoji="📡" desc="Les insights IA proactifs sur tes clients arrivent très bientôt." /></PrivateRoute>} />
          <Route path="/nutri/insights" element={<PrivateRoute><ComingSoon title="Radar Clients IA" emoji="📡" desc="Les insights IA proactifs sur tes clients arrivent très bientôt." /></PrivateRoute>} />
          <Route path="/pro/insights" element={<PrivateRoute><ComingSoon title="Radar Patient IA" emoji="📡" desc="Le suivi IA de la charge et des risques de rechute de tes patients arrive très bientôt." /></PrivateRoute>} />
          <Route path="/marketplace" element={<PrivateRoute><Marketplace /></PrivateRoute>} />
          {/* Fiche pro publique : parcours enquête → profil coach → créer un compte */}
          <Route path="/marketplace/:id" element={<MarketplaceProfile />} />
          <Route path="/promotions" element={<PrivateRoute><PromotionsManager /></PrivateRoute>} />
          <Route path="/packages" element={<PrivateRoute><PackagesManager /></PrivateRoute>} />
          {/* 404 — URL inconnue */}
          <Route path="*" element={<ComingSoon title="Page introuvable" emoji="🧭" desc="Cette page n'existe pas ou a été déplacée. Reviens à l'accueil pour retrouver ton chemin." />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
