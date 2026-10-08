import { Link } from 'react-router-dom'
import { Building2, Camera, Brain, Copy, Route, CheckCircle2, ShieldAlert, Gauge, MapPinned, Construction, Trash2, Droplets, Waves, Lightbulb, TreeDeciduous } from 'lucide-react'
import { useAuth } from '../AuthContext'
const Sec = ({ title, children }) => <section className="mx-auto max-w-6xl px-4 py-14"><h2 className="mb-8 text-center text-3xl font-bold text-brand-900">{title}</h2>{children}</section>
export default function Landing() {
  const { user } = useAuth()
  return <div>
    <header className="absolute inset-x-0 top-0 z-10 mx-auto flex max-w-6xl items-center justify-between p-4 text-white">
      <div className="flex items-center gap-2 text-xl font-bold"><Building2 /> CivicAI</div>
      <div className="flex gap-2">{user ? <Link to="/app" className="btn-ghost">Open dashboard</Link> : <><Link to="/login" className="btn-ghost">Login</Link><Link to="/register" className="btn !bg-white !text-brand-700">Register</Link></>}</div></header>
    <div className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-4 pb-24 pt-32 text-center text-white">
      <h1 className="text-5xl font-extrabold md:text-6xl">Report. Prioritize. Resolve.</h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">AI-powered civic intelligence for faster and smarter city problem resolution.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/app/report" className="btn !bg-white !px-6 !py-3 !text-brand-700">Report an Issue</Link>
        <Link to="/login" className="btn-ghost !bg-transparent !px-6 !py-3 !text-white">Login</Link><Link to="/register" className="btn-ghost !bg-transparent !px-6 !py-3 !text-white">Register</Link></div></div>
    <div className="mx-auto -mt-10 grid max-w-4xl grid-cols-2 gap-3 px-4 md:grid-cols-4">
      {[['< 2 min', 'to report'], ['0–100', 'AI priority score'], ['7', 'departments routed'], ['100%', 'transparent tracking']].map(([a, b]) => <div key={b} className="card text-center"><div className="text-2xl font-bold text-brand-600">{a}</div><div className="text-xs text-slate-500">{b}</div></div>)}</div>
    <Sec title="How it works"><div className="grid gap-4 md:grid-cols-5">{[[Camera, 'Report', 'Photo, text & map pin'], [Brain, 'AI analyses', 'Category, severity, priority'], [Copy, 'De-duplicate', 'Linked to existing issues'], [Route, 'Route', 'Right department & officer'], [CheckCircle2, 'Verify', 'You confirm the fix']].map(([I, t, d], i) =>
      <div key={t} className="card text-center"><I className="mx-auto mb-2 text-brand-500" size={30} /><div className="text-xs text-slate-400">Step {i + 1}</div><div className="font-semibold">{t}</div><div className="text-sm text-slate-500">{d}</div></div>)}</div></Sec>
    <div className="bg-white"><Sec title="AI capabilities"><div className="grid gap-4 md:grid-cols-3">{[[Brain, 'Issue classification', 'Understands text and photos.'], [ShieldAlert, 'Severity detection', 'Low to Critical, with safety awareness.'], [Gauge, 'Priority scoring', '0–100 score using risk, type & duplicates.'], [Copy, 'Duplicate detection', 'Nearby similar reports merge into one.'], [Route, 'Smart routing', 'Automatic department assignment.'], [MapPinned, 'Civic assistant', 'Ask about your complaints any time.']].map(([I, t, d]) =>
      <div key={t} className="card"><I className="mb-2 text-brand-500" /><div className="font-semibold">{t}</div><div className="text-sm text-slate-500">{d}</div></div>)}</div></Sec></div>
    <Sec title="Issues we handle"><div className="grid grid-cols-2 gap-3 md:grid-cols-6">{[[Construction, 'Potholes'], [Trash2, 'Garbage'], [Droplets, 'Water leaks'], [Waves, 'Drainage'], [Lightbulb, 'Streetlights'], [TreeDeciduous, 'Fallen trees']].map(([I, t]) => <div key={t} className="card text-center"><I className="mx-auto mb-2 text-brand-500" />{t}</div>)}</div></Sec>
    <div className="bg-brand-50"><Sec title="Benefits"><div className="grid gap-4 md:grid-cols-3">{['Faster resolution for dangerous issues', 'No more duplicate work for departments', 'Citizens see every step and verify the fix'].map(t => <div key={t} className="card flex gap-2"><CheckCircle2 className="shrink-0 text-green-600" />{t}</div>)}</div></Sec></div>
    <div className="bg-brand-900 px-4 py-14 text-center text-white"><h2 className="text-3xl font-bold">Make your city better today</h2><Link to="/app/report" className="btn mt-6 !bg-white !px-6 !py-3 !text-brand-700">Report an Issue</Link></div>
    <footer className="p-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} CivicAI · AI-Powered Civic Issue Intelligence & Resolution Platform</footer></div>
}
