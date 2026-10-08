import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import Landing from './pages/Landing'
import { Login, Register } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Report from './pages/Report'
import Complaints from './pages/Complaints'
import ComplaintDetail from './pages/ComplaintDetail'
import MapPage from './pages/MapPage'
import Assistant from './pages/Assistant'
import Notifications from './pages/Notifications'
import Manage from './pages/Manage'
function Protected({ roles, children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />
  return children
}
export default function App() {
  return <Routes>
    <Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
    <Route path="/app" element={<Protected><Layout /></Protected>}>
      <Route index element={<Dashboard />} />
      <Route path="report" element={<Protected roles={['citizen']}><Report /></Protected>} />
      <Route path="assistant" element={<Protected roles={['citizen']}><Assistant /></Protected>} />
      <Route path="complaints" element={<Complaints />} /><Route path="complaints/:id" element={<ComplaintDetail />} />
      <Route path="map" element={<MapPage />} /><Route path="notifications" element={<Notifications />} />
      <Route path="manage" element={<Protected roles={['admin']}><Manage /></Protected>} />
    </Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>
}
