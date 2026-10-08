import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, ListChecks, Map, Bot, Bell, Settings, LogOut, Building2 } from 'lucide-react'
import api from '../api'
import { useAuth } from '../AuthContext'
import { useT, LanguageSwitcher } from '../i18n'
import FloatingAssistant from './FloatingAssistant'
export default function Layout() {
  const { user, logout } = useAuth(); const t = useT(); const nav = useNavigate(); const [unread, setUnread] = useState(0)
  useEffect(() => { const f = () => api.get('/notifications').then(r => setUnread(r.data.unread)).catch(() => {}); f(); const t = setInterval(f, 15000); return () => clearInterval(t) }, [])
  const links = [['/app', t('dashboard'), LayoutDashboard, true], ...(user.role === 'citizen' ? [['/app/report', t('report'), PlusCircle], ['/app/assistant', t('assistant'), Bot]] : []),
    ['/app/complaints', user.role === 'citizen' ? t('myComplaints') : t('complaints'), ListChecks], ['/app/map', t('map'), Map], ...(user.role === 'admin' ? [['/app/manage', t('manage'), Settings]] : [])]
  const cls = ({ isActive }) => `flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
  const Links = () => links.map(([to, label, Icon, end]) => <NavLink key={to} to={to} end={end} className={cls}><Icon size={16} />{label}</NavLink>)
  return <div className="min-h-screen">
    <div className="bg-brand-900 text-xs text-blue-100"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1"><span>🏛️ {t('official')}</span><LanguageSwitcher dark /></div></div>
    <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2"><Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-brand-700"><Building2 /> CivicAI</Link>
        <nav className="hidden flex-1 items-center gap-1 lg:flex"><Links /></nav>
        <div className="ml-auto flex items-center gap-3"><Link to="/app/notifications" className="relative rounded-full p-2 hover:bg-slate-100"><Bell size={20} />{unread > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>}</Link>
          <div className="hidden text-right text-xs leading-tight sm:block"><div className="font-semibold">{user.name}</div><div className="capitalize text-slate-500">{user.role}</div></div>
          <button onClick={() => { logout(); nav('/') }} className="btn-ghost !px-3"><LogOut size={16} /><span className="hidden sm:inline">{t('logout')}</span></button></div></div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:hidden"><Links /></nav></header>
    <main className="mx-auto max-w-7xl p-4 md:p-6"><Outlet /></main>
    <footer className="mt-8 border-t bg-white py-4 text-center text-xs text-slate-500">CivicAI · {t('official')}</footer>
    {user.role === 'citizen' && <FloatingAssistant />}</div>
}
