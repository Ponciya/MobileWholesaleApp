import { Router } from 'express';
import {
  getSalesReport,
  getPurchaseReport,
  getStockReport,
  getProfitReport,
  getExpenseReport,
  getLowStockReport,
  getProfitLoss,
  getDashboardSummary,
} from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/sales', authenticate, authorize('VIEW_REPORTS'), getSalesReport);
router.get('/purchases', authenticate, authorize('VIEW_REPORTS'), getPurchaseReport);
router.get('/stock', authenticate, authorize('VIEW_REPORTS'), getStockReport);
router.get('/profit', authenticate, authorize('VIEW_REPORTS'), getProfitReport);
router.get('/expenses', authenticate, authorize('VIEW_REPORTS'), getExpenseReport);
router.get('/low-stock', authenticate, authorize('VIEW_REPORTS'), getLowStockReport);
router.get('/profit-loss', authenticate, authorize('VIEW_REPORTS'), getProfitLoss);
router.get('/dashboard-summary', authenticate, getDashboardSummary);

export default router;