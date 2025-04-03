// State management
let currentDeck = null;
let currentCard = 0;
let cards = [];
let studyStats = {
    correct: 0,
    wrong: 0
};

// Load decks from API or localStorage
async function loadDecks() {
    try {
        const response = await fetch('/api/flashcards/decks', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const decks = await response.json();
            updateDeckGrid(decks);
        } else {
            showError('Failed to load flashcard decks');
        }
    } catch (error) {
        console.error('Error loading decks:', error);
        showError('An error occurred while loading decks');
    }
}

// Update deck grid
function updateDeckGrid(decks) {
    const deckGrid = document.querySelector('.deck-grid');
    deckGrid.innerHTML = decks.map(deck => createDeckCard(deck)).join('');
}

// Create deck card HTML
function createDeckCard(deck) {
    return `
        <div class="deck-card" onclick="startStudySession('${deck.id}')">
            <div class="deck-info">
                <h3 class="deck-title">${deck.title}</h3>
                <span class="deck-language">${deck.language}</span>
            </div>
            <div class="deck-stats">
                <div class="deck-stat">
                    <i class="fas fa-layer-group"></i>
                    <span>${deck.totalCards} cards</span>
                </div>
                <div class="deck-stat">
                    <i class="fas fa-chart-line"></i>
                    <span>${deck.mastery}% mastery</span>
                </div>
            </div>
        </div>
    `;
}

// Start study session
async function startStudySession(deckId) {
    try {
        const response = await fetch(`/api/flashcards/decks/${deckId}/cards`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentDeck = data.deck;
            cards = data.cards;
            currentCard = 0;
            studyStats = { correct: 0, wrong: 0 };
            
            // Show study interface
            document.querySelector('.deck-management').style.display = 'none';
            document.querySelector('.study-interface').style.display = 'block';
            
            updateCardDisplay();
        } else {
            showError('Failed to load flashcards');
        }
    } catch (error) {
        console.error('Error starting study session:', error);
        showError('An error occurred while loading flashcards');
    }
}

// Update card display
function updateCardDisplay() {
    if (currentCard >= cards.length) {
        showStudyComplete();
        return;
    }

    const card = cards[currentCard];
    document.querySelector('.flashcard-front .card-text').textContent = card.front;
    document.querySelector('.flashcard-back .card-text').textContent = card.back;
    document.querySelector('.flashcard').classList.remove('flipped');
    
    // Update progress
    const progress = ((currentCard + 1) / cards.length) * 100;
    document.querySelector('.progress').style.width = `${progress}%`;
    document.getElementById('cardProgress').textContent = `Card ${currentCard + 1}/${cards.length}`;
}

// Flip card
function flipCard() {
    document.querySelector('.flashcard').classList.toggle('flipped');
}

// Mark card as correct/wrong
async function markCard(result) {
    if (currentCard >= cards.length) return;

    studyStats[result]++;
    
    try {
        await fetch(`/api/flashcards/cards/${cards[currentCard].id}/mark`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ result })
        });
        
        currentCard++;
        updateCardDisplay();
    } catch (error) {
        console.error('Error marking card:', error);
        showError('Failed to save progress');
    }
}

// Show study complete screen
function showStudyComplete() {
    const accuracy = Math.round((studyStats.correct / cards.length) * 100);
    
    document.querySelector('.study-interface').innerHTML = `
        <div class="study-complete">
            <h2>Session Complete!</h2>
            <div class="stats">
                <div class="stat">
                    <i class="fas fa-check"></i>
                    <span>${studyStats.correct} Correct</span>
                </div>
                <div class="stat">
                    <i class="fas fa-times"></i>
                    <span>${studyStats.wrong} Wrong</span>
                </div>
                <div class="stat">
                    <i class="fas fa-percentage"></i>
                    <span>${accuracy}% Accuracy</span>
                </div>
            </div>
            <button class="btn btn-primary" onclick="exitStudyMode()">
                Back to Decks
            </button>
        </div>
    `;
}

// Exit study mode
function exitStudyMode() {
    document.querySelector('.deck-management').style.display = 'block';
    document.querySelector('.study-interface').style.display = 'none';
    currentDeck = null;
    currentCard = 0;
    cards = [];
}

// Modal functions
function showCreateDeckModal() {
    document.getElementById('createDeckModal').classList.add('active');
}

function closeModal() {
    document.getElementById('createDeckModal').classList.remove('active');
}

// Add card input
function addCard() {
    const cardsList = document.getElementById('cardsList');
    const cardInput = document.createElement('div');
    cardInput.className = 'card-input';
    cardInput.innerHTML = `
        <input type="text" placeholder="Front (Question)" required>
        <input type="text" placeholder="Back (Answer)" required>
        <button type="button" class="btn btn-outline btn-small" onclick="removeCard(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    cardsList.appendChild(cardInput);
}

// Remove card input
function removeCard(button) {
    button.parentElement.remove();
}

// Create deck form submission
document.getElementById('createDeckForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('deckTitle').value;
    const language = document.getElementById('deckLanguage').value;
    const cardInputs = document.querySelectorAll('.card-input');
    
    const cards = Array.from(cardInputs).map(input => ({
        front: input.children[0].value,
        back: input.children[1].value
    }));
    
    try {
        const response = await fetch('/api/flashcards/decks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, language, cards })
        });
        
        if (response.ok) {
            closeModal();
            loadDecks();
            e.target.reset();
        } else {
            const data = await response.json();
            showError(data.message || 'Failed to create deck');
        }
    } catch (error) {
        console.error('Error creating deck:', error);
        showError('An error occurred while creating the deck');
    }
});

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
document.addEventListener('DOMContentLoaded', loadDecks); 