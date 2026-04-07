require('dotenv').config()
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/marksdb'
const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

async function diagnose() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    const db = mongoose.connection.db
    console.log('\n🔍 MULTI-TENANT DIAGNOSIS\n')

    // Check Users
    const User = require('./models/User')
    const users = await User.find({}).exec()
    
    console.log('👥 USERS IN DATABASE:')
    users.forEach(u => {
      console.log(`\n  Username: ${u.username}`)
      console.log(`  Role: ${u.role}`)
      console.log(`  ClassSlug: ${u.classSlug}`)
      if (u.role === 'student') {
        console.log(`  TeacherId: ${u.teacherId}`)
      } else {
        console.log(`  ClassName: ${u.className}`)
        console.log(`  Subjects: ${u.subjects}`)
      }
    })

    // Simulate student login
    const student = await User.findOne({ role: 'student' })
    if (student) {
      console.log(`\n\n📋 SIMULATING STUDENT LOGIN: ${student.username}\n`)
      
      const studentJWT = jwt.sign(
        { 
          id: student._id, 
          username: student.username, 
          role: 'student', 
          classSlug: student.classSlug,
          className: student.className || null,
          subjects: student.subjects || []
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      )

      console.log('JWT Payload:')
      console.log(`  id: ${student._id}`)
      console.log(`  username: ${student.username}`)
      console.log(`  role: student`)
      console.log(`  classSlug: ${student.classSlug}`)

      // Check if student has a class collection
      const collections = (await db.listCollections().toArray()).map(c => c.name)
      const classCollection = `tests_${student.classSlug}`
      console.log(`\n📚 Looking for collection: ${classCollection}`)
      console.log(`   Exists: ${collections.includes(classCollection) ? '✅' : '❌'}`)

      if (collections.includes(classCollection)) {
        const col = db.collection(classCollection)
        const allDocs = await col.find({}).toArray()
        console.log(`   Total docs in class: ${allDocs.length}`)

        // Query for this student's marks
        const studentMarks = await col.find({ studentUsername: student.username }).toArray()
        console.log(`\n   Documents with studentUsername="${student.username}":`)
        console.log(`   Count: ${studentMarks.length}`)
        
        if (studentMarks.length > 0) {
          studentMarks.forEach((m, i) => {
            console.log(`\n   [${i + 1}]`)
            console.log(`      studentUsername: ${m.studentUsername}`)
            console.log(`      marks: ${JSON.stringify(m.marks)}`)
            console.log(`      date: ${m.date}`)
          })
        } else {
          console.log('\n   ❌ NO MARKS FOUND!')
          console.log(`\n   All documents in ${classCollection}:`)
          allDocs.forEach((m, i) => {
            console.log(`   [${i + 1}] studentUsername: "${m.studentUsername}" (expected: "${student.username}")`)
          })
        }
      }
    }

    console.log('\n✅ Diagnosis complete')
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

diagnose()
