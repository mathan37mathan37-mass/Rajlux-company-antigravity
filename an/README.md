# 👑 Rajlux Digital Solutions Pvt Ltd – Web Platform

> Premium Enterprise Digital Solutions & Client Management Architecture.

---

## 📁 Project Directory Structure

```text
├── 📄 index.html             # Main Company Website (Landing, Services, Showcase & Request Form)
├── 📄 admin.html             # Admin Management Portal (Project Lifecycle, Approvals & Messages)
├── 📄 portal.html            # Client Project Workspace (Live Progress %, Milestones, Invoices & Chat)
├── 📄 robots.txt             # Search Engine Bot Crawl Directives
├── 📄 sitemap.xml            # SEO Sitemap
│
├── 📂 css/                   # Stylesheets Directory
│   ├── style.css             # Main Website Styles (Dark Luxury Theme, Glassmorphism, Animations)
│   ├── admin.css             # Admin Portal Styling & Responsive Mobile Dashboards
│   └── portal.css            # Client Portal Workspace & Print Invoice Layouts
│
├── 📂 js/                    # JavaScript Application Logic & APIs
│   ├── script.js             # Website Interactivity, Form Handlers & EmailJS Dispatcher
│   ├── admin.js              # Admin Dashboard Controls, Project State Engine & Inbox Manager
│   ├── portal.js             # Client Portal Real-Time Progress, Invoices, Deliverables & Live Chat
│   └── firebase-config.js    # Firebase Firestore Cloud Database & EmailJS SDK Shared Configuration
│
└── 📂 docs/                  # Documentation & Guides
    └── EMAIL_TEMPLATE_GUIDE.md # Complete EmailJS Setup & HTML Email Template Guide
```

---

## 🌟 Core Architecture & Capabilities

1. **Main Website (`index.html`)**:
   - Modern dark luxury aesthetics with smooth glassmorphism and gold accents.
   - Dual-mode contact system: **Project Request** (with custom budget, package & instant tracking ref) and **General Inquiries**.
   - Automated Thank-You email dispatch powered by **EmailJS**.

2. **Admin Management Portal (`admin.html`)**:
   - Project lifecycle tracking: **Pending Approvals**, **In Progress**, **QA/Review**, **Completed**.
   - Official Project ID generation (`RL-PRJ-2026-XXX`).
   - Milestone checklist manager, GST Invoice generator with PDF export, file attachment manager, and team chat.
   - Single-row sleek responsive mobile bottom navigation.

3. **Client Workspace Portal (`portal.html`)**:
   - Client authentication via Project ID & PIN / Email.
   - Real-time SVG radial and linear progress meters.
   - Milestone roadmap tracker, direct encrypted team messaging, invoice preview/printing, and verified asset downloads.

4. **Cloud & Local Storage Hybrid (`js/firebase-config.js`)**:
   - Connects to Firebase Firestore when credentials are provided in Admin Settings.
   - Automatic fallback to high-speed client-side `localStorage` cache for offline/instant demo usage.
