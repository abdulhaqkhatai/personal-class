require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')
const Test = require('./models/Test')
const Class = require('./models/Class')

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/marksdb'

async function migrate() {
    try {
        console.log('Connecting to MongoDB...')
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log('Connected to MongoDB')

        // Check if migration already ran
        const existingClass = await Class.findOne({ slug: 'habbu' })
        if (existingClass) {
            console.log('Migration already completed. "Habbu" class exists.')
            console.log('Class ID:', existingClass._id)
            process.exit(0)
        }

        console.log('\n=== Starting Migration ===\n')

        // Step 1: Find existing admin user
        const adminUser = await User.findOne({ username: 'admin' })
        if (!adminUser) {
            console.error('Admin user not found. Please ensure default users are seeded first.')
            process.exit(1)
        }
        console.log('✓ Found admin user:', adminUser.username)

        // Step 2: Create default "Habbu" class
        const defaultSubjects = ['English', 'Hindi', 'Maths', 'Science', 'Social Science']
        const habbuClass = await Class.create({
            name: 'Habbu',
            slug: 'habbu',
            teacherId: adminUser._id,
            subjects: defaultSubjects,
            students: []
        })
        console.log('✓ Created "Habbu" class with subjects:', defaultSubjects)

        // Step 3: Update admin user with classId
        adminUser.classId = habbuClass._id
        await adminUser.save()
        console.log('✓ Associated admin user with Habbu class')

        // Step 4: Find and update student user
        const studentUser = await User.findOne({ username: 'student' })
        if (studentUser) {
            studentUser.classId = habbuClass._id
            await studentUser.save()
            habbuClass.students.push(studentUser._id)
            await habbuClass.save()
            console.log('✓ Associated student user with Habbu class')
        }

        // Step 5: Update all existing tests with classId
        const existingTests = await Test.find({})
        console.log(`\nFound ${existingTests.length} existing tests`)

        if (existingTests.length > 0) {
            const updateResult = await Test.updateMany(
                { classId: { $exists: false } },
                { $set: { classId: habbuClass._id } }
            )
            console.log(`✓ Updated ${updateResult.modifiedCount} tests with Habbu classId`)
        }

        console.log('\n=== Migration Completed Successfully ===\n')
        console.log('Summary:')
        console.log('- Created "Habbu" class')
        console.log('- Associated admin and student users')
        console.log(`- Updated ${existingTests.length} existing tests`)
        console.log('\nYou can now start the server normally.')

        process.exit(0)
    } catch (error) {
        console.error('\n❌ Migration Failed!')
        console.error('Error:', error.message)
        if (error.name === 'MongooseServerSelectionError') {
            console.error('\nTip: Make sure your MongoDB server is running.')
            console.error('If you are using a local database, try starting the server first:')
            console.error('  npm run dev (in a separate terminal)')
        }
        process.exit(1)
    }
}

migrate()
