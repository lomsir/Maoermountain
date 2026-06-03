const API_BASE = 'http://localhost:3000/api';

let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingSeconds = 0;
let recognition = null;
let isRecording = false;

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupRecording();
  setupFileUpload();
  setupResultButtons();
  loadHistory();
  
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    document.getElementById('start-record').disabled = false;
  } else {
    document.getElementById('status-text').textContent = '您的浏览器不支持语音识别功能';
  }
});

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
      
      if (tabId === 'history') {
        loadHistory();
      }
    });
  });
}

function setupRecording() {
  const startBtn = document.getElementById('start-record');
  const stopBtn = document.getElementById('stop-record');

  startBtn.addEventListener('click', startRecording);
  stopBtn.addEventListener('click', stopRecording);
}

function startRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN';

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    const resultText = document.getElementById('result-text');
    resultText.value = finalTranscript + interimTranscript;
    updateToolbarButtons(true);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    stopRecording();
    if (event.error === 'not-allowed') {
      alert('请允许麦克风权限以使用语音识别功能');
    }
  };

  recognition.start();
  
  isRecording = true;
  document.getElementById('start-record').disabled = true;
  document.getElementById('stop-record').disabled = false;
  document.getElementById('status-text').textContent = '正在录音...';
  
  recordingSeconds = 0;
  recordingInterval = setInterval(() => {
    recordingSeconds++;
    updateRecordingTime();
  }, 1000);
}

function stopRecording() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  
  isRecording = false;
  document.getElementById('start-record').disabled = false;
  document.getElementById('stop-record').disabled = true;
  document.getElementById('status-text').textContent = '录音已停止';
  
  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }
}

function updateRecordingTime() {
  const minutes = Math.floor(recordingSeconds / 60);
  const seconds = recordingSeconds % 60;
  document.getElementById('recording-time').textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function setupFileUpload() {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('audio-file');
  const selectBtn = document.getElementById('select-file');

  uploadArea.addEventListener('click', () => fileInput.click());
  selectBtn.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  });
}

async function processFile(file) {
  const fileInfo = document.getElementById('file-info');
  fileInfo.innerHTML = `
    <p><strong>文件名:</strong> ${file.name}</p>
    <p><strong>大小:</strong> ${formatFileSize(file.size)}</p>
    <p><strong>类型:</strong> ${file.type}</p>
  `;
  fileInfo.classList.add('active');

  const resultText = document.getElementById('result-text');
  resultText.value = '正在转换中...';
  updateToolbarButtons(false);

  try {
    const response = await fetch(`${API_BASE}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: file.name,
        filesize: file.size,
        filetype: file.type
      })
    });

    const data = await response.json();
    resultText.value = data.text || '转换完成，未识别到文本内容';
    updateToolbarButtons(true);
    
    saveToHistory(file.name, resultText.value);
  } catch (error) {
    console.error('Transcription error:', error);
    resultText.value = `转换失败: ${error.message}\n\n注意：由于浏览器限制，直接上传音频文件可能需要后端支持。建议使用实时录音功能。`;
    updateToolbarButtons(true);
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function setupResultButtons() {
  const copyBtn = document.getElementById('copy-btn');
  const downloadBtn = document.getElementById('download-btn');
  const saveBtn = document.getElementById('save-btn');

  copyBtn.addEventListener('click', copyToClipboard);
  downloadBtn.addEventListener('click', downloadText);
  saveBtn.addEventListener('click', saveToHistory);
}

function updateToolbarButtons(enabled) {
  const buttons = document.querySelectorAll('.toolbar-btn');
  buttons.forEach(btn => btn.disabled = !enabled);
}

async function copyToClipboard() {
  const text = document.getElementById('result-text').value;
  try {
    await navigator.clipboard.writeText(text);
    alert('文本已复制到剪贴板');
  } catch (error) {
    console.error('Copy failed:', error);
    alert('复制失败，请手动复制');
  }
}

function downloadText() {
  const text = document.getElementById('result-text').value;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcription_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function saveToHistory(title = '', text = '') {
  const resultText = document.getElementById('result-text');
  const content = text || resultText.value;
  const filename = title || `录音_${new Date().toLocaleString()}`;

  if (!content.trim()) {
    alert('没有内容可保存');
    return;
  }

  const history = JSON.parse(localStorage.getItem('transcriptionHistory') || '[]');
  history.unshift({
    id: Date.now(),
    title: filename,
    text: content,
    createdAt: new Date().toISOString()
  });

  if (history.length > 20) {
    history.pop();
  }

  localStorage.setItem('transcriptionHistory', JSON.stringify(history));
  alert('已保存到历史记录');
}

function loadHistory() {
  const container = document.getElementById('history-container');
  const history = JSON.parse(localStorage.getItem('transcriptionHistory') || '[]');

  if (history.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无转换记录</p>';
    return;
  }

  container.innerHTML = history.map(item => `
    <div class="history-item" onclick="loadHistoryItem(${item.id})">
      <h4>${item.title}</h4>
      <p>${item.text}</p>
      <div class="meta">${new Date(item.createdAt).toLocaleString()}</div>
    </div>
  `).join('');
}

function loadHistoryItem(id) {
  const history = JSON.parse(localStorage.getItem('transcriptionHistory') || '[]');
  const item = history.find(h => h.id === id);
  
  if (item) {
    document.getElementById('result-text').value = item.text;
    updateToolbarButtons(true);
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="record"]').classList.add('active');
    document.getElementById('record').classList.add('active');
  }
}