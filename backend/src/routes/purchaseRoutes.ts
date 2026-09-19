import { Router } from 'express';
import {
  getAllPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchaseStatus,
  deletePurchase,
  returnPurchase,
  updatePurchase,
} from '../controllers/purchaseController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getAllPurchases);
router.get('/:id', authenticate, getPurchaseById);

router.post('/', authenticate, authorize('MANAGE_PURCHASES'), createPurchase);
router.put('/:id', authenticate, authorize('MANAGE_PURCHASES'), updatePurchase);
router.put('/:id/status', authenticate, authorize('MANAGE_PURCHASES'), updatePurchaseStatus);
router.post('/:id/return', authenticate, authorize('MANAGE_PURCHASES'), returnPurchase); // 👈 Add
router.delete('/:id', authenticate, authorize('MANAGE_PURCHASES'), deletePurchase);

export default router;