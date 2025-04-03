// Current selected language
let currentLanguage = localStorage.getItem('selectedLanguage') || null;

// Language selection handler
function selectLanguage(language) {
    currentLanguage = language;
    localStorage.setItem('selectedLanguage', language);
    loadLanguageContent(language);
}

// Load language specific content
async function loadLanguageContent(language) {
    try {
        const response = await fetch(`/api/lessons/${language}`);
        const data = await response.json();
        
        if (response.ok) {
            updateUI(data);
        } else {
            showError('Failed to load language content');
        }
    } catch (error) {
        console.error('Error loading language content:', error);
        showError('An error occurred while loading content');
    }
}

// Update UI with language content
function updateUI(data) {
    updateProgress(data.progress);
    updateModules(data.modules);
}

// Update progress section
function updateProgress(progress) {
    document.querySelector('.progress').style.width = `${progress.percentage}%`;
    
    const stats = document.querySelectorAll('.stat span');
    stats[0].textContent = `${progress.completedLessons} Lessons Completed`;
    stats[1].textContent = `${progress.hoursLearned} Hours Learning`;
    stats[2].textContent = `${progress.pointsEarned} Points Earned`;
}

// Update modules section
function updateModules(modules) {
    const moduleGrid = document.querySelector('.module-grid');
    moduleGrid.innerHTML = modules.map(module => createModuleCard(module)).join('');
}

// Create module card HTML
function createModuleCard(module) {
    return `
        <div class="module-card ${module.status}">
            <div class="module-header">
                <h3>${module.title}</h3>
                <span class="badge">${formatStatus(module.status)}</span>
            </div>
            <div class="lessons-list">
                ${module.lessons.map(lesson => createLessonItem(lesson)).join('')}
            </div>
        </div>
    `;
}

// Create lesson item HTML
function createLessonItem(lesson) {
    const icons = {
        completed: 'fa-check-circle',
        active: 'fa-play-circle',
        locked: 'fa-lock',
        default: 'fa-circle'
    };

    const icon = icons[lesson.status] || icons.default;
    
    return `
        <div class="lesson ${lesson.status}" onclick="startLesson('${lesson.id}')">
            <i class="fas ${icon}"></i>
            <span>${lesson.title}</span>
        </div>
    `;
}

// Format status text
function formatStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

// Start lesson handler
async function startLesson(lessonId) {
    if (!currentLanguage) {
        showError('Please select a language first');
        return;
    }

    try {
        const response = await fetch(`/api/lessons/${currentLanguage}/${lessonId}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            window.location.href = `/lesson.html?id=${lessonId}&lang=${currentLanguage}`;
        } else {
            const data = await response.json();
            showError(data.message || 'Failed to start lesson');
        }
    } catch (error) {
        console.error('Error starting lesson:', error);
        showError('An error occurred while starting the lesson');
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    document.querySelector('main').insertBefore(errorDiv, document.querySelector('main').firstChild);

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    if (currentLanguage) {
        loadLanguageContent(currentLanguage);
    }
}); 