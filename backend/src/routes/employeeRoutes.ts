import { Router } from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resetPassword,
  getMyProfile,
  updateMyProfile,
} from '../controllers/employeeController';
import { authenticate, authorize, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Employee self profile (authenticated users)
router.get('/profile', authenticate, getMyProfile);
router.put('/profile', authenticate, updateMyProfile);

// Admin only routes
router.get('/', authenticate, isAdmin, getAllEmployees);
router.get('/:id', authenticate, isAdmin, getEmployeeById);
router.post('/', authenticate, isAdmin, createEmployee);
router.put('/:id', authenticate, isAdmin, updateEmployee);
router.delete('/:id', authenticate, isAdmin, deleteEmployee);
router.post('/:id/reset-password', authenticate, isAdmin, resetPassword);

export default router;