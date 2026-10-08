import { Link } from 'react-router-dom'
import { imgUrl } from '../api'
export const SEV = { Low: 'bg-green-100 text-green-700', Medium: 'bg-yellow-100 text-yellow-800', High: 'bg-orange-100 text-orange-700', Critical: 'bg-red-100 text-red-700' }
export const SEVCOLOR = { Low: '#16a34a', Medium: '#eab308', High: '#f97316', Critical: '#dc2626' }
export const STAT = { Pending: 'bg-slate-100 text-slate-700', Assigned: 'bg-blue-100 text-blue-700', 'In Progress': 'bg-indigo-100 text-indigo-700', Resolved: 'bg-teal-100 text-teal-700', Verified: 'bg-green-100 text-green-700', Reopened: 'bg-red-100 text-red-700' }
export const CATS = ['Pothole', 'Garbage', 'Water Leakage', 'Drainage', 'Streetlight', 'Road Damage', 'Fallen Tree', 'Other']
export const STATUSES = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Verified', 'Reopened']
export const Badge = ({ v, map }) => <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[v] || ''}`}>{v}</span>
export const StatCard = ({ label, value, icon: Icon, tone = 'text-brand-500 bg-brand-50' }) => (
  <div className="card flex items-center gap-4"><div className={`rounded-xl p-3 ${tone}`}><Icon size={22} /></div>
    <div><div className="text-2xl font-bold">{value ?? '–'}</div><div className="text-xs text-slate-500">{label}</div></div></div>)
export const fmt = d => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
export const Err = ({ msg }) => msg ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</div> : null
export const Spinner = () => <div className="p-10 text-center text-slate-400">Loading…</div>
export function ComplaintList({ items }) {
  if (!items?.length) return <div className="py-10 text-center"><div className="text-4xl">📭</div><div className="mt-2 text-sm text-slate-400">No complaints found.</div></div>
  return <div className="divide-y divide-slate-100">{items.map(c => (
    <Link key={c.id} to={`/app/complaints/${c.id}`} className="flex flex-wrap items-center gap-3 py-3 hover:bg-slate-50 sm:flex-nowrap">
      {c.image_path ? <img src={imgUrl(c.image_path)} className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-slate-100" />}
      <div className="min-w-0 flex-1"><div className="truncate font-medium">{c.title}</div>
        <div className="text-xs text-slate-500">{c.complaint_number} · {c.category} · {c.report_count} report{c.report_count > 1 ? 's' : ''}</div></div>
      <div className="flex items-center gap-2"><span className="text-sm font-bold text-slate-600">{c.priority_score}</span><Badge v={c.severity} map={SEV} /><Badge v={c.status} map={STAT} /></div>
    </Link>))}</div>
}
export const PageHeader = ({ icon: Icon, title, sub, children }) => (
  <div className="hero-bg mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-6 text-white shadow-lg">
    <div className="flex items-center gap-4"><div className="rounded-2xl bg-white/15 p-3"><Icon size={28} /></div>
      <div><h1 className="text-2xl font-bold">{title}</h1>{sub && <p className="text-sm text-blue-100">{sub}</p>}</div></div>{children}</div>)
