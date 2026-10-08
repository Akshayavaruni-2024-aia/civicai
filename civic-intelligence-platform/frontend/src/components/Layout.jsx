import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, ListChecks, Map, Bot, Bell, Settings, LogOut, Building2 } from 'lucide-react'
import api from '../api'
import { useAuth } from '../AuthContext'
export default function Layout() {
  const { user, logout } = useAuth(); const nav = useNavigate(); const [unread, setUnread] = useState(0)
  useEffect(() => { const f = () => api.get('/notifications').then(r => setUnread(r.data.unread)).catch(() => {}); f(); const t = setInterval(f, 15000); return () => clearInterval(t) }, [])
  const links = [['/app', 'Dashboard', LayoutDashboard, true], ...(user.role === 'citizen' ? [['/app/report', 'Report Issue', PlusCircle], ['/app/assistant', 'AI Assistant', Bot]] : []),
    ['/app/complaints', user.role === 'citizen' ? 'My Complaints' : 'Complaints', ListChecks], ['/app/map', 'Issue Map', Map],
    ...(user.role === 'admin' ? [['/app/manage', 'Manage', Settings]] : []), ['/app/notifications', 'Notifications', Bell]]
  const cls = ({ isActive }) => `flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-white/15 font-semibold' : 'text-blue-100 hover:bg-white/10'}`
  return <div className="min-h-screen md:flex">
    <aside className="bg-brand-900 text-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0">
      <div className="flex items-center justify-between px-4 py-3 md:block md:py-5">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold"><Building2 /> CivicAI</Link>
        <div className="text-xs capitalize text-blue-200 md:mt-1">{user.name} · {user.role}</div></div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3">
        {links.map(([to, label, Icon, end]) => <NavLink key={to} to={to} end={end} className={cls}><Icon size={17} />{label}{label === 'Notifications' && unread > 0 && <span className="rounded-full bg-red-500 px-1.5 text-xs">{unread}</span>}</NavLink>)}
        <button onClick={() => { logout(); nav('/') }} className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm text-blue-100 hover:bg-white/10"><LogOut size={17} />Logout</button>
      </nav></aside>
    <main className="min-w-0 flex-1 p-4 md:p-8"><Outlet /></main></div>
}
