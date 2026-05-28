const API_BASE = 'http://localhost:3000/api';

let viewsChart = null;

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  loadVideos();
  loadTrending();
});

function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      navButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');

      if (tabId === 'videos') loadVideos();
      if (tabId === 'trending') loadTrending();
      if (tabId === 'analytics') loadVideoSelector();
    });
  });
}

async function loadVideos() {
  try {
    const response = await fetch(`${API_BASE}/videos`);
    const videos = await response.json();
    displayVideos(videos);
  } catch (error) {
    console.error('Failed to load videos:', error);
  }
}

function displayVideos(videos) {
  const container = document.getElementById('videos-container');
  
  if (videos.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999;">暂无视频，请先添加</p>';
    return;
  }

  container.innerHTML = videos.map(video => `
    <div class="video-card">
      <div class="video-thumbnail">
        <span class="thumbnail-icon">📹</span>
      </div>
      <div class="video-info">
        <h3>${video.title}</h3>
        <p>${video.description || '暂无描述'}</p>
        ${video.link ? `<a href="${video.link}" target="_blank" class="video-link">🔗 查看视频</a>` : ''}
        <div class="upload-time">添加时间: ${new Date(video.uploadTime).toLocaleString()}</div>
        <div class="video-actions">
          <button class="view-btn" onclick="viewAnalytics('${video._id}')">查看分析</button>
          <button class="delete-btn" onclick="deleteVideo('${video._id}')">删除</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function deleteVideo(videoId) {
  if (!confirm('确定要删除这个视频吗？')) return;
  
  try {
    await fetch(`${API_BASE}/videos/${videoId}`, { method: 'DELETE' });
    loadVideos();
    loadTrending();
    loadVideoSelector();
  } catch (error) {
    console.error('Failed to delete video:', error);
  }
}

function viewAnalytics(videoId) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  
  document.querySelector('[data-tab="analytics"]').classList.add('active');
  document.getElementById('analytics').classList.add('active');
  
  document.getElementById('analytics-video-select').value = videoId;
  loadAnalytics(videoId);
}

document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('video-title').value;
  const description = document.getElementById('video-description').value;
  const link = document.getElementById('video-link').value;
  
  const status = document.getElementById('upload-status');
  status.textContent = '添加中...';
  status.className = '';
  
  try {
    const response = await fetch(`${API_BASE}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, link })
    });
    
    if (response.ok) {
      status.textContent = '添加成功！';
      status.className = 'success';
      document.getElementById('upload-form').reset();
      loadVideos();
      loadTrending();
      loadVideoSelector();
    } else {
      status.textContent = '添加失败，请重试';
      status.className = 'error';
    }
  } catch (error) {
    status.textContent = '添加失败: ' + error.message;
    status.className = 'error';
  }
});

async function loadVideoSelector() {
  try {
    const response = await fetch(`${API_BASE}/videos`);
    const videos = await response.json();
    const select = document.getElementById('analytics-video-select');
    
    select.innerHTML = '<option value="">选择视频</option>' + 
      videos.map(v => `<option value="${v._id}">${v.title}</option>`).join('');
  } catch (error) {
    console.error('Failed to load videos:', error);
  }
}

document.getElementById('analytics-video-select').addEventListener('change', (e) => {
  const videoId = e.target.value;
  if (videoId) {
    loadAnalytics(videoId);
  } else {
    clearAnalytics();
  }
});

async function loadAnalytics(videoId) {
  try {
    const response = await fetch(`${API_BASE}/analytics/summary/${videoId}`);
    const summary = await response.json();
    
    document.getElementById('total-views').textContent = summary.totalViews.toLocaleString();
    document.getElementById('total-likes').textContent = summary.totalLikes.toLocaleString();
    document.getElementById('total-comments').textContent = summary.totalComments.toLocaleString();
    document.getElementById('avg-completion').textContent = summary.avgCompletionRate.toFixed(1) + '%';
    
    renderChart(summary.trend);
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
}

function clearAnalytics() {
  document.getElementById('total-views').textContent = '0';
  document.getElementById('total-likes').textContent = '0';
  document.getElementById('total-comments').textContent = '0';
  document.getElementById('avg-completion').textContent = '0%';
  
  if (viewsChart) {
    viewsChart.destroy();
    viewsChart = null;
  }
}

function renderChart(trendData) {
  const ctx = document.getElementById('views-chart').getContext('2d');
  
  if (viewsChart) {
    viewsChart.destroy();
  }
  
  viewsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trendData.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [{
        label: '播放量',
        data: trendData.map(d => d.views),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: '播放量趋势'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

document.getElementById('analytics-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const videoId = document.getElementById('analytics-video-select').value;
  if (!videoId) {
    alert('请先选择视频');
    return;
  }
  
  const analytics = {
    videoId,
    views: parseInt(document.getElementById('analytics-views').value),
    likes: parseInt(document.getElementById('analytics-likes').value),
    comments: parseInt(document.getElementById('analytics-comments').value),
    shares: parseInt(document.getElementById('analytics-shares').value),
    completionRate: parseFloat(document.getElementById('analytics-completion').value)
  };
  
  try {
    await fetch(`${API_BASE}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analytics)
    });
    
    document.getElementById('analytics-form').reset();
    loadAnalytics(videoId);
  } catch (error) {
    console.error('Failed to add analytics:', error);
  }
});

async function loadTrending() {
  try {
    const response = await fetch(`${API_BASE}/analytics/trending`);
    const trending = await response.json();
    displayTrending(trending);
  } catch (error) {
    console.error('Failed to load trending:', error);
  }
}

function displayTrending(trending) {
  const container = document.getElementById('trending-container');
  
  if (trending.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999;">暂无数据</p>';
    return;
  }

  container.innerHTML = trending.map((item, index) => `
    <div class="trending-item">
      <div class="trending-rank">${index + 1}</div>
      <div class="trending-info">
        <h3>${item.title}</h3>
        <div class="trending-stats">
          <span>播放量: ${item.totalViews.toLocaleString()}</span>
          <span>点赞: ${item.totalLikes.toLocaleString()}</span>
          <span>上传: ${new Date(item.uploadTime).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  `).join('');
}