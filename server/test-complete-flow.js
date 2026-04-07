require('dotenv').config()
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/marksdb'
const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

async function test() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    const db = mongoose.connection.db
    console.log('\n🧪 COMPLETE FLOW TEST\n')

    // Get the test collection
    const col = db.collection('tests_jiet')

    // Clear old test data
    await col.deleteMany({ studentUsername: 'test-student' })
    console.log('Cleared old test data')

    // Simulate teacher creating a test
    const testDoc = {
      date: new Date('2026-04-07'),
      marks: { Hindi: { obtained: 85, total: 100 }, English: { obtained: 75, total: 100 } },
      week: 1,
      studentUsername: 'test-student',
      createdBy: new mongoose.Types.ObjectId(),
      classSlug: 'jiet',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await col.insertOne(testDoc)
    console.log(`✅ Created test with ID: ${result.insertedId}`)
    console.log(`   StudentUsername: ${testDoc.studentUsername}`)
    console.log(`   Marks: ${JSON.stringify(testDoc.marks)}`)

    // Simulate student querying for their marks
    const studentToken = jwt.sign(
      { id: '123', username: 'test-student', role: 'student', classSlug: 'jiet' },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    console.log(`\n👤 Student Token created for: test-student`)
    console.log(`   ClassSlug: jiet`)

    // Query marks as student would
    const marks = await col.find({ studentUsername: 'test-student' }).toArray()
    console.log(`\n📋 Student query result: ${marks.length} mark(s) found`)

    if (marks.length > 0) {
      console.log('✅ SUCCESS: Student can see their marks!')
      marks.forEach((m, i) => {
        console.log(`  [${i + 1}] ${JSON.stringify(m.marks)} (date: ${m.date})`)
      })
    } else {
      console.log('❌ FAILED: Student cannot see their marks')
    }

    // Test with actual student from DB
    const User = require('./models/User')
    const student = await User.findOne({ role: 'student' })
    if (student) {
      console.log(`\n👤 Testing with actual student: ${student.username}`)
      const studentMarks = await col.find({ studentUsername: student.username }).toArray()
      console.log(`   Found ${studentMarks.length} mark(s)`)
      if (studentMarks.length > 0) {
        studentMarks.forEach((m, i) => {
          console.log(`   [${i + 1}] ${JSON.stringify(m.marks)}`)
        })
      }
    }

    console.log('\n✅ Test complete')
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

test()
