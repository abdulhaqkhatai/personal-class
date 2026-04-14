require('dotenv').config()
const { start } = require('./app')
const request = require('supertest')

async function testCompleteFlow() {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 COMPLETE FLOW TEST: LOGIN → GET MARKS')
  console.log('='.repeat(80))

  const app = await start()

  try {
    // Step 1: Login
    console.log('\n📍 Step 1: Login as student')
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'students',
        password: 'test123'
      })

    if (loginRes.status !== 200) {
      console.log('❌ Login failed:', loginRes.body)
      process.exit(1)
    }

    const token = loginRes.body.token
    console.log('✅ Login successful')
    console.log(`   Token: ${token.substring(0, 50)}...`)

    // Step 2: Get marks with token
    console.log('\n📍 Step 2: Get marks using JWT token')
    const marksRes = await request(app)
      .get('/api/tests')
      .set('Authorization', `Bearer ${token}`)

    console.log(`Status: ${marksRes.status}`)
    console.log(`Response type: ${Array.isArray(marksRes.body) ? 'Array' : typeof marksRes.body}`)
    
    if (Array.isArray(marksRes.body)) {
      console.log(`✅ Got ${marksRes.body.length} marks!`)
      marksRes.body.forEach((m, i) => {
        console.log(`   [${i+1}] ${JSON.stringify(m.marks)}`)
      })
      
      if (marksRes.body.length > 0) {
        console.log('\n✅ SUCCESS: API is working correctly!')
        console.log('   Marks are being returned properly')
      }
    } else {
      console.log('❌ Response is not an array:', marksRes.body)
    }

    // Step 3: Test diagnostic endpoint
    console.log('\n📍 Step 3: Test diagnostic endpoint')
    const diagRes = await request(app)
      .get('/api/tests/debug/student-marks')
      .set('Authorization', `Bearer ${token}`)

    if (diagRes.status === 200) {
      const diag = diagRes.body
      console.log('✅ Diagnostic endpoint works!')
      console.log(`   Total docs in class: ${diag.totalDocsInClass}`)
      console.log(`   Marks for student: ${diag.marksForThisStudent}`)
      console.log(`   Student usernames in DB: ${diag.allStudentNamesInDatabase.join(', ')}`)
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    process.exit(0)
  }
}

testCompleteFlow()
