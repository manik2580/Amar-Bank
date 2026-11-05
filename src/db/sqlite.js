/**
 * SQLite Database Abstraction Layer for MyBank
 * Built with Node.js native DatabaseSync (node:sqlite)
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'mybank.sqlite');

let dbInstance = null;

export const DEFAULT_USER = {
  id: 'default_user',
  name: 'H. R. Manik',
  email: 'official.hrmanik@gmail.com',
  phone: '01712-889900',
  role: 'Apitex Platinum Member',
  initials: 'HR'
};

export const DEFAULT_SETTINGS = {
  id: 'default_settings',
  currency: 'BDT',
  hideBalance: 0,
  requirePin: 1,
  emailAlerts: 1
};

export const DEFAULT_BANKS = [
  { id: 'acc_1', bankName: 'BRAC Bank', accountType: 'Salary Account', accountNumber: '•••• •••• 5821', branch: 'Gulshan 1 Branch', balance: 0, currency: 'BDT', status: 'Active' },
  { id: 'acc_2', bankName: 'Dutch-Bangla Bank', accountType: 'Savings Account', accountNumber: '•••• •••• 9204', branch: 'Dhanmondi Branch', balance: 0, currency: 'BDT', status: 'Active' },
  { id: 'acc_3', bankName: 'Eastern Bank', accountType: 'Current Account', accountNumber: '•••• •••• 1432', branch: 'Uttara Model Town', balance: 0, currency: 'BDT', status: 'Active' },
  { id: 'acc_4', bankName: 'Southeast Bank', accountType: 'Fixed Deposit', accountNumber: '•••• •••• 7719', branch: 'Motijheel Corporate', balance: 0, currency: 'BDT', status: 'Active' }
];

export const DEFAULT_TRANSACTIONS = [];

export function getDb() {
  if (!dbInstance) {
    initDatabase();
  }
  return dbInstance;
}

export function initDatabase() {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  dbInstance = new DatabaseSync(DB_PATH);

  try {
    dbInstance.exec('PRAGMA journal_mode = WAL;');
  } catch (err) {}

  // Create tables
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      role TEXT,
      initials TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      currency TEXT NOT NULL DEFAULT 'BDT',
      hideBalance INTEGER NOT NULL DEFAULT 0,
      requirePin INTEGER NOT NULL DEFAULT 1,
      emailAlerts INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      bankName TEXT NOT NULL,
      accountType TEXT NOT NULL,
      accountNumber TEXT NOT NULL,
      branch TEXT,
      balance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'BDT',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      sourceAccount TEXT NOT NULL,
      destAccount TEXT,
      description TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Completed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default user if not exists
  const existingUser = dbInstance.prepare('SELECT * FROM users WHERE id = ?').get('default_user');
  if (!existingUser) {
    dbInstance.prepare(`
      INSERT INTO users (id, name, email, phone, role, initials, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      DEFAULT_USER.id,
      DEFAULT_USER.name,
      DEFAULT_USER.email,
      DEFAULT_USER.phone,
      DEFAULT_USER.role,
      DEFAULT_USER.initials
    );
  }

  // Seed default settings if not exists
  const existingSettings = dbInstance.prepare('SELECT * FROM settings WHERE id = ?').get('default_settings');
  if (!existingSettings) {
    dbInstance.prepare(`
      INSERT INTO settings (id, currency, hideBalance, requirePin, emailAlerts, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      DEFAULT_SETTINGS.id,
      DEFAULT_SETTINGS.currency,
      DEFAULT_SETTINGS.hideBalance,
      DEFAULT_SETTINGS.requirePin,
      DEFAULT_SETTINGS.emailAlerts
    );
  }

  // Seed default accounts if empty
  const accountCount = dbInstance.prepare('SELECT COUNT(*) as count FROM accounts').get();
  if (accountCount && accountCount.count === 0) {
    const insertAcc = dbInstance.prepare(`
      INSERT INTO accounts (id, bankName, accountType, accountNumber, branch, balance, currency, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const b of DEFAULT_BANKS) {
      insertAcc.run(b.id, b.bankName, b.accountType, b.accountNumber, b.branch, b.balance, b.currency, b.status);
    }
  }

  // Seed default transactions if empty
  const txCount = dbInstance.prepare('SELECT COUNT(*) as count FROM transactions').get();
  if (txCount && txCount.count === 0) {
    const insertTx = dbInstance.prepare(`
      INSERT INTO transactions (id, date, amount, type, category, sourceAccount, destAccount, description, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of DEFAULT_TRANSACTIONS) {
      insertTx.run(t.id, t.date, t.amount, t.type, t.category, t.sourceAccount, t.destAccount, t.description, t.notes, t.status);
    }
  }

  // Ensure EUR is sanitized to BDT and existing demo accounts are zeroed out
  try {
    dbInstance.exec(`
      UPDATE settings SET currency = 'BDT' WHERE currency = 'EUR';
      UPDATE accounts SET balance = 0;
      DELETE FROM transactions;
    `);
  } catch (e) {}

  return dbInstance;
}

export function computeInitials(name) {
  if (!name || typeof name !== 'string') return 'HR';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'HR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getUser(userId = 'default_user') {
  const db = getDb();
  let row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!row) {
    row = db.prepare('SELECT * FROM users LIMIT 1').get();
  }
  if (!row) {
    initDatabase();
    row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }
  return row ? { ...row } : { ...DEFAULT_USER };
}

export function updateUser(updates = {}, userId = 'default_user') {
  const db = getDb();
  const current = getUser(userId);

  const name = updates.name !== undefined ? String(updates.name).trim() : current.name;
  const email = updates.email !== undefined ? String(updates.email).trim() : current.email;
  const phone = updates.phone !== undefined ? String(updates.phone).trim() : current.phone;
  const role = updates.role !== undefined ? String(updates.role).trim() : current.role;

  let initials = updates.initials !== undefined ? String(updates.initials).trim().toUpperCase() : current.initials;
  if (!initials || (updates.name && updates.initials === undefined)) {
    initials = computeInitials(name);
  }

  db.prepare(`
    UPDATE users
    SET name = ?,
        email = ?,
        phone = ?,
        role = ?,
        initials = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, email, phone, role, initials, current.id || userId);

  return getUser(current.id || userId);
}

export function getSettings(settingsId = 'default_settings') {
  const db = getDb();
  let row = db.prepare('SELECT * FROM settings WHERE id = ?').get(settingsId);
  if (!row) {
    row = db.prepare('SELECT * FROM settings LIMIT 1').get();
  }
  if (!row) {
    initDatabase();
    row = db.prepare('SELECT * FROM settings WHERE id = ?').get(settingsId);
  }

  if (!row) {
    return {
      currency: 'BDT',
      hideBalance: false,
      requirePin: true,
      emailAlerts: true
    };
  }

  return {
    id: row.id,
    currency: row.currency || 'BDT',
    hideBalance: Boolean(row.hideBalance),
    requirePin: Boolean(row.requirePin),
    emailAlerts: Boolean(row.emailAlerts),
    updated_at: row.updated_at
  };
}

export function updateSettings(updates = {}, settingsId = 'default_settings') {
  const db = getDb();
  const current = getSettings(settingsId);

  const currency = updates.currency !== undefined ? String(updates.currency).trim().toUpperCase() : current.currency;
  const hideBalance = updates.hideBalance !== undefined ? (updates.hideBalance ? 1 : 0) : (current.hideBalance ? 1 : 0);
  const requirePin = updates.requirePin !== undefined ? (updates.requirePin ? 1 : 0) : (current.requirePin ? 1 : 0);
  const emailAlerts = updates.emailAlerts !== undefined ? (updates.emailAlerts ? 1 : 0) : (current.emailAlerts ? 1 : 0);

  db.prepare(`
    UPDATE settings
    SET currency = ?,
        hideBalance = ?,
        requirePin = ?,
        emailAlerts = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(currency, hideBalance, requirePin, emailAlerts, current.id || settingsId);

  return getSettings(current.id || settingsId);
}

// -------------------------------------------------------------
// Bank Accounts Database Operations
// -------------------------------------------------------------
export function getAccountsFromDb() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM accounts ORDER BY created_at DESC').all();
  return rows || [];
}

export function getAccountByIdFromDb(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
}

export function saveAccountToDb(acc) {
  const db = getDb();
  const existing = getAccountByIdFromDb(acc.id);
  if (existing) {
    db.prepare(`
      UPDATE accounts
      SET bankName = ?, accountType = ?, accountNumber = ?, branch = ?, balance = ?, currency = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(acc.bankName, acc.accountType, acc.accountNumber, acc.branch || '', acc.balance, acc.currency || 'BDT', acc.status || 'Active', acc.id);
  } else {
    db.prepare(`
      INSERT INTO accounts (id, bankName, accountType, accountNumber, branch, balance, currency, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(acc.id, acc.bankName, acc.accountType, acc.accountNumber, acc.branch || '', acc.balance, acc.currency || 'BDT', acc.status || 'Active');
  }
  return getAccountByIdFromDb(acc.id);
}

export function deleteAccountFromDb(id) {
  const db = getDb();
  const acc = getAccountByIdFromDb(id);
  const info = db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  return {
    deleted: info.changes > 0,
    account: acc
  };
}

// -------------------------------------------------------------
// Transactions Database Operations
// -------------------------------------------------------------
export function getTransactionsFromDb() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
  return rows || [];
}

export function getTransactionByIdFromDb(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
}

export function saveTransactionToDb(tx) {
  const db = getDb();
  const existing = getTransactionByIdFromDb(tx.id);
  if (existing) {
    db.prepare(`
      UPDATE transactions
      SET date = ?, amount = ?, type = ?, category = ?, sourceAccount = ?, destAccount = ?, description = ?, notes = ?, status = ?
      WHERE id = ?
    `).run(tx.date, tx.amount, tx.type, tx.category, tx.sourceAccount, tx.destAccount || '', tx.description, tx.notes || '', tx.status || 'Completed', tx.id);
  } else {
    db.prepare(`
      INSERT INTO transactions (id, date, amount, type, category, sourceAccount, destAccount, description, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tx.id, tx.date, tx.amount, tx.type, tx.category, tx.sourceAccount, tx.destAccount || '', tx.description, tx.notes || '', tx.status || 'Completed');
  }
  return getTransactionByIdFromDb(tx.id);
}

export function deleteTransactionFromDb(id) {
  const db = getDb();
  const tx = getTransactionByIdFromDb(id);
  const info = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  return {
    deleted: info.changes > 0,
    transaction: tx
  };
}

// -------------------------------------------------------------
// Reset Database
// -------------------------------------------------------------
export function resetDatabase() {
  const db = getDb();
  db.prepare('DELETE FROM users').run();
  db.prepare('DELETE FROM settings').run();
  db.prepare('DELETE FROM accounts').run();
  db.prepare('DELETE FROM transactions').run();

  db.prepare(`
    INSERT INTO users (id, name, email, phone, role, initials, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(
    DEFAULT_USER.id,
    DEFAULT_USER.name,
    DEFAULT_USER.email,
    DEFAULT_USER.phone,
    DEFAULT_USER.role,
    DEFAULT_USER.initials
  );

  db.prepare(`
    INSERT INTO settings (id, currency, hideBalance, requirePin, emailAlerts, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(
    DEFAULT_SETTINGS.id,
    DEFAULT_SETTINGS.currency,
    DEFAULT_SETTINGS.hideBalance,
    DEFAULT_SETTINGS.requirePin,
    DEFAULT_SETTINGS.emailAlerts
  );

  const insertAcc = db.prepare(`
    INSERT INTO accounts (id, bankName, accountType, accountNumber, branch, balance, currency, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const b of DEFAULT_BANKS) {
    insertAcc.run(b.id, b.bankName, b.accountType, b.accountNumber, b.branch, b.balance, b.currency, b.status);
  }

  const insertTx = db.prepare(`
    INSERT INTO transactions (id, date, amount, type, category, sourceAccount, destAccount, description, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of DEFAULT_TRANSACTIONS) {
    insertTx.run(t.id, t.date, t.amount, t.type, t.category, t.sourceAccount, t.destAccount, t.description, t.notes, t.status);
  }

  return {
    user: getUser(),
    settings: getSettings(),
    accounts: getAccountsFromDb(),
    transactions: getTransactionsFromDb()
  };
}
