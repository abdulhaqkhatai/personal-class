import React, { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'
import '../styles.css'

export default function TeacherSettings({ onClose, onUpdated }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [className, setClassName] = useState('')
  const [subjects, setSubjects] = useState([])
  const [subjectInput, setSubjectInput] = useState('')
  const [students, setStudents] = useState([])
  
  // Add student state
  const [newStudent, setNewStudent] = useState({ username: '', password: '' })
  const [addingStudent, setAddingStudent] = useState(false)

  // Load teacher profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await apiFetch('/api/auth/teacher-profile')
        
        if (data?.error) {
          setError(data.error)
          return
        }

        setClassName(data.className || '')
        setSubjects(data.subjects || [])
        setStudents(data.students || [])
      } catch (err) {
        setError('Failed to load profile: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // Add subject
  const addSubject = () => {
    const trimmed = subjectInput.trim().toLowerCase()
    if (!trimmed) {
      setError('Subject cannot be empty')
      return
    }

    if (subjects.includes(trimmed)) {
      setError('Subject already added')
      return
    }

    setSubjects([...subjects, trimmed])
    setSubjectInput('')
    setError('')
  }

  // Remove subject
  const removeSubject = (subject) => {
    setSubjects(subjects.filter(s => s !== subject))
  }

  // Add student
  const handleAddStudent = async () => {
    try {
      const { username, password } = newStudent

      if (!username.trim() || !password.trim()) {
        setError('Username and password required')
        return
      }

      setAddingStudent(true)
      const data = await apiFetch('/api/auth/add-student', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      })

      if (data?.error) {
        setError(data.error)
        return
      }

      // Add to local list
      setStudents([...students, { username: data.username, id: data.id }])
      setNewStudent({ username: '', password: '' })
      setSuccess('Student added successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to add student: ' + err.message)
    } finally {
      setAddingStudent(false)
    }
  }

  // Remove student
  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student?')) return

    try {
      const data = await apiFetch(`/api/auth/remove-student/${studentId}`, { method: 'DELETE' })

      if (data?.error) {
        setError(data.error)
        return
      }

      setStudents(students.filter(s => s.id !== studentId))
      setSuccess('Student removed successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to remove student: ' + err.message)
    }
  }

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true)

      if (!className.trim()) {
        setError('Class name cannot be empty')
        return
      }

      const data = await apiFetch('/api/auth/teacher-profile', {
        method: 'PUT',
        body: JSON.stringify({ className: className.trim(), subjects })
      })

      if (data?.error) {
        setError(data.error)
        return
      }

      setSuccess('Profile updated successfully!')
      setTimeout(() => {
        setSuccess('')
        if (onUpdated) onUpdated()
      }, 1500)
    } catch (err) {
      setError('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2>Loading Profile...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Teacher Settings ⚙️</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        {error && <div style={{ padding: '10px', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '15px' }}>❌ {error}</div>}
        {success && <div style={{ padding: '10px', background: '#efe', color: '#060', borderRadius: '4px', marginBottom: '15px' }}>✅ {success}</div>}

        {/* Class Name */}
        <section style={{ marginBottom: '30px' }}>
          <h3>Class Information</h3>
          <div>
            <label>Class Name:</label>
            <input
              type="text"
              value={className}
              onChange={e => {
                setClassName(e.target.value)
                setError('')
              }}
              placeholder="e.g., Class 10-A"
              style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '10px' }}
            />
          </div>
        </section>

        {/* Subjects */}
        <section style={{ marginBottom: '30px' }}>
          <h3>Subjects</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input
              type="text"
              value={subjectInput}
              onChange={e => {
                setSubjectInput(e.target.value)
                setError('')
              }}
              onKeyPress={e => e.key === 'Enter' && addSubject()}
              placeholder="Enter subject name"
              style={{ flex: 1, padding: '8px' }}
            />
            <button onClick={addSubject} className="btn" style={{ minWidth: '100px' }}>
              Add Subject
            </button>
          </div>

          {subjects.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {subjects.map(subject => (
                <div
                  key={subject}
                  style={{
                    background: 'var(--muted-bg)',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{subject}</span>
                  <button
                    onClick={() => removeSubject(subject)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#c00',
                      cursor: 'pointer',
                      fontSize: '16px',
                      lineHeight: '1'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Students */}
        <section style={{ marginBottom: '30px' }}>
          <h3>Students ({students.length})</h3>

          {/* Add Student */}
          <div style={{ background: 'var(--muted-bg)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '10px' }}>Add New Student</label>
            <input
              type="text"
              value={newStudent.username}
              onChange={e => setNewStudent({ ...newStudent, username: e.target.value })}
              placeholder="Username"
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <input
              type="password"
              value={newStudent.password}
              onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
              onKeyPress={e => e.key === 'Enter' && handleAddStudent()}
              placeholder="Password"
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <button
              onClick={handleAddStudent}
              disabled={addingStudent}
              className="btn"
              style={{ width: '100%' }}
            >
              {addingStudent ? 'Adding...' : '+ Add Student'}
            </button>
          </div>

          {/* Student List */}
          {students.length > 0 ? (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              {students.map((student, idx) => (
                <div
                  key={student.id}
                  style={{
                    padding: '12px 15px',
                    borderBottom: idx < students.length - 1 ? '1px solid var(--border-color)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{student.username}</span>
                  <button
                    onClick={() => handleRemoveStudent(student.id)}
                    className="btn btn-danger"
                    style={{ background: '#fee', color: '#c00', border: '1px solid #fcc' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>No students yet</p>
          )}
        </section>

        {/* Save & Close */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn" style={{ background: 'var(--muted-bg)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn" style={{ background: '#06c' }}>
            {saving ? '💾 Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
