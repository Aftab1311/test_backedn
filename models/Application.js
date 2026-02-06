const mongoose = require('mongoose');

const applicationSchema = mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  resume: {
    type: String, // Path to the uploaded file
    required: true,
  },
  status: {
    type: String,
    enum: ['New', 'Pending', 'Interview', 'Rejected', 'Hired'],
    default: 'New',
  },
}, {
  timestamps: true,
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;