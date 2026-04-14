#!/usr/bin/env node
/**
 * Test complete login flow and token validation
 */

const http = require('http')

const BASE_URL = 'http://localhost:5000'

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers })
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers })
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

function decodeJWT(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return payload
  } catch (e) {
    console.error('❌ Failed to decode JWT:', e.message)
    return null
  }
}

async function test() {
  console.log('🧪 Testing Login Flow\n')

  try {
    // Test login
    console.log('1️⃣ Testing login endpoint...')
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      username: 'students',
      password: 'test123'
    })

    console.log('Status:', loginRes.status)
    console.log('Response:', JSON.stringify(loginRes.data, null, 2))

    if (!loginRes.data.token) {
      console.error('❌ No token returned from login!')
      return
    }

    const token = loginRes.data.token
    console.log('✅ Token received\n')

    // Decode JWT
    console.log('2️⃣ Decoding JWT...')
    const decoded = decodeJWT(token)
    console.log('Decoded payload:', JSON.stringify(decoded, null, 2))

    if (!decoded.username) {
      console.error('❌ NO USERNAME IN TOKEN!')
      console.log('This is why validation fails!')
    } else {
      console.log('✅ Username field present:', decoded.username)
    }

    // Test API with token
    console.log('\n3️⃣ Testing marks API with token...')
    const marksRes = await makeRequest('GET', '/api/tests', null)
    // Add token to second request
    const url = new URL('/api/tests', BASE_URL)
    const options = {
      method: 'GET',
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }

    const marksData = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            resolve(data)
          }
        })
      })
      req.on('error', reject)
      req.end()
    })

    console.log('Marks response:', Array.isArray(marksData) ? `Array(${marksData.length})` : marksData)
    if (Array.isArray(marksData) && marksData.length > 0) {
      console.log('✅ Got', marksData.length, 'marks')
    } else {
      console.log('⚠️  Got 0 marks')
    }

    // Test token validation logic (same as frontend)
    console.log('\n4️⃣ Testing frontend validation logic...')
    console.log('Token:', token.substring(0, 20) + '...')
    
    const testDecoded = decodeJWT(token)
    if (testDecoded && testDecoded.username) {
      console.log('✅ Validation would PASS - username present')
    } else {
      console.log('❌ Validation would FAIL - username missing')
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }

  process.exit(0)
}

// Wait a moment for server to be ready, then test
setTimeout(test, 500)
