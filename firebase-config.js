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

// Export functions to global scope for easy use in script.js and admin.js
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
  isEmailJsConfigured
};

