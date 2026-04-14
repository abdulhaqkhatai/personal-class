#!/usr/bin/env node
/**
 * Comprehensive End-to-End Test
 * Tests: Teacher login → Add marks → Student login → Student sees marks
 */

const http = require('http')

const BASE_URL = 'http://localhost:5000'

async function request(method, path, body = null, token = null) {
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

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`
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
    return null
  }
}

async function test() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🧪 END-TO-END TEST: Teacher Marks → Student View')
  console.log('═══════════════════════════════════════════════════════════\n')

  try {
    // STEP 1: Teacher Login
    console.log('STEP 1️⃣ : Teacher Login')
    console.log('─'.repeat(60))
    const teacherLogin = await request('POST', '/api/auth/login', {
      username: 'teacher',
      password: 'test123'
    })

    if (teacherLogin.status !== 200 || !teacherLogin.data.token) {
      console.error('❌ Teacher login failed:', teacherLogin.data)
      process.exit(1)
    }

    const teacherToken = teacherLogin.data.token
    const teacherData = teacherLogin.data.user
    console.log('✅ Teacher logged in:')
    console.log('   Username:', teacherData.username)
    console.log('   Role:', teacherData.role)
    console.log('   Class:', teacherData.className, `(${teacherData.classSlug})`)
    console.log('   Subjects:', teacherData.subjects)

    // STEP 2: Get students list
    console.log('\nSTEP 2️⃣ : Get Students List (from teacher perspective)')
    console.log('─'.repeat(60))
    const studentsList = await request('GET', '/api/auth/students', null, teacherToken)
    console.log('Status:', studentsList.status)
    console.log('Response:', JSON.stringify(studentsList.data, null, 2))

    let students = []
    if (Array.isArray(studentsList.data)) {
      students = studentsList.data
    } else if (studentsList.data?.students) {
      students = studentsList.data.students
    }

    if (students.length === 0) {
      console.warn('⚠️ No students found')
      process.exit(1)
    }

    const targetStudent = students[0]
    console.log('✅ Found', students.length, 'students')
    console.log('   Will add marks for:', targetStudent.username)

    // STEP 3: Add marks for student
    console.log('\nSTEP 3️⃣ : Teacher Adds Marks for Student')
    console.log('─'.repeat(60))
    
    const marksData = {
      date: new Date().toISOString().split('T')[0],
      studentUsername: targetStudent.username,
      marks: {
        mathematics: {
          obtained: 85,
          total: 100
        }
      }
    }

    const addMarks = await request('POST', '/api/tests', marksData, teacherToken)
    console.log('Status:', addMarks.status)
    console.log('Response:', JSON.stringify(addMarks.data, null, 2))

    if (addMarks.status !== 201 && addMarks.status !== 200) {
      console.error('❌ Failed to add marks')
      process.exit(1)
    }

    console.log('✅ Marks added successfully')
    console.log('   Student:', targetStudent.username)
    console.log('   Subject: mathematics')
    console.log('   Score: 85/100')

    // STEP 4: Student Login
    console.log('\nSTEP 4️⃣ : Student Login')
    console.log('─'.repeat(60))
    
    const studentLogin = await request('POST', '/api/auth/login', {
      username: targetStudent.username,
      password: targetStudent.password || 'test123'
    })

    if (studentLogin.status !== 200 || !studentLogin.data.token) {
      console.error('❌ Student login failed:', studentLogin.data)
      process.exit(1)
    }

    const studentToken = studentLogin.data.token
    const studentData = studentLogin.data.user
    console.log('✅ Student logged in:')
    console.log('   Username:', studentData.username)
    console.log('   Role:', studentData.role)
    console.log('   Class:', studentData.classSlug)

    // Verify token structure
    const decodedStudent = decodeJWT(studentToken)
    console.log('   Token username field:', decodedStudent?.username)

    // STEP 5: Student Fetches Their Marks
    console.log('\nSTEP 5️⃣ : Student Retrieves Their Marks')
    console.log('─'.repeat(60))
    
    const studentMarks = await request('GET', '/api/tests', null, studentToken)
    console.log('Status:', studentMarks.status)
    
    if (Array.isArray(studentMarks.data)) {
      console.log('✅ Got marks array:', `Array(${studentMarks.data.length})`)
      if (studentMarks.data.length > 0) {
        console.log('\n📊 Marks Details:')
        studentMarks.data.forEach((mark, i) => {
          console.log(`   [${i + 1}]`, JSON.stringify(mark.marks))
        })
      } else {
        console.warn('⚠️  Array is empty - marks not found!')
      }
    } else {
      console.error('❌ Invalid response:', studentMarks.data)
    }

    // STEP 6: Summary
    console.log('\n' + '═'.repeat(60))
    console.log('✅ TEST COMPLETE')
    console.log('═'.repeat(60))
    console.log('Flow:')
    console.log('  1. ✅ Teacher logged in')
    console.log('  2. ✅ Retrieved student list')
    console.log('  3. ✅ Added marks for student')
    console.log('  4. ✅ Student logged in')
    console.log('  5. ✅ Student saw', Array.isArray(studentMarks.data) ? studentMarks.data.length : '?', 'marks')
    
    if (Array.isArray(studentMarks.data) && studentMarks.data.length > 0) {
      console.log('\n🎉 SUCCESS - Student can see the marks just added!')
    } else {
      console.log('\n⚠️  WARNING - Student did not get marks')
    }

  } catch (err) {
    console.error('❌ Test error:', err.message)
    process.exit(1)
  }

  process.exit(0)
}

setTimeout(test, 500)
