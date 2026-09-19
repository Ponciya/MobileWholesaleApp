import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStock,
} from '../controllers/productController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.get('/', authenticate, getAllProducts);
router.get('/low-stock', authenticate, getLowStock);
router.get('/:id', authenticate, getProductById);

// Admin only routes (MANAGE_PRODUCTS permission)
router.post('/', authenticate, authorize('MANAGE_PRODUCTS'), createProduct);
router.put('/:id', authenticate, authorize('MANAGE_PRODUCTS'), updateProduct);
router.delete('/:id', authenticate, authorize('MANAGE_PRODUCTS'), deleteProduct);

export default router;