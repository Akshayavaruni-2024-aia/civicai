import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, LocateFixed, Copy, CheckCircle2, PlusCircle, Lightbulb } from 'lucide-react'
import { useT } from '../i18n'
import api, { errMsg } from '../api'
import { CATS, Err, Badge, SEV, PageHeader } from '../components/ui'
import { Picker } from '../components/MapView'
export default function Report() {
  const t = useT()
  const [f, setF] = useState({ title: '', description: '', category: '', extra_info: '', address: '' })
  const [pos, setPos] = useState(null); const [file, setFile] = useState(null); const [e, setE] = useState(''); const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null); const [hint, setHint] = useState(null)
  const set = k => ev => setF({ ...f, [k]: ev.target.value })
  const locate = () => navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => setPos([p.coords.latitude, p.coords.longitude]), () => setE('Could not get your location. Tap the map instead.')) : setE('Geolocation is not supported. Tap the map instead.')
  const suggest = async () => { try { const r = await api.post('/ai/preview', f); setHint(r.data); setF(x => ({ ...x, category: r.data.category })) } catch (x) { setE(errMsg(x)) } }
  const submit = async ev => {
    ev.preventDefault(); setE('')
    if (!pos) return setE('Please tap the map (or use "My location") to mark where the issue is.')
    if (file && file.size > 5 * 1024 * 1024) return setE('Image must be under 5 MB.')
    const fd = new FormData(); Object.entries(f).forEach(([k, v]) => fd.append(k, v)); fd.append('latitude', pos[0]); fd.append('longitude', pos[1]); if (file) fd.append('image', file)
    setBusy(true)
    try { const r = await api.post('/complaints', fd); setRes(r.data) } catch (x) { setE(errMsg(x)) }
    setBusy(false)
  }
  if (res) { const a = res.ai, c = res.complaint; return <div className="mx-auto max-w-xl space-y-4">
    <div className="card text-center"><CheckCircle2 className="mx-auto text-green-600" size={40} /><h1 className="mt-2 text-xl font-bold">{res.duplicate ? 'Linked to an existing issue' : 'Complaint submitted'}</h1>
      <p className="text-sm text-slate-500">{res.duplicate ? <><Copy className="mr-1 inline" size={14} />Similar issue nearby already exists: <b>{c.complaint_number}</b>. <b>{c.report_count} citizens reported this issue.</b></> : <>Your complaint number is <b>{c.complaint_number}</b></>}</p></div>
    <div className="card"><h2 className="mb-3 flex items-center gap-2 font-semibold"><Sparkles className="text-brand-500" size={18} />AI Analysis <span className="text-xs font-normal text-slate-400">({a.source === 'ai' ? 'AI model' : 'built-in engine'})</span></h2>
      <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="label">Issue</dt>{c.title}</div><div><dt className="label">Category</dt>{a.category}</div>
        <div><dt className="label">Severity</dt><Badge v={a.severity} map={SEV} /></div><div><dt className="label">Priority score</dt><b>{c.priority_score}</b>/100</div>
        <div className="col-span-2"><dt className="label">Department</dt>{a.department}</div><div className="col-span-2 text-slate-500">{a.summary}</div></dl></div>
    <div className="flex gap-2"><Link to={`/app/complaints/${c.id}`} className="btn">Track complaint</Link><button className="btn-ghost" onClick={() => { setRes(null); setF({ title: '', description: '', category: '', extra_info: '', address: '' }); setPos(null); setFile(null); setHint(null) }}>Report another</button></div></div> }
  return <div><PageHeader icon={PlusCircle} title={t('reportTitle')} sub={t('reportSub')} /><div className="grid gap-6 lg:grid-cols-3"><form onSubmit={submit} className="space-y-4 lg:col-span-2"><Err msg={e} />
    <div className="card space-y-3">
      <div><label className="label">{t('title')} *</label><input className="input" required value={f.title} onChange={set('title')} placeholder="e.g. Large pothole near main road" /></div>
      <div><label className="label">{t('description')} *</label><textarea className="input" rows={4} required value={f.description} onChange={set('description')} placeholder="Describe the problem, nearby landmarks and any danger to people." /></div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><div><label className="label">{t('category')}</label><select className="input" value={f.category} onChange={set('category')}><option value="">Let AI decide</option>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
        <button type="button" className="btn-ghost self-end" onClick={suggest} disabled={f.description.length < 5}><Sparkles size={16} />{t('suggest')}</button></div>
      {hint && <div className="rounded-xl bg-brand-50 p-3 text-sm">AI suggests <b>{hint.category}</b> · severity <b>{hint.severity}</b> · priority <b>{hint.priority}</b> · {hint.department}</div>}
      <div><label className="label">Photo (JPG/PNG, max 5 MB)</label><input type="file" accept=".jpg,.jpeg,.png" onChange={ev => setFile(ev.target.files[0])} className="input" />
        {file && <img src={URL.createObjectURL(file)} className="mt-2 h-32 rounded-xl object-cover" />}</div>
      <div><label className="label">Additional information (optional)</label><input className="input" value={f.extra_info} onChange={set('extra_info')} /></div></div>
    <div className="card space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><label className="label !mb-0">{t('location')} *</label><button type="button" className="btn-ghost" onClick={locate}><LocateFixed size={16} />{t('myLoc')}</button></div>
      <Picker value={pos} onChange={setPos} />{pos && <p className="text-xs text-slate-500">Selected: {pos[0].toFixed(5)}, {pos[1].toFixed(5)}</p>}
      <input className="input" placeholder="Street / landmark (optional)" value={f.address} onChange={set('address')} /></div>
    <button className="btn w-full !py-3" disabled={busy}>{busy ? t('analysing') : t('submit')}</button></form>
    <aside className="space-y-4"><div className="card border-t-4 !border-t-yellow-400"><h3 className="mb-3 flex items-center gap-2 font-semibold"><Lightbulb className="text-yellow-500" size={18} />{t('tipsTitle')}</h3>
      <ul className="space-y-2 text-sm text-slate-600">{['tip1', 'tip2', 'tip3'].map(k => <li key={k} className="flex gap-2"><span className="text-green-600">✓</span>{t(k)}</li>)}</ul></div>
      <div className="card border-t-4 !border-t-brand-500"><h3 className="mb-3 font-semibold">{t('nextTitle')}</h3><ol className="space-y-3 text-sm">{['s2', 's3', 's4', 's5'].map((k, i) => <li key={k} className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">{i + 1}</span>{t(k)}</li>)}</ol></div></aside></div></div>
}
