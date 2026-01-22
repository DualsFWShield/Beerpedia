/**
 * Beerdex Article Runtime
 * Handles interactions for standalone article pages.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Scroll Animations (Fade In)
    const elements = document.querySelectorAll('.fade-in, h3, p, ul, .article-image, .article-meta, .beer-signature, blockquote');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => {
        // Init styles if not set in CSS
        if (!el.classList.contains('article-container')) { // Container already has animation class
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        }
        observer.observe(el);
    });

    // 2. Back Button Validation
    const backBtn = document.querySelector('.icon-btn[aria-label="Retour"]');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            // Optional: Check if history exists, otherwise go to home
            if (document.referrer.includes('beerpedia.html')) {
                // Let default link work or use history.back()
                // e.preventDefault(); history.back(); 
                // Better to just let the link ../beerpedia.html work as it resets state cleanly
            }
        });
    }

    // 3. Image Zoom (Lightweight lightbox)
    document.querySelectorAll('.article-image img').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            if (img.classList.contains('zoomed')) {
                img.classList.remove('zoomed');
                img.style.transform = 'none';
                img.style.zIndex = '1';
                img.style.position = 'static';
                // Remove overlay
                const over = document.getElementById('zoom-overlay');
                if (over) over.remove();
            } else {
                // Create overlay
                const overlay = document.createElement('div');
                overlay.id = 'zoom-overlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100vw';
                overlay.style.height = '100vh';
                overlay.style.background = 'rgba(0,0,0,0.9)';
                overlay.style.zIndex = '9998';
                overlay.style.cursor = 'zoom-out';
                overlay.onclick = () => img.click();
                document.body.appendChild(overlay);

                img.classList.add('zoomed');
                img.style.position = 'fixed';
                img.style.top = '50%';
                img.style.left = '50%';
                img.style.transform = 'translate(-50%, -50%) scale(1)';
                img.style.maxWidth = '90vw';
                img.style.maxHeight = '90vh';
                img.style.zIndex = '9999';
                img.style.cursor = 'zoom-out';
            }
        });
    });
});
