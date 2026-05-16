(function() {
    // Create the widget button
    const btn = document.createElement('div');
    btn.innerHTML = '🧘‍♂️';
    btn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:60px;height:60px;background:#2F8D46;border-radius:50%;color:white;font-size:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:999999;transition:transform 0.2s;';

    // Create the iframe container
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;bottom:90px;right:20px;width:380px;height:600px;max-height:80vh;max-width:90vw;background:transparent;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:999999;display:none;overflow:hidden;border:1px solid rgba(255,255,255,0.1);';
    
    // Determine the host script URL to set iframe src correctly
    const scriptTag = document.currentScript || (function() {
        const scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();
    const scriptUrl = new URL(scriptTag.src);
    const host = scriptUrl.origin;

    const iframe = document.createElement('iframe');
    iframe.src = `${host}/widget`;
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    container.appendChild(iframe);

    document.body.appendChild(btn);
    document.body.appendChild(container);

    let isOpen = false;
    btn.addEventListener('click', () => {
        isOpen = !isOpen;
        container.style.display = isOpen ? 'block' : 'none';
        btn.style.transform = isOpen ? 'scale(0.9)' : 'scale(1)';
        btn.innerHTML = isOpen ? '<span style="font-family:sans-serif;font-size:24px;">✕</span>' : '🧘‍♂️';
    });
})();
