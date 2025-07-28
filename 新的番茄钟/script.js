// DOM 元素
const timer = document.getElementById('timer');
const modeIndicator = document.getElementById('modeIndicator');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const todayCount = document.getElementById('todayCount');
const workTime = document.getElementById('workTime');
const breakTime = document.getElementById('breakTime');
const historyList = document.getElementById('historyList');
const audioPlayer = document.getElementById('audioPlayer');
const playlist = document.getElementById('playlist').querySelector('ul');
const playModeBtn = document.getElementById('playModeBtn');
const timerRing = document.getElementById('timerRing');

// 音乐播放模式
let playMode = 'sequence'; // 'sequence'(顺序播放), 'loop'(单曲循环), 'random'(随机播放)

// 计时器设置
let WORK_TIME = 25 * 60; // 默认25分钟工作时间
let SHORT_BREAK_TIME = 5 * 60; // 默认5分钟短休息
const LONG_BREAK_TIME = 15 * 60; // 15分钟长休息

// 计时器状态
let timeLeft = WORK_TIME;
let isRunning = false;
let timerInterval = null;
let mode = 'work'; // 'work', 'shortBreak', 'longBreak'
let completedPomodoros = 0;
let totalWorkTime = 0;
let totalBreakTime = 0;

// 保存当前选择的时间设置
let currentWorkTime = 25; // 默认25分钟
let currentBreakTime = 5; // 默认5分钟

// 音频通知
const workCompleteSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3');
const breakCompleteSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');

// 初始化函数
function init() {
    updateTimerDisplay();
    loadHistory();
    setupMusicPlayer();
    setupEventListeners();
    setupTimeSettings();
    requestNotificationPermission();
}

// 请求浏览器通知权限
function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('通知权限已获得');
                } else {
                    console.log('通知权限被拒绝');
                }
            });
        }
    } else {
        console.log('此浏览器不支持通知功能');
    }
}

// 更新计时器显示
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 更新模式指示器
    // 先移除所有模式类
    modeIndicator.classList.remove('work-mode', 'short-break-mode', 'long-break-mode');
    
    if (mode === 'work') {
        modeIndicator.innerHTML = '<i class="fas fa-laptop-code"></i> 工作模式';
        modeIndicator.classList.add('work-mode');
        document.documentElement.style.setProperty('--timer-color', '#3498db');
        updateTimerRing(timeLeft, WORK_TIME);
    } else if (mode === 'shortBreak') {
        modeIndicator.innerHTML = '<i class="fas fa-coffee"></i> 短休息模式';
        modeIndicator.classList.add('short-break-mode');
        document.documentElement.style.setProperty('--timer-color', '#2ecc71');
        updateTimerRing(timeLeft, SHORT_BREAK_TIME);
    } else {
        modeIndicator.innerHTML = '<i class="fas fa-bed"></i> 长休息模式';
        modeIndicator.classList.add('long-break-mode');
        document.documentElement.style.setProperty('--timer-color', '#9b59b6');
        updateTimerRing(timeLeft, LONG_BREAK_TIME);
    }
    
    // 不添加动画效果
}

// 更新计时器环的进度
function updateTimerRing(currentTime, totalTime) {
    // 计算已经过去的时间比例
    const timeRatio = 1 - (currentTime / totalTime);
    // 将时间比例转换为角度（0-360度）
    const rotationDegrees = timeRatio * 360;
    
    // 使用conic-gradient实现边缘填充效果
    let timerColor = '#e74c3c'; // 默认红色
    
    // 根据当前模式设置颜色
    if (mode === 'shortBreak') {
        timerColor = '#2ecc71'; // 短休息绿色
    } else if (mode === 'longBreak') {
        timerColor = '#9b59b6'; // 长休息紫色
    }
    
    // 更新conic-gradient角度
    timerRing.style.background = `conic-gradient(${timerColor} ${rotationDegrees}deg, transparent ${rotationDegrees}deg)`;
}

// 开始计时器
function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    startBtn.disabled = true;
    
    // 更新按钮样式
    startBtn.classList.add('inactive');
    pauseBtn.classList.add('active');
    resetBtn.classList.add('active');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        
        if (mode === 'work') {
            totalWorkTime++;
        } else {
            totalBreakTime++;
        }
        
        updateStats();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimerComplete();
        }
        
        updateTimerDisplay();
    }, 1000);
}

// 暂停计时器
function pauseTimer() {
    if (!isRunning) return;
    
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    
    // 恢复按钮样式
    startBtn.classList.remove('inactive');
    pauseBtn.classList.remove('active');
    resetBtn.classList.remove('active');
}

// 重置计时器
function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    
    // 恢复按钮样式
    startBtn.classList.remove('inactive');
    pauseBtn.classList.remove('active');
    resetBtn.classList.remove('active');
    
    if (mode === 'work') {
        timeLeft = WORK_TIME;
    } else if (mode === 'shortBreak') {
        timeLeft = SHORT_BREAK_TIME;
    } else {
        timeLeft = LONG_BREAK_TIME;
    }
    
    updateTimerDisplay();
    // 重置时也更新计时器环的位置
    if (mode === 'work') {
        updateTimerRing(timeLeft, WORK_TIME);
    } else if (mode === 'shortBreak') {
        updateTimerRing(timeLeft, SHORT_BREAK_TIME);
    } else {
        updateTimerRing(timeLeft, LONG_BREAK_TIME);
    }
}

// 处理计时器完成
function handleTimerComplete() {
    isRunning = false;
    startBtn.disabled = false;
    
    // 恢复按钮样式
    startBtn.classList.remove('inactive');
    pauseBtn.classList.remove('active');
    resetBtn.classList.remove('active');
    
    if (mode === 'work') {
        completedPomodoros++;
        addHistoryEntry();
        workCompleteSound.play();
        
        // 显示工作时间结束弹窗
        showNotification('工作时间结束！', '开始休息一下吧！');
        
        // 发送浏览器通知
        showBrowserNotification('🍅 工作时间结束！', '恭喜完成一个番茄钟！现在开始休息一下吧。', 'work-complete');
        
        // 每完成4个番茄钟后进入长休息，否则进入短休息
        if (completedPomodoros % 4 === 0) {
            mode = 'longBreak';
            timeLeft = LONG_BREAK_TIME;
        } else {
            mode = 'shortBreak';
            timeLeft = SHORT_BREAK_TIME;
        }
        
        // 自动开始休息时间计时
        setTimeout(() => {
            startTimer();
        }, 1500); // 延迟1.5秒后自动开始，让用户有时间看到弹窗
    } else {
        // 休息结束后询问是否开始工作时间
        breakCompleteSound.play();
        
        // 发送浏览器通知
        const breakType = mode === 'longBreak' ? '长休息' : '短休息';
        showBrowserNotification('⏰ ' + breakType + '结束！', '休息时间到了，准备开始新的工作时间吗？', 'break-complete');
        
        // 显示休息时间结束弹窗
        showConfirmNotification('休息时间结束！', '是否开始新的工作时间？', () => {
            // 用户确认后开始工作时间
            mode = 'work';
            timeLeft = WORK_TIME;
            updateTimerDisplay();
            startTimer();
        }, () => {
            // 用户取消，只切换到工作模式但不自动开始
            mode = 'work';
            timeLeft = WORK_TIME;
            updateTimerDisplay();
        });
    }
    
    updateTimerDisplay();
    updateStats();
}

// 更新统计信息
function updateStats() {
    todayCount.textContent = completedPomodoros;
    workTime.textContent = Math.floor(totalWorkTime / 60);
    breakTime.textContent = Math.floor(totalBreakTime / 60);
}

// 添加历史记录
function addHistoryEntry() {
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.textContent = `${dateStr} ${timeStr} - 工作`;
    
    historyList.insertBefore(historyItem, historyList.firstChild);
    
    // 保存历史记录到本地存储
    saveHistory();
}

// 保存历史记录到本地存储
function saveHistory() {
    const historyItems = Array.from(historyList.children).map(item => item.textContent);
    localStorage.setItem('pomodoroHistory', JSON.stringify(historyItems));
    localStorage.setItem('pomodoroStats', JSON.stringify({
        completedPomodoros,
        totalWorkTime,
        totalBreakTime
    }));
}

// 从本地存储加载历史记录
function loadHistory() {
    // 加载历史记录
    const savedHistory = localStorage.getItem('pomodoroHistory');
    if (savedHistory) {
        const historyItems = JSON.parse(savedHistory);
        historyItems.forEach(itemText => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = itemText;
            historyList.appendChild(historyItem);
        });
    }
    
    // 加载统计数据
    const savedStats = localStorage.getItem('pomodoroStats');
    if (savedStats) {
        const stats = JSON.parse(savedStats);
        completedPomodoros = stats.completedPomodoros || 0;
        totalWorkTime = stats.totalWorkTime || 0;
        totalBreakTime = stats.totalBreakTime || 0;
        updateStats();
    }
}

// 设置音乐播放器
function setupMusicPlayer() {
    // 加载自定义音乐
    loadCustomMusic();
    
    // 为播放列表项添加点击事件
    addPlaylistItemListeners();
    
    // 默认选择第一首歌
    const playlistItems = playlist.querySelectorAll('li');
    if (playlistItems.length > 0) {
        const firstItem = playlistItems[0];
        audioPlayer.src = firstItem.getAttribute('data-src');
        firstItem.classList.add('active');
    }
    
    // 添加本地音乐加载功能
    const loadLocalMusicBtn = document.getElementById('loadLocalMusicBtn');
    const localMusicInput = document.getElementById('localMusicInput');
    const clearLocalMusicBtn = document.getElementById('clearLocalMusicBtn');
    
    loadLocalMusicBtn.addEventListener('click', () => {
        localMusicInput.click();
    });
    
    localMusicInput.addEventListener('change', handleLocalMusicFiles);
    
    // 添加清除本地音乐记录功能
    clearLocalMusicBtn.addEventListener('click', clearLocalMusicHistory);
    
    // 添加播放模式切换功能
    const playModeBtn = document.getElementById('playModeBtn');
    if (playModeBtn) {
        // 从本地存储加载播放模式
        const savedPlayMode = localStorage.getItem('musicPlayMode');
        if (savedPlayMode) {
            playMode = savedPlayMode;
            updatePlayModeDisplay();
        }
        
        playModeBtn.addEventListener('click', togglePlayMode);
    }
    
    // 添加音频结束事件监听器
    audioPlayer.addEventListener('ended', handleAudioEnded);
}

// 为播放列表项添加点击事件
function addPlaylistItemListeners() {
    const playlistItems = playlist.querySelectorAll('li');
    
    playlistItems.forEach(item => {
        // 跳过不可播放的项目
        if (item.classList.contains('inactive-item')) return;
        
        item.addEventListener('click', () => {
            const audioSrc = item.getAttribute('data-src');
            if (!audioSrc) return; // 如果没有音频源，不执行任何操作
            
            audioPlayer.src = audioSrc;
            audioPlayer.play();
            
            // 更新活动项
            playlistItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}


// 从本地存储加载自定义音乐
function loadCustomMusic() {
    // 清空默认的歌曲
    clearDefaultMusic();
    
    // 检查是否已经加载过默认音乐
    const defaultMusicLoaded = localStorage.getItem('defaultMusicLoaded');
    
    // 只有在没有加载过默认音乐的情况下才添加
    if (!defaultMusicLoaded) {
        // 添加BGM文件夹中的音乐作为默认播放列表
        const bgmFiles = [
            { name: '2_23_AM', path: './BGM/2_23_AM.mp3' },
            { name: '像晴天像雨天', path: './BGM/像晴天像雨天.mp3' },
        ];
        
        bgmFiles.forEach(music => {
            const newItem = document.createElement('li');
            newItem.setAttribute('data-src', music.path);
            newItem.textContent = music.name;
            playlist.appendChild(newItem);
        });
        
        // 标记默认音乐已加载
        localStorage.setItem('defaultMusicLoaded', 'true');
    }
    
    // 清除自定义音乐数据
    localStorage.removeItem('customMusic');
    
    // 加载本地音乐历史记录（仅显示名称，无法直接播放）
    const savedLocalMusic = localStorage.getItem('localMusicHistory');
    if (savedLocalMusic) {
        const localMusicHistory = JSON.parse(savedLocalMusic);
        
        localMusicHistory.forEach(fileName => {
            const newItem = document.createElement('li');
            newItem.textContent = fileName + ' (需重新加载)';
            newItem.classList.add('local-music-item');
            newItem.classList.add('inactive-item'); // 添加样式表示无法播放
            playlist.appendChild(newItem);
        });
    }
}

// 清空默认的歌曲
function clearDefaultMusic() {
    // 清空播放列表，确保每次都能正确加载音乐
    playlist.innerHTML = '';
    
    // 重置默认音乐加载标记，确保能重新加载默认音乐
    localStorage.removeItem('defaultMusicLoaded');
}

// 处理本地音乐文件
function handleLocalMusicFiles(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // 获取已保存的本地音乐记录
    let localMusicHistory = [];
    const savedLocalMusic = localStorage.getItem('localMusicHistory');
    if (savedLocalMusic) {
        localMusicHistory = JSON.parse(savedLocalMusic);
    }
    
    // 显示加载中提示
    const loadingNotification = document.createElement('div');
    loadingNotification.className = 'notification';
    loadingNotification.textContent = '正在加载音乐...';
    document.body.appendChild(loadingNotification);
    
    // 处理每个选择的文件
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // 检查是否为音频文件
        if (file.type.startsWith('audio/')) {
            // 创建文件URL
            const fileUrl = URL.createObjectURL(file);
            // 获取文件名（去掉扩展名）
            const fileName = file.name.replace(/\.[^\.]+$/, '');
            
            // 创建新的播放列表项
            const newItem = document.createElement('li');
            newItem.setAttribute('data-src', fileUrl);
            newItem.textContent = fileName;
            newItem.classList.add('local-music-item'); // 添加标记，表示这是本地音乐
            
            // 添加到播放列表
            playlist.appendChild(newItem);
            
            // 添加点击事件
            newItem.addEventListener('click', () => {
                audioPlayer.src = fileUrl;
                audioPlayer.play();
                
                // 更新活动项
                const playlistItems = playlist.querySelectorAll('li');
                playlistItems.forEach(i => i.classList.remove('active'));
                newItem.classList.add('active');
            });
            
            // 如果是第一个添加的文件，自动播放
            if (i === 0 && playlist.querySelectorAll('li').length === 1) {
                audioPlayer.src = fileUrl;
                newItem.classList.add('active');
            }
            
            // 保存到本地音乐历史记录
            if (!localMusicHistory.includes(fileName)) {
                localMusicHistory.push(fileName);
            }
        }
    }
    
    // 保存本地音乐历史记录
    localStorage.setItem('localMusicHistory', JSON.stringify(localMusicHistory));
    
    // 重置文件输入框，允许再次选择相同的文件
    event.target.value = '';
    
    // 移除加载中提示
    const loadingElements = document.querySelectorAll('.notification');
    loadingElements.forEach(el => {
        document.body.removeChild(el);
    });
    
    // 显示成功提示
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = '<i class="fas fa-check-circle"></i> 音乐加载成功！';
    document.body.appendChild(notification);
    
    // 3秒后移除提示
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 2500);
}

// 清除本地音乐历史记录
function clearLocalMusicHistory() {
    // 确认是否清除
    if (confirm('确定要清除所有本地音乐记录吗？')) {
        // 清除localStorage中的记录
        localStorage.removeItem('localMusicHistory');
        
        // 从播放列表中移除所有本地音乐项
        const localMusicItems = playlist.querySelectorAll('.local-music-item');
        localMusicItems.forEach(item => {
            item.remove();
        });
        
        // 如果播放列表为空，重新加载自定义音乐
        if (playlist.children.length === 0) {
            loadCustomMusic();
        }
        
        alert('本地音乐记录已清除');
    }
}

// 切换播放模式
function togglePlayMode() {
    // 循环切换播放模式：顺序播放 -> 单曲循环 -> 随机播放 -> 顺序播放
    if (playMode === 'sequence') {
        playMode = 'loop';
    } else if (playMode === 'loop') {
        playMode = 'random';
    } else {
        playMode = 'sequence';
    }
    
    // 更新播放模式显示
    updatePlayModeDisplay();
    
    // 保存播放模式到本地存储
    localStorage.setItem('musicPlayMode', playMode);
}

// 更新播放模式显示
function updatePlayModeDisplay() {
    const playModeBtn = document.getElementById('playModeBtn');
    if (!playModeBtn) return;
    
    // 更新按钮文本和图标
    if (playMode === 'sequence') {
        playModeBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> 顺序播放';
        playModeBtn.title = '点击切换到单曲循环';
    } else if (playMode === 'loop') {
        playModeBtn.innerHTML = '<i class="fas fa-redo-alt"></i> 单曲循环';
        playModeBtn.title = '点击切换到随机播放';
    } else {
        playModeBtn.innerHTML = '<i class="fas fa-random"></i> 随机播放';
        playModeBtn.title = '点击切换到顺序播放';
    }
}

// 处理音频结束事件
function handleAudioEnded() {
    const playlistItems = playlist.querySelectorAll('li');
    if (playlistItems.length === 0) return;
    
    // 获取当前播放的音乐索引
    let currentIndex = -1;
    playlistItems.forEach((item, index) => {
        if (item.classList.contains('active')) {
            currentIndex = index;
        }
    });
    
    // 根据播放模式决定下一首歌
    let nextIndex = currentIndex;
    
    if (playMode === 'sequence') {
        // 顺序播放：播放下一首，如果是最后一首则回到第一首
        nextIndex = (currentIndex + 1) % playlistItems.length;
    } else if (playMode === 'loop') {
        // 单曲循环：继续播放当前歌曲
        // 不改变索引，重新播放当前歌曲
        audioPlayer.play();
        return;
    } else if (playMode === 'random') {
        // 随机播放：从整个播放列表中随机选择一首歌
        if (playlistItems.length > 1) {
            // 直接从所有歌曲中随机选择一首，不限于相邻歌曲
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * playlistItems.length);
            } while (randomIndex === currentIndex);
            nextIndex = randomIndex;
        }
    }
    
    // 播放下一首歌
    if (nextIndex >= 0 && nextIndex < playlistItems.length) {
        const nextItem = playlistItems[nextIndex];
        const audioSrc = nextItem.getAttribute('data-src');
        if (!audioSrc) return;
        
        audioPlayer.src = audioSrc;
        audioPlayer.play();
        
        // 更新活动项
        playlistItems.forEach(i => i.classList.remove('active'));
        nextItem.classList.add('active');
    }
}

// 设置事件监听器
function setupEventListeners() {
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    // 添加清空历史记录按钮
    const historyContainer = document.querySelector('.history-container');
    
    // 检查是否已经存在清空按钮，避免重复添加
    if (!document.getElementById('clearHistoryBtn')) {
        const clearHistoryBtn = document.createElement('button');
        clearHistoryBtn.id = 'clearHistoryBtn';
        clearHistoryBtn.className = 'btn reset clear-history-btn';
        clearHistoryBtn.innerHTML = '<i class="fas fa-trash-alt"></i> 清空历史记录';
        
        // 将按钮添加到历史记录容器中
        historyContainer.insertBefore(clearHistoryBtn, historyList);
        
        // 添加点击事件
        clearHistoryBtn.addEventListener('click', clearHistory);
    }
}

// 设置时间选择功能
function setupTimeSettings() {
    // 获取所有时间选项按钮
    const timeOptions = document.querySelectorAll('.time-option');
    
    // 为每个时间选项按钮添加点击事件
    timeOptions.forEach(option => {
        if (option.id === 'setCustomWorkTime' || option.id === 'setCustomBreakTime') {
            // 自定义时间按钮的处理逻辑
            option.addEventListener('click', () => {
                const type = option.getAttribute('data-type');
                if (type === 'work') {
                    const customTime = document.getElementById('customWorkTime').value;
                    if (customTime && customTime > 0) {
                        // 更新工作时间
                        updateTimeSettings(parseInt(customTime), type);
                        // 移除其他工作时间按钮的active类
                        document.querySelectorAll('.time-option[data-type="work"]').forEach(btn => {
                            if (btn !== option) btn.classList.remove('active');
                        });
                    }
                } else {
                    const customTime = document.getElementById('customBreakTime').value;
                    if (customTime && customTime > 0) {
                        // 更新休息时间
                        updateTimeSettings(parseInt(customTime), type);
                        // 移除其他休息时间按钮的active类
                        document.querySelectorAll('.time-option[data-type="break"]').forEach(btn => {
                            if (btn !== option) btn.classList.remove('active');
                        });
                    }
                }
            });
        } else {
            // 预设时间按钮的处理逻辑
            option.addEventListener('click', () => {
                const time = parseInt(option.getAttribute('data-time'));
                const type = option.getAttribute('data-type');
                
                // 更新时间设置
                updateTimeSettings(time, type);
                
                // 更新按钮状态
                const typeSelector = `[data-type="${type}"]`;
                document.querySelectorAll(`.time-option${typeSelector}`).forEach(btn => {
                    btn.classList.remove('active');
                });
                option.classList.add('active');
            });
        }
    });
    
    // 从本地存储加载时间设置
    loadTimeSettings();
}

// 更新时间设置
function updateTimeSettings(time, type) {
    if (type === 'work') {
        currentWorkTime = time;
        WORK_TIME = time * 60;
        
        // 如果当前是工作模式，更新计时器
        if (mode === 'work' && !isRunning) {
            timeLeft = WORK_TIME;
            updateTimerDisplay();
        }
    } else {
        currentBreakTime = time;
        SHORT_BREAK_TIME = time * 60;
        
        // 如果当前是短休息模式，更新计时器
        if (mode === 'shortBreak' && !isRunning) {
            timeLeft = SHORT_BREAK_TIME;
            updateTimerDisplay();
        }
    }
    
    // 保存设置到本地存储
    saveTimeSettings();
}

// 保存时间设置到本地存储
function saveTimeSettings() {
    localStorage.setItem('pomodoroTimeSettings', JSON.stringify({
        workTime: currentWorkTime,
        breakTime: currentBreakTime
    }));
}

// 从本地存储加载时间设置
function loadTimeSettings() {
    const savedSettings = localStorage.getItem('pomodoroTimeSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // 更新工作时间
        if (settings.workTime) {
            currentWorkTime = settings.workTime;
            WORK_TIME = currentWorkTime * 60;
            
            // 更新UI
            const workOption = document.querySelector(`.time-option[data-time="${currentWorkTime}"][data-type="work"]`);
            if (workOption) {
                document.querySelectorAll('.time-option[data-type="work"]').forEach(btn => {
                    btn.classList.remove('active');
                });
                workOption.classList.add('active');
            } else {
                // 如果是自定义时间
                document.getElementById('customWorkTime').value = currentWorkTime;
            }
        }
        
        // 更新休息时间
        if (settings.breakTime) {
            currentBreakTime = settings.breakTime;
            SHORT_BREAK_TIME = currentBreakTime * 60;
            
            // 更新UI
            const breakOption = document.querySelector(`.time-option[data-time="${currentBreakTime}"][data-type="break"]`);
            if (breakOption) {
                document.querySelectorAll('.time-option[data-type="break"]').forEach(btn => {
                    btn.classList.remove('active');
                });
                breakOption.classList.add('active');
            } else {
                // 如果是自定义时间
                document.getElementById('customBreakTime').value = currentBreakTime;
            }
        }
        
        // 如果当前是工作模式且计时器未运行，更新显示
        if (mode === 'work' && !isRunning) {
            timeLeft = WORK_TIME;
            updateTimerDisplay();
        } else if (mode === 'shortBreak' && !isRunning) {
            timeLeft = SHORT_BREAK_TIME;
            updateTimerDisplay();
        }
    }
}

// 显示通知弹窗
function showNotification(title, message) {
    // 创建弹窗元素
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    
    // 设置弹窗内容
    notification.innerHTML = `
        <div class="notification-content">
            <h3>${title}</h3>
            <p>${message}</p>
            <button class="btn notification-btn">确定</button>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 添加确定按钮事件
    const confirmBtn = notification.querySelector('.notification-btn');
    confirmBtn.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    });
    
    // 5秒后自动关闭
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// 显示确认通知弹窗
function showConfirmNotification(title, message, onConfirm, onCancel) {
    // 创建弹窗元素
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    
    // 设置弹窗内容
    notification.innerHTML = `
        <div class="notification-content">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="notification-buttons">
                <button class="btn notification-btn confirm">是</button>
                <button class="btn notification-btn cancel">否</button>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 添加按钮事件
    const confirmBtn = notification.querySelector('.notification-btn.confirm');
    const cancelBtn = notification.querySelector('.notification-btn.cancel');
    
    confirmBtn.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
                if (typeof onConfirm === 'function') {
                    onConfirm();
                }
            }
        }, 300);
    });
    
    cancelBtn.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
                if (typeof onCancel === 'function') {
                    onCancel();
                }
            }
        }, 300);
    });
    
    // 10秒后自动关闭并执行取消操作
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                    if (typeof onCancel === 'function') {
                        onCancel();
                    }
                }
            }, 300);
        }
    }, 10000);
}

// 显示浏览器通知
function showBrowserNotification(title, body, tag) {
    // 检查浏览器是否支持通知
    if (!('Notification' in window)) {
        console.log('此浏览器不支持通知功能');
        return;
    }
    
    // 检查通知权限
    if (Notification.permission === 'granted') {
        // 创建通知
        const notification = new Notification(title, {
            body: body,
            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiNlNzRjM2MiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJTNi40OCAyMiAxMiAyMlMyMiAxNy41MiAyMiAxMlMxNy41MiAyIDEyIDJaTTEzIDEzSDExVjdIMTNWMTNaTTEzIDE3SDExVjE1SDEzVjE3WiIgZmlsbD0iI2ZmZiIvPgo8L3N2Zz4KPC9zdmc+',
            tag: tag,
            requireInteraction: true, // 需要用户交互才能关闭
            silent: false // 播放系统通知声音
        });
        
        // 点击通知时聚焦到页面
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
        
        // 5秒后自动关闭通知
        setTimeout(() => {
            notification.close();
        }, 5000);
        
    } else if (Notification.permission === 'default') {
        // 如果权限未设置，请求权限
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                // 权限获得后重新调用函数
                showBrowserNotification(title, body, tag);
            }
        });
    } else {
        console.log('通知权限被拒绝');
    }
}

// 清空历史记录
function clearHistory() {
    // 清空DOM中的历史记录
    historyList.innerHTML = '';
    
    // 清空本地存储中的历史记录
    localStorage.removeItem('pomodoroHistory');
    
    // 显示通知
    showNotification('成功', '历史记录已清空');
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init);
