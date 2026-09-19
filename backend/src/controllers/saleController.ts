import { Request, Response } from 'express';
import pool from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

// Get all sales
export const getAllSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customer_id, status } = req.query;
    let query = `
      SELECT s.*, 
             c.name as customer_name,
             si.product_id, si.quantity, si.selling_price, si.total_amount as item_total,
             p.brand, p.model_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (customer_id) {
      query += ` AND s.customer_id = ?`;
      params.push(customer_id);
    }

    if (status) {
      query += ` AND s.payment_status = ?`;
      params.push(status);
    }

    query += ` ORDER BY s.created_at DESC, s.id DESC`;

    const [rows] = await pool.query(query, params);
    sendSuccess(res, 'Sales fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching sales:', error);
    sendError(res, 'Failed to fetch sales', 500);
  }
};

// Get single sale
// Get single sale with items
export const getSaleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Get sale header
    const [saleRows] = await pool.query(
      `SELECT s.*, c.name as customer_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = ?`,
      [id]
    );

    const sales = saleRows as any[];
    if (sales.length === 0) {
      sendError(res, 'Sale not found', 404);
      return;
    }

    // Get sale items
    const [itemRows] = await pool.query(
      `SELECT si.*, p.brand, p.model_name, p.sku
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      [id]
    );

    const sale = sales[0];
    sale.items = itemRows;

    sendSuccess(res, 'Sale fetched successfully', sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    sendError(res, 'Failed to fetch sale', 500);
  }
};

// Create sale
// Create sale - Supports multiple items
export const createSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customer_id, items, discount, paid_amount, notes } = req.body;
    const userId = (req as any).user?.userId;

    console.log('📦 Received items:', JSON.stringify(items, null, 2));

    // Validation
    if (!customer_id) {
      sendError(res, 'Customer is required', 400);
      return;
    }
    if (!items || items.length === 0) {
      sendError(res, 'At least one product is required', 400);
      return;
    }

    // Check each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`🔍 Item ${i + 1}:`, item);
      
      if (!item.product_id) {
        sendError(res, `Product is required for item ${i + 1}`, 400);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        sendError(res, `Quantity must be greater than 0 for item ${i + 1}`, 400);
        return;
      }
      if (!item.selling_price || item.selling_price <= 0) {
        sendError(res, `Selling price must be greater than 0 for item ${i + 1}`, 400);
        return;
      }
    }

    // Check customer exists
    const [customer] = await pool.query('SELECT id FROM customers WHERE id = ?', [customer_id]);
    if ((customer as any[]).length === 0) {
      sendError(res, 'Customer not found', 404);
      return;
    }

    // Check stock for each item
    for (const item of items) {
      const [productRows] = await pool.query('SELECT id, current_stock FROM products WHERE id = ?', [item.product_id]);
      const products = productRows as any[];
      if (products.length === 0) {
        sendError(res, `Product ${item.product_id} not found`, 404);
        return;
      }
      if (products[0].current_stock < item.quantity) {
        sendError(res, `Insufficient stock for product ${item.product_id}. Available: ${products[0].current_stock}`, 400);
        return;
      }
    }

    // Calculations
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.selling_price), 0);
    const discountAmount = discount || 0;
    const totalAmount = subtotal - discountAmount;
    const paid = paid_amount || 0;
    const pendingAmount = totalAmount - paid;
    let paymentStatus = 'PENDING';
    if (paid >= totalAmount) paymentStatus = 'PAID';
    else if (paid > 0) paymentStatus = 'PARTIAL';

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert into sales
      const [result] = await connection.query(
        `INSERT INTO sales (
          customer_id, sale_date, subtotal, discount, total_amount,
          paid_amount, pending_amount, payment_status, notes, created_by
        ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)`,
        [customer_id, subtotal, discountAmount, totalAmount, paid, pendingAmount, paymentStatus, notes || null, userId || null]
      );

      const saleId = (result as any).insertId;

      // Insert items and update stock
      for (const item of items) {
        const itemTotal = item.quantity * item.selling_price;
        
        // Insert into sale_items
        await connection.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, selling_price, total_amount)
           VALUES (?, ?, ?, ?, ?)`,
          [saleId, item.product_id, item.quantity, item.selling_price, itemTotal]
        );

        // Update product stock
        await connection.query(
          'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );

        // Stock transaction
        await connection.query(
          `INSERT INTO stock_transactions (
            product_id, transaction_type, quantity_change,
            reference_type, reference_id, notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            item.product_id,
            'SALE',
            -item.quantity,
            'sale',
            saleId,
            `Sale - ${item.quantity} units sold`,
            userId || null
          ]
        );
      }

      await connection.commit();
      connection.release();

      // Fetch created sale
      const [newSale] = await pool.query(
        `SELECT s.*, c.name as customer_name
         FROM sales s
         LEFT JOIN customers c ON s.customer_id = c.id
         WHERE s.id = ?`,
        [saleId]
      );

      // Fetch items
      const [itemRows] = await pool.query(
        `SELECT si.*, p.brand, p.model_name
         FROM sale_items si
         LEFT JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?`,
        [saleId]
      );

      const saleData = (newSale as any[])[0];
      saleData.items = itemRows;

      sendSuccess(res, 'Sale created successfully', saleData);

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Error creating sale:', error);
    sendError(res, 'Failed to create sale', 500);
  }
};

// Delete sale
// Delete sale (Hard delete - deletes payments, sale_items, and sale)
export const deleteSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check sale exists
    const [existing] = await pool.query('SELECT * FROM sales WHERE id = ?', [id]);
    const sales = existing as any[];
    if (sales.length === 0) {
      sendError(res, 'Sale not found', 404);
      return;
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Delete payments for this sale (foreign key constraint)
      await connection.query('DELETE FROM payments WHERE sale_id = ?', [id]);

      // 2. Get sale items to restore stock
      const [items] = await connection.query(
        'SELECT product_id, quantity FROM sale_items WHERE sale_id = ?',
        [id]
      );
      const saleItems = items as any[];

      // 3. Restore stock
      for (const item of saleItems) {
        await connection.query(
          'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );

        // Stock transaction
        await connection.query(
          `INSERT INTO stock_transactions (
            product_id, transaction_type, quantity_change,
            reference_type, reference_id, notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            item.product_id,
            'RETURN',
            item.quantity,
            'sale_delete',
            id,
            `Sale deleted - ${item.quantity} units returned`,
            null
          ]
        );
      }

      // 4. Delete sale items
      await connection.query('DELETE FROM sale_items WHERE sale_id = ?', [id]);

      // 5. Delete sale
      await connection.query('DELETE FROM sales WHERE id = ?', [id]);

      await connection.commit();
      connection.release();

      sendSuccess(res, 'Sale deleted successfully');
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting sale:', error);
    sendError(res, 'Failed to delete sale', 500);
  }
};
// Update payment status
export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { payment_status, paid_amount } = req.body;

    const [existing] = await pool.query('SELECT * FROM sales WHERE id = ?', [id]);
    const sales = existing as any[];
    if (sales.length === 0) {
      sendError(res, 'Sale not found', 404);
      return;
    }

    const sale = sales[0];
    const newPaidAmount = paid_amount || sale.paid_amount;
    const newPendingAmount = sale.total_amount - newPaidAmount;

    await pool.query(
      'UPDATE sales SET payment_status = ?, paid_amount = ?, pending_amount = ?, updated_at = NOW() WHERE id = ?',
      [payment_status || sale.payment_status, newPaidAmount, newPendingAmount, id]
    );

    const [updated] = await pool.query(
      `SELECT s.*,
              c.name as customer_name,
              si.product_id, si.quantity, si.selling_price, si.total_amount as item_total,
              p.brand, p.model_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN sale_items si ON s.id = si.sale_id
       LEFT JOIN products p ON si.product_id = p.id
       WHERE s.id = ?`,
      [id]
    );

    sendSuccess(res, 'Payment status updated successfully', (updated as any[])[0]);
  } catch (error) {
    console.error('Error updating payment:', error);
    sendError(res, 'Failed to update payment status', 500);
  }
};