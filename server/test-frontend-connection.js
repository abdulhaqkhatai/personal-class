#!/usr/bin/env node
/**
 * Test frontend API connectivity from Node (simulates browser request)
 * This helps debug if the frontend can reach the API
 */

const http = require('http')

async function testAPI() {
  console.log('🧪 Testing Frontend-Backend Communication\n')

  // Test direct connection to backend
  console.log('1️⃣ Testing direct API (http://localhost:5000/api/tests)')
  console.log('─'.repeat(60))

  try {
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/tests',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDM5ZTk5OWJiMDA0NjlmYjM1YzAzNyIsInVzZXJuYW1lIjoic3R1ZGVudHMiLCJyb2xlIjoic3R1ZGVudCIsImNsYXNzU2x1ZyI6ImppZXQiLCJjbGFzc05hbWUiOm51bGwsInN1YmplY3RzIjpbXSwiaWF0IjoxNzc2MTY0NDMzLCJleHAiOjE3Nzg3NTY0MzN9.A84jzgHyInuxeJ8owchISSC_6eTCFy6vixat_BAXxBc'
        }
      }

      const req = http.request(options, (res) => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) })
          } catch (e) {
            resolve({ status: res.statusCode, data })
          }
        })
      })

      req.on('error', reject)
      req.end()
    })

    console.log('Status:', response.status)
    if (response.status === 200) {
      console.log('✅ API responded successfully')
      if (Array.isArray(response.data)) {
        console.log('✅ Got Array(' + response.data.length + ') marks')
      }
    } else {
      console.error('❌ API returned error:', response.status)
    }
  } catch (err) {
    console.error('❌ Connection error:', err.message)
    console.error('   → Backend might not be running on localhost:5000')
  }

  console.log('\n2️⃣ Frontend Setup Check')
  console.log('─'.repeat(60))
  console.log('Required for localhost to work:')
  console.log('  ✅ .env.local has: VITE_API_URL=http://localhost:5000')
  console.log('  ✅ vite.config.js has proxy for /api to localhost:5000')
  console.log('  ✅ Frontend dev server running on http://localhost:5173')
  console.log('  ✅ Backend running on http://localhost:5000')

  console.log('\n3️⃣ Commands to Run')
  console.log('─'.repeat(60))
  console.log('Terminal 1 - Start Backend:')
  console.log('  cd server')
  console.log('  node server.js')
  console.log('')
  console.log('Terminal 2 - Start Frontend:')
  console.log('  cd client')
  console.log('  npm start')
  console.log('  (or: npm run dev)')

  console.log('\n4️⃣ Browser Testing')
  console.log('─'.repeat(60))
  console.log('Open: http://localhost:3000 or http://localhost:5173')
  console.log('Login: students / test123')
  console.log('Expected: Marks table with 5 entries')
  console.log('Console (F12): Should show no errors')
  console.log('Network (F12): Check /api/tests requests')

  process.exit(0)
}

testAPI()
