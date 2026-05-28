const mongoose = require('mongoose');
const Video = require('../models/Video');
const Analytics = require('../models/Analytics');

mongoose.connect('mongodb://localhost:27017/video_analytics', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB connected');
  
  await Video.deleteMany({});
  await Analytics.deleteMany({});

  const mockVideos = [
    {
      title: '夏日穿搭分享',
      description: '分享今天的夏日穿搭，清凉又时尚',
      filePath: '/uploads/mock-video-1.mp4',
      uploadTime: new Date('2024-01-15')
    },
    {
      title: '美食探店vlog',
      description: '打卡网红餐厅，味道超赞',
      filePath: '/uploads/mock-video-2.mp4',
      uploadTime: new Date('2024-01-18')
    },
    {
      title: '护肤好物推荐',
      description: '近期爱用的护肤品分享',
      filePath: '/uploads/mock-video-3.mp4',
      uploadTime: new Date('2024-01-20')
    },
    {
      title: '旅行日记',
      description: '周末短途旅行vlog',
      filePath: '/uploads/mock-video-4.mp4',
      uploadTime: new Date('2024-01-22')
    },
    {
      title: '日常妆容教程',
      description: '日常通勤妆，简单又好看',
      filePath: '/uploads/mock-video-5.mp4',
      uploadTime: new Date('2024-01-25')
    }
  ];

  const savedVideos = await Video.insertMany(mockVideos);
  console.log('Mock videos created');

  const mockAnalytics = [];
  savedVideos.forEach(video => {
    for (let i = 0; i < 7; i++) {
      mockAnalytics.push({
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

  await Analytics.insertMany(mockAnalytics);
  console.log('Mock analytics created');

  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});