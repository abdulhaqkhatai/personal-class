import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { weeklyAndMonthlyStats } from '../utils/stats'
import { apiFetch } from '../utils/api'
import { SUBJECTS } from '../utils/subjects'
import { getCurrentUser } from '../utils/auth'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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

    // Calculate monthly progression data for the selected year
    const monthlyChartData = useMemo(() => {
        if (!selectedYear || !tests.length) return []

        // Filter tests for selected year and group by month
        const yearTests = tests.filter(t => {
            const d = new Date(t.date)
            return String(d.getFullYear()) === String(selectedYear)
        })

        if (yearTests.length === 0) return []

        // Group by month
        const byMonth = {}
        yearTests.forEach(t => {
            const d = new Date(t.date)
            const monthKey = d.getMonth() // 0-11
            if (!byMonth[monthKey]) byMonth[monthKey] = []
            byMonth[monthKey].push(t)
        })

        // Calculate averages for each month
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const chartData = []

        Object.keys(byMonth).sort((a, b) => Number(a) - Number(b)).forEach(monthKey => {
            const monthTests = byMonth[monthKey]
            const dataPoint = { month: monthNames[monthKey] }

            // Calculate average for each subject
            SUBJECTS.forEach(subject => {
                const subjectTests = monthTests.filter(t => t.marks && t.marks[subject.key])
                if (subjectTests.length > 0) {
                    const scores = subjectTests.map(t => {
                        const m = t.marks[subject.key]
                        const obtained = m?.obtained ?? m ?? 0
                        const total = m?.total ?? (typeof m === 'number' ? 100 : 0)
                        return total > 0 ? (obtained / total) * 100 : 0
                    })
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
                    dataPoint[subject.key] = Math.round(avg * 10) / 10
                }
            })

            chartData.push(dataPoint)
        })

        return chartData
    }, [tests, selectedYear])

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
                        <h2>Monthly Performance Progression</h2>
                        {monthlyChartData.length === 0 ? (
                            <p className="hint">No monthly data available for {selectedYear}. Add marks across different months to see the progression.</p>
                        ) : (
                            <div style={{ width: '100%', height: 400, marginTop: 20 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis
                                            dataKey="month"
                                            stroke="var(--text)"
                                            style={{ fontSize: '0.875rem' }}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            stroke="var(--text)"
                                            style={{ fontSize: '0.875rem' }}
                                            label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { fill: 'var(--text)' } }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'var(--card-bg)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                color: 'var(--text)'
                                            }}
                                            formatter={(value) => `${value}%`}
                                        />
                                        <Legend
                                            wrapperStyle={{ fontSize: '0.875rem', color: 'var(--text)' }}
                                        />
                                        {SUBJECTS.map((subject, index) => {
                                            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
                                            return (
                                                <Line
                                                    key={subject.key}
                                                    type="monotone"
                                                    dataKey={subject.key}
                                                    name={subject.label}
                                                    stroke={colors[index % colors.length]}
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            )
                                        })}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    )
}
