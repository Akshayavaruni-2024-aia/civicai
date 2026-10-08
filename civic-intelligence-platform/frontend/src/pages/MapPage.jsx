import { useEffect, useState } from 'react'
import api, { errMsg } from '../api'
import { IssueMap } from '../components/MapView'
import { SEVCOLOR, Err, Spinner } from '../components/ui'
export default function MapPage() {
  const [pts, setPts] = useState(null); const [e, setE] = useState(''); const [sev, setSev] = useState('')
  useEffect(() => { api.get('/map').then(r => setPts(r.data)).catch(x => setE(errMsg(x))) }, [])
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Civic issue map</h1>
    <div className="flex flex-wrap gap-2 text-xs">{Object.entries(SEVCOLOR).map(([k, c]) => <button key={k} onClick={() => setSev(sev === k ? '' : k)} className={`flex items-center gap-1 rounded-full border px-3 py-1 ${sev === k ? 'bg-slate-800 text-white' : 'bg-white'}`}><span className="h-3 w-3 rounded-full" style={{ background: c }} />{k}</button>)}</div></div>
    <Err msg={e} />{pts ? <div className="card !p-2"><IssueMap points={pts.filter(p => !sev || p.severity === sev)} /></div> : <Spinner />}
    <p className="text-sm text-slate-500">Larger markers mean more citizens reported the same issue. Click a marker for details.</p></div>
}
