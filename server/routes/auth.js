const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../models/User')

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

console.log('🔧 Loading auth routes... students endpoint will be available at GET /api/auth/students')

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
      const insertResult = await User.insertMany(studentDocs)
      console.log(`Created ${insertResult.length} students for teacher ${teacher._id}`)
      insertResult.forEach(doc => {
        console.log(`Student: ${doc.username}, teacherId: ${doc.teacherId}`)
      })
    }

    const token = jwt.sign(
      { id: teacher._id, username: teacher.username, role: 'teacher', classSlug, className: trimmedClassName, subjects },
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
      { id: user._id, username: user.username, role: user.role, classSlug, className, subjects },
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

// GET /api/auth/students
router.get('/students', async (req, res) => {
  console.log('✅ [STUDENTS] Endpoint hit!')
  try {
    const authHeader = req.headers.authorization
    console.log('✅ [STUDENTS] Auth header:', authHeader ? 'present' : 'missing')
    
    if (!authHeader) {
      console.log('✅ [STUDENTS] No auth, returning empty')
      return res.status(200).json([])
    }
    
    const token = authHeader.replace('Bearer ', '')
    console.log('✅ [STUDENTS] Token extracted, verifying...')
    
    const payload = jwt.verify(token, JWT_SECRET)
    console.log('✅ [STUDENTS] Token verified, role:', payload.role)
    
    if (payload.role !== 'teacher') {
      console.log('✅ [STUDENTS] Not teacher, returning empty')
      return res.status(200).json([])
    }
    
    console.log('✅ [STUDENTS] Finding students for teacherId:', payload.id)
    const students = await User.find({ teacherId: payload.id, role: 'student' }).select('username').lean()
    console.log('✅ [STUDENTS] Found students:', students.length)
    
    const result = students.map(s => ({ username: s.username }))
    console.log('✅ [STUDENTS] Returning:', JSON.stringify(result))
    
    res.status(200).json(result)
  } catch (err) {
    console.error('❌ [STUDENTS] Error:', err.message)
    res.status(200).json([])
  }
})

// Get teacher profile info
router.get('/teacher-profile', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'No token' })
    
    const token = auth.split(' ')[1]
    const payload = jwt.verify(token, JWT_SECRET)
    
    if (payload.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can access this' })
    
    const teacher = await User.findById(payload.id)
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' })
    
    const students = await User.find({ teacherId: teacher._id }).select('username _id').lean()
    
    res.json({
      className: teacher.className,
      classSlug: teacher.classSlug,
      subjects: teacher.subjects || [],
      students: students.map(s => ({ username: s.username, id: s._id }))
    })
  } catch (err) {
    console.error('Teacher profile error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Update teacher profile (class name, subjects)
router.put('/teacher-profile', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'No token' })
    
    const token = auth.split(' ')[1]
    const payload = jwt.verify(token, JWT_SECRET)
    
    if (payload.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can access this' })
    
    const { className, subjects } = req.body
    
    const teacher = await User.findById(payload.id)
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' })
    
    // Update teacher info
    if (className !== undefined) teacher.className = className.trim()
    if (subjects !== undefined && Array.isArray(subjects)) teacher.subjects = subjects
    
    await teacher.save()
    
    res.json({ 
      className: teacher.className,
      classSlug: teacher.classSlug,
      subjects: teacher.subjects
    })
  } catch (err) {
    console.error('Update teacher profile error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Remove student
router.delete('/remove-student/:studentId', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'No token' })
    
    const token = auth.split(' ')[1]
    const payload = jwt.verify(token, JWT_SECRET)
    
    if (payload.role !== 'teacher') return res.status(403).json({ error: 'Only teachers can remove students' })
    
    const studentId = req.params.studentId
    
    // Find student and verify they belong to this teacher
    const student = await User.findById(studentId)
    if (!student) return res.status(404).json({ error: 'Student not found' })
    
    if (student.teacherId.toString() !== payload.id) {
      return res.status(403).json({ error: 'Student does not belong to this teacher' })
    }
    
    // Delete student and their marks
    await User.deleteOne({ _id: studentId })
    
    // Optionally delete their marks from tests collection
    // This depends on your database schema for marks
    
    res.json({ message: 'Student removed successfully' })
  } catch (err) {
    console.error('Remove student error:', err)
    res.status(500).json({ error: err.message })
  }
})

// DEBUG: Get current user info with students
router.get('/debug-me', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'No token' })
    
    const token = auth.split(' ')[1]
    const payload = jwt.verify(token, JWT_SECRET)
    
    const teacher = await User.findById(payload.id)
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' })
    
    console.log('\n=== DEBUG INFO ===')
    console.log('Teacher ID:', teacher._id.toString())
    console.log('Teacher username:', teacher.username)
    console.log('Teacher role:', teacher.role)
    
    const students = await User.find({ teacherId: teacher._id })
    console.log('Students found:', students.length)
    students.forEach(s => {
      console.log(`  - ${s.username} (id: ${s._id}, teacherId: ${s.teacherId})`)
    })
    console.log('=================\n')
    
    res.json({ 
      teacher: { _id: teacher._id, username: teacher.username, role: teacher.role },
      studentCount: students.length,
      students: students.map(s => ({ username: s.username, _id: s._id.toString(), teacherId: s.teacherId.toString() }))
    })
  } catch (err) {
    console.error('Debug me error:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
