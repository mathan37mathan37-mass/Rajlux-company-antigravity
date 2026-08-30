/* ============================================================
   RAJLUX DIGITAL SOLUTIONS – CLIENT PROJECT PORTAL SCRIPT
   Progress Percentage (%) Engine + Milestones + Team Chat + Invoices
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  let currentProject = null;
  let activeTab = 'tab-milestones';

  // DOM Elements
  const loginModal = document.getElementById('portal-login-modal');
  const loginForm = document.getElementById('portal-login-form');
  const loginProjectIdInput = document.getElementById('login-project-id');
  const loginClientAuthInput = document.getElementById('login-client-auth');
  const loginErrorMsg = document.getElementById('portal-login-error');
  const logoutBtn = document.getElementById('portal-logout-btn');
  const refreshBtn = document.getElementById('refresh-project-btn');

  /* ==========================================================
     1. AUTHENTICATION & SESSION MANAGEMENT
     ========================================================== */
  async function authenticateClient(projectIdOrRef, authKey = '1234') {
    if (!projectIdOrRef) return false;
    const cleanQuery = String(projectIdOrRef).trim();
    const cleanAuth = String(authKey || '1234').trim();

    if (window.RajluxFirebase && typeof window.RajluxFirebase.getProjectById === 'function') {
      const project = await window.RajluxFirebase.getProjectById(cleanQuery, cleanAuth);
      if (project) {
        currentProject = project;
        sessionStorage.setItem('rajlux_client_project_id', project.id);
        sessionStorage.setItem('rajlux_client_auth', cleanAuth);
        if (loginModal) loginModal.classList.add('hidden');
        renderPortalDashboard(currentProject);
        return true;
      }
    }

    // Direct fallback search in local storage
    try {
      const stored = localStorage.getItem('rajlux_projects');
      const projects = stored ? JSON.parse(stored) : [];
      const cleanUpper = cleanQuery.toUpperCase();
      const found = projects.find(p => 
        (p.id && String(p.id).toUpperCase() === cleanUpper) || 
        (p.requestRef && String(p.requestRef).toUpperCase() === cleanUpper) ||
        (p.docId && String(p.docId).toUpperCase() === cleanUpper)
      );
      if (found) {
        currentProject = found;
        sessionStorage.setItem('rajlux_client_project_id', found.id);
        if (loginModal) loginModal.classList.add('hidden');
        renderPortalDashboard(currentProject);
        return true;
      }
    } catch (e) {}

    return false;
  }

  // Handle URL Parameters (e.g. ?id=RL-PRJ-2026-101&auth=1234&admin=true)
  const urlParams = new URLSearchParams(window.location.search);
  const paramId = urlParams.get('id');
  const paramAdmin = urlParams.get('admin');
  const paramEmail = urlParams.get('email') || urlParams.get('auth') || (paramAdmin === 'true' ? 'admin' : '1234');

  if (paramId) {
    if (loginProjectIdInput) loginProjectIdInput.value = paramId;
    if (paramEmail && loginClientAuthInput) loginClientAuthInput.value = paramEmail;
    const authOk = await authenticateClient(paramId, paramEmail);
    if (!authOk) {
      if (loginErrorMsg) {
        loginErrorMsg.textContent = `⚠️ Project "${paramId}" not found or still pending approval. You can try a demo project below.`;
        loginErrorMsg.classList.add('show');
      }
    }
  } else {
    // Check existing session
    const savedSessionId = sessionStorage.getItem('rajlux_client_project_id');
    const savedAuth = sessionStorage.getItem('rajlux_client_auth') || '1234';
    if (savedSessionId) {
      await authenticateClient(savedSessionId, savedAuth);
    }
  }

  // Form Submit Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idVal = loginProjectIdInput.value.trim();
    const authVal = loginClientAuthInput.value.trim() || '1234';

    loginErrorMsg.classList.remove('show');
    const success = await authenticateClient(idVal, authVal);

    if (!success) {
      loginErrorMsg.textContent = '⚠️ Invalid Project ID or Authentication. Try RL-PRJ-2026-101 with PIN 1234.';
      loginErrorMsg.classList.add('show');
    }
  });

  // Demo Workspace Buttons
  document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const demoId = btn.getAttribute('data-id');
      const demoAuth = btn.getAttribute('data-auth');
      loginProjectIdInput.value = demoId;
      loginClientAuthInput.value = demoAuth;
      await authenticateClient(demoId, demoAuth);
    });
  });

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('rajlux_client_project_id');
      sessionStorage.removeItem('rajlux_client_auth');
      currentProject = null;
      loginModal.classList.remove('hidden');
      loginProjectIdInput.value = '';
    });
  }

  // Refresh
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      if (currentProject) {
        const refreshed = await window.RajluxFirebase.getProjectById(currentProject.id);
        if (refreshed) {
          currentProject = refreshed;
          renderPortalDashboard(currentProject);
        }
      }
    });
  }

  /* ==========================================================
     2. RENDER MAIN PORTAL DASHBOARD & PROGRESS % GAUGE
     ========================================================== */
  function renderPortalDashboard(p) {
    if (!p) return;

    // Header & Meta
    document.getElementById('header-project-id').textContent = p.id || p.requestRef;
    document.getElementById('project-title-text').textContent = p.title || 'Custom Digital Solution';
    document.getElementById('project-desc-text').textContent = p.description || 'Project managed by Rajlux Engineering Team.';
    document.getElementById('project-package-pill').textContent = p.package || 'Business Pro Suite';
    document.getElementById('project-service-pill').textContent = p.service || 'Web Development';

    document.getElementById('meta-client-name').textContent = p.clientName || 'Valued Client';
    document.getElementById('meta-lead-eng').textContent = p.leadEngineer || 'Palanisamy R. (Lead Architect)';
    document.getElementById('meta-start-date').textContent = p.startDate || 'Recent';
    document.getElementById('meta-target-date').textContent = p.targetDate || 'TBD';

    // Status Pill
    const statusPill = document.getElementById('project-status-pill');
    statusPill.className = 'status-pill';
    if (p.status === 'completed') {
      statusPill.textContent = '🏆 Completed';
      statusPill.classList.add('completed');
    } else if (p.status === 'pending_approval') {
      statusPill.textContent = '⏳ Pending Approval';
      statusPill.classList.add('pending');
    } else {
      statusPill.textContent = '⚡ In Progress';
    }

    // --- Dynamic Progress Percentage (%) Gauge ---
    const progress = Math.min(100, Math.max(0, Number(p.progress) || 0));
    animateProgressCounter(progress);

    // Update Radial SVG Circle (Total circumference = 2 * PI * 70 ≈ 440)
    const radialFill = document.getElementById('radial-progress-fill');
    if (radialFill) {
      const circumference = 440;
      const offset = circumference - (circumference * progress) / 100;
      radialFill.style.strokeDashoffset = offset;
      if (progress >= 100) {
        radialFill.style.stroke = '#10b981';
      } else {
        radialFill.style.stroke = '#ffd700';
      }
    }

    // Update Linear Progress Bar in Milestones Tab
    const linearFill = document.getElementById('linear-progress-fill');
    const linearNumber = document.getElementById('linear-progress-number');
    if (linearFill) linearFill.style.width = `${progress}%`;
    if (linearNumber) linearNumber.textContent = `${progress}% Complete`;

    // Phase Banner
    const phaseBanner = document.getElementById('readiness-phase-text');
    if (phaseBanner) {
      if (progress >= 100) {
        phaseBanner.innerHTML = '🎉 <strong>Status:</strong> 100% Ready &amp; Deployed to Production!';
      } else if (progress >= 75) {
        phaseBanner.innerHTML = '⚡ <strong>Current Phase:</strong> Frontend &amp; Backend API Integration';
      } else if (progress >= 40) {
        phaseBanner.innerHTML = '🎨 <strong>Current Phase:</strong> UI/UX High-Fidelity Prototyping';
      } else if (progress >= 20) {
        phaseBanner.innerHTML = '📝 <strong>Current Phase:</strong> Architecture &amp; Requirements';
      } else {
        phaseBanner.innerHTML = '⏳ <strong>Current Phase:</strong> Project Review &amp; Approval';
      }
    }

    // Celebration Banner (if 100% completed)
    const completionCard = document.getElementById('completion-card');
    if (completionCard) {
      if (progress >= 100 || p.status === 'completed') {
        completionCard.style.display = 'flex';
      } else {
        completionCard.style.display = 'none';
      }
    }

    // Render Sub-Sections
    renderMilestones(p.milestones || []);
    renderChatMessages(p.chat || []);
    renderInvoices(p.invoices || []);
    renderFiles(p.files || []);
  }

  // Smooth Animated Number Counter for %
  function animateProgressCounter(targetPercent) {
    const percentEl = document.getElementById('radial-percent-text');
    if (!percentEl) return;

    let current = 0;
    const duration = 900;
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const increment = targetPercent / totalSteps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetPercent) {
        percentEl.textContent = `${targetPercent}%`;
        clearInterval(timer);
      } else {
        percentEl.textContent = `${Math.round(current)}%`;
      }
    }, stepTime);
  }

  /* ==========================================================
     3. TAB SWITCHING
     ========================================================== */
  const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
  const tabContents = document.querySelectorAll('.portal-tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.toggle('active', b === btn));
      tabContents.forEach(c => c.classList.toggle('active', c.id === tabId));
      activeTab = tabId;

      if (tabId === 'tab-chat') {
        scrollChatToBottom();
      }
    });
  });

  /* ==========================================================
     4. RENDER MILESTONES ROADMAP
     ========================================================== */
  function renderMilestones(milestones) {
    const container = document.getElementById('milestones-timeline-list');
    if (!container) return;

    if (!milestones.length) {
      container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">No milestones configured yet.</p>`;
      return;
    }

    container.innerHTML = milestones.map((m, idx) => {
      const statusClass = m.status || 'pending';
      const icon = statusClass === 'completed' ? '✓' : (statusClass === 'in_progress' ? '⏳' : `${idx + 1}`);
      const tagText = statusClass === 'completed' ? 'Completed' : (statusClass === 'in_progress' ? 'In Progress' : 'Upcoming');

      return `
        <div class="milestone-item ${statusClass}">
          <div class="milestone-status-icon">${icon}</div>
          <div class="milestone-info">
            <div class="milestone-title-row">
              <span class="milestone-name">${m.title}</span>
              <span class="milestone-tag">${tagText} (${m.percent || 0}%)</span>
            </div>
            <div class="milestone-date-str">Target Date: ${m.date || 'To be scheduled'}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ==========================================================
     5. LIVE TEAM CHAT SYSTEM
     ========================================================== */
  function renderChatMessages(chatList) {
    const container = document.getElementById('chat-messages-container');
    const badge = document.getElementById('chat-count-badge');
    if (!container) return;

    if (badge) badge.textContent = chatList.length;

    if (!chatList.length) {
      container.innerHTML = `<div class="chat-msg system"><div class="msg-bubble">Welcome to your encrypted project chat! Send a message to start communicating with your team.</div></div>`;
      return;
    }

    container.innerHTML = chatList.map(msg => {
      const senderType = msg.sender || 'team';
      const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

      return `
        <div class="chat-msg ${senderType}">
          <div class="msg-header">
            <span class="sender-name">${msg.senderName || (senderType === 'client' ? 'You' : 'Rajlux Engineering')}</span>
            <span class="sender-role">(${msg.senderRole || senderType})</span>
            <span class="msg-time">${timeStr}</span>
          </div>
          <div class="msg-bubble">${msg.text}</div>
        </div>
      `;
    }).join('');

    scrollChatToBottom();
  }

  function scrollChatToBottom() {
    const container = document.getElementById('chat-messages-container');
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  // Handle Sending Chat Message
  const chatForm = document.getElementById('portal-chat-form');
  const chatInput = document.getElementById('portal-chat-input');

  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text || !currentProject) return;

      const clientMsg = {
        sender: 'client',
        senderName: currentProject.clientName || 'Client',
        senderRole: 'Client',
        text: text
      };

      chatInput.value = '';

      if (window.RajluxFirebase && typeof window.RajluxFirebase.sendProjectChat === 'function') {
        const res = await window.RajluxFirebase.sendProjectChat(currentProject.id, clientMsg);
        if (res.success) {
          currentProject.chat = res.allChat;
          renderChatMessages(currentProject.chat);
        }
      }

      // Simulated auto-response from project manager if demo
      setTimeout(async () => {
        const autoReply = {
          sender: 'team',
          senderName: currentProject.leadEngineer ? currentProject.leadEngineer.split(' ')[0] + ' (Lead)' : 'Rajlux Architect',
          senderRole: 'Project Lead',
          text: `Thank you for your update! Our team has noted your message and will review it with the next sprint deployment.`
        };
        if (window.RajluxFirebase && typeof window.RajluxFirebase.sendProjectChat === 'function') {
          const r = await window.RajluxFirebase.sendProjectChat(currentProject.id, autoReply);
          if (r.success) {
            currentProject.chat = r.allChat;
            renderChatMessages(currentProject.chat);
          }
        }
      }, 2500);
    });
  }

  /* ==========================================================
     6. RENDER INVOICES & BILLING (WITH PDF PREVIEW & PRINT)
     ========================================================== */
  function renderInvoices(invoices) {
    const container = document.getElementById('invoices-list-container');
    if (!container) return;

    if (!invoices.length) {
      container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">No invoices generated yet for this project.</p>`;
      return;
    }

    container.innerHTML = invoices.map(inv => {
      const statusClass = inv.status || 'paid';
      const formattedTotal = Number(inv.total || inv.amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

      return `
        <div class="invoice-item-card">
          <div class="invoice-meta">
            <span class="invoice-icon">🧾</span>
            <div>
              <div class="invoice-number">${inv.number || inv.id}</div>
              <div class="invoice-dates">Issued: ${inv.date} | Due: ${inv.dueDate || 'Upon Receipt'}</div>
            </div>
          </div>
          <div class="invoice-pricing-block">
            <div class="invoice-total">${formattedTotal}</div>
            <span class="invoice-status-tag ${statusClass}">${statusClass.toUpperCase()}</span>
          </div>
          <div>
            <button type="button" class="btn-download-inv" data-inv-id="${inv.id}">
              <span>📄 View &amp; Print Tax Invoice</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to invoices
    container.querySelectorAll('.btn-download-inv').forEach(btn => {
      btn.addEventListener('click', () => {
        const invId = btn.getAttribute('data-inv-id');
        const inv = invoices.find(i => i.id === invId);
        if (inv) openInvoiceModal(inv);
      });
    });
  }

  function openInvoiceModal(inv) {
    const modal = document.getElementById('invoice-modal');
    const content = document.getElementById('printable-invoice-content');
    if (!modal || !content || !currentProject) return;

    const itemsHtml = (inv.items || [
      { desc: currentProject.package + ' - ' + currentProject.service, qty: 1, rate: inv.amount, amount: inv.amount }
    ]).map(it => `
      <tr>
        <td>${it.desc}</td>
        <td style="text-align: center;">${it.qty || 1}</td>
        <td style="text-align: right;">₹${Number(it.rate || 0).toLocaleString('en-IN')}</td>
        <td style="text-align: right; font-weight: 700;">₹${Number(it.amount || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    content.innerHTML = `
      <div class="invoice-paper">
        <div class="inv-header">
          <div>
            <div class="inv-logo-text">👑 RAJLUX DIGITAL SOLUTIONS</div>
            <div style="font-size: 0.84rem; color: #64748b; margin-top: 4px;">Pvt. Ltd. | Premium Digital Engineering &amp; IT Solutions</div>
            <div style="font-size: 0.8rem; color: #64748b;">GSTIN: 33AAACR7733Q1Z8 | Email: rajlux7733@gmail.com</div>
          </div>
          <div>
            <div class="inv-title">TAX INVOICE</div>
            <div style="font-size: 0.85rem; color: #64748b; text-align: right; margin-top: 4px;">Invoice #: <strong>${inv.number || inv.id}</strong></div>
            <div style="font-size: 0.85rem; color: #64748b; text-align: right;">Date: ${inv.date}</div>
          </div>
        </div>

        <div class="inv-meta-grid">
          <div>
            <strong style="color: #0f172a;">Billed To:</strong>
            <div>${currentProject.clientName}</div>
            <div>${currentProject.clientEmail}</div>
            <div>${currentProject.clientPhone || ''}</div>
          </div>
          <div style="text-align: right;">
            <strong style="color: #0f172a;">Project Reference:</strong>
            <div>${currentProject.id}</div>
            <div>Package: ${currentProject.package}</div>
            <div style="color: #10b981; font-weight: 700; text-transform: uppercase;">Status: ${inv.status || 'PAID'}</div>
          </div>
        </div>

        <table class="inv-table">
          <thead>
            <tr>
              <th>Description / Deliverables</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="inv-totals">
          <div class="inv-total-row">
            <span>Subtotal:</span>
            <span>₹${Number(inv.amount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="inv-total-row">
            <span>GST (18%):</span>
            <span>₹${Number(inv.tax || (inv.amount * 0.18)).toLocaleString('en-IN')}</span>
          </div>
          <div class="inv-total-row inv-grand-total">
            <span>Grand Total:</span>
            <span>₹${Number(inv.total || (inv.amount * 1.18)).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div style="margin-top: 30px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 0.78rem; color: #64748b; text-align: center;">
          This is a computer-generated tax invoice. Rajlux Digital Solutions Pvt Ltd guarantees Lifetime Support on approved deliverables.
        </div>
      </div>
    `;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }

  // Close & Print Modal Handlers
  const invModal = document.getElementById('invoice-modal');
  const invCloseBtn = document.getElementById('invoice-modal-close');
  const invCancelBtn = document.getElementById('invoice-modal-cancel');
  const printBtn = document.getElementById('print-invoice-btn');

  function closeInvModal() {
    if (invModal) {
      invModal.classList.remove('show');
      invModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (invCloseBtn) invCloseBtn.addEventListener('click', closeInvModal);
  if (invCancelBtn) invCancelBtn.addEventListener('click', closeInvModal);
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      const content = document.getElementById('printable-invoice-content');
      if (!content) return;

      const printWin = window.open('', '_blank', 'width=900,height=700');
      if (!printWin) {
        // fallback if popup blocked
        window.print();
        return;
      }

      printWin.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Tax Invoice – Rajlux Digital Solutions</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Inter', Arial, sans-serif;
              color: #1e293b;
              background: #fff;
              padding: 40px;
            }
            .invoice-paper { max-width: 800px; margin: 0 auto; }
            .inv-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 20px;
              border-bottom: 2px solid #e2e8f0;
              margin-bottom: 20px;
            }
            .inv-logo-text {
              font-size: 1.4rem;
              font-weight: 800;
              color: #0f172a;
            }
            .inv-title {
              font-size: 1.5rem;
              font-weight: 800;
              color: #d97706;
              text-align: right;
            }
            .inv-meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 24px;
              font-size: 0.88rem;
            }
            .inv-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
              font-size: 0.88rem;
            }
            .inv-table th {
              background: #f1f5f9;
              color: #334155;
              padding: 10px 12px;
              text-align: left;
              border-bottom: 2px solid #cbd5e1;
            }
            .inv-table td {
              padding: 10px 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            .inv-totals {
              width: 260px;
              margin-left: auto;
              font-size: 0.9rem;
            }
            .inv-total-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
            }
            .inv-grand-total {
              font-weight: 800;
              font-size: 1.1rem;
              color: #0f172a;
              border-top: 2px solid #0f172a;
              padding-top: 8px;
            }
            @media print {
              body { padding: 20px; }
              @page { margin: 10mm; size: A4; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-paper">
            ${content.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            };
          <\/script>
        </body>
        </html>
      `);
      printWin.document.close();
    });
  }

  /* ==========================================================
     7. RENDER DELIVERABLES & FILES (WITH DYNAMIC DOWNLOAD ENGINE)
     ========================================================== */
  function renderFiles(files) {
    const container = document.getElementById('files-grid-container');
    if (!container) return;

    if (!files.length) {
      container.innerHTML = `<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1; padding: 20px;">Deliverable assets will be posted here as milestones are completed.</p>`;
      return;
    }

    container.innerHTML = files.map(file => {
      const isLink = file.type === 'link';
      const icon = isLink ? '🌐' : (file.type === 'archive' ? '📦' : '📑');

      return `
        <div class="file-card">
          <div class="file-card-top">
            <div class="file-icon">${icon}</div>
            <div class="file-info">
              <div class="file-name">${file.name}</div>
              <div class="file-meta-str">Size: ${file.size} | Uploaded: ${file.date}</div>
              <span class="file-tag">${file.tag || 'Asset'}</span>
            </div>
          </div>
          <div>
            <button type="button" class="btn-file-download btn-portal-dl" data-file-id="${file.id}">
              <span>${isLink ? 'Open Staging Link ↗' : 'Download File 📥'}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to download buttons
    container.querySelectorAll('.btn-portal-dl').forEach(btn => {
      btn.addEventListener('click', () => {
        const fileId = btn.getAttribute('data-file-id');
        const file = files.find(f => f.id === fileId);
        if (file) handlePortalFileDownload(file);
      });
    });
  }

  function handlePortalFileDownload(file) {
    if (!file) return;

    // For staging/web links – open in new tab
    if (file.type === 'link' && file.url) {
      window.open(file.url, '_blank', 'noopener');
      return;
    }

    // For http/https URLs that are direct file links – force download
    if (file.url && (file.url.startsWith('http://') || file.url.startsWith('https://'))) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name || 'download';
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // For data: URLs – force download directly
    if (file.url && file.url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name || 'deliverable';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Fallback: Generate a text-based specification document and download it
    const projName = currentProject ? currentProject.title : 'Rajlux Project';
    const clientName = currentProject ? currentProject.clientName : 'Client';

    const contentText =
      `============================================================\n` +
      `RAJLUX DIGITAL SOLUTIONS PVT LTD - DELIVERABLE SPECIFICATION\n` +
      `============================================================\n\n` +
      `Document Name: ${file.name}\n` +
      `Project Title: ${projName}\n` +
      `Client Name:   ${clientName}\n` +
      `Project ID:    ${currentProject ? currentProject.id : 'N/A'}\n` +
      `Category Tag:  ${file.tag || 'Asset'}\n` +
      `Date Issued:   ${file.date || new Date().toLocaleDateString()}\n\n` +
      `------------------------------------------------------------\n` +
      `DELIVERABLE TECHNICAL NOTES & VERIFICATION:\n` +
      `------------------------------------------------------------\n` +
      `1. Architecture: Fully reviewed, cloud-backed, and security audited.\n` +
      `2. Verification Status: PASS (Production Build Handover Verified).\n` +
      `3. Warranty: Backed by Lifetime Support Guarantee.\n\n` +
      `For technical questions, contact your Lead Architect: rajlux7733@gmail.com\n` +
      `© ${new Date().getFullYear()} Rajlux Digital Solutions Pvt Ltd. All Rights Reserved.`;

    // Always use text/plain for the generated spec doc so it actually opens correctly
    const blob = new Blob([contentText], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    // Give it a .txt extension so the browser always downloads instead of trying to render
    const safeName = (file.name || 'deliverable').replace(/\.(pdf|zip)$/i, '') + '-spec.txt';
    link.download = safeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }

  // Warranty Certificate Click (Generates real downloadable certificate)
  const warrantyBtn = document.getElementById('download-warranty-btn');
  if (warrantyBtn) {
    warrantyBtn.addEventListener('click', () => {
      const p = currentProject || { id: 'RL-PRJ-2026-102', clientName: 'Valued Client', title: 'Enterprise Digital Solution' };
      const certText = `============================================================\n` +
        `🛡️ OFFICIAL RAJLUX LIFETIME SUPPORT & SECURITY WARRANTY CERTIFICATE\n` +
        `============================================================\n\n` +
        `Certificate ID:   WARR-${p.id || '2026-102'}-${Date.now().toString().slice(-4)}\n` +
        `Issued To:         ${p.clientName}\n` +
        `Project ID:        ${p.id}\n` +
        `Project Title:     ${p.title}\n` +
        `Coverage Status:   ACTIVE & LIFETIME GUARANTEED\n` +
        `Effective Date:    ${p.completedDate || p.startDate || new Date().toLocaleDateString()}\n\n` +
        `------------------------------------------------------------\n` +
        `WARRANTY TERMS & COVERAGE:\n` +
        `------------------------------------------------------------\n` +
        `1. Code Integrity & Security Patches: 100% Guaranteed lifetime protection.\n` +
        `2. Bug Resolution: 24-hour turnaround on critical application errors.\n` +
        `3. Cloud & Server Maintenance: Complimentary architecture health reviews.\n\n` +
        `Issued by Rajlux Engineering & Cloud Quality Assurance Directorate.\n` +
        `Official Seal: 👑 RAJLUX DIGITAL SOLUTIONS PVT LTD (GSTIN: 33AAACR7733Q1Z8)\n` +
        `Email: rajlux7733@gmail.com | Phone: +91 63695 89185\n`;

      const blob = new Blob([certText], { type: 'text/plain' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Rajlux_Lifetime_Warranty_Certificate_${p.id || '2026'}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    });
  }

});
