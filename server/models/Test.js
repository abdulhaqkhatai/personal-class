const mongoose = require('mongoose')

const TestSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  marks: { type: mongoose.Schema.Types.Mixed, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  week: { type: Number }
}, { timestamps: true })

module.exports = mongoose.model('Test', TestSchema)
