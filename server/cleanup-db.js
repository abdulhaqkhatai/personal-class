require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/marksdb'

async function cleanup() {
  try {
    console.log('🔧 Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('✅ Connected to MongoDB')

    console.log('\n📊 Current database state:')
    const totalUsers = await User.countDocuments()
    console.log(`   Total users: ${totalUsers}`)

    console.log('\n🗑️  Deleting all users...')
    const result = await User.deleteMany({})
    console.log(`✅ Deleted ${result.deletedCount} users`)

    console.log('\n🗑️  Deleting all test collections...')
    const collections = await mongoose.connection.db.listCollections().toArray()
    for (const col of collections) {
      if (col.name.startsWith('tests_')) {
        await mongoose.connection.db.dropCollection(col.name)
        console.log(`✅ Dropped collection: ${col.name}`)
      }
    }

    console.log('\n✅ Database cleaned! Ready to start fresh.')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err)
    process.exit(1)
  }
}

cleanup()
