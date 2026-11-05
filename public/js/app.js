/**
 * MyBank – Apitex Theme Core Framework & State Management
 * Shared utilities, banking storage, contacts, notifications, and modal controls.
 */

const STORAGE_KEYS = {
  ACCOUNTS: 'mybank_accounts',
  CARDS: 'mybank_cards',
  TRANSACTIONS: 'mybank_transactions',
  WALLETS: 'mybank_wallets',
  CONTACTS: 'mybank_contacts',
  NOTIFICATIONS: 'mybank_notifications',
  SETTINGS: 'mybank_settings',
  USER: 'mybank_current_user'
};

// Default User Profile
const DEFAULT_USER = {
  name: 'H. R. Manik',
  email: 'official.hrmanik@gmail.com',
  phone: '01712-889900',
  role: 'Apitex Platinum Member',
  initials: 'HR'
};

// Preset Bangladesh & Global Accounts (All initial amounts set to 0)
const DEFAULT_BANKS = [
  { id: 'acc_1', bankName: 'BRAC Bank', accountType: 'Salary Account', accountNumber: '•••• •••• 5821', branch: 'Gulshan 1 Branch', balance: 0, currency: 'BDT', status: 'Active' },
  { id: 'acc_2', bankName: 'Dutch-Bangla Bank', accountType: 'Savings Account', accountNumber: '•••• •••• 9204', branch: 'Dhanmondi Branch', balance: 0, currency: 'BDT', status: 'Active' },
  { id: 'acc_3', bankName: 'Eastern Bank', accountType: 'Current Account', accountNumber: '•••• •••• 1432', branch: 'Uttara Model Town', balance: 0, currency: 'BDT', status: 'Active' },
  { id: 'acc_4', bankName: 'Southeast Bank', accountType: 'Fixed Deposit', accountNumber: '•••• •••• 7719', branch: 'Motijheel Corporate', balance: 0, currency: 'BDT', status: 'Active' }
];

const DEFAULT_CARDS = [
  {
    id: 'card_1',
    cardholderName: 'H. R. MANIK',
    bankName: 'BRAC Bank',
    network: 'visa',
    nickname: 'Signature Gold Visa',
    last4: '4892',
    expiryMonth: '09',
    expiryYear: '29',
    contactless: true,
    annualFee: 0,
    status: 'Active',
    theme: 'navy-peach',
    linkedAccountId: 'acc_1'
  },
  {
    id: 'card_2',
    cardholderName: 'H. R. MANIK',
    bankName: 'Eastern Bank',
    network: 'mastercard',
    nickname: 'SkyMiles Platinum',
    last4: '6105',
    expiryMonth: '04',
    expiryYear: '28',
    contactless: true,
    annualFee: 0,
    status: 'Active',
    theme: 'coral-cream',
    linkedAccountId: 'acc_3'
  }
];

const DEFAULT_WALLETS = [
  { id: 'wal_1', name: 'bKash', number: '017••••4892', balance: 0, received: 0, sent: 0, cashOut: 0, fee: 18.5 },
  { id: 'wal_2', name: 'Nagad', number: '018••••1120', balance: 0, received: 0, sent: 0, cashOut: 0, fee: 14.9 },
  { id: 'wal_3', name: 'Rocket', number: '019••••9901', balance: 0, received: 0, sent: 0, cashOut: 0, fee: 18.0 }
];

const DEFAULT_CONTACTS = [
  { id: 'cnt_1', name: 'Niloy', phone: '01712-889900', initial: 'N', bg: '#FFD7C1' },
  { id: 'cnt_2', name: 'Sarah', phone: '01819-334455', initial: 'S', bg: '#FFF0E7' },
  { id: 'cnt_3', name: 'Zubair', phone: '01911-778899', initial: 'Z', bg: '#FFE4D6' },
  { id: 'cnt_4', name: 'Tanvir', phone: '01614-223344', initial: 'T', bg: '#FCE7DF' }
];

const DEFAULT_NOTIFICATIONS = [
  { id: 'notif_1', title: 'Welcome to MyBank', message: 'Your Apitex mobile banking portfolio is initialized with zero balances.', time: 'Just now', unread: true }
];

const DEFAULT_TRANSACTIONS = [];

function initializeBankState(forceReset = false) {
  // Check if we need to apply zeroing out migration
  const zeroApplied = localStorage.getItem('mybank_zero_balance_applied_v3');

  if (forceReset || !zeroApplied || !localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) {
    const accs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || JSON.stringify(DEFAULT_BANKS));
    accs.forEach(a => a.balance = 0);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accs));

    const wals = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || JSON.stringify(DEFAULT_WALLETS));
    wals.forEach(w => { w.balance = 0; w.received = 0; w.sent = 0; w.cashOut = 0; });
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wals));

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem('mybank_zero_balance_applied_v3', 'true');
  }

  if (forceReset || !localStorage.getItem(STORAGE_KEYS.CARDS)) {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(DEFAULT_CARDS));
  }
  if (forceReset || !localStorage.getItem(STORAGE_KEYS.CONTACTS)) {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(DEFAULT_CONTACTS));
  }
  if (forceReset || !localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
  }
  if (forceReset || !localStorage.getItem(STORAGE_KEYS.USER)) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
  }
  if (forceReset || !localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ currency: 'BDT', hideBalance: false, requirePin: true, emailAlerts: true }));
  } else {
    // Sanitize any existing EUR setting to BDT
    const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
    if (s.currency === 'EUR') {
      s.currency = 'BDT';
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
    }
  }
}

const BankDB = {
  getUser() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || JSON.stringify(DEFAULT_USER));
  },
  saveUser(user, syncServer = true) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    syncUserProfileElements();
    window.dispatchEvent(new CustomEvent('userUpdated', { detail: { user } }));

    if (syncServer && typeof fetch !== 'undefined') {
      fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user })
      }).catch(err => console.warn('Could not sync user to SQLite backend:', err));
    }
  },
  getAccounts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
  },
  saveAccounts(accounts) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },
  getCards() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]');
  },
  saveCards(cards) {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  },
  getWallets() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
  },
  saveWallets(wallets) {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  },
  getTransactions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
  },
  saveTransactions(txs) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  },
  getContacts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTACTS) || '[]');
  },
  saveContacts(contacts) {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  },
  getNotifications() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
  },
  saveNotifications(notifs) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },
  getSettings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{"currency":"BDT","hideBalance":false,"requirePin":true,"emailAlerts":true}');
  },
  saveSettings(settings, syncServer = true) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { settings } }));

    if (syncServer && typeof fetch !== 'undefined') {
      fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      }).catch(err => console.warn('Could not sync settings to SQLite backend:', err));
    }
  },
  async syncFromBackend() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        const serverUser = data.user || data.data?.user;
        const serverSettings = data.settings || data.data?.settings;

        if (serverUser) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(serverUser));
          syncUserProfileElements();
          window.dispatchEvent(new CustomEvent('userUpdated', { detail: { user: serverUser } }));
        }
        if (serverSettings) {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(serverSettings));
          window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { settings: serverSettings } }));
        }
      }
    } catch (e) {
      // Offline fallback
    }
  },
  resetAll() {
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.CARDS);
    localStorage.removeItem(STORAGE_KEYS.WALLETS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CONTACTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.USER);
    initializeBankState(true);
    syncUserProfileElements();
    window.dispatchEvent(new CustomEvent('dataReset'));

    if (typeof fetch !== 'undefined') {
      fetch('/api/settings/reset', { method: 'POST' }).catch(() => {});
    }
  }
};

// Sync user profile across all pages and components
function syncUserProfileElements() {
  const user = BankDB.getUser();
  if (!user) return;

  // Update initials
  let initials = user.initials;
  if (!initials && user.name) {
    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : user.name.slice(0, 2).toUpperCase();
  }

  // Sidebar and Header elements
  document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
  document.querySelectorAll('.user-avatar').forEach(el => el.textContent = initials || 'HR');
  document.querySelectorAll('.user-role').forEach(el => el.textContent = user.role || 'Apitex Platinum');

  // Hero greeting elements (support class and id selectors)
  document.querySelectorAll('.hero-greeting-name, #hero-greeting-name').forEach(el => {
    el.textContent = user.name;
  });
  document.querySelectorAll('.hero-avatar').forEach(el => el.textContent = initials || 'HR');

  // Cardholder name on debit card preview
  document.querySelectorAll('.card-meta-value').forEach(el => {
    const prev = el.previousElementSibling;
    if (prev && prev.textContent && prev.textContent.toLowerCase().includes('holder')) {
      el.textContent = user.name.toUpperCase();
    }
  });

  // Settings inputs
  const settingsNameInput = document.getElementById('settings-name');
  if (settingsNameInput && !settingsNameInput.matches(':focus')) {
    settingsNameInput.value = user.name;
  }
  const settingsEmailInput = document.getElementById('settings-email');
  if (settingsEmailInput && !settingsEmailInput.matches(':focus')) {
    settingsEmailInput.value = user.email || '';
  }
}

// Cross-tab and window storage sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.USER) {
      syncUserProfileElements();
      window.dispatchEvent(new CustomEvent('userUpdated'));
    }
  });
}

// Universal Custom Stylish Confirmation Modal (Apitex Theme & Database-aware)
function showConfirmModal({
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  badge = 'DATABASE DELETE OPERATION',
  itemCardHtml = '',
  confirmText = 'Delete Permanently',
  cancelText = 'Cancel',
  confirmClass = 'btn-danger',
  icon = 'trash-2',
  onConfirm
}) {
  let modal = document.getElementById('modal-app-confirm');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-app-confirm';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-dialog" style="max-width: 460px; text-align: center; padding: 28px 24px; border-radius: var(--radius-xl); background: #FFFFFF; box-shadow: 0 24px 50px rgba(8, 7, 39, 0.26); border: 1px solid var(--border-light); position: relative; animation: modalPop 0.22s ease-out;">
      <!-- Radiant Icon Glow -->
      <div style="width: 62px; height: 62px; margin: 0 auto 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(255, 139, 115, 0.22) 0%, rgba(255, 240, 231, 0.8) 100%); border: 1.5px solid rgba(255, 139, 115, 0.35); box-shadow: 0 8px 18px rgba(255, 139, 115, 0.2);">
        <i id="confirm-modal-icon" data-lucide="${icon}" style="width: 28px; height: 28px; color: #FF8B73;"></i>
      </div>

      <!-- Eyebrow Badge -->
      <div style="margin-bottom: 8px;">
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(255, 139, 115, 0.12); color: #FF6B4A; font-size: 10.5px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; border-radius: 99px; border: 1px solid rgba(255, 139, 115, 0.25);">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #FF8B73; display: inline-block;"></span>
          <span>${badge}</span>
        </span>
      </div>

      <!-- Title & Explanation -->
      <h3 style="font-family: var(--font-display); font-size: 21px; font-weight: 800; color: var(--navy-primary); margin-bottom: 8px; letter-spacing: -0.3px;">
        ${title}
      </h3>
      <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.55; margin-bottom: 16px;">
        ${message}
      </p>

      <!-- Rich Item Card Preview (if provided) -->
      ${itemCardHtml ? `<div style="margin-bottom: 16px; text-align: left;">${itemCardHtml}</div>` : ''}

      <!-- Database Warning Callout -->
      <div style="background: #FFF9F5; border: 1px solid #F1E7E1; border-left: 3px solid #FF8B73; border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 22px; text-align: left; display: flex; align-items: flex-start; gap: 10px;">
        <i data-lucide="alert-circle" style="width: 16px; height: 16px; color: #FF8B73; flex-shrink: 0; margin-top: 2px;"></i>
        <span style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.45;">
          This will execute a direct <strong style="color: var(--navy-primary);">database delete operation</strong> in the SQLite ledger.
        </span>
      </div>

      <!-- Buttons -->
      <div style="display: flex; gap: 12px;">
        <button type="button" class="btn btn-secondary" id="confirm-modal-cancel-btn" style="flex: 1; padding: 12px; font-weight: 600;">
          ${cancelText}
        </button>
        <button type="button" class="btn ${confirmClass}" id="confirm-modal-action-btn" style="flex: 1.25; padding: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
          <span id="confirm-modal-btn-label">${confirmText}</span>
        </button>
      </div>
    </div>
  `;

  const cancelBtn = modal.querySelector('#confirm-modal-cancel-btn');
  const actionBtn = modal.querySelector('#confirm-modal-action-btn');
  const btnLabel = modal.querySelector('#confirm-modal-btn-label');

  cancelBtn.addEventListener('click', () => {
    closeModal('modal-app-confirm');
  });

  actionBtn.addEventListener('click', async () => {
    actionBtn.disabled = true;
    cancelBtn.disabled = true;
    const originalText = btnLabel ? btnLabel.textContent : 'Confirm';
    if (btnLabel) btnLabel.textContent = 'Executing Delete...';

    try {
      if (typeof onConfirm === 'function') {
        await onConfirm();
      }
    } catch (err) {
      console.error('Delete operation error:', err);
      showToast(err.message || 'Failed to delete record', 'error');
    } finally {
      closeModal('modal-app-confirm');
      actionBtn.disabled = false;
      cancelBtn.disabled = false;
      if (btnLabel) btnLabel.textContent = originalText;
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal('modal-app-confirm');
  });

  openModal('modal-app-confirm');
  if (window.lucide) window.lucide.createIcons({ root: modal });
}

// Currency Formatter
// Currency Formatter (BDT & USD only - EUR removed)
function formatCurrency(amount, currency = null) {
  const currentSettings = BankDB.getSettings();
  let cur = currency || currentSettings.currency || 'BDT';
  if (cur === 'EUR') cur = 'BDT';
  const num = Number(amount) || 0;

  if (cur === 'BDT') {
    return '৳ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (cur === 'USD') {
    return '$ ' + (num / 120).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '৳ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Toast notification
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle-2';
  if (type === 'error') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" style="width: 18px; height: 18px; color: ${type === 'success' ? '#10B981' : (type === 'error' ? '#EF4444' : '#FF8B73')};"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  if (window.lucide) window.lucide.createIcons({ root: toast });

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Modal management
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (window.lucide) window.lucide.createIcons({ root: modal });
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// View Transaction Details Receipt Modal
function showTransactionReceipt(txId) {
  const txs = BankDB.getTransactions();
  const tx = txs.find(t => t.id === txId);
  if (!tx) return;

  const modal = document.getElementById('modal-tx-receipt');
  if (!modal) return;

  const isIncome = tx.type === 'Deposit' || tx.type === 'Other Income';
  const isTransfer = tx.type === 'Bank Transfer';
  const prefix = isIncome ? '+' : (isTransfer ? '⇄ ' : '-');
  const color = isIncome ? '#10B981' : (isTransfer ? '#151333' : '#FF8B73');

  document.getElementById('receipt-id').textContent = tx.id;
  document.getElementById('receipt-date').textContent = formatDateTime(tx.date);
  document.getElementById('receipt-amount').textContent = prefix + formatCurrency(tx.amount);
  document.getElementById('receipt-amount').style.color = color;
  document.getElementById('receipt-type').textContent = tx.type;
  document.getElementById('receipt-category').textContent = tx.category;
  document.getElementById('receipt-source').textContent = tx.sourceAccount;
  document.getElementById('receipt-dest').textContent = tx.destAccount || 'Self / Merchant';
  document.getElementById('receipt-desc').textContent = tx.description;
  document.getElementById('receipt-notes').textContent = tx.notes || 'No notes provided';

  openModal('modal-tx-receipt');
}

document.addEventListener('DOMContentLoaded', () => {
  initializeBankState();
  syncUserProfileElements();
  BankDB.syncFromBackend();

  // Mobile Drawer Toggle
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const sidebar = document.querySelector('.app-sidebar');
  let backdrop = document.querySelector('.sidebar-backdrop');

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      backdrop.classList.toggle('active');
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('active');
    });
  }

  // Currency Switcher
  document.querySelectorAll('.currency-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const cur = e.target.getAttribute('data-currency');
      const settings = BankDB.getSettings();
      settings.currency = cur;
      BankDB.saveSettings(settings);

      showToast(`Base currency set to ${cur}`, 'info');
      window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency: cur } }));
    });
  });

  // Modal close handlers
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
    const closeBtn = modal.querySelector('.modal-close, .btn-modal-cancel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(modal.id));
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
    }
  });

  if (window.lucide) window.lucide.createIcons();
});
