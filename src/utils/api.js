import { getToken } from './auth'

// Default API base points to backend server. When running frontend dev server
// you may want to change this to 'http://localhost:4000' or set VITE_API_BASE.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export async function apiFetch(path, opts = {}){
  const headers = opts.headers || {}
  const token = getToken()
  if(token) headers['Authorization'] = `Bearer ${token}`
  if(!headers['Content-Type'] && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const res = await fetch(API_BASE + path, { ...opts, headers })
  if(res.status === 401){
    // unauthorized - clear token
    localStorage.removeItem('ma_token')
    localStorage.removeItem('ma_current')
    // let caller handle redirect
  }
  const text = await res.text()
  try{ return JSON.parse(text) }catch(e){ return text }
}
