import { Router } from 'express';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getAllExpenses);
router.get('/:id', authenticate, getExpenseById);
router.post('/', authenticate, authorize('VIEW_EXPENSES'), createExpense);
router.put('/:id', authenticate, authorize('VIEW_EXPENSES'), updateExpense);
router.delete('/:id', authenticate, authorize('VIEW_EXPENSES'), deleteExpense);

export default router;