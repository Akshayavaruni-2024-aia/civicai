import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Sparkles, Users, Building2, Star } from 'lucide-react'
import api, { errMsg, imgUrl } from '../api'
import { useAuth } from '../AuthContext'
import { Badge, SEV, STAT, CATS, fmt, Err, Spinner } from '../components/ui'
import { IssueMap } from '../components/MapView'
export default function ComplaintDetail() {
  const { id } = useParams(); const { user } = useAuth(); const [c, setC] = useState(null); const [e, setE] = useState(''); const [ok, setOk] = useState('')
  const [remarks, setRemarks] = useState(''); const [before, setBefore] = useState(null); const [after, setAfter] = useState(null); const [rating, setRating] = useState(5); const [comment, setComment] = useState('')
  const [depts, setDepts] = useState([]); const [officers, setOfficers] = useState([])
  const load = () => api.get(`/complaints/${id}`).then(r => setC(r.data)).catch(x => setE(errMsg(x)))
  useEffect(() => { load(); if (user.role === 'admin') { api.get('/departments').then(r => setDepts(r.data)); api.get('/users', { params: { role: 'officer' } }).then(r => setOfficers(r.data)) } }, [id])
  const act = async fn => { setE(''); setOk(''); try { const r = await fn(); if (r?.data?.id) setC(r.data); setOk('Updated successfully.'); setRemarks('') } catch (x) { setE(errMsg(x)) } }
  if (!c) return e ? <Err msg={e} /> : <Spinner />
  const done = ['Resolved', 'Verified'].includes(c.status); const staff = user.role !== 'citizen'
  const upload = () => { const fd = new FormData(); fd.append('remarks', remarks); if (before) fd.append('before_image', before); if (after) fd.append('after_image', after); return api.post(`/complaints/${id}/resolve`, fd) }
  return <div className="mx-auto max-w-5xl space-y-4"><Err msg={e} />{ok && <div className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{ok}</div>}
    <div className="card"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-xs text-slate-500">{c.complaint_number}</div><h1 className="text-2xl font-bold">{c.title}</h1></div>
      <div className="flex gap-2"><Badge v={c.severity} map={SEV} /><Badge v={c.status} map={STAT} /></div></div>
      <p className="mt-3 text-slate-700">{c.description}</p>{c.extra_info && <p className="mt-1 text-sm text-slate-500">{c.extra_info}</p>}
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600"><span className="flex items-center gap-1"><Users size={15} />{c.report_count} citizen{c.report_count > 1 ? 's' : ''} reported this issue</span>
        <span className="flex items-center gap-1"><Building2 size={15} />{c.department || 'Unassigned'}</span><span>Officer: {c.officer || 'Not yet assigned'}</span><span>Reporter: {c.citizen}</span><span>Filed {fmt(c.created_at)}</span></div></div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card"><h2 className="mb-2 flex items-center gap-2 font-semibold"><Sparkles size={16} className="text-brand-500" />AI Analysis</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm"><div><dt className="label">Category</dt>{c.category}</div><div><dt className="label">Priority</dt><b className="text-lg">{c.priority_score}</b>/100</div></dl>
        <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${c.priority_score}%` }} /></div><p className="mt-2 text-sm text-slate-500">{c.ai_summary}</p>
        {staff && <button className="btn-ghost mt-2" onClick={() => act(() => api.post(`/complaints/${id}/analyze`).then(r => ({ data: r.data.complaint })))}>Re-run AI analysis</button>}</div>
      <div className="card"><h2 className="mb-2 font-semibold">Location</h2><IssueMap points={[c]} height={200} center={[c.latitude, c.longitude]} zoom={15} /><p className="mt-1 text-xs text-slate-500">{c.address || `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`}</p></div></div>
    {(c.image_path || c.before_image_path || c.resolution_image_path) && <div className="card"><h2 className="mb-2 font-semibold">Images</h2><div className="flex flex-wrap gap-4">
      {[['Citizen upload', c.image_path], ['Before (officer)', c.before_image_path], ['After resolution', c.resolution_image_path]].filter(x => x[1]).map(([l, p]) => <figure key={l}><img src={imgUrl(p)} className="h-48 rounded-xl object-cover" /><figcaption className="mt-1 text-xs text-slate-500">{l}</figcaption></figure>)}</div></div>}
    {user.role === 'admin' && <div className="card"><h2 className="mb-2 font-semibold">Admin controls</h2><div className="grid gap-3 sm:grid-cols-3">
      <div><label className="label">Department</label><select className="input" value={c.department_id || ''} onChange={x => act(() => api.put(`/complaints/${id}`, { department_id: Number(x.target.value) }))}>{depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
      <div><label className="label">Officer</label><select className="input" value={c.officer_id || ''} onChange={x => act(() => api.put(`/complaints/${id}`, { officer_id: Number(x.target.value) }))}><option value="">Unassigned</option>{officers.map(o => <option key={o.id} value={o.id}>{o.name} ({o.department})</option>)}</select></div>
      <div><label className="label">Category</label><select className="input" value={c.category} onChange={x => act(() => api.put(`/complaints/${id}`, { category: x.target.value }))}>{CATS.map(k => <option key={k}>{k}</option>)}</select></div></div>
      <button className="mt-3 text-sm text-red-600" onClick={() => confirm('Delete this complaint permanently?') && api.delete(`/complaints/${id}`).then(() => history.back()).catch(x => setE(errMsg(x)))}>Delete complaint</button></div>}
    {staff && !done && <div className="card space-y-3"><h2 className="font-semibold">Officer actions</h2><textarea className="input" rows={2} placeholder="Remarks (required to resolve)" value={remarks} onChange={x => setRemarks(x.target.value)} />
      <div className="flex flex-wrap gap-2">{c.status !== 'In Progress' && <button className="btn" onClick={() => act(() => api.post(`/complaints/${id}/status`, { status: 'In Progress', remarks }))}>{c.officer_id ? 'Start work (In Progress)' : 'Accept & start'}</button>}</div>
      <div className="grid gap-3 sm:grid-cols-2"><div><label className="label">Before image</label><input type="file" accept=".jpg,.jpeg,.png" className="input" onChange={x => setBefore(x.target.files[0])} /></div>
        <div><label className="label">After / resolution image</label><input type="file" accept=".jpg,.jpeg,.png" className="input" onChange={x => setAfter(x.target.files[0])} /></div></div>
      <button className="btn !bg-green-600 hover:!bg-green-700" onClick={() => act(upload)}>Mark as resolved</button></div>}
    {user.role === 'citizen' && c.citizen_id === user.id && c.status === 'Resolved' && <div className="card space-y-3 border-teal-300 bg-teal-50"><h2 className="font-semibold">Is the issue fixed? Please verify</h2>
      <div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setRating(n)}><Star className={n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'} /></button>)}</div>
      <input className="input" placeholder="Feedback (optional)" value={comment} onChange={x => setComment(x.target.value)} />
      <div className="flex gap-2"><button className="btn !bg-green-600" onClick={() => act(() => api.post(`/complaints/${id}/verify`, { rating, comment }))}>Yes, it's fixed</button>
        <button className="btn !bg-red-600" onClick={() => act(() => api.post(`/complaints/${id}/reopen`, { remarks: comment }))}>No, reopen</button></div></div>}
    {user.role === 'citizen' && c.citizen_id === user.id && c.status === 'Verified' && <button className="btn-ghost" onClick={() => act(() => api.post(`/complaints/${id}/reopen`, { remarks: 'Issue came back' }))}>Issue is back – reopen</button>}
    {c.feedback.length > 0 && <div className="card text-sm">⭐ {c.feedback[0].rating}/5 {c.feedback[0].comment && `– "${c.feedback[0].comment}"`}</div>}
    <div className="card"><h2 className="mb-3 font-semibold">Status history</h2><ol className="space-y-3 border-l-2 border-slate-200 pl-4">{[...c.updates].reverse().map((u, i) => <li key={i}><Badge v={u.status} map={STAT} /> <span className="text-sm">{u.remarks}</span>
      <div className="text-xs text-slate-400">{u.by} · {fmt(u.created_at)}</div>{u.image_path && <img src={imgUrl(u.image_path)} className="mt-1 h-20 rounded-lg" />}</li>)}</ol></div></div>
}
