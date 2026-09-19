import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import pool from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

// Get all employees (Admin only)
export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, employee_id, phone, email, role, permissions, status, created_at 
       FROM users 
       WHERE role = 'EMPLOYEE'
       ORDER BY created_at DESC`
    );
    sendSuccess(res, 'Employees fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    sendError(res, 'Failed to fetch employees', 500);
  }
};

// Get single employee
export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT id, name, employee_id, phone, email, role, permissions, status, created_at 
       FROM users 
       WHERE id = ? AND role = 'EMPLOYEE'`,
      [id]
    );

    const employees = rows as any[];
    if (employees.length === 0) {
      sendError(res, 'Employee not found', 404);
      return;
    }

    sendSuccess(res, 'Employee fetched successfully', employees[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    sendError(res, 'Failed to fetch employee', 500);
  }
};

// Create employee (Admin only)
export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, employee_id, phone, email, password, role, permissions, status } = req.body;
    const userId = (req as any).user?.userId;

    // Validation
    if (!name) {
      sendError(res, 'Name is required', 400);
      return;
    }
    if (!employee_id) {
      sendError(res, 'Employee ID is required', 400);
      return;
    }
    if (!email) {
      sendError(res, 'Email is required', 400);
      return;
    }
    if (!password) {
      sendError(res, 'Password is required', 400);
      return;
    }

    // Check duplicate employee_id
    const [existing] = await pool.query('SELECT id FROM users WHERE employee_id = ?', [employee_id]);
    if ((existing as any[]).length > 0) {
      sendError(res, 'Employee ID already exists', 400);
      return;
    }

    // Check duplicate email
    const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if ((existingEmail as any[]).length > 0) {
      sendError(res, 'Email already exists', 400);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert employee
    const [result] = await pool.query(
      `INSERT INTO users (
        name, employee_id, phone, email, password_hash, 
        role, permissions, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        employee_id,
        phone || null,
        email,
        hashedPassword,
        'EMPLOYEE',
        permissions ? JSON.stringify(permissions) : JSON.stringify([]),
        status || 'INVITED',
        userId || null
      ]
    );

    const insertResult = result as any;
    const [newEmployee] = await pool.query(
      `SELECT id, name, employee_id, phone, email, role, permissions, status, created_at 
       FROM users 
       WHERE id = ?`,
      [insertResult.insertId]
    );

    sendSuccess(res, 'Employee created successfully', (newEmployee as any[])[0]);
  } catch (error) {
    console.error('Error creating employee:', error);
    sendError(res, 'Failed to create employee', 500);
  }
};

// Update employee (Admin only)
export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, email, role, permissions, status } = req.body;

    const [existing] = await pool.query('SELECT * FROM users WHERE id = ? AND role = ?', [id, 'EMPLOYEE']);
    const employees = existing as any[];
    if (employees.length === 0) {
      sendError(res, 'Employee not found', 404);
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (email) { updates.push('email = ?'); values.push(email); }
    if (role) { updates.push('role = ?'); values.push(role); }
    if (permissions !== undefined) { 
      updates.push('permissions = ?'); 
      values.push(JSON.stringify(permissions));
    }
    if (status) { updates.push('status = ?'); values.push(status); }

    if (updates.length === 0) {
      sendError(res, 'No fields to update', 400);
      return;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query(
      `SELECT id, name, employee_id, phone, email, role, permissions, status, created_at 
       FROM users 
       WHERE id = ?`,
      [id]
    );

    sendSuccess(res, 'Employee updated successfully', (updated as any[])[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    sendError(res, 'Failed to update employee', 500);
  }
};

// Delete/Deactivate employee (Admin only)
export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM users WHERE id = ? AND role = ?', [id, 'EMPLOYEE']);
    const employees = existing as any[];
    if (employees.length === 0) {
      sendError(res, 'Employee not found', 404);
      return;
    }

    // Soft delete - set status to DEACTIVATED
    await pool.query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', ['DEACTIVATED', id]);

    sendSuccess(res, 'Employee deactivated successfully');
  } catch (error) {
    console.error('Error deleting employee:', error);
    sendError(res, 'Failed to delete employee', 500);
  }
};

// Reset employee password (Admin only)
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password) {
      sendError(res, 'New password is required', 400);
      return;
    }

    const [existing] = await pool.query('SELECT * FROM users WHERE id = ? AND role = ?', [id, 'EMPLOYEE']);
    const employees = existing as any[];
    if (employees.length === 0) {
      sendError(res, 'Employee not found', 404);
      return;
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, id]);

    sendSuccess(res, 'Password reset successfully');
  } catch (error) {
    console.error('Error resetting password:', error);
    sendError(res, 'Failed to reset password', 500);
  }
};

// Get current employee profile
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const [rows] = await pool.query(
      `SELECT id, name, employee_id, phone, email, role, permissions, status, created_at 
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    const users = rows as any[];
    if (users.length === 0) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, 'Profile fetched successfully', users[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    sendError(res, 'Failed to fetch profile', 500);
  }
};

// Update current employee profile
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { name, phone, email, current_password, new_password } = req.body;

    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const users = existing as any[];
    if (users.length === 0) {
      sendError(res, 'User not found', 404);
      return;
    }

    const user = users[0];

    // If changing password, verify current password
    if (new_password) {
      if (!current_password) {
        sendError(res, 'Current password is required to change password', 400);
        return;
      }
      const isValid = await bcrypt.compare(current_password, user.password_hash);
      if (!isValid) {
        sendError(res, 'Current password is incorrect', 400);
        return;
      }
      const hashedPassword = await bcrypt.hash(new_password, 10);
      await pool.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, userId]);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (email) { updates.push('email = ?'); values.push(email); }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(userId);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await pool.query(
      `SELECT id, name, employee_id, phone, email, role, permissions, status, created_at 
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    sendSuccess(res, 'Profile updated successfully', (updated as any[])[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    sendError(res, 'Failed to update profile', 500);
  }
};