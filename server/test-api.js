require('dotenv').config()
const jwt = require('jsonwebtoken')

// Simulate a student getting marks
async function test() {
  const JWT_SECRET = process.env.JWT_SECRET || 'change-me'
  
  // Get the server
  const { start } = require('./app')
  const app = await start()
  
  // Create a mock student request
  const studentJWT = jwt.sign(
    { id: '6789', username: 'students', role: 'student', classSlug: 'jiet' },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
  
  console.log('\n🧪 Testing GET /api/tests for student\n')
  console.log('Student JWT:', studentJWT.substring(0, 50) + '...')
  console.log('Student username: students')
  console.log('Student classSlug: jiet')
  
  // Test GET endpoint
  const res = await fetch('http://localhost:3000/api/tests', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${studentJWT}`,
      'Content-Type': 'application/json'
    }
  }).catch(err => {
    console.error('Request failed:', err.message)
    process.exit(1)
  })
  
  const data = await res.json()
  console.log('\n✅ Response status:', res.status)
  console.log('✅ Response data:', JSON.stringify(data, null, 2))
  
  if (Array.isArray(data)) {
    console.log(`\n✅ SUCCESS: Student received ${data.length} test(s)`)
    if (data.length > 0) {
      console.log('First test:', JSON.stringify(data[0], null, 2))
    }
  } else {
    console.log('\n❌ ERROR: Response is not an array')
    console.log('Response:', data)
  }
  
  process.exit(0)
}

// Run the server first
const PORT = process.env.PORT || 3000
const { app, start } = require('./app')

start().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on :${PORT}`)
    
    // Wait a moment then test
    setTimeout(test, 500)
  })
}).catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
