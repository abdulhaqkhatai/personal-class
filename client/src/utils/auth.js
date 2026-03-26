const CURR_KEY = 'ma_current'
const TOKEN_KEY = 'ma_token'

import { apiFetch } from './api'

export async function login(username, password) {
  if (!username || !password) return { success: false }
  try {
    const data = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
    if (data && data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(CURR_KEY, JSON.stringify(data.user))
      return { success: true, user: data.user }
    }
    return { success: false, error: data?.error }
  } catch (err) {
    console.error('login error', err)
    return { success: false }
  }
}

export async function signup({ className, username, password, subjects, students }) {
  try {
    const data = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ className, username, password, subjects, students })
    })
    if (data && data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(CURR_KEY, JSON.stringify(data.user))
      return { success: true, user: data.user }
    }
    return { success: false, error: data?.error || 'Signup failed' }
  } catch (err) {
    console.error('signup error', err)
    return { success: false, error: 'Network error' }
  }
}

export function logout() {
  localStorage.removeItem(CURR_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem(CURR_KEY) || 'null')
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function ensureSeedData() {
  // noop — backend manages data
}
