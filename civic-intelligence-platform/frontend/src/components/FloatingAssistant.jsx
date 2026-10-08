import { useEffect, useRef, useState } from 'react'
import { Bot, X, Send, MessageCircle } from 'lucide-react'
import api, { errMsg } from '../api'
import { useT } from '../i18n'
export default function FloatingAssistant() {
  const t = useT(); const [open, setOpen] = useState(false); const [q, setQ] = useState(''); const [msgs, setMsgs] = useState([]); const [busy, setBusy] = useState(false); const end = useRef()
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs, open])
  const send = async text => {
    if (!text.trim() || busy) return; setMsgs(m => [...m, { me: 1, t: text }]); setQ(''); setBusy(true)
    try { const r = await api.post('/assistant', { message: text }); setMsgs(m => [...m, { t: r.data.reply }]) } catch (x) { setMsgs(m => [...m, { t: errMsg(x) }]) }
    setBusy(false)
  }
  return <div className="fixed bottom-5 right-5 z-40">
    {open && <div className="mb-3 flex h-[430px] w-[320px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
      <div className="hero-bg flex items-center justify-between p-3 text-white"><div className="flex items-center gap-2 font-semibold"><Bot size={20} />{t('assistant')}</div><button onClick={() => setOpen(false)}><X size={18} /></button></div>
      <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3 text-sm"><div className="max-w-[85%] rounded-2xl bg-white p-2 shadow-sm">{t('chatHi')}</div>
        <div className="flex flex-wrap gap-1">{['Status of my complaint?', 'Why is it pending?', 'How to report a pothole?'].map(s => <button key={s} onClick={() => send(s)} className="rounded-full border border-brand-500 px-2 py-0.5 text-xs text-brand-600">{s}</button>)}</div>
        {msgs.map((m, i) => <div key={i} className={`flex ${m.me ? 'justify-end' : ''}`}><div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl p-2 ${m.me ? 'bg-brand-500 text-white' : 'bg-white shadow-sm'}`}>{m.t}</div></div>)}{busy && <div className="text-xs text-slate-400">…</div>}<div ref={end} /></div>
      <div className="flex gap-2 border-t p-2"><input className="input" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(q)} placeholder={t('chatPh')} /><button className="btn !px-3" onClick={() => send(q)}><Send size={16} /></button></div></div>}
    <button onClick={() => setOpen(!open)} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-white shadow-xl hover:scale-105 transition"><MessageCircle /></button></div>
}
