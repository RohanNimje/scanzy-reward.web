// ============================================================
//  ScanZy Rewards — script.js
//  Plain vanilla JavaScript. No libraries or frameworks needed.
//
//  This file handles ALL interactive behavior on the page:
//  1.  QR Grid Generator    — builds the fake QR code visual
//  2.  Navbar Scroll        — glass effect after scrolling 8px
//  3.  Mobile Menu          — hamburger toggle open/close
//  4.  Login Modal          — open, close, Escape key support
//  5.  Hero Entry Animations— staggered fade-in on page load
//  6.  Scroll Animations    — cards/sections animate into view
//  7.  Bar Chart Animation  — bars grow up when chart is visible
//  8.  Smooth Scroll        — offset scrolling for fixed navbar
//  9.  Copyright Year       — auto-updates the year in the footer
// ============================================================


// ----------------------------------------------------------------
// 1. QR GRID GENERATOR
//    Builds a fake QR code pattern inside the "How It Works" section.
//    The pattern is a pre-computed 8×8 grid of dark/light squares.
//    This avoids putting 64 hard-coded <span> elements in the HTML.
// ----------------------------------------------------------------
function generateQRGrid() {
  // Find the empty <div id="qr-grid"> in the HTML
  const grid = document.getElementById('qr-grid');
  if (!grid) return; // Safety check — do nothing if element isn't found

  // These indices (0–63) should be "dark" squares (on).
  // Pattern is pre-computed from the original design's logic:
  //   on = [listed indices] OR (index divisible by 3 but NOT by 5)
  const ON_CELLS = [
    0,1,2,3,5,6,7,8,9,12,14,15,16,18,21,22,23,24,
    27,30,33,36,39,40,41,42,48,49,51,54,56,57,58,61,62,63
  ];

  // Create 64 small square elements and append them to the grid container
  for (let i = 0; i < 64; i++) {
    const cell = document.createElement('span');
    // Add .on (dark) or .off (white) class based on our pattern array
    cell.className = 'qr-cell ' + (ON_CELLS.includes(i) ? 'on' : 'off');
    grid.appendChild(cell);
  }
}


// ----------------------------------------------------------------
// 2. NAVBAR — SCROLL DETECTION
//    When the user scrolls more than 8px down the page, the navbar
//    gains a glass/blur background (the .scrolled class triggers
//    the CSS transition defined in style.css).
// ----------------------------------------------------------------
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  // This function runs every time the page is scrolled
  function updateNavbar() {
    if (window.scrollY > 8) {
      // User has scrolled — add glass background
      navbar.classList.add('scrolled');
    } else {
      // Back at the top — remove glass background
      navbar.classList.remove('scrolled');
    }
  }

  // Run once immediately on load to set the correct initial state
  updateNavbar();

  // Listen for future scroll events.
  // { passive: true } tells the browser this listener won't call
  // preventDefault(), allowing it to optimize scroll performance.
  window.addEventListener('scroll', updateNavbar, { passive: true });
}


// ----------------------------------------------------------------
// 3. MOBILE MENU — TOGGLE OPEN / CLOSE
//    The hamburger (☰) button shows/hides the mobile nav.
//    Clicking any nav link or the Login button also closes the menu.
// ----------------------------------------------------------------
function initMobileMenu() {
  const menuBtn     = document.getElementById('mobile-menu-btn');
  const mobileMenu  = document.getElementById('mobile-menu');
  const iconOpen    = document.getElementById('menu-icon-open');   // ☰ hamburger
  const iconClose   = document.getElementById('menu-icon-close');  // ✕ close

  if (!menuBtn || !mobileMenu) return; // Safety check

  // Helper: show the menu with slide-down animation
  function openMenu() {
    mobileMenu.classList.add('open');
    // Slide in animation — mimics Framer Motion's initial={opacity:0, y:-8} → animate
    const inner = mobileMenu.querySelector('.mobile-menu-inner');
    if (inner) {
      inner.style.opacity = '0';
      inner.style.transform = 'translateY(-8px)';
      inner.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      // Force reflow so transition plays from the initial state
      void inner.offsetHeight;
      inner.style.opacity = '1';
      inner.style.transform = 'translateY(0)';
    }
    if (iconOpen)  iconOpen.style.display  = 'none';   // Hide hamburger icon
    if (iconClose) iconClose.style.display = 'block';  // Show X icon
    menuBtn.setAttribute('aria-expanded', 'true');
  }

  // Helper: hide the menu with slide-up animation
  function closeMenu() {
    const inner = mobileMenu.querySelector('.mobile-menu-inner');
    if (inner) {
      inner.style.opacity = '0';
      inner.style.transform = 'translateY(-8px)';
      // Wait for animation to complete before hiding the wrapper
      setTimeout(function () {
        mobileMenu.classList.remove('open');
        // Reset so next open starts fresh
        inner.style.transition = 'none';
        inner.style.opacity = '0';
        inner.style.transform = 'translateY(-8px)';
      }, 200);
    } else {
      mobileMenu.classList.remove('open');
    }
    if (iconOpen)  iconOpen.style.display  = 'block'; // Show hamburger icon
    if (iconClose) iconClose.style.display = 'none';  // Hide X icon
    menuBtn.setAttribute('aria-expanded', 'false');
  }

  // Toggle when hamburger button is clicked
  menuBtn.addEventListener('click', function () {
    if (mobileMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu when any mobile nav link is clicked
  // (so the menu doesn't stay open after navigation)
  const mobileLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
  mobileLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close menu when the "Login Portal" button in the mobile menu is clicked
  // (it opens the modal instead, so the menu should close)
  const mobileLoginBtn = document.getElementById('mobile-login-btn');
  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener('click', closeMenu);
  }
}


// ----------------------------------------------------------------
// 4. LOGIN MODAL — OPEN / CLOSE
//    The "Login Portal" button (desktop or mobile) opens a modal
//    overlay. The modal can be closed in three ways:
//    a) Click the ✕ close button
//    b) Click the dark overlay outside the modal box
//    c) Press the Escape key on the keyboard
// ----------------------------------------------------------------
function initLoginModal() {
  const modal    = document.getElementById('login-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  // Find ALL elements that should open the modal
  // (both desktop btn and mobile btn have .open-login-modal class)
  const openBtns = document.querySelectorAll('.open-login-modal');

  if (!modal) return; // Safety check

  // Helper: show the modal
  function openModal() {
    modal.classList.add('open');
    // Prevent the background page from scrolling while modal is open
    document.body.style.overflow = 'hidden';
  }

  // Helper: hide the modal
  function closeModal() {
    modal.classList.remove('open');
    // Restore page scrolling
    document.body.style.overflow = '';
  }

  // Open modal when any "Login Portal" button is clicked
  openBtns.forEach(function (btn) {
    btn.addEventListener('click', openModal);
  });

  // Close modal when the ✕ button is clicked
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Close modal when clicking the dark overlay OUTSIDE the white box.
  // e.target is the element that was clicked.
  // If e.target === modal (the overlay itself, not the box inside), close it.
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close modal when the Escape key is pressed
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}


// ----------------------------------------------------------------
// 5. HERO ENTRY ANIMATIONS
//    On page load, hero elements animate in with a stagger effect
//    (each element waits a little longer than the previous one).
//    This replaces Framer Motion's initial/animate prop system.
// ----------------------------------------------------------------
function initEntryAnimations() {
  // Step 1: Slide the navbar down from above
  const navbar = document.getElementById('navbar');
  if (navbar) {
    // Small delay so the transition has a moment to initialize
    setTimeout(function () {
      navbar.classList.add('loaded');
    }, 50);
  }

  // Step 2: Fade in hero text elements with a cascading stagger.
  // Each element with .hero-animate class gets .visible added
  // with an increasing delay (80ms apart).
  const heroEls = document.querySelectorAll('.hero-animate');
  heroEls.forEach(function (el, index) {
    setTimeout(function () {
      el.classList.add('visible');
    }, 100 + index * 120); // 100ms base + 120ms per element
  });

  // Step 3: Scale in the hero card image (slightly delayed)
  const heroCard = document.querySelector('.hero-card-animate');
  if (heroCard) {
    setTimeout(function () {
      heroCard.classList.add('visible');
    }, 280);
  }

  // Step 4: Slide in the floating stat badges (further delayed)
  const badgeLeft  = document.querySelector('.hero-badge-left');
  const badgeRight = document.querySelector('.hero-badge-right');
  if (badgeLeft)  setTimeout(function () { badgeLeft.classList.add('visible');  }, 800);
  if (badgeRight) setTimeout(function () { badgeRight.classList.add('visible'); }, 1000);
}


// ----------------------------------------------------------------
// 6. SCROLL-TRIGGERED ANIMATIONS (IntersectionObserver)
//    As the user scrolls down, elements with .scroll-animate class
//    animate into view. This replaces Framer Motion's whileInView.
//
//    How IntersectionObserver works:
//    - We "watch" elements and get a callback when they enter or
//      leave the browser's visible area (the viewport).
//    - When an element enters the viewport, we add .visible to it.
//    - The CSS transition on .anim-fade-up, .anim-scale-in etc.
//      then plays the animation.
// ----------------------------------------------------------------
function initScrollAnimations() {
  // Configuration for the observer
  const observerOptions = {
    threshold:   0.1,          // Fire when 10% of the element is visible
    rootMargin: '-60px 0px'    // Small offset: waits until element is 60px inside viewport
  };

  // Create the observer — runs the callback each time an observed element
  // enters or exits the viewport
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        // Element is now visible — trigger the CSS animation
        entry.target.classList.add('visible');
        // Stop watching this element so it only animates once
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Start watching every element that needs a scroll animation
  document.querySelectorAll('.scroll-animate').forEach(function (el) {
    observer.observe(el);
  });
}


// ----------------------------------------------------------------
// 7. BAR CHART ANIMATION
//    The bar chart in the "Data-Driven Insights" feature card
//    animates each bar rising from 0 to its target height when
//    the chart scrolls into view.
//
//    Each bar has its target height set as --bar-height in the HTML.
//    JS adds a transition-delay so bars appear one by one (stagger).
// ----------------------------------------------------------------
function initBarChart() {
  const barChart = document.querySelector('.bar-chart');
  const bars     = document.querySelectorAll('.chart-bar');

  if (!barChart || !bars.length) return;

  // Add staggered transition delays to each bar
  // Bar 0 animates immediately, bar 1 waits 40ms, bar 2 waits 80ms, etc.
  bars.forEach(function (bar, i) {
    bar.style.transitionDelay = (i * 0.04) + 's';
  });

  // Use IntersectionObserver to trigger the animation only when the
  // chart is scrolled into view (so it animates fresh each time you load)
  const chartObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        // Make all bars grow to their target height (--bar-height variable)
        bars.forEach(function (bar) {
          bar.classList.add('visible');
        });
        // Disconnect the observer — only animate once
        chartObserver.disconnect();
      }
    });
  }, { threshold: 0.3 }); // Trigger when 30% of chart is visible

  // Start watching the bar chart container
  chartObserver.observe(barChart);
}


// ----------------------------------------------------------------
// 8. SMOOTH SCROLL
//    All anchor links (href="#section-id") scroll smoothly to the
//    target section, with an offset to account for the fixed navbar.
//
//    CSS scroll-behavior:smooth handles most cases, but we need this
//    custom function to subtract the navbar height (≈80px) so the
//    navbar doesn't cover the section heading.
// ----------------------------------------------------------------
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href     = link.getAttribute('href');
      // Skip links that are just "#" (no target)
      if (href === '#') return;

      const targetId = href.slice(1); // Remove the leading "#"
      const targetEl = document.getElementById(targetId);

      if (targetEl) {
        e.preventDefault(); // Stop the browser's default jump behavior

        // Calculate scroll position with navbar offset
        const navbarHeight = 80; // Approximate height of the fixed navbar
        const targetTop    = targetEl.getBoundingClientRect().top + window.scrollY - navbarHeight;

        // Smooth scroll to the calculated position
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    });
  });
}


// ----------------------------------------------------------------
// 9. COPYRIGHT YEAR
//    Automatically updates the year in the footer so you never
//    need to manually change "© 2025" when a new year arrives.
// ----------------------------------------------------------------
function updateCopyrightYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}



// ----------------------------------------------------------------
// 10. ACTIVE NAV LINK HIGHLIGHTING
//     Highlights the correct nav link as the user scrolls through
//     different sections — matching the original's scroll-tracking
//     behavior which used React state to update active classes.
// ----------------------------------------------------------------
function initActiveNavLinks() {
  // All the sections that nav links point to
  var sectionIds = ['top', 'how-it-works', 'features', 'marquee', 'partner'];
  var allNavLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  // The href-to-section mapping
  var hrefMap = {
    '#top':          'top',
    '#how-it-works': 'how-it-works',
    '#features':     'features',
    '#marquee':      'marquee',
    '#partner':      'partner'
  };

  function updateActiveLinks() {
    // Find the section closest to the top of the viewport
    var scrollY = window.scrollY + 120; // offset for fixed navbar
    var activeId = sectionIds[0];

    sectionIds.forEach(function(id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= scrollY) {
        activeId = id;
      }
    });

    // Toggle the active class on matching nav links
    allNavLinks.forEach(function(link) {
      var href = link.getAttribute('href');
      var targetId = hrefMap[href];
      if (targetId === activeId) {
        link.classList.add('nav-link-active');
      } else {
        link.classList.remove('nav-link-active');
      }
    });
  }

  // Run on scroll and once on load
  window.addEventListener('scroll', updateActiveLinks, { passive: true });
  updateActiveLinks();
}


// ----------------------------------------------------------------
// 11. STEPS CAROUSEL — MOBILE NUMBERED NAVIGATION
//     Mirrors the Embla Carousel architecture from carousel.tsx:
//       viewport (overflow:hidden) → track (.steps-grid, translateX)
//       → slides (.step-card, flex: 0 0 100%)
//
//     The CSS transition on .steps-grid handles the smooth easing
//     (cubic-bezier[0.22, 1, 0.36, 1]) — same curve as Framer Motion.
//     At md+ (≥768px) the grid layout takes over; the carousel is a no-op.
// ----------------------------------------------------------------
function initStepsCarousel() {
  var track      = document.querySelector('.steps-grid');
  var indicators = document.getElementById('steps-indicators');
  if (!track || !indicators) return;

  var slides     = Array.from(track.querySelectorAll('.step-card'));
  var total      = slides.length;
  if (total === 0) return;

  var current    = 0;

  // --- Build numbered indicator buttons (1, 2, 3 …) ---
  indicators.innerHTML = '';
  var btns = slides.map(function (_, i) {
    var btn = document.createElement('button');
    btn.className  = 'steps-indicator' + (i === 0 ? ' active' : '');
    btn.textContent = String(i + 1);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', 'Step ' + (i + 1));
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.addEventListener('click', function () { goTo(i); });
    indicators.appendChild(btn);
    return btn;
  });

  // --- Scroll track to slide index ---
  function goTo(index) {
    // Clamp within bounds
    index = Math.max(0, Math.min(index, total - 1));
    current = index;

    // Translate the track left by index * 100% (Embla-equivalent)
    track.style.transform = 'translateX(-' + (index * 100) + '%)';

    // Update indicator active states
    btns.forEach(function (btn, i) {
      var isActive = i === index;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  // --- Touch / drag support (momentum-style swipe) ---
  var startX = 0, isDragging = false;

  track.addEventListener('touchstart', function (e) {
    startX    = e.touches[0].clientX;
    isDragging = true;
    // Disable CSS transition during drag for direct follow
    track.style.transition = 'none';
  }, { passive: true });

  track.addEventListener('touchmove', function (e) {
    if (!isDragging) return;
    var dx    = e.touches[0].clientX - startX;
    var base  = -(current * 100);
    var pct   = base + (dx / track.offsetWidth * 100);
    track.style.transform = 'translateX(' + pct + '%)';
  }, { passive: true });

  track.addEventListener('touchend', function (e) {
    if (!isDragging) return;
    isDragging = false;
    // Re-enable CSS transition for snap-back
    track.style.transition = '';
    var dx = e.changedTouches[0].clientX - startX;
    // Swipe threshold: 60px or 20% of slide width
    var threshold = Math.min(60, track.offsetWidth * 0.2);
    if (dx < -threshold && current < total - 1) {
      goTo(current + 1);
    } else if (dx > threshold && current > 0) {
      goTo(current - 1);
    } else {
      // Snap back to current
      goTo(current);
    }
  });

  // --- Keyboard support (Left/Right arrows) ---
  track.setAttribute('tabindex', '0');
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
  });

  // --- Reset carousel when viewport reaches md+ (768px) ---
  var mq = window.matchMedia('(min-width: 768px)');
  function handleBreakpoint(e) {
    if (e.matches) {
      // Grid mode: clear any JS transform so CSS grid takes over cleanly
      track.style.transform = '';
      track.style.transition = '';
    } else {
      // Back to mobile: restore correct position
      goTo(current);
    }
  }
  mq.addEventListener('change', handleBreakpoint);
  handleBreakpoint(mq); // run once on load
}


// ================================================================
//  INIT — Run everything once the HTML is fully parsed.
// ================================================================
document.addEventListener('DOMContentLoaded', function () {

  // --- Initialize Lucide icons ---
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // --- Run all setup functions ---
  generateQRGrid();       // Build the QR code visual in "How It Works"
  initNavbarScroll();     // Enable glass background on scroll
  initMobileMenu();       // Wire up the hamburger menu toggle
  initLoginModal();       // Wire up the login portal modal
  initEntryAnimations();  // Trigger hero section animations on page load
  initScrollAnimations(); // Watch sections for scroll-triggered animations
  initBarChart();         // Wire up bar chart stagger animation
  initSmoothScroll();     // Enable smooth scrolling for all anchor links
  updateCopyrightYear();  // Set correct year in the footer
  initActiveNavLinks();   // Highlight active nav link based on scroll position
  initStepsCarousel();    // Numbered carousel for "How it works" on mobile
});
