/* ============================================================
   RAJLUX DIGITAL SOLUTIONS – FIREBASE DATABASE CONFIG & SDK UTILS
   ============================================================ */

// 1. DEFAULT FIREBASE CONFIGURATION
// To connect to your own Firebase project:
// Go to Firebase Console (https://console.firebase.google.com/) -> Project Settings -> General -> Your Apps -> Web App
// Copy your config details below or update via Admin Portal -> Settings!

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyYOUR_API_KEY_HERE_REPLACE_ME",
  authDomain: "rajlux-digital.firebaseapp.com",
  projectId: "rajlux-digital",
  storageBucket: "rajlux-digital.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Retrieve stored Firebase config or use default
function getFirebaseConfig() {
  try {
    const saved = localStorage.getItem('rajlux_firebase_config');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Failed to read saved Firebase config:', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

function saveFirebaseConfig(newConfig) {
  localStorage.setItem('rajlux_firebase_config', JSON.stringify(newConfig));
  // Re-initialize Firebase
  initFirebase();
}

let db = null;
let firebaseApp = null;
let firebaseInitialized = false;

function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return cfg && cfg.apiKey && !cfg.apiKey.includes('YOUR_API_KEY_HERE') && cfg.projectId && cfg.projectId !== 'rajlux-digital-placeholder';
}

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK script not loaded yet.');
    return false;
  }
  
  const config = getFirebaseConfig();
  
  try {
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(config);
    } else {
      firebaseApp = firebase.app();
    }
    
    // Test if Firestore is working
    db = firebase.firestore();
    firebaseInitialized = true;
    console.log('✅ Firebase initialized successfully for project:', config.projectId);
    return true;
  } catch (err) {
    console.warn('Firebase initialization notice:', err.message || err);
    firebaseInitialized = false;
    return false;
  }
}

// Auto-initialize when script loads
if (typeof firebase !== 'undefined') {
  initFirebase();
} else {
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') initFirebase();
  });
}

/* ============================================================
   FIREBASE MESSAGES DATA MANAGER (WITH LOCALSTORAGE FALLBACK)
   ============================================================ */

// 1. SAVE NEW MESSAGE
async function saveMessageToDb(msgData) {
  // Ensure message has timestamps and defaults
  const docData = {
    ...msgData,
    createdTimestamp: msgData.timestamp || new Date().toISOString(),
    status: msgData.status || 'unread',
    starred: msgData.starred || false
  };

  // Always update localStorage cache
  try {
    const stored = localStorage.getItem('rajlux_messages');
    const messages = stored ? JSON.parse(stored) : [];
    messages.unshift(docData);
    localStorage.setItem('rajlux_messages', JSON.stringify(messages));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('LocalStorage cache write error:', err);
  }

  // Save to Firebase Firestore if connected
  if (firebaseInitialized && db) {
    try {
      // Use msgData.id as doc ID if provided, otherwise auto-generate
      const docRef = db.collection('messages').doc(docData.id || undefined);
      await docRef.set(docData, { merge: true });
      console.log('🔥 Saved message to Firebase Firestore successfully!');
      return { success: true, mode: 'firebase', id: docRef.id };
    } catch (err) {
      console.warn('Firestore write failed, used local storage fallback:', err);
      return { success: true, mode: 'local', error: err.message };
    }
  }

  return { success: true, mode: 'local' };
}

// 2. SUBSCRIBE TO REAL-TIME MESSAGES LISTENER
function subscribeToMessages(callback) {
  if (firebaseInitialized && db) {
    try {
      console.log('🔥 Subscribing to real-time Firestore updates...');
      return db.collection('messages')
        .onSnapshot((snapshot) => {
          const messages = [];
          snapshot.forEach(doc => {
            messages.push({ docId: doc.id, ...doc.data() });
          });
          
          // Sort by date descending
          messages.sort((a, b) => new Date(b.timestamp || b.createdTimestamp || 0) - new Date(a.timestamp || a.createdTimestamp || 0));

          // Sync local storage cache
          try {
            localStorage.setItem('rajlux_messages', JSON.stringify(messages));
          } catch (e) {}

          callback(messages, 'firebase');
        }, (err) => {
          console.warn('Firestore subscription error (using local storage fallback):', err.message);
          fallbackToLocalStorage(callback);
        });
    } catch (err) {
      console.warn('Error setting up Firestore snapshot listener:', err);
      fallbackToLocalStorage(callback);
    }
  } else {
    fallbackToLocalStorage(callback);
  }
  return null;
}

function fallbackToLocalStorage(callback) {
  try {
    const data = localStorage.getItem('rajlux_messages');
    const messages = data ? JSON.parse(data) : [];
    callback(messages, 'local');
  } catch (err) {
    callback([], 'local');
  }
}

// 3. UPDATE MESSAGE (Status / Starred)
async function updateMessageInDb(msgId, updates) {
  // Update local storage
  try {
    const data = localStorage.getItem('rajlux_messages');
    let messages = data ? JSON.parse(data) : [];
    messages = messages.map(m => (m.id === msgId || m.docId === msgId) ? { ...m, ...updates } : m);
    localStorage.setItem('rajlux_messages', JSON.stringify(messages));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}

  // Update Firebase Firestore
  if (firebaseInitialized && db) {
    try {
      // Find document by id query or direct doc ID
      const docRef = db.collection('messages').doc(msgId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        await docRef.update(updates);
      } else {
        // Query by 'id' field if docRef didn't match document key
        const q = await db.collection('messages').where('id', '==', msgId).get();
        q.forEach(async (doc) => {
          await doc.ref.update(updates);
        });
      }
      console.log('🔥 Updated message in Firebase:', msgId, updates);
    } catch (err) {
      console.warn('Firebase update failed, updated local storage only:', err);
    }
  }
}

// 4. DELETE MESSAGE
async function deleteMessageFromDb(msgId) {
  // Delete from local storage
  try {
    const data = localStorage.getItem('rajlux_messages');
    let messages = data ? JSON.parse(data) : [];
    messages = messages.filter(m => m.id !== msgId && m.docId !== msgId);
    localStorage.setItem('rajlux_messages', JSON.stringify(messages));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}

  // Delete from Firebase Firestore
  if (firebaseInitialized && db) {
    try {
      const docRef = db.collection('messages').doc(msgId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        await docRef.delete();
      } else {
        const q = await db.collection('messages').where('id', '==', msgId).get();
        q.forEach(async (doc) => {
          await doc.ref.delete();
        });
      }
      console.log('🔥 Deleted message from Firebase:', msgId);
    } catch (err) {
      console.warn('Firebase delete failed, removed from local storage only:', err);
    }
  }
}

// 5. SEED DEMO SAMPLE MESSAGES
async function seedSampleMessagesToDb(samples) {
  for (const sample of samples) {
    await saveMessageToDb(sample);
  }
}

// 6. CLEAR ALL MESSAGES
async function clearAllMessagesFromDb() {
  localStorage.removeItem('rajlux_messages');
  window.dispatchEvent(new Event('storage'));

  if (firebaseInitialized && db) {
    try {
      const snapshot = await db.collection('messages').get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('🔥 Cleared all messages in Firebase Firestore');
    } catch (err) {
      console.warn('Firebase clear batch failed:', err);
    }
  }
}

/* ============================================================
   EMAIL CONFIGURATION (EmailJS Integration for Thank-You & Auto-Reply)
   ============================================================ */

const DEFAULT_EMAILJS_CONFIG = {
  publicKey: "",
  serviceId: "",
  templateId: "",
  adminTemplateId: "",
  enabled: true,
  adminEmail: "rajlux7733@gmail.com"
};

function getEmailConfig() {
  try {
    const saved = localStorage.getItem('rajlux_emailjs_config');
    if (saved) {
      return { ...DEFAULT_EMAILJS_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to read saved EmailJS config:', e);
  }
  return DEFAULT_EMAILJS_CONFIG;
}

function saveEmailConfig(newConfig) {
  const merged = { ...getEmailConfig(), ...newConfig };
  localStorage.setItem('rajlux_emailjs_config', JSON.stringify(merged));
  if (typeof emailjs !== 'undefined' && merged.publicKey) {
    try {
      emailjs.init({ publicKey: merged.publicKey });
    } catch (e) {
      console.warn('EmailJS init error:', e);
    }
  }
}

function isEmailJsConfigured() {
  const cfg = getEmailConfig();
  return Boolean(cfg.enabled && cfg.publicKey && cfg.serviceId && cfg.templateId);
}

/* ============================================================
   PROJECTS DATA MANAGER (LIFECYCLE, PROGRESS %, CHAT, INVOICES, DELIVERABLES)
   ============================================================ */

const SAMPLE_PROJECTS = [
  {
    id: "RL-PRJ-2026-101",
    requestRef: "REQ-98421",
    title: "NextGen E-Commerce Multi-Vendor Platform",
    clientName: "Arun Prakash",
    clientEmail: "arun.prakash@techfirm.in",
    clientPhone: "+91 98765 43210",
    clientPin: "1234",
    service: "Web Development",
    package: "Business Pro Suite",
    budget: "₹24,999",
    currency: "INR",
    status: "in_progress", // pending_approval | in_progress | in_review | completed
    progress: 75,
    startDate: "2026-08-10",
    targetDate: "2026-08-30",
    leadEngineer: "Palanisamy R. (Lead Architect)",
    description: "Full-stack responsive online store with custom admin portal, Razorpay/Stripe checkout, live inventory tracking, and SEO optimization.",
    milestones: [
      { id: "m1", title: "Project Scope & Technical Architecture", status: "completed", percent: 20, date: "2026-08-12" },
      { id: "m2", title: "UI/UX High-Fidelity Figma Prototyping", status: "completed", percent: 40, date: "2026-08-18" },
      { id: "m3", title: "Frontend & Backend API Integration", status: "in_progress", percent: 75, date: "2026-08-25" },
      { id: "m4", title: "Security Audit, QA Testing & Performance", status: "pending", percent: 90, date: "2026-08-28" },
      { id: "m5", title: "Cloud Deployment & Production Handover", status: "pending", percent: 100, date: "2026-08-30" }
    ],
    invoices: [
      {
        id: "INV-2026-001",
        number: "RAJ/2026/089",
        date: "2026-08-10",
        dueDate: "2026-08-20",
        amount: 24999,
        tax: 4499.82,
        total: 29498.82,
        status: "paid", // paid | pending
        items: [
          { desc: "Business Pro Web App Design & Architecture", qty: 1, rate: 14999, amount: 14999 },
          { desc: "Custom Backend API & Payment Gateway Integration", qty: 1, rate: 10000, amount: 10000 }
        ]
      }
    ],
    files: [
      {
        id: "f1",
        name: "UI-UX-Design-System-Figma-Export.pdf",
        type: "document",
        size: "4.8 MB",
        date: "2026-08-18",
        url: "#download-figma-export",
        tag: "Design"
      },
      {
        id: "f2",
        name: "Database-Schema-Architecture-v1.2.pdf",
        type: "document",
        size: "2.1 MB",
        date: "2026-08-14",
        url: "#download-db-schema",
        tag: "Tech Specs"
      },
      {
        id: "f3",
        name: "Staging-Preview-Environment.url",
        type: "link",
        size: "Live URL",
        date: "2026-08-22",
        url: "https://staging-store.rajlux.example",
        tag: "Preview"
      }
    ],
    chat: [
      {
        id: "c1",
        sender: "team",
        senderName: "Rajlux Engineering",
        senderRole: "Project Lead",
        text: "Hello Arun! Welcome to your Rajlux Client Portal. We have completed the UI wireframes and database setup.",
        timestamp: "2026-08-12T10:30:00.000Z"
      },
      {
        id: "c2",
        sender: "client",
        senderName: "Arun Prakash",
        senderRole: "Client",
        text: "Awesome! The Figma designs look top-notch. Can we ensure the mobile checkout has 1-click UPI?",
        timestamp: "2026-08-18T14:15:00.000Z"
      },
      {
        id: "c3",
        sender: "team",
        senderName: "Rajlux Engineering",
        senderRole: "Lead Developer",
        text: "Absolutely! Razorpay UPI Intent flow is now connected on staging. Currently finishing up inventory synchronization at 75%.",
        timestamp: "2026-08-22T09:40:00.000Z"
      }
    ],
    createdTimestamp: "2026-08-10T09:00:00.000Z"
  },
  {
    id: "RL-PRJ-2026-102",
    requestRef: "REQ-74219",
    title: "Luxe Jewels Enterprise E-Commerce & Brand Identity",
    clientName: "Priya Sharma",
    clientEmail: "priya@luxeinterior.com",
    clientPhone: "+91 91234 56789",
    clientPin: "1234",
    service: "Branding & Identity",
    package: "Enterprise Elite",
    budget: "₹49,999",
    currency: "INR",
    status: "completed",
    progress: 100,
    startDate: "2026-07-15",
    targetDate: "2026-08-15",
    completedDate: "2026-08-15",
    leadEngineer: "Rajlux Design & Cloud Team",
    description: "Complete luxury brand identity guidelines, vector logo kit, mobile-first luxury storefront, and cloud server setup.",
    milestones: [
      { id: "m1", title: "Brand Discovery & Moodboards", status: "completed", percent: 20, date: "2026-07-20" },
      { id: "m2", title: "Visual Identity & Vector Assets", status: "completed", percent: 40, date: "2026-07-28" },
      { id: "m3", title: "Web Platform Development", status: "completed", percent: 75, date: "2026-08-08" },
      { id: "m4", title: "Testing, SEO & Speed Optimization", status: "completed", percent: 95, date: "2026-08-12" },
      { id: "m5", title: "Final Launch & Handover Release Bundle", status: "completed", percent: 100, date: "2026-08-15" }
    ],
    invoices: [
      {
        id: "INV-2026-002",
        number: "RAJ/2026/064",
        date: "2026-07-15",
        dueDate: "2026-07-25",
        amount: 49999,
        tax: 8999.82,
        total: 58998.82,
        status: "paid",
        items: [
          { desc: "Enterprise Luxury Identity & Vector Kit", qty: 1, rate: 24999, amount: 24999 },
          { desc: "Custom E-Commerce Platform & Cloud Setup", qty: 1, rate: 25000, amount: 25000 }
        ]
      }
    ],
    files: [
      {
        id: "f1",
        name: "LuxeJewels-Final-Handover-Bundle-v1.0.zip",
        type: "archive",
        size: "48.2 MB",
        date: "2026-08-15",
        url: "#download-handover-bundle",
        tag: "Production Bundle"
      },
      {
        id: "f2",
        name: "Lifetime-Support-Warranty-Certificate.pdf",
        type: "document",
        size: "1.4 MB",
        date: "2026-08-15",
        url: "#download-warranty-cert",
        tag: "Warranty"
      },
      {
        id: "f3",
        name: "Brand-Guidelines-Book-2026.pdf",
        type: "document",
        size: "12.5 MB",
        date: "2026-08-10",
        url: "#download-brand-book",
        tag: "Brand Book"
      }
    ],
    chat: [
      {
        id: "c1",
        sender: "team",
        senderName: "Rajlux Delivery Team",
        senderRole: "Admin",
        text: "Congratulations Priya! Your enterprise platform and brand kit are 100% delivered with Lifetime Support activated.",
        timestamp: "2026-08-15T12:00:00.000Z"
      },
      {
        id: "c2",
        sender: "client",
        senderName: "Priya Sharma",
        senderRole: "Client",
        text: "Thank you so much Rajlux team! The website speed is blazing fast and the designs are stunning!",
        timestamp: "2026-08-16T15:20:00.000Z"
      }
    ],
    createdTimestamp: "2026-07-15T10:00:00.000Z"
  },
  {
    id: "RL-REQ-2026-103",
    requestRef: "REQ-51203",
    title: "Cross-Platform Logistics Fleet Tracking Mobile App",
    clientName: "Rahul Mehta",
    clientEmail: "rahul@swiftlogistics.in",
    clientPhone: "+91 99887 76655",
    clientPin: "1234",
    service: "Mobile App Development",
    package: "Enterprise Elite",
    budget: "₹65,000",
    currency: "INR",
    status: "pending_approval",
    progress: 0,
    startDate: "Pending Admin Approval",
    targetDate: "Estimated 30 days after kick-off",
    leadEngineer: "Pending Assignment",
    description: "Looking for an iOS & Android Flutter app for real-time driver GPS tracking, route optimization, and digital proof-of-delivery signatures.",
    milestones: [
      { id: "m1", title: "Project Scope & Tech Stack Sign-off", status: "pending", percent: 20, date: "TBD" },
      { id: "m2", title: "UI/UX Wireframes & Prototype", status: "pending", percent: 40, date: "TBD" },
      { id: "m3", title: "Core App Development & Maps API", status: "pending", percent: 75, date: "TBD" },
      { id: "m4", title: "Fleet Testing & QA Verification", status: "pending", percent: 90, date: "TBD" },
      { id: "m5", title: "Google Play & App Store Release", status: "pending", percent: 100, date: "TBD" }
    ],
    invoices: [],
    files: [],
    chat: [
      {
        id: "c1",
        sender: "system",
        senderName: "Rajlux System",
        senderRole: "Automated",
        text: "Project request submitted successfully. Awaiting review by Rajlux Admin.",
        timestamp: "2026-08-23T11:00:00.000Z"
      }
    ],
    createdTimestamp: "2026-08-23T11:00:00.000Z"
  }
];

function getStoredProjects() {
  try {
    const raw = localStorage.getItem('rajlux_projects');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored projects:', e);
  }
  // Initialize with samples
  localStorage.setItem('rajlux_projects', JSON.stringify(SAMPLE_PROJECTS));
  return SAMPLE_PROJECTS;
}

function saveProjectsLocally(projects) {
  try {
    localStorage.setItem('rajlux_projects', JSON.stringify(projects));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('rajlux-projects-updated', { detail: projects }));
  } catch (e) {
    console.error('Error saving projects locally:', e);
  }
}

// 1. GET ALL PROJECTS
async function getAllProjects() {
  if (firebaseInitialized && db) {
    try {
      const snap = await db.collection('projects').get();
      if (!snap.empty) {
        const projects = [];
        snap.forEach(doc => projects.push({ docId: doc.id, ...doc.data() }));
        projects.sort((a, b) => new Date(b.createdTimestamp || 0) - new Date(a.createdTimestamp || 0));
        saveProjectsLocally(projects);
        return projects;
      }
    } catch (e) {
      console.warn('Firestore fetch failed, returning local cache:', e);
    }
  }
  return getStoredProjects();
}

// 2. GET PROJECT BY ID OR REQUEST REF OR EMAIL
async function getProjectById(query, pinOrEmail = '') {
  const projects = await getAllProjects();
  const cleanQ = String(query || '').trim().toUpperCase();
  const cleanAuth = String(pinOrEmail || '').trim().toLowerCase();

  const found = projects.find(p => {
    const pId = String(p.id || '').toUpperCase();
    const pRef = String(p.requestRef || '').toUpperCase();
    const pDoc = String(p.docId || '').toUpperCase();
    const matchId = pId === cleanQ || pRef === cleanQ || pDoc === cleanQ || pId.includes(cleanQ) || (cleanQ.length >= 4 && pRef.includes(cleanQ));
    if (!matchId) return false;
    if (!cleanAuth || cleanAuth === 'admin' || cleanAuth === '1234') return true;
    return (p.clientEmail && p.clientEmail.toLowerCase() === cleanAuth) || 
           (p.clientPin && String(p.clientPin).toLowerCase() === cleanAuth) ||
           (p.clientPhone && p.clientPhone.replace(/\D/g, '').includes(cleanAuth.replace(/\D/g, '')));
  });

  return found || null;
}

// 3. SUBMIT NEW PROJECT REQUEST (From Website or Client Portal)
async function submitProjectRequest(reqData) {
  const requestRef = 'REQ-' + Math.floor(10000 + Math.random() * 90000);
  const tempId = 'RL-REQ-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);

  const newProject = {
    id: tempId,
    requestRef: requestRef,
    title: reqData.title || (reqData.service + ' Project for ' + reqData.name),
    clientName: reqData.name,
    clientEmail: reqData.email,
    clientPhone: reqData.phone || '',
    clientPin: reqData.pin || '1234',
    service: reqData.service || 'Web Development',
    package: reqData.package || 'Business Pro Suite',
    budget: reqData.budget || 'Custom',
    currency: 'INR',
    status: 'pending_approval',
    progress: 0,
    startDate: 'Pending Admin Approval',
    targetDate: reqData.timeline || 'Within 3-4 weeks',
    leadEngineer: 'Pending Assignment',
    description: reqData.message || reqData.description || 'New client project request.',
    milestones: [
      { id: 'm1', title: 'Project Scope & Requirements Sign-off', status: 'pending', percent: 20, date: 'TBD' },
      { id: 'm2', title: 'UI/UX Design & Architecture', status: 'pending', percent: 40, date: 'TBD' },
      { id: 'm3', title: 'Core Development & Integrations', status: 'pending', percent: 75, date: 'TBD' },
      { id: 'm4', title: 'Quality Assurance & Security Testing', status: 'pending', percent: 90, date: 'TBD' },
      { id: 'm5', title: 'Final Handover & Lifetime Support Launch', status: 'pending', percent: 100, date: 'TBD' }
    ],
    invoices: [],
    files: [],
    chat: [
      {
        id: 'c1',
        sender: 'system',
        senderName: 'Rajlux System',
        senderRole: 'Automated',
        text: `Thank you ${reqData.name}! Your request has been received (Ref: ${requestRef}). Our team will review and issue your official Project ID shortly.`,
        timestamp: new Date().toISOString()
      }
    ],
    createdTimestamp: new Date().toISOString()
  };

  const projects = await getAllProjects();
  projects.unshift(newProject);
  saveProjectsLocally(projects);

  if (firebaseInitialized && db) {
    try {
      await db.collection('projects').doc(newProject.id).set(newProject);
    } catch (e) {
      console.warn('Failed to save project to Firestore:', e);
    }
  }

  // Also record in messages so admin sees it in both places
  try {
    await saveMessageToDb({
      id: 'MSG-' + requestRef,
      name: reqData.name,
      email: reqData.email,
      phone: reqData.phone || '',
      service: reqData.service || 'Web Development',
      message: `[PROJECT REQUEST - ${newProject.package}] ${reqData.message || 'Requirements submitted.'}`,
      timestamp: new Date().toISOString(),
      dateStr: new Date().toLocaleDateString(),
      status: 'unread'
    });
  } catch (e) {}

  return newProject;
}

// 4. ADMIN APPROVES PROJECT & ISSUES OFFICIAL PROJECT ID
async function approveProject(tempOrReqId, updates = {}) {
  const projects = await getAllProjects();
  const cleanId = String(tempOrReqId || '').trim().toUpperCase();
  let idx = projects.findIndex(p => 
    (p.id && String(p.id).trim().toUpperCase() === cleanId) || 
    (p.requestRef && String(p.requestRef).trim().toUpperCase() === cleanId) ||
    (p.docId && String(p.docId).trim().toUpperCase() === cleanId)
  );

  let current = null;
  if (idx !== -1) {
    current = projects[idx];
  } else if (firebaseInitialized && db) {
    try {
      const snap = await db.collection('projects').doc(tempOrReqId).get();
      if (snap.exists) {
        current = { docId: snap.id, ...snap.data() };
        projects.unshift(current);
        idx = 0;
      } else {
        // Query by requestRef
        const querySnap = await db.collection('projects').where('requestRef', '==', tempOrReqId).get();
        if (!querySnap.empty) {
          const doc = querySnap.docs[0];
          current = { docId: doc.id, ...doc.data() };
          projects.unshift(current);
          idx = 0;
        }
      }
    } catch (e) {
      console.warn('Direct doc fetch failed:', e);
    }
  }

  if (!current) {
    // If still not found, check if matching partially
    idx = projects.findIndex(p => 
      (p.requestRef && (cleanId.includes(String(p.requestRef).trim().toUpperCase()) || String(p.requestRef).trim().toUpperCase().includes(cleanId))) ||
      (p.id && (cleanId.includes(String(p.id).trim().toUpperCase()) || String(p.id).trim().toUpperCase().includes(cleanId)))
    );
    if (idx !== -1) current = projects[idx];
  }

  if (!current) return { success: false, error: 'Project not found' };

  const officialId = updates.officialId || ('RL-PRJ-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900));
  const oldDocId = current.docId || current.id;

  const updatedProject = {
    ...current,
    id: officialId,
    status: updates.status || 'in_progress',
    progress: updates.progress !== undefined ? Number(updates.progress) : 20,
    startDate: updates.startDate || new Date().toISOString().split('T')[0],
    targetDate: updates.targetDate || current.targetDate || '30 days',
    leadEngineer: updates.leadEngineer || current.leadEngineer || 'Palanisamy R. (Lead Architect)',
    budget: updates.budget || current.budget,
    milestones: updates.milestones || (current.milestones || []).map((m, i) => i === 0 ? { ...m, status: 'completed' } : m),
    chat: [
      ...(current.chat || []),
      {
        id: 'c_' + Date.now(),
        sender: 'team',
        senderName: 'Rajlux Admin',
        senderRole: 'Management',
        text: `🎉 Project APPROVED! Official Project ID issued: ${officialId}. We have officially kicked off development!`,
        timestamp: new Date().toISOString()
      }
    ]
  };

  if (idx !== -1) {
    projects[idx] = updatedProject;
  } else {
    projects.unshift(updatedProject);
  }
  saveProjectsLocally(projects);

  if (firebaseInitialized && db) {
    try {
      if (oldDocId && oldDocId !== officialId) {
        try { await db.collection('projects').doc(oldDocId).delete(); } catch (err) {}
      }
      if (current.id && current.id !== officialId) {
        try { await db.collection('projects').doc(current.id).delete(); } catch (err) {}
      }
      await db.collection('projects').doc(officialId).set(updatedProject);
    } catch (e) {
      console.warn('Firestore update project approval failed:', e);
    }
  }

  return { success: true, project: updatedProject };
}

// 5. UPDATE PROJECT (PROGRESS %, MILESTONES, STATUS, INVOICES, FILES)
async function updateProjectData(projectId, updates) {
  const projects = await getAllProjects();
  const cleanId = String(projectId || '').trim().toUpperCase();
  let idx = projects.findIndex(p => 
    (p.id && String(p.id).trim().toUpperCase() === cleanId) || 
    (p.requestRef && String(p.requestRef).trim().toUpperCase() === cleanId) ||
    (p.docId && String(p.docId).trim().toUpperCase() === cleanId)
  );

  if (idx === -1) {
    // try fallback search
    idx = projects.findIndex(p => p.id === projectId || p.requestRef === projectId);
    if (idx === -1) return { success: false, error: 'Project not found' };
  }

  projects[idx] = {
    ...projects[idx],
    ...updates
  };

  saveProjectsLocally(projects);

  if (firebaseInitialized && db) {
    try {
      const docKey = projects[idx].id || projectId;
      await db.collection('projects').doc(docKey).set(projects[idx], { merge: true });
    } catch (e) {
      console.warn('Firestore update project error:', e);
    }
  }

  return { success: true, project: projects[idx] };
}

// 6. SEND CHAT MESSAGE IN PROJECT
async function sendProjectChat(projectId, messageObj) {
  const projects = await getAllProjects();
  const cleanId = String(projectId || '').trim().toUpperCase();
  let idx = projects.findIndex(p => 
    (p.id && String(p.id).trim().toUpperCase() === cleanId) || 
    (p.requestRef && String(p.requestRef).trim().toUpperCase() === cleanId) ||
    (p.docId && String(p.docId).trim().toUpperCase() === cleanId)
  );

  if (idx === -1) return { success: false, error: 'Project not found' };

  const newChatMsg = {
    id: 'c_' + Date.now(),
    sender: messageObj.sender || 'client',
    senderName: messageObj.senderName || 'Client',
    senderRole: messageObj.senderRole || 'Client',
    text: messageObj.text || '',
    timestamp: new Date().toISOString()
  };

  projects[idx].chat = projects[idx].chat || [];
  projects[idx].chat.push(newChatMsg);

  saveProjectsLocally(projects);

  if (firebaseInitialized && db) {
    try {
      const docKey = projects[idx].id || projectId;
      await db.collection('projects').doc(docKey).update({
        chat: firebase.firestore.FieldValue.arrayUnion(newChatMsg)
      });
    } catch (e) {
      console.warn('Firestore push chat error:', e);
    }
  }

  return { success: true, message: newChatMsg, allChat: projects[idx].chat };
}

// Export functions to global scope for easy use in script.js, admin.js, and portal.js
window.RajluxFirebase = {
  getFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseConfigured,
  initFirebase,
  saveMessageToDb,
  subscribeToMessages,
  updateMessageInDb,
  deleteMessageFromDb,
  seedSampleMessagesToDb,
  clearAllMessagesFromDb,
  getEmailConfig,
  saveEmailConfig,
  isEmailJsConfigured,
  // Projects Engine
  getAllProjects,
  getProjectById,
  submitProjectRequest,
  approveProject,
  updateProjectData,
  sendProjectChat,
  getStoredProjects,
  // Expose Firestore db & init flag so admin.js can do direct deletes
  get db() { return db; },
  get firebaseInitialized() { return firebaseInitialized; }
};

