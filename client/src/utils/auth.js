const CURR_KEY = 'ma_current'
const TOKEN_KEY = 'ma_token'
const CLASS_KEY = 'ma_class'

// API login — calls backend and stores token + user + class
import { apiFetch } from './api'

export async function signup(username, password, className, subjects) {
  if (!username || !password || !className || !subjects) return { success: false }
  try {
    const data = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password, role: 'teacher', className, subjects })
    })
    if (data && data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(CURR_KEY, JSON.stringify(data.user))
      if (data.class) localStorage.setItem(CLASS_KEY, JSON.stringify(data.class))
      return { success: true, user: data.user, class: data.class }
    }
    return { success: false }
  } catch (err) {
    console.error('signup error', err)
    return { success: false, error: err.message }
  }
}

export async function login(username, password) {
  if (!username || !password) return { success: false }
  try {
    const data = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
    if (data && data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(CURR_KEY, JSON.stringify(data.user))
      if (data.class) localStorage.setItem(CLASS_KEY, JSON.stringify(data.class))
      return { success: true, user: data.user }
    }
    return { success: false }
  } catch (err) {
    console.error('login error', err)
    return { success: false }
  }
}

export function logout() {
  localStorage.removeItem(CURR_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(CLASS_KEY)
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem(CURR_KEY) || 'null')
}

export function getClassData() {
  return JSON.parse(localStorage.getItem(CLASS_KEY) || 'null')
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function ensureSeedData() {
  // noop — backend manages data
}
