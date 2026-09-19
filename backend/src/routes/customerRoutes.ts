import { Router } from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getAllCustomers);
router.get('/:id', authenticate, getCustomerById);

router.post('/', authenticate, authorize('MANAGE_CUSTOMERS'), createCustomer);
router.put('/:id', authenticate, authorize('MANAGE_CUSTOMERS'), updateCustomer);
router.delete('/:id', authenticate, authorize('MANAGE_CUSTOMERS'), deleteCustomer);

export default router;