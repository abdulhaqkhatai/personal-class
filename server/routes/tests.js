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
    }
    
    const tests = await col.find(filterQuery).sort({ date: -1 }).toArray()
    res.json(tests)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// POST create test (teacher only)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'forbidden' })
    const { date, marks, week, studentUsername } = req.body
    if (!date || !marks) return res.status(400).json({ error: 'date and marks required' })
    
    const col = getTestsCollection(req)
    const doc = {
      date: new Date(date),
      marks,
      week: week || null,
      studentUsername: studentUsername || null,
      createdBy: req.user.id,
      classSlug: req.user.classSlug,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
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

module.exports = router
