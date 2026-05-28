const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let videos = [];
let analytics = [];
let videoIdCounter = 1;
let analyticsIdCounter = 1;

app.post('/api/videos', (req, res) => {
  const video = {
    _id: videoIdCounter++,
    title: req.body.title,
    description: req.body.description,
    link: req.body.link || '',
    uploadTime: new Date()
  };
  videos.push(video);
  res.status(201).json(video);
});

app.get('/api/videos', (req, res) => {
  const sortedVideos = [...videos].sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
  res.json(sortedVideos);
});

app.get('/api/videos/:id', (req, res) => {
  const video = videos.find(v => v._id == req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  res.json(video);
});

app.delete('/api/videos/:id', (req, res) => {
  const videoIndex = videos.findIndex(v => v._id == req.params.id);
  if (videoIndex === -1) return res.status(404).json({ error: 'Video not found' });
  videos.splice(videoIndex, 1);
  analytics = analytics.filter(a => a.videoId != req.params.id);
  res.json({ message: 'Video deleted successfully' });
});

app.post('/api/analytics', (req, res) => {
  const record = {
    _id: analyticsIdCounter++,
    videoId: req.body.videoId,
    date: new Date(),
    views: req.body.views || 0,
    likes: req.body.likes || 0,
    comments: req.body.comments || 0,
    shares: req.body.shares || 0,
    completionRate: req.body.completionRate || 0,
    watchTime: req.body.watchTime || 0
  };
  analytics.push(record);
  res.status(201).json(record);
});

app.get('/api/analytics/video/:videoId', (req, res) => {
  const videoAnalytics = analytics.filter(a => a.videoId == req.params.videoId);
  const sortedAnalytics = videoAnalytics.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(sortedAnalytics);
});

app.get('/api/analytics/summary/:videoId', (req, res) => {
  const videoAnalytics = analytics.filter(a => a.videoId == req.params.videoId);
  const summary = {
    totalViews: videoAnalytics.reduce((sum, a) => sum + a.views, 0),
    totalLikes: videoAnalytics.reduce((sum, a) => sum + a.likes, 0),
    totalComments: videoAnalytics.reduce((sum, a) => sum + a.comments, 0),
    totalShares: videoAnalytics.reduce((sum, a) => sum + a.shares, 0),
    avgCompletionRate: videoAnalytics.length > 0 
      ? videoAnalytics.reduce((sum, a) => sum + a.completionRate, 0) / videoAnalytics.length 
      : 0,
    trend: videoAnalytics.map(a => ({ date: a.date, views: a.views })).sort((a, b) => new Date(a.date) - new Date(b.date))
  };
  res.json(summary);
});

app.get('/api/analytics/trending', (req, res) => {
  const summaries = videos.map(video => {
    const videoAnalytics = analytics.filter(a => a.videoId == video._id);
    return {
      videoId: video._id,
      title: video.title,
      totalViews: videoAnalytics.reduce((sum, a) => sum + a.views, 0),
      totalLikes: videoAnalytics.reduce((sum, a) => sum + a.likes, 0),
      uploadTime: video.uploadTime
    };
  });
  summaries.sort((a, b) => b.totalViews - a.totalViews);
  res.json(summaries.slice(0, 10));
});

const generateMockData = () => {
  const mockVideos = [
    { title: '夏日穿搭分享', description: '分享今天的夏日穿搭，清凉又时尚', link: '', uploadTime: new Date('2024-01-15') },
    { title: '美食探店vlog', description: '打卡网红餐厅，味道超赞', link: '', uploadTime: new Date('2024-01-18') },
    { title: '护肤好物推荐', description: '近期爱用的护肤品分享', link: '', uploadTime: new Date('2024-01-20') },
    { title: '旅行日记', description: '周末短途旅行vlog', link: '', uploadTime: new Date('2024-01-22') },
    { title: '日常妆容教程', description: '日常通勤妆，简单又好看', link: '', uploadTime: new Date('2024-01-25') }
  ];

  mockVideos.forEach((video, index) => {
    video._id = videoIdCounter++;
    videos.push(video);
    
    for (let i = 0; i < 7; i++) {
      analytics.push({
        _id: analyticsIdCounter++,
        videoId: video._id,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        views: Math.floor(Math.random() * 5000) + 1000,
        likes: Math.floor(Math.random() * 500) + 100,
        comments: Math.floor(Math.random() * 50) + 10,
        shares: Math.floor(Math.random() * 30) + 5,
        completionRate: Math.floor(Math.random() * 40) + 50,
        watchTime: Math.floor(Math.random() * 300) + 60
      });
    }
  });
};

generateMockData();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});