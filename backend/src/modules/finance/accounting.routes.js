import express from 'express';
import accountingController from './accounting.controller.js';
import journalController from './journal.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkPermission } from '../../middlewares/permissions.js';

const router = express.Router();

// Chart of Accounts routes
router.post('/accounts', 
  authenticate, 
  checkPermission('finance.create'),
  accountingController.createAccount
);

router.get('/accounts', 
  authenticate, 
  checkPermission('finance.read'),
  accountingController.getAllAccounts
);

router.get('/accounts/hierarchy', 
  authenticate, 
  checkPermission('finance.read'),
  accountingController.getAccountHierarchy
);

router.post('/accounts/initialize', 
  authenticate, 
  checkPermission('finance.create'),
  accountingController.initializeDefaultAccounts
);

router.get('/accounts/:id', 
  authenticate, 
  checkPermission('finance.read'),
  accountingController.getAccountById
);

router.put('/accounts/:id', 
  authenticate, 
  checkPermission('finance.update'),
  accountingController.updateAccount
);

router.delete('/accounts/:id', 
  authenticate, 
  checkPermission('finance.delete'),
  accountingController.deleteAccount
);

router.get('/accounts/:id/balance', 
  authenticate, 
  checkPermission('finance.read'),
  accountingController.getAccountBalance
);

// Journal Entry routes
router.post('/journal-entries', 
  authenticate, 
  checkPermission('finance.create'),
  journalController.createJournalEntry
);

router.get('/journal-entries', 
  authenticate, 
  checkPermission('finance.read'),
  journalController.getAllJournalEntries
);

router.get('/journal-entries/statistics', 
  authenticate, 
  checkPermission('finance.read'),
  journalController.getJournalStatistics
);

router.get('/journal-entries/:id', 
  authenticate, 
  checkPermission('finance.read'),
  journalController.getJournalEntryById
);

router.put('/journal-entries/:id', 
  authenticate, 
  checkPermission('finance.update'),
  journalController.updateJournalEntry
);

router.post('/journal-entries/:id/post', 
  authenticate, 
  checkPermission('finance.approve'),
  journalController.postJournalEntry
);

router.post('/journal-entries/:id/reverse', 
  authenticate, 
  checkPermission('finance.approve'),
  journalController.reverseJournalEntry
);

router.delete('/journal-entries/:id', 
  authenticate, 
  checkPermission('finance.delete'),
  journalController.deleteJournalEntry
);

export default router;
