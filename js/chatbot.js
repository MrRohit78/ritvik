// Chatbot state
let isOpen = false;

// DOM Elements
const chatbotContainer = document.getElementById('chatbot-container');
const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotInput = document.getElementById('chatbot-input-field');
const toggleText = document.getElementById('chatbot-toggle-text');

// Toggle chat window
function toggleChat() {
    isOpen = !isOpen;
    chatbotContainer.style.display = isOpen ? 'block' : 'none';
    toggleText.textContent = isOpen ? 'Close Chat' : 'Need Help?';
}

// Add a message to the chat
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            ${text}
        </div>
    `;
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Send message to backend
async function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, true);
    chatbotInput.value = '';

    try {
        // Show loading message
        const loadingId = showLoading();

        // Send message to backend
        const response = await fetch('/api/chatbot/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        // Remove loading message
        hideLoading(loadingId);

        if (!response.ok) {
            throw new Error('Failed to get response');
        }

        const data = await response.json();
        addMessage(data.message);
    } catch (error) {
        console.error('Error:', error);
        addMessage('Sorry, I encountered an error. Please try again.');
    }
}

// Show loading animation
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message loading';
    loadingDiv.innerHTML = '<div class="loading-dots"><span>.</span><span>.</span><span>.</span></div>';
    chatbotMessages.appendChild(loadingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return loadingDiv.id;
}

// Hide loading animation
function hideLoading(id) {
    const loadingDiv = document.getElementById(id);
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize chatbot
    chatbotContainer.style.display = 'none';

    // Handle enter key in input
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Add welcome message
    addMessage('Hello! How can I help you with your language learning today?');
}); 