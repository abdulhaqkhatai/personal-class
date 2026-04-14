#!/usr/bin/env node
/**
 * Create a new teacher and students for a new class
 */

const http = require('http')

const BASE_URL = 'http://localhost:5000'

async function request(method, path, body = null) {
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
          resolve({ status: res.statusCode, data: JSON.parse(data) })
        } catch (e) {
          resolve({ status: res.statusCode, data })
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function test() {
  console.log('🧪 Creating New Class with Teacher and Students\n')

  try {
    // Create new teacher with a new class
    console.log('1️⃣ Creating new teacher (class2_teacher) for class "class2"')
    const teacherSignup = await request('POST', '/api/auth/signup', {
      username: 'class2_teacher',
      password: 'test123',
      className: 'Class 2',
      subjects: ['english', 'science'],
      students: [
        { username: 'student_2a', password: 'test123' },
        { username: 'student_2b', password: 'test123' },
        { username: 'student_2c', password: 'test123' }
      ]
    })

    console.log('Status:', teacherSignup.status)
    if (teacherSignup.status !== 201 && teacherSignup.status !== 200) {
      console.error('❌ Teacher signup failed:', teacherSignup.data)
      process.exit(1)
    }

    console.log('✅ Teacher created:', teacherSignup.data.user?.username)
    console.log('   Class:', teacherSignup.data.user?.className, `(${teacherSignup.data.user?.classSlug})`)
    console.log('   Subjects:', teacherSignup.data.user?.subjects)

    // Verify students were created
    console.log('\n2️⃣ Checking created students...')
    const students = ['student_2a', 'student_2b', 'student_2c']
    
    for (const studentName of students) {
      // Try to login with password 'test123'
      const loginRes = await request('POST', '/api/auth/login', {
        username: studentName,
        password: 'test123'
      })

      if (loginRes.status === 200) {
        console.log(`✅ ${studentName} exists and can log in`)
        console.log(`   Class: ${loginRes.data.user?.classSlug}`)
      } else {
        console.warn(`⚠️ ${studentName} login failed:`, loginRes.data?.error)
      }
    }

    console.log('\n═'.repeat(60))
    console.log('✅ NEW CLASS SETUP COMPLETE')
    console.log('═'.repeat(60))
    console.log('\nNew Class Details:')
    console.log('  Teacher: class2_teacher / test123')
    console.log('  Class: class2 (Class 2)')
    console.log('  Students: student_2a, student_2b, student_2c (password: test123)')
    console.log('  Subjects: english, science')

  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }

  process.exit(0)
}

setTimeout(test, 500)
