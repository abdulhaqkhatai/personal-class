import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../utils/auth'

export default function Signup({ darkMode, setDarkMode }) {
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Step 1 data
  const [className, setClassName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Step 2 data
  const [subjects, setSubjects] = useState([])
  const [subjectInput, setSubjectInput] = useState('')

  // Step 3 data
  const [students, setStudents] = useState([])
  const [stuUsername, setStuUsername] = useState('')
  const [stuPassword, setStuPassword] = useState('')

  function addSubject() {
    const name = subjectInput.trim()
    if (!name) return
    if (subjects.includes(name)) { setError('Subject already added'); return }
    setSubjects([...subjects, name])
    setSubjectInput('')
    setError('')
  }

  function removeSubject(s) {
    setSubjects(subjects.filter(x => x !== s))
  }

  function addStudent() {
    const uname = stuUsername.trim()
    const pass = stuPassword.trim()
    if (!uname || !pass) { setError('Both student username and password are required'); return }
    if (students.find(s => s.username === uname)) { setError('Student username already added'); return }
    setStudents([...students, { username: uname, password: pass }])
    setStuUsername('')
    setStuPassword('')
    setError('')
  }

  function removeStudent(uname) {
    setStudents(students.filter(s => s.username !== uname))
  }

  function goNext() {
    setError('')
    if (step === 1) {
      if (!className.trim() || !username.trim() || !password.trim()) {
        setError('All fields are required')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (subjects.length === 0) { setError('Please add at least one subject'); return }
      setStep(3)
    }
  }

  async function handleSubmit() {
    if (students.length === 0) { setError('Please add at least one student'); return }
    setLoading(true)
    setError('')
    const res = await signup({ className: className.trim(), username: username.trim(), password: password.trim(), subjects, students })
    setLoading(false)
    if (res.success) {
      nav('/teacher')
    } else {
      setError(res.error || 'Signup failed. Please try again.')
    }
  }

  const stepLabels = ['Class Info', 'Subjects', 'Students']

  return (
    <div className="login-page">
      <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle" title={darkMode ? 'Light Mode' : 'Dark Mode'}>
        {darkMode ? '☀️' : '🌙'}
      </button>

      <div className="login-card card" style={{ maxWidth: '520px', width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '56px', height: '56px', background: 'var(--accent)', borderRadius: '14px',
            margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', color: 'white', boxShadow: '0 6px 16px var(--accent-soft)'
          }}>P</div>
          <h1 style={{
            fontSize: '2rem', fontWeight: 800, margin: 0,
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>pocket class</h1>
          <p className="hint" style={{ marginTop: '6px', fontSize: '0.9rem' }}>Create your class account</p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
          {stepLabels.map((label, i) => {
            const n = i + 1
            const active = step === n
            const done = step > n
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: done ? '#22c55e' : active ? 'var(--accent)' : 'var(--border)',
                  color: (active || done) ? 'white' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.3s'
                }}>
                  {done ? '✓' : n}
                </div>
                <span style={{ fontSize: '0.8rem', color: active ? 'var(--accent)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}>
                  {label}
                </span>
                {i < 2 && <div style={{ width: '24px', height: '2px', background: done ? '#22c55e' : 'var(--border)', borderRadius: '2px' }} />}
              </div>
            )
          })}
        </div>

        {/* STEP 1: Class & Account Info */}
        {step === 1 && (
          <div>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem' }}>Class & Account Info</h2>
            <div style={{ marginBottom: '16px' }}>
              <label>Class Name</label>
              <input className="input" value={className} onChange={e => setClassName(e.target.value)}
                placeholder="e.g. Al-Hassan Academy" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label>Your Username (Teacher)</label>
              <input className="input" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="e.g. teacher_ali" autoComplete="username" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label>Your Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Choose a strong password" autoComplete="new-password" />
            </div>
          </div>
        )}

        {/* STEP 2: Add Subjects */}
        {step === 2 && (
          <div>
            <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.1rem' }}>Add Subjects</h2>
            <p className="hint" style={{ marginBottom: '16px', fontSize: '0.85rem' }}>Type a subject name and press Add</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input className="input" style={{ flex: 1 }} value={subjectInput}
                onChange={e => setSubjectInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSubject()}
                placeholder="e.g. Mathematics" />
              <button className="btn primary" onClick={addSubject} style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                + Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '36px' }}>
              {subjects.map(s => (
                <span key={s} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'var(--accent-soft)', color: 'var(--accent)',
                  borderRadius: '20px', padding: '4px 12px', fontSize: '0.85rem', fontWeight: 500
                }}>
                  {s}
                  <button onClick={() => removeSubject(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 700, padding: '0 2px', lineHeight: 1, fontSize: '1rem' }}>×</button>
                </span>
              ))}
              {subjects.length === 0 && <p className="hint" style={{ fontSize: '0.8rem', margin: 0 }}>No subjects added yet</p>}
            </div>
          </div>
        )}

        {/* STEP 3: Add Students */}
        {step === 3 && (
          <div>
            <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.1rem' }}>Add Students</h2>
            <p className="hint" style={{ marginBottom: '16px', fontSize: '0.85rem' }}>Create login credentials for each student</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '16px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Student Username</label>
                <input className="input" value={stuUsername} onChange={e => setStuUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addStudent()}
                  placeholder="e.g. ali_student" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem' }}>Password</label>
                <input className="input" value={stuPassword} onChange={e => setStuPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addStudent()}
                  placeholder="Password" />
              </div>
              <button className="btn primary" onClick={addStudent} style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                + Add
              </button>
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {students.length === 0 && <p className="hint" style={{ fontSize: '0.8rem' }}>No students added yet</p>}
              {students.map(s => (
                <div key={s.username} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '8px', marginBottom: '6px',
                  background: 'var(--bg-alt, rgba(0,0,0,0.04))', border: '1px solid var(--border)'
                }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>👤 {s.username}</span>
                  <button onClick={() => removeStudent(s.username)} className="btn"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--error)' }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && <div className="error" style={{ marginTop: '12px' }}>{error}</div>}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          {step > 1 && (
            <button className="btn" onClick={() => { setStep(step - 1); setError('') }} style={{ flex: 1, padding: '12px' }} disabled={loading}>
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button className="btn primary" onClick={goNext} style={{ flex: 2, padding: '12px' }}>
              Next →
            </button>
          ) : (
            <button className="btn primary" onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: '12px' }}>
              {loading ? 'Creating class...' : '🚀 Create Class'}
            </button>
          )}
        </div>

        <p className="hint" style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}
