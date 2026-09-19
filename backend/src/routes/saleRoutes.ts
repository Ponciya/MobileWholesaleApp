import { Router } from 'express';
import {
  getAllSales,
  getSaleById,
  createSale,
  deleteSale,
  updatePaymentStatus,
} from '../controllers/saleController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getAllSales);
router.get('/:id', authenticate, getSaleById);

router.post('/', authenticate, authorize('MANAGE_SALES'), createSale);
router.put('/:id/payment', authenticate, authorize('MANAGE_SALES'), updatePaymentStatus);
router.delete('/:id', authenticate, authorize('MANAGE_SALES'), deleteSale);

export default router;