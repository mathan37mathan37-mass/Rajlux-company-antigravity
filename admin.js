/* ============================================================
   RAJLUX DIGITAL SOLUTIONS – ADMIN MANAGEMENT PORTAL SCRIPT
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
     2. NAVIGATION & TABS
     ========================================================== */
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');

  function switchTab(tabId) {
    navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
    });
    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
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
     3. MESSAGES DATA MANAGER
     ========================================================== */
  let currentMessages = [];
  let selectedMessageId = null;

  function getMessagesFromStorage() {
    try {
      const data = localStorage.getItem('rajlux_messages');
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error parsing messages:', err);
      return [];
    }
  }

  function saveMessagesToStorage(messages) {
    localStorage.setItem('rajlux_messages', JSON.stringify(messages));
    window.dispatchEvent(new Event('storage'));
  }

  function reloadData() {
    currentMessages = getMessagesFromStorage();
    renderDashboard();
    renderInbox();
  }

  /* Real-time Broadcast & Storage Listeners */
  window.addEventListener('storage', () => {
    currentMessages = getMessagesFromStorage();
    renderDashboard();
    renderInbox();
  });

  if ('BroadcastChannel' in window) {
    const bc = new BroadcastChannel('rajlux_admin_channel');
    bc.onmessage = (event) => {
      if (event.data && event.data.type === 'NEW_MESSAGE') {
        showToast('🔔 New Customer Message Received from ' + event.data.message.name);
        reloadData();
      }
    };
  }

  /* ==========================================================
     4. RENDER DASHBOARD
     ========================================================== */
  function renderDashboard() {
    const totalCount = currentMessages.length;
    const unreadCount = currentMessages.filter(m => m.status === 'unread').length;

    document.getElementById('stat-total-val').textContent = totalCount;
    document.getElementById('stat-unread-val').textContent = unreadCount;
    document.getElementById('unread-count-badge').textContent = unreadCount;

    // Top Service calculation
    const serviceCounts = {};
    currentMessages.forEach(m => {
      const srv = m.service || 'General Inquiry';
      serviceCounts[srv] = (serviceCounts[srv] || 0) + 1;
    });

    let topSrv = '-';
    let maxCount = 0;
    for (const [srv, count] of Object.entries(serviceCounts)) {
      if (count > maxCount) {
        maxCount = count;
        topSrv = srv;
      }
    }
    document.getElementById('stat-top-service-val').textContent = topSrv;

    // Recent list (last 4)
    const recentList = document.getElementById('dash-recent-list');
    recentList.innerHTML = '';

    if (currentMessages.length === 0) {
      recentList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>No messages received yet. Submit a message on the main website to see it appear here!</p>
        </div>
      `;
      return;
    }

    const recent = currentMessages.slice(0, 4);
    recent.forEach(msg => {
      const item = document.createElement('div');
      item.className = 'messages-table-wrap';
      item.style.padding = '16px 20px';
      item.style.marginBottom = '12px';
      item.style.cursor = 'pointer';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'space-between';
      item.style.background = msg.status === 'unread' ? 'rgba(255, 215, 0, 0.04)' : 'rgba(255, 255, 255, 0.02)';

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 14px;">
          ${msg.status === 'unread' ? '<span class="unread-dot"></span>' : ''}
          <div>
            <strong style="font-family: var(--font-heading);">${escapeHtml(msg.name)}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 8px;">(${escapeHtml(msg.email)})</span>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">
              ${escapeHtml(msg.message.length > 70 ? msg.message.substring(0, 70) + '...' : msg.message)}
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          <span class="service-badge">${escapeHtml(msg.service)}</span>
          <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">${escapeHtml(msg.dateStr || '')}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        openDetailModal(msg.id);
      });

      recentList.appendChild(item);
    });
  }

  /* ==========================================================
     5. RENDER INBOX TABLE & FILTERS
     ========================================================== */
  const inboxSearch = document.getElementById('inbox-search');
  const inboxStatusFilter = document.getElementById('inbox-status-filter');
  const inboxServiceFilter = document.getElementById('inbox-service-filter');
  const tableBody = document.getElementById('inbox-table-body');

  function renderInbox() {
    const query = inboxSearch ? inboxSearch.value.toLowerCase().trim() : '';
    const statusVal = inboxStatusFilter ? inboxStatusFilter.value : 'all';
    const serviceVal = inboxServiceFilter ? inboxServiceFilter.value : 'all';

    const filtered = currentMessages.filter(msg => {
      const matchQuery = !query ||
        msg.name.toLowerCase().includes(query) ||
        msg.email.toLowerCase().includes(query) ||
        msg.phone.toLowerCase().includes(query) ||
        msg.message.toLowerCase().includes(query);

      const matchStatus = statusVal === 'all' || msg.status === statusVal;
      const matchService = serviceVal === 'all' || msg.service === serviceVal;

      return matchQuery && matchStatus && matchService;
    });

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
      return;
    }

    filtered.forEach(msg => {
      const tr = document.createElement('tr');
      if (msg.status === 'unread') tr.classList.add('unread');

      tr.innerHTML = `
        <td>
          ${msg.status === 'unread' ? '<span class="unread-dot" title="Unread"></span><span style="font-size: 0.75rem; color: var(--gold-primary);">New</span>' : '<span style="font-size: 0.75rem; color: var(--text-dim);">Read</span>'}
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
            <button class="btn-icon view-btn" title="View Details" data-id="${msg.id}">👁️</button>
            <button class="btn-icon toggle-read-btn" title="${msg.status === 'unread' ? 'Mark Read' : 'Mark Unread'}" data-id="${msg.id}">
              ${msg.status === 'unread' ? '✅' : '✉️'}
            </button>
            <button class="btn-icon delete delete-btn" title="Delete Message" data-id="${msg.id}">🗑️</button>
          </div>
        </td>
      `;

      tr.addEventListener('click', () => {
        openDetailModal(msg.id);
      });

      tableBody.appendChild(tr);
    });

    // Attach button listeners inside table
    tableBody.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDetailModal(btn.getAttribute('data-id'));
      });
    });

    tableBody.querySelectorAll('.toggle-read-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleReadStatus(btn.getAttribute('data-id'));
      });
    });

    tableBody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteMessage(btn.getAttribute('data-id'));
      });
    });
  }

  if (inboxSearch) inboxSearch.addEventListener('input', renderInbox);
  if (inboxStatusFilter) inboxStatusFilter.addEventListener('change', renderInbox);
  if (inboxServiceFilter) inboxServiceFilter.addEventListener('change', renderInbox);

  /* ==========================================================
     6. MESSAGE DETAIL MODAL & ACTIONS
     ========================================================== */
  const detailModal = document.getElementById('detail-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  function openDetailModal(msgId) {
    const msg = currentMessages.find(m => m.id === msgId);
    if (!msg) return;

    selectedMessageId = msgId;

    // Mark as read automatically
    if (msg.status === 'unread') {
      msg.status = 'read';
      saveMessagesToStorage(currentMessages);
    }

    document.getElementById('modal-sender-name').textContent = msg.name;
    document.getElementById('modal-sender-email').textContent = '📧 ' + msg.email;
    document.getElementById('modal-sender-phone').textContent = '📞 ' + msg.phone;
    document.getElementById('modal-date').textContent = '📅 ' + (msg.dateStr || '');
    document.getElementById('modal-service').textContent = msg.service;
    document.getElementById('modal-message-body').textContent = msg.message;

    // Setup WhatsApp Reply
    const cleanPhone = msg.phone.replace(/[^0-9]/g, '');
    const waBtn = document.getElementById('modal-wa-btn');
    if (cleanPhone.length >= 10) {
      const waText = encodeURIComponent(`Hello ${msg.name}, thank you for contacting Rajlux Digital Solutions regarding ${msg.service}! We would love to discuss your project.`);
      waBtn.href = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${waText}`;
      waBtn.style.display = 'inline-flex';
    } else {
      waBtn.style.display = 'none';
    }

    // Setup Email Reply
    const emailBtn = document.getElementById('modal-email-btn');
    const emailSubject = encodeURIComponent(`Rajlux Digital Solutions – Re: ${msg.service}`);
    const emailBody = encodeURIComponent(`Hi ${msg.name},\n\nThank you for reaching out to Rajlux Digital Solutions regarding your inquiry:\n\n"${msg.message}"\n\nBest regards,\nRajlux Digital Solutions Pvt Ltd`);
    emailBtn.href = `mailto:${msg.email}?subject=${emailSubject}&body=${emailBody}`;

    detailModal.classList.add('show');
    reloadData();
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

  function toggleReadStatus(msgId) {
    const msg = currentMessages.find(m => m.id === msgId);
    if (msg) {
      msg.status = msg.status === 'unread' ? 'read' : 'unread';
      saveMessagesToStorage(currentMessages);
      showToast(`Message marked as ${msg.status}.`);
    }
  }

  function deleteMessage(msgId) {
    if (confirm('Are you sure you want to delete this customer message?')) {
      currentMessages = currentMessages.filter(m => m.id !== msgId);
      saveMessagesToStorage(currentMessages);
      showToast('Message deleted.');
    }
  }

  /* ==========================================================
     7. CSV EXPORTER
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
        csv += `${m.id},${cleanName},${m.email},${m.phone},"${m.service}",${cleanMsg},"${m.dateStr}",${m.status}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rajlux_Customer_Messages_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Downloaded messages CSV report! 📥');
    });
  }

  /* ==========================================================
     8. SETTINGS & SAMPLE DATA DEMO
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
      showToast('Admin password updated successfully! 🔒');
      pwdChangeForm.reset();
    });
  }

  const demoMsgBtn = document.getElementById('demo-msg-btn');
  const seedDemoBtn = document.getElementById('seed-demo-btn');

  function addSampleData() {
    const samples = [
      {
        id: 'MSG-DEMO-1',
        name: 'Arun Prakash',
        email: 'arun.prakash@techfirm.in',
        phone: '+91 98765 43210',
        service: 'Web Development',
        message: 'Hi Rajlux team, we need a complete enterprise web application with custom admin dashboard and payment gateway integration. Please share consultation time.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        dateStr: 'Aug 9, 2026 6:30 PM',
        status: 'unread',
        starred: false
      },
      {
        id: 'MSG-DEMO-2',
        name: 'Kavitha Ramesh',
        email: 'kavitha@luxeinterior.com',
        phone: '+91 91234 56789',
        service: 'Branding & Identity',
        message: 'Looking for logo design, visual brand identity guidelines, and social media banners for our luxury interior design startup.',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        dateStr: 'Aug 8, 2026 2:15 PM',
        status: 'unread',
        starred: false
      },
      {
        id: 'MSG-DEMO-3',
        name: 'Suresh Kumar',
        email: 'suresh@swiftmart.in',
        phone: '+91 99887 76655',
        service: 'Mobile App Development',
        message: 'We want to build a cross-platform iOS and Android mobile app for grocery delivery with real-time order tracking.',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        dateStr: 'Aug 7, 2026 11:45 AM',
        status: 'read',
        starred: false
      }
    ];

    currentMessages = [...samples, ...currentMessages];
    saveMessagesToStorage(currentMessages);
    showToast('Loaded sample customer messages! 📦');
  }

  if (demoMsgBtn) demoMsgBtn.addEventListener('click', addSampleData);
  if (seedDemoBtn) seedDemoBtn.addEventListener('click', addSampleData);

  const clearAllBtn = document.getElementById('clear-all-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete ALL customer messages? This cannot be undone.')) {
        currentMessages = [];
        saveMessagesToStorage(currentMessages);
        showToast('All messages cleared.');
      }
    });
  }

  const refreshBtn = document.getElementById('dash-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      reloadData();
      showToast('Dashboard refreshed.');
    });
  }

  /* ==========================================================
     9. TOAST NOTIFICATION UTILITY
     ========================================================== */
  const adminToast = document.getElementById('admin-toast');
  function showToast(text) {
    if (!adminToast) return;
    adminToast.textContent = text;
    adminToast.classList.add('show');
    setTimeout(() => {
      adminToast.classList.remove('show');
    }, 3500);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Initialize */
  function initAdminPortal() {
    reloadData();
  }

  checkSession();

});
