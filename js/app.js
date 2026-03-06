/* ============================================================
   app.js — shared vanilla JS for glassmorphism portfolio
   Handles: mobile nav, scroll effects, animated counters,
            reveal-on-scroll, active nav link detection
   ============================================================ */

(function () {
  'use strict';

  /* ── Helpers ────────────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ── Active nav detection ───────────────────────────────── */
  function setActiveNav() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    $$('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      // Normalise href relative to root
      const linkPath = href.replace(/\/$/, '');
      // Check exact match or prefix match for blog section
      const isActive =
        path === linkPath ||
        (linkPath !== '' && path.startsWith(linkPath) && linkPath !== '/');
      link.classList.toggle('active', isActive);
    });
  }

  /* ── Nav scroll effect ──────────────────────────────────── */
  function initNavScroll() {
    const nav = $('.nav');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile nav toggle ──────────────────────────────────── */
  function initMobileNav() {
    const toggle = $('.nav-toggle');
    const panel  = $('.nav-mobile');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', () => {
      const open = toggle.classList.toggle('open');
      panel.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close when a link is clicked
    $$('.nav-mobile .nav-link').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        panel.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!toggle.contains(e.target) && !panel.contains(e.target)) {
        toggle.classList.remove('open');
        panel.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── Reveal on scroll ───────────────────────────────────── */
  function initReveal() {
    const items = $$('.reveal, .reveal-stagger');
    if (!items.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    items.forEach(el => observer.observe(el));
  }

  /* ── Animated counter ───────────────────────────────────── */
  function animateCounter(el, target, suffix, duration = 1400) {
    const start = performance.now();
    const isDecimal = String(target).includes('.');
    const step = ts => {
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = isDecimal
        ? (eased * target).toFixed(1)
        : Math.floor(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = $$('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseFloat(el.dataset.count);
            const suffix = el.dataset.suffix || '';
            animateCounter(el, target, suffix);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(el => observer.observe(el));
  }

  /* ── Smooth internal links ──────────────────────────────── */
  function initSmoothLinks() {
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          const navH = parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('--nav-h'), 10) || 72;
          const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    setActiveNav();
    initNavScroll();
    initMobileNav();
    initReveal();
    initCounters();
    initSmoothLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
