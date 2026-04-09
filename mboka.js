(function () {
    'use strict';

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function getContent() {
        if (!window.MBOKA_CONTENT || typeof window.MBOKA_CONTENT !== 'object') {
            return { videos: [], gallery: [] };
        }
        return {
            videos: safeArray(window.MBOKA_CONTENT.videos),
            gallery: safeArray(window.MBOKA_CONTENT.gallery)
        };
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getYouTubeId(url) {
        if (!url || typeof url !== 'string') return null;
        const trimmed = url.trim();
        if (!trimmed) return null;

        try {
            const parsed = new URL(trimmed);
            if (parsed.hostname.includes('youtube.com')) {
                const id = parsed.searchParams.get('v');
                return id || null;
            }
            if (parsed.hostname.includes('youtu.be')) {
                const id = parsed.pathname.replace('/', '').trim();
                return id || null;
            }
        } catch (error) {
            return null;
        }

        return null;
    }

    function getEmbedUrl(youtubeUrl) {
        const id = getYouTubeId(youtubeUrl);
        if (!id) return null;
        return `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
    }

    function renderEmptyState(container, message) {
        if (!container) return;
        container.innerHTML = `<div class="mboka-empty">${escapeHtml(message)}</div>`;
    }

    function renderVideos() {
        const container = document.getElementById('mboka-video-grid');
        if (!container) return;

        const content = getContent();
        const validVideos = content.videos.filter((item) => {
            if (!item || typeof item !== 'object') return false;
            return Boolean(item.id && item.title && item.artist && item.previewGif && getEmbedUrl(item.youtubeUrl));
        });

        if (validVideos.length === 0) {
            renderEmptyState(container, 'Videos coming soon. Add entries in mboka-content.js.');
            return;
        }

        container.innerHTML = validVideos.map((item) => {
            return `
                <article class="mboka-video-card" data-video-id="${escapeHtml(item.id)}">
                    <div class="mboka-video-preview-wrap">
                        <img src="${escapeHtml(item.previewGif)}" alt="${escapeHtml(item.alt || item.title)}" class="mboka-video-preview" loading="lazy">
                    </div>
                    <div class="mboka-video-meta">
                        <h3 class="mboka-video-title">${escapeHtml(item.title)}</h3>
                        <p class="mboka-video-artist">${escapeHtml(item.artist)}</p>
                        <button class="mboka-watch-btn" type="button" data-youtube-url="${escapeHtml(item.youtubeUrl)}">Watch</button>
                    </div>
                </article>
            `;
        }).join('');
    }

    function renderGallery() {
        const container = document.getElementById('mboka-gallery-grid');
        if (!container) return;

        const content = getContent();
        const validGallery = content.gallery.filter((item) => {
            if (!item || typeof item !== 'object') return false;
            return Boolean(item.id && item.src && item.alt);
        });

        if (validGallery.length === 0) {
            renderEmptyState(container, 'Gallery coming soon. Add entries in mboka-content.js.');
            return;
        }

        container.innerHTML = validGallery.map((item) => {
            const caption = item.caption ? `<figcaption class="mboka-gallery-caption">${escapeHtml(item.caption)}</figcaption>` : '';
            return `
                <figure class="mboka-gallery-item" data-gallery-id="${escapeHtml(item.id)}">
                    <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" loading="lazy">
                    ${caption}
                </figure>
            `;
        }).join('');
    }

    function initVideoModal() {
        const modal = document.getElementById('mboka-video-modal');
        const frame = document.getElementById('mboka-video-frame');
        const closeBtn = document.getElementById('mboka-video-close');
        const grid = document.getElementById('mboka-video-grid');
        if (!modal || !frame || !closeBtn || !grid) return;

        let lastTrigger = null;
        let previousFocusedElement = null;

        function getFocusableElements() {
            return modal.querySelectorAll(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
        }

        function closeModal() {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
            frame.src = '';
            document.body.style.overflow = '';
            const returnTarget = lastTrigger || previousFocusedElement;
            if (returnTarget && typeof returnTarget.focus === 'function') {
                returnTarget.focus();
            }
            previousFocusedElement = null;
        }

        function openModal(embedUrl, trigger) {
            if (!embedUrl) return;
            previousFocusedElement = document.activeElement;
            lastTrigger = trigger || null;
            frame.src = embedUrl;
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            closeBtn.focus();
        }

        grid.addEventListener('click', (event) => {
            const btn = event.target.closest('.mboka-watch-btn');
            if (!btn) return;
            const embedUrl = getEmbedUrl(btn.getAttribute('data-youtube-url'));
            if (!embedUrl) return;
            openModal(embedUrl, btn);
        });

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.classList.contains('mboka-video-modal-backdrop')) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (!modal.classList.contains('show')) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                closeModal();
                return;
            }

            if (event.key === 'Tab') {
                const focusables = getFocusableElements();
                if (!focusables.length) return;

                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });
    }

    function init() {
        renderVideos();
        renderGallery();
        initVideoModal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
