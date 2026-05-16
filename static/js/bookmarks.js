function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function addBookmark(title, link, renderCallback) {
    let bookmarks = JSON.parse(localStorage.getItem('yogi_bookmarks') || '[]');
    if (!bookmarks.find(b => b.link === link)) {
        bookmarks.push({title, link});
        localStorage.setItem('yogi_bookmarks', JSON.stringify(bookmarks));
        
        // Dispatch custom event for UI feedback
        window.dispatchEvent(new CustomEvent('bookmark-added', { detail: { link } }));
    }
    if (renderCallback) renderCallback();
}

export function isBookmarked(link) {
    const bookmarks = JSON.parse(localStorage.getItem('yogi_bookmarks') || '[]');
    return !!bookmarks.find(b => b.link === link);
}

export function removeBookmark(link, renderCallback) {
    let bookmarks = JSON.parse(localStorage.getItem('yogi_bookmarks') || '[]');
    bookmarks = bookmarks.filter(b => b.link !== link);
    localStorage.setItem('yogi_bookmarks', JSON.stringify(bookmarks));
    
    // Dispatch custom event for UI feedback
    window.dispatchEvent(new CustomEvent('bookmark-removed', { detail: { link } }));
    
    if (renderCallback) renderCallback();
}

export function renderBookmarks(containerId) {
    const list = document.getElementById(containerId);
    if (!list) return;
    const bookmarks = JSON.parse(localStorage.getItem('yogi_bookmarks') || '[]');
    if (bookmarks.length === 0) {
        list.innerHTML = `<div class="empty-state"><span>🔖</span><p>No bookmarks yet.<br>Save GfG links here!</p></div>`;
        return;
    }
    list.innerHTML = bookmarks.map(b => `
        <div class="bookmark-item">
            <a href="${b.link}" target="_blank">${escapeHtml(b.title)}</a>
            <button class="bookmark-remove" onclick="window.removeBookmark('${b.link.replace(/'/g, "\\'")}')" title="Remove bookmark">✕</button>
        </div>`).join('');
}
