/* ============================================================
   RAJLUX DIGITAL SOLUTIONS – INTERACTIVE SCRIPT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================
     1. PARTICLE CANVAS BACKGROUND
     ========================================================== */
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouse = { x: null, y: null, radius: 120 };
  let animationId;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
  });

  window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.6;
      this.speedY = (Math.random() - 0.5) * 0.6;
      this.opacity = Math.random() * 0.5 + 0.1;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Mouse interaction
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= dx * force * 0.02;
          this.y -= dy * force * 0.02;
        }
      }

      // Wrap around
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    }

    draw() {
      ctx.fillStyle = `rgba(255, 215, 0, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 12000), 120);
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.strokeStyle = `rgba(255, 215, 0, ${0.06 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    connectParticles();
    animationId = requestAnimationFrame(animateParticles);
  }

  initParticles();
  animateParticles();
  window.addEventListener('resize', () => {
    initParticles();
  });

  /* ==========================================================
     2. PRELOADER
     ========================================================== */
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hidden');
    }, 2200);
  });
  // Fallback
  setTimeout(() => {
    preloader.classList.add('hidden');
  }, 4000);

  /* ==========================================================
     3. HEADER SCROLL EFFECT
     ========================================================== */
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  /* ==========================================================
     4. ACTIVE NAV LINK ON SCROLL
     ========================================================== */
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  function updateActiveNav() {
    const scrollPos = window.scrollY + 200;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }
  window.addEventListener('scroll', updateActiveNav);

  /* ==========================================================
     5. HAMBURGER MOBILE MENU
     ========================================================== */
  const hamburger = document.getElementById('hamburger');
  const navLinksContainer = document.getElementById('nav-links');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinksContainer.classList.toggle('open');
  });

  // Close on link click
  navLinksContainer.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinksContainer.classList.remove('open');
    });
  });

  /* ==========================================================
     6. REVEAL ON SCROLL (Intersection Observer)
     ========================================================== */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealEls.forEach(el => revealObserver.observe(el));

  /* ==========================================================
     7. ANIMATED STAT COUNTERS
     ========================================================== */
  const statNumbers = document.querySelectorAll('.stat-number');
  let statsCounted = false;

  function animateCounters() {
    if (statsCounted) return;
    statsCounted = true;

    statNumbers.forEach(num => {
      const target = parseInt(num.getAttribute('data-target'));
      const duration = 2000;
      const start = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        num.textContent = Math.floor(eased * target);
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          num.textContent = target;
        }
      }
      requestAnimationFrame(tick);
    });
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) statsObserver.observe(heroStats);

  /* ==========================================================
     8. PORTFOLIO FILTER
     ========================================================== */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      portfolioItems.forEach(item => {
        const category = item.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          item.classList.remove('hidden');
          item.style.animation = 'fadeInUp 0.5s var(--ease-smooth) both';
        } else {
          item.classList.add('hidden');
          item.style.animation = '';
        }
      });
    });
  });

  /* ==========================================================
     9. TESTIMONIALS CAROUSEL
     ========================================================== */
  const track = document.getElementById('testimonial-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const dotsContainer = document.getElementById('carousel-dots');
  let currentSlide = 0;

  if (track) {
    const cards = track.children;
    const totalCards = cards.length;

    function getCardsPerView() {
      if (window.innerWidth <= 768) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    }

    function getMaxSlide() {
      return Math.max(0, totalCards - getCardsPerView());
    }

    function getCardWidth() {
      const container = track.parentElement;
      const w = container && container.clientWidth > 0 ? container.clientWidth : 1152;
      const cpv = getCardsPerView();
      return (w + 28) / cpv;
    }

    function renderDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      const maxSlide = getMaxSlide();
      const dotCount = maxSlide + 1;

      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot' + (i === currentSlide ? ' active' : '');
        dot.addEventListener('click', () => {
          currentSlide = i;
          updateCarousel();
        });
        dotsContainer.appendChild(dot);
      }
    }

    function updateCarousel() {
      const maxSlide = getMaxSlide();
      if (currentSlide > maxSlide) currentSlide = maxSlide;
      if (currentSlide < 0) currentSlide = 0;

      const cardWidth = getCardWidth();
      track.style.transform = `translateX(-${currentSlide * cardWidth}px)`;

      // Update dots
      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.dot');
        if (dots.length !== maxSlide + 1) {
          renderDots();
        } else {
          dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
          });
        }
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentSlide = currentSlide > 0 ? currentSlide - 1 : getMaxSlide();
        updateCarousel();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentSlide = currentSlide < getMaxSlide() ? currentSlide + 1 : 0;
        updateCarousel();
      });
    }

    // Window resize handling
    window.addEventListener('resize', () => {
      renderDots();
      updateCarousel();
    });

    // Touch Swipe Support
    let startX = 0;
    let dist = 0;

    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      dist = 0;
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      dist = e.touches[0].clientX - startX;
    }, { passive: true });

    track.addEventListener('touchend', () => {
      if (Math.abs(dist) > 40) {
        if (dist < 0) {
          // Swipe left -> next
          currentSlide = currentSlide < getMaxSlide() ? currentSlide + 1 : 0;
        } else {
          // Swipe right -> prev
          currentSlide = currentSlide > 0 ? currentSlide - 1 : getMaxSlide();
        }
        updateCarousel();
      }
    });

    // Viewport-aware Autoplay
    let carouselInterval = null;

    function startAutoplay() {
      if (!carouselInterval) {
        carouselInterval = setInterval(() => {
          currentSlide = currentSlide >= getMaxSlide() ? 0 : currentSlide + 1;
          updateCarousel();
        }, 5000);
      }
    }

    function stopAutoplay() {
      if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
      }
    }

    // Only autoplay when section is visible in viewport
    const carouselSection = document.getElementById('testimonials');
    if (carouselSection && 'IntersectionObserver' in window) {
      const carouselObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        });
      }, { threshold: 0.2 });

      carouselObserver.observe(carouselSection);
    } else {
      startAutoplay();
    }

    // Pause on hover
    track.addEventListener('mouseenter', stopAutoplay);
    track.addEventListener('mouseleave', () => {
      if (carouselSection && 'IntersectionObserver' in window) {
        const rect = carouselSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          startAutoplay();
        }
      } else {
        startAutoplay();
      }
    });

    // Initial render
    setTimeout(() => {
      renderDots();
      updateCarousel();
    }, 100);
  }

  /* ==========================================================
     10. CONTACT FORM & ADMIN MESSAGE SYNC
     ========================================================== */
  const form = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const fname = document.getElementById('fname').value.trim();
      const femail = document.getElementById('femail').value.trim();
      const fphone = document.getElementById('fphone').value.trim();
      const fservice = document.getElementById('fservice').value;
      const fmessage = document.getElementById('fmessage').value.trim();

      const submitBtn = document.getElementById('form-submit-btn');
      const originalText = submitBtn.querySelector('span').textContent;
      submitBtn.querySelector('span').textContent = 'Sending...';
      submitBtn.disabled = true;

      // Construct message object
      const now = new Date();
      const newMessage = {
        id: 'MSG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        name: fname,
        email: femail,
        phone: fphone || 'N/A',
        service: fservice || 'General Inquiry',
        message: fmessage,
        timestamp: now.toISOString(),
        dateStr: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'unread',
        starred: false
      };

      // Save to localStorage
      try {
        const stored = localStorage.getItem('rajlux_messages');
        const messages = stored ? JSON.parse(stored) : [];
        messages.unshift(newMessage);
        localStorage.setItem('rajlux_messages', JSON.stringify(messages));

        // Dispatch storage event / BroadcastChannel
        window.dispatchEvent(new Event('storage'));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('rajlux_admin_channel');
          bc.postMessage({ type: 'NEW_MESSAGE', message: newMessage });
        }
      } catch (err) {
        console.error('Error saving message:', err);
      }

      setTimeout(() => {
        submitBtn.querySelector('span').textContent = originalText;
        submitBtn.disabled = false;
        formSuccess.classList.add('show');
        form.reset();

        setTimeout(() => {
          formSuccess.classList.remove('show');
        }, 5000);
      }, 1000);
    });
  }

  /* ==========================================================
     11. SCROLL TO TOP
     ========================================================== */
  const scrollTopBtn = document.getElementById('scroll-top');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ==========================================================
     12. SMOOTH SCROLL FOR ANCHOR LINKS
     ========================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      e.preventDefault();
      const target = document.querySelector(targetId);
      if (target) {
        const headerHeight = header.offsetHeight;
        const targetPos = target.offsetTop - headerHeight - 10;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    });
  });

  /* ==========================================================
     13. STAGGERED REVEAL FOR GRID ITEMS
     ========================================================== */
  const gridContainers = document.querySelectorAll('.services-grid, .features-grid, .portfolio-grid');
  gridContainers.forEach(grid => {
    const cards = grid.querySelectorAll('.reveal');
    cards.forEach((card, i) => {
      card.style.transitionDelay = `${i * 0.1}s`;
    });
  });

});
