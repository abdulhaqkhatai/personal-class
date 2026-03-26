const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

// Helper: generate a safe classSlug from a class name
function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_]/g, '')  // remove special chars
    .replace(/\s+/g, '_')           // spaces to underscores
    .replace(/_+/g, '_')            // collapse multiple underscores
    .slice(0, 40)                   // max length
}

// Teacher Signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password, className, subjects = [], students = [] } = req.body
    if (!username || !password || !className) {
      return res.status(400).json({ error: 'username, password, and className are required' })
    }

    const classSlug = toSlug(className)
    if (!classSlug) return res.status(400).json({ error: 'Invalid class name' })

    // Check teacher username unique
    const existingUser = await User.findOne({ username })
    if (existingUser) return res.status(409).json({ error: 'Username already taken' })

    // Check classSlug unique
    const existingClass = await User.findOne({ classSlug })
    if (existingClass) return res.status(409).json({ error: 'A class with this name already exists. Please choose a different class name.' })

    // Check student usernames unique across all users
    if (students.length > 0) {
      const studentUsernames = students.map(s => s.username)
      // Check for duplicates within the submitted list
      const uniqueStudentNames = new Set(studentUsernames)
      if (uniqueStudentNames.size !== studentUsernames.length) {
        return res.status(409).json({ error: 'Student usernames must be unique' })
      }
      // Check against existing users in DB
      const existing = await User.find({ username: { $in: studentUsernames } })
      if (existing.length > 0) {
        return res.status(409).json({ error: `Username already taken: ${existing.map(u => u.username).join(', ')}` })
      }
    }

    // Create teacher
    const hashedPass = await bcrypt.hash(password, 10)
    const teacher = await User.create({
      username,
      password: hashedPass,
      role: 'teacher',
      className,
      classSlug,
      subjects,
    })

    // Create students
    if (students.length > 0) {
      const studentDocs = await Promise.all(students.map(async s => ({
        username: s.username,
        password: await bcrypt.hash(s.password, 10),
        role: 'student',
        classSlug,
        teacherId: teacher._id,
      })))
      await User.insertMany(studentDocs)
    }

    const token = jwt.sign(
      { id: teacher._id, role: 'teacher', classSlug, className, subjects },
      JWT_SECRET,
      { expiresIn: '30d' }
    )
    res.json({ token, user: { id: teacher._id, username: teacher.username, role: 'teacher', classSlug, className, subjects } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// Login (teacher or student)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'username, password required' })

    const user = await User.findOne({ username })
    if (!user) return res.status(401).json({ error: 'invalid credentials' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'invalid credentials' })

    // For teachers: classSlug from their own record
    // For students: classSlug stored on their user record
    const classSlug = user.classSlug || null
    const className = user.className || null
    const subjects = user.subjects || []

    const token = jwt.sign(
      { id: user._id, role: user.role, classSlug, className, subjects },
      JWT_SECRET,
      { expiresIn: '30d' }
    )
    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role, classSlug, className, subjects }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// Add student (teacher only, post-signup)
router.post('/add-student', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'no token' })
    const payload = jwt.verify(auth.split(' ')[1], JWT_SECRET)
    if (payload.role !== 'teacher') return res.status(403).json({ error: 'forbidden' })

    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'username and password required' })

    const existing = await User.findOne({ username })
    if (existing) return res.status(409).json({ error: 'Username already taken' })

    const hashed = await bcrypt.hash(password, 10)
    const student = await User.create({
      username,
      password: hashed,
      role: 'student',
      classSlug: payload.classSlug,
      teacherId: payload.id,
    })

    res.json({ id: student._id, username: student.username, role: 'student' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

module.exports = router
