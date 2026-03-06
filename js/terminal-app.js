/**
 * terminal-app.js
 * Sarvesh Bhatnagar Portfolio — Terminal Aesthetic
 * Vanilla JS: typed text animation, mobile nav, active nav states
 */

/* -------------------------------------------------------
   Typed Text Animation
------------------------------------------------------- */
(function initTyped() {
  const el = document.getElementById('typed-text');
  if (!el) return;

  const phrases = [
    'SDE @ Amazon',
    'Serverless Researcher',
    'ML Infrastructure Engineer',
    'Open Source Contributor',
    'Algorithm Enthusiast'
  ];

  let phraseIdx = 0;
  let charIdx   = 0;
  let deleting  = false;
  let paused    = false;

  const TYPING_SPEED  = 75;   // ms per char forward
  const DELETE_SPEED  = 35;   // ms per char backward
  const PAUSE_AFTER   = 1800; // ms pause at end of phrase
  const PAUSE_BEFORE  = 400;  // ms pause before typing next

  function tick() {
    const current = phrases[phraseIdx];

    if (paused) return; // handled by setTimeout

    if (!deleting) {
      // Type forward
      el.textContent = current.slice(0, charIdx + 1);
      charIdx++;

      if (charIdx === current.length) {
        // Finished typing — pause then delete
        paused = true;
        setTimeout(() => {
          paused    = false;
          deleting  = true;
          setTimeout(tick, DELETE_SPEED);
        }, PAUSE_AFTER);
        return;
      }
      setTimeout(tick, TYPING_SPEED);
    } else {
      // Delete backward
      el.textContent = current.slice(0, charIdx - 1);
      charIdx--;

      if (charIdx === 0) {
        // Finished deleting — pause then type next
        deleting  = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        paused    = true;
        setTimeout(() => {
          paused = false;
          setTimeout(tick, TYPING_SPEED);
        }, PAUSE_BEFORE);
        return;
      }
      setTimeout(tick, DELETE_SPEED);
    }
  }

  // Start after a small delay so page feels settled
  setTimeout(tick, 600);
})();

/* -------------------------------------------------------
   Mobile Navigation Toggle
------------------------------------------------------- */
(function initMobileNav() {
  const toggle  = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('nav-mobile');
  if (!toggle || !mobileMenu) return;

  toggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    toggle.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on link click
  mobileMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
})();

/* -------------------------------------------------------
   Active Nav State (based on current page path)
------------------------------------------------------- */
(function setActiveNav() {
  const path = window.location.pathname;

  // Normalize: strip trailing slash, lowercase
  function normalize(p) {
    return p.replace(/\/+$/, '').toLowerCase() || '/';
  }

  const current = normalize(path);

  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    const page = normalize(link.dataset.page || '');
    // Mark active if path ends with the page identifier
    if (current === page || current.endsWith(page)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Blog sub-pages — mark blog link active for all /blog/* paths
  if (current.includes('/blog')) {
    document.querySelectorAll('.nav-link[data-page="/blog/"]').forEach(l => l.classList.add('active'));
  }
})();

/* -------------------------------------------------------
   Smooth Scroll for internal anchor links
------------------------------------------------------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* -------------------------------------------------------
   Fade-in on scroll (Intersection Observer)
------------------------------------------------------- */
(function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

/* -------------------------------------------------------
   Copy to clipboard utility (used on blog/write.html)
------------------------------------------------------- */
function copyToClipboard(text, btnEl) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btnEl.textContent;
    btnEl.textContent = '// copied!';
    btnEl.style.color = 'var(--green)';
    setTimeout(() => {
      btnEl.textContent = orig;
      btnEl.style.color = '';
    }, 1800);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// Expose globally for inline use
window.copyToClipboard = copyToClipboard;
