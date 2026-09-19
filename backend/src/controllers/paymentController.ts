import { Request, Response } from 'express';
import pool from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

// Get all payments
export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, customer_id, supplier_id } = req.query;
    const user = (req as any).user;
    const isAdmin = user?.role === 'ADMIN';

    let query = `
      SELECT p.*, 
             c.name as customer_name,
             s.supplier_name as supplier_name
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // ✅ Employee can only see customer payments (not supplier)
    if (!isAdmin) {
      query += ` AND p.payment_type = 'CUSTOMER'`;
    }

    if (type) {
      query += ` AND p.payment_type = ?`;
      params.push(type);
    }

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    if (customer_id) {
      query += ` AND p.customer_id = ?`;
      params.push(customer_id);
    }

    if (supplier_id) {
      query += ` AND p.supplier_id = ?`;
      params.push(supplier_id);
    }

    query += ` ORDER BY p.payment_date DESC, p.id DESC`;

    const [rows] = await pool.query(query, params);
    sendSuccess(res, 'Payments fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    sendError(res, 'Failed to fetch payments', 500);
  }
};

// Get single payment
export const getPaymentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT p.*, 
              c.name as customer_name,
              s.supplier_name as supplier_name
       FROM payments p
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ?`,
      [id]
    );

    const payments = rows as any[];
    if (payments.length === 0) {
      sendError(res, 'Payment not found', 404);
      return;
    }

    sendSuccess(res, 'Payment fetched successfully', payments[0]);
  } catch (error) {
    console.error('Error fetching payment:', error);
    sendError(res, 'Failed to fetch payment', 500);
  }
};

// Create customer payment
// Create supplier payment
export const createSupplierPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplier_id, purchase_id, amount, payment_method, reference_number, notes } = req.body;
    const userId = (req as any).user?.userId;

    if (!supplier_id) {
      sendError(res, 'Supplier is required', 400);
      return;
    }
    if (!purchase_id) {
      sendError(res, 'Purchase is required', 400);
      return;
    }
    if (!amount || amount <= 0) {
      sendError(res, 'Amount must be greater than 0', 400);
      return;
    }

    const [supplier] = await pool.query('SELECT id FROM suppliers WHERE id = ?', [supplier_id]);
    if ((supplier as any[]).length === 0) {
      sendError(res, 'Supplier not found', 404);
      return;
    }

    const [purchase] = await pool.query('SELECT * FROM purchases WHERE id = ?', [purchase_id]);
    const purchases = purchase as any[];
    if (purchases.length === 0) {
      sendError(res, 'Purchase not found', 404);
      return;
    }

    const purchaseData = purchases[0];

    // Insert payment
    const [result] = await pool.query(
      `INSERT INTO payments (
        supplier_id, purchase_id, amount, payment_date,
        payment_method, reference_number, notes, payment_type, status, created_by
      ) VALUES (?, ?, ?, NOW(), ?, ?, ?, 'SUPPLIER', ?, ?)`,
      [supplier_id, purchase_id, amount, payment_method || null, reference_number || null, notes || null, 'PAID', userId || null]
    );

    const paymentId = (result as any).insertId;

    // Calculate total paid
    const [paymentRows] = await pool.query(
      'SELECT SUM(amount) as total_paid FROM payments WHERE purchase_id = ?',
      [purchase_id]
    );
    const totalPaid = (paymentRows as any[])[0]?.total_paid || 0;

    let paymentStatus = 'PENDING';
    if (totalPaid >= purchaseData.total_amount) {
      paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      paymentStatus = 'PARTIAL';
    }

    await pool.query(
      'UPDATE purchases SET payment_status = ? WHERE id = ?',
      [paymentStatus, purchase_id]
    );

    const [newPayment] = await pool.query(
      `SELECT p.*, s.supplier_name as supplier_name
       FROM payments p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ?`,
      [paymentId]
    );

    sendSuccess(res, 'Supplier payment added successfully', (newPayment as any[])[0]);
  } catch (error) {
    console.error('Error creating supplier payment:', error);
    sendError(res, 'Failed to create payment', 500);
  }
};

// Create customer payment
export const createCustomerPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customer_id, sale_id, amount, payment_method, reference_number, notes } = req.body;
    const userId = (req as any).user?.userId;

    if (!customer_id) {
      sendError(res, 'Customer is required', 400);
      return;
    }
    if (!sale_id) {
      sendError(res, 'Sale is required', 400);
      return;
    }
    if (!amount || amount <= 0) {
      sendError(res, 'Amount must be greater than 0', 400);
      return;
    }

    const [customer] = await pool.query('SELECT id FROM customers WHERE id = ?', [customer_id]);
    if ((customer as any[]).length === 0) {
      sendError(res, 'Customer not found', 404);
      return;
    }

    const [sale] = await pool.query('SELECT * FROM sales WHERE id = ?', [sale_id]);
    const sales = sale as any[];
    if (sales.length === 0) {
      sendError(res, 'Sale not found', 404);
      return;
    }

    const saleData = sales[0];
    const newPending = saleData.pending_amount - amount;
    let paymentStatus = 'PARTIAL';
    if (newPending <= 0) paymentStatus = 'PAID';

    const [result] = await pool.query(
      `INSERT INTO payments (
        customer_id, sale_id, amount, payment_date,
        payment_method, reference_number, notes, payment_type, status, created_by
      ) VALUES (?, ?, ?, NOW(), ?, ?, ?, 'CUSTOMER', ?, ?)`,
      [customer_id, sale_id, amount, payment_method || null, reference_number || null, notes || null, paymentStatus, userId || null]
    );

    const paymentId = (result as any).insertId;

    await pool.query(
      'UPDATE sales SET paid_amount = paid_amount + ?, pending_amount = ?, payment_status = ? WHERE id = ?',
      [amount, newPending > 0 ? newPending : 0, paymentStatus, sale_id]
    );

    const [newPayment] = await pool.query(
      `SELECT p.*, c.name as customer_name
       FROM payments p
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE p.id = ?`,
      [paymentId]
    );

    sendSuccess(res, 'Customer payment added successfully', (newPayment as any[])[0]);
  } catch (error) {
    console.error('Error creating customer payment:', error);
    sendError(res, 'Failed to create payment', 500);
  }
};

// Delete payment
export const deletePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
    const payments = existing as any[];
    if (payments.length === 0) {
      sendError(res, 'Payment not found', 404);
      return;
    }

    await pool.query('DELETE FROM payments WHERE id = ?', [id]);
    sendSuccess(res, 'Payment deleted successfully');
  } catch (error) {
    console.error('Error deleting payment:', error);
    sendError(res, 'Failed to delete payment', 500);
  }
};