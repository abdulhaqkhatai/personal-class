require('dotenv').config()
const jwt = require('jsonwebtoken')
const fetch = require('node-fetch')

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'
const API_URL = 'http://localhost:3000'

async function testAPI() {
  // Create JWT tokens
  const teacherToken = jwt.sign(
    { id: '69d39e989bb00469fb35c035', username: 'teacher', role: 'teacher', classSlug: 'jiet' },
    JWT_SECRET,
    { expiresIn: '30d' }
  )

  const studentToken = jwt.sign(
    { id: '69d39eb89bb00469fb35c038', username: 'students', role: 'student', classSlug: 'jiet' },
    JWT_SECRET,
    { expiresIn: '30d' }
  )

  console.log('\n🧪 API ENDPOINT TEST\n')

  try {
    // Test 1: Student fetches their marks
    console.log('📋 Test 1: Student fetches marks')
    const studentRes = await fetch(`${API_URL}/api/tests`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    })

    const studentMarks = await studentRes.json()
    console.log(`Status: ${studentRes.status}`)
    console.log(`Marks received: ${Array.isArray(studentMarks) ? studentMarks.length : 'ERROR - not an array'}`)
    
    if (Array.isArray(studentMarks) && studentMarks.length > 0) {
      console.log('✅ SUCCESS: Student received marks')
      studentMarks.forEach((m, i) => {
        console.log(`  [${i + 1}] ${m.studentUsername}: ${JSON.stringify(m.marks)}`)
      })
    } else if (Array.isArray(studentMarks)) {
      console.log('⚠️ Student received empty array - no marks assigned yet')
    } else {
      console.log('❌ ERROR: Invalid response', studentMarks)
    }

    // Test 2: Teacher fetches all marks for their class
    console.log('\n📋 Test 2: Teacher fetches all class marks')
    const teacherRes = await fetch(`${API_URL}/api/tests`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${teacherToken}`,
        'Content-Type': 'application/json'
      }
    })

    const allMarks = await teacherRes.json()
    console.log(`Status: ${teacherRes.status}`)
    console.log(`Total marks in class: ${Array.isArray(allMarks) ? allMarks.length : 'ERROR'}`)

    if (Array.isArray(allMarks) && allMarks.length > 0) {
      console.log('✅ SUCCESS: Teacher sees all marks')
      allMarks.slice(0, 3).forEach((m, i) => {
        console.log(`  [${i + 1}] ${m.studentUsername}: ${JSON.stringify(m.marks)}`)
      })
      if (allMarks.length > 3) console.log(`  ... and ${allMarks.length - 3} more`)
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }

  process.exit(0)
}

// Start server first
console.log('⏳ Starting server...')
const { app, start } = require('./app')

start().then(() => {
  const PORT = process.env.PORT || 3000
  const server = app.listen(PORT, () => {
    console.log(`Server running on ${API_URL}`)
    setTimeout(testAPI, 1000)
  })
}).catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
