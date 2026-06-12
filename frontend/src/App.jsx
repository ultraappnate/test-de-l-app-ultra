import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './store'

export const SidebarContext = createContext({ collapsed: false, setCollapsed: () => {} })

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Programs from './pages/Programs'
import ProgramDetail from './pages/ProgramDetail'
import Chat from './pages/Chat'
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
import HealthIntegrations from './pages/HealthIntegrations'
import Community from './pages/Community'
import MuscleExplorer from './pages/MuscleExplorer'
import ExpertProfile from './pages/ExpertProfile'

function PrivateRoute({ children }) {
  const { user } = useStore()
  return user ? children : <Navigate to="/login" replace />
}

function NutriRedirect({ children }) {
  const { user } = useStore()
  if (user?.role === 'nutritionist') return <Navigate to="/nutri/dashboard" replace />
  return children
}

function LandingOrDashboard({ theme, setTheme }) {
  const { user } = useStore()
  if (!user) return <Landing theme={theme} setTheme={setTheme} />
  if (user.role === 'nutritionist') return <Navigate to="/nutri/dashboard" replace />
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

function Layout({ theme, setTheme, children }) {
  const { user } = useStore()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const isMobile = useIsMobile()
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
        {!isMobile && <AICoach/>}
      </div>
    </SidebarContext.Provider>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ultra-theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ultra-theme', theme)
  }, [theme])

  return (
    <BrowserRouter>
      <Layout theme={theme} setTheme={setTheme}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/welcome" element={<Landing theme={theme} setTheme={setTheme} />} />
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
          <Route path="/discover"   element={<Discover />} />
          <Route path="/expert/:id" element={<ExpertProfile />} />
          <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          <Route path="/programs" element={<PrivateRoute><Programs /></PrivateRoute>} />
          <Route path="/programs/:programId" element={<PrivateRoute><ProgramDetail /></PrivateRoute>} />
          <Route path="/chat/:recipientId" element={<PrivateRoute><Chat /></PrivateRoute>} />
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
          <Route path="/health" element={<PrivateRoute><HealthIntegrations /></PrivateRoute>} />
          <Route path="/community" element={<PrivateRoute><Community /></PrivateRoute>} />
          <Route path="/muscles" element={<PrivateRoute><MuscleExplorer /></PrivateRoute>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
