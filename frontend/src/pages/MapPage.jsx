import { useEffect, useState } from 'react'
import { Map as MapIcon } from 'lucide-react'
import api, { errMsg } from '../api'
import { useT } from '../i18n'
import { IssueMap } from '../components/MapView'
import { SEVCOLOR, Err, Spinner, PageHeader } from '../components/ui'
export default function MapPage() {
  const t = useT(); const [pts, setPts] = useState(null); const [e, setE] = useState(''); const [sev, setSev] = useState('')
  useEffect(() => { api.get('/map').then(r => setPts(r.data)).catch(x => setE(errMsg(x))) }, [])
  return <div className="space-y-4"><PageHeader icon={MapIcon} title={t('map')} sub={t('mapSub')}>
    <div className="flex flex-wrap gap-2 text-xs">{Object.entries(SEVCOLOR).map(([k, c]) => <button key={k} onClick={() => setSev(sev === k ? '' : k)} className={`flex items-center gap-1 rounded-full px-3 py-1 font-semibold ${sev === k ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}><span className="h-3 w-3 rounded-full" style={{ background: c }} />{k}</button>)}</div></PageHeader>
    <Err msg={e} />{pts ? <div className="card !p-2"><IssueMap points={pts.filter(p => !sev || p.severity === sev)} height={520} /></div> : <Spinner />}</div>
}
