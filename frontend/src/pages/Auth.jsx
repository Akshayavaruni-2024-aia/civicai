import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { useAuth } from '../AuthContext'
import { errMsg } from '../api'
import { Err } from '../components/ui'
import { useT, LanguageSwitcher } from '../i18n'
const Shell = ({ title, children }) => <div className="flex min-h-screen items-center justify-center hero-bg p-4">
  <div className="card w-full max-w-md"><Link to="/" className="mb-4 flex items-center gap-2 font-bold text-brand-600"><Building2 /> CivicAI</Link><div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-bold">{title}</h1><LanguageSwitcher /></div>{children}</div></div>
function useForm(fn, init) {
  const [f, setF] = useState(init); const [e, setE] = useState(''); const [b, setB] = useState(false)
  const set = k => ev => setF({ ...f, [k]: ev.target.value })
  const submit = async ev => { ev.preventDefault(); setE(''); setB(true); try { await fn(f) } catch (x) { setE(errMsg(x)) } setB(false) }
  return { f, set, e, b, submit, setF }
}
export function Login() {
  const { login } = useAuth(); const nav = useNavigate(); const t = useT()
  const { f, set, e, b, submit, setF } = useForm(x => login(x.email, x.password).then(() => nav('/app')), { email: '', password: '' })
  return <Shell title={t('welcome')}><form onSubmit={submit} className="space-y-3"><Err msg={e} />
    <div><label className="label">{t('email')}</label><input className="input" type="email" required value={f.email} onChange={set('email')} /></div>
    <div><label className="label">{t('password')}</label><input className="input" type="password" required value={f.password} onChange={set('password')} /></div>
    <button className="btn w-full" disabled={b}>{t('login')}</button></form>
    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><b>Demo (password Demo@123) – click to fill:</b><div className="mt-1 flex flex-wrap gap-2">
      {[['Citizen', 'citizen@civic.demo'], ['Officer', 'officer@civic.demo'], ['Admin', 'admin@civic.demo']].map(([n, m]) => <button key={n} type="button" className="btn-ghost !px-2 !py-1 !text-xs" onClick={() => setF({ email: m, password: 'Demo@123' })}>{n}</button>)}</div></div>
    <p className="mt-4 text-sm text-slate-500">New here? <Link to="/register" className="font-semibold text-brand-600">Create an account</Link></p></Shell>
}
export function Register() {
  const { register } = useAuth(); const nav = useNavigate(); const t = useT()
  const { f, set, e, b, submit } = useForm(x => register(x).then(() => nav('/app')), { name: '', email: '', phone: '', password: '' })
  return <Shell title={t('createAcc')}><form onSubmit={submit} className="space-y-3"><Err msg={e} />
    {[['name', t('fullName'), 'text'], ['email', t('email'), 'email'], ['phone', t('phone'), 'tel'], ['password', t('password') + ' (6+)', 'password']].map(([k, l, t]) =>
      <div key={k}><label className="label">{l}</label><input className="input" type={t} required={k !== 'phone'} value={f[k]} onChange={set(k)} /></div>)}
    <button className="btn w-full" disabled={b}>{t('register')}</button></form>
    <p className="mt-4 text-sm text-slate-500">Already registered? <Link to="/login" className="font-semibold text-brand-600">Login</Link></p></Shell>
}
