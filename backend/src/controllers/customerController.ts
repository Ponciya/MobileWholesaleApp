import { Request, Response } from 'express';
import pool from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

interface CustomerData {
  name: string;
  business_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  credit_limit?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

// Get all customers
export const getAllCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ` AND (name LIKE ? OR business_name LIKE ? OR phone LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'ALL') {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY name ASC`;

    const [rows] = await pool.query(query, params);
    sendSuccess(res, 'Customers fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    sendError(res, 'Failed to fetch customers', 500);
  }
};

// Get single customer
export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);

    const customers = rows as any[];
    if (customers.length === 0) {
      sendError(res, 'Customer not found', 404);
      return;
    }

    sendSuccess(res, 'Customer fetched successfully', customers[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    sendError(res, 'Failed to fetch customer', 500);
  }
};

// Create customer
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const data: CustomerData = req.body;

    if (!data.name) {
      sendError(res, 'Customer name is required', 400);
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO customers (name, business_name, phone, email, address, credit_limit, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.business_name || null,
        data.phone || null,
        data.email || null,
        data.address || null,
        data.credit_limit || 0,
        data.status || 'ACTIVE'
      ]
    );

    const insertResult = result as any;
    const [newCustomer] = await pool.query('SELECT * FROM customers WHERE id = ?', [insertResult.insertId]);
    sendSuccess(res, 'Customer created successfully', (newCustomer as any[])[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    sendError(res, 'Failed to create customer', 500);
  }
};

// Update customer
export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data: Partial<CustomerData> = req.body;

    const [existing] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    const customers = existing as any[];
    if (customers.length === 0) {
      sendError(res, 'Customer not found', 404);
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    const fields = ['name', 'business_name', 'phone', 'email', 'address', 'credit_limit', 'status'];
    fields.forEach(field => {
      if (data[field as keyof CustomerData] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field as keyof CustomerData]);
      }
    });

    updates.push('updated_at = NOW()');

    if (updates.length === 0) {
      sendError(res, 'No fields to update', 400);
      return;
    }

    values.push(id);
    await pool.query(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    sendSuccess(res, 'Customer updated successfully', (updated as any[])[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    sendError(res, 'Failed to update customer', 500);
  }
};

// Delete customer (soft delete)
export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    const customers = existing as any[];
    if (customers.length === 0) {
      sendError(res, 'Customer not found', 404);
      return;
    }

    await pool.query('UPDATE customers SET status = ? WHERE id = ?', ['INACTIVE', id]);
    sendSuccess(res, 'Customer deleted successfully');
  } catch (error) {
    console.error('Error deleting customer:', error);
    sendError(res, 'Failed to delete customer', 500);
  }
};