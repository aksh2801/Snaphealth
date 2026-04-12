
const STOCKS = [
  {
    ticker: "AAPL", name: "Apple Inc.", sector: "Technology",
    price: 189.30, logoColor: "#1d1d1f", logoTextColor: "#fff",
    accentColor: "#a0b4c8"
  },
  {
    ticker: "TSLA", name: "Tesla Inc.", sector: "Automotive",
    price: 248.50, logoColor: "#cc0000", logoTextColor: "#fff",
    accentColor: "#cc0000"
  },
  {
    ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology",
    price: 174.20, logoColor: "#4285f4", logoTextColor: "#fff",
    accentColor: "#4285f4"
  },
  {
    ticker: "AMZN", name: "Amazon.com Inc.", sector: "E-Commerce",
    price: 191.80, logoColor: "#ff9900", logoTextColor: "#000",
    accentColor: "#ff9900"
  },
  {
    ticker: "MSFT", name: "Microsoft Corp.", sector: "Technology",
    price: 415.60, logoColor: "#00a4ef", logoTextColor: "#fff",
    accentColor: "#00a4ef"
  },
  {
    ticker: "NVDA", name: "NVIDIA Corp.", sector: "Semiconductors",
    price: 875.40, logoColor: "#76b900", logoTextColor: "#000",
    accentColor: "#76b900"
  },
  {
    ticker: "META", name: "Meta Platforms", sector: "Social Media",
    price: 513.20, logoColor: "#0082fb", logoTextColor: "#fff",
    accentColor: "#0082fb"
  },
  {
    ticker: "NFLX", name: "Netflix Inc.", sector: "Entertainment",
    price: 652.90, logoColor: "#e50914", logoTextColor: "#fff",
    accentColor: "#e50914"
  },
  {
    ticker: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors",
    price: 168.75, logoColor: "#ed1c24", logoTextColor: "#fff",
    accentColor: "#ed1c24"
  },
];

let livePrices = {};   
let prevPrices = {};    
let priceChanges = {};  
let sparklineData = {}; 

let portfolioChartInstance = null;

let modalTicker = null;
let modalAction = null; 

function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem('tradex_theme', isLight ? 'light' : 'dark');
  updateThemeButtons(isLight);
}

function updateThemeButtons(isLight) {
  const icon = isLight ? '🌙' : '☀';
  const label = isLight ? 'Dark Mode' : 'Light Mode';

  const authBtn = document.getElementById('theme-toggle-auth');
  if (authBtn) authBtn.querySelector('.theme-icon').textContent = icon;

  const navIcon = document.querySelector('#theme-toggle-nav .theme-icon');
  const navLabel = document.querySelector('#theme-toggle-nav .theme-label');
  if (navIcon) navIcon.textContent = icon;
  if (navLabel) navLabel.textContent = label;
}

(function init() {
  const savedTheme = localStorage.getItem('tradex_theme');
  const isLight = savedTheme === 'light';
  if (isLight) document.body.classList.add('light');
  updateThemeButtons(isLight);

  STOCKS.forEach(s => {
    livePrices[s.ticker] = s.price;
    prevPrices[s.ticker] = s.price;
    priceChanges[s.ticker] = 0;
    sparklineData[s.ticker] = Array(20).fill(s.price);
  });

  buildTickerTape();

  const currentUser = localStorage.getItem("tradex_current_user");
  if (currentUser) {
    showApp(currentUser);
  }

  setInterval(updatePrices, 5000);
})();

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
}

function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  if (!username || !password) {
    showError(errorEl, "Please fill in all fields.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("tradex_users") || "{}");

  if (!users[username]) {
    showError(errorEl, "User not found. Please register first.");
    return;
  }
  if (users[username].password !== password) {
    showError(errorEl, "Incorrect password.");
    return;
  }

  localStorage.setItem("tradex_current_user", username);
  showApp(username);
}

function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('reg-error');

  if (!username || !password) {
    showError(errorEl, "Please fill in all fields.");
    return;
  }
  if (username.length < 3) {
    showError(errorEl, "Username must be at least 3 characters.");
    return;
  }
  if (password.length < 4) {
    showError(errorEl, "Password must be at least 4 characters.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("tradex_users") || "{}");

  if (users[username]) {
    showError(errorEl, "Username already exists. Please login.");
    return;
  }

  users[username] = {
    password: password,
    balance: 10000,
    portfolio: {},    
  };

  localStorage.setItem("tradex_users", JSON.stringify(users));
  localStorage.setItem("tradex_current_user", username);

  showApp(username);
}

function handleLogout() {
  localStorage.removeItem("tradex_current_user");
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('auth-screen').classList.add('active');
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

function showApp(username) {
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');

  const initial = username.charAt(0).toUpperCase();
  document.getElementById('user-avatar').textContent = initial;
  document.getElementById('sidebar-username').textContent = username;

  renderStockGrid();
  renderMarketBar();
  updateBalanceDisplay();

  showPage('dashboard');
}

function showPage(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Remove active from all nav links
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('nav-' + page).classList.add('active');

  if (page === 'portfolio') {
    renderPortfolio();
  }
  if (page === 'history') {
    historyFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    if (document.getElementById('history-search')) document.getElementById('history-search').value = '';
    renderHistory();
  }
}

function getCurrentUsername() {
  return localStorage.getItem("tradex_current_user");
}

function getUserData(username) {
  const users = JSON.parse(localStorage.getItem("tradex_users") || "{}");
  return users[username];
}

function saveUserData(username, data) {
  const users = JSON.parse(localStorage.getItem("tradex_users") || "{}");
  users[username] = data;
  localStorage.setItem("tradex_users", JSON.stringify(users));
}

function getBalance() {
  const user = getUserData(getCurrentUsername());
  return user ? user.balance : 0;
}

function getPortfolio() {
  const user = getUserData(getCurrentUsername());
  return user ? user.portfolio : {};
}

function updateBalanceDisplay() {
  const bal = getBalance();
  const formatted = formatCurrency(bal);
  document.getElementById('sidebar-balance').textContent = formatted;
  document.getElementById('dash-balance').textContent = formatted;
  document.getElementById('port-balance').textContent = formatted;
}

function renderMarketBar() {
  const bar = document.getElementById('market-bar');
  bar.innerHTML = STOCKS.map(s => {
    const price = livePrices[s.ticker];
    const change = priceChanges[s.ticker];
    const sign = change >= 0 ? '+' : '';
    return `
      <div class="market-pill" id="pill-${s.ticker}">
        <span class="pill-ticker">${s.ticker}</span>
        <span class="pill-price">${formatCurrency(price)}</span>
        <span class="pill-change ${change >= 0 ? 'positive' : 'negative'}">${sign}${change.toFixed(2)}%</span>
      </div>`;
  }).join('');
}

function updateMarketBar() {
  STOCKS.forEach(s => {
    const pill = document.getElementById('pill-' + s.ticker);
    if (!pill) return;
    const change = priceChanges[s.ticker];
    const sign = change >= 0 ? '+' : '';
    pill.querySelector('.pill-price').textContent = formatCurrency(livePrices[s.ticker]);
    const changeEl = pill.querySelector('.pill-change');
    changeEl.textContent = `${sign}${change.toFixed(2)}%`;
    changeEl.className = `pill-change ${change >= 0 ? 'positive' : 'negative'}`;
  });
}

function renderStockGrid() {
  const grid = document.getElementById('stocks-grid');
  grid.innerHTML = STOCKS.map(s => buildStockCard(s)).join('');

  STOCKS.forEach(s => {
    drawSparkline(s.ticker);
  });
}

function buildStockCard(s) {
  const price = livePrices[s.ticker];
  const change = priceChanges[s.ticker];
  const sign = change >= 0 ? '+' : '';
  const arrow = change >= 0 ? '▲' : '▼';
  const changeClass = change >= 0 ? 'positive' : 'negative';

  return `
    <div class="stock-card" id="card-${s.ticker}" style="--card-accent: ${s.accentColor}">
      <div class="stock-card-header">
        <div class="stock-meta">
          <div class="stock-logo" style="background: ${s.logoColor}; color: ${s.logoTextColor};">
            ${s.ticker.slice(0,3)}
          </div>
          <div class="stock-info-text">
            <div class="stock-ticker">${s.ticker}</div>
            <div class="stock-name">${s.name}</div>
          </div>
        </div>
        <span class="stock-sector-badge">${s.sector}</span>
      </div>

      <div class="stock-price-row">
        <div class="stock-price" id="price-${s.ticker}">${formatCurrency(price)}</div>
        <div class="stock-change ${changeClass}" id="change-${s.ticker}">
          ${arrow} ${sign}${change.toFixed(2)}%
        </div>
      </div>

      <div class="stock-sparkline">
        <canvas id="sparkline-${s.ticker}"></canvas>
      </div>

      <div class="stock-actions">
        <button class="btn-buy" onclick="openModal('${s.ticker}', 'buy')">▲ BUY</button>
        <button class="btn-sell" onclick="openModal('${s.ticker}', 'sell')">▼ SELL</button>
      </div>
    </div>`;
}

function drawSparkline(ticker) {
  const canvas = document.getElementById('sparkline-' + ticker);
  if (!canvas) return;

  const data = sparklineData[ticker];
  const isPositive = priceChanges[ticker] >= 0;
  const color = isPositive ? '#00e676' : '#ff4455';
  const stock = STOCKS.find(s => s.ticker === ticker);

  if (canvas._chartInstance) canvas._chartInstance.destroy();

  canvas._chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.map(() => ''),
      datasets: [{
        data: data,
        borderColor: color,
        borderWidth: 1.5,
        fill: true,
        backgroundColor: isPositive
          ? 'rgba(0, 230, 118, 0.05)'
          : 'rgba(255, 68, 85, 0.05)',
        tension: 0.4,
        pointRadius: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}

function updatePrices() {
  STOCKS.forEach(s => {
    prevPrices[s.ticker] = livePrices[s.ticker];

    const changePct = (Math.random() - 0.48) * 4;
    const newPrice = Math.max(1, livePrices[s.ticker] * (1 + changePct / 100));
    livePrices[s.ticker] = parseFloat(newPrice.toFixed(2));

    priceChanges[s.ticker] = ((livePrices[s.ticker] - s.price) / s.price) * 100;

    sparklineData[s.ticker].push(livePrices[s.ticker]);
    if (sparklineData[s.ticker].length > 20) sparklineData[s.ticker].shift();
  });

  STOCKS.forEach(s => {
    updateStockCardPrice(s.ticker);
    drawSparkline(s.ticker);
  });

  updateMarketBar();

  const portfolioActive = document.getElementById('page-portfolio').classList.contains('active');
  if (portfolioActive) {
    renderPortfolio();
  }
}

function updateStockCardPrice(ticker) {
  const priceEl = document.getElementById('price-' + ticker);
  const changeEl = document.getElementById('change-' + ticker);
  if (!priceEl || !changeEl) return;

  const price = livePrices[ticker];
  const change = priceChanges[ticker];
  const sign = change >= 0 ? '+' : '';
  const arrow = change >= 0 ? '▲' : '▼';

  priceEl.textContent = formatCurrency(price);
  changeEl.textContent = `${arrow} ${sign}${change.toFixed(2)}%`;
  changeEl.className = `stock-change ${change >= 0 ? 'positive' : 'negative'}`;

  const card = document.getElementById('card-' + ticker);
  if (card) {
    const dir = livePrices[ticker] >= prevPrices[ticker] ? 'flash-green' : 'flash-red';
    card.classList.add(dir);
    setTimeout(() => card.classList.remove(dir), 600);
  }
}

function getHistory() {
  const username = getCurrentUsername();
  const users = JSON.parse(localStorage.getItem("tradex_users") || "{}");
  return (users[username] && users[username].history) ? users[username].history : [];
}

function recordTrade(action, ticker, qty, price, total, balanceAfter) {
  const username = getCurrentUsername();
  const userData = getUserData(username);
  if (!userData.history) userData.history = [];

  const stock = STOCKS.find(s => s.ticker === ticker);
  const now = new Date();

  userData.history.unshift({
    id: Date.now(),
    action,
    ticker,
    name: stock ? stock.name : ticker,
    qty,
    price: parseFloat(price.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    balanceAfter: parseFloat(balanceAfter.toFixed(2)),
    timestamp: now.toISOString(),
    dateStr: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    timeStr: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  });

  saveUserData(username, userData);
}

let historyFilter = 'all';

function filterHistory(filter, btn) {
  historyFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderHistory();
}
function clearHistory() {
  if (!confirm('Clear all trade history? This cannot be undone.')) return;
  const username = getCurrentUsername();
  const userData = getUserData(username);
  userData.history = [];
  saveUserData(username, userData);
  renderHistory();
  showToast('Trade history cleared.', '');
}


let historyChartInstance = null;

function renderHistory() {
  const allTrades = getHistory();
  const search = (document.getElementById('history-search')?.value || '').trim().toUpperCase();

  const trades = allTrades.filter(t => {
    const matchFilter = historyFilter === 'all' || t.action === historyFilter;
    const matchSearch = !search || t.ticker.includes(search) || t.name.toUpperCase().includes(search);
    return matchFilter && matchSearch;
  });

  let totalBought = 0, totalSold = 0;
  const tradeCount = {};
  allTrades.forEach(t => {
    if (t.action === 'buy') totalBought += t.total;
    else totalSold += t.total;
    tradeCount[t.ticker] = (tradeCount[t.ticker] || 0) + 1;
  });
  const realisedPnL = totalSold - totalBought;
  const mostTraded = Object.keys(tradeCount).sort((a, b) => tradeCount[b] - tradeCount[a])[0] || '—';

  document.getElementById('hs-total').textContent = allTrades.length;
  document.getElementById('hs-bought').textContent = formatCurrency(totalBought);
  document.getElementById('hs-sold').textContent = formatCurrency(totalSold);

  const pnlEl = document.getElementById('hs-pnl');
  pnlEl.textContent = (realisedPnL >= 0 ? '+' : '') + formatCurrency(realisedPnL);
  pnlEl.className = 'hs-value ' + (realisedPnL >= 0 ? 'positive' : realisedPnL < 0 ? 'negative' : '');
  document.getElementById('hs-most').textContent = mostTraded;

  renderHistoryChart(allTrades);

  const tbody = document.getElementById('history-body');
  const emptyState = document.getElementById('history-empty');
  const table = document.getElementById('history-table');
  const countEl = document.getElementById('history-count');

  countEl.textContent = `${trades.length} trade${trades.length !== 1 ? 's' : ''}`;

  if (trades.length === 0) {
    table.style.display = 'none';
    emptyState.classList.add('visible');
    return;
  }

  table.style.display = '';
  emptyState.classList.remove('visible');
  tbody.innerHTML = '';

  trades.forEach((t, i) => {
    const isBuy = t.action === 'buy';
    const tr = document.createElement('tr');
    tr.className = 'history-row-new';
    tr.innerHTML = `
      <td class="td-left"><span class="row-num">${trades.length - i}</span></td>
      <td class="td-left">
        <div class="hold-ticker">${t.ticker}</div>
        <div class="hold-name">${t.name}</div>
      </td>
      <td><span class="trade-badge ${t.action}">${isBuy ? '▲ BUY' : '▼ SELL'}</span></td>
      <td>${t.qty.toLocaleString()}</td>
      <td>${formatCurrency(t.price)}</td>
      <td style="color: var(--text-primary); font-weight: 700;">${formatCurrency(t.total)}</td>
      <td style="color: var(--accent);">${formatCurrency(t.balanceAfter)}</td>
      <td class="td-left">
        <div class="trade-time">${t.timeStr}</div>
        <div class="trade-date">${t.dateStr}</div>
      </td>`;
    tbody.appendChild(tr);
  });
}

function renderHistoryChart(trades) {
  const canvas = document.getElementById('history-chart');
  if (!canvas) return;

  if (historyChartInstance) { historyChartInstance.destroy(); historyChartInstance = null; }
  if (trades.length === 0) return;

  const dayMap = {};
  [...trades].reverse().forEach(t => {
    if (!dayMap[t.dateStr]) dayMap[t.dateStr] = { buy: 0, sell: 0 };
    dayMap[t.dateStr][t.action] += t.total;
  });

  const days = Object.keys(dayMap).slice(-14);
  const buyData  = days.map(d => parseFloat(dayMap[d].buy.toFixed(2)));
  const sellData = days.map(d => parseFloat(dayMap[d].sell.toFixed(2)));

  historyChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        { label: 'Bought', data: buyData,  backgroundColor: 'rgba(0,230,118,0.45)', borderColor: '#00e676', borderWidth: 1, borderRadius: 4 },
        { label: 'Sold',   data: sellData, backgroundColor: 'rgba(255,68,85,0.45)', borderColor: '#ff4455', borderWidth: 1, borderRadius: 4 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
      plugins: {
        legend: { labels: { color: '#7a8899', font: { family: "'Space Mono', monospace", size: 11 }, boxWidth: 12 } },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` },
          backgroundColor: '#131921', borderColor: 'rgba(255,255,255,0.07)', borderWidth: 1,
          titleColor: '#e8edf5', bodyColor: '#7a8899',
          bodyFont: { family: "'Space Mono', monospace", size: 11 },
          titleFont: { family: "'Syne', sans-serif", size: 13 },
        }
      },
      scales: {
        x: { ticks: { color: '#445566', font: { family: "'Space Mono', monospace", size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: {
          ticks: { color: '#445566', font: { family: "'Space Mono', monospace", size: 10 }, callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(1)+'k' : v) },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
}

function openModal(ticker, action) {
  const stock = STOCKS.find(s => s.ticker === ticker);
  if (!stock) return;

  modalTicker = ticker;
  modalAction = action;

  const price = livePrices[ticker];
  const balance = getBalance();
  const portfolio = getPortfolio();

  document.getElementById('modal-title').textContent = action === 'buy' ? '▲ Buy Stock' : '▼ Sell Stock';
  document.getElementById('modal-subtitle').textContent = `${ticker} · ${stock.name}`;
  document.getElementById('modal-price').textContent = formatCurrency(price);
  document.getElementById('modal-cash').textContent = formatCurrency(balance);
  document.getElementById('modal-qty').value = 1;
  document.getElementById('modal-error').classList.add('hidden');

  const confirmBtn = document.getElementById('modal-confirm-btn');
  if (action === 'buy') {
    confirmBtn.textContent = 'CONFIRM BUY ▲';
    confirmBtn.classList.remove('sell-mode');
  } else {
    confirmBtn.textContent = 'CONFIRM SELL ▼';
    confirmBtn.classList.add('sell-mode');
  }

  if (action === 'sell') {
    const ownedQty = portfolio[ticker] ? portfolio[ticker].qty : 0;
    document.getElementById('modal-qty').max = ownedQty;
    if (ownedQty === 0) {
      showError(document.getElementById('modal-error'), `You don't own any ${ticker} shares.`);
    }
  } else {
    document.getElementById('modal-qty').removeAttribute('max');
  }

  updateModalTotal();

  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  modalTicker = null;
  modalAction = null;
}

function changeQty(delta) {
  const input = document.getElementById('modal-qty');
  const newVal = Math.max(1, (parseInt(input.value) || 1) + delta);
  input.value = newVal;
  updateModalTotal();
}

function updateModalTotal() {
  const qty = Math.max(1, parseInt(document.getElementById('modal-qty').value) || 1);
  const price = livePrices[modalTicker] || 0;
  const total = qty * price;
  document.getElementById('modal-total').textContent = formatCurrency(total);
}

function confirmTrade() {
  const username = getCurrentUsername();
  const userData = getUserData(username);
  const qty = parseInt(document.getElementById('modal-qty').value);
  const price = livePrices[modalTicker];
  const total = qty * price;
  const errorEl = document.getElementById('modal-error');

  if (isNaN(qty) || qty < 1) {
    showError(errorEl, "Please enter a valid quantity.");
    return;
  }

  if (modalAction === 'buy') {
    if (total > userData.balance) {
      showError(errorEl, `Insufficient funds. Need ${formatCurrency(total)}, have ${formatCurrency(userData.balance)}.`);
      return;
    }

    userData.balance -= total;
    userData.balance = parseFloat(userData.balance.toFixed(2));

    if (!userData.portfolio[modalTicker]) {
      userData.portfolio[modalTicker] = { qty: 0, avgBuyPrice: 0 };
    }
    const holding = userData.portfolio[modalTicker];
    const prevTotal = holding.qty * holding.avgBuyPrice;
    holding.qty += qty;
    holding.avgBuyPrice = parseFloat(((prevTotal + total) / holding.qty).toFixed(2));

  } else {
    if (!userData.portfolio[modalTicker] || userData.portfolio[modalTicker].qty === 0) {
      showError(errorEl, `You don't own any ${modalTicker} shares.`);
      return;
    }
    if (qty > userData.portfolio[modalTicker].qty) {
      showError(errorEl, `You only own ${userData.portfolio[modalTicker].qty} shares.`);
      return;
    }

    userData.balance += total;
    userData.balance = parseFloat(userData.balance.toFixed(2));

    userData.portfolio[modalTicker].qty -= qty;
    if (userData.portfolio[modalTicker].qty === 0) {
      delete userData.portfolio[modalTicker];
    }
  }
  saveUserData(username, userData);

  recordTrade(modalAction, modalTicker, qty, price, total, userData.balance);

  updateBalanceDisplay();
  closeModal();

  const stock = STOCKS.find(s => s.ticker === modalTicker);
  const action = modalAction === 'buy' ? 'Bought' : 'Sold';
  showToast(
    `${action} ${qty} × ${modalTicker} for ${formatCurrency(total)}`,
    'success'
  );

  const portfolioActive = document.getElementById('page-portfolio').classList.contains('active');
  if (portfolioActive) renderPortfolio();

  const historyActive = document.getElementById('page-history').classList.contains('active');
  if (historyActive) renderHistory();
}

function renderPortfolio() {
  const portfolio = getPortfolio();
  const balance = getBalance();
  const tickers = Object.keys(portfolio);
  const tbody = document.getElementById('holdings-body');
  const emptyState = document.getElementById('holdings-empty');
  const table = document.getElementById('holdings-table');

  let totalInvested = 0;
  let totalCurrentValue = 0;

  tbody.innerHTML = '';

  if (tickers.length === 0) {
    table.style.display = 'none';
    emptyState.classList.add('visible');
  } else {
    table.style.display = '';
    emptyState.classList.remove('visible');

    tickers.forEach(ticker => {
      const holding = portfolio[ticker];
      const stock = STOCKS.find(s => s.ticker === ticker);
      const currentPrice = livePrices[ticker] || holding.avgBuyPrice;
      const currentValue = holding.qty * currentPrice;
      const invested = holding.qty * holding.avgBuyPrice;
      const pnl = currentValue - invested;
      const pnlPct = ((pnl / invested) * 100).toFixed(2);
      const pnlClass = pnl >= 0 ? 'positive' : 'negative';
      const pnlSign = pnl >= 0 ? '+' : '';

      totalInvested += invested;
      totalCurrentValue += currentValue;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="hold-ticker">${ticker}</div>
          <div class="hold-name">${stock ? stock.name : ''}</div>
        </td>
        <td>${holding.qty}</td>
        <td>${formatCurrency(holding.avgBuyPrice)}</td>
        <td>${formatCurrency(currentPrice)}</td>
        <td>${formatCurrency(currentValue)}</td>
        <td class="pnl-cell ${pnlClass}">
          ${pnlSign}${formatCurrency(pnl)}<br/>
          <small>${pnlSign}${pnlPct}%</small>
        </td>
        <td>
          <button class="btn-sell-hold" onclick="openModal('${ticker}', 'sell')">SELL</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  const totalPnL = totalCurrentValue - totalInvested;
  const pnlClass = totalPnL >= 0 ? 'positive' : 'negative';
  const pnlSign = totalPnL >= 0 ? '+' : '';

  document.getElementById('stat-total').textContent = formatCurrency(totalCurrentValue + balance);
  document.getElementById('stat-invested').textContent = formatCurrency(totalInvested);
  document.getElementById('stat-pnl').textContent = `${pnlSign}${formatCurrency(totalPnL)}`;
  document.getElementById('stat-pnl').className = `stat-value ${pnlClass}`;
  document.getElementById('stat-positions').textContent = tickers.length;

  renderPortfolioChart(tickers, portfolio);
}

function renderPortfolioChart(tickers, portfolio) {
  const canvas = document.getElementById('portfolio-chart');
  const emptyMsg = document.getElementById('chart-empty');

  if (tickers.length === 0) {
    canvas.style.display = 'none';
    emptyMsg.style.display = 'block';
    if (portfolioChartInstance) {
      portfolioChartInstance.destroy();
      portfolioChartInstance = null;
    }
    return;
  }

  canvas.style.display = 'block';
  emptyMsg.style.display = 'none';

  const labels = tickers;
  const values = tickers.map(ticker => {
    const holding = portfolio[ticker];
    return parseFloat((holding.qty * (livePrices[ticker] || holding.avgBuyPrice)).toFixed(2));
  });

  const PALETTE = [
    '#00d4aa', '#0082fb', '#ff9900', '#00e676',
    '#ff4455', '#ffd740', '#76b900', '#e50914',
    '#a020f0', '#00bcd4'
  ];

  const chartColors = tickers.map((_, i) => {
    const stock = STOCKS.find(s => s.ticker === tickers[i]);
    return stock ? stock.accentColor : PALETTE[i % PALETTE.length];
  });

  if (portfolioChartInstance) portfolioChartInstance.destroy();

  portfolioChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: chartColors.map(c => c + 'cc'),
        borderColor: chartColors,
        borderWidth: 2,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#7a8899',
            font: { family: "'Space Mono', monospace", size: 11 },
            padding: 16,
            boxWidth: 12,
            boxHeight: 12,
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.raw)}`
          },
          backgroundColor: '#131921',
          borderColor: 'rgba(255,255,255,0.07)',
          borderWidth: 1,
          titleColor: '#e8edf5',
          bodyColor: '#7a8899',
          bodyFont: { family: "'Space Mono', monospace", size: 12 },
          titleFont: { family: "'Syne', sans-serif", size: 13 },
        }
      }
    }
  });
}

function buildTickerTape() {
  const tape = document.getElementById('ticker-tape');
  if (!tape) return;
  const tapeItems = STOCKS.map(s => {
    const c = priceChanges[s.ticker];
    return `${s.ticker} ${formatCurrency(livePrices[s.ticker])} ${c >= 0 ? '▲' : '▼'}${Math.abs(c).toFixed(2)}%`;
  }).join('   ·   ');

  tape.innerHTML = `<span class="ticker-tape-inner">${tapeItems}   ·   ${tapeItems}</span>`;
}

let toastTimeout = null;

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add('hidden'), 3200);
}

function formatCurrency(amount) {
  return '$' + parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

const flashStyle = document.createElement('style');
flashStyle.textContent = `
  @keyframes flash-green-anim {
    0%   { background: rgba(0, 230, 118, 0.0); }
    30%  { background: rgba(0, 230, 118, 0.12); }
    100% { background: rgba(0, 230, 118, 0.0); }
  }
  @keyframes flash-red-anim {
    0%   { background: rgba(255, 68, 85, 0.0); }
    30%  { background: rgba(255, 68, 85, 0.12); }
    100% { background: rgba(255, 68, 85, 0.0); }
  }
  .flash-green { animation: flash-green-anim 0.6s ease; }
  .flash-red   { animation: flash-red-anim 0.6s ease; }
`;
document.head.appendChild(flashStyle);