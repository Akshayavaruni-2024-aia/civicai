import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Clock, Loader, CheckCircle2, AlertTriangle, PlusCircle, Timer, Percent, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid } from 'recharts'
import api, { errMsg } from '../api'
import { useAuth } from '../AuthContext'
import { StatCard, ComplaintList, Spinner, Err, SEVCOLOR, fmt } from '../components/ui'
const COLORS = ['#2563eb', '#16a34a', '#f97316', '#dc2626', '#8b5cf6', '#0891b2', '#eab308', '#64748b']
const PRI = { Low: SEVCOLOR.Low, Medium: SEVCOLOR.Medium, High: SEVCOLOR.High, Critical: SEVCOLOR.Critical }
const Chart = ({ title, children }) => <div className="card"><h3 className="mb-3 font-semibold">{title}</h3><div style={{ height: 240 }}><ResponsiveContainer>{children}</ResponsiveContainer></div></div>
const Pie1 = ({ data }) => <PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={85} label>{data.map((d, i) => <Cell key={i} fill={PRI[d.name] || COLORS[i % 8]} />)}</Pie><Tooltip /><Legend /></PieChart>
const Bar1 = ({ data }) => <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} height={60} textAnchor="end" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} /></BarChart>
export default function Dashboard() {
  const { user } = useAuth(); const [d, setD] = useState(null); const [an, setAn] = useState(null); const [e, setE] = useState('')
  useEffect(() => {
    api.get(`/dashboard/${user.role}`).then(r => setD(r.data)).catch(x => setE(errMsg(x)))
    if (user.role === 'admin') api.get('/analytics').then(r => setAn(r.data)).catch(x => setE(errMsg(x)))
  }, [user.role])
  if (e) return <Err msg={e} />
  if (!d) return <Spinner />
  const s = d.stats
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Hello, {user.name.split(' ')[0]} 👋</h1>
      <p className="text-sm text-slate-500">{user.role === 'admin' ? 'City-wide civic intelligence overview' : user.role === 'officer' ? `Work queue · ${d.department || ''}` : 'Track the issues you reported'}</p></div>
      {user.role === 'citizen' && <Link to="/app/report" className="btn"><PlusCircle size={18} />Report Issue</Link>}</div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label={user.role === 'admin' ? 'Total issues' : user.role === 'officer' ? 'Assigned complaints' : 'Total complaints'} value={s.total} icon={ClipboardList} />
      <StatCard label="Pending" value={s.pending} icon={Clock} tone="text-slate-600 bg-slate-100" />
      <StatCard label="In progress" value={s.in_progress} icon={Loader} tone="text-indigo-600 bg-indigo-50" />
      <StatCard label="Resolved" value={s.resolved} icon={CheckCircle2} tone="text-green-600 bg-green-50" />
      {user.role !== 'citizen' && <StatCard label="Critical" value={s.critical} icon={AlertTriangle} tone="text-red-600 bg-red-50" />}
      {user.role === 'admin' && <><StatCard label="Avg resolution (hrs)" value={s.avg_resolution_hours} icon={Timer} tone="text-amber-600 bg-amber-50" />
        <StatCard label="Resolution rate" value={`${s.resolution_rate}%`} icon={Percent} tone="text-teal-600 bg-teal-50" /><StatCard label="Citizens / Officers" value={`${s.citizens} / ${s.officers}`} icon={Users} /></>}</div>
    {user.role === 'officer' && <div className="grid gap-4 lg:grid-cols-3"><div className="card lg:col-span-2"><h3 className="mb-2 font-semibold">Recent assignments</h3><ComplaintList items={d.recent} /></div>
      <Chart title="Priority distribution"><Pie1 data={d.priority_distribution} /></Chart></div>}
    {user.role === 'citizen' && <div className="grid gap-4 lg:grid-cols-3"><div className="card lg:col-span-2"><h3 className="mb-2 font-semibold">Recent complaints</h3><ComplaintList items={d.recent} /></div>
      <div className="card"><h3 className="mb-2 font-semibold">Notifications</h3>{d.notifications.length ? d.notifications.map(n => <div key={n.id} className="border-b border-slate-100 py-2 text-sm last:border-0">{n.message}<div className="text-xs text-slate-400">{fmt(n.created_at)}</div></div>) : <p className="text-sm text-slate-400">Nothing new.</p>}
        <Link to="/app/notifications" className="mt-2 block text-sm font-semibold text-brand-600">View all</Link></div></div>}
    {user.role === 'admin' && an && <>
      <div className="grid gap-4 lg:grid-cols-3"><Chart title="Issues by category"><Bar1 data={an.by_category} /></Chart><Chart title="Issues by severity"><Pie1 data={an.by_severity} /></Chart>
        <Chart title="Issues by department"><Bar1 data={an.by_department} /></Chart></div>
      <div className="grid gap-4 lg:grid-cols-3"><div className="lg:col-span-2"><Chart title="Monthly complaints & resolution trend"><LineChart data={an.monthly}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
        <Line dataKey="reported" stroke="#2563eb" strokeWidth={2} /><Line dataKey="resolved" stroke="#16a34a" strokeWidth={2} /></LineChart></Chart></div><Chart title="Priority distribution"><Pie1 data={an.priority_distribution} /></Chart></div>
      <div className="grid gap-4 lg:grid-cols-2"><div className="card"><h3 className="mb-2 font-semibold">🚨 Critical issues</h3><ComplaintList items={d.critical} /></div>
        <div className="card overflow-x-auto"><h3 className="mb-2 font-semibold">Department performance</h3><table className="w-full text-sm"><thead className="text-left text-xs text-slate-500"><tr><th>Department</th><th>Total</th><th>Resolved</th><th>Rate</th><th>Avg hrs</th></tr></thead>
          <tbody>{an.department_performance.map(p => <tr key={p.department} className="border-t border-slate-100"><td className="py-2">{p.department}</td><td>{p.total}</td><td>{p.resolved}</td><td>{p.rate}%</td><td>{p.avg_hours ?? '–'}</td></tr>)}</tbody></table>
          {an.avg_rating && <p className="mt-3 text-sm text-slate-500">Average citizen rating: ⭐ {an.avg_rating}/5</p>}</div></div></>}</div>
}
