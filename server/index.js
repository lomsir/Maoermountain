const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/video_analytics', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const Video = require('./models/Video');
const Analytics = require('./models/Analytics');

app.post('/api/videos', upload.single('video'), async (req, res) => {
  try {
    const video = new Video({
      title: req.body.title,
      description: req.body.description,
      filePath: '/uploads/' + req.file.filename,
      uploadTime: new Date()
    });
    await video.save();
    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ uploadTime: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    await Analytics.deleteMany({ videoId: req.params.id });
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analytics', async (req, res) => {
  try {
    const analytics = new Analytics(req.body);
    await analytics.save();
    res.status(201).json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/video/:videoId', async (req, res) => {
  try {
    const analytics = await Analytics.find({ videoId: req.params.videoId }).sort({ date: -1 });
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/summary/:videoId', async (req, res) => {
  try {
    const analytics = await Analytics.find({ videoId: req.params.videoId });
    const summary = {
      totalViews: analytics.reduce((sum, a) => sum + a.views, 0),
      totalLikes: analytics.reduce((sum, a) => sum + a.likes, 0),
      totalComments: analytics.reduce((sum, a) => sum + a.comments, 0),
      totalShares: analytics.reduce((sum, a) => sum + a.shares, 0),
      avgCompletionRate: analytics.length > 0 
        ? analytics.reduce((sum, a) => sum + a.completionRate, 0) / analytics.length 
        : 0,
      trend: analytics.map(a => ({ date: a.date, views: a.views })).reverse()
    };
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/trending', async (req, res) => {
  try {
    const videos = await Video.find();
    const summaries = await Promise.all(
      videos.map(async video => {
        const analytics = await Analytics.find({ videoId: video._id });
        return {
          videoId: video._id,
          title: video.title,
          totalViews: analytics.reduce((sum, a) => sum + a.views, 0),
          totalLikes: analytics.reduce((sum, a) => sum + a.likes, 0),
          uploadTime: video.uploadTime
        };
      })
    );
    summaries.sort((a, b) => b.totalViews - a.totalViews);
    res.json(summaries.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});