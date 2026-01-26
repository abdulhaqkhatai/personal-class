import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { weeklyAndMonthlyStats } from '../utils/stats'
import { logout, getCurrentUser } from '../utils/auth'
import { apiFetch } from '../utils/api'
import { SUBJECTS } from '../utils/subjects'

export default function StudentView({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    // Delay loading slightly to not compete with login
    const timer = setTimeout(() => {
      apiFetch('/api/tests').then(data => {
        if (!mounted) return
        if (Array.isArray(data)) setTests(data.map(t => ({ ...t, id: t._id })))
        setLoading(false)
      }).catch(err => {
        console.error(err)
        setLoading(false)
      })
    }, 100) // Reduced from 500ms

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [])

  function doLogout() {
    logout()
    window.location.href = '/login'
  }

  // prepare month-grouped entries once - optimize with better memoization
  const entries = React.useMemo(() => {
    if (!tests.length) return []
    const arr = []
    tests.forEach(t => {
      const id = t.id || t._id
      const date = t.date
      Object.entries(t.marks || {}).forEach(([sub, m]) => {
        const obtained = m?.obtained ?? m ?? 0
        const total = m?.total ?? (typeof m === 'number' ? 100 : 0)
        const d = new Date(date)
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        arr.push({ id, date, monthKey, subject: sub, obtained, total })
      })
    })
    return arr
  }, [tests.length]) // Only depend on tests length, not full tests array

  const grouped = React.useMemo(() => {
    if (!entries.length) return {}
    return entries.reduce((acc, e) => {
      acc[e.monthKey] = acc[e.monthKey] || []
      acc[e.monthKey].push(e)
      return acc
    }, {})
  }, [entries.length]) // Only depend on entries length

  const months = React.useMemo(() => Object.keys(grouped).sort((a, b) => b.localeCompare(a)), [grouped])

  useEffect(() => {
    if (months.length && !selectedMonth) setSelectedMonth(months[0])
  }, [months])

  const filteredTests = React.useMemo(() => {
    if (!selectedMonth) return []
    return tests.filter(t => {
      const d = new Date(t.date)
      const monKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return monKey === selectedMonth
    })
  }, [tests, selectedMonth])

  const stats = weeklyAndMonthlyStats(filteredTests)
  // allTimeStats: calculate overall stats across ALL tests (all months)
  const allTimeStats = React.useMemo(() => weeklyAndMonthlyStats(tests), [tests])

  // Annual selection
  const [selectedYear, setSelectedYear] = useState(null)

  // Update annual helper when allTimeStats changes
  useEffect(() => {
    if (allTimeStats.annual && allTimeStats.annual.length > 0 && !selectedYear) {
      setSelectedYear(allTimeStats.annual[0].year)
    }
  }, [allTimeStats, selectedYear])

  const weeklyStats = stats.weekly || []
  const cumulativeWeekly = React.useMemo(() => {
    if (!weeklyStats || weeklyStats.length === 0) return []
    const parseWeekIndex = (wk) => {
      const m = wk.match(/-w(\d+)$/)
      if (m) return Number(m[1])
      const d = new Date(wk)
      return d.getTime()
    }
    const sorted = [...weeklyStats].sort((a, b) => parseWeekIndex(a.week) - parseWeekIndex(b.week))
    const cum = []
    const subjAcc = {}
    let overallSum = 0, overallCount = 0
    sorted.forEach(s => {
      Object.entries(s.stats.perSubject || {}).forEach(([k, v]) => {
        subjAcc[k] = subjAcc[k] || { sum: 0, count: 0 }
        subjAcc[k].sum += v
        subjAcc[k].count += 1
      })
      if (typeof s.stats.overall === 'number') {
        overallSum += s.stats.overall
        overallCount += 1
      }
      const perSubjectCum = {}
      Object.entries(subjAcc).forEach(([k, v]) => { perSubjectCum[k] = +(v.sum / v.count).toFixed(2) })
      const overallCum = overallCount > 0 ? +(overallSum / overallCount).toFixed(2) : null
      cum.push({ week: s.week, stats: { perSubject: perSubjectCum, overall: overallCum } })
    })
    return cum
  }, [weeklyStats])

  function formatWeekLabel(wk) {
    // Always return Week N. Prefer explicit t.week when available in filteredTests.
    try {
      for (const t of filteredTests) {
        const d = new Date(t.date)
        if (t.week && Number.isInteger(Number(t.week))) {
          const testWeekKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-w${t.week}`
          if (String(testWeekKey) === String(wk)) return `Week ${t.week}`
        }
      }
    } catch (e) {/* ignore */ }

    const m = String(wk).match(/-w(\d+)$/)
    if (m) return `Week ${m[1]}`
    const d = new Date(wk)
    if (!Number.isNaN(d.getTime())) {
      const day = d.getDate()
      const weekOfMonth = Math.floor((day - 1) / 7) + 1
      return `Week ${weekOfMonth}`
    }
    return String(wk)
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Student Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontWeight: 500, color: 'var(--muted)' }}>{getCurrentUser()?.username}</span>
          <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle" title={darkMode ? 'Light Mode' : 'Dark Mode'} style={{ position: 'static' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={doLogout} className="btn">Logout</button>
        </div>
      </header>

      <section className="card">
        <h2>Your Marks History</h2>
        {loading ? <p className="hint">Loading marks...</p> : tests.length === 0 && <p className="hint">No marks available yet.</p>}
        {(() => {
          if (!months.length) return null

          function toReadable(mKey) { try { const d = new Date(mKey + '-01'); return d.toLocaleString(undefined, { month: 'long', year: 'numeric' }) } catch (e) { return mKey } }

          function prev() {
            const idx = months.indexOf(selectedMonth)
            if (idx < months.length - 1) setSelectedMonth(months[idx + 1])
          }

          function next() {
            const idx = months.indexOf(selectedMonth)
            if (idx > 0) setSelectedMonth(months[idx - 1])
          }

          const rows = grouped[selectedMonth] || []

          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
                <button onClick={prev} className="btn" disabled={!selectedMonth || selectedMonth === months[months.length - 1]}>&larr; Prev</button>
                <strong style={{ fontSize: '1.1rem', minWidth: '180px', textAlign: 'center' }}>{toReadable(selectedMonth || months[0])}</strong>
                <button onClick={next} className="btn" disabled={!selectedMonth || selectedMonth === months[0]}>Next &rarr;</button>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Subject</th><th>Obtained</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <tr key={row.id + '_' + row.subject + '_' + row.date}>
                        <td style={{ color: 'var(--muted)' }}>{new Date(row.date).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 500 }}>{row.subject}</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{row.obtained}</td>
                        <td>{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        <section className="card">
          <h2>Weekly Performance</h2>
          {(!weeklyStats || weeklyStats.length === 0) ? <p className="hint">No weekly data available.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {weeklyStats.map(w => (
                <div key={w.week} className="statRow">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>{formatWeekLabel(w.week)}</strong>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{w.stats.overall != null ? `${w.stats.overall}%` : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem' }}>
                    {SUBJECTS.map(s => (
                      <span key={s.key} style={{ color: 'var(--muted)' }}>
                        {s.label}: <span style={{ color: 'var(--text)' }}>{w.stats.perSubject?.[s.key] != null ? `${w.stats.perSubject[s.key]}%` : '—'}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>Progress Tracking</h2>
          {(!cumulativeWeekly || cumulativeWeekly.length === 0) ? <p className="hint">No data.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cumulativeWeekly.map(cw => (
                <div key={cw.week} className="statRow" style={{ borderLeft: '4px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>Through {formatWeekLabel(cw.week)}</strong>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{cw.stats.overall != null ? `${cw.stats.overall}%` : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem' }}>
                    {SUBJECTS.map(s => (
                      <span key={s.key} style={{ color: 'var(--muted)' }}>
                        {s.label}: <span style={{ color: 'var(--text)' }}>{cw.stats.perSubject?.[s.key] != null ? `${cw.stats.perSubject[s.key]}%` : '—'}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card">
        <h2
          onClick={() => navigate('/annual-average')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span>Annual Review <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 'normal' }}> (Year: {selectedYear}) </span></span>
          <span style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600 }}>In-depth Stats &rarr;</span>
        </h2>
        {(() => {
          const annual = allTimeStats.annual || []
          if (!annual.length) return <p className="hint">No annual data yet.</p>

          const years = annual.map(a => a.year)
          const currentYearStats = annual.find(a => a.year === selectedYear) || annual[0]

          function prevYear() {
            const idx = years.indexOf(selectedYear)
            if (idx < years.length - 1) setSelectedYear(years[idx + 1])
          }

          function nextYear() {
            const idx = years.indexOf(selectedYear)
            if (idx > 0) setSelectedYear(years[idx - 1])
          }

          if (!currentYearStats) return null

          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
                <button onClick={prevYear} className="btn" disabled={years.indexOf(selectedYear) >= years.length - 1}>&larr;</button>
                <strong style={{ fontSize: '1.2rem', minWidth: '100px', textAlign: 'center' }}>{currentYearStats.year}</strong>
                <button onClick={nextYear} className="btn" disabled={years.indexOf(selectedYear) <= 0}>&rarr;</button>
              </div>
              <div className="stat-grid">
                {SUBJECTS.map(s => (
                  <div key={s.key} className="stat-card">
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value">{currentYearStats.stats.perSubject?.[s.key] != null ? `${currentYearStats.stats.perSubject[s.key]}%` : '—'}</div>
                  </div>
                ))}
                <div className="stat-card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}>
                  <div className="stat-label" style={{ color: 'var(--accent)' }}>Yearly Average</div>
                  <div className="stat-value" style={{ color: 'var(--accent)' }}>{currentYearStats.stats.overall != null ? `${currentYearStats.stats.overall}%` : '—'}</div>
                </div>
              </div>
            </div>
          )
        })()}
      </section>

      <section className="card">
        <h2>Overall Academic Summary</h2>
        {(!allTimeStats.overall) ? <p className="hint">No overall data recorded.</p> : (
          <div className="stat-grid">
            {SUBJECTS.map(s => (
              <div key={s.key} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{allTimeStats.overall.perSubject?.[s.key] != null ? `${allTimeStats.overall.perSubject[s.key]}%` : '—'}</div>
              </div>
            ))}
            <div className="stat-card" style={{ background: 'var(--text)', color: 'var(--bg)' }}>
              <div className="stat-label" style={{ color: 'var(--muted)' }}>Cumulative Overall</div>
              <div className="stat-value" style={{ color: 'inherit' }}>{allTimeStats.overall.overall != null ? `${allTimeStats.overall.overall}%` : '—'}</div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
