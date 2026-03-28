require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const testsRoutes = require('./routes/tests')

const app = express()
app.use(cors())
app.use(express.json())

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/marksdb'
const CLIENT_URL = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || '*'

function redactUri(uri) {
  if (!uri) return 'none'
  try {
    return uri.replace(/:\/\/.+?:.+?@/, '://<REDACTED>@')
  } catch (e) { return uri }
}

async function connectDB() {
  if (!process.env.MONGO_URL && !process.env.MONGO_URI) {
    console.warn('MONGO_URL not set — will attempt local/default or in-memory fallback')
  }

  const maxAttempts = 2
  let attempt = 0

  while (attempt < maxAttempts) {
    attempt++
    try {
      console.log(`Attempt ${attempt}/${maxAttempts} to connect to MongoDB: ${redactUri(MONGO_URI)}`)
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000,
        socketTimeoutMS: 2000,
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        retryWrites: true,
      })
      console.log('MongoDB connected')
      return true
    } catch (err) {
      console.warn(`MongoDB connect attempt ${attempt} failed: ${err && err.message ? err.message : err}`)

      if (attempt < maxAttempts) {
        const waitMs = 300 * attempt
        console.log(`Waiting ${waitMs}ms then retrying...`)
        await new Promise((r) => setTimeout(r, waitMs))
        continue
      }

      console.log('Atlas connection failed after retries, falling back to in-memory MongoDB...')
      try {
        const mongod = await MongoMemoryServer.create()
        const uri = mongod.getUri()
        await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        })
        console.log('Connected to in-memory MongoDB (for local development)')
        return true
      } catch (err2) {
        console.error('MongoDB connection error during in-memory startup:')
        console.error(err2 && err2.stack ? err2.stack : err2)
        return false
      }
    }
  }

  return false
}

async function start() {
  const ok = await connectDB()
  if (!ok) {
    throw new Error('Could not connect to any MongoDB instance')
  }

  // Expose mongoose db ref to routes (for dynamic collections in tests.js)
  app.locals.db = mongoose.connection.db

  // Register routes after DB is ready
  console.log('🔧 Mounting /api/auth routes with', Object.keys(authRoutes).length, 'route handlers')
  app.use('/api/auth', authRoutes)
  app.use('/api/tests', testsRoutes)
  
  // Debug endpoints
  app.get('/', (req, res) => res.send({ ok: true }))
  app.get('/api/test-endpoint', (req, res) => res.json({ test: 'working', timestamp: new Date().toISOString(), version: '2' }))
  
  // Catch-all error handler
  app.use((err, req, res, next) => {
    console.error('❌ ERROR:', err)
    res.status(500).json({ error: err.message || 'Server error' })
  })

  return app
}

module.exports = { app, start }
