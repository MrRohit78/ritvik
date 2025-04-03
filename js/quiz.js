// State management
let currentQuiz = null;
let currentQuestion = 0;
let questions = [];
let selectedAnswer = null;
let quizStartTime = null;
let timerInterval = null;
let quizResults = {
    correct: 0,
    wrong: 0,
    timeTaken: 0
};

// Load available quizzes
async function loadQuizzes() {
    try {
        const response = await fetch('/api/quizzes', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const quizzes = await response.json();
            updateQuizGrid(quizzes);
        } else {
            showError('Failed to load quizzes');
        }
    } catch (error) {
        console.error('Error loading quizzes:', error);
        showError('An error occurred while loading quizzes');
    }
}

// Update quiz grid
function updateQuizGrid(quizzes) {
    const quizGrid = document.querySelector('.quiz-grid');
    quizGrid.innerHTML = quizzes.map(quiz => createQuizCard(quiz)).join('');
}

// Create quiz card HTML
function createQuizCard(quiz) {
    return `
        <div class="quiz-card" onclick="startQuiz('${quiz.id}')">
            <div class="quiz-info">
                <h3 class="quiz-title">${quiz.title}</h3>
                <span class="quiz-language">${quiz.language}</span>
            </div>
            <div class="quiz-details">
                <div class="quiz-detail">
                    <i class="fas fa-question-circle"></i>
                    <span>${quiz.questionCount} questions</span>
                </div>
                <div class="quiz-detail">
                    <i class="fas fa-clock"></i>
                    <span>${quiz.timeLimit} minutes</span>
                </div>
                <span class="difficulty-badge difficulty-${quiz.difficulty.toLowerCase()}">
                    ${quiz.difficulty}
                </span>
            </div>
        </div>
    `;
}

// Filter quizzes
function filterQuizzes() {
    const language = document.getElementById('languageFilter').value;
    const difficulty = document.getElementById('difficultyFilter').value;
    
    try {
        fetch(`/api/quizzes?language=${language}&difficulty=${difficulty}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(quizzes => updateQuizGrid(quizzes))
        .catch(error => {
            console.error('Error filtering quizzes:', error);
            showError('Failed to filter quizzes');
        });
    } catch (error) {
        console.error('Error:', error);
        showError('An error occurred while filtering quizzes');
    }
}

// Start quiz
async function startQuiz(quizId) {
    try {
        const response = await fetch(`/api/quizzes/${quizId}/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentQuiz = data.quiz;
            questions = data.questions;
            currentQuestion = 0;
            quizResults = { correct: 0, wrong: 0, timeTaken: 0 };
            
            // Show quiz interface
            document.querySelector('.quiz-selection').style.display = 'none';
            document.querySelector('.quiz-interface').style.display = 'block';
            document.querySelector('.quiz-results').style.display = 'none';
            
            startTimer();
            updateQuestionDisplay();
        } else {
            showError('Failed to start quiz');
        }
    } catch (error) {
        console.error('Error starting quiz:', error);
        showError('An error occurred while starting the quiz');
    }
}

// Update question display
function updateQuestionDisplay() {
    if (currentQuestion >= questions.length) {
        endQuiz();
        return;
    }

    const question = questions[currentQuestion];
    document.getElementById('questionText').textContent = question.text;
    
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = question.options.map((option, index) => `
        <div class="option" onclick="selectOption(${index})">
            ${option}
        </div>
    `).join('');
    
    // Update progress
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    document.querySelector('.progress').style.width = `${progress}%`;
    document.getElementById('questionProgress').textContent = 
        `Question ${currentQuestion + 1}/${questions.length}`;
    
    // Reset selected answer
    selectedAnswer = null;
    document.getElementById('nextButton').disabled = true;
}

// Select option
function selectOption(index) {
    selectedAnswer = index;
    
    // Update UI
    document.querySelectorAll('.option').forEach((option, i) => {
        option.classList.toggle('selected', i === index);
    });
    
    document.getElementById('nextButton').disabled = false;
}

// Next question
async function nextQuestion() {
    if (selectedAnswer === null) return;

    try {
        const response = await fetch(`/api/quizzes/${currentQuiz.id}/answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                questionIndex: currentQuestion,
                answer: selectedAnswer
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Show correct/wrong feedback
            const options = document.querySelectorAll('.option');
            options[selectedAnswer].classList.add(result.correct ? 'correct' : 'wrong');
            if (!result.correct) {
                options[result.correctAnswer].classList.add('correct');
            }
            
            // Update results
            quizResults[result.correct ? 'correct' : 'wrong']++;
            
            // Wait for animation
            setTimeout(() => {
                currentQuestion++;
                updateQuestionDisplay();
            }, 1000);
        } else {
            showError('Failed to submit answer');
        }
    } catch (error) {
        console.error('Error submitting answer:', error);
        showError('An error occurred while submitting your answer');
    }
}

// Timer functions
function startTimer() {
    quizStartTime = Date.now();
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const timeElapsed = Math.floor((Date.now() - quizStartTime) / 1000);
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// End quiz
async function endQuiz() {
    clearInterval(timerInterval);
    quizResults.timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
    
    try {
        const response = await fetch(`/api/quizzes/${currentQuiz.id}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(quizResults)
        });
        
        if (response.ok) {
            const data = await response.json();
            showResults(data);
        } else {
            showError('Failed to submit quiz results');
        }
    } catch (error) {
        console.error('Error completing quiz:', error);
        showError('An error occurred while completing the quiz');
    }
}

// Show results
function showResults(results) {
    document.querySelector('.quiz-interface').style.display = 'none';
    document.querySelector('.quiz-results').style.display = 'flex';
    
    const minutes = Math.floor(quizResults.timeTaken / 60);
    const seconds = quizResults.timeTaken % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('scorePercentage').textContent = 
        `${Math.round((quizResults.correct / questions.length) * 100)}%`;
    document.getElementById('correctAnswers').textContent = 
        `${quizResults.correct} Correct`;
    document.getElementById('wrongAnswers').textContent = 
        `${quizResults.wrong} Wrong`;
    document.getElementById('timeTaken').textContent = timeString;
    document.getElementById('pointsEarned').textContent = 
        `${results.pointsEarned} Points`;
}

// Review quiz
function reviewQuiz() {
    // Implement quiz review functionality
    showError('Quiz review feature coming soon!');
}

// Exit quiz
function exitQuiz() {
    document.querySelector('.quiz-selection').style.display = 'block';
    document.querySelector('.quiz-interface').style.display = 'none';
    document.querySelector('.quiz-results').style.display = 'none';
    
    currentQuiz = null;
    currentQuestion = 0;
    questions = [];
    selectedAnswer = null;
    clearInterval(timerInterval);
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

// Initialize
document.addEventListener('DOMContentLoaded', loadQuizzes); 