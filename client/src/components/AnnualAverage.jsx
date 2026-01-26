import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { weeklyAndMonthlyStats } from '../utils/stats'
import { apiFetch } from '../utils/api'
import { SUBJECTS } from '../utils/subjects'
import { getCurrentUser } from '../utils/auth'

export default function AnnualAverage({ darkMode, setDarkMode }) {
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedYear, setSelectedYear] = useState(null)
    const navigate = useNavigate()
    const user = getCurrentUser()

    useEffect(() => {
        let mounted = true
        apiFetch('/api/tests').then(data => {
            if (!mounted) return
            if (Array.isArray(data)) setTests(data.map(t => ({ ...t, id: t._id })))
            setLoading(false)
        }).catch(err => {
            console.error(err)
            setLoading(false)
        })
        return () => { mounted = false }
    }, [])

    const allTimeStats = useMemo(() => weeklyAndMonthlyStats(tests), [tests])
    const annual = allTimeStats.annual || []

    useEffect(() => {
        if (annual.length > 0 && !selectedYear) {
            setSelectedYear(annual[0].year)
        }
    }, [annual, selectedYear])

    const currentYearStats = useMemo(() => {
        return annual.find(a => a.year === selectedYear) || annual[0] || null
    }, [annual, selectedYear])

    const years = useMemo(() => annual.map(a => a.year), [annual])

    function goBack() {
        if (user?.role === 'teacher') navigate('/teacher')
        else navigate('/student')
    }

    return (
        <div className="page">
            <header className="header" style={{ marginBottom: 24 }}>
                <h1>Annual Performance</h1>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span>{user?.username}</span>
                    <button onClick={() => setDarkMode(!darkMode)} className="btn" title={darkMode ? 'Light Mode' : 'Dark Mode'}>
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    <button onClick={goBack} className="btn primary">Back to Dashboard</button>
                </div>
            </header>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Loading stats...</p>
                </div>
            ) : annual.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <h3>No stats available yet.</h3>
                    <p className="hint">Start adding marks to see your annual performance.</p>
                    <button onClick={goBack} className="btn primary" style={{ marginTop: 16 }}>Back</button>
                </div>
            ) : (
                <>
                    <section className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ margin: 0 }}>Yearly Overview</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button
                                    onClick={() => {
                                        const idx = years.indexOf(selectedYear)
                                        if (idx < years.length - 1) setSelectedYear(years[idx + 1])
                                    }}
                                    className="btn"
                                    disabled={years.indexOf(selectedYear) >= years.length - 1}
                                >
                                    &lt; Previous Year
                                </button>
                                <strong style={{ fontSize: '1.2rem', minWidth: 100, textAlign: 'center' }}>{selectedYear}</strong>
                                <button
                                    onClick={() => {
                                        const idx = years.indexOf(selectedYear)
                                        if (idx > 0) setSelectedYear(years[idx - 1])
                                    }}
                                    className="btn"
                                    disabled={years.indexOf(selectedYear) <= 0}
                                >
                                    Next Year &gt;
                                </button>
                            </div>
                        </div>

                        <div className="stat-grid">
                            {SUBJECTS.map(s => {
                                const score = currentYearStats?.stats.perSubject?.[s.key]
                                return (
                                    <div key={s.key} className="stat-card">
                                        <div className="stat-label">{s.label}</div>
                                        <div className="stat-value" style={{ opacity: score != null ? 1 : 0.3 }}>
                                            {score != null ? `${score}%` : '—'}
                                        </div>
                                    </div>
                                )
                            })}
                            <div className="stat-card" style={{
                                background: 'var(--accent-soft)',
                                borderColor: 'var(--accent)',
                                gridColumn: '1 / -1',
                                marginTop: '16px'
                            }}>
                                <div className="stat-label" style={{ color: 'var(--accent)', fontSize: '1rem' }}>Overall Year Average</div>
                                <div className="stat-value" style={{ fontSize: '3.5rem', textShadow: '0 4px 12px var(--accent-soft)' }}>
                                    {currentYearStats?.stats.overall != null ? `${currentYearStats.stats.overall}%` : '—'}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="card">
                        <h2>Detailed Insights</h2>
                        <p className="hint">Coming soon: Trends, comparative analysis, and progress tracking over the year.</p>
                        <div style={{
                            height: '200px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.02)',
                            borderRadius: '8px',
                            marginTop: 16
                        }}>
                            <span className="hint">Chart visualization placeholder</span>
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}
