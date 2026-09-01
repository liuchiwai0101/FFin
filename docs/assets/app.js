(() => {
  const STORAGE_KEY = "ffin_deposit_store_v1";
  const AUTH_KEY = "ffin_auth_user";

  const APP_USERS = [
    { id: "vin", username: "Vin", name: "Vin", ownerKey: "Vin", role: "ADMIN" },
    { id: "ma", username: "MA", name: "MA", ownerKey: "MA", role: "MEMBER" },
    { id: "miki", username: "Miki", name: "Miki", ownerKey: "Miki", role: "MEMBER" },
    { id: "baba", username: "BABA", name: "BABA", ownerKey: "BABA", role: "MEMBER" },
  ];

  function defaultPassword(username) {
    return `${username}123`;
  }

  function findUserByCredentials(account, password) {
    const normalized = String(account || "").trim().toLowerCase();
    const user = APP_USERS.find(
      (u) =>
        u.username.toLowerCase() === normalized ||
        `${u.username.toLowerCase()}@family.local` === normalized,
    );
    if (!user || password !== defaultPassword(user.username)) return null;
    return user;
  }

  function getCurrentUser() {
    const id = localStorage.getItem(AUTH_KEY);
    return APP_USERS.find((u) => u.id === id) || null;
  }

  function isAdmin(user) {
    return user?.role === "ADMIN";
  }

  function canViewOwner(user, ownerName) {
    return isAdmin(user) || user.ownerKey === ownerName;
  }

  const EMPTY = { syncedAt: null, activeItems: [], historyItems: [] };

  function excelDateToDate(serial) {
    if (serial === null || serial === undefined || isNaN(Number(serial))) return null;
    const num = Number(serial);
    if (num < 1000) return null;
    const utcDays = Math.floor(num - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }

  function parseWorkbook(wb) {
    const sheet = wb.Sheets["Bank interest"] || wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const activeItems = [];
    const historyItems = [];

    function parseActiveSection(owner, startRow, endRow) {
      for (let r = startRow; r <= endRow; r++) {
        const row = rows[r];
        if (!row || !row[2]) continue;
        const bank = String(row[2]).trim();
        if (bank.toLowerCase() === "total" || bank.toLowerCase() === "origianl") continue;
        const amount = Number(row[3]) || 0;
        if (amount <= 0) continue;
        const rate = row[4] !== null && row[4] !== undefined && !isNaN(Number(row[4])) ? Number(row[4]) : null;
        const fromDate = excelDateToDate(row[5]);
        const toDate = excelDateToDate(row[6]);
        const months = row[7] ? Number(row[7]) : null;
        const totalAmount = row[8] ? Number(row[8]) : amount;
        const interest = row[9] ? Number(row[9]) : Math.max(0, totalAmount - amount);
        const productNote = row[10] ? String(row[10]).trim() : "";
        let product = "Time Deposit (定存)";
        if (productNote.includes("零售債券")) product = "零售債券 (Retail Bond)";
        else if (productNote.includes("綠色債券")) product = "綠色債券 (Green Bond)";
        else if (productNote.includes("機場債券")) product = "機場債券 (Airport Bond)";
        else if (productNote.includes("Bond") || productNote.includes("債券")) product = "Bond (債券)";
        else if (productNote.includes("RMB")) product = "RMB Deposit (人民幣定存)";
        else if (productNote.includes("馬拉松")) product = "Marathon Deposit (馬拉松定存)";
        else if (rate === null || rate === 0) product = "Demand / Savings (活期)";
        activeItems.push({
          id: `active-${owner}-${bank}-${amount}-${r}`,
          ownerName: owner,
          bank,
          product,
          amount,
          rate,
          fromDate,
          toDate,
          months,
          totalAmount,
          interest,
          currency: productNote.includes("RMB") ? "RMB" : "HKD",
          isCurrent: true,
          notes: productNote || null,
        });
      }
    }

    parseActiveSection("MA", 2, 7);
    parseActiveSection("Vin", 13, 23);
    parseActiveSection("Miki", 28, 32);

    for (let r = 38; r <= 80; r++) {
      const row = rows[r];
      if (!row || row[0] === undefined || row[0] === null) continue;
      const owner = String(row[1] || "Vin").trim();
      const bank = String(row[2] || "").trim();
      const amount = Number(row[3]) || 0;
      if (amount <= 0 || !bank) continue;
      const rate = row[4] !== null && row[4] !== undefined && !isNaN(Number(row[4])) ? Number(row[4]) : null;
      const fromDate = excelDateToDate(row[5]);
      const toDate = excelDateToDate(row[6]);
      const months = row[7] ? Number(row[7]) : null;
      const totalAmount = row[8] ? Number(row[8]) : amount;
      const interest = row[9] ? Number(row[9]) : Math.max(0, totalAmount - amount);
      const productNote = row[10] ? String(row[10]).trim() : "";
      let product = "Time Deposit (定存)";
      if (productNote.includes("零售債券")) product = "零售債券 (Retail Bond)";
      else if (productNote.includes("綠色債券")) product = "綠色債券 (Green Bond)";
      else if (productNote.includes("機場債券")) product = "機場債券 (Airport Bond)";
      else if (productNote.includes("Bond") || productNote.includes("債券")) product = "Bond (債券)";
      else if (productNote.includes("馬拉松")) product = "Marathon Deposit (馬拉松定存)";
      historyItems.push({
        id: `history-${row[0]}-${owner}-${bank}`,
        ownerName: owner,
        bank,
        product,
        amount,
        rate,
        fromDate,
        toDate,
        months,
        totalAmount,
        interest,
        currency: "HKD",
        isCurrent: false,
        notes: productNote ? `ID: ${row[0]} · ${productNote}` : `ID: ${row[0]}`,
      });
    }

    return { activeItems, historyItems };
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...EMPTY, activeItems: [], historyItems: [] };
      const parsed = JSON.parse(raw);
      return {
        syncedAt: parsed.syncedAt || null,
        activeItems: parsed.activeItems || [],
        historyItems: parsed.historyItems || [],
      };
    } catch {
      return { ...EMPTY, activeItems: [], historyItems: [] };
    }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function clearStore() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function isLoggedIn() {
    return Boolean(getCurrentUser());
  }

  function login(account, password) {
    const user = findUserByCredentials(account, password);
    if (!user) return false;
    localStorage.setItem(AUTH_KEY, user.id);
    return true;
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
  }

  function requireAuth() {
    if (!isLoggedIn()) {
      location.href = "./login.html";
      return false;
    }
    return true;
  }

  function requireAdmin() {
    if (!requireAuth()) return false;
    if (!isAdmin(getCurrentUser())) {
      location.href = "./overview.html";
      return false;
    }
    return true;
  }

  function loadVisibleStore() {
    const store = loadStore();
    const user = getCurrentUser();
    if (!user || isAdmin(user)) return store;
    return {
      syncedAt: store.syncedAt,
      activeItems: store.activeItems.filter((item) => canViewOwner(user, item.ownerName)),
      historyItems: store.historyItems.filter((item) => canViewOwner(user, item.ownerName)),
    };
  }

  function formatAmount(amount, currency = "HKD") {
    if (amount === null || amount === undefined || isNaN(amount)) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "RMB" ? "CNY" : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatRate(rate) {
    if (rate === null || rate === undefined || rate === 0) return "—";
    return (rate * 100).toFixed(2) + "%";
  }

  function formatDate(value) {
    if (!value) return "—";
    const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-CA");
  }

  function endedYear(toDate) {
    if (!toDate) return null;
    const match = String(toDate).match(/^(\d{4})/);
    if (match) return Number(match[1]);
    const d = new Date(toDate);
    return isNaN(d.getTime()) ? null : d.getUTCFullYear();
  }

  function compare(a, b, type, dir) {
    const emptyA = a === null || a === undefined || a === "";
    const emptyB = b === null || b === undefined || b === "";
    if (emptyA && emptyB) return 0;
    if (emptyA) return 1;
    if (emptyB) return -1;
    let result = 0;
    if (type === "number" || type === "date") {
      result = Number(a) - Number(b);
    } else {
      result = String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
    }
    return dir === "asc" ? result : -result;
  }

  function renderShell(active) {
    const bar = document.getElementById("app-shell");
    const user = getCurrentUser();
    if (!bar || !user) return;
    const admin = isAdmin(user);
    const store = loadStore();
    const syncedLabel = store.syncedAt
      ? `Excel: ${new Date(store.syncedAt).toLocaleString()}`
      : "No Excel loaded";
    bar.innerHTML = `
      <header class="topbar">
        <div class="topbar-inner">
          <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;">
            <a class="brand" href="./overview.html"><span class="brand-mark">FF</span> Family Finance</a>
            <span class="user-pill">${user.name}${admin ? " · Admin" : ""}</span>
            <span class="muted" style="font-size:0.7rem;">${syncedLabel}</span>
          </div>
          <nav class="nav">
            <a href="./overview.html" class="${active === "overview" ? "active" : ""}">Overview</a>
            <a href="./current.html" class="${active === "current" ? "active" : ""}">Current Products</a>
            <a href="./history.html" class="${active === "history" ? "active" : ""}">Interest History</a>
            ${admin ? `<a href="./sync.html" class="${active === "sync" ? "active" : ""}">Sync Excel</a>` : ""}
          </nav>
          <button class="btn-ghost" type="button" id="logout-btn">Sign out</button>
        </div>
      </header>
    `;
    document.getElementById("logout-btn")?.addEventListener("click", () => {
      logout();
      location.href = "./login.html";
    });
  }

  function normalizeBank(b) {
    if (b.includes("HSBC") || b.includes("MA HSBC")) return "HSBC";
    if (b.includes("SC")) return "SC";
    if (b.includes("HS")) return "HS";
    if (b.includes("ICBC")) return "ICBC";
    if (b.includes("BOC")) return "BOC";
    return b;
  }

  window.FFin = {
    APP_USERS,
    getCurrentUser,
    isAdmin,
    canViewOwner,
    loadStore,
    loadVisibleStore,
    saveStore,
    clearStore,
    login,
    logout,
    isLoggedIn,
    requireAuth,
    requireAdmin,
    parseWorkbook,
    formatAmount,
    formatRate,
    formatDate,
    endedYear,
    compare,
    renderShell,
    normalizeBank,
  };
})();
