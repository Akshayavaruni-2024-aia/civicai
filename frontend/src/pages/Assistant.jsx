import { useEffect, useRef, useState } from 'react'
import { Send, Bot } from 'lucide-react'
import api, { errMsg } from '../api'
import { useT } from '../i18n'
import { PageHeader } from '../components/ui'
const QS = ['What is the status of my complaint?', 'Why is my complaint still pending?', 'How do I report a pothole?', 'What complaints have I submitted?', 'What civic problems are nearby?']
export default function Assistant() {
  const t = useT()
  const [msgs, setMsgs] = useState([{ r: 'bot', t: "Hi! I'm your Civic Assistant. Ask me about your complaints or how to report an issue." }]); const [q, setQ] = useState(''); const [busy, setBusy] = useState(false); const end = useRef()
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs])
  const send = async t => {
    if (!t.trim() || busy) return; setMsgs(m => [...m, { r: 'me', t }]); setQ(''); setBusy(true)
    try { const r = await api.post('/assistant', { message: t }); setMsgs(m => [...m, { r: 'bot', t: r.data.reply }]) } catch (x) { setMsgs(m => [...m, { r: 'bot', t: errMsg(x) }]) }
    setBusy(false)
  }
  return <div className="mx-auto max-w-3xl space-y-3"><PageHeader icon={Bot} title={t('assistant')} sub={t('assistSub')} />
    <div className="card h-[55vh] space-y-3 overflow-y-auto">{msgs.map((m, i) => <div key={i} className={`flex ${m.r === 'me' ? 'justify-end' : ''}`}><div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${m.r === 'me' ? 'bg-brand-500 text-white' : 'bg-slate-100'}`}>{m.t}</div></div>)}{busy && <div className="text-sm text-slate-400">Thinking…</div>}<div ref={end} /></div>
    <div className="flex flex-wrap gap-2">{QS.map(s => <button key={s} className="btn-ghost !text-xs" onClick={() => send(s)}>{s}</button>)}</div>
    <div className="flex gap-2"><input className="input" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(q)} placeholder="Ask something…" /><button className="btn" onClick={() => send(q)}><Send size={16} /></button></div></div>
}
