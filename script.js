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
     10. CONTACT FORM & ADMIN MESSAGE SYNC (Firebase + localStorage + EmailJS)
     ========================================================== */
  const form = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');
  const formSuccessText = document.getElementById('form-success-text');

  // Helper: show/clear field errors
  function setFieldError(fieldId, message) {
    const el = document.getElementById(fieldId + '-error');
    const input = document.getElementById(fieldId);
    if (el) el.textContent = message;
    if (input) {
      if (message) {
        input.classList.add('input-error');
      } else {
        input.classList.remove('input-error');
      }
    }
  }

  function clearAllErrors() {
    ['fname', 'femail', 'fphone', 'fservice', 'fmessage'].forEach(id => setFieldError(id, ''));
  }

  // Helper: Send automated Thank You confirmation email to user via EmailJS
  async function sendThankYouEmail(data) {
    const emailConfig = (window.RajluxFirebase && typeof window.RajluxFirebase.getEmailConfig === 'function')
      ? window.RajluxFirebase.getEmailConfig()
      : { enabled: true };

    if (!emailConfig.enabled) {
      console.log('✉️ Email notifications are disabled in settings.');
      return { success: false, reason: 'disabled' };
    }

    if (!emailConfig.publicKey || !emailConfig.serviceId || !emailConfig.templateId) {
      console.log('ℹ️ EmailJS not fully configured yet. Visit Admin Portal -> Settings to set up EmailJS credentials for automatic thank-you emails.');
      return { success: false, reason: 'unconfigured' };
    }

    try {
      if (typeof emailjs === 'undefined') {
        console.warn('EmailJS SDK not loaded.');
        return { success: false, reason: 'sdk_missing' };
      }

      // Initialize EmailJS with public key
      emailjs.init({ publicKey: emailConfig.publicKey });

      const templateParams = {
        // Recipient email aliases (supports {{email}}, {{to_email}}, {{user_email}}, {{client_email}}, {{to}})
        email: data.email,
        to_email: data.email,
        user_email: data.email,
        client_email: data.email,
        recipient: data.email,
        recipient_email: data.email,
        to: data.email,
        to_mail: data.email,

        // Recipient name aliases (supports {{name}}, {{to_name}}, {{user_name}}, {{client_name}})
        name: data.name,
        to_name: data.name,
        user_name: data.name,
        client_name: data.name,

        // Phone aliases (supports {{phone}}, {{user_phone}}, {{client_phone}})
        phone: data.phone || 'Not provided',
        user_phone: data.phone || 'Not provided',
        client_phone: data.phone || 'Not provided',

        // Service aliases (supports {{service}}, {{service_name}}, {{package}})
        service: data.service,
        service_name: data.service,
        package: data.package || 'Standard',

        // Message aliases (supports {{message}}, {{message_text}}, {{inquiry}})
        message: data.message,
        message_text: data.message,
        inquiry: data.message,

        // Time and date aliases (supports {{time}}, {{date}}, {{timestamp}})
        time: data.dateStr || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: data.timestamp || new Date().toISOString(),

        // Company info & metadata
        reply_to: 'rajlux7733@gmail.com',
        replyTo: 'rajlux7733@gmail.com',
        from_name: 'Rajlux Digital Solutions',
        company_name: 'Rajlux Digital Solutions Pvt Ltd',
        company_email: 'rajlux7733@gmail.com',
        company_phone: '+91 63695 89185',
        company_website: window.location.origin || 'https://rajlux-digital-solutions.vercel.app',
        response_time: '1 Hour'
      };

      // 1. Send Auto-reply Thank You to user
      console.log('📤 Dispatching Thank-You Email to:', templateParams.to_email, templateParams);
      const response = await emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        templateParams
      );

      console.log('✅ Thank-You email sent to:', templateParams.to_email, 'Status:', response.status, response.text);

      // 2. Optionally send notification to admin if adminTemplateId is configured
      if (emailConfig.adminTemplateId) {
        try {
          await emailjs.send(
            emailConfig.serviceId,
            emailConfig.adminTemplateId,
            templateParams
          );
          console.log('✅ Admin notification email sent successfully.');
        } catch (adminErr) {
          console.warn('Admin notification email warning:', adminErr);
        }
      }

      return { success: true };
    } catch (err) {
      console.error('❌ Failed to send Thank-You email via EmailJS:', err);
      return { success: false, error: err };
    }
  }

  // Handle Inquiry Type Toggle (Project vs General Message)
  const inquiryRadios = document.querySelectorAll('input[name="finquiry_type"]');
  const projectOptionsRow = document.getElementById('project-options-row');
  const fmessageLabel = document.getElementById('fmessage-label');
  const fmessageInput = document.getElementById('fmessage');
  const formSubmitBtn = document.getElementById('form-submit-btn');

  function updateInquiryTypeUI(type) {
    const isProject = type === 'project';
    
    document.querySelectorAll('.inquiry-type-option').forEach(opt => {
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) {
        opt.classList.toggle('active', radio.value === type);
      }
    });

    if (projectOptionsRow) {
      projectOptionsRow.style.display = isProject ? 'grid' : 'none';
    }

    if (fmessageLabel) {
      fmessageLabel.textContent = isProject ? 'Project Scope & Vision *' : 'Your Message *';
    }

    if (fmessageInput) {
      fmessageInput.placeholder = isProject 
        ? 'Tell us about your project goals, preferred features, timeline, and any reference websites...' 
        : 'Write your message, questions, or inquiry here...';
    }

    if (formSubmitBtn) {
      const btnSpan = formSubmitBtn.querySelector('span');
      if (btnSpan) {
        btnSpan.textContent = isProject ? 'Submit Project Request & Get Tracking ID' : 'Send Message 🚀';
      }
    }
  }

  inquiryRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updateInquiryTypeUI(radio.value);
    });
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const fname = document.getElementById('fname').value.trim();
      const femail = document.getElementById('femail').value.trim();
      const fphone = document.getElementById('fphone').value.trim();
      const fservice = document.getElementById('fservice').value;
      const isProjectInquiry = form.querySelector('input[name="finquiry_type"]:checked')?.value === 'project';
      const fpackage = (isProjectInquiry && document.getElementById('fpackage')) ? document.getElementById('fpackage').value : 'General Inquiry';
      const fbudget = (isProjectInquiry && document.getElementById('fbudget')) ? document.getElementById('fbudget').value : 'N/A';
      const fmessage = document.getElementById('fmessage').value.trim();

      // --- Validation ---
      let hasError = false;

      if (!fname) {
        setFieldError('fname', '⚠ Full name is required.');
        hasError = true;
      }

      if (!femail) {
        setFieldError('femail', '⚠ Email address is required.');
        hasError = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(femail)) {
        setFieldError('femail', '⚠ Please enter a valid email address.');
        hasError = true;
      }

      if (!fphone) {
        setFieldError('fphone', '⚠ Phone number is required.');
        hasError = true;
      } else if (!/^\d{10}$/.test(fphone)) {
        setFieldError('fphone', '⚠ Phone number must be exactly 10 digits.');
        hasError = true;
      }

      if (!fservice) {
        setFieldError('fservice', '⚠ Please select a service.');
        hasError = true;
      }

      if (!fmessage) {
        setFieldError('fmessage', isProjectInquiry ? '⚠ Project details are required.' : '⚠ Message is required.');
        hasError = true;
      }

      if (hasError) return;
      // --- End Validation ---

      const submitBtn = document.getElementById('form-submit-btn');
      const originalText = submitBtn.querySelector('span').textContent;
      submitBtn.querySelector('span').textContent = isProjectInquiry ? 'Submitting Request & Generating ID...' : 'Sending Message...';
      submitBtn.disabled = true;

      const now = new Date();

      if (isProjectInquiry) {
        // --- 1. PROJECT INQUIRY (Creates Project + Issues Project ID & Tracking Ref) ---
        const projectReqData = {
          name: fname,
          email: femail,
          phone: fphone,
          service: fservice,
          package: fpackage,
          budget: fbudget,
          message: fmessage,
          timestamp: now.toISOString()
        };

        let createdProject = null;

        try {
          if (window.RajluxFirebase && typeof window.RajluxFirebase.submitProjectRequest === 'function') {
            createdProject = await window.RajluxFirebase.submitProjectRequest(projectReqData);
          } else {
            const tempRef = 'REQ-' + Math.floor(10000 + Math.random() * 90000);
            createdProject = { requestRef: tempRef, id: 'RL-REQ-2026-' + Math.floor(100 + Math.random() * 900) };
          }

          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('rajlux_admin_channel');
            bc.postMessage({ type: 'NEW_PROJECT_REQUEST', project: createdProject });
          }
        } catch (err) {
          console.error('Error saving project request:', err);
        }

        // Dispatch Thank-You email
        try {
          await sendThankYouEmail({
            name: fname,
            email: femail,
            phone: fphone,
            service: `${fservice} (${fpackage})`,
            message: `[Tracking Ref: ${createdProject ? createdProject.requestRef : 'Pending'}] ${fmessage}`,
            timestamp: now.toISOString()
          });
        } catch (emailErr) {
          console.warn('Email dispatch error:', emailErr);
        }

        // Show Project Success Modal with Tracking Reference
        setTimeout(() => {
          submitBtn.querySelector('span').textContent = originalText;
          submitBtn.disabled = false;

          const reqModal = document.getElementById('request-success-modal');
          const modalRefCode = document.getElementById('modal-ref-code');
          const modalPortalBtn = document.getElementById('modal-open-portal-btn');

          if (createdProject && modalRefCode) {
            modalRefCode.textContent = createdProject.requestRef;
            if (modalPortalBtn) {
              modalPortalBtn.href = `portal.html?id=${encodeURIComponent(createdProject.requestRef)}&email=${encodeURIComponent(femail)}`;
            }
          }

          if (reqModal) {
            reqModal.classList.add('show', 'active');
            reqModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
          } else if (formSuccessText) {
            formSuccessText.textContent = `🎉 Project Request Submitted! Your Tracking Reference is ${createdProject ? createdProject.requestRef : 'REQ-SUCCESS'}. Our team will contact you within 1 hour!`;
            formSuccess.classList.add('show');
            setTimeout(() => formSuccess.classList.remove('show'), 7000);
          }

          form.reset();
          updateInquiryTypeUI('project');
        }, 600);

      } else {
        // --- 2. GENERAL INQUIRY (Saves to Inbox only, NO Project ID created) ---
        const messageData = {
          id: 'MSG-' + Math.floor(10000 + Math.random() * 90000),
          name: fname,
          email: femail,
          phone: fphone,
          service: fservice,
          message: fmessage,
          timestamp: now.toISOString(),
          dateStr: now.toLocaleDateString(),
          status: 'unread'
        };

        try {
          if (window.RajluxFirebase && typeof window.RajluxFirebase.saveMessageToDb === 'function') {
            await window.RajluxFirebase.saveMessageToDb(messageData);
          } else {
            const raw = localStorage.getItem('rajlux_messages');
            const list = raw ? JSON.parse(raw) : [];
            list.unshift(messageData);
            localStorage.setItem('rajlux_messages', JSON.stringify(list));
            window.dispatchEvent(new Event('storage'));
          }
        } catch (err) {
          console.error('Error saving general message:', err);
        }

        // Dispatch Thank-You email
        try {
          await sendThankYouEmail({
            name: fname,
            email: femail,
            phone: fphone,
            service: fservice,
            message: fmessage,
            timestamp: now.toISOString()
          });
        } catch (emailErr) {
          console.warn('Email dispatch error:', emailErr);
        }

        setTimeout(() => {
          submitBtn.querySelector('span').textContent = originalText;
          submitBtn.disabled = false;

          if (formSuccessText) {
            formSuccessText.textContent = '🎉 Thank you! Your message has been sent successfully. Our team will contact you shortly.';
            formSuccess.classList.add('show');
            setTimeout(() => formSuccess.classList.remove('show'), 6000);
          }
          showToast('Message sent successfully!');

          form.reset();
          updateInquiryTypeUI('project');
        }, 500);
      }
    });
  }

  /* ==========================================================
     PACKAGE SELECTION HANDLER
     ========================================================== */
  document.querySelectorAll('.select-plan-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan') || 'Business Pro Suite';
      const budget = btn.getAttribute('data-budget');
      
      // Auto-select project inquiry type
      const radioProject = document.querySelector('input[name="finquiry_type"][value="project"]');
      if (radioProject) {
        radioProject.checked = true;
        updateInquiryTypeUI('project');
      }

      const pkgSelect = document.getElementById('fpackage');
      const budgetSelect = document.getElementById('fbudget');
      
      if (pkgSelect) {
        pkgSelect.value = plan;
      }
      if (budgetSelect && budget) {
        if (plan === 'Startup Launchpad') budgetSelect.value = '₹10,000 - ₹25,000';
        else if (plan === 'Business Pro Suite') budgetSelect.value = '₹25,000 - ₹50,000';
        else if (plan === 'Enterprise Elite') budgetSelect.value = '₹50,000 - ₹1,00,000';
        else budgetSelect.value = '₹1,00,000+';
      }

      // Scroll smoothly to contact form
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        const headerHeight = header ? header.offsetHeight : 80;
        const targetPos = contactSection.offsetTop - headerHeight - 10;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
        
        // Highlight form momentarily
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
          contactForm.style.boxShadow = '0 0 35px rgba(255, 215, 0, 0.4)';
          setTimeout(() => {
            contactForm.style.boxShadow = '';
          }, 1800);
        }
      }
    });
  });

  /* ==========================================================
     REQUEST SUCCESS MODAL & COPY REFERENCE
     ========================================================== */
  const requestModal = document.getElementById('request-success-modal');
  const requestModalClose = document.getElementById('request-modal-close');
  const requestModalDone = document.getElementById('request-modal-done');
  const copyRefBtn = document.getElementById('copy-ref-btn');

  function closeRequestModal() {
    if (requestModal) {
      requestModal.classList.remove('show', 'active');
      requestModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (requestModalClose) requestModalClose.addEventListener('click', closeRequestModal);
  if (requestModalDone) requestModalDone.addEventListener('click', closeRequestModal);
  if (requestModal) {
    requestModal.addEventListener('click', (e) => {
      if (e.target === requestModal) closeRequestModal();
    });
  }

  if (copyRefBtn) {
    copyRefBtn.addEventListener('click', () => {
      const code = document.getElementById('modal-ref-code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        copyRefBtn.textContent = '✅ Copied!';
        setTimeout(() => copyRefBtn.textContent = '📋 Copy', 2000);
      }).catch(() => {
        showToast('Tracking reference: ' + code);
      });
    });
  }

  /* ==========================================================
     QUICK TRACK PROJECT MODAL
     ========================================================== */
  const trackModal = document.getElementById('track-project-modal');
  const openTrackModalBtn = document.getElementById('open-track-modal-btn');
  const trackModalClose = document.getElementById('track-modal-close');
  const trackModalCancel = document.getElementById('track-modal-cancel');
  const quickTrackForm = document.getElementById('quick-track-form');
  const trackIdInput = document.getElementById('track-id-input');
  const quickTrackError = document.getElementById('quick-track-error');

  function openTrackModal() {
    if (trackModal) {
      trackModal.classList.add('show', 'active');
      trackModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (trackIdInput) setTimeout(() => trackIdInput.focus(), 150);
    }
  }

  function closeTrackModal() {
    if (trackModal) {
      trackModal.classList.remove('show', 'active');
      trackModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (quickTrackError) quickTrackError.style.display = 'none';
    }
  }

  if (openTrackModalBtn) openTrackModalBtn.addEventListener('click', openTrackModal);
  if (trackModalClose) trackModalClose.addEventListener('click', closeTrackModal);
  if (trackModalCancel) trackModalCancel.addEventListener('click', closeTrackModal);
  if (trackModal) {
    trackModal.addEventListener('click', (e) => {
      if (e.target === trackModal) closeTrackModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTrackModal();
      closeRequestModal();
    }
  });

  if (quickTrackForm) {
    quickTrackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = trackIdInput.value.trim();
      if (!q) return;

      if (window.RajluxFirebase && typeof window.RajluxFirebase.getProjectById === 'function') {
        const found = await window.RajluxFirebase.getProjectById(q);
        if (found) {
          window.location.href = `portal.html?id=${encodeURIComponent(found.id)}`;
          return;
        }
      }

      // If not strictly matched in cache, forward to portal to authenticate
      window.location.href = `portal.html?id=${encodeURIComponent(q)}`;
    });
  }

  // Quick demo links inside track modal
  document.querySelectorAll('.demo-track-link').forEach(link => {
    link.addEventListener('click', () => {
      const demoId = link.getAttribute('data-demo');
      window.location.href = `portal.html?id=${encodeURIComponent(demoId)}`;
    });
  });

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

  /* ==========================================================
     14. CONTACT ACTIONS & PERMISSION MODALS
     ========================================================== */
  const confirmModal = document.getElementById('contact-confirm-modal');
  const confirmModalIcon = document.getElementById('confirm-modal-icon');
  const confirmModalTitle = document.getElementById('confirm-modal-title');
  const confirmModalDesc = document.getElementById('confirm-modal-desc');
  const confirmModalTargetText = document.getElementById('confirm-modal-target-text');
  const confirmModalBtnText = document.getElementById('confirm-modal-btn-text');
  const confirmModalOk = document.getElementById('confirm-modal-ok');
  const confirmModalCancel = document.getElementById('confirm-modal-cancel');
  const confirmModalClose = document.getElementById('confirm-modal-close');

  const scheduleModal = document.getElementById('schedule-modal');
  const scheduleModalClose = document.getElementById('schedule-modal-close');
  const scheduleModalOk = document.getElementById('schedule-modal-ok');

  let pendingAction = null;

  function openConfirmModal(config) {
    if (!confirmModal) return;
    confirmModalIcon.textContent = config.icon || '❓';
    confirmModalTitle.textContent = config.title || 'Permission Required';
    confirmModalDesc.textContent = config.desc || 'Do you want to proceed?';
    confirmModalTargetText.textContent = config.target || '';
    confirmModalBtnText.textContent = config.confirmText || 'Proceed';
    pendingAction = config.onConfirm || null;
    confirmModal.classList.add('active');
    confirmModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeConfirmModal() {
    if (!confirmModal) return;
    confirmModal.classList.remove('active');
    confirmModal.setAttribute('aria-hidden', 'true');
    pendingAction = null;
    if (!scheduleModal || !scheduleModal.classList.contains('active')) {
      document.body.style.overflow = '';
    }
  }

  function openScheduleModal() {
    if (!scheduleModal) return;
    scheduleModal.classList.add('active');
    scheduleModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeScheduleModal() {
    if (!scheduleModal) return;
    scheduleModal.classList.remove('active');
    scheduleModal.setAttribute('aria-hidden', 'true');
    if (!confirmModal || !confirmModal.classList.contains('active')) {
      document.body.style.overflow = '';
    }
  }

  // Confirmation Modal Handlers
  if (confirmModalOk) {
    confirmModalOk.addEventListener('click', () => {
      const action = pendingAction;
      closeConfirmModal();
      if (typeof action === 'function') {
        action();
      }
    });
  }

  if (confirmModalCancel) confirmModalCancel.addEventListener('click', closeConfirmModal);
  if (confirmModalClose) confirmModalClose.addEventListener('click', closeConfirmModal);
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) closeConfirmModal();
    });
  }

  // Schedule Modal Handlers
  if (scheduleModalClose) scheduleModalClose.addEventListener('click', closeScheduleModal);
  if (scheduleModalOk) scheduleModalOk.addEventListener('click', closeScheduleModal);
  if (scheduleModal) {
    scheduleModal.addEventListener('click', (e) => {
      if (e.target === scheduleModal) closeScheduleModal();
    });
  }

  // Close modals on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeConfirmModal();
      closeScheduleModal();
    }
  });

  // 1. Email Us Click (Asks Permission)
  const contactEmail = document.getElementById('contact-email');
  if (contactEmail) {
    const handleEmailClick = (e) => {
      e.preventDefault();
      openConfirmModal({
        icon: '📧',
        title: 'Send an Email?',
        desc: 'Would you like to open your default email app to compose a message to Rajlux Digital Solutions?',
        target: 'rajlux7733@gmail.com',
        confirmText: 'Open Email App',
        onConfirm: () => {
          window.location.href = 'mailto:rajlux7733@gmail.com?subject=Project%20Inquiry%20-%20Rajlux%20Digital%20Solutions';
        }
      });
    };
    contactEmail.addEventListener('click', handleEmailClick);
    contactEmail.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') handleEmailClick(e);
    });
  }

  // 2. Call Us Click (Asks Permission)
  const contactPhone = document.getElementById('contact-phone');
  const ctaCallBtn = document.getElementById('cta-call-btn');

  const handleCallClick = (e) => {
    e.preventDefault();
    openConfirmModal({
      icon: '📞',
      title: 'Call Rajlux Digital Solutions?',
      desc: 'Would you like to place a direct phone call to our support and project consultancy team?',
      target: '+91 63695 89185',
      confirmText: 'Call Now',
      onConfirm: () => {
        window.location.href = 'tel:+916369589185';
      }
    });
  };

  if (contactPhone) {
    contactPhone.addEventListener('click', handleCallClick);
    contactPhone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') handleCallClick(e);
    });
  }

  if (ctaCallBtn) {
    ctaCallBtn.addEventListener('click', handleCallClick);
  }

  // 3. Visit Us Click (Asks Permission -> Google Maps)
  const contactLocation = document.getElementById('contact-location');
  if (contactLocation) {
    const handleLocationClick = (e) => {
      e.preventDefault();
      openConfirmModal({
        icon: '📍',
        title: 'Open Google Maps?',
        desc: 'Would you like to open Google Maps in a new tab to find Rajlux Digital Solutions Pvt Ltd, India?',
        target: 'Rajlux Digital Solutions Pvt. Ltd., India',
        confirmText: 'Open in Google Maps',
        onConfirm: () => {
          window.open('https://www.google.com/maps/search/?api=1&query=Rajlux+Digital+Solutions+Pvt+Ltd+India', '_blank');
        }
      });
    };
    contactLocation.addEventListener('click', handleLocationClick);
    contactLocation.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') handleLocationClick(e);
    });
  }

  // 4. Business Hours Click (Opens Mon - Sat Schedule directly without permission)
  const contactHours = document.getElementById('contact-hours');
  if (contactHours) {
    const handleHoursClick = (e) => {
      e.preventDefault();
      openScheduleModal();
    };
    contactHours.addEventListener('click', handleHoursClick);
    contactHours.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') handleHoursClick(e);
    });
  }

});
