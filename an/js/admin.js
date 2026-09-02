/* ============================================================
   RAJLUX DIGITAL SOLUTIONS – ADMIN MANAGEMENT PORTAL SCRIPT
   Firebase + PDF Export + Mobile Responsive
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // DEFAULT ADMIN PASSWORD
  const DEFAULT_PASSWORD = 'admin123';

  /* ==========================================================
     1. AUTHENTICATION CONTROLLER
     ========================================================== */
  const loginModal = document.getElementById('login-modal');
  const loginForm = document.getElementById('login-form');
  const adminPwdInput = document.getElementById('admin-pwd');
  const loginError = document.getElementById('login-error');
  const togglePwdBtn = document.getElementById('toggle-pwd-btn');
  const logoutBtn = document.getElementById('logout-btn');

  function getStoredPassword() {
    return localStorage.getItem('rajlux_admin_password') || DEFAULT_PASSWORD;
  }

  function checkSession() {
    const isAuth = sessionStorage.getItem('rajlux_admin_auth') === 'true';
    if (isAuth) {
      loginModal.classList.add('hidden');
      initAdminPortal();
    } else {
      loginModal.classList.remove('hidden');
      adminPwdInput.focus();
    }
  }

  togglePwdBtn.addEventListener('click', () => {
    const isPwd = adminPwdInput.type === 'password';
    adminPwdInput.type = isPwd ? 'text' : 'password';
    togglePwdBtn.textContent = isPwd ? '🙈' : '👁️';
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputVal = adminPwdInput.value;
    if (inputVal === getStoredPassword()) {
      sessionStorage.setItem('rajlux_admin_auth', 'true');
      loginModal.classList.add('hidden');
      loginError.classList.remove('show');
      showToast('Welcome back to Rajlux Management System! 👑');
      initAdminPortal();
    } else {
      loginError.classList.add('show');
      adminPwdInput.value = '';
      adminPwdInput.focus();
    }
  });

  const quickDemoLoginBtn = document.getElementById('quick-demo-login-btn');
  if (quickDemoLoginBtn) {
    quickDemoLoginBtn.addEventListener('click', () => {
      adminPwdInput.value = getStoredPassword();
      sessionStorage.setItem('rajlux_admin_auth', 'true');
      loginModal.classList.add('hidden');
      loginError.classList.remove('show');
      showToast('Welcome to Rajlux Admin Portal! 👑');
      initAdminPortal();
    });
  }

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('rajlux_admin_auth');
    loginModal.classList.remove('hidden');
    adminPwdInput.value = '';
    showToast('Logged out securely.');
  });

  /* ==========================================================
     2. MOBILE SIDEBAR TOGGLE
     ========================================================== */
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarClose = document.getElementById('sidebar-close');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const adminSidebar = document.getElementById('admin-sidebar');

  function openSidebar() {
    adminSidebar.classList.add('open');
    sidebarOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    adminSidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  if (sidebarToggle) sidebarToggle.addEventListener('click', openSidebar);
  if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  /* ==========================================================
     3. NAVIGATION & TABS (Desktop sidebar + Mobile bottom nav)
     ========================================================== */
  const navItems = document.querySelectorAll('.nav-item[data-tab]');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const mobNavItems = document.querySelectorAll('.mob-nav-item[data-tab]');

  function switchTab(tabId) {
    navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
    });
    mobNavItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
    });
    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });
    closeSidebar();
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(item.getAttribute('data-tab'));
    });
  });

  mobNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(item.getAttribute('data-tab'));
    });
  });

  const viewAllBtn = document.getElementById('view-all-inbox-btn');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('inbox-tab');
    });
  }

  /* ==========================================================
     4. MESSAGES DATA MANAGER (Firebase + localStorage fallback)
     ========================================================== */
  let currentMessages = [];
  let firestoreUnsubscribe = null;

  // Sample messages for auto-seed on first load
  const SAMPLE_MESSAGES = [
    {
      id: 'MSG-DEMO-1',
      name: 'Arun Prakash',
      email: 'arun.prakash@techfirm.in',
      phone: '+91 98765 43210',
      service: 'Web Development',
      message: 'Hi Rajlux team, we need a complete enterprise web application with custom admin dashboard and payment gateway integration. Please share a consultation time at your earliest convenience.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      dateStr: formatDateStr(new Date(Date.now() - 3600000)),
      status: 'unread',
      starred: false
    },
    {
      id: 'MSG-DEMO-2',
      name: 'Kavitha Ramesh',
      email: 'kavitha@luxeinterior.com',
      phone: '+91 91234 56789',
      service: 'Branding & Identity',
      message: 'Looking for logo design, visual brand identity guidelines, and social media banners for our luxury interior design startup. We have a launch date of next month.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      dateStr: formatDateStr(new Date(Date.now() - 86400000)),
      status: 'unread',
      starred: false
    },
    {
      id: 'MSG-DEMO-3',
      name: 'Suresh Kumar',
      email: 'suresh@swiftmart.in',
      phone: '+91 99887 76655',
      service: 'Mobile App Development',
      message: 'We want to build a cross-platform iOS and Android mobile app for grocery delivery with real-time order tracking and payment integration.',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      dateStr: formatDateStr(new Date(Date.now() - 172800000)),
      status: 'read',
      starred: false
    },
    {
      id: 'MSG-DEMO-4',
      name: 'Priya Nair',
      email: 'priya@novatech.co',
      phone: '+91 88776 54321',
      service: 'Digital Marketing',
      message: 'Our startup needs a complete digital marketing strategy including SEO, social media, and PPC campaigns. We aim to increase our online leads by 5x in the next quarter.',
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      dateStr: formatDateStr(new Date(Date.now() - 259200000)),
      status: 'unread',
      starred: false
    },
    {
      id: 'MSG-DEMO-5',
      name: 'Rajan Mehta',
      email: 'rajan@cloudventures.in',
      phone: '+91 70123 45678',
      service: 'Cloud & IT Solutions',
      message: 'We are planning to migrate our existing on-premise infrastructure to the cloud. Need consultation on AWS/GCP setup, security and ongoing monitoring services.',
      timestamp: new Date(Date.now() - 432000000).toISOString(),
      dateStr: formatDateStr(new Date(Date.now() - 432000000)),
      status: 'read',
      starred: false
    }
  ];

  function formatDateStr(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function updateStorageStatusBadge(mode) {
    const el = document.getElementById('stat-storage-mode');
    const headerStatus = document.getElementById('firebase-status-text');
    if (mode === 'firebase') {
      if (el) { el.textContent = 'Cloud Active'; el.style.color = '#4ade80'; }
      if (headerStatus) headerStatus.textContent = 'Live System';
    } else {
      if (el) { el.textContent = 'Active'; el.style.color = 'var(--gold-primary)'; }
      if (headerStatus) headerStatus.textContent = 'Live System';
    }
  }

  function onMessagesUpdate(messages, mode) {
    currentMessages = messages;
    updateStorageStatusBadge(mode);
    renderDashboard();
    renderInbox();
  }

  /* Seed sample data if inbox is empty (auto on first load) */
  function autoSeedIfEmpty() {
    const stored = localStorage.getItem('rajlux_messages');
    let existing = [];
    try { existing = stored ? JSON.parse(stored) : []; } catch (e) {}
    if (existing.length === 0) {
      addSampleData(false); // silent seed
    }
  }

  /* Storage event listener for cross-tab sync (local mode) */
  window.addEventListener('storage', () => {
    if (window.RajluxFirebase && !window.RajluxFirebase.isFirebaseConfigured()) {
      try {
        const data = localStorage.getItem('rajlux_messages');
        currentMessages = data ? JSON.parse(data) : [];
        renderDashboard();
        renderInbox();
      } catch (e) {}
    }
  });

  /* BroadcastChannel for new messages from contact form */
  if ('BroadcastChannel' in window) {
    const bc = new BroadcastChannel('rajlux_admin_channel');
    bc.onmessage = (event) => {
      if (event.data && event.data.type === 'NEW_MESSAGE') {
        showToast('🔔 New message from ' + event.data.message.name);
        // If using local mode, reload from storage
        if (window.RajluxFirebase && !window.RajluxFirebase.isFirebaseConfigured()) {
          try {
            const data = localStorage.getItem('rajlux_messages');
            currentMessages = data ? JSON.parse(data) : [];
            renderDashboard();
            renderInbox();
          } catch (e) {}
        }
      }
    };
  }

  /* ==========================================================
     5. RENDER DASHBOARD
     ========================================================== */
  function renderDashboard() {
    const totalCount = currentMessages.length;
    const unreadCount = currentMessages.filter(m => m.status === 'unread').length;

    document.getElementById('stat-total-val').textContent = totalCount;
    document.getElementById('stat-unread-val').textContent = unreadCount;
    const unreadBadge = document.getElementById('unread-count-badge');
    const mobBadge = document.getElementById('mob-unread-badge');
    if (unreadBadge) unreadBadge.textContent = unreadCount;
    if (mobBadge) { mobBadge.textContent = unreadCount; mobBadge.style.display = unreadCount > 0 ? 'flex' : 'none'; }

    // Top Service calculation
    const serviceCounts = {};
    currentMessages.forEach(m => {
      const srv = m.service || 'General Inquiry';
      serviceCounts[srv] = (serviceCounts[srv] || 0) + 1;
    });

    let topSrv = '-';
    let maxCount = 0;
    for (const [srv, count] of Object.entries(serviceCounts)) {
      if (count > maxCount) { maxCount = count; topSrv = srv; }
    }
    document.getElementById('stat-top-service-val').textContent = topSrv;

    // Recent list (last 5)
    const recentList = document.getElementById('dash-recent-list');
    recentList.innerHTML = '';

    if (currentMessages.length === 0) {
      recentList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>No messages yet. Sample data will auto-load on first login!</p>
        </div>
      `;
      return;
    }

    const recent = currentMessages.slice(0, 5);
    recent.forEach(msg => {
      const item = document.createElement('div');
      item.className = 'dash-msg-row';
      item.style.background = msg.status === 'unread' ? 'rgba(255, 215, 0, 0.04)' : 'rgba(255, 255, 255, 0.02)';

      item.innerHTML = `
        <div class="dash-msg-left">
          ${msg.status === 'unread' ? '<span class="unread-dot"></span>' : ''}
          <div>
            <strong style="font-family: var(--font-heading);">${escapeHtml(msg.name)}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 8px;">(${escapeHtml(msg.email)})</span>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">
              ${escapeHtml(msg.message.length > 80 ? msg.message.substring(0, 80) + '...' : msg.message)}
            </div>
          </div>
        </div>
        <div class="dash-msg-right">
          <span class="service-badge">${escapeHtml(msg.service)}</span>
          <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">${escapeHtml(msg.dateStr || '')}</div>
        </div>
      `;

      item.addEventListener('click', () => openDetailModal(msg.id || msg.docId));
      recentList.appendChild(item);
    });
  }

  /* ==========================================================
     6. RENDER INBOX TABLE + MOBILE CARDS
     ========================================================== */
  const inboxSearch = document.getElementById('inbox-search');
  const inboxStatusFilter = document.getElementById('inbox-status-filter');
  const inboxServiceFilter = document.getElementById('inbox-service-filter');
  const tableBody = document.getElementById('inbox-table-body');
  const mobileCardList = document.getElementById('messages-card-list');

  function getFilteredMessages() {
    const query = inboxSearch ? inboxSearch.value.toLowerCase().trim() : '';
    const statusVal = inboxStatusFilter ? inboxStatusFilter.value : 'all';
    const serviceVal = inboxServiceFilter ? inboxServiceFilter.value : 'all';

    return currentMessages.filter(msg => {
      const matchQuery = !query ||
        (msg.name || '').toLowerCase().includes(query) ||
        (msg.email || '').toLowerCase().includes(query) ||
        (msg.phone || '').toLowerCase().includes(query) ||
        (msg.message || '').toLowerCase().includes(query);

      const matchStatus = statusVal === 'all' || msg.status === statusVal;
      const matchService = serviceVal === 'all' || msg.service === serviceVal;

      return matchQuery && matchStatus && matchService;
    });
  }

  function renderInbox() {
    const filtered = getFilteredMessages();
    const msgId = (msg) => msg.id || msg.docId;

    // -- Desktop table --
    tableBody.innerHTML = '';

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <div class="empty-icon">🔍</div>
              <p>No messages match your search or filter criteria.</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      filtered.forEach(msg => {
        const tr = document.createElement('tr');
        if (msg.status === 'unread') tr.classList.add('unread');
        const id = msgId(msg);

        tr.innerHTML = `
          <td>
            ${msg.status === 'unread'
              ? '<span class="unread-dot" title="Unread"></span><span style="font-size: 0.75rem; color: var(--gold-primary);">New</span>'
              : '<span style="font-size: 0.75rem; color: var(--text-dim);">Read</span>'}
          </td>
          <td>
            <strong style="font-family: var(--font-heading);">${escapeHtml(msg.name)}</strong>
          </td>
          <td>
            <div style="font-size: 0.85rem;">📧 ${escapeHtml(msg.email)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">📞 ${escapeHtml(msg.phone)}</div>
          </td>
          <td>
            <span class="service-badge">${escapeHtml(msg.service)}</span>
          </td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">
            ${escapeHtml(msg.dateStr || '')}
          </td>
          <td>
            <div class="action-btns" onclick="event.stopPropagation()">
              <button class="btn-icon view-btn" title="View Details" data-id="${id}">👁️</button>
              <button class="btn-icon toggle-read-btn" title="${msg.status === 'unread' ? 'Mark Read' : 'Mark Unread'}" data-id="${id}">
                ${msg.status === 'unread' ? '✅' : '✉️'}
              </button>
              <button class="btn-icon delete delete-btn" title="Delete" data-id="${id}">🗑️</button>
            </div>
          </td>
        `;

        tr.addEventListener('click', () => openDetailModal(id));
        tableBody.appendChild(tr);
      });

      // Attach action button listeners
      tableBody.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); openDetailModal(btn.getAttribute('data-id')); });
      });
      tableBody.querySelectorAll('.toggle-read-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); toggleReadStatus(btn.getAttribute('data-id')); });
      });
      tableBody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); deleteMessage(btn.getAttribute('data-id')); });
      });
    }

    // -- Mobile card list --
    if (mobileCardList) {
      mobileCardList.innerHTML = '';
      if (filtered.length === 0) {
        mobileCardList.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>No messages found.</p></div>`;
      } else {
        filtered.forEach(msg => {
          const id = msgId(msg);
          const card = document.createElement('div');
          card.className = 'msg-mobile-card' + (msg.status === 'unread' ? ' unread' : '');
          card.innerHTML = `
            <div class="mmc-header">
              <div class="mmc-name-row">
                ${msg.status === 'unread' ? '<span class="unread-dot"></span>' : ''}
                <strong>${escapeHtml(msg.name)}</strong>
                <span class="service-badge">${escapeHtml(msg.service)}</span>
              </div>
              <div class="mmc-actions" onclick="event.stopPropagation()">
                <button class="btn-icon view-btn" data-id="${id}">👁️</button>
                <button class="btn-icon delete delete-btn" data-id="${id}">🗑️</button>
              </div>
            </div>
            <div class="mmc-contact">📧 ${escapeHtml(msg.email)} &nbsp; 📞 ${escapeHtml(msg.phone)}</div>
            <div class="mmc-preview">${escapeHtml(msg.message.length > 90 ? msg.message.substring(0, 90) + '...' : msg.message)}</div>
            <div class="mmc-date">${escapeHtml(msg.dateStr || '')}</div>
          `;
          card.addEventListener('click', () => openDetailModal(id));
          mobileCardList.appendChild(card);
        });

        mobileCardList.querySelectorAll('.view-btn').forEach(btn => {
          btn.addEventListener('click', (e) => { e.stopPropagation(); openDetailModal(btn.getAttribute('data-id')); });
        });
        mobileCardList.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', (e) => { e.stopPropagation(); deleteMessage(btn.getAttribute('data-id')); });
        });
      }
    }
  }

  if (inboxSearch) inboxSearch.addEventListener('input', renderInbox);
  if (inboxStatusFilter) inboxStatusFilter.addEventListener('change', renderInbox);
  if (inboxServiceFilter) inboxServiceFilter.addEventListener('change', renderInbox);

  /* ==========================================================
     7. MESSAGE DETAIL MODAL & ACTIONS
     ========================================================== */
  const detailModal = document.getElementById('detail-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  let selectedMessageId = null;

  function openDetailModal(msgId) {
    const msg = currentMessages.find(m => (m.id === msgId || m.docId === msgId));
    if (!msg) return;

    const id = msg.id || msg.docId;
    selectedMessageId = id;

    // Mark as read automatically
    if (msg.status === 'unread') {
      toggleReadStatus(id, true); // silent
      msg.status = 'read';
    }

    document.getElementById('modal-sender-name').textContent = msg.name;
    document.getElementById('modal-sender-email').textContent = '📧 ' + msg.email;
    document.getElementById('modal-sender-phone').textContent = '📞 ' + msg.phone;
    document.getElementById('modal-date').textContent = '📅 ' + (msg.dateStr || '');
    document.getElementById('modal-service').textContent = msg.service;
    document.getElementById('modal-message-body').textContent = msg.message;

    // WhatsApp Reply
    const cleanPhone = (msg.phone || '').replace(/[^0-9]/g, '');
    const waBtn = document.getElementById('modal-wa-btn');
    if (cleanPhone.length >= 10) {
      const waText = encodeURIComponent(`Hello ${msg.name}, thank you for contacting Rajlux Digital Solutions regarding ${msg.service}! We would love to discuss your project.`);
      waBtn.href = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${waText}`;
      waBtn.style.display = 'inline-flex';
    } else {
      waBtn.style.display = 'none';
    }

    // Email Reply
    const emailBtn = document.getElementById('modal-email-btn');
    const emailSubject = encodeURIComponent(`Rajlux Digital Solutions – Re: ${msg.service}`);
    const emailBody = encodeURIComponent(`Hi ${msg.name},\n\nThank you for reaching out to Rajlux Digital Solutions regarding your inquiry:\n\n"${msg.message}"\n\nBest regards,\nRajlux Digital Solutions Pvt Ltd`);
    emailBtn.href = `mailto:${msg.email}?subject=${emailSubject}&body=${emailBody}`;

    detailModal.classList.add('show');
    renderDashboard();
    renderInbox();
  }

  function closeDetailModal() {
    detailModal.classList.remove('show');
    selectedMessageId = null;
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDetailModal);
  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeDetailModal();
    });
  }

  const modalDeleteBtn = document.getElementById('modal-delete-btn');
  if (modalDeleteBtn) {
    modalDeleteBtn.addEventListener('click', () => {
      if (selectedMessageId) {
        deleteMessage(selectedMessageId);
        closeDetailModal();
      }
    });
  }

  async function toggleReadStatus(msgId, silent = false) {
    const msg = currentMessages.find(m => m.id === msgId || m.docId === msgId);
    if (msg) {
      const newStatus = msg.status === 'unread' ? 'read' : 'unread';
      msg.status = newStatus;
      if (window.RajluxFirebase) {
        await window.RajluxFirebase.updateMessageInDb(msgId, { status: newStatus });
      } else {
        saveLocalMessages();
      }
      if (!silent) showToast(`Message marked as ${newStatus}.`);
      renderDashboard();
      renderInbox();
    }
  }

  async function deleteMessage(msgId) {
    if (confirm('Are you sure you want to delete this customer message?')) {
      currentMessages = currentMessages.filter(m => m.id !== msgId && m.docId !== msgId);
      if (window.RajluxFirebase) {
        await window.RajluxFirebase.deleteMessageFromDb(msgId);
      } else {
        saveLocalMessages();
      }
      showToast('Message deleted.');
      renderDashboard();
      renderInbox();
    }
  }

  function saveLocalMessages() {
    localStorage.setItem('rajlux_messages', JSON.stringify(currentMessages));
    window.dispatchEvent(new Event('storage'));
  }

  /* ==========================================================
     8. CSV EXPORTER
     ========================================================== */
  const exportCsvBtn = document.getElementById('export-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      if (currentMessages.length === 0) {
        showToast('No messages available to export.');
        return;
      }

      let csv = 'ID,Name,Email,Phone,Service,Message,Date,Status\n';
      currentMessages.forEach(m => {
        const cleanMsg = `"${(m.message || '').replace(/"/g, '""')}"`;
        const cleanName = `"${(m.name || '').replace(/"/g, '""')}"`;
        csv += `${m.id || m.docId},${cleanName},${m.email},${m.phone},"${m.service}",${cleanMsg},"${m.dateStr}",${m.status}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rajlux_Customer_Messages_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Downloaded CSV report! 📥');
    });
  }

  /* ==========================================================
     9. PDF REPORT EXPORTER
     ========================================================== */
  const exportPdfBtn = document.getElementById('export-pdf-btn');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
      if (currentMessages.length === 0) {
        showToast('No messages available to export.');
        return;
      }

      if (typeof window.jspdf === 'undefined') {
        showToast('PDF library loading, please wait...');
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const now = new Date();
      const totalMessages = currentMessages.length;
      const unreadMessages = currentMessages.filter(m => m.status === 'unread').length;

      // ---- Header Banner ----
      doc.setFillColor(15, 15, 20);
      doc.rect(0, 0, pageWidth, 38, 'F');

      // Gold accent line
      doc.setFillColor(212, 175, 55);
      doc.rect(0, 38, pageWidth, 2, 'F');

      // Company Name
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RAJLUX DIGITAL SOLUTIONS PVT LTD', 14, 16);

      // Subtitle
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.setFont('helvetica', 'normal');
      doc.text('Customer Inquiries Report', 14, 24);

      // Report date
      doc.setFontSize(9);
      doc.setTextColor(180, 180, 180);
      doc.text(`Generated: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, 14, 31);

      // Stats on header right
      doc.setFontSize(10);
      doc.setTextColor(212, 175, 55);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: ${totalMessages}`, pageWidth - 80, 16);
      doc.text(`Unread: ${unreadMessages}`, pageWidth - 80, 24);
      doc.text(`Read: ${totalMessages - unreadMessages}`, pageWidth - 80, 31);

      // ---- Summary Stats Row ----
      doc.setFillColor(25, 25, 35);
      doc.rect(0, 40, pageWidth, 22, 'F');

      // Service breakdown
      const serviceCounts = {};
      currentMessages.forEach(m => {
        const s = m.service || 'General';
        serviceCounts[s] = (serviceCounts[s] || 0) + 1;
      });
      const entries = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);

      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.setFont('helvetica', 'normal');
      let xPos = 14;
      entries.slice(0, 6).forEach(([srv, cnt]) => {
        doc.setFillColor(212, 175, 55);
        doc.roundedRect(xPos, 44, 38, 10, 2, 2, 'F');
        doc.setTextColor(20, 20, 20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(`${srv.substring(0, 15)}`, xPos + 3, 49.5);
        doc.setFontSize(9);
        doc.text(`${cnt}`, xPos + 3, 52);
        xPos += 42;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 180, 180);
      });

      // ---- Messages Table ----
      const tableData = currentMessages.map((m, i) => [
        i + 1,
        m.name || '',
        m.email || '',
        m.phone || '',
        m.service || '',
        m.dateStr || '',
        m.status === 'unread' ? 'New' : 'Read',
        (m.message || '').substring(0, 80) + ((m.message || '').length > 80 ? '...' : '')
      ]);

      doc.autoTable({
        startY: 65,
        head: [['#', 'Name', 'Email', 'Phone', 'Service', 'Date', 'Status', 'Message Preview']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [212, 175, 55],
          textColor: [10, 10, 10],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 3
        },
        bodyStyles: {
          fillColor: [20, 20, 30],
          textColor: [220, 220, 220],
          fontSize: 7.5,
          cellPadding: 2.5,
          lineColor: [50, 50, 60],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [28, 28, 40]
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 28, fontStyle: 'bold' },
          2: { cellWidth: 42 },
          3: { cellWidth: 28 },
          4: { cellWidth: 35 },
          5: { cellWidth: 30 },
          6: { cellWidth: 16, halign: 'center' },
          7: { cellWidth: 'auto' }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 6) {
            if (data.cell.raw === 'New') {
              data.cell.styles.textColor = [212, 175, 55];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [100, 180, 100];
            }
          }
        },
        margin: { left: 14, right: 14 },
        styles: { overflow: 'linebreak' }
      });

      // Footer on each page
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        const footerY = doc.internal.pageSize.getHeight() - 8;
        doc.setFillColor(15, 15, 20);
        doc.rect(0, footerY - 4, pageWidth, 14, 'F');
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(7);
        doc.text(`© ${now.getFullYear()} Rajlux Digital Solutions Pvt Ltd | Confidential Report`, 14, footerY);
        doc.text(`Page ${p} of ${totalPages}`, pageWidth - 30, footerY);
      }

      doc.save(`Rajlux_Report_${Date.now()}.pdf`);
      showToast('PDF report downloaded! 📄');
    });
  }

  /* ==========================================================
     10. SETTINGS – Password & Firebase Config & Sample Data
     ========================================================== */
  const pwdChangeForm = document.getElementById('pwd-change-form');
  if (pwdChangeForm) {
    pwdChangeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentVal = document.getElementById('current-pwd').value;
      const newVal = document.getElementById('new-pwd').value;
      if (currentVal !== getStoredPassword()) {
        showToast('Current password incorrect!');
        return;
      }
      localStorage.setItem('rajlux_admin_password', newVal);
      showToast('Admin password updated! 🔒');
      pwdChangeForm.reset();
    });
  }

  // EmailJS Settings Form & Test Email Dispatcher
  const emailConfigForm = document.getElementById('emailjs-config-form');
  const emailStatusBadge = document.getElementById('emailjs-status-badge');
  const emailTestBtn = document.getElementById('email-test-btn');

  function updateEmailStatusBadge() {
    if (!emailStatusBadge || !window.RajluxFirebase) return;
    const cfg = window.RajluxFirebase.getEmailConfig();
    if (!cfg.enabled) {
      emailStatusBadge.textContent = 'Disabled ⏸️';
      emailStatusBadge.style.background = 'rgba(255, 165, 0, 0.15)';
      emailStatusBadge.style.color = '#ffa500';
    } else if (cfg.publicKey && cfg.serviceId && cfg.templateId) {
      emailStatusBadge.textContent = 'Active & Connected ✅';
      emailStatusBadge.style.background = 'rgba(39, 201, 63, 0.15)';
      emailStatusBadge.style.color = '#27c93f';
    } else {
      emailStatusBadge.textContent = 'Unconfigured ⚠️';
      emailStatusBadge.style.background = 'rgba(255, 255, 255, 0.08)';
      emailStatusBadge.style.color = 'var(--text-muted)';
    }
  }

  if (emailConfigForm && window.RajluxFirebase) {
    const existingEmailCfg = window.RajluxFirebase.getEmailConfig();
    const enabledInput = document.getElementById('email-enabled');
    const pubKeyInput = document.getElementById('email-publickey');
    const serviceIdInput = document.getElementById('email-serviceid');
    const templateIdInput = document.getElementById('email-templateid');
    const adminTemplateIdInput = document.getElementById('email-admintemplateid');

    if (enabledInput) enabledInput.checked = existingEmailCfg.enabled !== false;
    if (pubKeyInput) pubKeyInput.value = existingEmailCfg.publicKey || '';
    if (serviceIdInput) serviceIdInput.value = existingEmailCfg.serviceId || '';
    if (templateIdInput) templateIdInput.value = existingEmailCfg.templateId || '';
    if (adminTemplateIdInput) adminTemplateIdInput.value = existingEmailCfg.adminTemplateId || '';

    updateEmailStatusBadge();

    emailConfigForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newEmailCfg = {
        enabled: enabledInput ? enabledInput.checked : true,
        publicKey: pubKeyInput ? pubKeyInput.value.trim() : '',
        serviceId: serviceIdInput ? serviceIdInput.value.trim() : '',
        templateId: templateIdInput ? templateIdInput.value.trim() : '',
        adminTemplateId: adminTemplateIdInput ? adminTemplateIdInput.value.trim() : ''
      };

      window.RajluxFirebase.saveEmailConfig(newEmailCfg);
      updateEmailStatusBadge();
      showToast('Email auto-reply settings saved! ✉️');
    });

    if (emailTestBtn) {
      emailTestBtn.addEventListener('click', async () => {
        const cfg = window.RajluxFirebase.getEmailConfig();
        if (!cfg.publicKey || !cfg.serviceId || !cfg.templateId) {
          showToast('Please enter and save Public Key, Service ID, and Template ID first.');
          return;
        }

        const testRecipient = prompt('Enter recipient email address for test Thank-You email:', 'rajlux7733@gmail.com');
        if (!testRecipient) return;

        emailTestBtn.disabled = true;
        emailTestBtn.textContent = '⏳ Sending Test...';

        try {
          if (typeof emailjs === 'undefined') {
            throw new Error('EmailJS SDK not loaded.');
          }

          emailjs.init({ publicKey: cfg.publicKey });

          const testParams = {
            // Recipient email aliases (supports {{email}}, {{to_email}}, {{user_email}})
            email: testRecipient.trim(),
            to_email: testRecipient.trim(),
            user_email: testRecipient.trim(),
            recipient: testRecipient.trim(),
            recipient_email: testRecipient.trim(),

            // Recipient name aliases (supports {{name}}, {{to_name}}, {{user_name}})
            name: 'Test Customer',
            to_name: 'Test Customer',
            user_name: 'Test Customer',

            // Phone aliases
            phone: '+91 98765 43210',
            user_phone: '+91 98765 43210',

            // Service aliases
            service: 'Web Development (Test)',
            service_name: 'Web Development (Test)',

            // Message aliases
            message: 'This is a test submission from the Rajlux Digital Solutions Admin Portal to verify automated Thank-You email delivery.',
            message_text: 'This is a test submission from the Rajlux Digital Solutions Admin Portal to verify automated Thank-You email delivery.',

            // Time and date aliases
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            timestamp: new Date().toISOString(),

            // Company info & metadata
            reply_to: 'rajlux7733@gmail.com',
            from_name: 'Rajlux Digital Solutions',
            company_name: 'Rajlux Digital Solutions Pvt Ltd',
            company_email: 'rajlux7733@gmail.com',
            company_phone: '+91 63695 89185',
            company_website: window.location.origin || 'https://rajlux-digital-solutions.vercel.app',
            response_time: '1 Hour'
          };

          await emailjs.send(cfg.serviceId, cfg.templateId, testParams);
          showToast(`✅ Test Thank-You email sent to ${testRecipient}! Check your inbox.`);
        } catch (err) {
          console.error('Email test error:', err);
          showToast(`❌ Test email failed: ${err.message || err.text || 'Check console'}`);
        } finally {
          emailTestBtn.disabled = false;
          emailTestBtn.textContent = '🧪 Send Test Auto-Reply';
        }
      });
    }
  }

  // Sample data
  function addSampleData(showNotification = true) {
    if (window.RajluxFirebase) {
      window.RajluxFirebase.seedSampleMessagesToDb(SAMPLE_MESSAGES).then(() => {
        if (showNotification) showToast('Sample customer messages loaded! 📦');
      });
    } else {
      const stored = localStorage.getItem('rajlux_messages');
      let existing = [];
      try { existing = stored ? JSON.parse(stored) : []; } catch (e) {}
      const newIds = new Set(existing.map(m => m.id));
      const toAdd = SAMPLE_MESSAGES.filter(s => !newIds.has(s.id));
      const updated = [...toAdd, ...existing];
      localStorage.setItem('rajlux_messages', JSON.stringify(updated));
      currentMessages = updated;
      window.dispatchEvent(new Event('storage'));
      if (showNotification) showToast('Sample customer messages loaded! 📦');
      renderDashboard();
      renderInbox();
    }
  }

  const seedDemoBtn = document.getElementById('seed-demo-btn');
  if (seedDemoBtn) seedDemoBtn.addEventListener('click', () => addSampleData(true));

  const clearAllBtn = document.getElementById('clear-all-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', async () => {
      if (confirm('Delete ALL customer messages? This cannot be undone.')) {
        currentMessages = [];
        if (window.RajluxFirebase) {
          await window.RajluxFirebase.clearAllMessagesFromDb();
        } else {
          localStorage.removeItem('rajlux_messages');
          window.dispatchEvent(new Event('storage'));
        }
        showToast('All messages cleared.');
        renderDashboard();
        renderInbox();
      }
    });
  }

  const refreshBtn = document.getElementById('dash-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      initAdminPortal();
      showToast('Dashboard refreshed.');
    });
  }

  /* ==========================================================
     11. TOAST NOTIFICATION UTILITY
     ========================================================== */
  const adminToast = document.getElementById('admin-toast');
  function showToast(text) {
    if (!adminToast) return;
    adminToast.textContent = text;
    adminToast.classList.add('show');
    setTimeout(() => adminToast.classList.remove('show'), 3500);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ==========================================================
     12. PROJECTS & APPROVALS MANAGEMENT ENGINE
     ========================================================== */
  let currentProjectsList = [];
  let activeEditingProject = null;

  const pendingBadge = document.getElementById('pending-projects-badge');
  const pendingBadgeCount = document.getElementById('pending-badge-count');
  const pendingRequestsList = document.getElementById('pending-requests-list');
  const projectsTableBody = document.getElementById('projects-table-body');
  const projectStatusFilter = document.getElementById('project-status-filter');
  const refreshProjectsBtn = document.getElementById('refresh-projects-btn');

  const projectEditorModal = document.getElementById('project-editor-modal');
  const projectModalCloseBtn = document.getElementById('project-modal-close-btn');
  const pmodalProgressSlider = document.getElementById('pmodal-progress-slider');
  const pmodalProgressValBadge = document.getElementById('pmodal-progress-val-badge');
  const projectEditorForm = document.getElementById('project-editor-form');
  const pmodalSendChatBtn = document.getElementById('pmodal-send-chat-btn');
  const pmodalAdminChatInput = document.getElementById('pmodal-admin-chat-input');
  const pmodalDeleteProjectBtn = document.getElementById('pmodal-delete-project-btn');

  // Load and Render Projects
  async function loadAndRenderProjects() {
    if (window.RajluxFirebase && typeof window.RajluxFirebase.getAllProjects === 'function') {
      currentProjectsList = await window.RajluxFirebase.getAllProjects();
    } else {
      try {
        const stored = localStorage.getItem('rajlux_projects');
        currentProjectsList = stored ? JSON.parse(stored) : [];
      } catch (e) {
        currentProjectsList = [];
      }
    }
    renderProjectsMetrics();
    renderPendingApprovals();
    renderProjectsTable();
  }

  function parseBudgetVal(budgetStr) {
    if (!budgetStr) return 0;
    const str = String(budgetStr).trim();
    const matches = str.match(/[\d,]+/g);
    if (!matches || !matches.length) return 0;
    const numbers = matches.map(m => parseInt(m.replace(/,/g, ''), 10)).filter(n => !isNaN(n) && n > 0);
    if (!numbers.length) return 0;
    if (numbers.length === 1) return numbers[0];
    return Math.round((numbers[0] + numbers[1]) / 2);
  }

  function renderProjectsMetrics() {
    const list = (currentProjectsList || []).filter(Boolean);
    const total = list.length;
    const active = list.filter(p => p.status === 'in_progress' || p.status === 'in_review').length;
    const pending = list.filter(p => p.status === 'pending_approval').length;
    const completed = list.filter(p => p.status === 'completed').length;

    // Calculate pipeline value accurately
    let totalVal = 0;
    list.forEach(p => {
      totalVal += parseBudgetVal(p.budget);
    });

    const activeEl = document.getElementById('stat-active-prj-val');
    const pendingEl = document.getElementById('stat-pending-prj-val');
    const completedEl = document.getElementById('stat-completed-prj-val');
    const pipelineEl = document.getElementById('stat-pipeline-val');

    if (activeEl) activeEl.textContent = active;
    if (pendingEl) pendingEl.textContent = pending;
    if (completedEl) completedEl.textContent = completed;
    if (pipelineEl) pipelineEl.textContent = `₹${totalVal.toLocaleString('en-IN')}`;

    if (pendingBadge) {
      pendingBadge.textContent = pending;
      pendingBadge.style.display = pending > 0 ? 'inline-flex' : 'none';
    }
    if (pendingBadgeCount) pendingBadgeCount.textContent = pending;
  }

  function renderPendingApprovals() {
    if (!pendingRequestsList) return;
    const pending = currentProjectsList.filter(p => p.status === 'pending_approval');

    if (!pending.length) {
      pendingRequestsList.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 24px; color: var(--text-dim);">
          ✅ All customer requests are approved and in progress!
        </div>
      `;
      return;
    }

    pendingRequestsList.innerHTML = pending.map(p => {
      const targetId = p.id || p.requestRef || p.docId || '';
      return `
        <div class="pending-card">
          <div class="pending-card-top">
            <div>
              <span class="pending-card-ref">${escapeHtml(p.requestRef || p.id || 'REQ-NEW')}</span>
              <div class="pending-card-title">${escapeHtml(p.title || p.service || 'Customer Project')}</div>
            </div>
            <span class="service-badge" style="background: rgba(255, 215, 0, 0.15); color: var(--gold-primary);">
              ${escapeHtml(p.package || 'Pro Suite')}
            </span>
          </div>
          <div class="pending-card-meta">
            <div><strong>Client:</strong> ${escapeHtml(p.clientName || 'Client')} (${escapeHtml(p.clientPhone || p.clientEmail || '-')})</div>
            <div><strong>Budget:</strong> ${escapeHtml(p.budget || '₹24,999')} | <strong>Target:</strong> ${escapeHtml(p.targetDate || '30 days')}</div>
            <div style="margin-top: 6px; font-style: italic; color: var(--text-secondary);">"${escapeHtml(p.description || '')}"</div>
          </div>
          <div class="pending-card-actions">
            <button type="button" class="btn-approve" data-approve-id="${escapeHtml(targetId)}">
              ✓ Approve &amp; Issue Project ID 🚀
            </button>
            <button type="button" class="btn-manage-prj" data-edit-id="${escapeHtml(targetId)}">
              ⚙️ Review
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderProjectsTable() {
    const filter = projectStatusFilter ? projectStatusFilter.value : 'all';

    let filtered = currentProjectsList;
    if (filter !== 'all') {
      filtered = currentProjectsList.filter(p => p.status === filter);
    }

    renderProjectsMobileCards(filtered);

    if (!projectsTableBody) return;

    if (!filtered.length) {
      projectsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-dim);">No projects match the selected filter.</td></tr>`;
      return;
    }

    projectsTableBody.innerHTML = filtered.map(p => {
      const isPending = p.status === 'pending_approval';
      const isCompleted = p.status === 'completed';
      const statusLabel = isCompleted ? 'Completed' : (isPending ? 'Pending Approval' : 'In Progress');
      const statusColor = isCompleted ? 'var(--accent-green)' : (isPending ? 'var(--gold-primary)' : 'var(--accent-cyan)');
      const progress = Number(p.progress) || 0;
      const targetId = p.id || p.requestRef || p.docId || '';

      return `
        <tr>
          <td>
            <strong style="color: var(--gold-primary); font-family: monospace;">${escapeHtml(p.id || targetId)}</strong>
            <div style="font-size: 0.72rem; color: var(--text-dim);">${escapeHtml(p.requestRef || '')}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: #fff;">${escapeHtml(p.clientName || 'Client')}</div>
            <div style="font-size: 0.78rem; color: var(--text-dim);">${escapeHtml(p.service || 'Service')}</div>
          </td>
          <td>
            <div>${escapeHtml(p.package || 'Custom')}</div>
            <div style="font-weight: 700; color: var(--gold-primary); font-size: 0.85rem;">${escapeHtml(p.budget || '-')}</div>
          </td>
          <td>
            <div class="table-progress-bar">
              <div class="table-progress-track">
                <div class="table-progress-fill" style="width: ${progress}%; background: ${isCompleted ? 'var(--accent-green)' : 'var(--gold-gradient)'};"></div>
              </div>
              <span class="table-progress-pct" style="color: ${statusColor};">${progress}%</span>
            </div>
          </td>
          <td>
            <span class="service-badge" style="background: rgba(255,255,255,0.06); color: ${statusColor}; border: 1px solid ${statusColor};">
              ${statusLabel}
            </span>
          </td>
          <td style="font-size: 0.84rem;">
            ${escapeHtml(p.targetDate || 'TBD')}
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn-manage-prj" data-edit-id="${escapeHtml(targetId)}" title="Edit Progress &amp; Milestones">
                ⚙️ Manage
              </button>
              <a href="portal.html?id=${encodeURIComponent(p.id || targetId)}&auth=${encodeURIComponent(p.clientPin || '1234')}&admin=true" target="_blank" class="btn-manage-prj" title="Open Client Portal" style="color: var(--accent-cyan); text-decoration: none;">
                ✨ Portal
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render Mobile Cards for Active Projects Workspace
  function renderProjectsMobileCards(projects) {
    const mobileContainer = document.getElementById('projects-card-list');
    if (!mobileContainer) return;

    if (!projects.length) {
      mobileContainer.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-dim);">
          No projects match the selected filter.
        </div>
      `;
      return;
    }

    mobileContainer.innerHTML = projects.map(p => {
      const isPending = p.status === 'pending_approval';
      const isCompleted = p.status === 'completed';
      const statusLabel = isCompleted ? 'Completed' : (isPending ? 'Pending Approval' : 'In Progress');
      const statusColor = isCompleted ? 'var(--accent-green)' : (isPending ? 'var(--gold-primary)' : 'var(--accent-cyan)');
      const progress = Number(p.progress) || 0;
      const targetId = p.id || p.requestRef || p.docId || '';

      return `
        <div class="project-mobile-card" style="border-left: 3px solid ${statusColor}; margin-bottom: 12px;">
          <div class="message-card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <strong style="color: var(--gold-primary); font-family: monospace; font-size: 0.95rem;">${escapeHtml(p.id || targetId)}</strong>
              <div style="font-weight: 700; color: #fff; font-size: 1rem; margin-top: 2px;">${escapeHtml(p.clientName || 'Client')}</div>
            </div>
            <span class="service-badge" style="background: rgba(255,255,255,0.06); color: ${statusColor}; border: 1px solid ${statusColor}; font-size: 0.72rem;">
              ${statusLabel}
            </span>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-dim); margin-top: 6px;">
            <div><strong>Service:</strong> ${escapeHtml(p.service || 'Web Development')} (${escapeHtml(p.package || 'Pro')})</div>
            <div><strong>Budget:</strong> <span style="color: var(--gold-primary); font-weight: 600;">${escapeHtml(p.budget || '-')}</span> | <strong>Target:</strong> ${escapeHtml(p.targetDate || 'TBD')}</div>
          </div>

          <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 4px;">
              <span style="color: var(--text-dim);">Progress:</span>
              <strong style="color: ${statusColor};">${progress}%</strong>
            </div>
            <div class="table-progress-track" style="height: 8px; width: 100%;">
              <div class="table-progress-fill" style="width: ${progress}%; background: ${isCompleted ? 'var(--accent-green)' : 'var(--gold-gradient)'};"></div>
            </div>
          </div>

          <div class="message-card-actions" style="margin-top: 12px; display: flex; gap: 8px;">
            <button type="button" class="btn-manage-prj" data-edit-id="${escapeHtml(targetId)}" style="flex: 1; text-align: center; justify-content: center; padding: 8px 12px;">
              ⚙️ Manage
            </button>
            <a href="portal.html?id=${encodeURIComponent(p.id || targetId)}&auth=${encodeURIComponent(p.clientPin || '1234')}&admin=true" target="_blank" class="btn-manage-prj" style="flex: 1; text-align: center; justify-content: center; padding: 8px 12px; color: var(--accent-cyan); text-decoration: none;">
              ✨ Portal
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Attach mobile edit listeners are handled by top-level delegation
  }

  // Filter change
  if (projectStatusFilter) {
    projectStatusFilter.addEventListener('change', renderProjectsTable);
  }

  if (refreshProjectsBtn) {
    refreshProjectsBtn.addEventListener('click', async () => {
      await loadAndRenderProjects();
      showToast('Projects refreshed.');
    });
  }

  // Open Project Editor Modal
  function openProjectEditor(projectId) {
    if (!projectEditorModal) return;

    const cleanId = String(projectId || '').trim().toUpperCase();
    const list = (currentProjectsList || []).filter(Boolean);
    let p = list.find(item => 
      (item.id && String(item.id).trim().toUpperCase() === cleanId) || 
      (item.requestRef && String(item.requestRef).trim().toUpperCase() === cleanId) ||
      (item.docId && String(item.docId).trim().toUpperCase() === cleanId)
    );

    if (!p) {
      // Partial fallback match
      p = list.find(item => 
        (item.requestRef && (cleanId.includes(String(item.requestRef).trim().toUpperCase()) || String(item.requestRef).trim().toUpperCase().includes(cleanId))) ||
        (item.id && (cleanId.includes(String(item.id).trim().toUpperCase()) || String(item.id).trim().toUpperCase().includes(cleanId)))
      );
    }

    if (!p) {
      showToast('⚠️ Project details not found.');
      return;
    }

    activeEditingProject = p;

    const modalIdEl = document.getElementById('pmodal-id');
    const modalRefEl = document.getElementById('pmodal-ref');
    const modalTitleEl = document.getElementById('pmodal-title');
    const modalStatusBadge = document.getElementById('pmodal-status-badge');

    if (modalIdEl) modalIdEl.textContent = p.id || p.requestRef || 'N/A';
    if (modalRefEl) modalRefEl.textContent = p.requestRef || p.id || 'N/A';
    if (modalTitleEl) modalTitleEl.textContent = p.title || p.service || 'Project';
    if (modalStatusBadge) modalStatusBadge.textContent = String(p.status || 'in_progress').toUpperCase().replace('_', ' ');

    const viewPortalBtn = document.getElementById('pmodal-view-portal-btn');
    if (viewPortalBtn) {
      viewPortalBtn.href = `portal.html?id=${encodeURIComponent(p.id || p.requestRef || '')}&auth=${encodeURIComponent(p.clientPin || '1234')}&admin=true`;
    }

    // Progress slider & number
    const progressVal = Number(p.progress) || 0;
    if (pmodalProgressSlider) pmodalProgressSlider.value = progressVal;
    if (pmodalProgressValBadge) pmodalProgressValBadge.textContent = `${progressVal}%`;

    // Form inputs
    const statusSelect = document.getElementById('pmodal-status-select');
    const leadEng = document.getElementById('pmodal-lead-eng');
    const targetDate = document.getElementById('pmodal-target-date');
    const budget = document.getElementById('pmodal-budget');
    const desc = document.getElementById('pmodal-desc');

    if (statusSelect) statusSelect.value = p.status || 'in_progress';
    if (leadEng) leadEng.value = p.leadEngineer || 'Palanisamy R. (Lead Architect)';
    if (targetDate) targetDate.value = p.targetDate || '2026-08-30';
    if (budget) budget.value = p.budget || '₹24,999';
    if (desc) desc.value = p.description || '';

    // Milestones Checklist
    renderModalMilestonesChecklist(p.milestones || []);

    // Invoices & Deliverables
    renderModalInvoicesList(p.invoices || []);
    renderModalFilesList(p.files || []);

    projectEditorModal.classList.add('show');
    projectEditorModal.style.display = 'flex';
  }

  function renderModalMilestonesChecklist(milestones) {
    const container = document.getElementById('pmodal-milestones-checklist');
    if (!container) return;

    if (!milestones.length) {
      container.innerHTML = `<span style="color: var(--text-dim); font-size: 0.84rem;">Default standard milestones active.</span>`;
      return;
    }

    container.innerHTML = milestones.map((m, i) => {
      const isDone = m.status === 'completed';
      return `
        <div class="milestone-checkbox-row">
          <label for="ms_check_${i}">
            <input type="checkbox" id="ms_check_${i}" data-ms-idx="${i}" ${isDone ? 'checked' : ''} />
            <span>${escapeHtml(m.title)} (${m.percent}%)</span>
          </label>
          <span style="font-size: 0.78rem; color: ${isDone ? 'var(--accent-green)' : 'var(--text-dim)'};">
            ${isDone ? '✓ Completed' : 'Pending'}
          </span>
        </div>
      `;
    }).join('');
  }

  /* --- RENDER INVOICES IN ADMIN PROJECT MODAL --- */
  function renderModalInvoicesList(invoices) {
    const container = document.getElementById('pmodal-invoices-list');
    if (!container) return;

    if (!invoices.length) {
      container.innerHTML = `<span style="color: var(--text-dim); font-size: 0.84rem;">No invoices generated yet. Click "Generate New Invoice" to issue a bill.</span>`;
      return;
    }

    container.innerHTML = invoices.map(inv => {
      const isPaid = inv.status === 'paid';
      const isPending = inv.status === 'pending';
      const statusTag = isPaid ? 'PAID' : (isPending ? 'PENDING' : 'OVERDUE');
      const statusColor = isPaid ? 'var(--accent-green)' : (isPending ? 'var(--gold-primary)' : '#ff4d4d');
      const amountVal = Number(inv.total || inv.amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

      return `
        <div class="milestone-checkbox-row" style="flex-wrap: wrap; gap: 8px;">
          <div style="flex: 1; min-width: 180px;">
            <div style="font-weight: 700; color: #fff; font-size: 0.88rem;">${escapeHtml(inv.number || inv.id)}</div>
            <div style="font-size: 0.78rem; color: var(--text-dim);">Issued: ${escapeHtml(inv.date)} | Due: ${escapeHtml(inv.dueDate || 'Upon receipt')}</div>
          </div>
          <div style="text-align: right; font-weight: 700; color: var(--gold-primary); font-size: 0.9rem;">
            ${amountVal}
            <span class="service-badge" style="margin-left: 6px; background: rgba(255,255,255,0.06); color: ${statusColor}; border: 1px solid ${statusColor}; font-size: 0.7rem;">
              ${statusTag}
            </span>
          </div>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-manage-prj edit-inv-btn" data-inv-id="${inv.id}" style="padding: 3px 8px; font-size: 0.78rem;">
              ✏️ Edit Bill
            </button>
            <button type="button" class="btn-manage-prj print-inv-btn" data-inv-id="${inv.id}" style="padding: 3px 8px; font-size: 0.78rem; color: var(--accent-cyan);">
              📄 Print/PDF
            </button>
            <button type="button" class="btn-manage-prj del-inv-btn" data-inv-id="${inv.id}" style="padding: 3px 8px; font-size: 0.78rem; color: #ff4d4d;">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners for Edit Invoice
    container.querySelectorAll('.edit-inv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const invId = btn.getAttribute('data-inv-id');
        openInvoiceEditor(invId);
      });
    });

    // Attach listeners for Print Invoice
    container.querySelectorAll('.print-inv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const invId = btn.getAttribute('data-inv-id');
        downloadInvoicePdfAdmin(invId);
      });
    });

    // Attach listeners for Delete Invoice
    container.querySelectorAll('.del-inv-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const invId = btn.getAttribute('data-inv-id');
        if (!activeEditingProject) return;
        if (confirm(`Delete invoice ${invId}?`)) {
          activeEditingProject.invoices = (activeEditingProject.invoices || []).filter(i => i.id !== invId);
          try {
            if (window.RajluxFirebase && typeof window.RajluxFirebase.updateProjectData === 'function') {
              await window.RajluxFirebase.updateProjectData(activeEditingProject.id, { invoices: activeEditingProject.invoices });
            } else {
              const stored = localStorage.getItem('rajlux_projects');
              let list = stored ? JSON.parse(stored) : [];
              const idx = list.findIndex(p => p.id === activeEditingProject.id);
              if (idx !== -1) { list[idx].invoices = activeEditingProject.invoices; localStorage.setItem('rajlux_projects', JSON.stringify(list)); }
            }
          } catch (e) {}
          renderModalInvoicesList(activeEditingProject.invoices);
          showToast('Invoice deleted.');
        }
      });
    });
  }

  /* --- RENDER DELIVERABLES IN ADMIN PROJECT MODAL --- */
  function renderModalFilesList(files) {
    const container = document.getElementById('pmodal-files-list');
    if (!container) return;

    if (!files.length) {
      container.innerHTML = `<span style="color: var(--text-dim); font-size: 0.84rem;">No deliverable files attached yet. Click "Attach Deliverable File".</span>`;
      return;
    }

    container.innerHTML = files.map(file => {
      return `
        <div class="milestone-checkbox-row" style="flex-wrap: wrap; gap: 8px;">
          <div style="flex: 1; min-width: 180px;">
            <div style="font-weight: 600; color: #fff; font-size: 0.86rem;">${escapeHtml(file.name)}</div>
            <div style="font-size: 0.76rem; color: var(--text-dim);">Size: ${escapeHtml(file.size || 'N/A')} | Uploaded: ${escapeHtml(file.date || 'Recent')}</div>
          </div>
          <span class="service-badge" style="background: rgba(0,212,255,0.1); color: var(--accent-cyan); font-size: 0.72rem;">
            ${escapeHtml(file.tag || 'Asset')}
          </span>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-manage-prj dl-file-btn" data-file-id="${file.id}" style="padding: 3px 8px; font-size: 0.78rem; color: var(--gold-primary);">
              📥 Download
            </button>
            <button type="button" class="btn-manage-prj del-file-btn" data-file-id="${file.id}" style="padding: 3px 8px; font-size: 0.78rem; color: #ff4d4d;">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners for Download File
    container.querySelectorAll('.dl-file-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fileId = btn.getAttribute('data-file-id');
        const file = (activeEditingProject.files || []).find(f => f.id === fileId);
        if (file) {
          triggerDeliverableDownload(file, activeEditingProject.title, activeEditingProject.clientName);
        }
      });
    });

    // Attach listeners for Delete File
    container.querySelectorAll('.del-file-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const fileId = btn.getAttribute('data-file-id');
        if (!activeEditingProject) return;
        if (confirm(`Remove deliverable file?`)) {
          activeEditingProject.files = (activeEditingProject.files || []).filter(f => f.id !== fileId);
          try {
            if (window.RajluxFirebase && typeof window.RajluxFirebase.updateProjectData === 'function') {
              await window.RajluxFirebase.updateProjectData(activeEditingProject.id, { files: activeEditingProject.files });
            } else {
              const stored = localStorage.getItem('rajlux_projects');
              let list = stored ? JSON.parse(stored) : [];
              const idx = list.findIndex(p => p.id === activeEditingProject.id);
              if (idx !== -1) { list[idx].files = activeEditingProject.files; localStorage.setItem('rajlux_projects', JSON.stringify(list)); }
            }
          } catch (e) {}
          renderModalFilesList(activeEditingProject.files);
          showToast('Deliverable file removed.');
        }
      });
    });
  }

  /* --- INVOICE EDITOR MODAL LOGIC (CREATE & EDIT) --- */
  const invoiceEditorModal = document.getElementById('invoice-editor-modal');
  const invoiceEditorForm = document.getElementById('invoice-editor-form');
  const addInvoiceBtn = document.getElementById('pmodal-add-invoice-btn');
  const invModalCloseBtn = document.getElementById('inv-modal-close-btn');
  const invModalCancelBtn = document.getElementById('inv-modal-cancel-btn');

  function openInvoiceEditor(invId = null) {
    if (!activeEditingProject || !invoiceEditorModal) return;

    const editIdInput = document.getElementById('inv-edit-id');
    const numberInput = document.getElementById('inv-edit-number');
    const dateInput = document.getElementById('inv-edit-date');
    const dueDateInput = document.getElementById('inv-edit-duedate');
    const amountInput = document.getElementById('inv-edit-amount');
    const statusSelect = document.getElementById('inv-edit-status');
    const taxCheck = document.getElementById('inv-edit-tax-check');
    const descInput = document.getElementById('inv-edit-item-desc');
    const heading = document.getElementById('inv-modal-heading');

    const todayStr = new Date().toISOString().split('T')[0];

    if (invId) {
      // Editing existing invoice
      const inv = (activeEditingProject.invoices || []).find(i => i.id === invId);
      if (!inv) return;
      heading.textContent = `🧾 Edit Tax Invoice (${inv.number || inv.id})`;
      editIdInput.value = inv.id;
      numberInput.value = inv.number || inv.id;
      dateInput.value = inv.date || todayStr;
      dueDateInput.value = inv.dueDate || todayStr;
      amountInput.value = inv.amount || 0;
      statusSelect.value = inv.status || 'paid';
      taxCheck.checked = inv.tax !== 0;
      descInput.value = (inv.items && inv.items[0]) ? inv.items[0].desc : (activeEditingProject.package + ' - ' + activeEditingProject.service);
    } else {
      // Adding new invoice
      const newNum = 'RAJ/' + new Date().getFullYear() + '/' + Math.floor(100 + Math.random() * 900);
      heading.textContent = '🧾 Create New Tax Invoice';
      editIdInput.value = '';
      numberInput.value = newNum;
      dateInput.value = todayStr;
      dueDateInput.value = todayStr;
      const parsedAmount = parseInt(String(activeEditingProject.budget || '').replace(/\D/g, ''), 10) || 24999;
      amountInput.value = parsedAmount;
      statusSelect.value = 'paid';
      taxCheck.checked = true;
      descInput.value = `${activeEditingProject.service} - ${activeEditingProject.package}`;
    }

    invoiceEditorModal.classList.add('show');
  }

  function closeInvoiceEditor() {
    if (invoiceEditorModal) invoiceEditorModal.classList.remove('show');
  }

  if (addInvoiceBtn) addInvoiceBtn.addEventListener('click', () => openInvoiceEditor(null));
  if (invModalCloseBtn) invModalCloseBtn.addEventListener('click', closeInvoiceEditor);
  if (invModalCancelBtn) invModalCancelBtn.addEventListener('click', closeInvoiceEditor);

  if (invoiceEditorForm) {
    invoiceEditorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeEditingProject) return;

      const editId = document.getElementById('inv-edit-id').value;
      const number = document.getElementById('inv-edit-number').value.trim();
      const date = document.getElementById('inv-edit-date').value;
      const dueDate = document.getElementById('inv-edit-duedate').value;
      const baseAmount = parseFloat(document.getElementById('inv-edit-amount').value) || 0;
      const status = document.getElementById('inv-edit-status').value;
      const applyTax = document.getElementById('inv-edit-tax-check').checked;
      const itemDesc = document.getElementById('inv-edit-item-desc').value.trim() || 'Digital Solution Deliverable';

      const taxAmount = applyTax ? Math.round(baseAmount * 0.18 * 100) / 100 : 0;
      const totalAmount = Math.round((baseAmount + taxAmount) * 100) / 100;

      const invoiceObj = {
        id: editId || ('INV-' + Date.now()),
        number: number,
        date: date,
        dueDate: dueDate,
        amount: baseAmount,
        tax: taxAmount,
        total: totalAmount,
        status: status,
        items: [
          { desc: itemDesc, qty: 1, rate: baseAmount, amount: baseAmount }
        ]
      };

      activeEditingProject.invoices = activeEditingProject.invoices || [];
      if (editId) {
        const idx = activeEditingProject.invoices.findIndex(i => i.id === editId);
        if (idx !== -1) activeEditingProject.invoices[idx] = invoiceObj;
        else activeEditingProject.invoices.push(invoiceObj);
      } else {
        activeEditingProject.invoices.push(invoiceObj);
      }

      try {
        if (window.RajluxFirebase && typeof window.RajluxFirebase.updateProjectData === 'function') {
          await window.RajluxFirebase.updateProjectData(activeEditingProject.id, { invoices: activeEditingProject.invoices });
        } else {
          const stored = localStorage.getItem('rajlux_projects');
          let list = stored ? JSON.parse(stored) : [];
          const idx2 = list.findIndex(p => p.id === activeEditingProject.id);
          if (idx2 !== -1) { list[idx2].invoices = activeEditingProject.invoices; localStorage.setItem('rajlux_projects', JSON.stringify(list)); }
        }
        renderModalInvoicesList(activeEditingProject.invoices);
        closeInvoiceEditor();
        showToast(`✅ Invoice ${number} saved & synced to Client Portal!`);
      } catch (err) {
        console.error('Invoice save error:', err);
        showToast('❌ Error saving invoice.');
      }
    });
  }

  /* --- FILE EDITOR MODAL LOGIC (ADD ATTACHMENT) --- */
  const fileEditorModal = document.getElementById('file-editor-modal');
  const fileEditorForm = document.getElementById('file-editor-form');
  const addFileBtn = document.getElementById('pmodal-add-file-btn');
  const fileModalCloseBtn = document.getElementById('file-modal-close-btn');
  const fileModalCancelBtn = document.getElementById('file-modal-cancel-btn');

  function openFileEditor() {
    if (!activeEditingProject || !fileEditorModal) return;
    document.getElementById('file-edit-name').value = `${activeEditingProject.service.replace(/\s+/g, '-')}-Specification-Doc.pdf`;
    document.getElementById('file-edit-type').value = 'document';
    document.getElementById('file-edit-tag').value = 'Tech Specs';
    document.getElementById('file-edit-url').value = '#download-spec-doc';
    fileEditorModal.classList.add('show');
  }

  function closeFileEditor() {
    if (fileEditorModal) fileEditorModal.classList.remove('show');
  }

  if (addFileBtn) addFileBtn.addEventListener('click', openFileEditor);
  if (fileModalCloseBtn) fileModalCloseBtn.addEventListener('click', closeFileEditor);
  if (fileModalCancelBtn) fileModalCancelBtn.addEventListener('click', closeFileEditor);

  if (fileEditorForm) {
    fileEditorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeEditingProject) return;

      const name = document.getElementById('file-edit-name').value.trim();
      const type = document.getElementById('file-edit-type').value;
      const tag = document.getElementById('file-edit-tag').value.trim() || 'Deliverable';
      const url = document.getElementById('file-edit-url').value.trim();

      const newFile = {
        id: 'f_' + Date.now(),
        name: name,
        type: type,
        size: type === 'link' ? 'Live Link' : '2.5 MB',
        date: new Date().toISOString().split('T')[0],
        url: url,
        tag: tag
      };

      activeEditingProject.files = activeEditingProject.files || [];
      activeEditingProject.files.push(newFile);

      try {
        if (window.RajluxFirebase && typeof window.RajluxFirebase.updateProjectData === 'function') {
          await window.RajluxFirebase.updateProjectData(activeEditingProject.id, { files: activeEditingProject.files });
        } else {
          const stored = localStorage.getItem('rajlux_projects');
          let list = stored ? JSON.parse(stored) : [];
          const idx = list.findIndex(p => p.id === activeEditingProject.id);
          if (idx !== -1) { list[idx].files = activeEditingProject.files; localStorage.setItem('rajlux_projects', JSON.stringify(list)); }
        }
        renderModalFilesList(activeEditingProject.files);
        closeFileEditor();
        showToast(`✅ Deliverable file "${name}" attached & available to Client Portal!`);
      } catch (err) {
        console.error('File attach error:', err);
        showToast('❌ Error attaching file.');
      }
    });
  }

  /* --- DYNAMIC FILE DOWNLOAD UTILITY (ADMIN & PORTAL REUSABLE) --- */
  function triggerDeliverableDownload(file, projectTitle = 'Rajlux Project', clientName = 'Client') {
    if (!file) return;

    // If it's an external web URL (starts with http)
    if (file.url && (file.url.startsWith('http://') || file.url.startsWith('https://'))) {
      window.open(file.url, '_blank');
      return;
    }

    // Dynamic Blob content generator for specs, zip release bundles, warranty certs
    let contentText = '';
    let fileName = file.name || 'Rajlux-Deliverable.txt';
    let mimeType = 'application/pdf';

    if (file.name.endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (file.name.endsWith('.zip')) {
      mimeType = 'application/zip';
    } else {
      mimeType = 'text/plain';
    }

    // Generate meaningful printable specification content
    contentText = `============================================================\n` +
      `RAJLUX DIGITAL SOLUTIONS PVT LTD - OFFICIAL DELIVERABLE\n` +
      `============================================================\n\n` +
      `Document Name: ${file.name}\n` +
      `Project Title: ${projectTitle}\n` +
      `Client Name:   ${clientName}\n` +
      `Asset Type:    ${file.type || 'Document'}\n` +
      `Category Tag:  ${file.tag || 'Official Asset'}\n` +
      `Release Date:  ${file.date || new Date().toLocaleDateString()}\n\n` +
      `------------------------------------------------------------\n` +
      `SUMMARY & TECHNICAL SPECIFICATIONS:\n` +
      `------------------------------------------------------------\n` +
      `1. Architecture: Fully verified and security tested code base.\n` +
      `2. Compatibility: Multi-platform responsive support.\n` +
      `3. Handover Status: Lifetime Support & Security Warranty Active.\n\n` +
      `For support inquiries, contact: rajlux7733@gmail.com | +91 63695 89185\n` +
      `© ${new Date().getFullYear()} Rajlux Digital Solutions Pvt Ltd. All Rights Reserved.`;

    const blob = new Blob([contentText], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    showToast(`📥 Downloading "${fileName}"...`);
  }

  /* --- PRINT / DOWNLOAD INVOICE PDF IN ADMIN --- */
  function downloadInvoicePdfAdmin(invId) {
    if (!activeEditingProject) return;
    const inv = (activeEditingProject.invoices || []).find(i => i.id === invId);
    if (!inv) return;

    if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 38, 'F');
      doc.setTextColor(255, 215, 0);
      doc.setFontSize(16);
      doc.text('👑 RAJLUX DIGITAL SOLUTIONS PVT LTD', 14, 18);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('OFFICIAL TAX INVOICE', 14, 26);
      doc.text(`Invoice #: ${inv.number || inv.id}`, 145, 18);
      doc.text(`Date: ${inv.date}`, 145, 26);

      // Billed To & Meta
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Billed To: ${activeEditingProject.clientName}`, 14, 48);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Email: ${activeEditingProject.clientEmail}`, 14, 55);
      doc.text(`Project ID: ${activeEditingProject.id}`, 14, 61);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Payment Status: ${(inv.status || 'PAID').toUpperCase()}`, 140, 48);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Due Date: ${inv.dueDate || 'Upon Receipt'}`, 140, 55);

      // Table
      const tableData = (inv.items || [{ desc: activeEditingProject.service, qty: 1, rate: inv.amount, amount: inv.amount }]).map(item => [
        item.desc,
        String(item.qty || 1),
        `Rs. ${Number(item.rate || 0).toLocaleString('en-IN')}`,
        `Rs. ${Number(item.amount || 0).toLocaleString('en-IN')}`
      ]);

      if (doc.autoTable) {
        doc.autoTable({
          startY: 70,
          head: [['Item Description', 'Qty', 'Rate (INR)', 'Amount (INR)']],
          body: tableData,
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 215, 0] }
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`Subtotal: Rs. ${Number(inv.amount || 0).toLocaleString('en-IN')}`, 130, finalY);
        doc.text(`GST (18%): Rs. ${Number(inv.tax || (inv.amount * 0.18)).toLocaleString('en-IN')}`, 130, finalY + 7);
        doc.setFontSize(12);
        doc.text(`Grand Total: Rs. ${Number(inv.total || (inv.amount * 1.18)).toLocaleString('en-IN')}`, 130, finalY + 16);
      }

      doc.save(`Rajlux_Invoice_${inv.number || inv.id}.pdf`);
      showToast(`📄 Downloaded Tax Invoice PDF: ${inv.number || inv.id}`);
    } else {
      window.print();
    }
  }

  // Progress Slider Input Event (Live %)
  if (pmodalProgressSlider) {
    pmodalProgressSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      if (pmodalProgressValBadge) pmodalProgressValBadge.textContent = `${val}%`;

      // Auto-update status if 100%
      const statusSelect = document.getElementById('pmodal-status-select');
      if (val >= 100 && statusSelect) {
        statusSelect.value = 'completed';
      } else if (val > 0 && statusSelect && statusSelect.value === 'pending_approval') {
        statusSelect.value = 'in_progress';
      }
    });
  }

  // Save Project Changes
  if (projectEditorForm) {
    projectEditorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeEditingProject) return;

      const saveBtn = document.getElementById('pmodal-save-btn');
      if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Saving...'; }

      const progress = Number(pmodalProgressSlider.value);
      const status = document.getElementById('pmodal-status-select').value;
      const leadEng = document.getElementById('pmodal-lead-eng').value.trim();
      const targetDate = document.getElementById('pmodal-target-date').value.trim();
      const budget = document.getElementById('pmodal-budget').value.trim();
      const desc = document.getElementById('pmodal-desc').value.trim();

      // Checkbox milestones
      const milestones = (activeEditingProject.milestones || []).map((m, i) => {
        const checkbox = document.getElementById(`ms_check_${i}`);
        const isChecked = checkbox ? checkbox.checked : false;
        return {
          ...m,
          status: isChecked ? 'completed' : (progress >= m.percent ? 'completed' : (progress >= (m.percent - 25) ? 'in_progress' : 'pending'))
        };
      });

      const updates = {
        progress: progress,
        status: status,
        leadEngineer: leadEng,
        targetDate: targetDate,
        budget: budget,
        description: desc,
        milestones: milestones
      };

      try {
        if (window.RajluxFirebase && typeof window.RajluxFirebase.updateProjectData === 'function') {
          const res = await window.RajluxFirebase.updateProjectData(activeEditingProject.id, updates);
          if (res.success) {
            showToast(`✅ Project ${activeEditingProject.id} updated & synced to Client Portal!`);
          } else {
            showToast(`✅ Project saved locally!`);
          }
        } else {
          // localStorage fallback
          const stored = localStorage.getItem('rajlux_projects');
          let list = stored ? JSON.parse(stored) : [];
          const idx = list.findIndex(p => p.id === activeEditingProject.id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...updates };
            localStorage.setItem('rajlux_projects', JSON.stringify(list));
          }
          showToast(`✅ Project ${activeEditingProject.id} saved locally!`);
        }
        closeProjectEditor();
        await loadAndRenderProjects();
      } catch (err) {
        console.error('Save error:', err);
        showToast('❌ Error saving project. Check console.');
      } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '💾 Save Changes &amp; Sync Client Portal'; }
      }
    });
  }

  // Send Admin Chat Message to Client Portal
  if (pmodalSendChatBtn && pmodalAdminChatInput) {
    pmodalSendChatBtn.addEventListener('click', async () => {
      const text = pmodalAdminChatInput.value.trim();
      if (!text || !activeEditingProject) return;

      const msgObj = {
        sender: 'team',
        senderName: 'Rajlux Management',
        senderRole: 'Admin',
        text: text
      };

      try {
        if (window.RajluxFirebase && typeof window.RajluxFirebase.sendProjectChat === 'function') {
          await window.RajluxFirebase.sendProjectChat(activeEditingProject.id, msgObj);
        } else {
          // localStorage fallback
          const stored = localStorage.getItem('rajlux_projects');
          let list = stored ? JSON.parse(stored) : [];
          const idx = list.findIndex(p => p.id === activeEditingProject.id);
          if (idx !== -1) {
            list[idx].chat = list[idx].chat || [];
            list[idx].chat.push({ id: 'c_' + Date.now(), ...msgObj, timestamp: new Date().toISOString() });
            localStorage.setItem('rajlux_projects', JSON.stringify(list));
          }
        }
        pmodalAdminChatInput.value = '';
        showToast(`💬 Message sent to ${activeEditingProject.clientName}'s portal!`);
      } catch (err) {
        console.error('Chat error:', err);
        showToast('❌ Error sending message.');
      }
    });
  }

  // Delete Project
  if (pmodalDeleteProjectBtn) {
    pmodalDeleteProjectBtn.addEventListener('click', async () => {
      if (!activeEditingProject) return;
      if (confirm(`Are you sure you want to delete project ${activeEditingProject.id}?`)) {
        try {
          const projToDelete = activeEditingProject;

          // 1. Delete from Firebase Firestore (try both docId and id as the document key)
          if (window.RajluxFirebase && window.RajluxFirebase.db && window.RajluxFirebase.firebaseInitialized) {
            const keysToTry = new Set();
            if (projToDelete.docId) keysToTry.add(projToDelete.docId);
            if (projToDelete.id) keysToTry.add(projToDelete.id);
            if (projToDelete.requestRef) keysToTry.add(projToDelete.requestRef);
            for (const key of keysToTry) {
              try { await window.RajluxFirebase.db.collection('projects').doc(key).delete(); } catch (err) {}
            }
          } else if (window.RajluxFirebase && typeof window.RajluxFirebase.deleteProjectFromDb === 'function') {
            try { await window.RajluxFirebase.deleteProjectFromDb(projToDelete.docId || projToDelete.id); } catch (err) {}
          }

          // 2. Remove from localStorage cache
          const stored = localStorage.getItem('rajlux_projects');
          let list = stored ? JSON.parse(stored) : [];
          list = list.filter(p =>
            p.id !== projToDelete.id &&
            p.requestRef !== projToDelete.id &&
            p.docId !== projToDelete.docId &&
            p.docId !== projToDelete.id &&
            p.id !== projToDelete.requestRef
          );
          localStorage.setItem('rajlux_projects', JSON.stringify(list));

          closeProjectEditor();
          showToast('🗑️ Project deleted successfully.');

          // 3. Reload - use local list so Firebase can't bring it back
          currentProjectsList = list;
          renderProjectsMetrics();
          renderPendingApprovals();
          renderProjectsTable();
        } catch (e) {
          console.error('Delete project error:', e);
          showToast('❌ Error deleting project.');
        }
      }
    });
  }

  function closeProjectEditor() {
    if (projectEditorModal) {
      projectEditorModal.classList.remove('show');
      activeEditingProject = null;
    }
  }

  if (projectModalCloseBtn) projectModalCloseBtn.addEventListener('click', closeProjectEditor);
  if (projectEditorModal) {
    projectEditorModal.addEventListener('click', (e) => {
      if (e.target === projectEditorModal) closeProjectEditor();
    });
  }

  // Track pending approvals to prevent double-click race conditions
  const pendingApprovalIds = new Set();

  // Delegated click handler for project actions (ensures dynamic buttons never fail)
  document.addEventListener('click', async (e) => {
    const approveBtn = e.target.closest('.btn-approve');
    if (approveBtn) {
      e.preventDefault();
      const reqId = approveBtn.getAttribute('data-approve-id');
      if (!reqId) return;

      // Prevent double-clicking the same project
      if (pendingApprovalIds.has(reqId)) return;
      pendingApprovalIds.add(reqId);

      approveBtn.innerHTML = '⏳ Generating Project ID...';
      approveBtn.disabled = true;

      try {
        let approved = false;
        let officialId = '';

        if (window.RajluxFirebase && typeof window.RajluxFirebase.approveProject === 'function') {
          const res = await window.RajluxFirebase.approveProject(reqId, {
            status: 'in_progress',
            progress: 20
          });
          if (res && res.success) {
            approved = true;
            officialId = res.project ? res.project.id : '';
          }
        }

        // Fallback: update localStorage only
        if (!approved) {
          const stored = localStorage.getItem('rajlux_projects');
          let list = stored ? JSON.parse(stored) : [];
          const cleanId = String(reqId || '').trim().toUpperCase();
          const idx = list.findIndex(p =>
            (p.id && String(p.id).trim().toUpperCase() === cleanId) ||
            (p.requestRef && String(p.requestRef).trim().toUpperCase() === cleanId) ||
            (p.docId && String(p.docId).trim().toUpperCase() === cleanId)
          );
          if (idx !== -1) {
            officialId = 'RL-PRJ-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
            list[idx] = {
              ...list[idx],
              id: officialId,
              status: 'in_progress',
              progress: 20,
              startDate: new Date().toISOString().split('T')[0],
              leadEngineer: list[idx].leadEngineer || 'Palanisamy R. (Lead Architect)',
              chat: [...(list[idx].chat || []), {
                id: 'c_' + Date.now(),
                sender: 'team',
                senderName: 'Rajlux Admin',
                senderRole: 'Management',
                text: `🎉 Project APPROVED! Official Project ID: ${officialId}. Development has kicked off!`,
                timestamp: new Date().toISOString()
              }]
            };
            localStorage.setItem('rajlux_projects', JSON.stringify(list));
            approved = true;
            // Update in-memory list immediately so re-render uses fresh data
            currentProjectsList = list;
          }
        }

        if (approved) {
          showToast(`🎉 Project Approved! Official Project ID: ${officialId}`);
          // Re-render from the already-updated in-memory list to avoid Firebase
          // returning stale data and re-showing the approved project as pending
          renderProjectsMetrics();
          renderPendingApprovals();
          renderProjectsTable();
        } else {
          showToast('⚠️ Project not found. Refreshing list...');
          await loadAndRenderProjects();
        }
      } catch (err) {
        console.error('Approve error:', err);
        showToast('❌ Error approving project.');
        approveBtn.disabled = false;
        approveBtn.innerHTML = '✓ Approve & Issue Project ID 🚀';
      } finally {
        pendingApprovalIds.delete(reqId);
      }
      return;
    }

    const manageBtn = e.target.closest('.btn-manage-prj');
    if (manageBtn && manageBtn.tagName === 'BUTTON' && manageBtn.hasAttribute('data-edit-id')) {
      e.preventDefault();
      const editId = manageBtn.getAttribute('data-edit-id');
      openProjectEditor(editId);
      return;
    }
  });

  // Listen to cross-tab updates (e.g. when customer submits request on website)
  window.addEventListener('rajlux-projects-updated', () => {
    loadAndRenderProjects();
  });

  if ('BroadcastChannel' in window) {
    const bc = new BroadcastChannel('rajlux_admin_channel');
    bc.onmessage = (event) => {
      if (event.data && event.data.type === 'NEW_PROJECT_REQUEST') {
        showToast(`📬 New Project Request Received from ${event.data.project.clientName}!`);
        loadAndRenderProjects();
      }
    };
  }

  /* ==========================================================
     13. INITIALIZE ADMIN PORTAL
     ========================================================== */
  function initAdminPortal() {
    // Initialize Messages
    if (window.RajluxFirebase) {
      if (firestoreUnsubscribe) { firestoreUnsubscribe(); firestoreUnsubscribe = null; }

      firestoreUnsubscribe = window.RajluxFirebase.subscribeToMessages((messages, mode) => {
        onMessagesUpdate(messages, mode);
        if (messages.length === 0) {
          addSampleData(false);
        }
      });
    } else {
      autoSeedIfEmpty();
      try {
        const data = localStorage.getItem('rajlux_messages');
        currentMessages = data ? JSON.parse(data) : [];
      } catch (e) { currentMessages = []; }
      updateStorageStatusBadge('local');
      renderDashboard();
      renderInbox();
    }

    // Initialize Projects & Approvals
    loadAndRenderProjects();
  }

  checkSession();

});
