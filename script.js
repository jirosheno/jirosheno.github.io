
// ---- Lucide icons ----
if (window.lucide) {
  window.lucide.createIcons();
}

// ---- Letter-by-letter name reveal ----
// Editing the site name later only means changing this one string.
const NAME = "Jirosheno";
const lettersEl = document.getElementById('intro-letters');
if (lettersEl) {
  NAME.split('').forEach((ch, i) => {
    const span = document.createElement('span');
    span.textContent = ch;
    const delay = i === 0 ? 0 : 0.5 + (i - 1) * 0.06;
    span.style.animationDelay = delay + 's';
    lettersEl.appendChild(span);
  });
}

// ---- Skip logic: session flag + reduced motion ----
const loader = document.getElementById('intro-loader');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const alreadyShown = sessionStorage.getItem('jirosheno_intro_shown') === '1';

if (loader) {
  if (alreadyShown || reduceMotion) {
    loader.style.display = 'none';
  } else {
    runIntro();
  }
}

function runIntro() {
  // ---- Flowing line wave background behind the name ----
  const canvas = document.getElementById('wave-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x06070a, 0.06);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  const rng = (min, max) => Math.random() * (max - min) + min;
  const linesGroup = new THREE.Group();
  scene.add(linesGroup);

  const segments = 140, spanWidth = 16, linesData = [];
  for (let i = 0; i < 10; i++) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((segments + 1) * 3), 3));
    const z = rng(-4, 1.5);
    const depthFactor = (z + 4) / 5.5;
    const color = new THREE.Color(0x3d4590).lerp(new THREE.Color(0x6c7ce8), depthFactor);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.18 + depthFactor * 0.55 });
    const line = new THREE.Line(geometry, material);
    linesGroup.add(line);
    linesData.push({ line, z, phase: rng(0, Math.PI * 2), freq: rng(0.35, 0.75), freq2: rng(0.15, 0.4), amp: rng(0.35, 1.0), speed: rng(0.12, 0.32), yOffset: rng(-2.2, 2.2) });
  }

  function updateLines(t) {
    linesData.forEach(ld => {
      const posAttr = ld.line.geometry.attributes.position;
      for (let j = 0; j <= segments; j++) {
        const x = -spanWidth / 2 + (spanWidth * j) / segments;
        const y = ld.yOffset + Math.sin(x * ld.freq + t * ld.speed + ld.phase) * ld.amp + Math.sin(x * ld.freq2 - t * ld.speed * 0.6 + ld.phase) * ld.amp * 0.35;
        posAttr.setXYZ(j, x, y, ld.z);
      }
      posAttr.needsUpdate = true;
    });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || window.innerWidth, h = rect.height || window.innerHeight;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  let running = true;
  function render() {
    if (!running) return;
    updateLines(clock.getElapsedTime());
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();

  // ---- Minimum + maximum duration, plus skip-on-click/keypress ----
  const MIN_DURATION = 1700;
  const MAX_DURATION = 4000;
  const start = performance.now();
  let finished = false;

  function finishIntro() {
    if (finished) return;
    finished = true;
    running = false;
    loader.classList.add('loader-hidden');
    sessionStorage.setItem('jirosheno_intro_shown', '1');
    setTimeout(() => { loader.style.display = 'none'; }, 650);
  }

  window.addEventListener('load', () => {
    const elapsed = performance.now() - start;
    setTimeout(finishIntro, Math.max(0, MIN_DURATION - elapsed));
  });
  setTimeout(finishIntro, MAX_DURATION); // hard fallback

  loader.addEventListener('click', finishIntro);
  window.addEventListener('keydown', finishIntro, { once: true });
}

// ---- Task 1: Sticky Navigation Bar Mobile Toggle ----
(function() {
  const navToggle = document.getElementById('nav-toggle');
  const navbar = document.getElementById('navbar');

  if (navToggle && navbar) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navbar.classList.toggle('nav-open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navbar.classList.contains('nav-open') && !navbar.contains(e.target)) {
        navbar.classList.remove('nav-open');
      }
    });

    // Close mobile menu when links are clicked
    const mobileLinks = navbar.querySelectorAll('.nav-mobile-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        navbar.classList.remove('nav-open');
      });
    });
  }
})();

// ---- Task 3: Global Mouse-Reactive Glow ----
(function() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return; // Static/hidden if reduced motion is preferred

  const glow = document.getElementById('global-mouse-glow');
  if (!glow) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  // Track absolute mouse coordinates
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Current translation positions
  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;

  // Easing factor (lerp rate 0.08)
  const EASE = 0.08;

  function updateGlow() {
    currentX += (mouseX - currentX) * EASE;
    currentY += (mouseY - currentY) * EASE;

    glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

    requestAnimationFrame(updateGlow);
  }

  // Start the animation loop
  requestAnimationFrame(updateGlow);
})();

// ---- Projects Slideshow Controller ----
(function() {
  const slideshow = document.querySelector('.slideshow-card');
  if (!slideshow) return;

  const slides = Array.from(slideshow.querySelectorAll('.project-slide'));
  const indicators = slideshow.querySelector('.slide-indicators');
  if (!slides.length || !indicators) return;

  indicators.replaceChildren();
  const dots = slides.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slide-dot';
    dot.setAttribute('aria-label', `Show slide ${index + 1}`);
    dot.dataset.index = String(index);
    indicators.appendChild(dot);
    return dot;
  });

  let currentIndex = 0;
  let slideInterval = null;
  const INTERVAL_TIME = 8000; // 8 seconds

  function showSlide(index) {
    slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
    
    currentIndex = index;
  }

  function nextSlide() {
    let nextIndex = (currentIndex + 1) % slides.length;
    showSlide(nextIndex);
  }

  function startInterval() {
    stopInterval();
    slideInterval = setInterval(nextSlide, INTERVAL_TIME);
  }

  function stopInterval() {
    if (slideInterval) {
      clearInterval(slideInterval);
    }
  }

  // Interactive dots click controls
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      showSlide(i);
      startInterval(); // Reset interval timer when manually clicked
    });
  });

  // Always establish the first visible slide and matching indicator before autoplay.
  showSlide(0);
  startInterval();
})();

// ---- Scroll-to-top control ----
(function() {
  const scrollButton = document.querySelector('.scroll-to-top');
  if (!scrollButton) return;

  function updateScrollButton() {
    scrollButton.classList.toggle('is-visible', window.scrollY > window.innerHeight);
  }

  window.addEventListener('scroll', updateScrollButton, { passive: true });
  updateScrollButton();

  scrollButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ---- Projects page filters ----
(function() {
  const filters = document.querySelectorAll('.project-filter');
  const cards = document.querySelectorAll('.project-card');
  if (!filters.length || !cards.length) return;

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const category = filter.dataset.filter;

      filters.forEach((button) => button.classList.toggle('active', button === filter));
      cards.forEach((card) => {
        const matches = category === 'all' || card.dataset.categories.split(' ').includes(category);
        card.classList.toggle('is-filtered-out', !matches);
      });
    });
  });
})();

// ---- Dashboard counters ----
(function() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counters.forEach((counter) => { counter.textContent = counter.dataset.counter || '0'; });
    return;
  }

  let hasAnimated = false;
  function animateCounters() {
    if (hasAnimated) return;
    hasAnimated = true;
    counters.forEach((counter) => {
      const target = Number(counter.dataset.counter) || 0;
      const start = performance.now();
      const duration = 900;
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        counter.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  const dashboard = counters[0].closest('.card-dashboard');
  if (!dashboard || !('IntersectionObserver' in window)) {
    animateCounters();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      animateCounters();
      observer.disconnect();
    }
  }, { threshold: 0.35 });
  observer.observe(dashboard);
})();

// ---- Reading progress ----
(function() {
  const progressBars = document.querySelectorAll('.reading-progress-value');
  const panelBar = document.querySelector('[data-progress-bar]');
  const panelLabel = document.querySelector('[data-progress-label]');
  const sidebarBars = document.querySelectorAll('[data-sidebar-progress-bar]');
  const sidebarLabels = document.querySelectorAll('[data-sidebar-progress-label]');
  if (!progressBars.length && !panelBar && !sidebarBars.length) return;

  function updateReadingProgress() {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = scrollableHeight > 0 ? Math.min((window.scrollY / scrollableHeight) * 100, 100) : 0;
    const value = `${percentage.toFixed(1)}%`;
    progressBars.forEach((bar) => { bar.style.height = value; });
    if (panelBar) panelBar.style.width = value;
    if (panelLabel) panelLabel.textContent = `${Math.round(percentage)}%`;
    sidebarBars.forEach((bar) => { bar.style.width = value; });
    sidebarLabels.forEach((label) => { label.textContent = `${Math.round(percentage)}%`; });
  }

  window.addEventListener('scroll', updateReadingProgress, { passive: true });
  window.addEventListener('resize', updateReadingProgress);
  updateReadingProgress();
})();

// ---- Content sidebar navigation and sharing ----
(function() {
  const sidebars = document.querySelectorAll('[data-content-sidebar]');
  if (!sidebars.length) return;

  const tocLinks = Array.from(document.querySelectorAll('.sidebar-toc a[href^="#"]'));
  const sections = tocLinks
    .map((link) => ({ link, heading: document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1))) }))
    .filter((item) => item.heading);

  tocLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const heading = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));
      if (!heading) return;
      event.preventDefault();
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', link.getAttribute('href'));
    });
  });

  function setActiveLink(activeHeading) {
    sections.forEach(({ link, heading }) => link.classList.toggle('is-active', heading === activeHeading));
  }

  if (sections.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) setActiveLink(visible[0].target);
    }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 });
    sections.forEach(({ heading }) => observer.observe(heading));
  } else if (sections.length) {
    setActiveLink(sections[0].heading);
  }

  document.querySelectorAll('[data-copy-link]').forEach((button) => {
    button.addEventListener('click', async () => {
      const original = button.querySelector('span')?.textContent || 'Copy Link';
      try {
        await navigator.clipboard.writeText(window.location.href);
        const label = button.querySelector('span');
        if (label) label.textContent = 'Copied';
        setTimeout(() => { if (label) label.textContent = original; }, 1600);
      } catch {
        window.prompt('Copy this link:', window.location.href);
      }


// -------------------------------------------------------------------------------------------------------------------------
     

// -------------------------------------------------------------------------------------------------------------------------




     

    });
  });
})();
