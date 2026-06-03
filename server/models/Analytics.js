const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0
  },
  watchTime: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Analytics', analyticsSchema);