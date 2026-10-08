import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c })
export const errMsg = e => e?.response?.data?.error || (e?.request ? 'Cannot reach the server. Is the backend running?' : 'Something went wrong.')
export const imgUrl = p => (p ? `/api/uploads/${p}` : null)
export default api
