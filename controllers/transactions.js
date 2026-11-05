/**
 * Transactions Controller for MyBank
 * Handles GET, POST, and DELETE requests for transactions with SQLite persistence.
 */
import { Router } from 'express';
import {
  getTransactionsFromDb,
  getTransactionByIdFromDb,
  saveTransactionToDb,
  deleteTransactionFromDb
} from '../src/db/sqlite.js';

export const router = Router();

// GET /api/transactions
router.get('/', (req, res) => {
  try {
    const transactions = getTransactionsFromDb();
    return res.status(200).json({
      success: true,
      transactions,
      data: transactions
    });
  } catch (err) {
    console.error('Error fetching transactions from SQLite:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/transactions/:id
router.get('/:id', (req, res) => {
  try {
    const transaction = getTransactionByIdFromDb(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction record not found' });
    }
    return res.status(200).json({ success: true, transaction });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/transactions
router.post('/', (req, res) => {
  try {
    const tx = req.body;
    if (!tx.amount || !tx.type) {
      return res.status(400).json({ success: false, error: 'Amount and transaction type are required' });
    }
    const saved = saveTransactionToDb({
      id: tx.id || 'TX-' + Math.floor(1000 + Math.random() * 9000),
      date: tx.date || new Date().toISOString(),
      amount: parseFloat(tx.amount) || 0,
      type: tx.type,
      category: tx.category || 'General',
      sourceAccount: tx.sourceAccount || 'Primary Account',
      destAccount: tx.destAccount || '',
      description: tx.description || 'Transaction Entry',
      notes: tx.notes || '',
      status: tx.status || 'Completed'
    });
    return res.status(201).json({ success: true, transaction: saved });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/transactions/:id - Execute Database Delete Operation
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = deleteTransactionFromDb(id);

    if (!result.deleted) {
      return res.status(404).json({
        success: false,
        error: `Transaction ${id} not found in database or already deleted`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Transaction ${id} successfully deleted from SQLite database`,
      deletedTransaction: result.transaction,
      id
    });
  } catch (err) {
    console.error(`Error deleting transaction ${req.params.id} from SQLite:`, err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete transaction from SQLite database',
      details: err.message
    });
  }
});

export default router;
