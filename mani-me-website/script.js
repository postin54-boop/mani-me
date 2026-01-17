// Mani Me Website - JavaScript

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navCta = document.querySelector('.nav-cta');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // Toggle mobile menu visibility
            if (navLinks) {
                navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.backgroundColor = 'white';
                navLinks.style.padding = '16px';
                navLinks.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            } else {
                navbar.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
            }
        });
    }

    // Animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards and steps
    document.querySelectorAll('.feature-card, .step, .contact-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
});

// Cookie consent banner (if needed)
function showCookieConsent() {
    if (!localStorage.getItem('cookieConsent')) {
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.innerHTML = `
            <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #0B1A33; color: white; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; z-index: 9999;">
                <p style="margin: 0; flex: 1;">We use cookies to improve your experience. By continuing to use our site, you agree to our <a href="cookies.html" style="color: #83C5FA;">Cookie Policy</a>.</p>
                <div style="display: flex; gap: 12px;">
                    <button onclick="acceptCookies()" style="background: #83C5FA; color: #0B1A33; border: none; padding: 8px 24px; border-radius: 6px; cursor: pointer; font-weight: 600;">Accept</button>
                    <button onclick="declineCookies()" style="background: transparent; color: white; border: 1px solid white; padding: 8px 24px; border-radius: 6px; cursor: pointer;">Decline</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);
    }
}

function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    document.getElementById('cookie-banner')?.remove();
}

function declineCookies() {
    localStorage.setItem('cookieConsent', 'declined');
    document.getElementById('cookie-banner')?.remove();
}

// Show cookie consent on page load
document.addEventListener('DOMContentLoaded', showCookieConsent);
