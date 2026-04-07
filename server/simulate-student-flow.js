require('dotenv').config()
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

async function simulateStudentFlow() {
  const { start } = require('./app')
  const request = require('supertest')

  console.log('\n🎬 SIMULATING COMPLETE STUDENT FLOW\n')

  // Start the app
  const app = await start()

  try {
    // Step 1: Generate student JWT (as if they just logged in)
    console.log('📍 Step 1: Student logs in')
    const studentToken = jwt.sign(
      { 
        id: '69d39e999bb00469fb35c037', 
        username: 'students', 
        role: 'student', 
        classSlug: 'jiet',
        className: null,
        subjects: []
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    )
    console.log('✅ JWT created for student: students')
    console.log(`   Token preview: ${studentToken.substring(0, 50)}...`)

    // Step 2: Call GET /api/tests as student
    console.log('\n📍 Step 2: Student loads their marks page')
    console.log('   Making: GET /api/tests')
    
    const res = await request(app)
      .get('/api/tests')
      .set('Authorization', `Bearer ${studentToken}`)
      .set('Content-Type', 'application/json')

    console.log(`   Response Status: ${res.status}`)
    console.log(`   Response Type: ${Array.isArray(res.body) ? 'Array' : typeof res.body}`)
    console.log(`   Response Length: ${Array.isArray(res.body) ? res.body.length : 'N/A'}`)

    if (res.status === 200 && Array.isArray(res.body)) {
      console.log('✅ SUCCESS: Student received marks data')
      res.body.forEach((test, i) => {
        console.log(`\n   [${i + 1}] Mark Record:`)
        console.log(`       _id: ${test._id}`)
        console.log(`       studentUsername: ${test.studentUsername}`)
        console.log(`       marks: ${JSON.stringify(test.marks)}`)
        console.log(`       date: ${test.date}`)
      })

      // Step 3: Verify what the frontend would receive
      console.log('\n📍 Step 3: Frontend receives and processes data')
      console.log('   Simulating React transformation:')
      
      const transformed = res.body.map(t => ({ ...t, id: t._id }))
      console.log(`   ✅ Added "id" field to ${transformed.length} records`)
      
      // Simulate entries calculation
      const entries = []
      transformed.forEach(t => {
        const id = t.id || t._id
        const date = t.date
        Object.entries(t.marks || {}).forEach(([sub, m]) => {
          const obtained = m?.obtained ?? m ?? 0
          const total = m?.total ?? (typeof m === 'number' ? 100 : 0)
          const d = new Date(date)
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          entries.push({ id, date, monthKey, subject: sub, obtained, total })
        })
      })
      
      console.log(`   ✅ Created ${entries.length} entry records (one per subject per test)`)
      entries.forEach((e, i) => {
        console.log(`      [${i + 1}] ${e.subject}: ${e.obtained}/${e.total} (${e.monthKey})`)
      })

      // Simulate grouping by month
      const grouped = entries.reduce((acc, e) => {
        acc[e.monthKey] = acc[e.monthKey] || []
        acc[e.monthKey].push(e)
        return acc
      }, {})

      const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
      console.log(`   ✅ Grouped into ${months.length} month(s):`)
      months.forEach(m => {
        console.log(`      - ${m}: ${grouped[m].length} entries`)
      })

      console.log('\n✅ COMPLETE FLOW SUCCESSFUL: Student will see marks on their page!')
    } else {
      console.log(`❌ FAILED: Unexpected response`)
      console.log('Response:', res.body)
    }

  } catch (err) {
    console.error('❌ Error during flow simulation:', err.message)
  } finally {
    process.exit(0)
  }
}

simulateStudentFlow()
