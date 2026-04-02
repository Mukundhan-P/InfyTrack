// ═══════════════════════════════════════════════════════
//  CompanyConnect – Firebase + API Shared Layer
// ═══════════════════════════════════════════════════════

const API = 'http://localhost:5000/api';

// Firebase Web Config — replace with your actual web app config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDhzoQJHbjUygADTnV1DNNWmJkFPvczhKY",
  authDomain: "infosys-student-tracker.firebaseapp.com",
  projectId: "infosys-student-tracker",
  storageBucket: "infosys-student-tracker.firebasestorage.app",
  messagingSenderId: "887323672274",
  appId: "1:887323672274:web:32655949c3b6c53c9e770b",
  measurementId: "G-FY5M2MT6R3"
};

// Initialize Firebase (loaded via CDN in HTML)
if (typeof firebase !== 'undefined' && !firebase.apps?.length) {
  firebase.initializeApp(firebaseConfig);
}

// ── TOKEN STORAGE ─────────────────────────────────────
const Auth = {
  setToken: (t) => localStorage.setItem('authToken', t),
  getToken: () => localStorage.getItem('authToken'),
  clearToken: () => localStorage.removeItem('authToken'),
  setUser: (u) => localStorage.setItem('currentUser', JSON.stringify(u)),
  getUser: () => JSON.parse(localStorage.getItem('currentUser') || 'null'),
  clearUser: () => localStorage.removeItem('currentUser'),
  setAdmin: (a) => localStorage.setItem('currentAdmin', JSON.stringify(a)),
  getAdmin: () => JSON.parse(localStorage.getItem('currentAdmin') || 'null'),
  clearAdmin: () => localStorage.removeItem('currentAdmin'),
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentAdmin');
    if (typeof firebase !== 'undefined') firebase.auth().signOut();
  }
};

// ── API HELPER ────────────────────────────────────────
async function apiCall(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ── AUTH HELPERS ──────────────────────────────────────
function requireStudent() {
  const u = Auth.getUser();
  if (!u) { window.location.href = 'login.html'; return null; }
  return u;
}
function requireAdmin() {
  const a = Auth.getAdmin();
  if (!a) { window.location.href = 'admin-login.html'; return null; }
  return a;
}

// ── FORMAT HELPERS ────────────────────────────────────
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function badgeHTML(status) {
  const map = {
    'Under Review': 'badge-review', 'Verified': 'badge-verified',
    'Completed': 'badge-completed', 'Rejected': 'badge-rejected',
    'Need Re-upload': 'badge-reupload', 'Doing': 'badge-review',
    'Not Started': 'badge-submitted', 'Submitted': 'badge-submitted',
    'pending': 'badge-review', 'approved': 'badge-verified', 'rejected': 'badge-rejected',
  };
  return `<span class="badge ${map[status] || 'badge-submitted'}">${status}</span>`;
}

function typeBadge(type) {
  const map = { 'Training': 'badge-training', 'Internship': 'badge-internship', 'Certification': 'badge-certification', 'Workshop': 'badge-workshop' };
  return `<span class="badge ${map[type] || ''}">${type || ''}</span>`;
}

function showAlert(containerId, msg, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${icons[type]} ${msg}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 5000);
}

function genId(prefix) { return prefix + Date.now().toString(36).toUpperCase(); }

// ── NAV BUILDERS ──────────────────────────────────────
function buildStudentNav(active) {
  const nav = [
    { href: 'dashboard.html', icon: '📊', label: 'Dashboard' },
    { href: 'profile.html', icon: '👤', label: 'My Profile' },
    { href: 'programs.html', icon: '📚', label: 'Programs' },
    { href: 'participation.html', icon: '📝', label: 'Submit Participation' },
    { href: 'upload.html', icon: '📎', label: 'Upload Documents' },
    { href: 'status.html', icon: '🔍', label: 'Track Status' },
  ];
  return nav.map(n => `<a href="${n.href}" class="${active === n.href ? 'active' : ''}"><span class="icon">${n.icon}</span>${n.label}</a>`).join('');
}

function buildAdminNav(active) {
  const nav = [
    { href: 'admin-dashboard.html', icon: '📊', label: 'Dashboard' },
    { href: 'admin-students.html', icon: '👥', label: 'Students' },
    { href: 'admin-pending.html', icon: '⏳', label: 'Pending Approvals' },
    { href: 'admin-verify.html', icon: '✅', label: 'Verify Documents' },
    { href: 'admin-programs.html', icon: '📚', label: 'Programs' },
    { href: 'admin-reports.html', icon: '📄', label: 'Reports' },
  ];
  return nav.map(n => `<a href="${n.href}" class="${active === n.href ? 'active' : ''}"><span class="icon">${n.icon}</span>${n.label}</a>`).join('');
}

// ── LOGOUT HANDLER ────────────────────────────────────
function doLogout(redirectTo = 'login.html') {
  Auth.logout();
  window.location.href = redirectTo;
}
