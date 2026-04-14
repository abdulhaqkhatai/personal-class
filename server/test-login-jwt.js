require('dotenv').config()
const { start } = require('./app')
const request = require('supertest')
const mongoose = require('mongoose')

async function testLoginJWT() {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 TESTING LOGIN ENDPOINT AND JWT CREATION')
  console.log('='.repeat(80))

  const app = await start()

  try {
    // Test 1: Login as student
    console.log('\n📍 Test 1: Login as student')
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'students',
        password: 'test123' // Set by reset-password.js
      })

    console.log(`Status: ${loginRes.status}`)
    
    if (loginRes.status === 200 || loginRes.status === 401) {
      // Even if login fails, we can see the issue
      console.log('\nResponse:', JSON.stringify(loginRes.body, null, 2))
      
      if (loginRes.body.token) {
        const token = loginRes.body.token
        console.log('\n✅ Token generated:', token.substring(0, 50) + '...')
        
        // Decode the JWT to see what's in it
        const jwt = require('jsonwebtoken')
        const JWT_SECRET = process.env.JWT_SECRET || 'change-me'
        
        try {
          const decoded = jwt.verify(token, JWT_SECRET)
          console.log('\n✅ JWT Decoded:')
          console.log(JSON.stringify(decoded, null, 2))
          
          if (!decoded.username) {
            console.log('\n❌ PROBLEM: JWT is missing "username" field!')
            console.log('   This is why marks aren\'t filtering correctly')
          } else {
            console.log('\n✅ Good: JWT contains username:', decoded.username)
          }
        } catch (err) {
          console.log('❌ Failed to decode JWT:', err.message)
        }
      }
    }

    // Test 2: Check student in database
    console.log('\n\n📍 Test 2: Checking student in database')
    const User = require('./models/User')
    const student = await User.findOne({ username: 'students' })
    
    if (student) {
      console.log('✅ Student found:')
      console.log(`   Username: ${student.username}`)
      console.log(`   ID: ${student._id}`)
      console.log(`   ClassSlug: ${student.classSlug}`)
    } else {
      console.log('❌ Student not found in database')
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    process.exit(0)
  }
}

testLoginJWT()
