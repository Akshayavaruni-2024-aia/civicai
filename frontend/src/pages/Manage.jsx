import { useEffect, useState } from 'react'
import api, { errMsg } from '../api'
import { Err, PageHeader } from '../components/ui'
import { useT } from '../i18n'
import { Settings } from 'lucide-react'
export default function Manage() {
  const t = useT(); const [tab, setTab] = useState('citizen'); const [users, setUsers] = useState([]); const [depts, setDepts] = useState([]); const [e, setE] = useState('')
  const [nd, setNd] = useState({ name: '', description: '' }); const [nu, setNu] = useState({ name: '', email: '', password: '', role: 'officer', department_id: '' })
  const load = () => { api.get('/users').then(r => setUsers(r.data)); api.get('/departments').then(r => setDepts(r.data)) }
  useEffect(() => { load() }, [])
  const run = async fn => { setE(''); try { await fn(); load() } catch (x) { setE(errMsg(x)) } }
  const list = users.filter(u => tab === 'admin' ? u.role === 'admin' : u.role === tab)
  return <div className="space-y-4"><PageHeader icon={Settings} title={t('manage')} sub={t('manageSub')} /><Err msg={e} />
    <div className="flex gap-2">{['citizen', 'officer', 'admin', 'departments'].map(t => <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${tab === t ? 'bg-brand-500 text-white' : 'bg-white border'}`}>{t === 'departments' ? 'Departments' : t + 's'}</button>)}</div>
    {tab === 'departments' ? <div className="grid gap-4 lg:grid-cols-3"><div className="card overflow-x-auto lg:col-span-2"><table className="w-full text-sm"><thead className="text-left text-xs text-slate-500"><tr><th>Name</th><th>Description</th><th /></tr></thead>
      <tbody>{depts.map(d => <tr key={d.id} className="border-t"><td className="py-2 font-medium">{d.name}</td><td>{d.description}</td><td><button className="text-red-600" onClick={() => run(() => api.delete(`/departments/${d.id}`))}>Delete</button></td></tr>)}</tbody></table></div>
      <div className="card space-y-2"><h3 className="font-semibold">Add department</h3><input className="input" placeholder="Name" value={nd.name} onChange={x => setNd({ ...nd, name: x.target.value })} />
        <input className="input" placeholder="Description" value={nd.description} onChange={x => setNd({ ...nd, description: x.target.value })} /><button className="btn w-full" onClick={() => run(async () => { await api.post('/departments', nd); setNd({ name: '', description: '' }) })}>Add</button></div></div>
    : <div className="grid gap-4 lg:grid-cols-3"><div className="card overflow-x-auto lg:col-span-2"><table className="w-full text-sm"><thead className="text-left text-xs text-slate-500"><tr><th>Name</th><th>Email</th><th>Dept</th><th>Complaints</th><th /></tr></thead>
      <tbody>{list.map(u => <tr key={u.id} className="border-t"><td className="py-2 font-medium">{u.name}</td><td>{u.email}</td><td>{u.department || '–'}</td><td>{u.complaints ?? '–'}</td><td className="space-x-2">
        <select className="rounded border text-xs" value={u.role} onChange={x => run(() => api.put(`/users/${u.id}`, { role: x.target.value }))}>{['citizen', 'officer', 'admin'].map(r => <option key={r}>{r}</option>)}</select>
        <button className="text-red-600" onClick={() => confirm('Delete this user?') && run(() => api.delete(`/users/${u.id}`))}>Delete</button></td></tr>)}</tbody></table></div>
      <div className="card space-y-2"><h3 className="font-semibold">Create user</h3>{['name', 'email', 'password'].map(k => <input key={k} className="input" type={k === 'password' ? 'password' : 'text'} placeholder={k} value={nu[k]} onChange={x => setNu({ ...nu, [k]: x.target.value })} />)}
        <select className="input" value={nu.role} onChange={x => setNu({ ...nu, role: x.target.value })}>{['officer', 'citizen', 'admin'].map(r => <option key={r}>{r}</option>)}</select>
        <select className="input" value={nu.department_id} onChange={x => setNu({ ...nu, department_id: x.target.value ? Number(x.target.value) : '' })}><option value="">No department</option>{depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <button className="btn w-full" onClick={() => run(async () => { await api.post('/users', nu); setNu({ ...nu, name: '', email: '', password: '' }) })}>Create</button></div></div>}</div>
}
