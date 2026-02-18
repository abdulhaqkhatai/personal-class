const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Class = require('../models/Class')

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { username, password, role, email, className, subjects } = req.body
    if (!username || !password || !role) return res.status(400).json({ error: 'username,password,role required' })

    // For teachers, className and subjects are required
    if (role === 'teacher' && (!className || !subjects || !Array.isArray(subjects) || subjects.length === 0)) {
      return res.status(400).json({ error: 'className and subjects required for teachers' })
    }

    const exists = await User.findOne({ username })
    if (exists) return res.status(409).json({ error: 'username exists' })

    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({ username, password: hash, role, email })

    // Create class for teachers
    let classData = null
    if (role === 'teacher') {
      const slug = className.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const classExists = await Class.findOne({ slug })
      if (classExists) {
        await User.findByIdAndDelete(user._id)
        return res.status(409).json({ error: 'Class name already taken. Please choose a different name.' })
      }

      const newClass = await Class.create({
        name: className,
        slug,
        teacherId: user._id,
        subjects: subjects,
        students: []
      })

      user.classId = newClass._id
      await user.save()

      classData = {
        id: newClass._id,
        name: newClass.name,
        slug: newClass.slug,
        subjects: newClass.subjects
      }
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' })
    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role, classId: user.classId },
      class: classData
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'username,password required' })
    const user = await User.findOne({ username }).populate('classId')
    if (!user) return res.status(401).json({ error: 'invalid credentials' })
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'invalid credentials' })

    let classData = null
    if (user.classId) {
      classData = {
        id: user.classId._id,
        name: user.classId.name,
        slug: user.classId.slug,
        subjects: user.classId.subjects
      }
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' })
    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role, classId: user.classId?._id },
      class: classData
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

module.exports = router
