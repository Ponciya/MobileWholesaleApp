import { Router } from 'express';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.get('/', authenticate, getAllSuppliers);
router.get('/:id', authenticate, getSupplierById);

// Admin only
router.post('/', authenticate, authorize('MANAGE_PURCHASES'), createSupplier);
router.put('/:id', authenticate, authorize('MANAGE_PURCHASES'), updateSupplier);
router.delete('/:id', authenticate, authorize('MANAGE_PURCHASES'), deleteSupplier);

export default router;