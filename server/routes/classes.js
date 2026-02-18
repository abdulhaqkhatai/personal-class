const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Class = require('../models/Class')
const User = require('../models/User')

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

function verifyToken(req, res, next) {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'no token' })
    const parts = auth.split(' ')
    if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth header' })
    const token = parts[1]
    try {
        const payload = jwt.verify(token, JWT_SECRET)
        req.user = payload
        next()
    } catch (err) {
        return res.status(401).json({ error: 'invalid token' })
    }
}

// Get teacher's classes
router.get('/', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') return res.status(403).json({ error: 'forbidden' })
        const classes = await Class.find({ teacherId: req.user.id })
        res.json(classes)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'server error' })
    }
})

// Get class by ID (with subjects)
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const classDoc = await Class.findById(req.params.id)
        if (!classDoc) return res.status(404).json({ error: 'class not found' })

        // Verify user has access to this class
        const user = await User.findById(req.user.id)
        if (!user.classId || user.classId.toString() !== classDoc._id.toString()) {
            return res.status(403).json({ error: 'forbidden' })
        }

        res.json(classDoc)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'server error' })
    }
})

// Update class subjects
router.put('/:id/subjects', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') return res.status(403).json({ error: 'forbidden' })
        const { subjects } = req.body
        if (!subjects || !Array.isArray(subjects)) return res.status(400).json({ error: 'subjects array required' })

        const classDoc = await Class.findById(req.params.id)
        if (!classDoc) return res.status(404).json({ error: 'class not found' })
        if (classDoc.teacherId.toString() !== req.user.id) return res.status(403).json({ error: 'forbidden' })

        classDoc.subjects = subjects
        await classDoc.save()
        res.json(classDoc)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'server error' })
    }
})

module.exports = router
