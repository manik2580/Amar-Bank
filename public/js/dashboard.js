/**
 * MyBank – Apitex Dashboard Controller
 * Handles time-of-day greeting, balance visibility toggle, quick transfer contacts,
 * Chart.js analytics, and transaction detail receipts.
 */

let financialChart = null;

document.addEventListener('DOMContentLoaded', () => {
  syncUserProfileElements();
  renderApitexDashboard();
  setupQuickActions();
  setupTransactionsFilter();

  window.addEventListener('currencyChanged', () => {
    renderApitexDashboard();
  });

  window.addEventListener('userUpdated', () => {
    syncUserProfileElements();
    renderApitexDashboard();
  });
});

/**
 * Main Render Controller
 */
function renderApitexDashboard() {
  syncUserProfileElements();
  const accounts = BankDB.getAccounts();
  const cards = BankDB.getCards();
  const wallets = BankDB.getWallets();
  const transactions = BankDB.getTransactions();
  const contacts = BankDB.getContacts();
  const settings = BankDB.getSettings();

  // 1. Time-of-Day Greeting
  updateGreeting();

  // 2. Compute Balances
  const bankTotal = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
  const walletTotal = wallets.reduce((sum, wal) => sum + Number(wal.balance || 0), 0);
  const totalBalance = bankTotal + walletTotal;

  // 3. Compute Income & Expenses
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(tx => {
    const amt = Number(tx.amount || 0);
    if (tx.type === 'Deposit' || tx.type === 'Other Income') {
      totalIncome += amt;
    } else if (
      tx.type === 'Withdrawal' ||
      tx.type === 'ATM Withdrawal' ||
      tx.type === 'ATM Fee' ||
      tx.type === 'Card Payment' ||
      tx.type === 'bKash Payment' ||
      tx.type === 'Nagad Payment' ||
      tx.type === 'Other Expenses'
    ) {
      totalExpense += amt;
    }
  });

  // 4. Update Main Balance Display (with hide/show state)
  const balanceEl = document.getElementById('hero-total-balance');
  const eyeIcon = document.getElementById('balance-eye-icon');
  if (balanceEl) {
    if (settings.hideBalance) {
      balanceEl.textContent = '••••••••';
      if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
      balanceEl.textContent = formatCurrency(totalBalance);
      if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye');
    }
  }

  // 5. Update Cashflow KPI elements
  const incomeEl = document.getElementById('cashflow-income-val');
  if (incomeEl) incomeEl.textContent = formatCurrency(totalIncome);

  const expenseEl = document.getElementById('cashflow-expense-val');
  if (expenseEl) expenseEl.textContent = formatCurrency(totalExpense);

  // 6. Render Quick Contacts
  renderQuickContacts(contacts);

  // 7. Render Apitex Luxury Debit Card
  renderApitexDebitCard(cards[0]);

  // 8. Render Income vs Expense Chart (Chart.js)
  renderApitexChart(transactions);

  // 9. Render Recent Transactions List
  renderApitexTransactions(transactions);

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Dynamic Greeting based on current hour
 */
function updateGreeting() {
  const greetingEl = document.getElementById('hero-greeting-text');
  if (!greetingEl) return;

  const hour = new Date().getHours();
  let greet = 'Good morning,';
  if (hour >= 12 && hour < 17) greet = 'Good afternoon,';
  else if (hour >= 17) greet = 'Good evening,';

  greetingEl.textContent = greet;
}

/**
 * Toggle Balance Visibility
 */
function toggleBalanceVisibility() {
  const settings = BankDB.getSettings();
  settings.hideBalance = !settings.hideBalance;
  BankDB.saveSettings(settings);
  renderApitexDashboard();
  showToast(settings.hideBalance ? 'Balance hidden' : 'Balance visible', 'info');
}

/**
 * Render Quick Transfer Contacts
 */
function renderQuickContacts(contacts) {
  const container = document.getElementById('quick-contacts-row');
  if (!container) return;

  let html = `
    <button class="contact-avatar-btn" onclick="openModal('modal-add-contact')">
      <div class="contact-avatar-bubble contact-add-bubble">
        <i data-lucide="plus" style="width: 22px; height: 22px;"></i>
      </div>
      <span class="contact-name-label">Add New</span>
    </button>
  `;

  contacts.forEach(c => {
    html += `
      <button class="contact-avatar-btn" onclick="quickSendToContact('${escapeHtml(c.name)}', '${c.phone}')">
        <div class="contact-avatar-bubble" style="background: ${c.bg || '#FFD7C1'};">
          ${c.initial || c.name[0]}
        </div>
        <span class="contact-name-label">${escapeHtml(c.name)}</span>
      </button>
    `;
  });

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons({ root: container });
}

function quickSendToContact(name, phone) {
  const noteEl = document.getElementById('transfer-note');
  if (noteEl) noteEl.value = `Quick P2P to ${name} (${phone})`;
  openModal('modal-transfer-money');
  showToast(`Initiating quick transfer to ${name}`, 'info');
}

/**
 * Render Apitex Debit Card
 */
function renderApitexDebitCard(card) {
  const container = document.getElementById('apitex-debit-card-slot');
  if (!container) return;

  if (!card) {
    container.innerHTML = `
      <div class="apitex-debit-card" style="display: flex; align-items: center; justify-content: center; min-height: 200px;">
        <p style="color: var(--text-light-sub);">No active debit card linked</p>
      </div>`;
    return;
  }

  const isVisa = (card.network || 'visa').toLowerCase() === 'visa';

  container.innerHTML = `
    <div class="apitex-debit-card">
      <div class="card-top-row">
        <div>
          <div class="card-brand-label">${escapeHtml(card.bankName)}</div>
          <div class="card-nickname-sub">${escapeHtml(card.nickname || 'Premium Debit')}</div>
        </div>
        <div title="Contactless Enabled">
          <i data-lucide="wifi" style="transform: rotate(90deg); width: 20px; height: 20px; color: var(--peach);"></i>
        </div>
      </div>

      <div class="card-chip-nfc-row">
        <div class="emv-chip" title="EMV Smart Chip"></div>
      </div>

      <div class="card-number-display font-mono">•••• •••• •••• ${escapeHtml(card.last4 || '4892')}</div>

      <div class="card-bottom-row">
        <div class="card-meta-col">
          <span class="card-meta-title">Card Holder</span>
          <span class="card-meta-value">${escapeHtml((BankDB.getUser().name || card.cardholderName || 'CARDHOLDER').toUpperCase())}</span>
        </div>
        <div class="card-meta-col" style="align-items: center;">
          <span class="card-meta-title">Expires</span>
          <span class="card-meta-value font-mono">${escapeHtml(card.expiryMonth || '09')}/${escapeHtml(card.expiryYear || '29')}</span>
        </div>
        <div>
          ${isVisa ? `
            <span class="card-logo-visa">VISA</span>
          ` : `
            <div class="card-logo-mc">
              <div class="mc-red"></div>
              <div class="mc-orange"></div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: container });
}

/**
 * Chart.js Line Chart (Apitex Peach & Coral theme)
 */
function renderApitexChart(transactions) {
  const ctx = document.getElementById('apitexFinancialChart');
  if (!ctx) return;

  if (financialChart) financialChart.destroy();

  const labels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const incomeData = [125000, 140000, 138000, 152000, 170000, 185000];
  const expenseData = [48000, 52000, 49500, 61000, 58400, 64320];

  financialChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total Inflow',
          data: incomeData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          fill: true,
          tension: 0.38,
          borderWidth: 2.5,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Total Outflow',
          data: expenseData,
          borderColor: '#FF8B73',
          backgroundColor: 'rgba(255, 139, 115, 0.1)',
          fill: true,
          tension: 0.38,
          borderWidth: 2.5,
          pointBackgroundColor: '#FF8B73',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: '#17152F',
            font: { family: "'Manrope', sans-serif", size: 12, weight: 600 },
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8
          }
        },
        tooltip: {
          backgroundColor: '#080727',
          titleColor: '#FFFFFF',
          bodyColor: '#FFD7C1',
          borderColor: '#F1E7E1',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${formatCurrency(context.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9290A3', font: { family: "'Manrope', sans-serif", size: 11 } }
        },
        y: {
          grid: { color: '#F1E7E1' },
          ticks: {
            color: '#9290A3',
            font: { family: "'JetBrains Mono', monospace", size: 11 },
            callback: function(v) { return '৳' + (v >= 1000 ? (v / 1000) + 'k' : v); }
          }
        }
      }
    }
  });
}

/**
 * Render Recent Transactions List
 */
function renderApitexTransactions(transactions, filterType = 'All', searchQuery = '') {
  const container = document.getElementById('recent-transactions-list');
  if (!container) return;

  const filtered = transactions.filter(tx => {
    const matchesType = filterType === 'All' || tx.type.toLowerCase().includes(filterType.toLowerCase());
    const matchesSearch = !searchQuery ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
        <p>No recent activity found.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.slice(0, 6).map(tx => {
    const isIncome = tx.type === 'Deposit' || tx.type === 'Other Income';
    const isTransfer = tx.type === 'Bank Transfer';
    const amountClass = isIncome ? 'positive' : 'negative';
    const prefix = isIncome ? '+' : (isTransfer ? '⇄ ' : '-');

    let iconName = 'arrow-up-right';
    let bubbleClass = 'expense';

    if (isIncome) {
      iconName = 'arrow-down-left';
      bubbleClass = 'income';
    } else if (isTransfer) {
      iconName = 'arrow-left-right';
      bubbleClass = 'transfer';
    } else if (tx.type.includes('bKash') || tx.type.includes('Nagad')) {
      iconName = 'smartphone';
      bubbleClass = 'expense';
    } else if (tx.type.includes('ATM')) {
      iconName = 'banknote';
      bubbleClass = 'expense';
    }

    return `
      <div class="tx-item-row" onclick="showTransactionReceipt('${escapeHtml(tx.id)}')">
        <div class="tx-leading">
          <div class="tx-icon-bubble ${bubbleClass}">
            <i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="tx-details-col">
            <span class="tx-title">${escapeHtml(tx.description)}</span>
            <span class="tx-subtitle">${formatDateTime(tx.date)} · ${escapeHtml(tx.sourceAccount)}</span>
          </div>
        </div>
        <div class="tx-amount-col">
          <span class="tx-amount-value ${amountClass}">${prefix}${formatCurrency(tx.amount)}</span>
          <span class="tx-status-pill">${escapeHtml(tx.category)}</span>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons({ root: container });
}

function setupTransactionsFilter() {
  const searchInput = document.getElementById('tx-search-input');
  const filterButtons = document.querySelectorAll('.tx-filter-pill');

  let currentFilter = 'All';
  let currentSearch = '';

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim();
      renderApitexTransactions(BankDB.getTransactions(), currentFilter, currentSearch);
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.getAttribute('data-filter') || 'All';
      renderApitexTransactions(BankDB.getTransactions(), currentFilter, currentSearch);
    });
  });
}

function setupQuickActions() {
  populateAccountSelects();

  // Add Money Form
  const addMoneyForm = document.getElementById('form-add-money');
  if (addMoneyForm) {
    addMoneyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById('add-money-amount').value);
      const accountId = document.getElementById('add-money-account').value;
      const category = document.getElementById('add-money-category').value;
      const desc = document.getElementById('add-money-desc').value.trim() || 'Manual Deposit';

      if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
      }

      const accounts = BankDB.getAccounts();
      const targetAcc = accounts.find(a => a.id === accountId) || accounts[0];
      targetAcc.balance = Number(targetAcc.balance || 0) + amount;
      BankDB.saveAccounts(accounts);

      const txs = BankDB.getTransactions();
      txs.unshift({
        id: 'TX-' + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toISOString(),
        amount: amount,
        type: 'Deposit',
        category: category,
        sourceAccount: `${targetAcc.bankName} (${targetAcc.accountNumber.slice(-7)})`,
        destAccount: '',
        description: desc,
        notes: 'Deposit credited (DEMO)',
        status: 'Completed'
      });
      BankDB.saveTransactions(txs);

      closeModal('modal-add-money');
      addMoneyForm.reset();
      renderApitexDashboard();
      showToast(`Deposited ${formatCurrency(amount)} into ${targetAcc.bankName}`, 'success');
    });
  }

  // Withdraw Money Form
  const withdrawForm = document.getElementById('form-withdraw-money');
  if (withdrawForm) {
    withdrawForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById('withdraw-amount').value);
      const accountId = document.getElementById('withdraw-account').value;
      const isAtm = document.getElementById('withdraw-is-atm').checked;
      const desc = document.getElementById('withdraw-desc').value.trim() || 'Cash Out';

      if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
      }

      const accounts = BankDB.getAccounts();
      const targetAcc = accounts.find(a => a.id === accountId) || accounts[0];

      if (Number(targetAcc.balance || 0) < amount) {
        showToast('Insufficient account balance', 'error');
        return;
      }

      targetAcc.balance = Number(targetAcc.balance || 0) - amount;
      BankDB.saveAccounts(accounts);

      const txs = BankDB.getTransactions();
      txs.unshift({
        id: 'TX-' + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toISOString(),
        amount: amount,
        type: isAtm ? 'ATM Withdrawal' : 'Withdrawal',
        category: 'Cash',
        sourceAccount: `${targetAcc.bankName} (${targetAcc.accountNumber.slice(-7)})`,
        destAccount: 'Cash in Hand',
        description: desc,
        notes: isAtm ? 'ATM Cash' : 'Counter withdrawal',
        status: 'Completed'
      });
      BankDB.saveTransactions(txs);

      closeModal('modal-withdraw-money');
      withdrawForm.reset();
      renderApitexDashboard();
      showToast(`Withdrew ${formatCurrency(amount)} successfully`, 'success');
    });
  }

  // Transfer Money Form
  const transferForm = document.getElementById('form-transfer-money');
  if (transferForm) {
    transferForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fromAccId = document.getElementById('transfer-from-account').value;
      const toAccId = document.getElementById('transfer-to-account').value;
      const amount = parseFloat(document.getElementById('transfer-amount').value);
      const note = document.getElementById('transfer-note').value.trim() || 'Internal Transfer';

      if (fromAccId === toAccId) {
        showToast('Source and destination accounts must differ', 'error');
        return;
      }

      const accounts = BankDB.getAccounts();
      const fromAcc = accounts.find(a => a.id === fromAccId);
      const toAcc = accounts.find(a => a.id === toAccId);

      if (!fromAcc || !toAcc || fromAcc.balance < amount) {
        showToast('Insufficient funds or invalid accounts', 'error');
        return;
      }

      fromAcc.balance = Number(fromAcc.balance || 0) - amount;
      toAcc.balance = Number(toAcc.balance || 0) + amount;
      BankDB.saveAccounts(accounts);

      const txs = BankDB.getTransactions();
      txs.unshift({
        id: 'TX-' + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toISOString(),
        amount: amount,
        type: 'Bank Transfer',
        category: 'Transfer',
        sourceAccount: `${fromAcc.bankName} (${fromAcc.accountNumber.slice(-7)})`,
        destAccount: `${toAcc.bankName} (${toAcc.accountNumber.slice(-7)})`,
        description: note,
        notes: `Transfer from ${fromAcc.bankName} to ${toAcc.bankName}`,
        status: 'Completed'
      });
      BankDB.saveTransactions(txs);

      closeModal('modal-transfer-money');
      transferForm.reset();
      renderApitexDashboard();
      showToast(`Transferred ${formatCurrency(amount)} to ${toAcc.bankName}`, 'success');
    });
  }

  // Add Contact Form
  const addContactForm = document.getElementById('form-add-contact');
  if (addContactForm) {
    addContactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name-input').value.trim();
      const phone = document.getElementById('contact-phone-input').value.trim();

      if (!name) return;

      const contacts = BankDB.getContacts();
      contacts.push({
        id: 'cnt_' + Date.now(),
        name: name,
        phone: phone || '01700-000000',
        initial: name[0].toUpperCase(),
        bg: '#FFD7C1'
      });
      BankDB.saveContacts(contacts);

      closeModal('modal-add-contact');
      addContactForm.reset();
      renderQuickContacts(BankDB.getContacts());
      showToast(`Added ${name} to quick contacts`, 'success');
    });
  }
}

function populateAccountSelects() {
  const accounts = BankDB.getAccounts();
  const selectIds = ['add-money-account', 'withdraw-account', 'transfer-from-account', 'transfer-to-account'];

  selectIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = accounts.map((acc, idx) => `
      <option value="${acc.id}" ${idx === 0 ? 'selected' : ''}>
        ${escapeHtml(acc.bankName)} (${acc.accountNumber}) - ${formatCurrency(acc.balance)}
      </option>
    `).join('');
  });

  const destTransfer = document.getElementById('transfer-to-account');
  if (destTransfer && accounts.length > 1) {
    destTransfer.selectedIndex = 1;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
