const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'student'], required: true },
  // Teacher fields
  className: { type: String, default: null },
  classSlug: { type: String, default: null },
  subjects: { type: [String], default: [] },
  // Student fields
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true })

module.exports = mongoose.model('User', UserSchema)
