#!/usr/bin/env node
/**
 * Test the new class: Teacher adds marks, Student sees them
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
  console.log('🧪 NEW CLASS TEST: Class 2 Teacher → Student Marks')
  console.log('═══════════════════════════════════════════════════════════\n')

  try {
    // STEP 1: New Teacher Login
    console.log('STEP 1️⃣ : New Teacher Login (class2_teacher)')
    console.log('─'.repeat(60))
    const teacherLogin = await request('POST', '/api/auth/login', {
      username: 'class2_teacher',
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
    console.log('   Class:', teacherData.className, `(${teacherData.classSlug})`)

    // STEP 2: Get students list
    console.log('\nSTEP 2️⃣ : Get Students ')
    console.log('─'.repeat(60))
    const studentsList = await request('GET', '/api/auth/students', null, teacherToken)
    
    let students = []
    if (Array.isArray(studentsList.data)) {
      students = studentsList.data
    } else if (studentsList.data?.students) {
      students = studentsList.data.students
    }

    const targetStudent = students[0]
    console.log('✅ Found', students.length, 'students')
    console.log('   Testing with:', targetStudent.username)

    // STEP 3: Add marks for student
    console.log('\nSTEP 3️⃣ : Teacher Adds Marks')
    console.log('─'.repeat(60))
    
    const marksData = {
      date: new Date().toISOString().split('T')[0],
      studentUsername: targetStudent.username,
      marks: {
        english: {
          obtained: 78,
          total: 100
        },
        science: {
          obtained: 92,
          total: 100
        }
      }
    }

    const addMarks = await request('POST', '/api/tests', marksData, teacherToken)

    if (addMarks.status !== 201 && addMarks.status !== 200) {
      console.error('❌ Failed to add marks:', addMarks.data)
      process.exit(1)
    }

    console.log('✅ Marks added successfully')
    console.log('   Student:', targetStudent.username)
    console.log('   English: 78/100')
    console.log('   Science: 92/100')

    // STEP 4: Student Login
    console.log('\nSTEP 4️⃣ : Student Login')
    console.log('─'.repeat(60))
    
    const studentLogin = await request('POST', '/api/auth/login', {
      username: targetStudent.username,
      password: 'test123'
    })

    if (studentLogin.status !== 200 || !studentLogin.data.token) {
      console.error('❌ Student login failed:', studentLogin.data)
      process.exit(1)
    }

    const studentToken = studentLogin.data.token
    const studentData = studentLogin.data.user
    console.log('✅ Student logged in:')
    console.log('   Username:', studentData.username)
    console.log('   Class:', studentData.classSlug)

    const decodedStudent = decodeJWT(studentToken)
    console.log('   Token has username:', !!decodedStudent?.username)

    // STEP 5: Student Fetches Their Marks
    console.log('\nSTEP 5️⃣ : Student Retrieves Marks')
    console.log('─'.repeat(60))
    
    const studentMarks = await request('GET', '/api/tests', null, studentToken)

    if (Array.isArray(studentMarks.data)) {
      console.log('✅ Got marks array: Array(' + studentMarks.data.length + ')')
      if (studentMarks.data.length > 0) {
        console.log('\n📊 Marks:')
        studentMarks.data.forEach((mark, i) => {
          console.log(`   [${i + 1}]`, JSON.stringify(mark.marks))
        })
      } else {
        console.warn('⚠️  Array is empty!')
      }
    } else {
      console.error('❌ Invalid response:', studentMarks.data)
    }

    // STEP 6: Summary
    console.log('\n' + '═'.repeat(60))
    console.log('✅ NEW CLASS TEST COMPLETE')
    console.log('═'.repeat(60))
    
    if (Array.isArray(studentMarks.data) && studentMarks.data.length > 0) {
      console.log('\n🎉 SUCCESS - New class system works perfectly!')
      console.log('   - Teacher can add marks ✅')
      console.log('   - Student can see marks ✅')
    } else {
      console.log('\n⚠️  Student marks not retrieved')
    }

  } catch (err) {
    console.error('❌ Test error:', err.message)
    process.exit(1)
  }

  process.exit(0)
}

setTimeout(test, 500)
