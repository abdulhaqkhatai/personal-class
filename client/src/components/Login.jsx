import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, signup } from '../utils/auth'

export default function Login({ darkMode, setDarkMode }) {
  const [mode, setMode] = useState('signin') // 'signin' or 'signup'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [className, setClassName] = useState('')
  const [subjects, setSubjects] = useState(['English', 'Hindi', 'Maths', 'Science', 'Social Science'])
  const [newSubject, setNewSubject] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Signing in...')
  const loadingTimerRef = useRef(null)
  const nav = useNavigate()

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current)
      }
    }
  }, [])

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setLoadingMessage('Signing in...')

    // After 3 seconds, show cold start message
    loadingTimerRef.current = setTimeout(() => {
      setLoadingMessage('Server is waking up, please wait... (first visit may take 30-60 seconds)')
    }, 3000)

    const res = await login(username.trim(), password)

    // Clear the timer since request completed
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current)
    }

    if (res.success) {
      const role = res.user.role
      nav(role === 'teacher' ? '/teacher' : '/student')
    } else {
      setError('Invalid username or password')
      setLoading(false)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Username is required')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }
    if (!className.trim()) {
      setError('Class name is required')
      return
    }
    if (subjects.length === 0) {
      setError('Please add at least one subject')
      return
    }

    setLoading(true)
    setLoadingMessage('Creating your class...')

    const res = await signup(username.trim(), password, className.trim(), subjects)

    if (res.success) {
      nav('/teacher')
    } else {
      setError(res.error || 'Signup failed. Please try again.')
      setLoading(false)
    }
  }

  function addSubject() {
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()])
      setNewSubject('')
    }
  }

  function removeSubject(subject) {
    setSubjects(subjects.filter(s => s !== subject))
  }

  return (
    <div className="login-page">
      <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle" title={darkMode ? 'Light Mode' : 'Dark Mode'}>
        {darkMode ? '☀️' : '🌙'}
      </button>
      <div className="login-card card" style={{ textAlign: 'center', maxWidth: mode === 'signup' ? '600px' : '450px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'var(--accent)',
          borderRadius: '16px',
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: 'white',
          boxShadow: '0 8px 16px var(--accent-soft)'
        }}>
          H
        </div>
        <h1 className="header" style={{ justifyContent: 'center', marginBottom: '8px' }}>
          <span style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>habbu</span>
        </h1>
        <p className="hint" style={{ marginBottom: '32px', fontSize: '1rem' }}>Teacher & Student portal</p>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--card-bg)', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={() => { setMode('signin'); setError('') }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '6px',
              background: mode === 'signin' ? 'var(--accent)' : 'transparent',
              color: mode === 'signin' ? 'white' : 'var(--text)',
              fontWeight: mode === 'signin' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError('') }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '6px',
              background: mode === 'signup' ? 'var(--accent)' : 'transparent',
              color: mode === 'signup' ? 'white' : 'var(--text)',
              fontWeight: mode === 'signup' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign Up
          </button>
        </div>

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '20px' }}>
              <label>Username</label>
              <input className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" disabled={loading} autoComplete="username" />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label>Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" disabled={loading} autoComplete="current-password" />
            </div>

            {error && <div className="error">{error}</div>}

            <button className="btn primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '12px', padding: '14px' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <span className="spinner"></span> {loadingMessage}
                </span>
              ) : 'Sign In to Dashboard'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '20px' }}>
              <label>Username</label>
              <input className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" disabled={loading} autoComplete="username" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label>Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a password" disabled={loading} autoComplete="new-password" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label>Class Name</label>
              <input className="input" value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g., Grade 10 A, Math 101" disabled={loading} />
              <p className="hint" style={{ marginTop: '4px', fontSize: '0.8rem' }}>This will be your class identifier</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label>Subjects</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  className="input"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="Add a subject"
                  disabled={loading}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                />
                <button type="button" onClick={addSubject} className="btn" disabled={loading} style={{ padding: '0 20px' }}>
                  Add
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {subjects.map(subject => (
                  <div key={subject} style={{
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem'
                  }}>
                    {subject}
                    <button
                      type="button"
                      onClick={() => removeSubject(subject)}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: '1.2rem',
                        lineHeight: 1
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {subjects.length === 0 && <p className="hint" style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--error)' }}>Please add at least one subject</p>}
            </div>

            {error && <div className="error">{error}</div>}

            <button className="btn primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '12px', padding: '14px' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <span className="spinner"></span> {loadingMessage}
                </span>
              ) : 'Create Class'}
            </button>
          </form>
        )}

        <p className="hint" style={{ marginTop: '24px', fontSize: '0.8rem' }}>
          By {mode === 'signin' ? 'signing in' : 'signing up'}, you agree to our terms of service.
        </p>
      </div>

      <style>{`
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
