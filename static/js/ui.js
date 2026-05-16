export function createBotBubble(chatMessagesElement) {
    const id = 'bot-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.id = id;
    msgDiv.className = 'message bot-message';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = 'Y';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const thinkingSection = document.createElement('div');
    thinkingSection.className = 'thinking-section';
    thinkingSection.style.display = 'none';

    const thinkingToggle = document.createElement('button');
    thinkingToggle.className = 'thinking-toggle';
    thinkingToggle.innerHTML = `
        <span style="font-size:0.95rem">🧠</span>
        <span class="thinking-label">Reasoning</span>
        <span class="toggle-arrow">▲</span>`;
    thinkingToggle.addEventListener('click', () => {
        const body = thinkingSection.querySelector('.thinking-body');
        const hidden = body.style.display === 'none';
        body.style.display = hidden ? 'block' : 'none';
        thinkingToggle.classList.toggle('collapsed', !hidden);
    });

    const thinkingBody = document.createElement('div');
    thinkingBody.className = 'thinking-body';

    const thinkingContent = document.createElement('div');
    thinkingContent.className = 'thinking-content';

    thinkingBody.appendChild(thinkingContent);
    thinkingSection.appendChild(thinkingToggle);
    thinkingSection.appendChild(thinkingBody);

    const bubbleContent = document.createElement('div');
    bubbleContent.className = 'bubble-content';

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
        <div class="typing-dots">
            <span></span><span></span><span></span>
        </div>
        <span>Yogi is thinking…</span>`;

    const answerContent = document.createElement('div');
    answerContent.className = 'answer-content';

    bubbleContent.appendChild(typingIndicator);
    bubbleContent.appendChild(answerContent);

    bubble.appendChild(thinkingSection);
    bubble.appendChild(bubbleContent);

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);
    chatMessagesElement.appendChild(msgDiv);
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
    return id;
}

export function addUserMessage(chatMessagesElement, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user-message';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = 'U';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const content = document.createElement('div');
    content.className = 'bubble-content';
    content.textContent = text;

    bubble.appendChild(content);
    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);
    chatMessagesElement.appendChild(msgDiv);
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
}
