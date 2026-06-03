# 视频效果分析工具

一个用于小红书运营的视频效果分析工具，帮助创作者追踪和分析视频表现数据。

## 功能特性

- 📤 **视频上传** - 支持上传视频文件，管理视频库
- 📊 **数据分析** - 查看播放量、点赞数、评论数、完播率等关键指标
- 📈 **趋势图表** - 可视化展示播放量趋势变化
- 🏆 **热门排行** - 视频热度排行榜

## 技术栈

- **后端**: Node.js + Express + MongoDB
- **前端**: HTML5 + CSS3 + JavaScript (Chart.js)

## 快速开始

### 环境要求

- Node.js (>= 14.x)
- MongoDB (本地运行)

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
npm start
```

服务启动后访问 `http://localhost:3000`

## API 接口

### 视频管理

- `POST /api/videos` - 上传视频
- `GET /api/videos` - 获取视频列表
- `GET /api/videos/:id` - 获取单个视频
- `DELETE /api/videos/:id` - 删除视频

### 数据分析

- `POST /api/analytics` - 添加分析记录
- `GET /api/analytics/video/:videoId` - 获取视频分析记录
- `GET /api/analytics/summary/:videoId` - 获取视频数据汇总
- `GET /api/analytics/trending` - 获取热门视频排行

## 项目结构

```
.
├── server/
│   ├── index.js          # 服务端入口
│   └── models/           # 数据模型
│       ├── Video.js      # 视频模型
│       └── Analytics.js  # 分析数据模型
├── public/
│   ├── index.html        # 前端页面
│   ├── styles.css        # 样式文件
│   ├── script.js         # 前端逻辑
│   └── uploads/          # 视频上传目录
└── package.json          # 项目配置
```

## 使用说明

1. 启动 MongoDB 服务
2. 运行 `npm start` 启动应用
3. 访问首页上传视频
4. 在数据分析页面查看视频表现
5. 添加分析记录追踪视频效果