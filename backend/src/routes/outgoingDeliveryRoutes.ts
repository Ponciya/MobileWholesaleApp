import { Router } from 'express';
import {
  getAllDeliveries,
  getDeliveryById,
  createDelivery,
  updateDeliveryStatus,
  deleteDelivery,
} from '../controllers/outgoingDeliveryController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getAllDeliveries);
router.get('/:id', authenticate, getDeliveryById);
router.post('/', authenticate, authorize('MANAGE_DELIVERIES'), createDelivery);
router.put('/:id/status', authenticate, authorize('MANAGE_DELIVERIES'), updateDeliveryStatus);
router.delete('/:id', authenticate, authorize('MANAGE_DELIVERIES'), deleteDelivery);

export default router;