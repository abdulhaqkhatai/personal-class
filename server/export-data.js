require('dotenv').config()
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

const User = require('./models/User')
const Test = require('./models/Test')

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/marksdb'

async function exportData() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    })
    console.log('Connected!')

    // Export users
    const users = await User.find().lean()
    console.log(`Found ${users.length} users`)

    // Export tests
    const tests = await Test.find().lean()
    console.log(`Found ${tests.length} tests`)

    const backup = {
      exportedAt: new Date().toISOString(),
      description: 'Pocket Class - Student marks and academic records backup',
      users: users,
      tests: tests
    }

    const filePath = path.join(__dirname, 'class-data-backup.json')
    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf-8')
    console.log(`\nData exported successfully to: ${filePath}`)
    console.log(`  Users: ${users.length}`)
    console.log(`  Tests: ${tests.length}`)

    await mongoose.disconnect()
    console.log('Done!')
    process.exit(0)
  } catch (err) {
    console.error('Export failed:', err.message)
    process.exit(1)
  }
}

exportData()
