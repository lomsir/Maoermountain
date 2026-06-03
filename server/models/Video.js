const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  filePath: {
    type: String,
    required: true
  },
  uploadTime: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Video', videoSchema);