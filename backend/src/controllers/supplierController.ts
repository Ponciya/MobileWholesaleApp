import { Request, Response } from 'express';
import pool from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

interface SupplierData {
  supplier_name: string;
  company_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

// Get all suppliers
export const getAllSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    let query = 'SELECT * FROM suppliers WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ` AND (supplier_name LIKE ? OR company_name LIKE ? OR phone LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'ALL') {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY supplier_name ASC`;

    const [rows] = await pool.query(query, params);
    sendSuccess(res, 'Suppliers fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    sendError(res, 'Failed to fetch suppliers', 500);
  }
};

// Get single supplier
export const getSupplierById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);

    const suppliers = rows as any[];
    if (suppliers.length === 0) {
      sendError(res, 'Supplier not found', 404);
      return;
    }

    sendSuccess(res, 'Supplier fetched successfully', suppliers[0]);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    sendError(res, 'Failed to fetch supplier', 500);
  }
};

// Create supplier
export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const data: SupplierData = req.body;

    if (!data.supplier_name) {
      sendError(res, 'Supplier name is required', 400);
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO suppliers (supplier_name, company_name, phone, email, address, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.supplier_name,
        data.company_name || null,
        data.phone || null,
        data.email || null,
        data.address || null,
        data.status || 'ACTIVE'
      ]
    );

    const insertResult = result as any;
    const [newSupplier] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [insertResult.insertId]);
    sendSuccess(res, 'Supplier created successfully', (newSupplier as any[])[0]);
  } catch (error) {
    console.error('Error creating supplier:', error);
    sendError(res, 'Failed to create supplier', 500);
  }
};

// Update supplier
export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data: Partial<SupplierData> = req.body;

    const [existing] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    const suppliers = existing as any[];
    if (suppliers.length === 0) {
      sendError(res, 'Supplier not found', 404);
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    const fields = ['supplier_name', 'company_name', 'phone', 'email', 'address', 'status'];
    fields.forEach(field => {
      if (data[field as keyof SupplierData] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field as keyof SupplierData]);
      }
    });

    updates.push('updated_at = NOW()');

    if (updates.length === 0) {
      sendError(res, 'No fields to update', 400);
      return;
    }

    values.push(id);
    await pool.query(`UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    sendSuccess(res, 'Supplier updated successfully', (updated as any[])[0]);
  } catch (error) {
    console.error('Error updating supplier:', error);
    sendError(res, 'Failed to update supplier', 500);
  }
};

// Delete supplier (soft delete)
export const deleteSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    const suppliers = existing as any[];
    if (suppliers.length === 0) {
      sendError(res, 'Supplier not found', 404);
      return;
    }

    await pool.query('UPDATE suppliers SET status = ? WHERE id = ?', ['INACTIVE', id]);
    sendSuccess(res, 'Supplier deleted successfully');
  } catch (error) {
    console.error('Error deleting supplier:', error);
    sendError(res, 'Failed to delete supplier', 500);
  }
};