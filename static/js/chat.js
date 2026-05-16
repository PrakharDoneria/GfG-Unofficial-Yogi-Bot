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

    const menuToggle     = document.getElementById('menu-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const appShell       = document.querySelector('.app-shell');

    let selectedModel = 'sarvam-m';   // default: Fast
    let isStreaming   = false;
    let chatId = null;

    // Load chatId from URL if present
    const pathMatches = window.location.pathname.match(/\/c\/([a-zA-Z0-9_-]+)/);
    if (pathMatches && pathMatches[1]) {
        chatId = pathMatches[1];
    }

    // Bookmarking logic
    window.addBookmark = function(title, link) {
        let bookmarks = JSON.parse(localStorage.getItem('yogi_bookmarks') || '[]');
        if (!bookmarks.find(b => b.link === link)) {
            bookmarks.push({title, link});
            localStorage.setItem('yogi_bookmarks', JSON.stringify(bookmarks));
        }
        renderBookmarks();
    };

    window.removeBookmark = function(link) {
        let bookmarks = JSON.parse(localStorage.getItem('yogi_bookmarks') || '[]');
        bookmarks = bookmarks.filter(b => b.link !== link);
        localStorage.setItem('yogi_bookmarks', JSON.stringify(bookmarks));
        renderBookmarks();
    };

    function renderBookmarks() {
        const list = document.getElementById('bookmarks-list');
        if (!list) return;
        const bookmarks = JSON.parse(localStorage.getItem('yogi_bookmarks') || '[]');
        if (bookmarks.length === 0) {
            list.innerHTML = `<div class="empty-state"><span>🔖</span><p>No bookmarks yet.<br>Save GfG links here!</p></div>`;
            return;
        }
        list.innerHTML = bookmarks.map(b => `
            <div class="bookmark-item">
                <a href="${b.link}" target="_blank">${b.title}</a>
                <button class="bookmark-remove" onclick="window.removeBookmark('${b.link.replace(/'/g, "\\'")}')">✕</button>
            </div>`).join('');
    }

    function renderHistoryList() {
        const list = document.getElementById('history-list');
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
            const isCurrent = id === chatId;
            return `<a href="/c/${id}" class="history-item${isCurrent ? ' active' : ''}">
                <span class="history-item-icon">${isCurrent ? '💬' : '🗨️'}</span>
                <span class="history-item-text">${preview}</span>
            </a>`;
        }).join('');
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
            if (target === 'history') renderHistoryList();
            if (target === 'bookmarks') renderBookmarks();
        });
    });

    function generateId() {
        return Math.random().toString(36).substring(2, 15);
    }

    function saveHistory(role, content) {
        if (window.isWidget) return;
        if (!chatId) {
            chatId = generateId();
            window.history.pushState({}, '', '/c/' + chatId);
        }
        let history = JSON.parse(localStorage.getItem('yogi_chats') || '{}');
        if (!history[chatId]) history[chatId] = { messages: [] };
        history[chatId].messages.push({ role, content });
        localStorage.setItem('yogi_chats', JSON.stringify(history));
    }

    function loadHistory() {
        if (window.isWidget || !chatId) return;
        let history = JSON.parse(localStorage.getItem('yogi_chats') || '{}');
        let chat = history[chatId];
        if (chat && chat.messages) {
            const welcomeCard = chatMessages.querySelector('.welcome-card');
            if (welcomeCard) welcomeCard.remove();
            
            chat.messages.forEach(msg => {
                if (msg.role === 'user') {
                    addUserMessage(msg.content, false);
                } else {
                    // Bot message rendering (simplified for loaded history)
                    const botId = createBotBubble();
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
        // Sync both sets of pills
        modelPills.forEach(p => p.classList.toggle('active', p.dataset.model === model));
        mobilePills.forEach(p => p.classList.toggle('active', p.dataset.model === model));
        if (topbarBadge) {
            topbarBadge.textContent = isfast ? '⚡ Fast Mode' : '🧠 Reasoning Mode';
            topbarBadge.classList.toggle('fast-mode', isfast);
            topbarBadge.classList.add('fast-mode-glow');
            setTimeout(() => topbarBadge.classList.remove('fast-mode-glow'), 2000);
        }
    }

    // Initialize UI state
    setModel(selectedModel);
    loadHistory();

    /* ── Desktop model pills ── */
    modelPills.forEach(pill => {
        pill.addEventListener('click', () => {
            if (!isStreaming) setModel(pill.dataset.model);
        });
    });

    /* ── Mobile model pills ── */
    mobilePills.forEach(pill => {
        pill.addEventListener('click', () => {
            if (!isStreaming) setModel(pill.dataset.model);
        });
    });

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

    // Close sidebar on mobile when an action item is clicked (but not when switching tabs)
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

    /* ── Clear chat ── */
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (isStreaming) return;
            chatMessages.innerHTML = '';
            if (chatId) {
                let history = JSON.parse(localStorage.getItem('yogi_chats') || '{}');
                delete history[chatId];
                localStorage.setItem('yogi_chats', JSON.stringify(history));
                chatId = null;
                window.history.pushState({}, '', '/');
            }
        });
    }

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

            addUserMessage(message, true);

            const botId = createBotBubble();
            const botEl = document.getElementById(botId);
            const thinkingSection  = botEl.querySelector('.thinking-section');
            const thinkingContent  = botEl.querySelector('.thinking-content');
            const thinkingToggle   = botEl.querySelector('.thinking-toggle');
            const thinkingBody     = botEl.querySelector('.thinking-body');
            const answerEl         = botEl.querySelector('.answer-content');

            let thinkingText = '';
            let answerText   = '';
            let answerStarted = false;
            let fullHtmlSaved = ''; // To save final formatted HTML

            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, model: selectedModel }),
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
                                chatMessages.scrollTop = chatMessages.scrollHeight;

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
                
                // Save bot response HTML
                saveHistory('bot', botEl.querySelector('.bubble').innerHTML);

            } catch (err) {
                const typingEl = botEl.querySelector('.typing-indicator');
                if (typingEl) typingEl.remove();
                answerEl.innerHTML = `<span class="error-text">⚠️ Connection lost: ${err.message}</span>`;
                saveHistory('bot', answerEl.innerHTML);
            } finally {
                isStreaming = false;
                document.getElementById('send-btn').disabled = false;
            }
        });
    }

    function createBotBubble() {
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
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    function addUserMessage(text, save = true) {
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
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (save) saveHistory('user', text);
    }
});
