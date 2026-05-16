import { addBookmark, removeBookmark, renderBookmarks } from './bookmarks.js';
import { generateId, saveHistory, getChatHistory, clearHistory, renderHistoryList } from './history.js';
import { createBotBubble, addUserMessage } from './ui.js';

// Expose bookmark functions globally for inline HTML event handlers
window.addBookmark = (title, link) => addBookmark(title, link, () => renderBookmarks('bookmarks-list'));
window.removeBookmark = (link) => removeBookmark(link, () => renderBookmarks('bookmarks-list'));

document.addEventListener('DOMContentLoaded', () => {
    const chatForm       = document.getElementById('chat-form');
    const userInput      = document.getElementById('user-input');
    const chatMessages   = document.getElementById('chat-messages');
    const modelPills     = document.querySelectorAll('.model-pill');
    const mobilePills    = document.querySelectorAll('.mobile-pill');
    const topbarBadge    = document.getElementById('topbar-model-badge');
    const clearBtn       = document.getElementById('clear-chat-btn');
    const quickChips     = document.querySelectorAll('.quick-chip');
    const mobileChips    = document.querySelectorAll('.mobile-chip');
    
    const modelDropdown    = document.getElementById('model-dropdown');
    const modelDropBtn     = document.getElementById('model-selected-display');
    const modelOptions     = document.querySelectorAll('.model-option');
    const modelSelectedIcon = document.querySelector('.model-selected-icon');

    const menuToggle     = document.getElementById('menu-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const appShell       = document.querySelector('.app-shell');
    const newChatSidebar = document.getElementById('new-chat-sidebar');
    const newChatTopbar  = document.getElementById('new-chat-topbar');

    let selectedModel = 'sarvam-m';   // default: Fast
    let isStreaming   = false;
    let chatId = null;

    // Load chatId from URL if present
    const pathMatches = window.location.pathname.match(/\/c\/([a-zA-Z0-9_-]+)/);
    if (pathMatches && pathMatches[1]) {
        chatId = pathMatches[1];
    }

    // Sidebar tab switching
    const sidebarTabs = document.querySelectorAll('.sidebar-tab');
    sidebarTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sidebarTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.add('hidden'));
            const panel = document.getElementById('panel-' + target);
            if (panel) panel.classList.remove('hidden');
            if (target === 'history') renderHistoryList('history-list', chatId);
            if (target === 'bookmarks') renderBookmarks('bookmarks-list');
        });
    });

    function loadHistoryUI() {
        if (window.isWidget || !chatId) return;
        const chat = getChatHistory(chatId);
        if (chat && chat.messages) {
            const welcomeCard = chatMessages.querySelector('.welcome-card');
            if (welcomeCard) welcomeCard.remove();
            
            chat.messages.forEach(msg => {
                if (msg.role === 'user') {
                    addUserMessage(chatMessages, msg.content);
                } else {
                    const botId = createBotBubble(chatMessages);
                    const botEl = document.getElementById(botId);
                    botEl.querySelector('.typing-indicator').remove();
                    botEl.querySelector('.answer-content').innerHTML = msg.content;
                }
            });
        }
    }

    // ── Shared model-switch ──
    function setModel(model) {
        selectedModel = model;
        const isfast = model === 'sarvam-m';
        
        // Update dropdown UI
        modelOptions.forEach(opt => opt.classList.toggle('active', opt.dataset.model === model));
        if (modelSelectedIcon) {
            modelSelectedIcon.textContent = isfast ? '⚡' : '🧠';
        }

        if (topbarBadge) {
            topbarBadge.textContent = isfast ? '⚡ Fast Mode' : '🧠 Reasoning Mode';
            topbarBadge.classList.toggle('fast-mode', isfast);
            topbarBadge.classList.add('fast-mode-glow');
            setTimeout(() => topbarBadge.classList.remove('fast-mode-glow'), 2000);
        }
    }

    // Initial load
    setModel(selectedModel);
    loadHistoryUI();

    /* ── Model Dropdown Logic ── */
    if (modelDropBtn && modelDropdown) {
        modelDropBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modelDropdown.classList.toggle('active');
        });

        modelOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                if (!isStreaming) {
                    setModel(opt.dataset.model);
                    modelDropdown.classList.remove('active');
                }
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            modelDropdown.classList.remove('active');
        });
    }

    /* ── Desktop quick chips ── */
    quickChips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (isStreaming) return;
            userInput.value = chip.dataset.prompt;
            userInput.focus();
        });
    });

    /* ── Mobile Sidebar Toggle ── */
    if (menuToggle && sidebarOverlay) {
        menuToggle.addEventListener('click', () => {
            appShell.classList.toggle('sidebar-open');
            sidebarOverlay.classList.toggle('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            appShell.classList.remove('sidebar-open');
            sidebarOverlay.classList.remove('active');
        });
    }

    // Close sidebar on mobile when an action item is clicked
    document.querySelectorAll('.history-item, .quick-chip').forEach(el => {
        el.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                appShell.classList.remove('sidebar-open');
                sidebarOverlay.classList.remove('active');
            }
        });
    });

    /* ── Mobile quick chips ── */
    mobileChips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (isStreaming) return;
            userInput.value = chip.dataset.prompt;
            userInput.focus();
            userInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
    });

    /* ── Reset / New Chat Logic ── */
    const resetChat = () => {
        if (isStreaming) return;
        
        // Clear UI
        chatMessages.innerHTML = `
            <div class="welcome-card">
                <div class="welcome-orb-mini">🧘‍♂️</div>
                <h2>Hello, Seeker!</h2>
                <p>I'm Yogi Bot, your unofficial GeeksforGeeks AI companion. Ask me anything about <strong>DSA</strong>, <strong>coding</strong>, <strong>system design</strong>, or any tech concept.</p>
                <div class="welcome-chips">
                    <span class="w-chip">💡 Explains concepts</span>
                    <span class="w-chip">🔗 Links GfG resources</span>
                    <span class="w-chip">⚡ Two modes</span>
                </div>
            </div>
        `;
        
        // Reset State
        chatId = null;
        window.history.pushState({}, '', '/');
        
        // Close sidebar on mobile if open
        if (window.innerWidth <= 768) {
            appShell.classList.remove('sidebar-open');
            sidebarOverlay.classList.remove('active');
        }
    };

    if (newChatSidebar) newChatSidebar.addEventListener('click', resetChat);
    if (newChatTopbar) newChatTopbar.addEventListener('click', resetChat);
    if (clearBtn) clearBtn.addEventListener('click', () => {
        if (isStreaming) return;
        if (chatId) clearHistory(chatId);
        resetChat();
    });

    /* ── Submit ── */
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = userInput.value.trim();
            if (!message || isStreaming) return;

            isStreaming = true;
            document.getElementById('send-btn').disabled = true;
            userInput.value = '';

            const welcomeCard = chatMessages.querySelector('.welcome-card');
            if (welcomeCard) welcomeCard.remove();

            if (!chatId) {
                chatId = generateId();
                window.history.pushState({}, '', '/c/' + chatId);
            }

            addUserMessage(chatMessages, message);
            saveHistory(chatId, 'user', message);

            const botId = createBotBubble(chatMessages);
            const botEl = document.getElementById(botId);
            
            // Initial scroll to user message
            botEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

            const thinkingSection  = botEl.querySelector('.thinking-section');
            const thinkingContent  = botEl.querySelector('.thinking-content');
            const thinkingToggle   = botEl.querySelector('.thinking-toggle');
            const thinkingBody     = botEl.querySelector('.thinking-body');
            const answerEl         = botEl.querySelector('.answer-content');

            let thinkingText = '';
            let answerText   = '';
            let answerStarted = false;

            try {
                // Prepare history for the API call
                const chatHistory = getChatHistory(chatId);
                const apiHistory = chatHistory ? chatHistory.messages.map(m => ({
                    role: m.role === 'bot' ? 'assistant' : 'user',
                    content: m.raw || m.content
                })) : [];

                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message, 
                        model: selectedModel,
                        history: apiHistory 
                    }),
                });

                if (!response.ok) throw new Error(`Server error: ${response.status}`);

                const reader  = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer    = '';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); 

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const dataStr = line.slice(6).trim();
                        if (dataStr === '[DONE]') continue;

                        try {
                            const data = JSON.parse(dataStr);

                            if (data.type === 'thinking' && data.content) {
                                thinkingText += data.content;
                                thinkingSection.style.display = 'block';
                                thinkingContent.textContent = thinkingText;
                                chatMessages.scrollTop = chatMessages.scrollHeight;

                            } else if (data.type === 'answer' && data.content) {
                                if (!answerStarted) {
                                    answerStarted = true;
                                    const typingEl = botEl.querySelector('.typing-indicator');
                                    if (typingEl) typingEl.remove();
                                    if (thinkingBody) thinkingBody.style.display = 'none';
                                    if (thinkingToggle) thinkingToggle.classList.add('collapsed');
                                }
                                answerText += data.content;
                                answerEl.innerHTML = marked.parse(answerText);
                                
                                // Smart scroll: follow content if at bottom
                                const isAtBottom = (chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight) < 100;
                                if (isAtBottom) {
                                    chatMessages.scrollTop = chatMessages.scrollHeight;
                                }
                            } else if (data.type === 'references' && data.links) {
                                const typingEl = botEl.querySelector('.typing-indicator');
                                if (typingEl) typingEl.remove();

                                const refBox = document.createElement('div');
                                refBox.className = 'references-box';
                                refBox.innerHTML = `
                                    <div class="ref-header">
                                        <div class="ref-header-icon">🔗</div>
                                        <div class="ref-header-text">
                                            <span class="ref-header-title">GeeksforGeeks Resources</span>
                                            <span class="ref-header-sub">${data.links.length} article${data.links.length > 1 ? 's' : ''} found for you</span>
                                        </div>
                                    </div>
                                    <ul class="ref-list">
                                        ${data.links.map(link => `
                                            <li>
                                                <div class="ref-link-wrap">
                                                    <img class="ref-favicon" src="https://www.google.com/s2/favicons?sz=32&domain=geeksforgeeks.org" alt="GfG">
                                                    <a href="${link.link}" target="_blank" rel="noopener">${link.title}</a>
                                                </div>
                                                <div class="ref-actions">
                                                    <button class="bookmark-btn" onclick="window.addBookmark('${link.title.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', '${link.link}')" title="Save bookmark">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                                                        Save
                                                    </button>
                                                    <a class="ref-open-btn" href="${link.link}" target="_blank" rel="noopener" title="Open article">
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                                    </a>
                                                </div>
                                            </li>
                                        `).join('')}
                                    </ul>
                                `;
                                botEl.querySelector('.bubble').appendChild(refBox);
                                chatMessages.scrollTop = chatMessages.scrollHeight;

                            } else if (data.type === 'error') {
                                const typingEl = botEl.querySelector('.typing-indicator');
                                if (typingEl) typingEl.remove();
                                answerEl.innerHTML = `<span class="error-text">⚠️ ${data.error}</span>`;
                            }
                        } catch (_) {}
                    }
                }

                if (!answerStarted) {
                    const typingEl = botEl.querySelector('.typing-indicator');
                    if (typingEl) typingEl.remove();
                    if (!answerEl.innerHTML.trim()) {
                        answerEl.innerHTML = '<span class="error-text">Yogi received no answer from the model. Please try again.</span>';
                    }
                }
                
                saveHistory(chatId, 'bot', botEl.querySelector('.bubble').innerHTML, answerText);

            } catch (err) {
                const typingEl = botEl.querySelector('.typing-indicator');
                if (typingEl) typingEl.remove();
                answerEl.innerHTML = `<span class="error-text">⚠️ Connection lost: ${err.message}</span>`;
                saveHistory(chatId, 'bot', answerEl.innerHTML);
            } finally {
                isStreaming = false;
                document.getElementById('send-btn').disabled = false;
            }
        });
    }
});

