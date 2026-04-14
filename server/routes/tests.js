const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

function verifyToken(req, res, next) {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'no token' })
  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth header' })
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' })
  }
}

// Get the class-specific tests collection
function getTestsCollection(req) {
  const classSlug = req.user.classSlug
  if (!classSlug) throw new Error('No classSlug in token')
  return req.app.locals.db.collection('tests_' + classSlug)
}

// GET all tests for this class
router.get('/', verifyToken, async (req, res) => {
  try {
    const col = getTestsCollection(req)
    const filterQuery = {}
    
    // If student is querying, only show their marks
    if (req.user.role === 'student') {
      filterQuery.studentUsername = req.user.username
      console.log(`📋 Student ${req.user.username} querying marks from class ${req.user.classSlug}`)
    } else {
      console.log(`📋 Teacher ${req.user.username} querying all tests from class ${req.user.classSlug}`)
    }
    
    const tests = await col.find(filterQuery).sort({ date: -1 }).toArray()
    if (req.user.role === 'student') {
      console.log(`📋 Returned ${tests.length} test(s) for student ${req.user.username}`)
      // Add debug header to help diagnose
      res.set('X-Debug-Filter', JSON.stringify(filterQuery))
    }
    
    // Add debug info to response headers for troubleshooting
    res.set('X-Debug-Count', tests.length.toString())
    res.set('X-Debug-User', req.user.username)
    res.set('X-Debug-Role', req.user.role)
    res.set('X-Debug-Class', req.user.classSlug)
    
    res.json(tests)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error', message: err.message })
  }
})

// POST create test (teacher only)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'forbidden' })
    const { date, marks, week, studentUsername } = req.body
    if (!date || !marks) return res.status(400).json({ error: 'date and marks required' })
    if (!studentUsername) return res.status(400).json({ error: 'studentUsername is required' })
    
    const col = getTestsCollection(req)
    const doc = {
      date: new Date(date),
      marks,
      week: week || null,
      studentUsername: studentUsername,
      createdBy: req.user.id,
      classSlug: req.user.classSlug,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    console.log(`📝 Creating test for student "${studentUsername}" in class "${req.user.classSlug}"`)
    const result = await col.insertOne(doc)
    res.json({ ...doc, _id: result.insertedId, id: result.insertedId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// PUT update test (teacher only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'forbidden' })
    const { ObjectId } = require('mongodb')
    const { marks, date } = req.body
    const col = getTestsCollection(req)
    const update = { updatedAt: new Date() }
    if (marks) update.marks = marks
    if (date) update.date = new Date(date)
    await col.updateOne({ _id: new ObjectId(req.params.id) }, { $set: update })
    const updated = await col.findOne({ _id: new ObjectId(req.params.id) })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// DELETE test (teacher only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'forbidden' })
    const { ObjectId } = require('mongodb')
    const col = getTestsCollection(req)
    await col.deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// DEBUG: Get diagnostic info about what's in the database
router.get('/debug/student-marks', verifyToken, async (req, res) => {
  try {
    const col = getTestsCollection(req)
    
    // Get ALL documents in this class
    const allDocs = await col.find({}).toArray()
    
    // Get marks for this student
    const studentMarks = await col.find({ studentUsername: req.user.username }).toArray()
    
    // Get unique studentUsernames in this class
    const uniqueStudents = await col.distinct('studentUsername')
    
    res.json({
      currentStudent: {
        username: req.user.username,
        classSlug: req.user.classSlug
      },
      totalDocsInClass: allDocs.length,
      marksForThisStudent: studentMarks.length,
      allStudentNamesInDatabase: uniqueStudents,
      sampleDocuments: allDocs.slice(0, 2).map(d => ({
        _id: d._id,
        studentUsername: d.studentUsername,
        marks: d.marks,
        date: d.date
      }))
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ADMIN: Fix marks that are missing studentUsername (for old imported data)
router.post('/admin/fix-missing-usernames', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can fix marks' })
    }

    const col = getTestsCollection(req)
    
    // Find all documents where studentUsername is missing or null
    const docsToFix = await col.find({ 
      $or: [
        { studentUsername: null },
        { studentUsername: { $exists: false } }
      ]
    }).toArray()

    console.log(`🔧 Found ${docsToFix.length} documents with missing studentUsername`)

    // Get all students in this class
    const User = require('../models/User')
    const students = await User.find({ 
      role: 'student', 
      classSlug: req.user.classSlug 
    }).exec()

    const studentUsernames = students.map(s => s.username)

    // If only one student, assign all missing marks to that student
    if (studentUsernames.length === 1) {
      const singleStudent = studentUsernames[0]
      const result = await col.updateMany(
        { $or: [{ studentUsername: null }, { studentUsername: { $exists: false } }] },
        { $set: { studentUsername: singleStudent } }
      )
      
      return res.json({
        message: `Updated ${result.modifiedCount} documents`,
        assignedTo: singleStudent,
        details: `All marks without studentUsername were assigned to ${singleStudent}`
      })
    }

    // If multiple students, return the docs for manual assignment
    res.json({
      message: 'Multiple students found - marks cannot be auto-fixed',
      studentCount: studentUsernames.length,
      studentUsernames,
      docsNeedingFix: docsToFix.length,
      docsToFix: docsToFix.map(d => ({
        _id: d._id,
        marks: d.marks,
        date: d.date
      })),
      nextStep: 'Contact admin to manually assign marks to correct students'
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
