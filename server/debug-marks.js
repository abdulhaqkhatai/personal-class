const mongoose = require('mongoose')
require('dotenv').config()

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/marksdb'

async function debug() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    const db = mongoose.connection.db
    console.log('\n📊 DATABASE DEBUG\n')

    // List all collections
    const collections = (await db.listCollections().toArray()).map(c => c.name)
    console.log(`Total collections: ${collections.length}`)
    console.log('Collections:', collections)

    // Find all test-related collections
    const testCollections = collections.filter(c => c.startsWith('tests') || c === 'markstest')
    console.log(`\n📝 Found ${testCollections.length} test collections:`)

    for (const collName of testCollections) {
      const col = db.collection(collName)
      const count = await col.countDocuments()
      console.log(`\n  ${collName}: ${count} documents`)

      if (count > 0) {
        const docs = await col.find({}).limit(5).toArray()
        docs.forEach((doc, i) => {
          console.log(`    [${i + 1}] ID: ${doc._id}`)
          console.log(`        studentUsername: ${doc.studentUsername || '(not set - THIS IS THE PROBLEM!)'}`)
          console.log(`        createdBy: ${doc.createdBy}`)
          console.log(`        marks: ${JSON.stringify(doc.marks)}`)
          console.log(`        date: ${doc.date}`)
        })
      }
    }

    // Check User data
    console.log(`\n👥 User Data:`)
    const User = require('./models/User')
    const teachers = await User.find({ role: 'teacher' }).exec()
    console.log(`Teachers: ${teachers.length}`)
    teachers.forEach(t => {
      console.log(`  - ${t.username} (classSlug: ${t.classSlug})`)
    })

    const students = await User.find({ role: 'student' }).exec()
    console.log(`\nStudents: ${students.length}`)
    students.forEach(s => {
      console.log(`  - ${s.username} (classSlug: ${s.classSlug}, teacherId: ${s.teacherId})`)
    })

    console.log('\n✅ Debug complete')
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

debug()
