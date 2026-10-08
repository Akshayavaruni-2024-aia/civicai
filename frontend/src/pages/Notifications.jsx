import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import api, { errMsg } from '../api'
import { useT } from '../i18n'
import { fmt, Err, Spinner, PageHeader } from '../components/ui'
export default function Notifications() {
  const t = useT(); const [d, setD] = useState(null); const [e, setE] = useState('')
  const load = () => api.get('/notifications').then(r => setD(r.data)).catch(x => setE(errMsg(x)))
  useEffect(() => { load() }, [])
  if (!d) return e ? <Err msg={e} /> : <Spinner />
  return <div><PageHeader icon={Bell} title={t('notifications')} sub={t('notifSub')}><button className="btn-ghost" onClick={() => api.post('/notifications/read').then(load)}>✓ Mark all read</button></PageHeader>
    <div className="card divide-y divide-slate-100">{d.items.length ? d.items.map(n => <div key={n.id} className={`flex gap-3 py-3 ${n.is_read ? 'opacity-60' : ''}`}><Bell size={18} className="mt-0.5 shrink-0 text-brand-500" />
      <div className="flex-1 text-sm">{n.message}<div className="text-xs text-slate-400">{fmt(n.created_at)}</div></div>{n.complaint_id && <Link className="text-sm font-semibold text-brand-600" to={`/app/complaints/${n.complaint_id}`}>Open</Link>}</div>) : <div className="py-10 text-center"><div className="text-4xl">🔔</div><p className="mt-2 text-slate-400">No notifications yet.</p></div>}</div></div>
}
