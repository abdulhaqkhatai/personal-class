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

    const User = require('./models/User')
    const student = await User.findOne({ role: 'student' })

    if (!student) {
      console.log('❌ No student found')
      process.exit(1)
    }

    console.log('\n👤 STUDENT DATA:')
    console.log(`  Username: ${student.username}`)
    console.log(`  ID: ${student._id}`)  
    console.log(`  ClassSlug: ${student.classSlug}`)

    // Create a proper JWT
    const token = jwt.sign(
      { 
        id: student._id, 
        username: student.username,  // ← MUST include username
        role: 'student', 
        classSlug: student.classSlug,
        className: student.className || null,
        subjects: student.subjects || []
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    console.log('\n🔐 GENERATED JWT:')
    console.log(token)

    // Verify it works
    const verified = jwt.verify(token, JWT_SECRET)
    console.log('\n✅ TOKEN VERIFICATION:')
    console.log(JSON.stringify(verified, null, 2))

    // Check marks
    const db = mongoose.connection.db
    const col = db.collection(`tests_${student.classSlug}`)
    const marks = await col.find({ studentUsername: student.username }).toArray()
    
    console.log(`\n📊 MARKS FOR THIS STUDENT (${student.username}):`)
    console.log(`  Count: ${marks.length}`)
    marks.forEach((m, i) => {
      console.log(`  [${i+1}] ${JSON.stringify(m.marks)}`)
    })

  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

test()
