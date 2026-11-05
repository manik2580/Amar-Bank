/**
 * Bank Accounts Controller for MyBank
 * Handles GET, POST, and DELETE requests for bank accounts with SQLite persistence.
 */
import { Router } from 'express';
import {
  getAccountsFromDb,
  getAccountByIdFromDb,
  saveAccountToDb,
  deleteAccountFromDb
} from '../src/db/sqlite.js';

export const router = Router();

// GET /api/accounts
router.get('/', (req, res) => {
  try {
    const accounts = getAccountsFromDb();
    return res.status(200).json({
      success: true,
      accounts,
      data: accounts
    });
  } catch (err) {
    console.error('Error fetching accounts from SQLite:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/accounts/:id
router.get('/:id', (req, res) => {
  try {
    const account = getAccountByIdFromDb(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Bank account not found' });
    }
    return res.status(200).json({ success: true, account });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/accounts
router.post('/', (req, res) => {
  try {
    const acc = req.body;
    if (!acc.bankName || !acc.accountNumber) {
      return res.status(400).json({ success: false, error: 'Bank name and account number required' });
    }
    const saved = saveAccountToDb({
      id: acc.id || 'acc_' + Date.now(),
      bankName: acc.bankName,
      accountType: acc.accountType || 'Savings Account',
      accountNumber: acc.accountNumber,
      branch: acc.branch || '',
      balance: parseFloat(acc.balance) || 0,
      currency: acc.currency || 'BDT',
      status: acc.status || 'Active'
    });
    return res.status(201).json({ success: true, account: saved });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/accounts/:id - Execute Database Delete Operation
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = deleteAccountFromDb(id);

    if (!result.deleted) {
      return res.status(404).json({
        success: false,
        error: `Account ${id} not found in database or already deleted`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Bank account ${id} successfully deleted from SQLite database`,
      deletedAccount: result.account,
      id
    });
  } catch (err) {
    console.error(`Error deleting account ${req.params.id} from SQLite:`, err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete bank account from SQLite database',
      details: err.message
    });
  }
});

export default router;
