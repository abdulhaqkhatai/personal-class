require('dotenv').config()

const { start } = require('./app')
const JWT_SECRET = process.env.JWT_SECRET || 'change-me'
const jwt = require('jsonwebtoken')

let server

async function runTest() {
  const studentToken = jwt.sign(
    { id: '69d39eb89bb00469fb35c038', username: 'students', role: 'student', classSlug: 'jiet' },
    JWT_SECRET,
    { expiresIn: '30d' }
  )

  console.log('\n🕸️  SIMULATING API REQUESTS\n')
  console.log('Student: students')
  console.log('ClassSlug: jiet')
  console.log(`Token: ${studentToken.substring(0, 50)}...`)

  // Use Express test client
  const request = require('supertest')

  const app = await start()
  server = app

  try {
    console.log('\n📨 GET /api/tests (as student)\n')
    
    const res = await request(app)
      .get('/api/tests')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect('Content-Type', /json/)

    console.log(`Status: ${res.status}`)
    console.log(`Response type: ${Array.isArray(res.body) ? 'Array' : typeof res.body}`)
    console.log(`Length: ${Array.isArray(res.body) ? res.body.length : 'N/A'}`)

    if (Array.isArray(res.body)) {
      console.log(`✅ Got ${res.body.length} mark(s):`)
      res.body.forEach((m, i) => {
        console.log(`  [${i + 1}] Student: ${m.studentUsername}`)
        console.log(`      Marks: ${JSON.stringify(m.marks)}`)
        console.log(`      Date: ${m.date}`)
      })
    } else {
      console.log('Response:', res.body)
    }

  } catch (err) {
    console.error('❌ Request failed:', err.message)
  } finally {
    if (server) server.close()
    process.exit(0)
  }
}

const PORT = process.env.PORT || 3000
start().then(app => {
  console.log(`Server initialized on ${PORT}`)
  setTimeout(runTest, 500)
}).catch(err => {
  console.error('Failed to start:', err)
  process.exit(1)
})
