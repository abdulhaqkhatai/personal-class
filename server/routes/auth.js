const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
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
    
    // Validate required fields
    if (!username || !password || !className) {
      return res.status(400).json({ error: 'username, password, and className are required' })
    }
    
    // Trim and validate strings
    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()
    const trimmedClassName = className.trim()
    
    if (!trimmedUsername || !trimmedPassword || !trimmedClassName) {
      return res.status(400).json({ error: 'username, password, and className cannot be empty' })
    }
    
    // Validate students array
    if (!Array.isArray(students)) {
      return res.status(400).json({ error: 'students must be an array' })
    }
    
    if (students.length === 0) {
      return res.status(400).json({ error: 'At least one student is required' })
    }
    
    // Validate each student has required fields
    for (let i = 0; i < students.length; i++) {
      const student = students[i]
      if (!student.username || !student.password) {
        return res.status(400).json({ error: `Student ${i + 1} is missing username or password` })
      }
    }

    const classSlug = toSlug(trimmedClassName)
    if (!classSlug) return res.status(400).json({ error: 'Invalid class name' })

    // Check teacher username unique
    const existingUser = await User.findOne({ username: trimmedUsername })
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
    const hashedPass = await bcrypt.hash(trimmedPassword, 10)
    const teacher = await User.create({
      username: trimmedUsername,
      password: hashedPass,
      role: 'teacher',
      className: trimmedClassName,
      classSlug,
      subjects,
    })

    // Create students
    if (students.length > 0) {
      const studentDocs = await Promise.all(students.map(async s => ({
        username: s.username.trim(),
        password: await bcrypt.hash(s.password.trim(), 10),
        role: 'student',
        classSlug,
        teacherId: teacher._id,
      })))
      await User.insertMany(studentDocs)
    }

    const token = jwt.sign(
      { id: teacher._id, role: 'teacher', classSlug, className: trimmedClassName, subjects },
      JWT_SECRET,
      { expiresIn: '30d' }
    )
    res.json({ token, user: { id: teacher._id, username: teacher.username, role: 'teacher', classSlug, className: trimmedClassName, subjects } })
  } catch (err) {
    console.error('Signup error:', err)
    // Return validation error details if available
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ error: 'Validation error: ' + messages.join(', ') })
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0]
      return res.status(409).json({ error: `${field} already exists` })
    }
    res.status(500).json({ error: 'Server error: ' + (err.message || 'Unknown error') })
  }
})

// Login (teacher or student)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'username and password are required' })

    const user = await User.findOne({ username })
    if (!user) return res.status(401).json({ error: 'Invalid username or password' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'Invalid username or password' })

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
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error: ' + (err.message || 'Unknown error') })
  }
})

// Add student (teacher only, post-signup)
router.post('/add-student', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'No authorization token provided' })
    
    let payload
    try {
      payload = jwt.verify(auth.split(' ')[1], JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    
    if (payload.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can add students' })

    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'username and password are required' })
    
    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()
    if (!trimmedUsername || !trimmedPassword) return res.status(400).json({ error: 'username and password cannot be empty' })

    const existing = await User.findOne({ username: trimmedUsername })
    if (existing) return res.status(409).json({ error: 'Username already taken' })

    const hashed = await bcrypt.hash(trimmedPassword, 10)
    const student = await User.create({
      username: trimmedUsername,
      password: hashed,
      role: 'student',
      classSlug: payload.classSlug,
      teacherId: payload.id,
    })

    res.json({ id: student._id, username: student.username, role: 'student' })
  } catch (err) {
    console.error('Add student error:', err)
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ error: 'Validation error: ' + messages.join(', ') })
    }
    res.status(500).json({ error: 'Server error: ' + (err.message || 'Unknown error') })
  }
})

// GET students for teacher
router.get('/students', async (req, res) => {
  try {
    const auth = req.headers.authorization
    console.log('Students endpoint called, auth header:', auth ? 'Present' : 'Missing')
    
    if (!auth) return res.status(401).json({ error: 'No authorization token provided' })
    
    let payload
    try {
      payload = jwt.verify(auth.split(' ')[1], JWT_SECRET)
      console.log('Token verified for teacher:', payload.id, 'role:', payload.role)
    } catch (err) {
      console.error('Token verification failed:', err.message)
      return res.status(401).json({ error: 'Invalid token' })
    }
    
    if (payload.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can view students' })

    // Convert payload.id (string) to ObjectId for proper comparison
    const teacherId = new mongoose.Types.ObjectId(payload.id)
    console.log('Looking for students with teacherId:', teacherId.toString())
    
    const students = await User.find({ 
      teacherId: teacherId,
      role: 'student'
    }).select('username -_id').lean()
    
    console.log(`Found ${students.length} students for teacher ${payload.id}`)
    
    // Also log all students records for debugging
    const allStudents = await User.find({ role: 'student' }).select('username teacherId').lean()
    console.log('Total students in DB:', allStudents.length, allStudents.map(s => ({ username: s.username, teacherId: s.teacherId.toString() })))
    
    res.json(students.map(s => ({ username: s.username })))
  } catch (err) {
    console.error('Get students error:', err)
    res.status(500).json({ error: 'Server error: ' + (err.message || 'Unknown error') })
  }
})

module.exports = router
