import { useEffect, useState } from 'react'
import api, { errMsg } from '../api'
import { useAuth } from '../AuthContext'
import { ListChecks } from 'lucide-react'
import { useT } from '../i18n'
import { CATS, STATUSES, ComplaintList, Err, Spinner, PageHeader } from '../components/ui'
export default function Complaints() {
  const { user } = useAuth(); const t = useT(); const [f, setF] = useState({ q: '', category: '', severity: '', status: '', date_from: '', date_to: '' })
  const [items, setItems] = useState(null); const [e, setE] = useState('')
  useEffect(() => { const p = Object.fromEntries(Object.entries(f).filter(([, v]) => v)); const t = setTimeout(() => api.get('/complaints', { params: p }).then(r => setItems(r.data)).catch(x => setE(errMsg(x))), 250); return () => clearTimeout(t) }, [f])
  const set = k => ev => setF({ ...f, [k]: ev.target.value })
  const Sel = ({ k, opts, ph }) => <select className="input" value={f[k]} onChange={set(k)}><option value="">{ph}</option>{opts.map(o => <option key={o}>{o}</option>)}</select>
  return <div className="space-y-4"><PageHeader icon={ListChecks} title={user.role === 'citizen' ? t('myComplaints') : t('complaints')} sub={t('complaintsSub')} /><Err msg={e} />
    <div className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><input className="input lg:col-span-2" placeholder="Search title or CIV-number" value={f.q} onChange={set('q')} />
      <Sel k="category" opts={CATS} ph="All categories" /><Sel k="severity" opts={['Low', 'Medium', 'High', 'Critical']} ph="All severities" /><Sel k="status" opts={STATUSES} ph="All statuses" />
      <div className="flex gap-2"><input type="date" className="input" value={f.date_from} onChange={set('date_from')} title="From" /><input type="date" className="input" value={f.date_to} onChange={set('date_to')} title="To" /></div></div>
    <div className="card">{items ? <ComplaintList items={items} /> : <Spinner />}</div></div>
}
