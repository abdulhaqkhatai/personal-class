import { getToken } from './auth'

// API base reads from Vercel/Netlify environment: VITE_API_URL
// Set `VITE_API_URL` in your deployment to the backend base (e.g. https://habbu.onrender.com)
const API_BASE = import.meta.env.VITE_API_URL

export async function apiFetch(path, opts = {}){
  const headers = opts.headers || {}
  const token = getToken()
  if(token) headers['Authorization'] = `Bearer ${token}`
  if(!headers['Content-Type'] && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const base = API_BASE || ''
  const url = `${base}${path}`
  const res = await fetch(url, { ...opts, headers })
  if(res.status === 401){
    // unauthorized - clear token
    localStorage.removeItem('ma_token')
    localStorage.removeItem('ma_current')
    // let caller handle redirect
  }
  const text = await res.text()
  try{ return JSON.parse(text) }catch(e){ return text }
}
