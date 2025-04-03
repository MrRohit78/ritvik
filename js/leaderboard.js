// State management
let currentTimeFilter = 'all-time';
let userStats = null;

// Load leaderboard data
async function loadLeaderboard(timeFilter = 'all-time') {
    try {
        const response = await fetch(`/api/leaderboard?timeFilter=${timeFilter}`);
        if (!response.ok) throw new Error('Failed to load leaderboard');
        
        const data = await response.json();
        updateTopUsers(data.topUsers);
        updateUserList(data.users);
        updateUserStats(data.userStats);
        updateAchievements(data.achievements);
    } catch (error) {
        showError('Failed to load leaderboard data');
    }
}

// Update top users display
function updateTopUsers(topUsers) {
    const topUsersContainer = document.querySelector('.top-users');
    topUsersContainer.innerHTML = '';

    topUsers.forEach((user, index) => {
        const userElement = document.createElement('div');
        userElement.className = `top-user ${index === 0 ? 'first' : index === 1 ? 'second' : 'third'}`;
        
        userElement.innerHTML = `
            <div class="rank">${index + 1}</div>
            <img src="${user.avatar}" alt="${user.username}" class="avatar">
            <div class="username">${user.username}</div>
            <div class="points">${user.points} points</div>
        `;
        
        topUsersContainer.appendChild(userElement);
    });
}

// Update user list
function updateUserList(users) {
    const userList = document.querySelector('.user-list');
    userList.innerHTML = '';

    users.forEach((user, index) => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        
        userElement.innerHTML = `
            <div class="rank-col">${index + 1}</div>
            <div class="user-col">
                <img src="${user.avatar}" alt="${user.username}" class="avatar">
                <div class="username">${user.username}</div>
            </div>
            <div class="points-col">${user.points}</div>
            <div class="level-col">${user.level}</div>
        `;
        
        userList.appendChild(userElement);
    });
}

// Update user stats
function updateUserStats(stats) {
    userStats = stats;
    
    // Update total points
    document.querySelector('.total-points .stat-value').textContent = stats.totalPoints;
    
    // Update global rank
    document.querySelector('.global-rank .stat-value').textContent = stats.globalRank;
    
    // Update current level
    document.querySelector('.current-level .stat-value').textContent = stats.currentLevel;
    
    // Update level progress
    const progressBar = document.querySelector('.level-progress .progress-bar');
    progressBar.style.width = `${stats.levelProgress}%`;
    progressBar.setAttribute('aria-valuenow', stats.levelProgress);
    progressBar.textContent = `${stats.levelProgress}%`;
}

// Update achievements
function updateAchievements(achievements) {
    const achievementsGrid = document.querySelector('.achievements-grid');
    achievementsGrid.innerHTML = '';

    achievements.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.className = `achievement-card ${achievement.unlocked ? '' : 'locked'}`;
        
        achievementElement.innerHTML = `
            <i class="fas ${achievement.icon}"></i>
            <h4>${achievement.title}</h4>
            <p>${achievement.description}</p>
        `;
        
        achievementsGrid.appendChild(achievementElement);
    });
}

// Handle time filter changes
function handleTimeFilterChange(filter) {
    currentTimeFilter = filter;
    
    // Update active state of filter buttons
    document.querySelectorAll('.time-filters .btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    // Load new data
    loadLeaderboard(filter);
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadLeaderboard(currentTimeFilter);
    
    // Add event listeners for time filters
    document.querySelectorAll('.time-filters .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handleTimeFilterChange(btn.dataset.filter);
        });
    });
}); 