/**
 * app.js — Sarvesh Bhatnagar Portfolio
 *
 * Features:
 *  - Sticky nav with scroll-blur effect
 *  - Active nav link highlighting
 *  - Mobile menu toggle
 *  - Intersection Observer scroll-reveal animations
 *  - Project category filtering
 */

(function () {
  'use strict';

  /* ── Elements ───────────────────────────────────────────────── */
  const nav       = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');
  const allLinks  = navLinks.querySelectorAll('.nav__link');
  const sections  = document.querySelectorAll('section[id]');

  /* ── Sticky / scrolled nav ──────────────────────────────────── */
  function handleNavScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll(); // run once on load

  /* ── Active nav link on scroll ──────────────────────────────── */
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          allLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  /* ── Mobile menu toggle ─────────────────────────────────────── */
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile menu when a link is clicked
  allLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') &&
        !navLinks.contains(e.target) &&
        !navToggle.contains(e.target)) {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* ── Scroll-reveal animations ───────────────────────────────── */
  // Trigger hero reveals immediately (they're above the fold)
  document.querySelectorAll('.hero .reveal').forEach((el) => {
    // Small rAF so CSS transition fires after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('visible'));
    });
  });

  // Observe all other .reveal elements
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('.section .reveal, .timeline__item, .project-card, .fact-card, .lang-item, .tag').forEach((el) => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  /* ── Project filtering ──────────────────────────────────────── */
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active button
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Show / hide cards
      projectCards.forEach((card) => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !match);
      });
    });
  });

})();
