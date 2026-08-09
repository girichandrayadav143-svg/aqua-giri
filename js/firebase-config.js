/**
 * Aqua Farm Management System - Firebase & Storage Configuration Engine
 * Owner: Bhatraju Raju
 * Supports both Live Firebase Firestore and Instant LocalStorage Fallback.
 */

window.AQUA_STORAGE = (function() {
  const STORAGE_KEY_PONDS = 'manthena_aqua_ponds_v1';
  const STORAGE_KEY_FEED_LOGS = 'manthena_aqua_feed_logs_v1';
  const STORAGE_KEY_WATER_LOGS = 'manthena_aqua_water_logs_v1';
  const STORAGE_KEY_GROWTH_LOGS = 'manthena_aqua_growth_logs_v1';
  const STORAGE_KEY_MORTALITY_LOGS = 'manthena_aqua_mortality_logs_v1';
  const STORAGE_KEY_STOCK = 'manthena_aqua_stock_v1';
  const STORAGE_KEY_SEED = 'manthena_aqua_seed_stock_v1';
  const STORAGE_KEY_EXPENSES = 'manthena_aqua_expenses_v1';
  const STORAGE_KEY_EDIT_HISTORY = 'manthena_aqua_edit_history_v1';
  const STORAGE_KEY_CONFIG = 'manthena_aqua_firebase_cfg';
  const STORAGE_KEY_SERVANT_PANELS = 'manthena_aqua_servant_panels_v1';

  // Default Firebase Configuration Credentials Placeholder
  let firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "aqua-farming.firebaseapp.com",
    projectId: "aqua-farming",
    storageBucket: "aqua-farming.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
  };

  let isFirebaseActive = false;
  let db = null;

  // Initial Seed Data for Bhatraju Raju's Farm
  const initialPondsSeed = [
    {
      id: "P001",
      name: "Pond 1",
      size: 5,
      stockingDate: "2026-05-15",
      doc: 67,
      status: "Active",
      supervisor: "Rajesh Kumar",
      servant: "Ramu",
      remarks: "High growth rate, regular tray monitoring",
      density: "45 PL/m²",
      initialStock: 450000
    },
    {
      id: "P002",
      name: "Pond 2",
      size: 5,
      stockingDate: "2026-05-20",
      doc: 62,
      status: "Active",
      supervisor: "Rajesh Kumar",
      servant: "Srinivas",
      remarks: "Normal aeration schedule",
      density: "40 PL/m²",
      initialStock: 400000
    },
    {
      id: "P003",
      name: "Pond 3",
      size: 5,
      stockingDate: "2026-06-01",
      doc: 50,
      status: "Active",
      supervisor: "Suresh Varma",
      servant: "Ramu",
      remarks: "Water exchange performed on Day 45",
      density: "50 PL/m²",
      initialStock: 500000
    }
  ];

  const initialFeedLogs = [
    {
      id: "fl_1",
      pondId: "P001",
      date: new Date().toISOString().split('T')[0],
      slot: "07:00 AM",
      feedQtyKg: 35,
      feedType: "Vannamei Grower #3",
      servant: "Ramu",
      timestamp: "07:05 AM",
      checkTime: "08:30 AM",
      consumptionStatus: "100% Consumed",
      notes: "Shrimp active on tray"
    },
    {
      id: "fl_2",
      pondId: "P001",
      date: new Date().toISOString().split('T')[0],
      slot: "10:00 AM",
      feedQtyKg: 35,
      feedType: "Vannamei Grower #3",
      servant: "Ramu",
      timestamp: "10:02 AM",
      checkTime: "11:30 AM",
      consumptionStatus: "75% Consumed",
      notes: "Slight feed residue in tray #2"
    },
    {
      id: "fl_3",
      pondId: "P002",
      date: new Date().toISOString().split('T')[0],
      slot: "07:00 AM",
      feedQtyKg: 30,
      feedType: "Vannamei Grower #3",
      servant: "Srinivas",
      timestamp: "07:10 AM",
      checkTime: "08:30 AM",
      consumptionStatus: "100% Consumed",
      notes: "Good appetite"
    }
  ];

  const initialWaterQuality = [
    {
      id: "wq_1",
      pondId: "P001",
      date: new Date().toISOString().split('T')[0],
      time: "06:30 AM",
      ph: 7.8,
      do: 6.2, // Dissolved Oxygen (ppm)
      salinity: 22, // ppt
      temperature: 28.5, // °C
      alkalinity: 120,
      transparency: 35, // cm
      ammonia: 0.04,
      nitrate: 4.5,
      enteredBy: "Rajesh Kumar"
    },
    {
      id: "wq_2",
      pondId: "P002",
      date: new Date().toISOString().split('T')[0],
      time: "06:45 AM",
      ph: 7.9,
      do: 5.8,
      salinity: 24,
      temperature: 28.8,
      alkalinity: 115,
      transparency: 32,
      ammonia: 0.05,
      nitrate: 4.8,
      enteredBy: "Rajesh Kumar"
    }
  ];

  const initialGrowthLogs = [
    {
      id: "gr_1",
      pondId: "P001",
      doc: 60,
      abw: 16.5, // Average Body Weight in grams
      weeklyGrowth: 2.2,
      survivalRate: 85,
      calculatedBiomassKg: 6311,
      date: "2026-07-14"
    },
    {
      id: "gr_2",
      pondId: "P001",
      doc: 67,
      abw: 18.7,
      weeklyGrowth: 2.2,
      survivalRate: 84,
      calculatedBiomassKg: 7059,
      date: new Date().toISOString().split('T')[0]
    }
  ];

  const initialFeedStock = [
    { id: "stk_1", brand: "CP Feed", code: "Grower #2", bagsInStock: 80, kgPerBag: 25, alertLevelBags: 20 },
    { id: "stk_2", brand: "CP Feed", code: "Grower #3", bagsInStock: 140, kgPerBag: 25, alertLevelBags: 30 },
    { id: "stk_3", brand: "Grobest", code: "Finisher #4", bagsInStock: 60, kgPerBag: 25, alertLevelBags: 15 }
  ];

  const initialSeedStock = [
    { id: "seed_1", seedType: "Vannamei PL", totalUnits: 2500, usedUnits: 400, minimumLimit: 500 },
    { id: "seed_2", seedType: "Tiger PL", totalUnits: 1800, usedUnits: 200, minimumLimit: 300 }
  ];

  // Helper to load stored credentials or check Firebase API key
  function initStorageEngine() {
    const savedCfg = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (savedCfg) {
      try {
        firebaseConfig = JSON.parse(savedCfg);
      } catch(e) {}
    }

    // Check if Firebase JS SDK is loaded and configured with valid non-placeholder credentials
    if (window.firebase && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_FIREBASE")) {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        isFirebaseActive = true;
        console.log("🔥 Connected to Firebase Firestore");
      } catch (err) {
        console.warn("Firebase Init failed, defaulting to Local Storage fallback.", err);
        isFirebaseActive = false;
      }
    } else {
      isFirebaseActive = false;
      console.log("⚡ Using Local Storage Engine (Works 100% Offline / Local)");
    }

    // Ensure Local Seed Data exists if local mode or initial launch
    if (!localStorage.getItem(STORAGE_KEY_PONDS)) {
      localStorage.setItem(STORAGE_KEY_PONDS, JSON.stringify(initialPondsSeed));
    }
    if (!localStorage.getItem(STORAGE_KEY_FEED_LOGS)) {
      localStorage.setItem(STORAGE_KEY_FEED_LOGS, JSON.stringify(initialFeedLogs));
    }
    if (!localStorage.getItem(STORAGE_KEY_WATER_LOGS)) {
      localStorage.setItem(STORAGE_KEY_WATER_LOGS, JSON.stringify(initialWaterQuality));
    }
    if (!localStorage.getItem(STORAGE_KEY_GROWTH_LOGS)) {
      localStorage.setItem(STORAGE_KEY_GROWTH_LOGS, JSON.stringify(initialGrowthLogs));
    }
    if (!localStorage.getItem(STORAGE_KEY_MORTALITY_LOGS)) {
      localStorage.setItem(STORAGE_KEY_MORTALITY_LOGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEY_STOCK)) {
      localStorage.setItem(STORAGE_KEY_STOCK, JSON.stringify(initialFeedStock));
    }
    if (!localStorage.getItem(STORAGE_KEY_SEED)) {
      localStorage.setItem(STORAGE_KEY_SEED, JSON.stringify(initialSeedStock));
    }
    if (!localStorage.getItem(STORAGE_KEY_EXPENSES)) {
      localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEY_EDIT_HISTORY)) {
      localStorage.setItem(STORAGE_KEY_EDIT_HISTORY, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEY_SERVANT_PANELS)) {
      localStorage.setItem(STORAGE_KEY_SERVANT_PANELS, JSON.stringify({}));
    }
  }

  // --- API METHODS ---

  return {
    init: initStorageEngine,
    
    isFirebase: function() {
      return isFirebaseActive;
    },

    saveFirebaseConfig: function(configObj) {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(configObj));
      location.reload();
    },

    // Ponds CRUD
    getPonds: async function() {
      if (isFirebaseActive && db) {
        try {
          const snapshot = await db.collection("ponds").get();
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          return list.length ? list : JSON.parse(localStorage.getItem(STORAGE_KEY_PONDS) || "[]");
        } catch(e) {
          console.error("Firebase getPonds error:", e);
        }
      }
      return JSON.parse(localStorage.getItem(STORAGE_KEY_PONDS) || "[]");
    },

    // Feed Logs CRUD
    getFeedLogs: async function() {
      if (isFirebaseActive && db) {
        try {
          const snapshot = await db.collection("feedLogs").get();
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          return list.length ? list : JSON.parse(localStorage.getItem(STORAGE_KEY_FEED_LOGS) || "[]");
        } catch(e) {}
      }
      return JSON.parse(localStorage.getItem(STORAGE_KEY_FEED_LOGS) || "[]");
    },

    saveFeedLog: async function(logObj) {
      let logs = await this.getFeedLogs();
      if (!logObj.id) logObj.id = 'fl_' + Date.now();
      const existingIdx = logs.findIndex(l => l.id === logObj.id);
      if (existingIdx >= 0) {
        logs[existingIdx] = logObj;
      } else {
        logs.push(logObj);
      }
      localStorage.setItem(STORAGE_KEY_FEED_LOGS, JSON.stringify(logs));

      if (isFirebaseActive && db) {
        try {
          await db.collection("feedLogs").doc(logObj.id).set(logObj);
        } catch(e) {}
      }
      return logObj;
    },

    // Expenses CRUD
    getExpenses: async function() {
      if (isFirebaseActive && db) {
        try {
          const snapshot = await db.collection("expenses").get();
          const list = [];
          snapshot.forEach(doc => list.push({ expenseId: doc.id, ...doc.data() }));
          return list.length ? list : JSON.parse(localStorage.getItem(STORAGE_KEY_EXPENSES) || "[]");
        } catch(e) {
          console.error("Firebase getExpenses error:", e);
        }
      }
      return JSON.parse(localStorage.getItem(STORAGE_KEY_EXPENSES) || "[]");
    },

    saveExpense: async function(expenseObj) {
      let expenses = await this.getExpenses();
      if (!expenseObj.expenseId) expenseObj.expenseId = 'exp_' + Date.now();
      const existingIdx = expenses.findIndex(e => e.expenseId === expenseObj.expenseId);
      if (existingIdx >= 0) {
        expenses[existingIdx] = expenseObj;
      } else {
        expenses.push(expenseObj);
      }
      localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));

      if (isFirebaseActive && db) {
        try {
          await db.collection("expenses").doc(expenseObj.expenseId).set(expenseObj);
        } catch(e) {
          console.error("Firebase saveExpense error:", e);
        }
      }
      return expenseObj;
    },

    deleteExpense: async function(expenseId) {
      let expenses = await this.getExpenses();
      expenses = expenses.filter(e => e.expenseId !== expenseId);
      localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
      if (isFirebaseActive && db) {
        try {
          await db.collection("expenses").doc(expenseId).delete();
        } catch(e) {
          console.error("Firebase deleteExpense error:", e);
        }
      }
      return expenses;
    },

    // Water Quality Logs CRUD
    getWaterLogs: async function() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_WATER_LOGS) || "[]");
    },

    saveWaterLog: async function(wqObj) {
      let logs = await this.getWaterLogs();
      if (!wqObj.id) wqObj.id = 'wq_' + Date.now();
      logs.push(wqObj);
      localStorage.setItem(STORAGE_KEY_WATER_LOGS, JSON.stringify(logs));

      if (isFirebaseActive && db) {
        try {
          await db.collection("waterLogs").doc(wqObj.id).set(wqObj);
        } catch(e) {}
      }
      return wqObj;
    },

    // Growth Logs CRUD
    getGrowthLogs: async function() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_GROWTH_LOGS) || "[]");
    },

    saveGrowthLog: async function(grObj) {
      let logs = await this.getGrowthLogs();
      if (!grObj.id) grObj.id = 'gr_' + Date.now();
      logs.push(grObj);
      localStorage.setItem(STORAGE_KEY_GROWTH_LOGS, JSON.stringify(logs));

      if (isFirebaseActive && db) {
        try {
          await db.collection("growthLogs").doc(grObj.id).set(grObj);
        } catch(e) {}
      }
      return grObj;
    },

    getMortalityLogs: async function() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_MORTALITY_LOGS) || "[]");
    },

    saveMortalityLog: async function(mortObj) {
      let logs = await this.getMortalityLogs();
      if (!mortObj.id) mortObj.id = 'mort_' + Date.now();
      logs.push(mortObj);
      localStorage.setItem(STORAGE_KEY_MORTALITY_LOGS, JSON.stringify(logs));
      return mortObj;
    },

    // Seed Stock Management
    getSeedStock: async function() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_SEED) || "[]");
    },

    saveSeedStock: async function(seedStockList) {
      localStorage.setItem(STORAGE_KEY_SEED, JSON.stringify(seedStockList));
    },

    // Feed Stock Management
    getFeedStock: async function() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_STOCK) || "[]");
    },

    saveFeedStock: async function(stockList) {
      localStorage.setItem(STORAGE_KEY_STOCK, JSON.stringify(stockList));
    },

    getEditHistory: async function() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_EDIT_HISTORY) || "[]");
    },

    saveEditHistory: async function(historyList) {
      localStorage.setItem(STORAGE_KEY_EDIT_HISTORY, JSON.stringify(historyList));
    },

    getServantPanelData: async function(pondId) {
      const panels = JSON.parse(localStorage.getItem(STORAGE_KEY_SERVANT_PANELS) || "{}") || {};
      if (pondId && panels[pondId]) {
        return panels[pondId];
      }

      if (isFirebaseActive && db && pondId) {
        try {
          const doc = await db.collection("servantPanels").doc(pondId).get();
          if (doc && doc.exists) {
            const data = doc.data();
            panels[pondId] = data;
            localStorage.setItem(STORAGE_KEY_SERVANT_PANELS, JSON.stringify(panels));
            return data;
          }
        } catch (e) {
          console.error("Firebase getServantPanelData error:", e);
        }
      }

      return pondId ? (panels[pondId] || null) : panels;
    },

    saveServantPanelData: async function(pondId, panelData) {
      const panels = JSON.parse(localStorage.getItem(STORAGE_KEY_SERVANT_PANELS) || "{}") || {};
      const payload = {
        ...panels[pondId],
        ...panelData,
        pondId,
        updatedAt: new Date().toISOString(),
        savedBy: panelData.savedBy || 'Servant'
      };
      panels[pondId] = payload;
      localStorage.setItem(STORAGE_KEY_SERVANT_PANELS, JSON.stringify(panels));

      if (isFirebaseActive && db && pondId) {
        try {
          await db.collection("servantPanels").doc(pondId).set(payload, { merge: true });
        } catch (e) {
          console.error("Firebase saveServantPanelData error:", e);
        }
      }
      return payload;
    }
  };
})();

// Auto Initialize Storage Engine on script load
document.addEventListener('DOMContentLoaded', () => {
  window.AQUA_STORAGE.init();
});
