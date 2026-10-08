import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import api, { errMsg } from '../api'
import { fmt, Err, Spinner } from '../components/ui'
export default function Notifications() {
  const [d, setD] = useState(null); const [e, setE] = useState('')
  const load = () => api.get('/notifications').then(r => setD(r.data)).catch(x => setE(errMsg(x)))
  useEffect(() => { load() }, [])
  if (!d) return e ? <Err msg={e} /> : <Spinner />
  return <div className="mx-auto max-w-2xl space-y-3"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Notifications</h1>
    <button className="btn-ghost" onClick={() => api.post('/notifications/read').then(load)}>Mark all read</button></div>
    <div className="card divide-y divide-slate-100">{d.items.length ? d.items.map(n => <div key={n.id} className={`flex gap-3 py-3 ${n.is_read ? 'opacity-60' : ''}`}><Bell size={18} className="mt-0.5 shrink-0 text-brand-500" />
      <div className="flex-1 text-sm">{n.message}<div className="text-xs text-slate-400">{fmt(n.created_at)}</div></div>{n.complaint_id && <Link className="text-sm font-semibold text-brand-600" to={`/app/complaints/${n.complaint_id}`}>Open</Link>}</div>) : <p className="py-6 text-center text-slate-400">No notifications yet.</p>}</div></div>
}
