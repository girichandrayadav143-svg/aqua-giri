/**
 * Aqua Farm Management System - Main Application Logic & Controller
 * Vannamei Shrimp Farming Web Application
 * Owner: Bhatraju Raju
 * Supports Node.js Express REST API Authentication & MERN Stack Backend
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Global State
  const state = {
    user: null, // { username, role, name, token }
    activeTab: 'dashboard',
    viewMode: 'grid',
    searchQuery: '',
    statusFilter: 'all',
    ponds: [],
    feedLogs: [],
    waterLogs: [],
    growthLogs: [],
    feedStock: [],
    operationalLogs: [],
    ownerNotifications: [],
    expenses: [],
    expenseFilters: {
      date: '',
      pond: 'all',
      category: 'all',
      status: 'all'
    },
    users: [],
    userFilters: {
      query: '',
      role: 'all',
      status: 'all'
    },
    selectedPondId: null,
    currentQuickEntryId: null,
    currentFeedEditId: null,
    currentWaterEditId: null,
    currentGrowthEditId: null,
    currentMortalityEditId: null,
    isTelugu: false,
    selectedFeedSlot: '07:00 AM',
    selectedConsumption: '100% Consumed',
    editingExpenseId: null
  };

  const FEED_SLOTS = [
    { time: '07:00 AM', label: '7:00 AM Feed' },
    { time: '10:00 AM', label: '10:00 AM Feed' },
    { time: '01:00 PM', label: '1:00 PM Feed' },
    { time: '04:00 PM', label: '4:00 PM Feed' }
  ];

  function normalizeApiHost(hostname) {
    if (!hostname || hostname === 'localhost' || hostname === '::1' || hostname === '[::1]' || hostname === '0.0.0.0') {
      return '127.0.0.1';
    }
    return hostname;
  }

  async function resolveApiBase() {
    if (window.location.protocol !== 'file:') {
      const safeHost = normalizeApiHost(window.location.hostname);
      const safePort = window.location.port || '5000';
      return `http://${safeHost}:${safePort}`;
    }

    const ports = [5000, 5001, 5002, 5003, 5004, 5005, 3000, 8080];
    for (const port of ports) {
      try {
        const probe = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
          method: 'OPTIONS',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors'
        });
        if (probe && (probe.ok || probe.status === 400 || probe.status === 401 || probe.status === 404)) {
          return `http://127.0.0.1:${port}`;
        }
      } catch (err) {
        // Try the next port.
      }
    }

    return 'http://127.0.0.1:5000';
  }

  async function apiUrl(path) {
    const base = await resolveApiBase();
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  const translations = {
    en: {
      aquaFarming: 'AQUA FARMING',
      owner: 'Owner',
      usernameLabel: 'Username',
      passwordLabel: 'Password',
      signInToAqua: 'Sign In to AQUA FARMING',
      secureJWT: 'Secure JWT Encrypted Login',
      installAquaApp: 'Install Aqua App',
      logout: 'Logout',
      localEngine: 'Local Engine (Offline Ready)',
      ownerDashboard: 'Owner Dashboard',
      pondManagement: 'Pond Management',
      servantFeedingPortal: 'Servant Dashboard',
      supervisorDashboard: 'Supervisor Dashboard',
      waterGrowthLogs: 'Water & Growth Logs',
      feedStockInventory: 'Feed Stock Inventory',
      manageUsers: 'Manage Users',
      investmentExpenses: 'Investment & Expenses',
      ownerQuickEntries: 'Owner Daily Entry',
      ownerQuickEntriesHint: 'Update pond feed, water, and mortality records from the owner dashboard.',
      selectPond: 'Select Pond',
      todaysFeedKg: 'Feed Used Today (KG)',
      waterPh: 'Pond pH Level',
      dissolvedOxygen: 'Dissolved Oxygen (DO)',
      temperature: 'Temperature',
      mortalityCount: 'Mortality Count',
      remarks: 'Remarks',
      ownerEntryPlaceholder: 'Updated by owner',
      saveValues: 'Save Values',
      clearForm: 'Clear Form',
      pondId: 'Pond ID',
      date: 'Date',
      feed: 'Feed',
      waterQuality: 'Water',
      mortality: 'Mortality',
      actions: 'Actions',
      editLatestEntry: 'Edit Latest Entry',
      submitFeedRecord: 'Submit Feed Record',
      saveWaterLog: 'Save Water Quality Log',
      saveGrowthData: 'Save Growth Data',
      recordMortality: 'Record Mortality',
      switchLanguage: 'తెలుగు',
      loginUsername: 'enter your user name',
      loginPassword: 'enter your password'
    },
    te: {
      aquaFarming: 'అక్వా ఫార్మింగ్',
      owner: 'యజమాని',
      usernameLabel: 'వాడుకరి పేరు',
      passwordLabel: 'పాస్‌వర్డ్',
      signInToAqua: 'అక్వా ఫార్మింగ్‌లోకి ప్రవేశించండి',
      secureJWT: 'సురక్షిత JWT ఎన్‌క్రిప్ట్ లాగిన్',
      installAquaApp: 'అప్‌పును ఇన్స్టాల్ చేయండి',
      logout: 'లాగ్అవుట్',
      localEngine: 'లోకల్ ఇంజిన్ (ఆఫ్‌లైన్ రdy)',
      ownerDashboard: 'ఓనర్ డాష్‌బోర్డ్',
      pondManagement: 'పూడి నిర్వహణ',
      servantFeedingPortal: 'సెర్వెంట్ డాష్‌బోర్డ్',
      supervisorDashboard: 'సూపర్‌వైజర్ డాష్‌బోర్డ్',
      waterGrowthLogs: 'నీరు & వృద్ధి లాగ్స్',
      feedStockInventory: 'ఫీడ్ స్టాక్ ఇన్వెంటరీ',
      manageUsers: 'వినియోగదారులను నిర్వహించండి',
      investmentExpenses: 'వృద్ధి & ఖర్చులు',
      ownerQuickEntries: 'యజమాని తక్షణ ఎంట్రీ',
      ownerQuickEntriesHint: 'యజమాని డాష్‌బోర్డ్లో ఈరోజు పూడి ఫీడ్, నీరు, మరణాలు వివరాలను నవీకరించండి.',
      selectPond: 'పూడిని ఎంచుకోండి',
      todaysFeedKg: 'ఈరోజు ఫీడ్ (కెజి)',
      waterPh: 'నీటి pH',
      dissolvedOxygen: 'డిసోల్వ్డ్ ఆక్సిజన్ (DO)',
      temperature: 'ఉష్ణోగ్రత',
      mortalityCount: 'మరణాల సంఖ్య',
      remarks: 'వ్యాఖ్యలు',
      ownerEntryPlaceholder: 'యజమాని ద్వారా నవీకరించబడింది',
      saveValues: 'విలువలను సేవ్ చేయండి',
      clearForm: 'ఫారమ్‌ను క్లియర్ చేయండి',
      pondId: 'పూడి ID',
      date: 'తేదీ',
      feed: 'ఫీడ్',
      waterQuality: 'నీరు',
      mortality: 'మరణాలు',
      actions: 'చర్యలు',
      editLatestEntry: 'చివరి ఎంట్రీని సవరించండి',
      submitFeedRecord: 'ఫీడ్ రికార్డు సమర్పించండి',
      saveWaterLog: 'నీటి నాణ్యత లాగ్‌ను సేవ్ చేయండి',
      saveGrowthData: 'వృద్ధి డేటాను సేవ్ చేయండి',
      recordMortality: 'మరణాల నమోదు చేయండి',
      switchLanguage: 'English',
      loginUsername: 'మీ వాడుకరి పేరును నమోదు చేయండి',
      loginPassword: 'మీ పాస్‌వర్డ్‌ను నమోదు చేయండి'
    }
  };

  window.AQUA_APP = window.AQUA_APP || {};

  function applyLanguageText() {
    const lang = state.isTelugu ? 'te' : 'en';
    document.documentElement.lang = lang === 'te' ? 'te' : 'en';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[lang][key]) {
        el.setAttribute('placeholder', translations[lang][key]);
      }
    });

    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      const label = langBtn.querySelector('span');
      if (label) label.textContent = translations[lang].switchLanguage;
    }

    localStorage.setItem('aquaLanguage', lang);
  }

  const savedLanguage = localStorage.getItem('aquaLanguage');
  if (savedLanguage === 'te') {
    state.isTelugu = true;
  }

  window.AQUA_APP.toggleLanguage = function() {
    state.isTelugu = !state.isTelugu;
    applyLanguageText();
  };

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  // ==================== API HELPER WITH AUTHORIZATION ====================
  /**
   * Enhanced fetch that automatically includes JWT Authorization header
   * Handles 401/403 by redirecting to login
   */
  async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('manthena_aqua_jwt');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Attach JWT token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      localStorage.removeItem('manthena_aqua_jwt');
      localStorage.removeItem('manthena_aqua_user');
      state.user = null;
      document.getElementById('mainAppWrapper').style.display = 'none';
      document.getElementById('loginOverlay').style.display = 'flex';
      showToast('Your session has expired. Please sign in again.', 'error');
      throw new Error('Unauthorized - session expired');
    }

    // Handle 403 Forbidden - user doesn't have access
    if (response.status === 403) {
      showToast('You do not have permission to access this resource.', 'error');
      throw new Error('Forbidden - insufficient permissions');
    }

    return response;
  }

  // ==================== AUTH TAB SWITCHING ====================
  const authTabLogin = document.getElementById('authTabLogin');
  const authTabRegister = document.getElementById('authTabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  authTabLogin?.addEventListener('click', () => {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    authTabLogin.style.borderBottomColor = '#0d9488';
    authTabLogin.style.color = '#0d9488';
    authTabRegister.style.borderBottomColor = 'transparent';
    authTabRegister.style.color = '#999';
  });

  authTabRegister?.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    authTabRegister.style.borderBottomColor = '#0d9488';
    authTabRegister.style.color = '#0d9488';
    authTabLogin.style.borderBottomColor = 'transparent';
    authTabLogin.style.color = '#999';
  });

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }
  window.AQUA_APP.fillLogin = function(username, password) {
    const uInput = document.getElementById('loginUsername');
    const pInput = document.getElementById('loginPassword');
    if (uInput && pInput) {
      uInput.value = username;
      pInput.value = password;
    }
  };

  // Password Visibility Toggle
  document.getElementById('togglePasswordBtn')?.addEventListener('click', (e) => {
    const pwd = document.getElementById('loginPassword');
    if (pwd) {
      if (pwd.type === 'password') {
        pwd.type = 'text';
        e.currentTarget.className = 'fas fa-eye-slash';
      } else {
        pwd.type = 'password';
        e.currentTarget.className = 'fas fa-eye';
      }
    }
  });

  // Login Form Submission Handler
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const credential = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!credential || !password) {
      showToast('Please enter both username and password.', 'error');
      return;
    }

    try {
      // Use relative URL — Express serves both frontend and API from same origin
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, password })
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('Login JSON parse error:', jsonErr);
        showToast('Server returned an invalid login response. Please try again.', 'error');
        return;
      }

      if (res.ok && data.token) {
        state.user = {
          username: data.user.username,
          userId: data.user.userId,
          role: data.user.role,
          name: data.user.name,
          email: data.user.email,
          ownerId: data.user.ownerId,  // ← Multi-owner: persist ownerId
          token: data.token
        };
        localStorage.setItem('manthena_aqua_jwt', data.token);
        localStorage.setItem('manthena_aqua_user', JSON.stringify(state.user));
        showToast(`Welcome back, ${data.user.name}!`);
        document.getElementById('loginForm').reset();
        initAuthenticatedUI();
      } else {
        showToast(data.message || 'Login failed. Please check your credentials.', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('Connection error. Please try again.', 'error');
    }
  });

  // Registration Form Submission Handler
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('regConfirmPassword').value.trim();

    if (!name || !email || !username || !password || !confirmPassword) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    try {
      console.log('🔄 Attempting signup...', { name, email, username });

      // Use relative URL — Express serves both frontend and API from same origin
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name, email, username, password, confirmPassword })
      });

      console.log('📥 Server response status:', res.status);

      let data;
      try {
        const responseText = await res.text();
        console.log('📥 Server response text:', responseText);
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        console.error('❌ Failed to parse response:', jsonErr);
        showToast('❌ Server error: Invalid response. Restart server and try again.', 'error');
        return;
      }

      if (res.ok && data.token) {
        console.log('✅ Account created successfully!');
        state.user = {
          username: data.user.username,
          userId: data.user.userId,
          role: data.user.role,
          name: data.user.name,
          email: data.user.email,
          ownerId: data.user.ownerId,  // ← Multi-owner: new owner gets their own ownerId
          token: data.token
        };
        localStorage.setItem('manthena_aqua_jwt', data.token);
        localStorage.setItem('manthena_aqua_user', JSON.stringify(state.user));
        showToast(`✅ Welcome, ${data.user.name}! Your account has been created.`);
        document.getElementById('registerForm').reset();
        initAuthenticatedUI();
      } else if (data.requirements) {
        // Password requirements not met
        console.warn('⚠️ Password requirements not met:', data.requirements);
        const reqs = data.requirements;
        let msg = '❌ Password must have:\n';
        if (!reqs.minLength) msg += '• ❌ At least 8 characters\n';
        else msg += '• ✅ At least 8 characters\n';
        
        if (!reqs.hasUppercase) msg += '• ❌ At least one UPPERCASE letter (A-Z)\n';
        else msg += '• ✅ At least one UPPERCASE letter (A-Z)\n';
        
        if (!reqs.hasLowercase) msg += '• ❌ At least one lowercase letter (a-z)\n';
        else msg += '• ✅ At least one lowercase letter (a-z)\n';
        
        if (!reqs.hasNumber && !reqs.hasSpecial) msg += '• ❌ At least one number (0-9) OR special character (!@#$%^&*)\n';
        else msg += '• ✅ Has number or special character\n';
        
        showToast(msg, 'error');
      } else if (res.status === 409) {
        console.warn('⚠️ Conflict - Username or email already exists');
        showToast(data.message || '❌ Username or email already exists. Try different values.', 'error');
      } else {
        console.error('❌ Registration failed:', res.status, data);
        showToast(`❌ ${data.message || 'Registration failed. Please try again.'}`, 'error');
      }
    } catch (err) {
      console.error('❌ Registration network error:', err);
      showToast(`❌ Connection error: ${err.message || 'Cannot reach server. Make sure it is running.'}\n\nStart server: npm start`, 'error');
    }
  });

  // Check saved authentication session
  function checkSavedAuth() {
    const savedUser = localStorage.getItem('manthena_aqua_user');
    if (savedUser) {
      try {
        state.user = JSON.parse(savedUser);
        initAuthenticatedUI();
        return;
      } catch(e) {}
    }
    // Show login overlay if not logged in
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('mainAppWrapper').style.display = 'none';
  }

  // Initialize Authenticated UI State
  async function initAuthenticatedUI() {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('mainAppWrapper').style.display = 'flex';

    if (state.user) {
      document.getElementById('activeUserName').textContent = state.user.name;
      document.getElementById('activeUserRole').textContent = state.user.role.toUpperCase();
    }

    applyRolePermissions();
    await loadData();
  }

  // Logout Handler
  window.AQUA_APP.logout = function() {
    localStorage.removeItem('manthena_aqua_jwt');
    localStorage.removeItem('manthena_aqua_user');
    state.user = null;
    document.getElementById('mainAppWrapper').style.display = 'none';
    document.getElementById('loginOverlay').style.display = 'flex';
    showToast('Logged out successfully.');
  };

  // Data Loading Strategy — loads all data from the API using the authenticated user's ownerId
  async function loadData() {
    // Load ponds from API (returns only this owner's ponds, filtered by role)
    try {
      const res = await apiFetch('/api/ponds');
      if (res.ok) {
        state.ponds = await res.json();
      } else {
        state.ponds = await window.AQUA_STORAGE.getPonds();
      }
    } catch (e) {
      console.error('Error loading ponds:', e);
      state.ponds = await window.AQUA_STORAGE.getPonds();
    }

    // Load feed logs from API (owner-isolated)
    try {
      const res = await apiFetch('/api/feed-logs');
      state.feedLogs = res.ok ? await res.json() : [];
    } catch (e) {
      state.feedLogs = toArray(await window.AQUA_STORAGE.getFeedLogs?.());
    }

    // Load water logs from API (owner-isolated)
    try {
      const res = await apiFetch('/api/water-logs');
      state.waterLogs = res.ok ? await res.json() : [];
    } catch (e) {
      state.waterLogs = toArray(await window.AQUA_STORAGE.getWaterLogs?.());
    }

    // Load growth logs from API (owner-isolated)
    try {
      const res = await apiFetch('/api/growth-logs');
      state.growthLogs = res.ok ? await res.json() : [];
    } catch (e) {
      state.growthLogs = toArray(await window.AQUA_STORAGE.getGrowthLogs?.());
    }

    // Load mortality logs from API (owner-isolated)
    try {
      const res = await apiFetch('/api/mortality-logs');
      state.mortalityLogs = res.ok ? await res.json() : [];
    } catch (e) {
      state.mortalityLogs = [];
    }

    // Load feed inventory from API (owner-isolated)
    try {
      const res = await apiFetch('/api/feed-inventory');
      state.feedStock = res.ok ? [await res.json()] : toArray(await window.AQUA_STORAGE.getFeedStock?.());
    } catch (e) {
      state.feedStock = toArray(await window.AQUA_STORAGE.getFeedStock?.());
    }

    // Load expenses from API (owner-isolated)
    try {
      const res = await apiFetch('/api/expenses');
      state.expenses = res.ok ? await res.json() : toArray(await window.AQUA_STORAGE.getExpenses?.());
    } catch (e) {
      state.expenses = toArray(await window.AQUA_STORAGE.getExpenses?.());
    }

    // Load operational logs from API (owner-isolated)
    try {
      const res = await apiFetch('/api/operational-logs');
      state.operationalLogs = res.ok ? await res.json() : [];
    } catch (e) {
      state.operationalLogs = [];
    }

    state.ownerNotifications = toArray(state.operationalLogs).filter(log => log.type === 'urgent-report' || log.type === 'notification');

    // Calculate DOC for all ponds
    const today = new Date();
    state.ponds.forEach(p => {
      if (p.stockingDate) {
        const stockDate = new Date(p.stockingDate);
        const diffTime = Math.abs(today - stockDate);
        p.doc = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    });

    updateStorageBadge();
    renderAll();
  }

  function generateNextPondId() {
    if (!state.ponds.length) return 'P001';
    const ids = state.ponds.map(p => {
      const match = (p.pondId || p.id).match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxNum = Math.max(...ids);
    return 'P' + String(maxNum + 1).padStart(3, '0');
  }

  function updateStorageBadge() {
    const badge = document.getElementById('storageBadge');
    if (!badge) return;
    const isFb = window.AQUA_STORAGE.isFirebase();
    if (isFb) {
      badge.className = 'storage-badge firebase';
      badge.innerHTML = `<span class="dot-indicator"></span> Firebase Firestore Live`;
    } else {
      badge.className = 'storage-badge';
      badge.innerHTML = `<span class="dot-indicator"></span> MERN API & Storage Active`;
    }
  }

  function formatCurrency(value) {
    const num = Number(value || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function parseDateValue(dateStr) {
    if (!dateStr) return null;
    return new Date(`${dateStr}T00:00:00`);
  }

  function isSameCalendarDay(a, b) {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /**
   * Format number as currency string
   */
  function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return parseFloat(num).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  /**
   * Format date to DD-MM-YYYY or MM/DD/YYYY
   */
  function formatDate(dateStr) {
    if (!dateStr) return '--';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '--';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return '--';
    }
  }

  function renderAll() {
    renderKPIs();
    renderPondGridOrTable();
    renderServantPonds();
    renderOwnerQuickEntries();
    renderSupervisorDashboard();
    renderStockManagement();
    renderServantOperationalPanels();
    renderServantExpenseSection();
    renderOwnerOpsSummary();
    renderInvestmentReport();
    renderExpenseCategoryTotals();
    renderExpenseHistoryTable();
    renderOwnerNotifications();
    renderWaterAndGrowthLogs();
    renderHistoricalDashboard();
    applyRolePermissions();
    applyLanguageText();
  }

  function applyRolePermissions() {
    if (!state.user) return;
    const role = state.user.role;
    
    // Remove all role classes from body
    document.body.classList.remove('role-owner', 'role-supervisor', 'role-servant');
    
    // Add current user's role class to body for CSS-based visibility
    document.body.classList.add(`role-${role}`);
    
    document.querySelectorAll('.owner-only').forEach(el => {
      el.style.display = (role === 'owner') ? '' : 'none';
    });
    document.querySelectorAll('.supervisor-only').forEach(el => {
      el.style.display = (role === 'owner' || role === 'supervisor') ? '' : 'none';
    });

    if (role === 'servant') {
      const currentTab = state.activeTab;
      if (currentTab !== 'servant-feeding') {
        switchTab('servant-feeding');
      }
      const servantTabButton = document.querySelector('.nav-tab[data-tab="servant-feeding"]');
      if (servantTabButton) {
        servantTabButton.style.display = '';
        servantTabButton.classList.add('active');
      }
    }
  }

  const USER_STORAGE_KEY = 'manthena_aqua_users_v1';
  const DEFAULT_LOCAL_USERS = [
    {
      _id: 'user_owner',
      userId: 'U001',
      username: 'manthena',
      name: 'Bhatraju Raju',
      email: 'owner@aquafarm.io',
      mobileNumber: '9876543210',
      role: 'owner',
      assignedPonds: [],
      profilePhoto: '',
      accountNotes: 'Farm owner account.',
      status: 'active',
      isActive: true,
      isSuspended: false,
      lastLogin: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'user_supervisor',
      userId: 'U002',
      username: 'rajesh',
      name: 'Rajesh Kumar',
      email: 'rajesh@aquafarm.io',
      mobileNumber: '9876501234',
      role: 'supervisor',
      assignedPonds: ['P001', 'P002'],
      profilePhoto: '',
      accountNotes: 'Supervisor account.',
      status: 'active',
      isActive: true,
      isSuspended: false,
      lastLogin: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'user_servant',
      userId: 'U003',
      username: 'ramu',
      name: 'Ramu',
      email: 'ramu@aquafarm.io',
      mobileNumber: '9876509876',
      role: 'servant',
      assignedPonds: ['P001'],
      profilePhoto: '',
      accountNotes: 'Servant account.',
      status: 'active',
      isActive: true,
      isSuspended: false,
      lastLogin: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  function getLocalUsers() {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(DEFAULT_LOCAL_USERS));
      return [...DEFAULT_LOCAL_USERS];
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
    } catch (err) {}
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(DEFAULT_LOCAL_USERS));
    return [...DEFAULT_LOCAL_USERS];
  }

  function setLocalUsers(users) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  }

  function normalizeUserRecord(user) {
    if (window.AQUA_USER_UTILS && typeof window.AQUA_USER_UTILS.normalizeUserRecord === 'function') {
      return window.AQUA_USER_UTILS.normalizeUserRecord(user, user?._id || user?.userId || `U${Date.now()}`);
    }
    return {
      ...user,
      assignedPonds: Array.isArray(user.assignedPonds) ? user.assignedPonds : (user.assignedPonds ? String(user.assignedPonds).split(',').map(v => v.trim()).filter(Boolean) : []),
      role: String(user.role || 'servant').toLowerCase(),
      status: user.status || (user.isActive ? 'active' : 'inactive'),
      userId: user.userId || user.id || `U${Date.now()}`
    };
  }

  function applyUserFilters(users) {
    return (users || []).filter(user => {
      const query = String(state.userFilters.query || '').toLowerCase();
      if (query) {
        const text = [user.userId, user.name, user.username, user.email, user.mobileNumber, user.role, (user.assignedPonds || []).join(','), user.status].join(' ').toLowerCase();
        if (!text.includes(query)) return false;
      }
      if (state.userFilters.role !== 'all' && user.role !== state.userFilters.role) return false;
      if (state.userFilters.status !== 'all' && user.status !== state.userFilters.status) return false;
      return true;
    });
  }

  function generateNextLocalUserId(users = []) {
    const numericIds = (users || []).map(u => {
      const digits = String(u.userId || u.id || '').replace(/\D/g, '');
      return digits ? parseInt(digits, 10) : 0;
    }).filter(n => Number.isFinite(n) && n > 0);
    const nextNumber = numericIds.length ? Math.max(...numericIds) + 1 : 1;
    return `U${String(nextNumber).padStart(3, '0')}`;
  }

  async function loadUsers() {
    let users = [];
    try {
      const token = localStorage.getItem('manthena_aqua_jwt');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/users', { headers });
      if (res.ok) {
        users = await res.json();
      } else {
        users = getLocalUsers();
      }
    } catch (err) {
      users = getLocalUsers();
    }

    state.users = (users || []).map(normalizeUserRecord);
    renderUsersTable();
    return state.users;
  }

  function renderUsersTable() {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    const filtered = applyUserFilters(state.users);
    if (!filtered.length) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:1rem; color:var(--text-dim);">No users found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(user => {
      const statusLabel = user.status === 'active' ? 'Active' : user.status === 'suspended' ? 'Suspended' : 'Inactive';
      return `
        <tr>
          <td>${user.userId || ''}</td>
          <td>${user.name || ''}</td>
          <td>${user.role || ''}</td>
          <td>${user.mobileNumber || ''}</td>
          <td>${user.username || ''}</td>
          <td>${statusLabel}</td>
          <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}</td>
          <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : ''}</td>
          <td>
            <button class="btn btn-secondary btn-sm owner-only" onclick="window.AQUA_APP.openUserModal('${user._id || user.userId}')">Edit</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function saveUserLocally(payload, internalId) {
    const users = getLocalUsers();
    const normalizedPayload = {
      ...payload,
      role: String(payload.role || 'servant').toLowerCase(),
      status: payload.status || 'active',
      assignedPonds: Array.isArray(payload.assignedPonds) ? payload.assignedPonds : (payload.assignedPonds ? String(payload.assignedPonds).split(',').map(v => v.trim()).filter(Boolean) : [])
    };
    if (internalId) {
      const existingIndex = users.findIndex(user => user._id === internalId || user.userId === internalId);
      if (existingIndex >= 0) {
        users[existingIndex] = {
          ...users[existingIndex],
          ...normalizedPayload,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      const newUser = {
        _id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: normalizedPayload.userId || generateNextLocalUserId(users),
        username: String(normalizedPayload.username || '').toLowerCase().trim(),
        email: String(normalizedPayload.email || '').toLowerCase().trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: '',
        ...normalizedPayload
      };
      users.unshift(newUser);
    }
    setLocalUsers(users);
    state.users = users.map(normalizeUserRecord);
    renderUsersTable();
    return state.users;
  }

  window.AQUA_APP.refreshUsers = async function() {
    await loadUsers();
    showToast('User list refreshed.');
  };

  window.AQUA_APP.exportUsersCSV = function() {
    const rows = [['User ID','Full Name','Role','Mobile','Username','Email','Status','Created At','Last Login']];
    applyUserFilters(state.users).forEach(user => {
      rows.push([
        user.userId || '',
        user.name || '',
        user.role || '',
        user.mobileNumber || '',
        user.username || '',
        user.email || '',
        user.status || '',
        user.createdAt ? new Date(user.createdAt).toLocaleString() : '',
        user.lastLogin ? new Date(user.lastLogin).toLocaleString() : ''
      ]);
    });
    const csv = rows.map(row => row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users_export.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  window.AQUA_APP.openUserModal = function(userId) {
    const modal = document.getElementById('userManagementModal');
    const title = modal?.querySelector('.modal-header h3');
    const form = document.getElementById('userManagementForm');
    if (!modal || !form) return;

    const targetUser = userId ? state.users.find(u => u._id === userId || u.userId === userId || u.username === userId) : null;
    if (targetUser) {
      if (title) title.textContent = 'Edit User';
      document.getElementById('userFormInternalId').value = targetUser._id || targetUser.userId || '';
      document.getElementById('userFormUserId').value = targetUser.userId || '';
      document.getElementById('userFormName').value = targetUser.name || '';
      document.getElementById('userFormMobile').value = targetUser.mobileNumber || '';
      document.getElementById('userFormUsername').value = targetUser.username || '';
      document.getElementById('userFormEmail').value = targetUser.email || '';
      document.getElementById('userFormRole').value = targetUser.role || 'servant';
      document.getElementById('userFormAssignedPonds').value = (targetUser.assignedPonds || []).join(', ');
      document.getElementById('userFormPhoto').value = targetUser.profilePhoto || '';
      document.getElementById('userFormStatus').value = targetUser.status || 'active';
      document.getElementById('userFormPassword').value = '';
      document.getElementById('userFormForceChange').checked = Boolean(targetUser.forcePasswordChange);
      document.getElementById('userFormNotes').value = targetUser.accountNotes || '';
    } else {
      if (title) title.textContent = 'Add New User';
      form.reset();
      document.getElementById('userFormInternalId').value = '';
      document.getElementById('userFormStatus').value = 'active';
      document.getElementById('userFormRole').value = 'servant';
    }
    modal.classList.add('open');
  };

  window.AQUA_APP.editUser = function(userId) {
    window.AQUA_APP.openUserModal(userId);
  };

  function getUserRequestHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('manthena_aqua_jwt');
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async function submitUserFormLocally(payload, internalId) {
    await saveUserLocally(payload, internalId);
    document.getElementById('userManagementModal')?.classList.remove('open');
    showToast(`User ${internalId ? 'updated' : 'created'} locally.`);
  }

  async function fetchWithFallback(url, options) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('API request failed');
      return response;
    } catch (err) {
      throw err;
    }
  }

  function syncUserFromFormResponse(payload, internalId) {
    saveUserLocally(payload, internalId);
  }

  async function handleUserSaveRequest(payload, internalId) {
    try {
      const method = internalId ? 'PUT' : 'POST';
      const endpoint = internalId ? `/api/users/${internalId}` : '/api/users';
      const res = await fetch(endpoint, {
        method,
        headers: getUserRequestHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error('Server rejected user save request');
      }
      await loadUsers();
      document.getElementById('userManagementModal')?.classList.remove('open');
      showToast(`User ${internalId ? 'updated' : 'created'} successfully.`);
    } catch (err) {
      await submitUserFormLocally(payload, internalId);
    }
  }

  window.AQUA_APP.refreshUsers = async function() {
    await loadUsers();
    showToast('User list refreshed.');
  };

  document.getElementById('userSearchInput')?.addEventListener('input', (e) => {
    state.userFilters.query = e.target.value || '';
    renderUsersTable();
  });

  document.getElementById('userRoleFilter')?.addEventListener('change', (e) => {
    state.userFilters.role = e.target.value;
    renderUsersTable();
  });

  document.getElementById('userStatusFilter')?.addEventListener('change', (e) => {
    state.userFilters.status = e.target.value;
    renderUsersTable();
  });

  document.getElementById('userManagementForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.user?.role !== 'owner') {
      showToast('Only the owner can manage users.', 'error');
      return;
    }

    const internalId = document.getElementById('userFormInternalId').value.trim();
    const userId = document.getElementById('userFormUserId').value.trim();
    const name = document.getElementById('userFormName').value.trim();
    const mobileNumber = document.getElementById('userFormMobile').value.trim();
    const username = document.getElementById('userFormUsername').value.trim();
    const email = document.getElementById('userFormEmail').value.trim();
    const role = document.getElementById('userFormRole').value;
    const assignedPonds = document.getElementById('userFormAssignedPonds').value.split(',').map(v => v.trim()).filter(Boolean);
    const profilePhoto = document.getElementById('userFormPhoto').value.trim();
    const status = document.getElementById('userFormStatus').value;
    const password = document.getElementById('userFormPassword').value.trim();
    const forcePasswordChange = document.getElementById('userFormForceChange').checked;
    const accountNotes = document.getElementById('userFormNotes').value.trim();

    if (!email) {
      showToast('Email is required to save the user.', 'error');
      return;
    }

    if (!name) {
      showToast('Name is required when creating a new user.', 'error');
      return;
    }

    if (!username) {
      showToast('Username is required when creating a new user.', 'error');
      return;
    }

    const payload = {
      userId,
      name,
      email,
      mobileNumber,
      username,
      role,
      assignedPonds,
      profilePhoto,
      forcePasswordChange,
      accountNotes,
      isActive: status === 'active',
      isSuspended: status === 'suspended'
    };

    if (password) payload.password = password;

    await handleUserSaveRequest(payload, internalId);
    await loadUsers();
  });

  function renderUsersTable() {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    const filtered = applyUserFilters(state.users);
    if (!filtered.length) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:1rem; color:var(--text-dim);">No users found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(user => {
      const statusLabel = user.status === 'active' ? 'Active' : user.status === 'suspended' ? 'Suspended' : 'Inactive';
      return `
        <tr>
          <td>${user.userId || ''}</td>
          <td>${user.name || ''}</td>
          <td>${user.role || ''}</td>
          <td>${user.mobileNumber || ''}</td>
          <td>${user.username || ''}</td>
          <td>${statusLabel}</td>
          <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}</td>
          <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : ''}</td>
          <td>
            <button class="btn btn-secondary btn-sm owner-only" onclick="window.AQUA_APP.openUserModal('${user._id || user.userId}')">Edit</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function loadUsers() {
    let users = [];
    try {
      const token = localStorage.getItem('manthena_aqua_jwt');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/users', { headers });
      if (res.ok) {
        users = await res.json();
      } else {
        users = getLocalUsers();
      }
    } catch (err) {
      users = getLocalUsers();
    }

    state.users = (users || []).map(normalizeUserRecord);
    renderUsersTable();
    return state.users;
  }

  function saveUserLocally(payload, internalId) {
    const users = getLocalUsers();
    const normalizedPayload = {
      ...payload,
      role: String(payload.role || 'servant').toLowerCase(),
      status: payload.status || 'active',
      assignedPonds: Array.isArray(payload.assignedPonds) ? payload.assignedPonds : (payload.assignedPonds ? String(payload.assignedPonds).split(',').map(v => v.trim()).filter(Boolean) : [])
    };
    if (internalId) {
      const existingIndex = users.findIndex(user => user._id === internalId || user.userId === internalId);
      if (existingIndex >= 0) {
        users[existingIndex] = {
          ...users[existingIndex],
          ...normalizedPayload,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      const newUser = {
        _id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: normalizedPayload.userId || generateNextLocalUserId(users),
        username: String(normalizedPayload.username || '').toLowerCase().trim(),
        email: String(normalizedPayload.email || '').toLowerCase().trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: '',
        ...normalizedPayload
      };
      users.unshift(newUser);
    }
    setLocalUsers(users);
    state.users = users.map(normalizeUserRecord);
    renderUsersTable();
    return state.users;
  }

  window.AQUA_APP.openUserModal = function(userId) {
    const modal = document.getElementById('userManagementModal');
    const title = modal?.querySelector('.modal-header h3');
    const form = document.getElementById('userManagementForm');
    if (!modal || !form) return;

    const targetUser = userId ? state.users.find(u => u._id === userId || u.userId === userId || u.username === userId) : null;
    if (targetUser) {
      if (title) title.textContent = 'Edit User';
      document.getElementById('userFormInternalId').value = targetUser._id || targetUser.userId || '';
      document.getElementById('userFormUserId').value = targetUser.userId || '';
      document.getElementById('userFormName').value = targetUser.name || '';
      document.getElementById('userFormMobile').value = targetUser.mobileNumber || '';
      document.getElementById('userFormUsername').value = targetUser.username || '';
      document.getElementById('userFormEmail').value = targetUser.email || '';
      document.getElementById('userFormRole').value = targetUser.role || 'servant';
      document.getElementById('userFormAssignedPonds').value = (targetUser.assignedPonds || []).join(', ');
      document.getElementById('userFormPhoto').value = targetUser.profilePhoto || '';
      document.getElementById('userFormStatus').value = targetUser.status || 'active';
      document.getElementById('userFormPassword').value = '';
      document.getElementById('userFormForceChange').checked = Boolean(targetUser.forcePasswordChange);
      document.getElementById('userFormNotes').value = targetUser.accountNotes || '';
    } else {
      if (title) title.textContent = 'Add New User';
      form.reset();
      document.getElementById('userFormInternalId').value = '';
      document.getElementById('userFormStatus').value = 'active';
      document.getElementById('userFormRole').value = 'servant';
    }
    modal.classList.add('open');
  };

  document.getElementById('userSearchInput')?.addEventListener('input', (e) => {
    state.userFilters.query = e.target.value || '';
    renderUsersTable();
  });

  document.getElementById('userRoleFilter')?.addEventListener('change', (e) => {
    state.userFilters.role = e.target.value;
    renderUsersTable();
  });

  document.getElementById('userStatusFilter')?.addEventListener('change', (e) => {
    state.userFilters.status = e.target.value;
    renderUsersTable();
  });

  window.AQUA_APP.refreshUsers = async function() {
    await loadUsers();
    showToast('User list refreshed.');
  };

  window.AQUA_APP.exportUsersCSV = function() {
    const rows = [['User ID','Full Name','Role','Mobile','Username','Email','Status','Created At','Last Login']];
    applyUserFilters(state.users).forEach(user => {
      rows.push([
        user.userId || '',
        user.name || '',
        user.role || '',
        user.mobileNumber || '',
        user.username || '',
        user.email || '',
        user.status || '',
        user.createdAt ? new Date(user.createdAt).toLocaleString() : '',
        user.lastLogin ? new Date(user.lastLogin).toLocaleString() : ''
      ]);
    });
    const csv = rows.map(row => row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users_export.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  async function handleUserSaveRequest(payload, internalId) {
    try {
      const method = internalId ? 'PUT' : 'POST';
      const endpoint = internalId ? `/api/users/${internalId}` : '/api/users';
      const res = await fetch(endpoint, {
        method,
        headers: getUserRequestHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await loadUsers();
        document.getElementById('userManagementModal')?.classList.remove('open');
        showToast(`User ${internalId ? 'updated' : 'created'} successfully.`);
        return;
      }
      throw new Error('Server rejected user save request');
    } catch (err) {
      await saveUserLocally(payload, internalId);
      document.getElementById('userManagementModal')?.classList.remove('open');
      showToast(`User ${internalId ? 'updated' : 'created'} locally.`);
    }
  }

  function getUserRequestHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('manthena_aqua_jwt');
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async function loadUsers() {
    let users = [];
    try {
      const token = localStorage.getItem('manthena_aqua_jwt');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/users', { headers });
      if (res.ok) {
        users = await res.json();
      } else {
        users = getLocalUsers();
      }
    } catch (err) {
      users = getLocalUsers();
    }

    state.users = (users || []).map(normalizeUserRecord);
    renderUsersTable();
    return state.users;
  }

  function saveUserLocally(payload, internalId) {
    const users = getLocalUsers();
    const normalizedPayload = {
      ...payload,
      role: String(payload.role || 'servant').toLowerCase(),
      status: payload.status || 'active',
      assignedPonds: Array.isArray(payload.assignedPonds) ? payload.assignedPonds : (payload.assignedPonds ? String(payload.assignedPonds).split(',').map(v => v.trim()).filter(Boolean) : [])
    };
    if (internalId) {
      const existingIndex = users.findIndex(user => user._id === internalId || user.userId === internalId);
      if (existingIndex >= 0) {
        users[existingIndex] = {
          ...users[existingIndex],
          ...normalizedPayload,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      const newUser = {
        _id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: normalizedPayload.userId || generateNextLocalUserId(users),
        username: String(normalizedPayload.username || '').toLowerCase().trim(),
        email: String(normalizedPayload.email || '').toLowerCase().trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: '',
        ...normalizedPayload
      };
      users.unshift(newUser);
    }
    setLocalUsers(users);
    state.users = users.map(normalizeUserRecord);
    renderUsersTable();
    return state.users;
  }

  window.AQUA_APP.openUserModal = function(userId) {
    const modal = document.getElementById('userManagementModal');
    const title = modal?.querySelector('.modal-header h3');
    const form = document.getElementById('userManagementForm');
    if (!modal || !form) return;

    const targetUser = userId ? state.users.find(u => u._id === userId || u.userId === userId || u.username === userId) : null;
    if (targetUser) {
      if (title) title.textContent = 'Edit User';
      document.getElementById('userFormInternalId').value = targetUser._id || targetUser.userId || '';
      document.getElementById('userFormUserId').value = targetUser.userId || '';
      document.getElementById('userFormName').value = targetUser.name || '';
      document.getElementById('userFormMobile').value = targetUser.mobileNumber || '';
      document.getElementById('userFormUsername').value = targetUser.username || '';
      document.getElementById('userFormEmail').value = targetUser.email || '';
      document.getElementById('userFormRole').value = targetUser.role || 'servant';
      document.getElementById('userFormAssignedPonds').value = (targetUser.assignedPonds || []).join(', ');
      document.getElementById('userFormPhoto').value = targetUser.profilePhoto || '';
      document.getElementById('userFormStatus').value = targetUser.status || 'active';
      document.getElementById('userFormPassword').value = '';
      document.getElementById('userFormForceChange').checked = Boolean(targetUser.forcePasswordChange);
      document.getElementById('userFormNotes').value = targetUser.accountNotes || '';
    } else {
      if (title) title.textContent = 'Add New User';
      form.reset();
      document.getElementById('userFormInternalId').value = '';
      document.getElementById('userFormStatus').value = 'active';
      document.getElementById('userFormRole').value = 'servant';
    }
    modal.classList.add('open');
  };

  window.AQUA_APP.editUser = function(userId) {
    window.AQUA_APP.openUserModal(userId);
  };

  document.getElementById('userSearchInput')?.addEventListener('input', (e) => {
    state.userFilters.query = e.target.value || '';
    renderUsersTable();
  });

  document.getElementById('userRoleFilter')?.addEventListener('change', (e) => {
    state.userFilters.role = e.target.value;
    renderUsersTable();
  });

  document.getElementById('userStatusFilter')?.addEventListener('change', (e) => {
    state.userFilters.status = e.target.value;
    renderUsersTable();
  });

  document.getElementById('userManagementForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.user?.role !== 'owner') {
      showToast('Only the owner can manage users.', 'error');
      return;
    }

    const internalId = document.getElementById('userFormInternalId').value.trim();
    const userId = document.getElementById('userFormUserId').value.trim();
    const name = document.getElementById('userFormName').value.trim();
    const mobileNumber = document.getElementById('userFormMobile').value.trim();
    const username = document.getElementById('userFormUsername').value.trim();
    const email = document.getElementById('userFormEmail').value.trim();
    const role = document.getElementById('userFormRole').value;
    const assignedPonds = document.getElementById('userFormAssignedPonds').value.split(',').map(v => v.trim()).filter(Boolean);
    const profilePhoto = document.getElementById('userFormPhoto').value.trim();
    const status = document.getElementById('userFormStatus').value;
    const password = document.getElementById('userFormPassword').value.trim();
    const forcePasswordChange = document.getElementById('userFormForceChange').checked;
    const accountNotes = document.getElementById('userFormNotes').value.trim();

    if (!email) {
      showToast('Email is required to save the user.', 'error');
      return;
    }

    if (!name) {
      showToast('Name is required when creating a new user.', 'error');
      return;
    }

    if (!username) {
      showToast('Username is required when creating a new user.', 'error');
      return;
    }

    const payload = {
      userId,
      name,
      email,
      mobileNumber,
      username,
      role,
      assignedPonds,
      profilePhoto,
      forcePasswordChange,
      accountNotes,
      isActive: status === 'active',
      isSuspended: status === 'suspended'
    };

    if (password) payload.password = password;

    try {
      await handleUserSaveRequest(payload, internalId);
    } catch (err) {
      await saveUserLocally(payload, internalId);
      document.getElementById('userManagementModal')?.classList.remove('open');
      showToast(`User ${internalId ? 'updated' : 'created'} locally.`);
    }
  });

  function renderKPIs() {
    const container = document.getElementById('dashboardTopKpiGrid');
    if (!container) return;

    const totalPonds = state.ponds.length;
    const activePonds = state.ponds.filter(p => p.status === 'Active').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = toArray(state.feedLogs).filter(l => l.date === todayStr);
    const totalFeedKg = todayLogs.reduce((sum, l) => sum + (parseFloat(l.feedQtyKg) || 0), 0);

    const totalExpectedFeeds = activePonds * 4;
    const completedFeeds = todayLogs.length;
    const feedCompletionRate = totalExpectedFeeds > 0 ? Math.round((completedFeeds / totalExpectedFeeds) * 100) : 0;
    const pendingFeeds = Math.max(0, totalExpectedFeeds - completedFeeds);

    const cards = [
      { title: 'Total Ponds', value: totalPonds, subtitle: 'Registered ponds' },
      { title: 'Active Ponds', value: `${activePonds} Active`, subtitle: 'Currently active' },
      { title: 'Feed Given Today', value: `${totalFeedKg.toFixed(1)} KG`, subtitle: 'Servant submissions' },
      { title: 'Feed Completion', value: `${feedCompletionRate}%`, subtitle: `${pendingFeeds} feeds pending` }
    ];

    container.innerHTML = cards.map(card => `
      <div class="kpi-card emerald">
        <div class="kpi-header">
          <span>${card.title}</span>
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="kpi-value">${card.value}</div>
        <div class="kpi-subtitle">${card.subtitle}</div>
      </div>
    `).join('');
  }

  function renderPondGridOrTable() {
    const gridContainer = document.getElementById('pondsGridContainer');
    const tableContainer = document.getElementById('pondsTableContainer');
    if (!gridContainer || !tableContainer) return;

    const filteredPonds = state.ponds.filter(p => {
      const pId = p.pondId || p.id;
      const matchesSearch = pId.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
                            p.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                            (p.supervisor && p.supervisor.toLowerCase().includes(state.searchQuery.toLowerCase()));
      const matchesStatus = state.statusFilter === 'all' || p.status.toLowerCase() === state.statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });

    const todayStr = new Date().toISOString().split('T')[0];

    gridContainer.innerHTML = filteredPonds.map(p => {
      const pid = p.pondId || p.id;
      const todayLogs = toArray(state.feedLogs).filter(l => l.pondId === pid && l.date === todayStr);
      
      const slotHtml = FEED_SLOTS.map(slot => {
        const log = todayLogs.find(l => l.slot === slot.time);
        return log 
          ? `<div class="feed-slot-box done"><span class="time-label">${slot.time.split(' ')[0]}</span><span class="qty-label">${log.feedQtyKg}kg</span></div>`
          : `<div class="feed-slot-box pending"><span class="time-label">${slot.time.split(' ')[0]}</span><span class="qty-label">Pending</span></div>`;
      }).join('');

      return `
        <div class="pond-card" onclick="window.AQUA_APP.openPondDetails('${pid}')">
          <div class="pond-card-header">
            <div>
              <span class="pond-id-badge">${pid}</span>
              <div class="pond-title-group" style="margin-top:0.3rem;">
                <h3>${p.name}</h3>
                <span class="pond-size"><i class="fas fa-ruler-combined"></i> ${p.size} Acres</span>
              </div>
            </div>
            <span class="status-pill ${p.status.toLowerCase()}">
              <i class="fas fa-circle" style="font-size:0.5rem;"></i> ${p.status}
            </span>
          </div>

          <div class="pond-details-body">
            <div class="detail-item">
              <span class="detail-label">DOC (Days)</span>
              <span class="detail-val doc-highlight">DOC ${p.doc}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Stocking Date</span>
              <span class="detail-val">${p.stockingDate || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Supervisor</span>
              <span class="detail-val">${p.supervisor || 'Unassigned'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Servant</span>
              <span class="detail-val">${p.servant || 'Unassigned'}</span>
            </div>
          </div>

          <div class="feed-schedule-row">
            <div class="feed-schedule-header">
              <span>Today's Feeding Schedule</span>
              <span>${todayLogs.length}/4 Done</span>
            </div>
            <div class="feed-slots-grid">${slotHtml}</div>
          </div>

          <div class="pond-card-actions" onclick="event.stopPropagation();">
            <button class="btn btn-secondary btn-sm" onclick="window.AQUA_APP.openPondDetails('${pid}')"><i class="fas fa-chart-line"></i> Details</button>
            <button class="btn btn-secondary btn-sm owner-only" onclick="window.AQUA_APP.editPond('${pid}')"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-danger btn-sm owner-only" onclick="window.AQUA_APP.deletePond('${pid}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');

    const tableBody = document.getElementById('pondsTableBody');
    if (tableBody) {
      tableBody.innerHTML = filteredPonds.map(p => {
        const pid = p.pondId || p.id;
        const todayLogs = toArray(state.feedLogs).filter(l => l.pondId === pid && l.date === todayStr);
        const totalFeed = todayLogs.reduce((sum, l) => sum + (parseFloat(l.feedQtyKg) || 0), 0);
        return `
          <tr>
            <td><strong class="pond-id-badge">${pid}</strong></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.size} Acres</td>
            <td><span class="doc-highlight">DOC ${p.doc}</span></td>
            <td><span class="status-pill ${p.status.toLowerCase()}">${p.status}</span></td>
            <td>${p.supervisor || 'Unassigned'}</td>
            <td>${p.servant || 'Unassigned'}</td>
            <td><strong>${totalFeed} KG</strong> (${todayLogs.length}/4)</td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="window.AQUA_APP.openPondDetails('${pid}')">View</button>
              <button class="btn btn-secondary btn-sm owner-only" onclick="window.AQUA_APP.editPond('${pid}')">Edit</button>
              <button class="btn btn-danger btn-sm owner-only" onclick="window.AQUA_APP.deletePond('${pid}')">Delete</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (state.viewMode === 'grid') {
      gridContainer.style.display = 'grid';
      tableContainer.style.display = 'none';
    } else {
      gridContainer.style.display = 'none';
      tableContainer.style.display = 'block';
    }
  }

  function renderServantPonds() {
    const grid = document.getElementById('servantPondsGrid');
    if (!grid) return;

    const searchQuery = (document.getElementById('servantPondSearch')?.value || '').toLowerCase().trim();
    const onlyAssigned = document.getElementById('servantOnlyAssigned')?.checked;

    const filtered = state.ponds.filter(p => {
      const normalizedStatus = String(p.status || '').trim().toLowerCase();
      if (!['active', 'ready', 'running'].includes(normalizedStatus)) return false;

      const pid = (p.pondId || p.id || '').toString();
      const name = (p.name || '').toString();
      const matchesSearch = pid.toLowerCase().includes(searchQuery) || name.toLowerCase().includes(searchQuery);

      let matchesAssignment = true;
      if (onlyAssigned && state.user) {
        const role = (state.user.role || '').toLowerCase();
        if (role === 'owner' || role === 'supervisor') {
          matchesAssignment = true;
        } else {
          const userTokens = [state.user.username, state.user.name]
            .map(value => String(value || '').trim().toLowerCase())
            .filter(Boolean);
          const servantText = String(p.servant || '').trim().toLowerCase();
          const supervisorText = String(p.supervisor || '').trim().toLowerCase();
          matchesAssignment = userTokens.some(token => {
            return servantText === token || servantText.includes(token) || supervisorText === token || supervisorText.includes(token);
          });
        }
      }

      return matchesSearch && matchesAssignment;
    });

    if (!filtered.length) {
      const fallback = state.ponds.filter(p => {
        const normalizedStatus = String(p.status || '').trim().toLowerCase();
        if (!['active', 'ready', 'running'].includes(normalizedStatus)) return false;

        if (onlyAssigned && state.user) {
          const role = (state.user.role || '').toLowerCase();
          if (role === 'owner' || role === 'supervisor') return true;
          const userTokens = [state.user.username, state.user.name]
            .map(value => String(value || '').trim().toLowerCase())
            .filter(Boolean);
          const servantText = String(p.servant || '').trim().toLowerCase();
          const supervisorText = String(p.supervisor || '').trim().toLowerCase();
          return userTokens.some(token => servantText === token || servantText.includes(token) || supervisorText === token || supervisorText.includes(token));
        }

        return true;
      });
      const displayList = fallback.length ? fallback : state.ponds;
      if (!displayList.length) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No active ponds available.</div>`;
        return;
      }
      const fallbackHtml = displayList.map(p => {
        const pid = p.pondId || p.id;
        return `
          <div class="pond-card" onclick="window.AQUA_APP.selectServantPond('${pid}')" style="border-color: rgba(255,255,255,0.08);">
            <div class="pond-card-header">
              <div>
                <span class="pond-id-badge">${pid}</span>
                <div class="pond-title-group" style="margin-top:0.3rem;">
                  <h3>${p.name}</h3>
                  <span class="pond-size"><i class="fas fa-ruler-combined"></i> ${p.size} Acres</span>
                </div>
              </div>
            </div>
            <div class="pond-details-body" style="margin-bottom:0;">
              <div class="detail-item">
                <span class="detail-label">DOC (Days)</span>
                <span class="detail-val doc-highlight">DOC ${p.doc}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Assigned Servant</span>
                <span class="detail-val">${p.servant || 'Unassigned'}</span>
              </div>
            </div>
            <div style="margin-top:0.85rem; text-align:right;">
              <span style="font-size:0.8rem; color:var(--primary); font-weight:600;">Open Console <i class="fas fa-arrow-right"></i></span>
            </div>
          </div>
        `;
      }).join('');
      grid.innerHTML = fallbackHtml;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const pid = p.pondId || p.id;
      return `
        <div class="pond-card" onclick="window.AQUA_APP.selectServantPond('${pid}')" style="border-color: rgba(255,255,255,0.08);">
          <div class="pond-card-header">
            <div>
              <span class="pond-id-badge">${pid}</span>
              <div class="pond-title-group" style="margin-top:0.3rem;">
                <h3>${p.name}</h3>
                <span class="pond-size"><i class="fas fa-ruler-combined"></i> ${p.size} Acres</span>
              </div>
            </div>
          </div>
          <div class="pond-details-body" style="margin-bottom:0;">
            <div class="detail-item">
              <span class="detail-label">DOC (Days)</span>
              <span class="detail-val doc-highlight">DOC ${p.doc}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Assigned Servant</span>
              <span class="detail-val">${p.servant || 'Unassigned'}</span>
            </div>
          </div>
          <div style="margin-top:0.85rem; text-align:right;">
            <span style="font-size:0.8rem; color:var(--primary); font-weight:600;">Open Console <i class="fas fa-arrow-right"></i></span>
          </div>
        </div>
      `;
    }).join('');
  }

  window.AQUA_APP.selectServantPond = function(pondId) {
    const pond = state.ponds.find(p => (p.pondId || p.id) === pondId);
    if (!pond) return;

    state.selectedPondId = pondId;

    // Hide selection UI
    document.getElementById('servantPondsGrid').style.display = 'none';
    const filterBars = document.querySelectorAll('#tab-servant-feeding .filter-bar');
    filterBars.forEach(b => b.style.display = 'none');

    // Show operations console
    document.getElementById('servantOperationsConsole').style.display = 'block';

    // Populate pond info
    const pid = pond.pondId || pond.id;
    document.getElementById('servantActivePondId').textContent = pid;
    document.getElementById('servantActivePondName').textContent = pond.name;
    document.getElementById('servantActivePondDetails').textContent = `Size: ${pond.size} Acres | DOC ${pond.doc} | Stocking Date: ${pond.stockingDate || 'N/A'}`;

    // Fill form name
    const servantNameInput = document.getElementById('servantNameInput');
    if (servantNameInput) {
      servantNameInput.value = state.user ? state.user.name : pond.servant;
    }

    // Refresh metrics & logs
    // Load per-pond saved panel data then render panels and logs
    loadServantPanelDataForPond(pondId).then(async () => {
      renderServantQuickParameters(pondId);
      renderServantHistoryLogs(pondId);
      renderServantOperationalPanels();
      renderServantExpenseSection();
      const expensePondSelect = document.getElementById('expensePondSelect');
      if (expensePondSelect) {
        expensePondSelect.value = pondId;
      }
    });
  };

  window.AQUA_APP.clearServantSelection = function() {
    state.selectedPondId = null;
    document.getElementById('servantOperationsConsole').style.display = 'none';
    document.getElementById('servantPondsGrid').style.display = 'grid';
    const filterBars = document.querySelectorAll('#tab-servant-feeding .filter-bar');
    filterBars.forEach(b => b.style.display = 'flex');
    renderServantPonds();
  };

  function renderOwnerQuickEntries() {
    const rowsBody = document.getElementById('ownerQuickEntriesTableBody');
    if (!rowsBody) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const rows = toArray(state.feedLogs).filter(log => log.date === todayStr).map(log => {
      const pond = state.ponds.find(p => (p.pondId || p.id) === log.pondId) || {};
      const water = toArray(state.waterLogs).filter(w => w.pondId === log.pondId && w.date === todayStr).slice(-1)[0] || {};
      const mortality = toArray(state.mortalityLogs).filter(m => m.pondId === log.pondId && m.date === todayStr).reduce((sum, item) => sum + (parseInt(item.count, 10) || 0), 0);
      return `<tr>
        <td>${pond.pondId || pond.id || log.pondId}</td>
        <td>${log.date}</td>
        <td>${log.feedQtyKg || 0} KG</td>
        <td>${water.ph || '-'} pH / ${water.do || '-'} DO</td>
        <td>${mortality}</td>
        <td><button class="btn btn-secondary btn-sm" type="button" onclick="window.AQUA_APP.editOwnerEntry('${log.pondId}')"><i class="fas fa-edit"></i></button></td>
      </tr>`;
    });
    rowsBody.innerHTML = rows.length ? rows.join('') : `<tr><td colspan="6" style="text-align:center; padding:1rem; color:var(--text-dim);">No entries today yet.</td></tr>`;
  }

  window.AQUA_APP.editOwnerEntry = function(pondId) {
    const latestFeed = toArray(state.feedLogs).filter(log => log.pondId === pondId).slice(-1)[0];
    const latestWater = toArray(state.waterLogs).filter(log => log.pondId === pondId).slice(-1)[0];
    const latestMortality = toArray(state.mortalityLogs).filter(log => log.pondId === pondId).slice(-1)[0];
    const pondSelect = document.getElementById('ownerQuickPondSelect');
    if (pondSelect) pondSelect.value = pondId;
    const feedInput = document.getElementById('ownerQuickFeedInput');
    if (feedInput) feedInput.value = latestFeed?.feedQtyKg || '';
    const phInput = document.getElementById('ownerQuickPhInput');
    if (phInput) phInput.value = latestWater?.ph || '7.8';
    const doInput = document.getElementById('ownerQuickDoInput');
    if (doInput) doInput.value = latestWater?.do || '6.0';
    const tempInput = document.getElementById('ownerQuickTempInput');
    if (tempInput) tempInput.value = latestWater?.temperature || '28.5';
    const mortalityInput = document.getElementById('ownerQuickMortalityInput');
    if (mortalityInput) mortalityInput.value = latestMortality?.count || '0';
    const remarksInput = document.getElementById('ownerQuickRemarksInput');
    if (remarksInput) remarksInput.value = latestFeed?.notes || latestWater?.notes || latestMortality?.notes || '';
    state.currentQuickEntryId = pondId;
    showToast('Owner quick entry loaded for editing.');
  };

  function renderServantQuickParameters(pondId) {
    const container = document.getElementById('servantQuickParameters');
    if (!container) return;

    // Get last Water Quality log
    const pondWaterLogs = toArray(state.waterLogs).filter(w => w.pondId === pondId);
    const lastWQ = pondWaterLogs.length ? pondWaterLogs[pondWaterLogs.length - 1] : null;

    if (!lastWQ) {
      container.innerHTML = `
        <div style="grid-column:1/-1; background:rgba(255,255,255,0.02); padding:0.65rem; border-radius:var(--radius-sm); font-size:0.8rem; text-align:center; color:var(--text-dim);">
          No water quality entries logged yet for this pond.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-light); border-radius:var(--radius-sm); padding:0.5rem; text-align:center;">
        <span class="detail-label">pH Level</span>
        <div class="wq-badge ${getWaterParamStatus('ph', lastWQ.ph).className}" style="margin-top:0.25rem;">${lastWQ.ph} pH</div>
      </div>
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-light); border-radius:var(--radius-sm); padding:0.5rem; text-align:center;">
        <span class="detail-label">Oxygen (DO)</span>
        <div class="wq-badge ${getWaterParamStatus('do', lastWQ.do).className}" style="margin-top:0.25rem;">${lastWQ.do} ppm</div>
      </div>
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-light); border-radius:var(--radius-sm); padding:0.5rem; text-align:center;">
        <span class="detail-label">Salinity</span>
        <div class="wq-badge wq-optimal" style="margin-top:0.25rem;">${lastWQ.salinity} ppt</div>
      </div>
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-light); border-radius:var(--radius-sm); padding:0.5rem; text-align:center;">
        <span class="detail-label">Temperature</span>
        <div class="wq-badge wq-optimal" style="margin-top:0.25rem;">${lastWQ.temperature} °C</div>
      </div>
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-light); border-radius:var(--radius-sm); padding:0.5rem; text-align:center;">
        <span class="detail-label">Ammonia</span>
        <div class="wq-badge ${getWaterParamStatus('ammonia', lastWQ.ammonia).className}" style="margin-top:0.25rem;">${lastWQ.ammonia ?? 0} mg/L</div>
      </div>
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-light); border-radius:var(--radius-sm); padding:0.5rem; text-align:center;">
        <span class="detail-label">Nitrate</span>
        <div class="wq-badge ${getWaterParamStatus('nitrate', lastWQ.nitrate).className}" style="margin-top:0.25rem;">${lastWQ.nitrate ?? 0} mg/L</div>
      </div>
    `;
  }

  function renderServantHistoryLogs(pondId) {
    const feedBody = document.getElementById('servantPondFeedHistory');
    const waterBody = document.getElementById('servantPondWaterHistory');

    if (feedBody) {
      const pondFeedLogs = toArray(state.feedLogs).filter(l => l.pondId === pondId).slice(-5).reverse();
      feedBody.innerHTML = pondFeedLogs.length ? pondFeedLogs.map(l => `
        <tr>
          <td><strong>${l.slot}</strong></td>
          <td>${l.feedQtyKg} KG</td>
          <td><span class="wq-badge wq-optimal">${l.consumptionStatus || '100%'}</span></td>
        </tr>
      `).join('') : `<tr><td colspan="3" style="text-align:center; padding:1rem; color:var(--text-dim);">No feeds logged.</td></tr>`;
    }

    if (waterBody) {
      const pondWaterLogs = toArray(state.waterLogs).filter(w => w.pondId === pondId).slice(-5).reverse();
      waterBody.innerHTML = pondWaterLogs.length ? pondWaterLogs.map(w => `
        <tr>
          <td>${w.date}</td>
          <td>${w.ph}</td>
          <td>${w.do} ppm</td>
          <td>${w.temperature}°C</td>
          <td><span class="wq-badge ${getWaterParamStatus('ammonia', w.ammonia).className}">${w.ammonia ?? 0} mg/L</span></td>
          <td><span class="wq-badge ${getWaterParamStatus('nitrate', w.nitrate).className}">${w.nitrate ?? 0} mg/L</span></td>
        </tr>
      `).join('') : `<tr><td colspan="6" style="text-align:center; padding:1rem; color:var(--text-dim);">No water logs.</td></tr>`;
    }
  }

  async function submitServantFeedEntry(e) {
    e.preventDefault();
    const pondId = state.selectedPondId;
    if (!pondId) return;

    const feedQtyKg = parseFloat(document.getElementById('servantFeedQty').value);
    const feedType = document.getElementById('servantFeedType').value;
    const servantName = document.getElementById('servantNameInput').value || 'Ramu';
    const notes = document.getElementById('servantNotes').value;

    if (isNaN(feedQtyKg) || feedQtyKg <= 0) {
      showToast('Please enter a valid Feed Quantity (KG)', 'error');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newLog = {
      id: state.currentFeedEditId || `fl_${Date.now()}`,
      pondId: pondId,
      date: todayStr,
      slot: state.selectedFeedSlot,
      feedQtyKg: feedQtyKg,
      feedType: feedType,
      servant: servantName,
      timestamp: timeNow,
      checkTime: '08:30 AM',
      consumptionStatus: state.selectedConsumption,
      notes: notes
    };

    try {
      await apiFetch('/api/feed-logs', {
        method: 'POST',
        body: JSON.stringify(newLog)
      });
    } catch(e) {}

    await window.AQUA_STORAGE.saveFeedLog(newLog);
    showToast(`Feed update recorded for ${pondId} (${state.selectedFeedSlot}: ${feedQtyKg} KG)`);
    
    document.getElementById('servantFeedQty').value = '';
    document.getElementById('servantNotes').value = '';
    state.currentFeedEditId = null;
    await loadData();
    renderServantHistoryLogs(pondId);
  }

  async function submitServantExpenseEntry(e) {
    e.preventDefault();
    const date = document.getElementById('expenseDateInput')?.value;
    const pondNumber = document.getElementById('expensePondSelect')?.value || state.selectedPondId || 'All';
    const category = document.getElementById('expenseCategorySelect')?.value;
    const description = document.getElementById('expenseDescriptionInput')?.value.trim();
    const amount = parseFloat(document.getElementById('expenseAmountInput')?.value || '0');
    const notes = document.getElementById('expenseNotesInput')?.value.trim();
    if (!date || !pondNumber || !category || !description || isNaN(amount) || amount < 0) {
      showToast('Please fill in all expense fields correctly.', 'error');
      return;
    }

    const expense = {
      expenseId: `exp_${Date.now()}`,
      date,
      pondNumber,
      category,
      description,
      amount,
      notes,
      status: 'pending',
      addedBy: state.user?.name || 'Servant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await window.AQUA_STORAGE.saveExpense(expense);
    document.getElementById('servantExpenseForm')?.reset();
    document.getElementById('servantExpenseFormMsg').textContent = 'Saved';
    await loadData();
    refreshExpenseViews();
    showToast('Expense recorded successfully.', 'success');
  }

  function getWaterParamStatus(param, value) {
    const safeValue = Number.isFinite(value) ? value : 0;
    if (param === 'ph') {
      return safeValue >= 7.5 && safeValue <= 8.5 ? { className: 'wq-optimal' } : safeValue < 7.0 || safeValue > 8.8 ? { className: 'wq-danger' } : { className: 'wq-warning' };
    }
    if (param === 'do') {
      return safeValue >= 4.0 ? { className: 'wq-optimal' } : safeValue >= 3.0 ? { className: 'wq-warning' } : { className: 'wq-danger' };
    }
    if (param === 'ammonia') {
      return safeValue <= 0.05 ? { className: 'wq-optimal' } : safeValue <= 0.1 ? { className: 'wq-warning' } : { className: 'wq-danger' };
    }
    if (param === 'nitrate') {
      return safeValue <= 5.0 ? { className: 'wq-optimal' } : safeValue <= 8.0 ? { className: 'wq-warning' } : { className: 'wq-danger' };
    }
    return { className: 'wq-optimal' };
  }

  async function submitServantWQEntry(e) {
    e.preventDefault();
    const pondId = state.selectedPondId;
    if (!pondId) return;

    const ph = parseFloat(document.getElementById('servantPhInput').value);
    const doVal = parseFloat(document.getElementById('servantDoInput').value);
    const salinity = parseFloat(document.getElementById('servantSalinityInput').value);
    const temp = parseFloat(document.getElementById('servantTempInput').value);
    const trans = parseFloat(document.getElementById('servantTransInput').value);
    const ammonia = parseFloat(document.getElementById('servantAmmoniaInput').value);
    const nitrate = parseFloat(document.getElementById('servantNitrateInput').value);

    const newWq = {
      id: state.currentWaterEditId || `wq_${Date.now()}`,
      pondId: pondId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ph: ph,
      do: doVal,
      salinity: salinity,
      temperature: temp,
      transparency: trans,
      ammonia: ammonia,
      nitrate: nitrate,
      enteredBy: state.user ? state.user.name : 'Servant'
    };

    try {
      await apiFetch('/api/water-logs', {
        method: 'POST',
        body: JSON.stringify(newWq)
      });
    } catch(e) {}

    await window.AQUA_STORAGE.saveWaterLog(newWq);
    showToast(`Water quality log saved for ${pondId}`);
    state.currentWaterEditId = null;
    await loadData();
    renderServantQuickParameters(pondId);
    renderServantHistoryLogs(pondId);
  }

  async function submitWQEntry(e) {
    e.preventDefault();
    const pondId = document.getElementById('wqPondSelect').value;
    if (!pondId) return;

    const payload = {
      pondId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ph: parseFloat(document.getElementById('wqPhInput').value),
      do: parseFloat(document.getElementById('wqDoInput').value),
      salinity: parseFloat(document.getElementById('wqSalinityInput').value),
      temperature: parseFloat(document.getElementById('wqTempInput').value),
      transparency: parseFloat(document.getElementById('wqTransInput').value),
      ammonia: parseFloat(document.getElementById('wqAmmoniaInput').value),
      nitrate: parseFloat(document.getElementById('wqNitrateInput').value),
      enteredBy: state.user ? state.user.name : 'Supervisor'
    };

    try {
      await apiFetch('/api/water-logs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (e) {}

    await window.AQUA_STORAGE.saveWaterLog(payload);
    showToast(`Water quality log saved for ${pondId}`);
    document.getElementById('wqModal').classList.remove('open');
    await loadData();
  }

  async function submitServantGrowthEntry(e) {
    e.preventDefault();
    const pondId = state.selectedPondId;
    if (!pondId) return;

    const pond = state.ponds.find(p => (p.pondId || p.id) === pondId);
    const abw = parseFloat(document.getElementById('servantAbwInput').value);
    const survivalRate = parseFloat(document.getElementById('servantSurvivalRate').value);
    const weeklyGrowth = parseFloat(document.getElementById('servantWeeklyGrowth').value);

    if (isNaN(abw) || isNaN(survivalRate)) return;

    // Calculate biomass
    const initialStock = pond ? (pond.initialStock || 400000) : 400000;
    const currentSurvivalCount = initialStock * (survivalRate / 100);
    const calculatedBiomassKg = Math.round((currentSurvivalCount * abw) / 1000);

    const newGr = {
      id: state.currentGrowthEditId || `gr_${Date.now()}`,
      pondId: pondId,
      doc: pond ? pond.doc : 60,
      abw: abw,
      weeklyGrowth: weeklyGrowth,
      survivalRate: survivalRate,
      calculatedBiomassKg: calculatedBiomassKg,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      await apiFetch('/api/growth-logs', {
        method: 'POST',
        body: JSON.stringify(newGr)
      });
    } catch(e) {}

    await window.AQUA_STORAGE.saveGrowthLog(newGr);
    showToast(`Shrimp growth sampling recorded for ${pondId}`);
    state.currentGrowthEditId = null;
    await loadData();
  }

  async function submitServantMortalityEntry(e) {
    e.preventDefault();
    const pondId = state.selectedPondId;
    if (!pondId) return;

    const count = parseInt(document.getElementById('servantMortalityCount').value, 10);
    const cause = document.getElementById('servantMortalityCause').value;
    const notes = document.getElementById('servantMortalityNotes').value;

    if (isNaN(count) || count < 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newMort = {
      id: state.currentMortalityEditId || `mort_${Date.now()}`,
      pondId,
      date: todayStr,
      count,
      cause,
      notes,
      enteredBy: state.user?.name || 'Servant'
    };

    try {
      await apiFetch('/api/mortality-logs', {
        method: 'POST',
        body: JSON.stringify(newMort)
      });
    } catch (e) {}

    await window.AQUA_STORAGE.saveMortalityLog?.(newMort);
    const pond = state.ponds.find(item => (item.pondId || item.id) === pondId) || {};
    const payload = {
      pondId,
      pondName: pond.name || pondId,
      count,
      cause,
      notes,
      date: new Date().toISOString().split('T')[0],
      enteredBy: state.user?.name || 'Servant',
      createdAt: new Date().toISOString()
    };

    try {
      await apiFetch('/api/mortality-logs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {}

    state.mortalityLogs = [...state.mortalityLogs, payload];
    renderServantOperationalPanels();
    renderOwnerOpsSummary();
    showToast(`Recorded mortality of ${count} shrimp in ${pondId} due to: ${cause}`);

    document.getElementById('servantMortalityCount').value = '';
    document.getElementById('servantMortalityNotes').value = '';
    state.currentMortalityEditId = null;
    await loadData();
  }

  async function submitServantChecklistEntry(e) {
    e.preventDefault();
    const pondId = state.selectedPondId;
    if (!pondId) return;

    const obsText = document.getElementById('servantObsText').value.trim();
    showToast(`Checklist & observation updated for ${pondId}`);
    document.getElementById('servantObsText').value = '';
  }

  async function renderHistoricalDashboard() {
    const ownerPanel = document.getElementById('dashboardHistoryPanel');
    const supervisorPanel = document.getElementById('supervisorHistoryPanel');
    const servantPanel = document.getElementById('servantHistoryPanel');

    const rolePanels = [ownerPanel, supervisorPanel, servantPanel].filter(Boolean);
    if (!rolePanels.length) return;

    const visiblePonds = state.ponds.filter(p => {
      if (!state.user) return true;
      if (state.user.role === 'servant') {
        const userName = (state.user.name || '').toLowerCase();
        const pondServant = (p.servant || '').toLowerCase();
        return pondServant === userName || pondServant.includes(userName);
      }
      return true;
    });

    const assignedPondIds = visiblePonds.map(p => p.pondId || p.id);
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const historyRows = await Promise.all(assignedPondIds.map(async pondId => {
      try {
        const res = await fetch(`/api/history/${pondId}?range=yesterday`);
        if (!res.ok) throw new Error('history failed');
        return res.json();
      } catch (e) {
        return { pondId, feedLogs: [], waterLogs: [], growthLogs: [], mortalityLogs: [] };
      }
    }));

    const buildCard = (pond, data) => {
      const feedQty = data.feedLogs.reduce((sum, item) => sum + (parseFloat(item.feedQtyKg) || 0), 0);
      const waterLog = data.waterLogs[data.waterLogs.length - 1] || null;
      const growthLog = data.growthLogs[data.growthLogs.length - 1] || null;
      const mortalityCount = data.mortalityLogs.reduce((sum, item) => sum + (parseInt(item.count, 10) || 0), 0);
      const todayFeed = toArray(state.feedLogs).filter(l => l.pondId === pond.pondId && l.date === todayStr).reduce((sum, item) => sum + (parseFloat(item.feedQtyKg) || 0), 0);
      const yesterdayFeed = feedQty;
      const feedDiff = todayFeed - yesterdayFeed;
      const waterChange = waterLog ? `${waterLog.ph ? (waterLog.ph - (waterLog.ph || 0)).toFixed(1) : '0.0'}` : 'n/a';
      const growthChange = growthLog ? `${((growthLog.abw || 0) - (growthLog.abw || 0)).toFixed(1)}` : 'n/a';
      return `
        <div class="pond-card" style="padding:1rem;">
          <div class="pond-card-header">
            <div>
              <span class="pond-id-badge">${pond.pondId || pond.id}</span>
              <div class="pond-title-group" style="margin-top:0.3rem;">
                <h3>${pond.name}</h3>
                <span class="pond-size">${pond.servant ? `Assigned: ${pond.servant}` : ''}</span>
              </div>
            </div>
            <span class="status-pill active">${yesterdayStr}</span>
          </div>
          <div class="pond-details-body">
            <div class="detail-item"><span class="detail-label">Yesterday Feed</span><span class="detail-val">${yesterdayFeed.toFixed(1)} KG</span></div>
            <div class="detail-item"><span class="detail-label">Today Feed</span><span class="detail-val">${todayFeed.toFixed(1)} KG</span></div>
            <div class="detail-item"><span class="detail-label">Water Quality</span><span class="detail-val">${waterLog ? `${waterLog.ph} pH / ${waterLog.do} DO / NH${waterLog.ammonia ?? 0} / NO${waterLog.nitrate ?? 0}` : 'No data'}</span></div>
            <div class="detail-item"><span class="detail-label">Growth</span><span class="detail-val">${growthLog ? `${growthLog.abw} g ABW` : 'No data'}</span></div>
            <div class="detail-item"><span class="detail-label">Mortality</span><span class="detail-val">${mortalityCount} shrimp</span></div>
            <div class="detail-item"><span class="detail-label">Remaining Feed</span><span class="detail-val">${Math.max(0, 120 - yesterdayFeed).toFixed(0)} bags</span></div>
          </div>
          <div class="feed-schedule-row">
            <div class="feed-schedule-header"><span>Compare Today vs Yesterday</span><span>${feedDiff >= 0 ? '+' : ''}${feedDiff.toFixed(1)} KG</span></div>
            <div class="detail-item" style="margin-top:0.65rem;"><span class="detail-label">Water / Growth / Mortality</span><span class="detail-val">Δ pH ${waterChange} • Δ ABW ${growthChange} • Δ Mortality ${mortalityCount}</span></div>
          </div>
        </div>
      `;
    };

    const html = visiblePonds.map(pond => {
      const data = historyRows.find(entry => entry.pondId === (pond.pondId || pond.id)) || { feedLogs: [], waterLogs: [], growthLogs: [], mortalityLogs: [] };
      return buildCard(pond, data);
    }).join('');

    if (ownerPanel) ownerPanel.innerHTML = `
      <div class="page-header" style="margin-bottom:1rem;">
        <div class="page-title">
          <h3><i class="fas fa-history" style="color:var(--primary);"></i> Historical Data & Yesterday View</h3>
          <p>Track yesterday, last 7 days, last 30 days, and compare today against previous day values.</p>
        </div>
        <div class="filter-group">
          <select id="historyRangeSelect" class="filter-select">
            <option value="today">Today</option>
            <option value="yesterday" selected>Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="custom">Custom Date</option>
          </select>
          <input type="date" id="historyStartDate" class="filter-select" style="min-width: 150px; display:none;">
          <input type="date" id="historyEndDate" class="filter-select" style="min-width: 150px; display:none;">
        </div>
      </div>
      <div class="ponds-grid">${html || '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No historical data available yet.</div>'}</div>
    `;

    if (supervisorPanel) supervisorPanel.innerHTML = ownerPanel.innerHTML;
    if (servantPanel) servantPanel.innerHTML = ownerPanel.innerHTML;

    document.getElementById('historyRangeSelect')?.addEventListener('change', async (e) => {
      const range = e.target.value;
      const start = document.getElementById('historyStartDate');
      const end = document.getElementById('historyEndDate');
      if (start && end) {
        start.style.display = range === 'custom' ? 'inline-block' : 'none';
        end.style.display = range === 'custom' ? 'inline-block' : 'none';
      }
      await refreshHistoryPanel(range, start?.value, end?.value);
    });

    document.getElementById('historyStartDate')?.addEventListener('change', () => refreshHistoryPanel('custom', document.getElementById('historyStartDate').value, document.getElementById('historyEndDate').value));
    document.getElementById('historyEndDate')?.addEventListener('change', () => refreshHistoryPanel('custom', document.getElementById('historyStartDate').value, document.getElementById('historyEndDate').value));
  }

  async function refreshHistoryPanel(range, startDate, endDate) {
    const panel = document.getElementById('dashboardHistoryPanel') || document.getElementById('supervisorHistoryPanel') || document.getElementById('servantHistoryPanel');
    if (!panel) return;
    const visiblePonds = state.ponds.filter(p => {
      if (!state.user) return true;
      if (state.user.role === 'servant') {
        const userName = (state.user.name || '').toLowerCase();
        const pondServant = (p.servant || '').toLowerCase();
        return pondServant === userName || pondServant.includes(userName);
      }
      return true;
    });

    const rows = await Promise.all(visiblePonds.map(async pond => {
      try {
        const qs = new URLSearchParams({ range, startDate: startDate || '', endDate: endDate || '' });
        const res = await fetch(`/api/history/${pond.pondId || pond.id}?${qs.toString()}`);
        if (!res.ok) throw new Error('history failed');
        return res.json();
      } catch (e) {
        return { pondId: pond.pondId || pond.id, feedLogs: [], waterLogs: [], growthLogs: [], mortalityLogs: [] };
      }
    }));

    const cards = rows.map(entry => {
      const pond = visiblePonds.find(p => (p.pondId || p.id) === entry.pondId);
      if (!pond) return '';
      const feedQty = entry.feedLogs.reduce((sum, item) => sum + (parseFloat(item.feedQtyKg) || 0), 0);
      const waterLog = entry.waterLogs[entry.waterLogs.length - 1] || null;
      const growthLog = entry.growthLogs[entry.growthLogs.length - 1] || null;
      const mortalityCount = entry.mortalityLogs.reduce((sum, item) => sum + (parseInt(item.count, 10) || 0), 0);
      return `
        <div class="pond-card" style="padding:1rem;">
          <div class="pond-card-header">
            <div>
              <span class="pond-id-badge">${pond.pondId || pond.id}</span>
              <div class="pond-title-group" style="margin-top:0.3rem;">
                <h3>${pond.name}</h3>
                <span class="pond-size">${pond.servant || ''}</span>
              </div>
            </div>
            <span class="status-pill active">${range}</span>
          </div>
          <div class="pond-details-body">
            <div class="detail-item"><span class="detail-label">Feed Given</span><span class="detail-val">${feedQty.toFixed(1)} KG</span></div>
            <div class="detail-item"><span class="detail-label">Water Quality</span><span class="detail-val">${waterLog ? `${waterLog.ph} pH / ${waterLog.do} DO / NH${waterLog.ammonia ?? 0} / NO${waterLog.nitrate ?? 0}` : 'No data'}</span></div>
            <div class="detail-item"><span class="detail-label">Growth (ABW)</span><span class="detail-val">${growthLog ? `${growthLog.abw} g` : 'No data'}</span></div>
            <div class="detail-item"><span class="detail-label">Mortality</span><span class="detail-val">${mortalityCount} shrimp</span></div>
            <div class="detail-item"><span class="detail-label">Remaining Feed</span><span class="detail-val">${Math.max(0, 120 - feedQty).toFixed(0)} bags</span></div>
            <div class="detail-item"><span class="detail-label">Period</span><span class="detail-val">${range}</span></div>
          </div>
        </div>
      `;
    }).join('');

    panel.innerHTML = `
      <div class="page-header" style="margin-bottom:1rem;">
        <div class="page-title">
          <h3><i class="fas fa-history" style="color:var(--primary);"></i> Historical Data & Yesterday View</h3>
          <p>View today, yesterday, this week, this month or custom-range records.</p>
        </div>
      </div>
      <div class="ponds-grid">${cards || '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No records available for this period.</div>'}</div>
    `;
  }

  function renderSupervisorDashboard() {
    const container = document.getElementById('supervisorFeedActivity');
    if (!container) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = toArray(state.feedLogs).filter(l => l.date === todayStr);

    if (!todayLogs.length) {
      container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:1.5rem;">No feeds logged yet for today.</p>`;
      return;
    }

    container.innerHTML = todayLogs.map(l => {
      const pond = state.ponds.find(p => (p.pondId || p.id) === l.pondId) || { name: l.pondId };
      return `
        <div style="background:var(--bg-card); border:1px solid var(--border-light); padding:1rem; border-radius:var(--radius-md); margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <strong style="color:var(--primary);">${l.pondId} - ${pond.name}</strong> 
            <span style="font-size:0.8rem; color:var(--text-muted); margin-left:0.5rem;"><i class="far fa-clock"></i> ${l.slot}</span>
            <div style="font-size:0.85rem; margin-top:0.25rem;">
              <strong>${l.feedQtyKg} KG</strong> (${l.feedType}) by <em>${l.servant}</em>
            </div>
          </div>
          <div>
            <span class="wq-badge ${l.consumptionStatus && l.consumptionStatus.includes('100%') ? 'wq-optimal' : 'wq-warning'}">
              ${l.consumptionStatus || '100% Consumed'}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderStockManagement() {
    const container = document.getElementById('stockGridContainer');
    if (!container) return;

    container.innerHTML = state.feedStock.map(s => {
      const isLow = s.bagsInStock <= s.alertLevelBags;
      return `
        <div class="kpi-card ${isLow ? 'rose' : 'emerald'}">
          <div class="kpi-header">
            <span>${s.brand}</span>
            <i class="fas fa-boxes kpi-icon"></i>
          </div>
          <div style="font-weight:700; font-size:1.1rem; color:var(--text-main);">${s.code}</div>
          <div class="kpi-value" style="margin-top:0.5rem;">${s.bagsInStock} <span style="font-size:1rem; font-weight:500;">Bags</span></div>
          <div class="kpi-subtitle">${s.bagsInStock * s.kgPerBag} Total KG</div>
        </div>
      `;
    }).join('');
  }

  async function renderServantOperationalPanels() {
    const servantSummary = document.getElementById('servantSummaryCards');
    const aeratorPanel = document.getElementById('servantAeratorPanel');
    const stockPanel = document.getElementById('servantStockPanel');
    const shrimpPanel = document.getElementById('servantShrimpPanel');
    const dailyFeedPanel = document.getElementById('servantDailyFeedSummary');
    if (!servantSummary && !aeratorPanel && !stockPanel && !shrimpPanel && !dailyFeedPanel) return;

    const pondId = state.selectedPondId || (state.ponds[0] && (state.ponds[0].pondId || state.ponds[0].id));
    const todayFeedLogs = toArray(state.feedLogs).filter(log => log.date === new Date().toISOString().split('T')[0]);
    const todayFeed = todayFeedLogs.reduce((sum, log) => sum + (parseFloat(log.feedQtyKg) || 0), 0);
    const savedPanel = pondId ? await window.AQUA_STORAGE.getServantPanelData(pondId) : null;

    const defaults = {
      feedStockTotal: 500,
      feedAddedToday: 0,
      feedUsedToday: todayFeed,
      aeratorTotal: 6,
      aeratorRunning: 5,
      shrimpInitial: 400000,
      mortalityCount: toArray(state.mortalityLogs).reduce((sum, item) => sum + (parseInt(item.count || item.mortalityCount || 0, 10) || 0), 0)
    };

    const panel = Object.assign({}, defaults, savedPanel || {});
    panel.feedRemaining = Math.max((Number(panel.feedStockTotal) || 0) + (Number(panel.feedAddedToday) || 0) - (Number(panel.feedUsedToday) || 0), 0);
    panel.aeratorStopped = Math.max((Number(panel.aeratorTotal) || 0) - (Number(panel.aeratorRunning) || 0), 0);
    panel.aeratorStatus = panel.aeratorStopped === 0 ? 'ON' : 'WARNING';
    const currentEstimatedCount = Math.max((Number(panel.shrimpInitial) || 0) - (Number(panel.mortalityCount) || 0), 0);
    const survivalPercentage = panel.shrimpInitial ? Math.round((currentEstimatedCount / panel.shrimpInitial) * 100) : 0;

    function kpiCardHtml(title, iconClass, valueHtml, subtitle, key) {
      const editBtn = key ? `<button class="card-edit-btn" data-key="${key}" aria-label="Edit"><i class="fas fa-edit"></i></button>` : '';
      return `<div class="kpi-card"><div class="kpi-header"><span>${title}</span><i class="${iconClass}"></i>${editBtn}</div><div class="kpi-value" data-key-value="${key || ''}">${valueHtml}</div><div class="kpi-subtitle">${subtitle}</div></div>`;
    }

    if (servantSummary) {
      servantSummary.innerHTML = `
        ${kpiCardHtml('Total Feed Stock', 'fas fa-boxes', `${panel.feedStockTotal} KG`, 'Store availability', 'feedStockTotal')}
        ${kpiCardHtml('Remaining Feed Stock', 'fas fa-warehouse', `${panel.feedRemaining} KG`, 'Current reserve', null)}
        ${kpiCardHtml('Running Aerators', 'fas fa-fan', `${panel.aeratorRunning}`, `${panel.aeratorStopped} stopped`, 'aeratorRunning')}
        ${kpiCardHtml('Total Aerators', 'fas fa-fan', `${panel.aeratorTotal}`, 'Installed units', 'aeratorTotal')}
      `;
    }

    if (aeratorPanel) {
      aeratorPanel.innerHTML = `
        ${kpiCardHtml('Total Aerators Installed', 'fas fa-fan', panel.aeratorTotal, 'Installed units', 'aeratorTotal')}
        ${kpiCardHtml('Running Aerators', 'fas fa-power-off', panel.aeratorRunning, 'Operational', 'aeratorRunning')}
        ${kpiCardHtml('Stopped Aerators', 'fas fa-stop-circle', panel.aeratorStopped, 'Needs inspection', null)}
        ${kpiCardHtml('Status', 'fas fa-broadcast-tower', panel.aeratorStatus, panel.aeratorStatus === 'ON' ? 'All aerators normal' : 'Alert raised', null)}
      `;
    }

    if (stockPanel) {
      stockPanel.innerHTML = `
        ${kpiCardHtml('Total Feed Stock Available', 'fas fa-box-open', `${panel.feedStockTotal} KG`, 'Warehouse balance', 'feedStockTotal')}
        ${kpiCardHtml('Feed Added Today', 'fas fa-plus-circle', `${panel.feedAddedToday} KG`, 'Added today', 'feedAddedToday')}
        ${kpiCardHtml('Feed Used Today', 'fas fa-weight-hanging', `${panel.feedUsedToday.toFixed(1)} KG`, 'Today consumption', 'feedUsedToday')}
        ${kpiCardHtml('Remaining Feed Stock', 'fas fa-warehouse', `${panel.feedRemaining} KG`, panel.feedRemaining < 120 ? 'Urgent refill required' : 'Stable reserve', null)}
      `;
    }

    if (shrimpPanel) {
      shrimpPanel.innerHTML = `
        ${kpiCardHtml('Total Shrimp Count', 'fas fa-fish', panel.shrimpInitial, 'Initial stock', 'shrimpInitial')}
        ${kpiCardHtml('Current Estimated Count', 'fas fa-chart-line', currentEstimatedCount, 'After mortality', null)}
        ${kpiCardHtml('Mortality Count', 'fas fa-skull-crossbones', panel.mortalityCount || 0, 'Recorded losses', 'mortalityCount')}
        ${kpiCardHtml('Survival Percentage', 'fas fa-percentage', `${survivalPercentage}%`, 'Live shrimp rate', null)}
      `;
    }

    if (dailyFeedPanel) {
      dailyFeedPanel.innerHTML = `
        ${kpiCardHtml('Total Feed Given Today', 'fas fa-weight-hanging', `${todayFeed.toFixed(1)} KG`, 'Across all ponds', null)}
        ${kpiCardHtml('Feed Entries Today', 'fas fa-water', `${todayFeedLogs.length}`, 'Entries today', null)}
        ${kpiCardHtml('Feeding Time History', 'fas fa-history', `${todayFeedLogs.map(log => log.timestamp).slice(0,3).join(', ') || 'None'}`, 'Recent schedule', null)}
        ${kpiCardHtml('Total Feed Consumption', 'fas fa-chart-bar', `${todayFeed.toFixed(1)} KG`, 'Daily total', null)}
      `;
      renderDailyFeedSummary();
    }
  }

  async function loadServantPanelDataForPond(pondId) {
    if (!pondId) return null;
    const panelKey = `manthena_aqua_panel_${pondId}`;
    const saved = await window.AQUA_STORAGE.getServantPanelData(pondId);
    if (saved) {
      localStorage.setItem(panelKey, JSON.stringify(saved));
      return saved;
    }

    const fallback = JSON.parse(localStorage.getItem(panelKey) || 'null');
    if (fallback) {
      return fallback;
    }

    return null;
  }

  function openInlineCardEditor(card, key) {
    if (!card || !key) return false;
    const valueEl = card.querySelector('.kpi-value');
    if (!valueEl) return false;
    if (card.querySelector('.card-editor')) return false;

    const raw = valueEl.textContent.trim();
    const isNumber = /[0-9]/.test(raw);
    const input = document.createElement('input');
    input.className = 'card-editor';
    input.style.width = '100%';
    input.style.fontSize = '1rem';
    input.style.padding = '6px';
    input.style.boxSizing = 'border-box';
    input.value = raw.replace(/[^0-9.\-]/g, '');
    input.type = isNumber ? 'number' : 'text';
    if (isNumber) input.step = '0.1';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'card-save-btn btn btn-primary';
    saveBtn.style.marginLeft = '0.5rem';
    saveBtn.textContent = 'Save';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'card-cancel-btn btn btn-secondary';
    cancelBtn.style.marginLeft = '0.25rem';
    cancelBtn.textContent = 'Cancel';

    valueEl.dataset.orig = valueEl.innerHTML;
    valueEl.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.appendChild(input);
    wrapper.appendChild(saveBtn);
    wrapper.appendChild(cancelBtn);
    valueEl.appendChild(wrapper);
    input.focus();
    return true;
  }

  function closeInlineCardEditor(card) {
    const valueEl = card && card.querySelector('.kpi-value');
    if (valueEl && valueEl.dataset && valueEl.dataset.orig) {
      valueEl.innerHTML = valueEl.dataset.orig;
      delete valueEl.dataset.orig;
    }
  }

  // Save handlers
  document.addEventListener('click', async (e) => {
    // Inline card edit button clicked
    const editBtn = e.target.closest && e.target.closest('.card-edit-btn');
    if (editBtn) {
      const key = editBtn.getAttribute('data-key');
      const card = editBtn.closest('.kpi-card');
      openInlineCardEditor(card, key);
      return;
    }

    const card = e.target.closest && e.target.closest('.kpi-card');
    if (card && !e.target.closest('.card-save-btn') && !e.target.closest('.card-cancel-btn') && !e.target.closest('.card-edit-btn') && !e.target.closest('button')) {
      const key = card.querySelector('.kpi-header button')?.getAttribute('data-key');
      if (key) {
        openInlineCardEditor(card, key);
        return;
      }
    }

    // Save from inline editor
    const saveInline = e.target.closest && e.target.closest('.card-save-btn');
    if (saveInline) {
      const card = e.target.closest('.kpi-card');
      if (!card) return;
      const key = card.querySelector('.kpi-header button')?.getAttribute('data-key');
      const valueEl = card.querySelector('.kpi-value');
      const input = valueEl && valueEl.querySelector('.card-editor');
      if (!input) return;
      const newValRaw = input.value;
      // validations
      const pondId = state.selectedPondId || (state.ponds[0] && (state.ponds[0].pondId || state.ponds[0].id));
      const panelKey = pondId ? `manthena_aqua_panel_${pondId}` : null;
      const saved = panelKey ? JSON.parse(localStorage.getItem(panelKey) || 'null') : {};
      const numVal = newValRaw === '' ? newValRaw : Number(newValRaw);
      if ((key === 'feedStockTotal' || key === 'feedAddedToday' || key === 'feedUsedToday' || key === 'feedRemaining' || key === 'aeratorTotal' || key === 'aeratorRunning' || key === 'shrimpInitial' || key === 'mortalityCount') && isNaN(numVal)) {
        showToast('Please enter a valid number', 'error');
        return;
      }
      if (panelKey) {
        const panelData = saved || {};
        panelData[key] = (newValRaw === '') ? newValRaw : (isNaN(numVal) ? newValRaw : numVal);
        panelData.feedRemaining = Math.max((Number(panelData.feedStockTotal) || 0) + (Number(panelData.feedAddedToday) || 0) - (Number(panelData.feedUsedToday) || 0), 0);
        panelData.aeratorStopped = Math.max((Number(panelData.aeratorTotal) || 0) - (Number(panelData.aeratorRunning) || 0), 0);
        panelData.aeratorStatus = panelData.aeratorStopped === 0 ? 'ON' : 'WARNING';
        panelData.mortalityCount = Number(panelData.mortalityCount || 0);
        localStorage.setItem(panelKey, JSON.stringify(panelData));
        await window.AQUA_STORAGE.saveServantPanelData(pondId, panelData);
        showToast('Saved');
        await loadServantPanelDataForPond(pondId);
        await renderServantOperationalPanels();
      }
      return;
    }

    // Cancel inline
    const cancelInline = e.target.closest && e.target.closest('.card-cancel-btn');
    if (cancelInline) {
      const card = e.target.closest('.kpi-card');
      if (!card) return;
      closeInlineCardEditor(card);
      return;
    }
    if (e.target && e.target.id === 'saveAeratorBtn') {
      const pondId = state.selectedPondId || (state.ponds[0] && (state.ponds[0].pondId || state.ponds[0].id));
      const total = parseInt(document.getElementById('aeratorTotalInput').value || '0', 10);
      const running = parseInt(document.getElementById('aeratorRunningInput').value || '0', 10);
      if (running > total) { showToast('Running Aerators cannot exceed Total Aerators', 'error'); return; }
      const stopped = Math.max(total - running, 0);
      const status = stopped === 0 ? 'ON' : 'WARNING';
      const payload = { pondId, total, running, stopped, status, updatedAt: new Date().toISOString(), savedBy: state.user ? state.user.name : 'Servant' };
      // Save locally
      const aerKey = `manthena_aqua_aerators_${pondId}`;
      localStorage.setItem(aerKey, JSON.stringify(payload));
      // Save to Firestore if available
      if (window.AQUA_STORAGE.isFirebase && window.AQUA_STORAGE.isFirebase()) {
        try { await firebase.firestore().collection('aerators').doc(pondId).set(payload); } catch(e) {}
      }
      document.getElementById('aeratorStoppedInput').value = stopped;
      document.getElementById('aeratorStatusInput').value = status;
      document.getElementById('aeratorSaveMsg').textContent = 'Saved';
      showToast('Aerator details saved');
    }

    if (e.target && e.target.id === 'saveFeedStockBtn') {
      const pondId = state.selectedPondId || (state.ponds[0] && (state.ponds[0].pondId || state.ponds[0].id));
      const total = parseFloat(document.getElementById('feedTotalInput').value || '0');
      const added = parseFloat(document.getElementById('feedAddedInput').value || '0');
      const used = parseFloat(document.getElementById('feedUsedInput').value || '0');
      if (total < 0 || added < 0 || used < 0) { showToast('Feed quantity cannot be negative', 'error'); return; }
      const remaining = Math.max(total + added - used, 0);
      const payload = { pondId, total, added, used, remaining, updatedAt: new Date().toISOString(), savedBy: state.user ? state.user.name : 'Servant' };
      const feedKey = `manthena_aqua_feedstock_${pondId}`;
      localStorage.setItem(feedKey, JSON.stringify(payload));
      if (window.AQUA_STORAGE.isFirebase && window.AQUA_STORAGE.isFirebase()) {
        try { await firebase.firestore().collection('feedStock').doc(pondId).set(payload); } catch(e) {}
      }
      document.getElementById('feedRemainingInput').value = remaining;
      document.getElementById('feedStockSaveMsg').textContent = 'Saved';
      showToast('Feed stock saved');
      // Refresh summary
      renderDailyFeedSummary();
    }

    if (e.target && e.target.id === 'saveDailyFeedBtn') {
      const pondId = document.getElementById('dailyPondSelect').value;
      const time = document.getElementById('dailyFeedTime').value;
      const qty = parseFloat(document.getElementById('dailyFeedQty').value || '0');
      const consumption = document.getElementById('dailyFeedConsumption').value;
      const notes = document.getElementById('dailyFeedNotes').value;
      if (qty < 0) { showToast('Feed quantity cannot be negative', 'error'); return; }
      const todayStr = new Date().toISOString().split('T')[0];
      const logObj = { pondId, date: todayStr, slot: time, feedQtyKg: qty, consumptionStatus: consumption, notes, servant: state.user ? state.user.name : 'Servant', timestamp: time };
      // Use existing storage method to save feed log (also writes to Firestore when enabled)
      await window.AQUA_STORAGE.saveFeedLog(logObj);
      document.getElementById('dailyFeedSaveMsg').textContent = 'Saved';
      showToast('Feed entry saved');
      await loadData();
      renderDailyFeedSummary();
      renderServantHistoryLogs(state.selectedPondId || pondId);
    }
  });

  function renderDailyFeedSummary() {
    const container = document.getElementById('dailyFeedSummary');
    if (!container) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = toArray(state.feedLogs).filter(l => l.date === todayStr);
    const totalGiven = todayLogs.reduce((s, l) => s + (parseFloat(l.feedQtyKg) || 0), 0);
    const totalConsumption = todayLogs.length; // number of entries
    // Feed given per pond
    const perPond = {};
    todayLogs.forEach(l => { perPond[l.pondId] = (perPond[l.pondId] || 0) + (parseFloat(l.feedQtyKg) || 0); });
    const perPondHtml = Object.keys(perPond).map(pid => `<div style="min-width:160px; background:rgba(255,255,255,0.02); border:1px solid var(--border-light); padding:0.6rem; border-radius:8px;"><strong>${pid}</strong><div style="font-weight:700; margin-top:0.2rem;">${perPond[pid]} KG</div></div>`).join('');
    container.innerHTML = `
      <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
        <div style="min-width:220px; background:var(--bg-card); border:1px solid var(--border-light); padding:0.6rem; border-radius:8px;"><div style="font-size:0.85rem; color:var(--text-muted);">Total Feed Given Today</div><div style="font-weight:700; font-size:1.05rem; margin-top:0.2rem;">${totalGiven.toFixed(1)} KG</div></div>
        <div style="min-width:220px; background:var(--bg-card); border:1px solid var(--border-light); padding:0.6rem; border-radius:8px;"><div style="font-size:0.85rem; color:var(--text-muted);">Total Feed Entries</div><div style="font-weight:700; font-size:1.05rem; margin-top:0.2rem;">${totalConsumption}</div></div>
        <div style="flex:1 1 100%; display:flex; gap:0.6rem; flex-wrap:wrap;">${perPondHtml || '<div style="color:var(--text-dim);">No feed entries today.</div>'}</div>
      </div>
    `;
  }

  function renderOwnerOpsSummary() {
    const container = document.getElementById('ownerOpsSummaryCards');
    if (!container) return;

    const urgentCount = toArray(state.ownerNotifications).length;
    const todayFeedLogs = toArray(state.feedLogs).filter(log => log.date === new Date().toISOString().split('T')[0]);
    const remainingFeed = Math.max(500 - todayFeedLogs.reduce((sum, log) => sum + (parseFloat(log.feedQtyKg) || 0), 0), 0);
    const mortalityCount = toArray(state.mortalityLogs).reduce((sum, item) => sum + (parseInt(item.count || item.mortalityCount || 0, 10) || 0), 0);
    const currentEstimatedCount = Math.max(400000 - mortalityCount, 0);
    const runningAerators = 5;

    container.innerHTML = `
      <div class="kpi-card emerald"><div class="kpi-header"><span>Total Feed Stock</span><i class="fas fa-boxes"></i></div><div class="kpi-value">500 KG</div><div class="kpi-subtitle">Warehouse stock</div></div>
      <div class="kpi-card amber"><div class="kpi-header"><span>Remaining Feed Stock</span><i class="fas fa-warehouse"></i></div><div class="kpi-value">${remainingFeed} KG</div><div class="kpi-subtitle">Low threshold 120 KG</div></div>
      <div class="kpi-card purple"><div class="kpi-header"><span>Total Seed Stock</span><i class="fas fa-seedling"></i></div><div class="kpi-value">2500</div><div class="kpi-subtitle">Seed units</div></div>
      <div class="kpi-card emerald"><div class="kpi-header"><span>Remaining Seed Stock</span><i class="fas fa-seedling"></i></div><div class="kpi-value">1300</div><div class="kpi-subtitle">Available for stocking</div></div>
      <div class="kpi-card amber"><div class="kpi-header"><span>Feed Used Today</span><i class="fas fa-weight-hanging"></i></div><div class="kpi-value">${todayFeedLogs.reduce((sum, log) => sum + (parseFloat(log.feedQtyKg) || 0), 0).toFixed(1)} KG</div><div class="kpi-subtitle">Servant submissions</div></div>
      <div class="kpi-card purple"><div class="kpi-header"><span>Shrimp Count</span><i class="fas fa-fish"></i></div><div class="kpi-value">${currentEstimatedCount}</div><div class="kpi-subtitle">Live count</div></div>
      <div class="kpi-card emerald"><div class="kpi-header"><span>Running Aerators</span><i class="fas fa-fan"></i></div><div class="kpi-value">${runningAerators}</div><div class="kpi-subtitle">Operational</div></div>
      <div class="kpi-card rose"><div class="kpi-header"><span>Pending Alerts</span><i class="fas fa-bell"></i></div><div class="kpi-value">${urgentCount}</div><div class="kpi-subtitle">Owner action needed</div></div>
      <div class="kpi-card rose"><div class="kpi-header"><span>Urgent Notifications</span><i class="fas fa-exclamation-triangle"></i></div><div class="kpi-value">${urgentCount}</div><div class="kpi-subtitle">High priority</div></div>
    `;
  }

  function renderInvestmentReport() {
    const container = document.getElementById('investmentReportCards');
    if (!container) return;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    const totals = {
      totalInvestment: 0,
      todayExpense: 0,
      yesterdayExpense: 0,
      weeklyExpense: 0,
      monthlyExpense: 0,
      yearlyExpense: 0
    };

    state.expenses.forEach(exp => {
      const amount = Number(exp.amount) || 0;
      totals.totalInvestment += amount;
      const expDate = parseDateValue(exp.date);
      if (!expDate) return;
      const expStr = exp.date;
      if (expStr === todayStr) totals.todayExpense += amount;
      if (expStr === yesterdayStr) totals.yesterdayExpense += amount;
      if (expDate >= weekStart && expDate <= today) totals.weeklyExpense += amount;
      if (expDate >= monthStart && expDate <= today) totals.monthlyExpense += amount;
      if (expDate >= yearStart && expDate <= today) totals.yearlyExpense += amount;
    });

    container.innerHTML = `
      <div class="kpi-card emerald"><div class="kpi-header"><span>Total Investment</span><i class="fas fa-coins"></i></div><div class="kpi-value">${formatCurrency(totals.totalInvestment)}</div><div class="kpi-subtitle">Calculated from all expenses</div></div>
      <div class="kpi-card purple"><div class="kpi-header"><span>Today's Expense</span><i class="fas fa-calendar-day"></i></div><div class="kpi-value">${formatCurrency(totals.todayExpense)}</div><div class="kpi-subtitle">Expenses recorded today</div></div>
      <div class="kpi-card amber"><div class="kpi-header"><span>Yesterday's Expense</span><i class="fas fa-calendar-minus"></i></div><div class="kpi-value">${formatCurrency(totals.yesterdayExpense)}</div><div class="kpi-subtitle">Yesterday's spend</div></div>
      <div class="kpi-card rose"><div class="kpi-header"><span>Weekly Expense</span><i class="fas fa-calendar-week"></i></div><div class="kpi-value">${formatCurrency(totals.weeklyExpense)}</div><div class="kpi-subtitle">Last 7 days</div></div>
      <div class="kpi-card emerald"><div class="kpi-header"><span>Monthly Expense</span><i class="fas fa-calendar-alt"></i></div><div class="kpi-value">${formatCurrency(totals.monthlyExpense)}</div><div class="kpi-subtitle">This month</div></div>
      <div class="kpi-card purple"><div class="kpi-header"><span>Yearly Expense</span><i class="fas fa-calendar"></i></div><div class="kpi-value">${formatCurrency(totals.yearlyExpense)}</div><div class="kpi-subtitle">This year</div></div>
    `;
  }

  function renderExpenseCategoryTotals() {
    const container = document.getElementById('expenseCategoryTotals');
    if (!container) return;
    const categories = [
      'Feed Cost',
      'Medicine Cost',
      'Seed Cost',
      'Power Bill',
      'Generator Diesel',
      'Labour Cost',
      'Maintenance Cost',
      'Other Expenses'
    ];
    const totals = categories.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {});

    state.expenses.forEach(exp => {
      const amount = Number(exp.amount) || 0;
      const category = exp.category || 'Other Expenses';
      if (totals[category] !== undefined) {
        totals[category] += amount;
      } else {
        totals['Other Expenses'] += amount;
      }
    });

    container.innerHTML = categories.map(category => `
      <div class="kpi-card ${category === 'Other Expenses' ? 'rose' : 'emerald'}">
        <div class="kpi-header"><span>${category}</span><i class="fas fa-arrow-right"></i></div>
        <div class="kpi-value">${formatCurrency(totals[category])}</div>
        <div class="kpi-subtitle">Total spent</div>
      </div>
    `).join('');
  }

  function renderExpenseHistoryTable() {
    const tableBody = document.getElementById('expensesTableBody');
    if (!tableBody) return;

    const filtered = state.expenses.filter(exp => {
      if (state.expenseFilters.date && exp.date !== state.expenseFilters.date) return false;
      if (state.expenseFilters.pond !== 'all') {
        const filterValue = state.expenseFilters.pond.toLowerCase();
        if (!exp.pondNumber?.toLowerCase().includes(filterValue)) return false;
      }
      if (state.expenseFilters.category !== 'all' && exp.category !== state.expenseFilters.category) return false;
      if (state.expenseFilters.status !== 'all' && (exp.status || 'pending') !== state.expenseFilters.status) return false;
      return true;
    });

    const canEditAny = state.user?.role === 'owner' || state.user?.role === 'supervisor';
    const canDeleteAny = state.user?.role === 'owner';

    tableBody.innerHTML = filtered.length ? filtered.map(exp => {
      const canEdit = canEditAny || exp.addedBy === state.user?.name;
      const canDelete = canDeleteAny || exp.addedBy === state.user?.name;
      const statusLabel = exp.status || 'pending';
      return `
        <tr>
          <td>${exp.date}</td>
          <td>${exp.category}</td>
          <td>${formatCurrency(exp.amount)}</td>
          <td>${exp.pondNumber}</td>
          <td>${exp.addedBy || 'Unknown'}</td>
          <td>${statusLabel}</td>
          <td>${exp.description || ''}</td>
          <td style="white-space:nowrap;">
            ${canEdit ? `<button class="btn btn-secondary btn-sm expense-action-btn" data-action="edit" data-id="${exp.expenseId}">Edit</button>` : ''}
            ${canDelete ? `<button class="btn btn-danger btn-sm expense-action-btn" data-action="delete" data-id="${exp.expenseId}">Delete</button>` : ''}
          </td>
        </tr>
      `;
    }).join('') : `<tr><td colspan="8" style="text-align:center; padding:1rem; color:var(--text-muted);">No expenses match the selected filters.</td></tr>`;
  }

  function renderServantExpenseSection() {
    const form = document.getElementById('servantExpenseForm');
    const pondSelect = document.getElementById('expensePondSelect');
    const tableBody = document.getElementById('servantExpensesTableBody');
    if (!form || !pondSelect || !tableBody) return;

    const pondOptions = state.ponds.map(p => `<option value="${p.pondId || p.id}">${p.pondId || p.id} - ${p.name}</option>`).join('');
    pondSelect.innerHTML = pondOptions;
    if (state.selectedPondId) {
      pondSelect.value = state.selectedPondId;
    }

    const selectedPond = state.selectedPondId || (state.ponds[0] && (state.ponds[0].pondId || state.ponds[0].id));
    const visibleExpenses = state.expenses.filter(exp => exp.pondNumber === selectedPond && (state.user?.role !== 'servant' || exp.addedBy === state.user?.name));

    tableBody.innerHTML = visibleExpenses.length ? visibleExpenses.map(exp => {
      const canEdit = state.user?.role === 'owner' || state.user?.role === 'supervisor' || exp.addedBy === state.user?.name;
      const canDelete = state.user?.role === 'owner' || exp.addedBy === state.user?.name;
      return `
        <tr>
          <td>${exp.date}</td>
          <td>${exp.pondNumber}</td>
          <td>${exp.category}</td>
          <td>${exp.description || ''}</td>
          <td>${formatCurrency(exp.amount)}</td>
          <td>${exp.addedBy || 'Unknown'}</td>
          <td style="white-space:nowrap;">
            ${canEdit ? `<button class="btn btn-secondary btn-sm servant-expense-action" data-action="edit" data-id="${exp.expenseId}">Edit</button>` : ''}
            ${canDelete ? `<button class="btn btn-danger btn-sm servant-expense-action" data-action="delete" data-id="${exp.expenseId}">Delete</button>` : ''}
          </td>
        </tr>
      `;
    }).join('') : `<tr><td colspan="7" style="text-align:center; padding:1rem; color:var(--text-muted);">No expenses recorded for this pond.</td></tr>`;
  }

  function refreshExpenseViews() {
    renderInvestmentReport();
    renderExpenseCategoryTotals();
    renderExpenseHistoryTable();
    renderServantExpenseSection();
  }

  function renderOwnerNotifications() {
    const container = document.getElementById('dashboardHistoryPanel');
    if (!container) return;

    const items = toArray(state.ownerNotifications).slice(0, 8);
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.75rem;">
        <h3 style="color:var(--primary); margin:0;"><i class="fas fa-bell"></i> Owner Notifications</h3>
        <span class="status-pill active">${items.length} Active</span>
      </div>
      ${items.length ? items.map(item => `
        <div style="border:1px solid rgba(239,68,68,0.2); border-left:5px solid #ef4444; background:rgba(254,242,242,0.9); padding:1rem; border-radius:var(--radius-md); margin-bottom:0.8rem;">
          <div style="display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
            <strong style="color:#b91c1c;">URGENT ${item.emergencyType || item.title || 'Emergency'}</strong>
            <span style="font-size:0.78rem; color:var(--text-secondary);">${item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Now'}</span>
          </div>
          <div style="margin-top:0.5rem; color:var(--text-main);">Pond ${item.pondId || 'N/A'} • Servant ${item.servantName || 'N/A'}</div>
          <div style="margin-top:0.3rem; color:var(--text-secondary);">${item.description || item.title || 'Emergency reported.'}</div>
          ${item.photoData ? `<img src="${item.photoData}" alt="Emergency" style="margin-top:0.8rem; max-width:100%; border-radius:12px; max-height:220px; object-fit:cover;">` : ''}
        </div>
      `).join('') : '<p style="color:var(--text-secondary);">No urgent notifications yet.</p>'}
    `;
  }

  function renderWaterAndGrowthLogs() {
    const wqBody = document.getElementById('waterQualityTableBody');
    if (wqBody) {
      wqBody.innerHTML = state.waterLogs.map(w => {
        const ammoniaStatus = getWaterParamStatus('ammonia', w.ammonia);
        const nitrateStatus = getWaterParamStatus('nitrate', w.nitrate);
        return `
          <tr>
            <td><strong style="color:var(--primary);">${w.pondId}</strong></td>
            <td>${w.date} ${w.time || ''}</td>
            <td><span class="wq-badge ${getWaterParamStatus('ph', w.ph).className}">${w.ph} pH</span></td>
            <td><span class="wq-badge ${getWaterParamStatus('do', w.do).className}">${w.do} ppm</span></td>
            <td>${w.salinity} ppt</td>
            <td>${w.temperature} °C</td>
            <td>${w.transparency} cm</td>
            <td><span class="wq-badge ${ammoniaStatus.className}">${w.ammonia ?? 0} mg/L</span></td>
            <td><span class="wq-badge ${nitrateStatus.className}">${w.nitrate ?? 0} mg/L</span></td>
            <td>${w.enteredBy || 'Supervisor'}</td>
          </tr>
        `;
      }).join('');
    }

    const grBody = document.getElementById('growthTableBody');
    if (grBody) {
      grBody.innerHTML = state.growthLogs.map(g => `
        <tr>
          <td><strong style="color:var(--primary);">${g.pondId}</strong></td>
          <td>DOC ${g.doc}</td>
          <td><strong>${g.abw} g</strong></td>
          <td>+${g.weeklyGrowth} g/week</td>
          <td>${g.survivalRate}%</td>
          <td><strong>${g.calculatedBiomassKg} KG</strong></td>
          <td>${g.date}</td>
        </tr>
      `).join('');
    }
  }

  window.AQUA_APP.openPondDetails = function(pondId) {
    const pond = state.ponds.find(p => (p.pondId || p.id) === pondId);
    if (!pond) return;

    const pid = pond.pondId || pond.id;
    document.getElementById('modalPondTitle').textContent = `${pid} - ${pond.name} Details`;
    state.selectedPondId = pid;
    renderPondModalTabs(pond);
    document.getElementById('pondDetailsModal').classList.add('open');
  };

  function renderPondModalTabs(pond) {
    const pid = pond.pondId || pond.id;
    const pondFeedLogs = toArray(state.feedLogs).filter(l => l.pondId === pid);
    const pondWaterLogs = toArray(state.waterLogs).filter(l => l.pondId === pid);
    const pondGrowthLogs = toArray(state.growthLogs).filter(l => l.pondId === pid);

    document.getElementById('tabFeedHistory').innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr><th>Date</th><th>Slot</th><th>Feed Qty</th><th>Type</th><th>Tray Check</th><th>Servant</th></tr>
          </thead>
          <tbody>
            ${pondFeedLogs.length ? pondFeedLogs.map(l => `
              <tr>
                <td>${l.date}</td>
                <td><strong>${l.slot}</strong></td>
                <td><strong style="color:var(--primary);">${l.feedQtyKg} KG</strong></td>
                <td>${l.feedType}</td>
                <td><span class="wq-badge wq-optimal">${l.consumptionStatus || '100%'}</span></td>
                <td>${l.servant}</td>
              </tr>
            `).join('') : `<tr><td colspan="6" style="text-align:center; padding:1.5rem;">No feed records.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('tabWaterQuality').innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead><tr><th>Date</th><th>pH</th><th>DO</th><th>Salinity</th><th>Temp</th><th>Ammonia</th><th>Nitrate</th></tr></thead>
          <tbody>
            ${pondWaterLogs.length ? pondWaterLogs.map(w => {
              const ammoniaStatus = getWaterParamStatus('ammonia', w.ammonia);
              const nitrateStatus = getWaterParamStatus('nitrate', w.nitrate);
              return `
                <tr>
                  <td>${w.date}</td>
                  <td><span class="wq-badge ${getWaterParamStatus('ph', w.ph).className}">${w.ph}</span></td>
                  <td><span class="wq-badge ${getWaterParamStatus('do', w.do).className}">${w.do} ppm</span></td>
                  <td>${w.salinity} ppt</td>
                  <td>${w.temperature} °C</td>
                  <td><span class="wq-badge ${ammoniaStatus.className}">${w.ammonia ?? 0} mg/L</span></td>
                  <td><span class="wq-badge ${nitrateStatus.className}">${w.nitrate ?? 0} mg/L</span></td>
                </tr>
              `;
            }).join('') : `<tr><td colspan="7" style="text-align:center; padding:1.5rem;">No water quality records.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('tabGrowth').innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead><tr><th>Date</th><th>DOC</th><th>ABW</th><th>Biomass</th></tr></thead>
          <tbody>
            ${pondGrowthLogs.length ? pondGrowthLogs.map(g => `
              <tr><td>${g.date}</td><td>DOC ${g.doc}</td><td>${g.abw} g</td><td>${g.calculatedBiomassKg} KG</td></tr>
            `).join('') : `<tr><td colspan="4" style="text-align:center; padding:1.5rem;">No growth records.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('tabDailyNotes').innerHTML = `
      <div style="padding:1rem; background:var(--bg-input); border-radius:var(--radius-md);">
        <p style="color:var(--text-main);">${pond.remarks || 'No daily notes recorded.'}</p>
      </div>
    `;
  }

  window.AQUA_APP.openAddPondModal = function() {
    document.getElementById('pondFormTitle').textContent = 'Add New Pond';
    document.getElementById('pondIdInput').value = generateNextPondId();
    document.getElementById('pondNameInput').value = '';
    document.getElementById('pondSizeInput').value = 5;
    document.getElementById('stockingDateInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('pondStatusSelect').value = 'Active';
    document.getElementById('supervisorInput').value = 'Rajesh Kumar';
    document.getElementById('servantInput').value = 'Ramu';
    document.getElementById('pondRemarksInput').value = '';
    document.getElementById('pondFormModal').classList.add('open');
  };

  window.AQUA_APP.editPond = function(pondId) {
    const pond = state.ponds.find(p => (p.pondId || p.id) === pondId);
    if (!pond) return;

    const pid = pond.pondId || pond.id;
    document.getElementById('pondFormTitle').textContent = `Edit Pond Details (${pid})`;
    document.getElementById('pondIdInput').value = pid;
    document.getElementById('pondNameInput').value = pond.name;
    document.getElementById('pondSizeInput').value = pond.size;
    document.getElementById('stockingDateInput').value = pond.stockingDate || '';
    document.getElementById('pondStatusSelect').value = pond.status || 'Active';
    document.getElementById('supervisorInput').value = pond.supervisor || '';
    document.getElementById('servantInput').value = pond.servant || '';
    document.getElementById('pondRemarksInput').value = pond.remarks || '';
    document.getElementById('pondFormModal').classList.add('open');
  };

  window.AQUA_APP.deletePond = async function(pondId) {
    if (confirm(`Are you sure you want to delete ${pondId}?`)) {
      try {
        await apiFetch(`/api/ponds/${pondId}`, { method: 'DELETE' });
      } catch(e) {}
      await window.AQUA_STORAGE.deletePond(pondId);
      showToast(`Pond ${pondId} deleted.`);
      await loadData();
    }
  };

  document.getElementById('pondForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pid = document.getElementById('pondIdInput').value.trim();
    const name = document.getElementById('pondNameInput').value.trim();
    const size = parseFloat(document.getElementById('pondSizeInput').value);
    const stockingDate = document.getElementById('stockingDateInput').value;
    const status = document.getElementById('pondStatusSelect').value;
    const supervisor = document.getElementById('supervisorInput').value.trim();
    const servant = document.getElementById('servantInput').value.trim();
    const remarks = document.getElementById('pondRemarksInput').value.trim();

    const pondObj = { pondId: pid, id: pid, name, size, stockingDate, status, supervisor, servant, remarks };

    try {
      await apiFetch('/api/ponds', {
        method: 'POST',
        body: JSON.stringify(pondObj)
      });
    } catch(e) {}

    await window.AQUA_STORAGE.savePond(pondObj);
    document.getElementById('pondFormModal').classList.remove('open');
    showToast(`Pond ${pid} saved!`);
    await loadData();
  });

  document.querySelectorAll('.close-modal-btn, [data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    });
  });

  window.AQUA_APP.openInvestmentModal = function(expense) {
    const modal = document.getElementById('investmentModal');
    if (!modal) return;
    const defaultDate = new Date().toISOString().split('T')[0];
    document.getElementById('investmentCategory').innerHTML = [
      'Feed Cost',
      'Medicine Cost',
      'Seed Cost',
      'Power Bill',
      'Generator Diesel',
      'Labour Cost',
      'Maintenance Cost',
      'Water Treatment Cost',
      'Transport Cost',
      'Other Expenses'
    ].map(cat => `<option value="${cat}">${cat}</option>`).join('');
    document.getElementById('investmentStatus').innerHTML = [
      'pending',
      'approved',
      'rejected'
    ].map(status => `<option value="${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</option>`).join('');
    document.getElementById('investmentDate').value = expense?.date || defaultDate;
    document.getElementById('investmentTime').value = expense?.time || new Date().toTimeString().slice(0,5);
    document.getElementById('investmentPond').value = expense?.pondNumber || (state.selectedPondId || (state.ponds[0] && (state.ponds[0].pondId || state.ponds[0].id)) || 'All');
    document.getElementById('investmentDescription').value = expense?.description || '';
    document.getElementById('investmentAmount').value = expense?.amount || '';
    document.getElementById('investmentNotes').value = expense?.notes || '';
    document.getElementById('investmentStatus').value = expense?.status || 'pending';
    modal.classList.add('open');
    state.editingExpenseId = expense?.expenseId || null;
  };

  document.getElementById('investmentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = document.getElementById('investmentDate').value;
    const pondNumber = document.getElementById('investmentPond').value.trim() || 'All';
    const category = document.getElementById('investmentCategory').value;
    const status = document.getElementById('investmentStatus').value || 'pending';
    const description = document.getElementById('investmentDescription').value.trim();
    const amount = parseFloat(document.getElementById('investmentAmount').value || '0');
    const notes = document.getElementById('investmentNotes').value.trim();
    const time = document.getElementById('investmentTime').value || new Date().toTimeString().slice(0,5);
    if (!date || !pondNumber || !category || !description || isNaN(amount) || amount < 0) {
      showToast('Please complete all required fields.', 'error');
      return;
    }
    const expenseId = state.editingExpenseId || `exp_${Date.now()}`;
    const existing = state.expenses.find(exp => exp.expenseId === expenseId);
    const expense = {
      id: expenseId,
      expenseId,
      date,
      time,
      pondNumber,
      category,
      description,
      amount,
      notes,
      status,
      addedBy: state.user?.name || 'Unknown',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await window.AQUA_STORAGE.saveExpense(expense);
    document.getElementById('investmentModal').classList.remove('open');
    state.editingExpenseId = null;
    await loadData();
    refreshExpenseViews();
    showToast('Expense saved.', 'success');
  });

  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const mobileNavMenu = document.getElementById('mobileNavMenu');
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');
  const closeMobileNavBtn = document.getElementById('closeMobileNav');
  const mobileNavList = document.getElementById('mobileNavList');

  function syncMobileNavState() {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile && mobileNavMenu) {
      mobileNavMenu.classList.remove('open');
      mobileNavOverlay.classList.remove('open');
    }
  }

  function closeMobileNav() {
    if (mobileNavMenu) mobileNavMenu.classList.remove('open');
    if (mobileNavOverlay) mobileNavOverlay.classList.remove('open');
  }

  function buildMobileNavMenu() {
    if (!mobileNavList) return;

    const tabs = Array.from(document.querySelectorAll('.nav-tab'));
    mobileNavList.innerHTML = '';

    tabs.forEach(tab => {
      const mobileTab = tab.cloneNode(true);
      mobileTab.classList.add('mobile-nav-item');
      mobileTab.setAttribute('type', 'button');
      mobileNavList.appendChild(mobileTab);
    });
  }

  mobileNavToggle?.addEventListener('click', () => {
    if (!mobileNavMenu) return;
    mobileNavMenu.classList.toggle('open');
    mobileNavOverlay?.classList.toggle('open');
  });

  closeMobileNavBtn?.addEventListener('click', closeMobileNav);
  mobileNavOverlay?.addEventListener('click', closeMobileNav);
  window.addEventListener('resize', syncMobileNavState);

  buildMobileNavMenu();

  function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content-section').forEach(s => s.classList.remove('active'));

    const targetTabBtn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    const targetSection = document.getElementById(`tab-${tabId}`);

    if (targetTabBtn) targetTabBtn.classList.add('active');
    if (targetSection) targetSection.classList.add('active');
    state.activeTab = tabId;
    closeMobileNav();

    if (tabId === 'servant-feeding') {
      const pondGrid = document.getElementById('servantPondsGrid');
      const consolePanel = document.getElementById('servantOperationsConsole');
      if (pondGrid) pondGrid.style.display = 'grid';
      if (consolePanel) consolePanel.style.display = 'none';
    }

    // Load pond investments when tab is clicked
    if (tabId === 'investments' && window.AQUA_APP && window.AQUA_APP.initPondInvestments) {
      window.AQUA_APP.initPondInvestments().catch(err => console.error('Error initializing pond investments:', err));
    }
  }

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('.nav-tab');
    if (!tab) return;
    switchTab(tab.dataset.tab);
  });

  document.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.viewMode = e.currentTarget.dataset.view;
      renderPondGridOrTable();
    });
  });

  document.getElementById('pondSearchInput')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderPondGridOrTable();
  });

  document.getElementById('pondStatusFilter')?.addEventListener('change', (e) => {
    state.statusFilter = e.target.value;
    renderPondGridOrTable();
  });

  document.querySelectorAll('.slot-option-card').forEach(card => {
    card.addEventListener('click', (e) => {
      document.querySelectorAll('.slot-option-card').forEach(c => c.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      state.selectedFeedSlot = e.currentTarget.dataset.slot;
    });
  });

  document.querySelectorAll('.consumption-option-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.consumption-option-btn').forEach(b => b.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      state.selectedConsumption = e.currentTarget.dataset.val;
    });
  });

  document.getElementById('servantFeedForm')?.addEventListener('submit', submitServantFeedEntry);
  document.getElementById('servantWQForm')?.addEventListener('submit', submitServantWQEntry);
  document.getElementById('wqForm')?.addEventListener('submit', submitWQEntry);
  document.getElementById('servantGrowthForm')?.addEventListener('submit', submitServantGrowthEntry);
  document.getElementById('servantMortalityForm')?.addEventListener('submit', submitServantMortalityEntry);
  document.getElementById('servantChecklistForm')?.addEventListener('submit', submitServantChecklistEntry);

  document.getElementById('servantPondSearch')?.addEventListener('input', renderServantPonds);
  document.getElementById('servantExpenseForm')?.addEventListener('submit', submitServantExpenseEntry);
  document.getElementById('urgentReportBtn')?.addEventListener('click', async () => {
    const pondId = document.getElementById('servantActivePondId')?.textContent || 'P001';
    const emergencyType = prompt('Emergency type:');
    if (!emergencyType) return;
    const description = prompt('Describe the issue:');
    if (!description) return;
    const photoData = prompt('Optional photo URL (leave blank if none):') || '';
    const payload = {
      type: 'urgent-report',
      pondId,
      servantName: state.user?.name || 'Servant',
      emergencyType,
      description,
      photoData,
      title: `Urgent ${emergencyType}`,
      createdAt: new Date().toISOString()
    };

    try {
      await apiFetch('/api/operational-log', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      state.operationalLogs = [...state.operationalLogs, payload];
      state.ownerNotifications = state.operationalLogs.filter(log => log.type === 'urgent-report' || log.type === 'notification');
      renderOwnerOpsSummary();
      renderOwnerNotifications();
      showToast('Urgent report sent to owner dashboard.', 'success');
    } catch (err) {
      showToast('Unable to send urgent report.', 'error');
    }
  });
  document.getElementById('servantOnlyAssigned')?.addEventListener('change', renderServantPonds);
  document.getElementById('expenseDateFilter')?.addEventListener('change', (e) => { state.expenseFilters.date = e.target.value || ''; renderExpenseHistoryTable(); });
  document.getElementById('expensePondFilter')?.addEventListener('input', (e) => { state.expenseFilters.pond = e.target.value.trim() || 'all'; renderExpenseHistoryTable(); });
  document.getElementById('expenseCategoryFilter')?.addEventListener('change', (e) => { state.expenseFilters.category = e.target.value || 'all'; renderExpenseHistoryTable(); });
  document.getElementById('expenseStatusFilter')?.addEventListener('change', (e) => { state.expenseFilters.status = e.target.value || 'all'; renderExpenseHistoryTable(); });
  document.addEventListener('click', async (e) => {
    const button = e.target.closest?.('.expense-action-btn, .servant-expense-action');
    if (!button) return;
    const action = button.dataset.action;
    const expenseId = button.dataset.id;
    if (!action || !expenseId) return;
    const expense = state.expenses.find(exp => exp.expenseId === expenseId);
    if (!expense) return;

    if (action === 'edit') {
      window.AQUA_APP.openInvestmentModal(expense);
    }
    if (action === 'delete') {
      if (!confirm('Delete this expense record?')) return;
      await window.AQUA_STORAGE.deleteExpense(expenseId);
      state.expenses = state.expenses.filter(exp => exp.expenseId !== expenseId);
      refreshExpenseViews();
      showToast('Expense deleted.', 'success');
    }
  });

  document.querySelectorAll('[data-servanttab]').forEach(tabBtn => {
    tabBtn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-servanttab]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.servant-tab-content').forEach(c => c.style.display = 'none');
      e.currentTarget.classList.add('active');
      const el = document.getElementById(e.currentTarget.dataset.servanttab);
      if (el) el.style.display = 'block';
    });
  });

  document.querySelectorAll('.modal-tab-btn').forEach(tabBtn => {
    tabBtn.addEventListener('click', (e) => {
      if (e.currentTarget.dataset.subtab) {
        document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.modal-subtab-content').forEach(c => c.style.display = 'none');
        e.currentTarget.classList.add('active');
        const el = document.getElementById(e.currentTarget.dataset.subtab);
        if (el) el.style.display = 'block';
      }
    });
  });

  window.AQUA_APP.openWQModal = function(pondId) {
    const sel = document.getElementById('wqPondSelect');
    if (sel) {
      sel.innerHTML = state.ponds.map(p => `<option value="${p.pondId || p.id}">${p.pondId || p.id} - ${p.name}</option>`).join('');
    }
    document.getElementById('wqModal').classList.add('open');
  };

  window.AQUA_APP.openFirebaseConfigModal = function() {
    document.getElementById('firebaseConfigModal').classList.add('open');
  };

  // ==================== POND INVESTMENT MANAGEMENT ====================

  /**
   * Load pond investments summary and display as cards
   */
  window.AQUA_APP.loadPondInvestmentSummary = async function() {
    try {
      const response = await apiFetch('/api/pond-investments/all/user-ponds');
      const data = await response.json();

      const container = document.getElementById('pondInvestmentsCardsContainer');
      if (!container) return;

      if (!data.pondSummaries || Object.keys(data.pondSummaries).length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No ponds found. Create a pond first.</p>';
        return;
      }

      // Render pond cards
      container.innerHTML = Object.values(data.pondSummaries).map(pond => `
        <div class="kpi-card" style="cursor: pointer;" onclick="window.AQUA_APP.openPondInvestmentViewModal('${pond.pondId}', '${pond.name}')">
          <div class="kpi-header">
            <span class="kpi-title"><i class="fas fa-droplet"></i> ${pond.name}</span>
          </div>
          <div class="kpi-value" style="color: var(--success);">₹${formatNumber(pond.totalAmount)}</div>
          <div class="kpi-label">Total Investment</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
            <i class="fas fa-receipt"></i> ${pond.investmentCount} records
          </div>
          <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.AQUA_APP.openPondInvestmentViewModal('${pond.pondId}', '${pond.name}')" style="flex: 1;">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); window.AQUA_APP.openPondInvestmentEditModal('${pond.pondId}')" style="flex: 1;">
              <i class="fas fa-plus"></i> Add
            </button>
          </div>
        </div>
      `).join('');

      // Display total farm investment
      const totalFarmInvestment = data.totalFarmInvestment || 0;
      const farmTotalCard = document.createElement('div');
      farmTotalCard.className = 'kpi-card';
      farmTotalCard.style.backgroundColor = 'linear-gradient(135deg, var(--primary), var(--secondary))';
      farmTotalCard.innerHTML = `
        <div class="kpi-header" style="color: white;">
          <span class="kpi-title"><i class="fas fa-coins"></i> Total Farm Investment</span>
        </div>
        <div class="kpi-value" style="color: white;">₹${formatNumber(totalFarmInvestment)}</div>
        <div class="kpi-label" style="color: rgba(255,255,255,0.8);">All Ponds Combined</div>
        <div style="font-size: 0.85rem; color: rgba(255,255,255,0.8); margin-top: 0.5rem;">
          <i class="fas fa-calculator"></i> ${data.ponds} ponds
        </div>
      `;
      container.appendChild(farmTotalCard);
    } catch (err) {
      console.error('Error loading pond investments:', err);
      showToast('Failed to load pond investments.', 'error');
    }
  };

  /**
   * Open modal to add/edit pond investment
   */
  window.AQUA_APP.openPondInvestmentEditModal = function(pondId, investmentId = null) {
    const modal = document.getElementById('pondInvestmentModal');
    if (!modal) return;

    // Reset form
    document.getElementById('pondInvestmentForm').reset();
    document.getElementById('pondInvestmentId').value = investmentId || '';
    document.getElementById('pondInvestmentPondId').value = pondId || '';
    document.getElementById('pondInvestmentDate').valueAsDate = new Date();

    const title = investmentId ? 'Edit Pond Investment' : 'Add Pond Investment';
    document.getElementById('pondInvestmentModalTitle').textContent = title;

    // If editing, load existing data
    if (investmentId) {
      const pond = state.ponds.find(p => p.pondId === pondId);
      if (pond) {
        // Find the investment in the loaded data
        // This is handled after loading the investments
      }
    }

    modal.classList.add('open');
    
    // Set up form submission
    const form = document.getElementById('pondInvestmentForm');
    form.onsubmit = async (e) => {
      e.preventDefault();
      await window.AQUA_APP.savePondInvestment(pondId, investmentId);
    };
  };

  /**
   * Save pond investment
   */
  window.AQUA_APP.savePondInvestment = async function(pondId, investmentId) {
    try {
      const category = document.getElementById('pondInvestmentCategory').value;
      const amount = parseFloat(document.getElementById('pondInvestmentAmount').value);
      const date = document.getElementById('pondInvestmentDate').value;
      const description = document.getElementById('pondInvestmentDescription').value;

      if (!category || !amount || !date) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      if (amount <= 0) {
        showToast('Amount must be greater than 0.', 'error');
        return;
      }

      const method = investmentId ? 'PUT' : 'POST';
      const url = investmentId 
        ? await apiUrl(`/api/pond-investments/${pondId}/${investmentId}`)
        : await apiUrl(`/api/pond-investments/${pondId}`);

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({
          category: category.trim(),
          amount,
          date,
          description: description.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(investmentId ? 'Investment updated successfully!' : 'Investment added successfully!', 'success');
        document.getElementById('pondInvestmentModal').classList.remove('open');
        
        // Refresh the view
        await window.AQUA_APP.loadPondInvestmentSummary();
        if (state.currentViewPondId) {
          await window.AQUA_APP.loadPondInvestmentDetails(state.currentViewPondId);
        }
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to save investment.', 'error');
      }
    } catch (err) {
      console.error('Error saving investment:', err);
      showToast('Error saving investment.', 'error');
    }
  };

  /**
   * Open modal to view pond investments
   */
  window.AQUA_APP.openPondInvestmentViewModal = async function(pondId, pondName) {
    const modal = document.getElementById('pondInvestmentViewModal');
    if (!modal) return;

    state.currentViewPondId = pondId;
    document.getElementById('pondInvestmentViewTitle').textContent = `${pondName || 'Pond'} - Investments`;
    
    modal.classList.add('open');
    
    await window.AQUA_APP.loadPondInvestmentDetails(pondId);

    // Set up add investment button
    document.getElementById('pondInvestmentAddBtn').onclick = () => {
      modal.classList.remove('open');
      window.AQUA_APP.openPondInvestmentEditModal(pondId);
    };
  };

  /**
   * Load and display pond investment details
   */
  window.AQUA_APP.loadPondInvestmentDetails = async function(pondId) {
    try {
      // Load investments
      const invResponse = await apiFetch(`/api/pond-investments/${pondId}`);
      const invData = await invResponse.json();
      const investments = invData.investments || [];

      // Load summary
      const summaryResponse = await apiFetch(`/api/pond-investments/${pondId}/summary`);
      const summary = await summaryResponse.json();

      // Render KPI
      const kpiContainer = document.getElementById('pondInvestmentSummaryKpi');
      if (kpiContainer) {
        kpiContainer.innerHTML = `
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title"><i class="fas fa-coins"></i> Total Investment</span>
            </div>
            <div class="kpi-value" style="color: var(--success);">₹${formatNumber(summary.totalAmount)}</div>
            <div class="kpi-label">${summary.investmentCount} Records</div>
          </div>
        `;
      }

      // Render category summary
      const categoryContainer = document.getElementById('pondInvestmentCategorySummary');
      if (categoryContainer) {
        const categories = summary.categories || [];
        categoryContainer.innerHTML = categories.map(cat => {
          const amount = summary.categoryTotals[cat] || 0;
          return `
            <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: 0.5rem; border-left: 3px solid var(--primary);">
              <div style="font-weight: 600; color: var(--text-primary);">${cat}</div>
              <div style="font-size: 1.25rem; color: var(--success); margin-top: 0.25rem;">₹${formatNumber(amount)}</div>
            </div>
          `;
        }).join('');
      }

      // Render investment list
      const listContainer = document.getElementById('pondInvestmentListBody');
      if (listContainer) {
        listContainer.innerHTML = investments.map(inv => `
          <tr>
            <td>${formatDate(inv.date)}</td>
            <td>${inv.category || 'Other'}</td>
            <td style="font-weight: 600; color: var(--success);">₹${formatNumber(inv.amount)}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${inv.description}">${inv.description || '--'}</td>
            <td>
              <button class="btn btn-sm btn-info" onclick="window.AQUA_APP.openPondInvestmentEditModal('${pondId}', '${inv._id}')" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="window.AQUA_APP.deletePondInvestment('${pondId}', '${inv._id}')" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `).join('');

        if (investments.length === 0) {
          listContainer.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No investments yet.</td></tr>';
        }
      }
    } catch (err) {
      console.error('Error loading pond investment details:', err);
      showToast('Failed to load investment details.', 'error');
    }
  };

  /**
   * Delete pond investment
   */
  window.AQUA_APP.deletePondInvestment = async function(pondId, investmentId) {
    if (!confirm('Are you sure you want to delete this investment? This action cannot be undone.')) {
      return;
    }

    try {
      const url = await apiUrl(`/api/pond-investments/${pondId}/${investmentId}`);
      const response = await apiFetch(url, { method: 'DELETE' });

      if (response.ok) {
        showToast('Investment deleted successfully!', 'success');
        await window.AQUA_APP.loadPondInvestmentSummary();
        await window.AQUA_APP.loadPondInvestmentDetails(pondId);
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to delete investment.', 'error');
      }
    } catch (err) {
      console.error('Error deleting investment:', err);
      showToast('Error deleting investment.', 'error');
    }
  };

  /**
   * Export pond investments to CSV
   */
  window.AQUA_APP.exportPondInvestmentsCSV = async function(pondId, pondName) {
    try {
      const response = await apiFetch(`/api/pond-investments/${pondId}`);
      const data = await response.json();
      const investments = data.investments || [];

      if (investments.length === 0) {
        showToast('No investments to export.', 'error');
        return;
      }

      // Create CSV
      const headers = ['Date', 'Category', 'Amount (₹)', 'Description'];
      const rows = investments.map(inv => [
        formatDate(inv.date),
        inv.category || 'Other',
        inv.amount || 0,
        `"${(inv.description || '').replace(/"/g, '""')}"` // Escape quotes
      ]);

      const csvContent = [
        [pondName + ' - Investment Report'],
        [],
        headers,
        ...rows
      ].map(row => row.join(',')).join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pondName}_investments_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Investments exported successfully!', 'success');
    } catch (err) {
      console.error('Error exporting investments:', err);
      showToast('Failed to export investments.', 'error');
    }
  };

  // Initialize pond investments on dashboard load
  window.AQUA_APP.initPondInvestments = async function() {
    await window.AQUA_APP.loadPondInvestmentSummary();
  };

  function getRoleColor(role) {
    const colors = {
      owner: '#2196F3',
      supervisor: '#FF9800',
      servant: '#4CAF50'
    };
    return colors[role] || '#9E9E9E';
  }

  // Check saved user session on startup
  checkSavedAuth();
});
