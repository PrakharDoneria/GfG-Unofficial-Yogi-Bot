export function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

export function saveHistory(chatId, role, content, rawContent = null) {
    if (window.isWidget) return;
    let history = JSON.parse(localStorage.getItem('yogi_chats') || '{}');
    if (!history[chatId]) history[chatId] = { messages: [] };
    history[chatId].messages.push({ 
        role, 
        content, 
        raw: rawContent || content 
    });
    localStorage.setItem('yogi_chats', JSON.stringify(history));
}

export function clearHistory(chatId) {
    if (chatId) {
        let history = JSON.parse(localStorage.getItem('yogi_chats') || '{}');
        delete history[chatId];
        localStorage.setItem('yogi_chats', JSON.stringify(history));
    }
}

export function renderHistoryList(containerId, currentChatId) {
    const list = document.getElementById(containerId);
    if (!list) return;
    const chats = JSON.parse(localStorage.getItem('yogi_chats') || '{}');
    const ids = Object.keys(chats);
    if (ids.length === 0) {
        list.innerHTML = `<div class="empty-state"><span>🗨️</span><p>No past chats yet.<br>Start a conversation!</p></div>`;
        return;
    }
    list.innerHTML = ids.reverse().map(id => {
        const first = chats[id].messages.find(m => m.role === 'user');
        const preview = first ? first.content.slice(0, 50) : 'Chat ' + id.slice(0,6);
        const isCurrent = id === currentChatId;
        return `<a href="/c/${id}" class="history-item${isCurrent ? ' active' : ''}">
            <span class="history-item-icon">${isCurrent ? '💬' : '🗨️'}</span>
            <span class="history-item-text">${preview}</span>
        </a>`;
    }).join('');
}

export function getChatHistory(chatId) {
    if (!chatId) return null;
    let history = JSON.parse(localStorage.getItem('yogi_chats') || '{}');
    return history[chatId];
}
