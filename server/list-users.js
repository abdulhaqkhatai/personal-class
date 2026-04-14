#!/usr/bin/env node
/**
 * List all users in database
 */

require('dotenv').config()
const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URL

async function test() {
  try {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI)
    console.log('✅ Connected\n')

    const db = mongoose.connection
    const usersCollection = db.collection('users')

    console.log('📋 All Users in Database:')
    console.log('─'.repeat(60))

    const users = await usersCollection.find({}).toArray()
    console.log(`Found ${users.length} user(s):\n`)

    users.forEach((user, i) => {
      console.log(`[${i + 1}]`)
      console.log(`  ID: ${user._id}`)
      console.log(`  Username: ${user.username}`)
      console.log(`  Role: ${user.role}`)
      if (user.role === 'teacher') {
        console.log(`  Class Slug: ${user.classSlug}`)
        console.log(`  Class Name: ${user.className}`)
      } else {
        console.log(`  Teacher ID: ${user.teacherId}`)
        console.log(`  Class Slug: ${user.classSlug}`)
      }
      console.log()
    })

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
    process.exit(0)
  }
}

test()
