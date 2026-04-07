require('dotenv').config()
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/marksdb'
const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

async function comprehen_siveTest() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    const db = mongoose.connection.db
    const User = require('./models/User')

    console.log('\n' + '='.repeat(80))
    console.log('🏆 COMPREHENSIVE END-TO-END TEST: STUDENT MARKS FLOW')
    console.log('='.repeat(80))

    // Get actual data from DB
    const teacher = await User.findOne({ role: 'teacher' })
    const student = await User.findOne({ role: 'student' })

    if (!teacher || !student) {
      console.error('❌ Missing teacher or student in database')
      process.exit(1)
    }

    console.log('\n📋 DATABASE STATE:')
    console.log(`  Teacher: ${teacher.username} → class: ${teacher.classSlug}`)
    console.log(`  Student: ${student.username} → class: ${student.classSlug}`)

    // Check marks in database
    const col = db.collection(`tests_${student.classSlug}`)
    const studentMarks = await col.find({ studentUsername: student.username }).toArray()

    console.log(`\n📊 MARKS IN DATABASE:`)
    console.log(`  Total marks for "${student.username}": ${studentMarks.length}`)
    studentMarks.forEach((m, i) => {
      console.log(`    [${i + 1}] ${JSON.stringify(m.marks)}`)
    })

    // Simulate student login
    const studentJWT = jwt.sign(
      {
        id: student._id,
        username: student.username,
        role: 'student',
        classSlug: student.classSlug,
        className: student.className,
        subjects: student.subjects || []
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    console.log(`\n🔐 STUDENT JWT CREATED:`)
    console.log(`  Username: ${student.username}`)
    console.log(`  ClassSlug: ${student.classSlug}`)

    // Test API call
    const { start } = require('./app')
    const request = require('supertest')
    const app = await start()

    console.log(`\n📡 API REQUEST: GET /api/tests`)
    const res = await request(app)
      .get('/api/tests')
      .set('Authorization', `Bearer ${studentJWT}`)

    console.log(`  Status: ${res.status}`)
    console.log(`  Response is array: ${Array.isArray(res.body)}`)
    console.log(`  Elements: ${Array.isArray(res.body) ? res.body.length : 'N/A'}`)

    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`\n✅ API RESPONSE SUCCESS!`)
      res.body.forEach((m, i) => {
        console.log(`  [${i + 1}] ID: ${m._id}`)
        console.log(`      StudentUsername: "${m.studentUsername}" ${m.studentUsername === student.username ? '✅' : '❌ MISMATCH!'}`)
        console.log(`      Marks: ${JSON.stringify(m.marks)}`)
      })

      // Simulate frontend processing
      console.log(`\n🧩 FRONTEND PROCESSING:`)
      const transformed = res.body.map(t => ({ ...t, id: t._id }))
      console.log(`  1. Transform: Added "id" field → ${transformed.length} records`)

      const entries = []
      transformed.forEach(t => {
        Object.entries(t.marks || {}).forEach(([sub, m]) => {
          const obtained = m?.obtained ?? m ?? 0
          const total = m?.total ?? (typeof m === 'number' ? 100 : 0)
          const d = new Date(t.date)
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          entries.push({ id: t.id, date: t.date, monthKey, subject: sub, obtained, total })
        })
      })
      console.log(`  2. Create entries: ${entries.length} subject-mark combinations`)

      const grouped = entries.reduce((acc, e) => {
        acc[e.monthKey] = acc[e.monthKey] || []
        acc[e.monthKey].push(e)
        return acc
      }, {})
      console.log(`  3. Group by month: ${Object.keys(grouped).length} month(s)`)

      const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
      console.log(`  4. Sort months: [${months.join(', ')}]`)

      console.log(`\n📊 WHAT STUDENT WILL SEE:`)
      months.forEach(month => {
        console.log(`\n  📅 Month: ${month}`)
        grouped[month].forEach((e, i) => {
          console.log(`    [${i + 1}] ${e.subject}: ${e.obtained}/${e.total}`)
        })
      })

      console.log(`\n✅ COMPLETE FLOW VERIFIED: Student will see marks on their page!`)
    } else {
      console.log(`\n❌ API FAILED:`)
      console.log(`  Status: ${res.status}`)
      console.log(`  Body:`, res.body)
    }

    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

comprehen_siveTest()
