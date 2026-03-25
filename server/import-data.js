require('dotenv').config()
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

const User = require('./models/User')
const Test = require('./models/Test')

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/marksdb'

async function importData() {
  const filePath = path.join(__dirname, 'class-data-backup.json')

  if (!fs.existsSync(filePath)) {
    console.error('Backup file not found:', filePath)
    console.error('Please place your class-data-backup.json file in the server/ directory.')
    process.exit(1)
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const backup = JSON.parse(raw)

    console.log(`Backup from: ${backup.exportedAt}`)
    console.log(`  Users to import: ${backup.users ? backup.users.length : 0}`)
    console.log(`  Tests to import: ${backup.tests ? backup.tests.length : 0}`)

    console.log('\nConnecting to MongoDB...')
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    })
    console.log('Connected!')

    // Clear existing data
    console.log('Clearing existing data...')
    await User.deleteMany({})
    await Test.deleteMany({})

    // Import users (preserving _id)
    if (backup.users && backup.users.length > 0) {
      await User.insertMany(backup.users)
      console.log(`Imported ${backup.users.length} users`)
    }

    // Import tests (preserving _id and references)
    if (backup.tests && backup.tests.length > 0) {
      await Test.insertMany(backup.tests)
      console.log(`Imported ${backup.tests.length} tests`)
    }

    console.log('\nData imported successfully!')

    await mongoose.disconnect()
    console.log('Done!')
    process.exit(0)
  } catch (err) {
    console.error('Import failed:', err.message)
    process.exit(1)
  }
}

importData()
