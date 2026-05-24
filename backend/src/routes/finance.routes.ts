import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import * as payments from '../controllers/payment.controller.js';
import * as suppliers from '../controllers/supplier.controller.js';

const router = Router();
const EDITORS = ['ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER'];

// Payments
router.get('/payments', payments.list);
router.get('/payments/aging', payments.aging);
router.get('/payments/cashflow', payments.cashflow);
router.post('/payments', authorize(...EDITORS, 'SALES'), payments.create);
router.patch('/payments/:id', authorize(...EDITORS), payments.update);
router.delete('/payments/:id', authorize(...EDITORS), payments.remove);

// Suppliers
router.get('/suppliers', suppliers.listSuppliers);
router.post('/suppliers', authorize(...EDITORS), suppliers.createSupplier);
router.patch('/suppliers/:id', authorize(...EDITORS), suppliers.updateSupplier);
router.delete('/suppliers/:id', authorize(...EDITORS), suppliers.deleteSupplier);

// Expenses
router.get('/expenses', suppliers.listExpenses);
router.post('/expenses', authorize(...EDITORS), suppliers.createExpense);
router.delete('/expenses/:id', authorize(...EDITORS), suppliers.deleteExpense);

export default router;
