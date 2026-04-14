require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/marksdb'

async function resetPassword() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    const User = require('./models/User')
    
    // Set a known password for testing
    const plainPassword = 'test123'
    const hashedPassword = await bcrypt.hash(plainPassword, 10)
    
    const result = await User.updateOne(
      { username: 'students' },
      { password: hashedPassword }
    )
    
    console.log('✅ Password reset for student "students"')
    console.log(`   New password: ${plainPassword}`)
    console.log(`   Use this for login testing`)
    
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

resetPassword()
