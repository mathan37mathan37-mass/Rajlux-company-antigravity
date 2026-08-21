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
      if (el) { el.textContent = 'Firebase'; el.style.color = '#4ade80'; }
      if (headerStatus) headerStatus.textContent = 'Firebase Live';
    } else {
      if (el) { el.textContent = 'Local'; el.style.color = 'var(--gold-primary)'; }
      if (headerStatus) headerStatus.textContent = 'Local Storage';
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

  // Firebase config form
  const firebaseConfigForm = document.getElementById('firebase-config-form');
  if (firebaseConfigForm) {
    // Pre-fill existing config
    const existingConfig = window.RajluxFirebase ? window.RajluxFirebase.getFirebaseConfig() : {};
    const fillField = (id, val) => {
      const el = document.getElementById(id);
      if (el && val && !val.includes('YOUR_API_KEY_HERE')) el.value = val;
    };
    fillField('fb-apikey', existingConfig.apiKey);
    fillField('fb-authdomain', existingConfig.authDomain);
    fillField('fb-projectid', existingConfig.projectId);
    fillField('fb-appid', existingConfig.appId);

    firebaseConfigForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newConfig = {
        apiKey: document.getElementById('fb-apikey').value.trim(),
        authDomain: document.getElementById('fb-authdomain').value.trim(),
        projectId: document.getElementById('fb-projectid').value.trim(),
        storageBucket: document.getElementById('fb-authdomain').value.trim().replace('.firebaseapp.com', '.firebasestorage.app'),
        messagingSenderId: existingConfig.messagingSenderId || '',
        appId: document.getElementById('fb-appid').value.trim()
      };

      if (!newConfig.apiKey || !newConfig.projectId) {
        showToast('Please fill in API Key and Project ID at minimum.');
        return;
      }

      if (window.RajluxFirebase) {
        window.RajluxFirebase.saveFirebaseConfig(newConfig);
        showToast('Firebase config saved! Reconnecting... 🔥');
        setTimeout(() => initAdminPortal(), 1500);
      }
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
     12. INITIALIZE ADMIN PORTAL
     ========================================================== */
  function initAdminPortal() {
    if (window.RajluxFirebase) {
      // Unsubscribe previous listener
      if (firestoreUnsubscribe) { firestoreUnsubscribe(); firestoreUnsubscribe = null; }

      // Subscribe to Firebase or local
      firestoreUnsubscribe = window.RajluxFirebase.subscribeToMessages((messages, mode) => {
        onMessagesUpdate(messages, mode);
        // Auto-seed on first load if empty
        if (messages.length === 0) {
          addSampleData(false);
        }
      });
    } else {
      // Pure local fallback
      autoSeedIfEmpty();
      try {
        const data = localStorage.getItem('rajlux_messages');
        currentMessages = data ? JSON.parse(data) : [];
      } catch (e) { currentMessages = []; }
      updateStorageStatusBadge('local');
      renderDashboard();
      renderInbox();
    }
  }

  checkSession();

});
