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
    language: localStorage.getItem('manthena_aqua_lang') || 'en',
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
    selectedPondId: null,
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

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  const APP_TEXT = {
    en: {
      aquaFarming: 'AQUA FARMING',
      owner: 'Owner',
      supervisor: 'Supervisor',
      servant: 'Servant',
      usernameLabel: 'Username',
      passwordLabel: 'Password',
      signInToAqua: 'Sign In to AQUA FARMING',
      secureJWT: 'Secure JWT Encrypted Login',
      installAquaApp: 'Install Aqua App',
      switchLanguage: 'తెలుగు',
      logout: 'Logout',
      localEngine: 'Local Engine (Offline Ready)',
      ownerDashboard: 'Executive Dashboard',
      pondManagement: 'Pond Management',
      servantFeedingPortal: 'Servant Feeding Portal',
      supervisorDashboard: 'Supervisor Monitoring',
      waterGrowthLogs: 'Water & Growth Logs',
      feedStockInventory: 'Feed Stock Inventory',
      manageUsers: 'Manage Users',
      investmentExpenses: 'Investment & Expenses',
      dashboardTitle: 'Farm Overview Dashboard',
      dashboardSubtitle: 'Real-time feed tracking, pond culture progress, and operational metrics.',
      exportCsv: 'Export CSV',
      addNewPond: 'Add New Pond',
      totalPonds: 'Total Ponds',
      activePonds: 'Active Ponds',
      feedGivenToday: 'Feed Given Today',
      feedCompletion: 'Feed Completion',
      registeredPonds: 'Registered ponds',
      currentlyActive: 'Currently active',
      servantSubmissions: 'Servant submissions',
      feedsPending: 'feeds pending',
      docDays: 'DOC (Days)',
      stockingDate: 'Stocking Date',
      supervisorLabel: 'Supervisor',
      servantLabel: 'Servant',
      todaysFeedingSchedule: "Today's Feeding Schedule",
      details: 'Details',
      edit: 'Edit',
      delete: 'Delete',
      view: 'View',
      openConsole: 'Open Console',
      assignedServant: 'Assigned Servant',
      noActivePonds: 'No active ponds available.',
      totalFeedStock: 'Total Feed Stock',
      remainingFeedStock: 'Remaining Feed Stock',
      runningAerators: 'Running Aerators',
      totalAerators: 'Total Aerators',
      storeAvailability: 'Store availability',
      currentReserve: 'Current reserve',
      installedUnits: 'Installed units',
      stopped: 'stopped',
      totalAeratorsInstalled: 'Total Aerators Installed',
      operational: 'Operational',
      needsInspection: 'Needs inspection',
      status: 'Status',
      allAeratorsNormal: 'All aerators normal',
      alertRaised: 'Alert raised',
      totalFeedStockAvailable: 'Total Feed Stock Available',
      warehouseBalance: 'Warehouse balance',
      feedAddedToday: 'Feed Added Today',
      addedToday: 'Added today',
      feedUsedToday: 'Feed Used Today',
      todayConsumption: 'Today consumption',
      urgentRefillRequired: 'Urgent refill required',
      stableReserve: 'Stable reserve',
      totalShrimpCount: 'Total Shrimp Count',
      initialStock: 'Initial stock',
      currentEstimatedCount: 'Current Estimated Count',
      afterMortality: 'After mortality',
      mortalityCount: 'Mortality Count',
      recordedLosses: 'Recorded losses',
      survivalPercentage: 'Survival Percentage',
      liveShrimpRate: 'Live shrimp rate',
      feedGivenToday: 'Feed Given Today',
      acrossAllPonds: 'Across all ponds',
      feedGivenToEachPond: 'Feed Given to Each Pond',
      recentPondTotals: 'Recent pond totals',
      feedingTimeHistory: 'Feeding Time History',
      recentSchedule: 'Recent schedule',
      totalFeedConsumption: 'Total Feed Consumption',
      dailyTotal: 'Daily total',
      noFeedEntriesToday: 'No feed entries today',
      noFeedingHistory: 'No feeding history',
      onlyOwnerSupervisorCanEdit: 'Only owner or supervisor can edit these card values.'
    },
    te: {
      aquaFarming: 'అక్వా ఫార్మింగ్',
      owner: 'యజమాని',
      supervisor: 'సూపర్వైజర్',
      servant: 'సేవకురాలు',
      usernameLabel: 'యూజర్ పేరు',
      passwordLabel: 'పాస్వర్డ్',
      signInToAqua: 'అక్వా ఫార్మింగ్లో సైన్ ఇన్ చేయండి',
      secureJWT: 'సురక్షిత JWT ఎన్క్రిప్ట్ లాగిన్',
      installAquaApp: 'అప్లికేషన్ ఇన్‌స్టాల్ చేయండి',
      switchLanguage: 'English',
      logout: 'లాగ్ఔట్',
      localEngine: 'లోకల్ ఇంజిన్ (ఆఫ్‌లైన్ రెడీ)',
      ownerDashboard: 'ఎగ్జిక్యూటివ్ డాష్‌బోర్డ్',
      pondManagement: 'చెరువు నిర్వహణ',
      servantFeedingPortal: 'సేవకుడు ఫీడింగ్ పోర్టల్',
      supervisorDashboard: 'సూపర్వైజర్ మానిటరింగ్',
      waterGrowthLogs: 'నీరు & గ్రోత్ లాగ్స్',
      feedStockInventory: 'ఫీడ్ స్టాక్ ఇన్‌వెంటరీ',
      manageUsers: 'యూజర్లు నిర్వహణ',
      investmentExpenses: 'వినియోగం & ఖర్చులు',
      dashboardTitle: 'ఫామ్ అవలోవర్ డాష్‌బోర్డ్',
      dashboardSubtitle: 'రియల్-టైమ్ ఫీడ్ ట్రాకింగ్, చెరువు కల్చర్ పురోగతి మరియు ఆపరేషనల్ మెట్రిక్స్.',
      exportCsv: 'CSV ఎక్స్‌పోర్ట్',
      addNewPond: 'కొత్త చెరువు జోడించండి',
      totalPonds: 'మొత్తం చెరువులు',
      activePonds: 'క్రియాశీల చెరువులు',
      feedGivenToday: 'ఈరోజు ఇవ్వబడిన ఫీడ్',
      feedCompletion: 'ఫీడ్ పూర్తి',
      registeredPonds: 'నమోదు చేసిన చెరువులు',
      currentlyActive: 'ప్రస్తుతం క్రియాశీలంగా ఉన్నాయి',
      servantSubmissions: 'సేవకుడు సమర్పణలు',
      feedsPending: 'ఫీడ్స్ పెండింగ్',
      docDays: 'DOC (రోజులు)',
      stockingDate: 'స్టాకింగ్ డేట్',
      supervisorLabel: 'సూపర్వైజర్',
      servantLabel: 'సేవకుడు',
      todaysFeedingSchedule: 'ఈరోజు ఫీడింగ్ షెడ్యూల్',
      details: 'వివరాలు',
      edit: 'సవరించండి',
      delete: 'తొలగించండి',
      view: 'చూడండి',
      openConsole: 'కాన్సోల్ ఓపెన్ చేయండి',
      assignedServant: 'నియమించిన సేవకుడు',
      noActivePonds: 'క్రియాశీల చెరువులు లేవు.',
      totalFeedStock: 'మొత్తం ఫీడ్ స్టాక్',
      remainingFeedStock: 'మిగిలిన ఫీడ్ స్టాక్',
      runningAerators: 'రన్నింగ్ ఎయిరేటర్లు',
      totalAerators: 'మొత్తం ఎయిరేటర్లు',
      storeAvailability: 'స్టోర్ లభ్యత',
      currentReserve: 'ప్రస్తుత రిజర్వ్',
      installedUnits: 'ఇన్‌స్టాల్ చేయబడిన యూనిట్స్',
      stopped: 'ఆపు',
      totalAeratorsInstalled: 'మొత్తం ఎయిరేటర్లు ఇన్‌స్టాల్ అయ్యాయి',
      operational: 'ఆపరేషనల్',
      needsInspection: 'శోధన అవసరం',
      installedUnits: 'ఇన్‌స్టాల్ చేసిన యూనిట్స్',
      status: 'స్థితి',
      allAeratorsNormal: 'అన్ని ఎయిరేటర్లు సాధారణం',
      alertRaised: 'అలర్ట్ వచ్చింది',
      totalFeedStockAvailable: 'లభ్యమయ్యే మొత్తం ఫీడ్ స్టాక్',
      warehouseBalance: 'వార్హౌస్ బ్యాలన్స్',
      feedAddedToday: 'ఈరోజు జోడించిన ఫీడ్',
      addedToday: 'ఈరోజు జోడించబడింది',
      feedUsedToday: 'ఈరోజు ఉపయోగించిన ఫీడ్',
      todayConsumption: 'ఈరోజు వినియోగం',
      urgentRefillRequired: 'వేగంగా పునరాగమనం అవసరం',
      stableReserve: 'స్థిర రిజర్వ్',
      totalShrimpCount: 'మొత్తం ష్రింప్స్ కౌంట్',
      initialStock: 'ప్రారంభ స్టాక్',
      currentEstimatedCount: 'ప్రస్తుత అంచనా కౌంట్',
      afterMortality: 'మార్శాల తర్వాత',
      mortalityCount: 'మార్శాల కౌంట్',
      recordedLosses: 'రికార్డ్ అయిన నష్టం',
      survivalPercentage: 'సర్వైవల్ శాతం',
      liveShrimpRate: 'లైవ్ ష్రింప్స్ రేట్',
      feedGivenToday: 'ఈరోజు ఇవ్వబడిన ఫీడ్',
      acrossAllPonds: 'అన్ని చెరువుల మీద',
      feedGivenToEachPond: 'ప్రతి చెరువుకు ఇవ్వబడిన ఫీడ్',
      recentPondTotals: 'ఇటీవలి చెరువు మొత్తాలు',
      feedingTimeHistory: 'ఫీడింగ్ టైమ్ హిస్టరీ',
      recentSchedule: 'ఇటీవలి షెడ్యూల్',
      totalFeedConsumption: 'మొత్తం ఫీడ్ కన్స్యూమ్',
      dailyTotal: 'రోజువారీ మొత్తం',
      noFeedEntriesToday: 'ఈరోజు ఫీడ్ ఎంట్రీలు లేవు',
      noFeedingHistory: 'ఫీడింగ్ హిస్టరీ లేదు',
      onlyOwnerSupervisorCanEdit: 'ఈ కార్డ్ విలువలను మాత్రమే యజమాని లేదా సూపర్వైజర్ మాత్రమే సవరించగలరు.'
    }
  };

  function t(key, fallback = '') {
    return (APP_TEXT[state.language] && APP_TEXT[state.language][key]) || fallback || (APP_TEXT.en && APP_TEXT.en[key]) || '';
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translated = t(key, el.textContent.trim());
        el.textContent = translated;
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.placeholder = t(key, el.getAttribute('placeholder') || '');
      }
    });

    const toggleBtn = document.getElementById('langToggleBtn');
    if (toggleBtn) {
      const toggleLabel = toggleBtn.querySelector('span[data-i18n="switchLanguage"]');
      if (toggleLabel) {
        toggleLabel.textContent = t('switchLanguage', 'తెలుగు');
      }
    }
  }

  // Global Helper API Container
  window.AQUA_APP = window.AQUA_APP || {};

  // Quick Login Pill autofill helper
  window.AQUA_APP.fillLogin = function(username, password) {
    const uInput = document.getElementById('loginUsername');
    const pInput = document.getElementById('loginPassword');
    if (uInput && pInput) {
      uInput.value = username;
      pInput.value = password;
    }
  };

  window.AQUA_APP.toggleLanguage = function() {
    state.language = state.language === 'te' ? 'en' : 'te';
    localStorage.setItem('manthena_aqua_lang', state.language);
    applyTranslations();
    renderAll();
    showToast(state.language === 'te' ? 'తెలుగు మోడ్లో ఉంది' : 'English mode enabled');
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
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
      // Send login request to Node.js Express Backend
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        state.user = {
          username: data.user.username,
          role: data.user.role,
          name: data.user.name,
          token: data.token
        };
        localStorage.setItem('manthena_aqua_jwt', data.token);
        localStorage.setItem('manthena_aqua_user', JSON.stringify(state.user));
        
        showToast(`Welcome back, ${data.user.name}!`);
        initAuthenticatedUI();
      } else {
        // Fallback demo auth if running directly via file:// or without active server
        performOfflineFallbackAuth(username, password);
      }
    } catch (err) {
      performOfflineFallbackAuth(username, password);
    }
  });

  function performOfflineFallbackAuth(username, password) {
    const u = username.toLowerCase();
    let userObj = null;
    if (u === 'manthena' && password === 'owner123') {
      userObj = { username: 'manthena', role: 'owner', name: 'Bhatraju Raju' };
    } else if (u === 'rajesh' && password === 'super123') {
      userObj = { username: 'rajesh', role: 'supervisor', name: 'Rajesh Kumar' };
    } else if (u === 'ramu' && password === 'servant123') {
      userObj = { username: 'ramu', role: 'servant', name: 'Ramu' };
    }

    if (userObj) {
      userObj.token = 'demo_token_' + Date.now();
      state.user = userObj;
      localStorage.setItem('manthena_aqua_jwt', userObj.token);
      localStorage.setItem('manthena_aqua_user', JSON.stringify(userObj));
      showToast(`Welcome, ${userObj.name}!`);
      initAuthenticatedUI();
    } else {
      showToast('Invalid username or password. (Try demo pills above)', 'error');
    }
  }

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

    if (!state.syncCleanup) {
      state.syncCleanup = window.AQUA_STORAGE.listenForDashboardUpdates(async () => {
        if (state.user) {
          await loadData();
        }
      });
    }

    applyTranslations();
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

  // Data Loading Strategy
  async function loadData() {
    try {
      const res = await fetch('/api/ponds');
      if (res.ok) {
        state.ponds = await res.json();
      } else {
        state.ponds = await window.AQUA_STORAGE.getPonds();
      }
    } catch(e) {
      state.ponds = await window.AQUA_STORAGE.getPonds();
    }

    state.feedLogs = toArray(await window.AQUA_STORAGE.getFeedLogs?.());
    state.waterLogs = toArray(await window.AQUA_STORAGE.getWaterLogs?.());
    state.growthLogs = toArray(await window.AQUA_STORAGE.getGrowthLogs?.());
    state.mortalityLogs = toArray(await window.AQUA_STORAGE.getMortalityLogs?.());
    state.feedStock = toArray(await window.AQUA_STORAGE.getFeedStock?.());
    if (state.user?.role === 'owner') {
      try {
        const usersRes = await fetch('/api/users', { headers: getAuthHeaders() });
        if (usersRes.ok) {
          state.users = await usersRes.json();
        }
      } catch (e) {
        state.users = [];
      }
    }
    state.expenses = toArray(await window.AQUA_STORAGE.getExpenses?.());
    state.operationalLogs = toArray(await fetch('/api/operational-logs').then(r => r.json()).catch(() => []));
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

  function getAuthHeaders(extraHeaders = {}) {
    const headers = {
      ...(extraHeaders || {}),
      'Content-Type': 'application/json'
    };
    const token = state.user?.token || localStorage.getItem('manthena_aqua_jwt');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
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

  function renderAll() {
    applyTranslations();
    renderKPIs();
    renderPondGridOrTable();
    renderServantPonds();
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
    renderUsersTable();
    applyRolePermissions();
  }

  function canEditDashboardCards() {
    return ['owner', 'supervisor', 'servant'].includes((state.user && state.user.role) || '');
  }

  function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const users = toArray(state.users || []);
    const query = (document.getElementById('userSearchInput')?.value || '').toLowerCase();
    const role = (document.getElementById('userRoleFilter')?.value || 'all').toLowerCase();
    const status = (document.getElementById('userStatusFilter')?.value || 'all').toLowerCase();

    const filteredUsers = users.filter(user => {
      const normalized = window.AQUA_USER_UTILS ? window.AQUA_USER_UTILS.normalizeUserRecord(user, user?.uid || user?.id) : user;
      const normalizedStatus = user?.isSuspended ? 'suspended' : (user?.isActive === false ? 'inactive' : (normalized.status || 'active'));
      const searchText = [normalized.userId, normalized.fullName, normalized.mobile, normalized.email, normalized.username, normalized.role, (normalized.assignedPonds || []).join(','), normalizedStatus].join(' ').toLowerCase();
      const matchesQuery = !query || searchText.includes(query);
      const matchesRole = role === 'all' || normalized.role === role;
      const matchesStatus = status === 'all' || normalizedStatus === status;
      return matchesQuery && matchesRole && matchesStatus;
    });

    tbody.innerHTML = filteredUsers.map(user => {
      const normalized = window.AQUA_USER_UTILS ? window.AQUA_USER_UTILS.normalizeUserRecord(user, user?.uid || user?.id) : user;
      const normalizedStatus = user?.isSuspended ? 'suspended' : (user?.isActive === false ? 'inactive' : (normalized.status || 'active'));
      const statusText = normalizedStatus === 'suspended' ? 'Suspended' : normalizedStatus === 'inactive' ? 'Inactive' : 'Active';
      const lastLogin = normalized.lastLogin ? new Date(normalized.lastLogin).toLocaleDateString() : '—';
      return `
        <tr>
          <td>${normalized.userId || '-'} </td>
          <td>${normalized.fullName || normalized.name || '-'} </td>
          <td>${normalized.role || 'servant'}</td>
          <td>${normalized.mobile || '-'}</td>
          <td>${normalized.username || '-'}</td>
          <td><span class="status-pill ${normalizedStatus === 'suspended' ? 'inactive' : 'active'}">${statusText}</span></td>
          <td>${normalized.createdAt ? new Date(normalized.createdAt).toLocaleDateString() : '-'}</td>
          <td>${lastLogin}</td>
          <td>
            <button class="btn btn-secondary btn-sm owner-only" onclick="window.AQUA_APP.openUserModal(${JSON.stringify(normalized).replace(/"/g, '&quot;')})">Edit</button>
            <button class="btn btn-danger btn-sm owner-only" onclick="window.AQUA_APP.deleteUser('${normalized.id || normalized._id || normalized.userId}')">Delete</button>
          </td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="9" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No users matched the filters.</td></tr>`;
  }

  window.AQUA_APP.refreshUsers = async function() {
    if (state.user?.role !== 'owner') {
      showToast('Only the owner can manage users.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/users', { headers: getAuthHeaders() });
      if (!res.ok) {
        showToast('Unable to load users.', 'error');
        return;
      }
      state.users = await res.json();
      renderUsersTable();
    } catch (e) {
      showToast('Unable to load users.', 'error');
    }
  };

  window.AQUA_APP.openUserModal = function(user = null) {
    if (state.user?.role !== 'owner') {
      showToast('Only the owner can manage users.', 'error');
      return;
    }

    const modal = document.getElementById('userManagementModal');
    if (!modal) return;

    const submitBtn = document.getElementById('userFormSubmitBtn');
    const normalized = user ? (window.AQUA_USER_UTILS ? window.AQUA_USER_UTILS.normalizeUserRecord(user, user?.uid || user?.id) : user) : null;
    const normalizedStatus = normalized?.isSuspended ? 'suspended' : (normalized?.isActive === false ? 'inactive' : (normalized?.status || 'active'));

    document.getElementById('userFormUserId').value = normalized?.id || normalized?._id || normalized?.userId || '';
    document.getElementById('userFormName').value = normalized?.fullName || normalized?.name || '';
    document.getElementById('userFormMobile').value = normalized?.mobile || '';
    document.getElementById('userFormUsername').value = normalized?.username || '';
    document.getElementById('userFormEmail').value = normalized?.email || '';
    document.getElementById('userFormRole').value = normalized?.role || 'servant';
    document.getElementById('userFormUserId').setAttribute('placeholder', 'Leave blank to auto-create a new user ID');
    document.getElementById('userFormAssignedPonds').value = (normalized?.assignedPonds || []).join(', ');
    document.getElementById('userFormPhoto').value = normalized?.profilePhoto || normalized?.photo || '';
    document.getElementById('userFormStatus').value = normalizedStatus;
    document.getElementById('userFormPassword').value = '';
    document.getElementById('userFormForceChange').checked = Boolean(normalized?.requiresPasswordChange || normalized?.forcePasswordChange);
    document.getElementById('userFormNotes').value = normalized?.accountNotes || '';
    submitBtn.textContent = normalized ? 'Save User' : 'Create User';
    modal.classList.add('open');
  };

  window.AQUA_APP.deleteUser = async function(userId) {
    if (state.user?.role !== 'owner') {
      showToast('Only the owner can manage users.', 'error');
      return;
    }
    if (!confirm('Delete this user?')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        showToast('Unable to delete user.', 'error');
        return;
      }
      showToast('User deleted successfully.');
      await window.AQUA_APP.refreshUsers();
    } catch (e) {
      showToast('Unable to delete user.', 'error');
    }
  };

  document.getElementById('userManagementForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.user?.role !== 'owner') {
      showToast('Only the owner can manage users.', 'error');
      return;
    }

    const form = document.getElementById('userManagementForm');
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

    if (!userId && !password) {
      showToast('A password is required when creating a new user.', 'error');
      return;
    }

    if (!userId && !name) {
      showToast('Name is required when creating a new user.', 'error');
      return;
    }

    if (!userId && !username) {
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
      const method = userId ? 'PUT' : 'POST';
      const url = userId ? `/api/users/${userId}` : '/api/users';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || 'Unable to save user.', 'error');
        return;
      }
      showToast(data.message || 'User saved successfully.');
      document.getElementById('userManagementModal').classList.remove('open');
      form.reset();
      await window.AQUA_APP.refreshUsers();
    } catch (e) {
      showToast('Unable to save user.', 'error');
    }
  });

  document.getElementById('userSearchInput')?.addEventListener('input', renderUsersTable);
  document.getElementById('userRoleFilter')?.addEventListener('change', renderUsersTable);
  document.getElementById('userStatusFilter')?.addEventListener('change', renderUsersTable);

  document.getElementById('feedStockForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.user?.role !== 'owner') {
      showToast('Only the owner can update feed stock details.', 'error');
      return;
    }

    const select = document.getElementById('feedStockSelect');
    const productCode = select?.value || '';
    const bagsInStock = parseInt(document.getElementById('feedStockBagsInput').value || '0', 10);
    const kgPerBag = parseInt(document.getElementById('feedStockKgPerBagInput').value || '0', 10);
    const alertLevelBags = parseInt(document.getElementById('feedStockAlertInput').value || '0', 10);

    const feedStock = toArray(state.feedStock);
    const existingIndex = feedStock.findIndex(item => (item.code || item.brand) === productCode);
    const existingItem = existingIndex >= 0 ? feedStock[existingIndex] : { code: productCode, brand: productCode };
    const updatedItem = {
      ...existingItem,
      code: productCode,
      brand: productCode,
      bagsInStock,
      kgPerBag,
      alertLevelBags,
      updatedAt: new Date().toISOString(),
      savedBy: state.user?.name || 'Owner'
    };

    if (existingIndex >= 0) {
      feedStock[existingIndex] = updatedItem;
    } else {
      feedStock.push(updatedItem);
    }

    state.feedStock = feedStock;
    await window.AQUA_STORAGE.saveFeedStock(feedStock);
    renderStockManagement();
    showToast('Feed stock inventory updated.');
  });

  function applyRolePermissions() {
    if (!state.user) return;
    const role = state.user.role;
    document.querySelectorAll('.owner-only').forEach(el => {
      el.style.display = (role === 'owner') ? '' : 'none';
    });
    document.querySelectorAll('.supervisor-only').forEach(el => {
      el.style.display = (role === 'owner' || role === 'supervisor') ? '' : 'none';
    });

    if (role === 'servant' && (state.activeTab === 'dashboard' || state.activeTab === 'stock')) {
      switchTab('servant-feeding');
    }
  }

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
      { title: t('totalPonds', 'Total Ponds'), value: totalPonds, subtitle: t('registeredPonds', 'Registered ponds') },
      { title: t('activePonds', 'Active Ponds'), value: `${activePonds} ${t('activePonds', 'Active')}`, subtitle: t('currentlyActive', 'Currently active') },
      { title: t('feedGivenToday', 'Feed Given Today'), value: `${totalFeedKg.toFixed(1)} KG`, subtitle: t('servantSubmissions', 'Servant submissions') },
      { title: t('feedCompletion', 'Feed Completion'), value: `${feedCompletionRate}%`, subtitle: `${pendingFeeds} ${t('feedsPending', 'feeds pending')}` }
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
              <span class="detail-label">${t('docDays', 'DOC (Days)')}</span>
              <span class="detail-val doc-highlight">DOC ${p.doc}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">${t('stockingDate', 'Stocking Date')}</span>
              <span class="detail-val">${p.stockingDate || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">${t('supervisorLabel', 'Supervisor')}</span>
              <span class="detail-val">${p.supervisor || 'Unassigned'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">${t('servantLabel', 'Servant')}</span>
              <span class="detail-val">${p.servant || 'Unassigned'}</span>
            </div>
          </div>

          <div class="feed-schedule-row">
            <div class="feed-schedule-header">
              <span>${t('todaysFeedingSchedule', "Today's Feeding Schedule")}</span>
              <span>${todayLogs.length}/4 Done</span>
            </div>
            <div class="feed-slots-grid">${slotHtml}</div>
          </div>

          <div class="pond-card-actions" onclick="event.stopPropagation();">
            <button class="btn btn-secondary btn-sm" onclick="window.AQUA_APP.openPondDetails('${pid}')"><i class="fas fa-chart-line"></i> ${t('details', 'Details')}</button>
            <button class="btn btn-secondary btn-sm owner-only" onclick="window.AQUA_APP.editPond('${pid}')"><i class="fas fa-edit"></i> ${t('edit', 'Edit')}</button>
            <button class="btn btn-danger btn-sm owner-only" onclick="window.AQUA_APP.deletePond('${pid}')"><i class="fas fa-trash"></i> ${t('delete', 'Delete')}</button>
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
              <button class="btn btn-secondary btn-sm" onclick="window.AQUA_APP.openPondDetails('${pid}')">${t('view', 'View')}</button>
              <button class="btn btn-secondary btn-sm owner-only" onclick="window.AQUA_APP.editPond('${pid}')">${t('edit', 'Edit')}</button>
              <button class="btn btn-danger btn-sm owner-only" onclick="window.AQUA_APP.deletePond('${pid}')">${t('delete', 'Delete')}</button>
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
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">${t('noActivePonds', 'No active ponds available.')}</div>`;
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
              <span class="detail-label">${t('docDays', 'DOC (Days)')}</span>
              <span class="detail-val doc-highlight">DOC ${p.doc}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">${t('assignedServant', 'Assigned Servant')}</span>
              <span class="detail-val">${p.servant || 'Unassigned'}</span>
            </div>
          </div>
          <div style="margin-top:0.85rem; text-align:right;">
            <span style="font-size:0.8rem; color:var(--primary); font-weight:600;">${t('openConsole', 'Open Console')} <i class="fas fa-arrow-right"></i></span>
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
    loadServantPanelDataForPond(pondId).then(() => {
      renderServantQuickParameters(pondId);
      renderServantHistoryLogs(pondId);
      renderServantOperationalPanels();
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
      const feedLogResponse = await fetch('/api/feed-logs', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newLog)
      });

      if (!feedLogResponse.ok) {
        const errorPayload = await feedLogResponse.json().catch(() => ({}));
        throw new Error(errorPayload.message || 'Feed log save was rejected by the server.');
      }
    } catch (e) {
      showToast(e.message || 'Unable to save feed log to the server.', 'error');
      return;
    }

    await window.AQUA_STORAGE.saveFeedLog(newLog);
    showToast(`Feed update recorded for ${pondId} (${state.selectedFeedSlot}: ${feedQtyKg} KG)`);
    
    document.getElementById('servantFeedQty').value = '';
    document.getElementById('servantNotes').value = '';
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
      await fetch('/api/water-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWq)
      });
    } catch(e) {}

    await window.AQUA_STORAGE.saveWaterLog(newWq);
    showToast(`Water quality log saved for ${pondId}`);
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
      await fetch('/api/water-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      pondId: pondId,
      doc: pond ? pond.doc : 60,
      abw: abw,
      weeklyGrowth: weeklyGrowth,
      survivalRate: survivalRate,
      calculatedBiomassKg: calculatedBiomassKg,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      await fetch('/api/growth-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGr)
      });
    } catch(e) {}

    await window.AQUA_STORAGE.saveGrowthLog(newGr);
    showToast(`Shrimp growth sampling recorded for ${pondId}`);
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
      pondId,
      date: todayStr,
      count,
      cause,
      notes,
      enteredBy: state.user?.name || 'Servant'
    };

    try {
      await fetch('/api/mortality-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      await fetch('/api/mortality-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {}

    state.mortalityLogs = [...state.mortalityLogs, payload];
    renderServantOperationalPanels();
    renderOwnerOpsSummary();
    showToast(`Recorded mortality of ${count} shrimp in ${pondId} due to: ${cause}`);

    document.getElementById('servantMortalityCount').value = '';
    document.getElementById('servantMortalityNotes').value = '';
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
    const select = document.getElementById('feedStockSelect');
    if (!container) return;

    const feedStock = toArray(state.feedStock);
    if (select) {
      const currentValue = select.value || (feedStock[0] && (feedStock[0].code || feedStock[0].brand)) || '';
      select.innerHTML = feedStock.length
        ? feedStock.map(item => `<option value="${item.code || item.brand}">${item.brand || item.code}</option>`).join('')
        : '<option value="">No feed stock found</option>';
      if (currentValue) select.value = currentValue;
    }

    container.innerHTML = feedStock.map(s => {
      const isLow = Number(s.bagsInStock || 0) <= Number(s.alertLevelBags || 0);
      return `
        <div class="kpi-card ${isLow ? 'rose' : 'emerald'}">
          <div class="kpi-header">
            <span>${s.brand || s.code || 'Feed Stock'}</span>
            <i class="fas fa-boxes kpi-icon"></i>
          </div>
          <div style="font-weight:700; font-size:1.1rem; color:var(--text-main);">${s.code || s.brand || 'N/A'}</div>
          <div class="kpi-value" style="margin-top:0.5rem;">${Number(s.bagsInStock || 0)} <span style="font-size:1rem; font-weight:500;">Bags</span></div>
          <div class="kpi-subtitle">${Number(s.bagsInStock || 0) * Number(s.kgPerBag || 0)} Total KG</div>
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

    const feedByPondSummary = Object.entries(
      todayFeedLogs.reduce((acc, log) => {
        acc[log.pondId] = (acc[log.pondId] || 0) + (parseFloat(log.feedQtyKg) || 0);
        return acc;
      }, {})
    ).map(([pondId, qty]) => `${pondId}: ${Number(qty).toFixed(1)} KG`).join(' • ') || 'No feed entries today';

    const feedingTimeHistory = todayFeedLogs.length
      ? todayFeedLogs.slice(0, 4).map(log => `${log.pondId} ${log.slot} (${Number(log.feedQtyKg || 0).toFixed(1)} KG)`).join(' • ')
      : 'No feeding history';

    const defaults = {
      feedStockTotal: 500,
      feedAddedToday: 0,
      feedUsedToday: todayFeed,
      aeratorTotal: 6,
      aeratorRunning: 5,
      shrimpInitial: 400000,
      mortalityCount: toArray(state.mortalityLogs).reduce((sum, item) => sum + (parseInt(item.count || item.mortalityCount || 0, 10) || 0), 0),
      dailyFeedGivenToday: `${todayFeed.toFixed(1)} KG`,
      feedByPondSummary,
      feedingTimeHistory,
      totalFeedConsumption: `${todayFeed.toFixed(1)} KG`
    };

    const panel = Object.assign({}, defaults, savedPanel || {});
    panel.feedRemaining = Math.max((Number(panel.feedStockTotal) || 0) + (Number(panel.feedAddedToday) || 0) - (Number(panel.feedUsedToday) || 0), 0);
    panel.aeratorStopped = Math.max((Number(panel.aeratorTotal) || 0) - (Number(panel.aeratorRunning) || 0), 0);
    panel.aeratorStatus = panel.aeratorStopped === 0 ? 'ON' : 'WARNING';
    panel.currentEstimatedCount = Math.max((Number(panel.shrimpInitial) || 0) - (Number(panel.mortalityCount) || 0), 0);
    panel.survivalPercentage = panel.shrimpInitial ? Math.round((panel.currentEstimatedCount / panel.shrimpInitial) * 100) : 0;
    panel.dailyFeedGivenToday = panel.dailyFeedGivenToday || `${todayFeed.toFixed(1)} KG`;
    panel.feedByPondSummary = panel.feedByPondSummary || feedByPondSummary;
    panel.feedingTimeHistory = panel.feedingTimeHistory || feedingTimeHistory;
    panel.totalFeedConsumption = panel.totalFeedConsumption || `${todayFeed.toFixed(1)} KG`;
    const currentEstimatedCount = panel.currentEstimatedCount;
    const survivalPercentage = panel.survivalPercentage;

    function kpiCardHtml(title, iconClass, valueHtml, subtitle, key) {
      const canEditCard = ['owner', 'supervisor'].includes((state.user && state.user.role) || '');
      const editBtn = key && canEditCard ? `<button class="card-edit-btn" data-key="${key}" aria-label="${t('edit', 'Edit')}"><i class="fas fa-edit"></i></button>` : '';
      return `<div class="kpi-card"><div class="kpi-header"><span>${title}</span><i class="${iconClass}"></i>${editBtn}</div><div class="kpi-value" data-key-value="${key || ''}">${valueHtml}</div><div class="kpi-subtitle">${subtitle}</div></div>`;
    }

    if (servantSummary) {
      servantSummary.innerHTML = `
        ${kpiCardHtml(t('totalFeedStock', 'Total Feed Stock'), 'fas fa-boxes', `${panel.feedStockTotal} KG`, t('storeAvailability', 'Store availability'), 'feedStockTotal')}
        ${kpiCardHtml(t('remainingFeedStock', 'Remaining Feed Stock'), 'fas fa-warehouse', `${panel.feedRemaining} KG`, t('currentReserve', 'Current reserve'), null)}
        ${kpiCardHtml(t('runningAerators', 'Running Aerators'), 'fas fa-fan', `${panel.aeratorRunning}`, `${panel.aeratorStopped} ${t('stopped', 'stopped')}`, 'aeratorRunning')}
        ${kpiCardHtml(t('totalAerators', 'Total Aerators'), 'fas fa-fan', `${panel.aeratorTotal}`, t('installedUnits', 'Installed units'), 'aeratorTotal')}
      `;
    }

    if (aeratorPanel) {
      aeratorPanel.innerHTML = `
        ${kpiCardHtml(t('totalAeratorsInstalled', 'Total Aerators Installed'), 'fas fa-fan', panel.aeratorTotal, t('installedUnits', 'Installed units'), 'aeratorTotal')}
        ${kpiCardHtml(t('runningAerators', 'Running Aerators'), 'fas fa-power-off', panel.aeratorRunning, t('operational', 'Operational'), 'aeratorRunning')}
        ${kpiCardHtml('Stopped Aerators', 'fas fa-stop-circle', panel.aeratorStopped, t('needsInspection', 'Needs inspection'), null)}
        ${kpiCardHtml(t('status', 'Status'), 'fas fa-broadcast-tower', panel.aeratorStatus, panel.aeratorStatus === 'ON' ? t('allAeratorsNormal', 'All aerators normal') : t('alertRaised', 'Alert raised'), null)}
      `;
    }

    if (stockPanel) {
      stockPanel.innerHTML = `
        ${kpiCardHtml(t('totalFeedStockAvailable', 'Total Feed Stock Available'), 'fas fa-box-open', `${panel.feedStockTotal} KG`, t('warehouseBalance', 'Warehouse balance'), 'feedStockTotal')}
        ${kpiCardHtml(t('feedAddedToday', 'Feed Added Today'), 'fas fa-plus-circle', `${panel.feedAddedToday} KG`, t('addedToday', 'Added today'), 'feedAddedToday')}
        ${kpiCardHtml(t('feedUsedToday', 'Feed Used Today'), 'fas fa-weight-hanging', `${Number(panel.feedUsedToday || 0).toFixed(1)} KG`, t('todayConsumption', 'Today consumption'), 'feedUsedToday')}
        ${kpiCardHtml(t('remainingFeedStock', 'Remaining Feed Stock'), 'fas fa-warehouse', `${panel.feedRemaining} KG`, panel.feedRemaining < 120 ? t('urgentRefillRequired', 'Urgent refill required') : t('stableReserve', 'Stable reserve'), null)}
      `;
    }

    if (shrimpPanel) {
      shrimpPanel.innerHTML = `
        ${kpiCardHtml(t('totalShrimpCount', 'Total Shrimp Count'), 'fas fa-fish', Number(panel.shrimpInitial || 0), t('initialStock', 'Initial stock'), 'shrimpInitial')}
        ${kpiCardHtml(t('currentEstimatedCount', 'Current Estimated Count'), 'fas fa-chart-line', Number(panel.currentEstimatedCount || 0), t('afterMortality', 'After mortality'), null)}
        ${kpiCardHtml(t('mortalityCount', 'Mortality Count'), 'fas fa-skull-crossbones', Number(panel.mortalityCount || 0), t('recordedLosses', 'Recorded losses'), 'mortalityCount')}
        ${kpiCardHtml(t('survivalPercentage', 'Survival Percentage'), 'fas fa-percentage', `${panel.survivalPercentage}%`, t('liveShrimpRate', 'Live shrimp rate'), null)}
      `;
    }

    if (dailyFeedPanel) {
      dailyFeedPanel.innerHTML = `
        ${kpiCardHtml(t('feedGivenToday', 'Feed Given Today'), 'fas fa-weight-hanging', panel.dailyFeedGivenToday || `${todayFeed.toFixed(1)} KG`, t('acrossAllPonds', 'Across all ponds'), 'dailyFeedGivenToday')}
        ${kpiCardHtml(t('feedGivenToEachPond', 'Feed Given to Each Pond'), 'fas fa-water', panel.feedByPondSummary || feedByPondSummary, t('recentPondTotals', 'Recent pond totals'), 'feedByPondSummary')}
        ${kpiCardHtml(t('feedingTimeHistory', 'Feeding Time History'), 'fas fa-history', panel.feedingTimeHistory || feedingTimeHistory, t('recentSchedule', 'Recent schedule'), 'feedingTimeHistory')}
        ${kpiCardHtml(t('totalFeedConsumption', 'Total Feed Consumption'), 'fas fa-chart-bar', panel.totalFeedConsumption || `${todayFeed.toFixed(1)} KG`, t('dailyTotal', 'Daily total'), 'totalFeedConsumption')}
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
    if (!canEditDashboardCards()) {
      showToast(t('onlyOwnerSupervisorCanEdit', 'Only owner or supervisor can edit these card values.'), 'error');
      return false;
    }
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
      if (!canEditDashboardCards()) {
        showToast(t('onlyOwnerSupervisorCanEdit', 'Only owner or supervisor can edit these card values.'), 'error');
        return;
      }
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
      await window.AQUA_STORAGE.saveDashboardCollectionEntry('aerators', pondId, payload);
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
      await window.AQUA_STORAGE.saveDashboardCollectionEntry('feedStock', pondId, payload);
      document.getElementById('feedRemainingInput').value = remaining;
      document.getElementById('feedStockSaveMsg').textContent = 'Saved';
      showToast('Feed stock saved');
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

    const pondId = state.selectedPondId || (state.ponds[0] && (state.ponds[0].pondId || state.ponds[0].id));
    const urgentCount = toArray(state.ownerNotifications).length;
    const todayFeedLogs = toArray(state.feedLogs).filter(log => log.date === new Date().toISOString().split('T')[0]);
    const savedPanel = pondId ? (JSON.parse(localStorage.getItem(`manthena_aqua_panel_${pondId}`) || 'null') || {}) : {};
    const feedStockTotal = Number(savedPanel.feedStockTotal || 500);
    const feedAddedToday = Number(savedPanel.feedAddedToday || 0);
    const feedUsedToday = Number(savedPanel.feedUsedToday || todayFeedLogs.reduce((sum, log) => sum + (parseFloat(log.feedQtyKg) || 0), 0));
    const remainingFeed = Math.max(feedStockTotal + feedAddedToday - feedUsedToday, 0);
    const mortalityCount = Number(savedPanel.mortalityCount || toArray(state.mortalityLogs).reduce((sum, item) => sum + (parseInt(item.count || item.mortalityCount || 0, 10) || 0), 0));
    const shrimpInitial = Number(savedPanel.shrimpInitial || 400000);
    const currentEstimatedCount = Math.max(shrimpInitial - mortalityCount, 0);
    const runningAerators = Number(savedPanel.aeratorRunning || 5);

    container.innerHTML = `
      <div class="kpi-card emerald"><div class="kpi-header"><span>Total Feed Stock</span><i class="fas fa-boxes"></i></div><div class="kpi-value">${feedStockTotal} KG</div><div class="kpi-subtitle">Warehouse stock</div></div>
      <div class="kpi-card amber"><div class="kpi-header"><span>Remaining Feed Stock</span><i class="fas fa-warehouse"></i></div><div class="kpi-value">${remainingFeed} KG</div><div class="kpi-subtitle">Low threshold 120 KG</div></div>
      <div class="kpi-card amber"><div class="kpi-header"><span>Feed Used Today</span><i class="fas fa-weight-hanging"></i></div><div class="kpi-value">${feedUsedToday.toFixed(1)} KG</div><div class="kpi-subtitle">Servant submissions</div></div>
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
        await fetch(`/api/ponds/${pondId}`, { method: 'DELETE' });
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
      await fetch('/api/ponds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content-section').forEach(s => s.classList.remove('active'));
    
    const targetTabBtn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    const targetSection = document.getElementById(`tab-${tabId}`);

    if (targetTabBtn) targetTabBtn.classList.add('active');
    if (targetSection) targetSection.classList.add('active');
    state.activeTab = tabId;
  }

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      switchTab(e.currentTarget.dataset.tab);
    });
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
      await fetch('/api/operational-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Check saved user session on startup
  checkSavedAuth();
});
