#!/usr/bin/env node
/**
 * Reset teacher password to test123
 */

require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const MONGO_URI = process.env.MONGO_URL

async function test() {
  try {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI)
    console.log('✅ Connected\n')

    const db = mongoose.connection
    const usersCollection = db.collection('users')

    const teacherId = '69d39e989bb00469fb35c035'
    
    // Hash new password
    const hashedPassword = await bcrypt.hash('test123', 10)

    // Update password
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(teacherId) },
      { $set: { password: hashedPassword } }
    )

    console.log('Update result:', result)

    if (result.modifiedCount > 0) {
      console.log('✅ Teacher password reset to: test123')
    } else {
      console.log('⚠️  No document updated')
    }

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
    process.exit(0)
  }
}

test()
