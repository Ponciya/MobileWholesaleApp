import { Router } from 'express';
import {
  getAllPayments,
  getPaymentById,
  createCustomerPayment,
  createSupplierPayment,
  deletePayment,
} from '../controllers/paymentController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getAllPayments);
router.get('/:id', authenticate, getPaymentById);
router.post('/customer', authenticate, authorize('MANAGE_PAYMENTS'), createCustomerPayment);
router.post('/supplier', authenticate, authorize('MANAGE_PAYMENTS'), createSupplierPayment);
router.delete('/:id', authenticate, authorize('MANAGE_PAYMENTS'), deletePayment);

export default router;