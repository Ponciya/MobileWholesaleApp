import { Request, Response } from 'express';
import pool from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

interface PurchaseData {
  supplier_id: number;
  product_id: number;
  quantity: number;
  purchase_price: number;
  payment_status?: 'PAID' | 'PARTIAL' | 'PENDING';
  status?: 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  notes?: string;
}

// Get all purchases
export const getAllPurchases = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, supplier_id } = req.query;
    let query = `
      SELECT p.*, 
             s.supplier_name as supplier_name,
             pi.product_id, pi.quantity, pi.purchase_price, pi.total_amount as item_total,
             pr.brand, pr.model_name,
             COALESCE(
               (SELECT SUM(amount) FROM payments WHERE purchase_id = p.id), 0
             ) as paid_amount,
             p.total_amount - COALESCE(
               (SELECT SUM(amount) FROM payments WHERE purchase_id = p.id), 0
             ) as pending_amount
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
      LEFT JOIN products pr ON pi.product_id = pr.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    if (supplier_id) {
      query += ` AND p.supplier_id = ?`;
      params.push(supplier_id);
    }

    query += ` ORDER BY p.created_at DESC, p.id DESC`;

    const [rows] = await pool.query(query, params);
    sendSuccess(res, 'Purchases fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    sendError(res, 'Failed to fetch purchases', 500);
  }
};

// Get single purchase
export const getPurchaseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT p.*, 
              s.supplier_name as supplier_name,
              pi.product_id, pi.quantity, pi.purchase_price, pi.total_amount as item_total,
              pr.brand, pr.model_name, pr.sku,
              COALESCE(
                (SELECT SUM(amount) FROM payments WHERE purchase_id = p.id), 0
              ) as paid_amount,
              p.total_amount - COALESCE(
                (SELECT SUM(amount) FROM payments WHERE purchase_id = p.id), 0
              ) as pending_amount
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
       LEFT JOIN products pr ON pi.product_id = pr.id
       WHERE p.id = ?`,
      [id]
    );

    const purchases = rows as any[];
    if (purchases.length === 0) {
      sendError(res, 'Purchase not found', 404);
      return;
    }

    sendSuccess(res, 'Purchase fetched successfully', purchases[0]);
  } catch (error) {
    console.error('Error fetching purchase:', error);
    sendError(res, 'Failed to fetch purchase', 500);
  }
};

// Create purchase
export const createPurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplier_id, product_id, quantity, purchase_price, payment_status, notes } = req.body;
    const userId = (req as any).user?.userId;

    if (!supplier_id) {
      sendError(res, 'Supplier is required', 400);
      return;
    }
    if (!product_id) {
      sendError(res, 'Product is required', 400);
      return;
    }
    if (!quantity || quantity <= 0) {
      sendError(res, 'Quantity must be greater than 0', 400);
      return;
    }
    if (!purchase_price || purchase_price <= 0) {
      sendError(res, 'Purchase price must be greater than 0', 400);
      return;
    }

    const [supplier] = await pool.query('SELECT id FROM suppliers WHERE id = ?', [supplier_id]);
    if ((supplier as any[]).length === 0) {
      sendError(res, 'Supplier not found', 404);
      return;
    }

    const [product] = await pool.query('SELECT id FROM products WHERE id = ?', [product_id]);
    if ((product as any[]).length === 0) {
      sendError(res, 'Product not found', 404);
      return;
    }

    const total_amount = quantity * purchase_price;

    const [result] = await pool.query(
      `INSERT INTO purchases (
        supplier_id, total_amount, payment_status, status, notes, created_by, purchase_date
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        supplier_id,
        total_amount,
        payment_status || 'PENDING',
        'ORDERED',
        notes || null,
        userId || null
      ]
    );

    const insertResult = result as any;
    const purchaseId = insertResult.insertId;

    await pool.query(
      `INSERT INTO purchase_items (
        purchase_id, product_id, quantity, purchase_price, total_amount
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        purchaseId,
        product_id,
        quantity,
        purchase_price,
        total_amount
      ]
    );

    const [newPurchase] = await pool.query(
      `SELECT p.*, 
              s.supplier_name as supplier_name,
              pi.product_id, pi.quantity, pi.purchase_price, pi.total_amount as item_total,
              pr.brand, pr.model_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
       LEFT JOIN products pr ON pi.product_id = pr.id
       WHERE p.id = ?`,
      [purchaseId]
    );

    sendSuccess(res, 'Purchase created successfully', (newPurchase as any[])[0]);
  } catch (error) {
    console.error('Error creating purchase:', error);
    sendError(res, 'Failed to create purchase', 500);
  }
};

// Return purchase
export const returnPurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const [existing] = await pool.query('SELECT * FROM purchases WHERE id = ?', [id]);
    const purchases = existing as any[];
    if (purchases.length === 0) {
      sendError(res, 'Purchase not found', 404);
      return;
    }

    const purchase = purchases[0];

    if (purchase.status !== 'RECEIVED') {
      sendError(res, 'Only received purchases can be returned', 400);
      return;
    }

    const [items] = await pool.query(
      'SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?',
      [id]
    );
    const purchaseItems = items as any[];

    for (const item of purchaseItems) {
      const [productRows] = await pool.query('SELECT current_stock FROM products WHERE id = ?', [
        item.product_id
      ]);
      const product = (productRows as any[])[0];
      const oldStock = product.current_stock;
      const newStock = oldStock - item.quantity;

      if (newStock < 0) {
        sendError(res, `Insufficient stock for product ${item.product_id}`, 400);
        return;
      }

      await pool.query(
        'UPDATE products SET current_stock = ? WHERE id = ?',
        [newStock, item.product_id]
      );

      await pool.query(
        `INSERT INTO stock_transactions (
          product_id, transaction_type, quantity_change, 
          reference_type, reference_id, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.product_id,
          'RETURN',
          -item.quantity,
          'purchase_return',
          id,
          `Returned to supplier - ${item.quantity} units removed`,
          userId || null
        ]
      );
    }

    await pool.query(
      'UPDATE purchases SET status = ?, notes = CONCAT(notes, " - Returned"), updated_at = NOW() WHERE id = ?',
      ['CANCELLED', id]
    );

    sendSuccess(res, 'Purchase returned successfully');
  } catch (error) {
    console.error('Error returning purchase:', error);
    sendError(res, 'Failed to return purchase', 500);
  }
};

// Update purchase status
export const updatePurchaseStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = (req as any).user?.userId;

    const [existing] = await pool.query('SELECT * FROM purchases WHERE id = ?', [id]);
    const purchases = existing as any[];
    if (purchases.length === 0) {
      sendError(res, 'Purchase not found', 404);
      return;
    }

    const currentPurchase = purchases[0];

    if (currentPurchase.status === 'RECEIVED' && status === 'RECEIVED') {
      sendError(res, 'Purchase already received', 400);
      return;
    }

    if (status === 'CANCELLED' && currentPurchase.status === 'RECEIVED') {
      sendError(res, 'Cannot cancel a received purchase', 400);
      return;
    }

    await pool.query(
      'UPDATE purchases SET status = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [status || currentPurchase.status, notes || currentPurchase.notes, id]
    );

    if (status === 'RECEIVED') {
      const [items] = await pool.query(
        'SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?',
        [id]
      );
      const purchaseItems = items as any[];

      for (const item of purchaseItems) {
        const [productRows] = await pool.query('SELECT current_stock FROM products WHERE id = ?', [
          item.product_id
        ]);
        const product = (productRows as any[])[0];
        const oldStock = product.current_stock;
        const newStock = oldStock + item.quantity;

        await pool.query(
          'UPDATE products SET current_stock = ? WHERE id = ?',
          [newStock, item.product_id]
        );

        await pool.query(
          `INSERT INTO stock_transactions (
            product_id, transaction_type, quantity_change, 
            reference_type, reference_id, notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            item.product_id,
            'PURCHASE',
            item.quantity,
            'purchase',
            id,
            `Purchase received - ${item.quantity} units added`,
            userId || null
          ]
        );
      }
    }

    const [updated] = await pool.query(
      `SELECT p.*, 
              s.supplier_name as supplier_name,
              pi.product_id, pi.quantity, pi.purchase_price, pi.total_amount as item_total,
              pr.brand, pr.model_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
       LEFT JOIN products pr ON pi.product_id = pr.id
       WHERE p.id = ?`,
      [id]
    );

    sendSuccess(res, 'Purchase updated successfully', (updated as any[])[0]);
  } catch (error) {
    console.error('Error updating purchase:', error);
    sendError(res, 'Failed to update purchase', 500);
  }
};

// Delete purchase
export const deletePurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM purchases WHERE id = ?', [id]);
    const purchases = existing as any[];
    if (purchases.length === 0) {
      sendError(res, 'Purchase not found', 404);
      return;
    }

    await pool.query('DELETE FROM purchase_items WHERE purchase_id = ?', [id]);
    await pool.query('DELETE FROM purchases WHERE id = ?', [id]);
    sendSuccess(res, 'Purchase deleted successfully');
  } catch (error) {
    console.error('Error deleting purchase:', error);
    sendError(res, 'Failed to delete purchase', 500);
  }
};

// Update purchase (Edit)
export const updatePurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, purchase_price, notes } = req.body;

    const [existing] = await pool.query('SELECT * FROM purchases WHERE id = ?', [id]);
    const purchases = existing as any[];
    if (purchases.length === 0) {
      sendError(res, 'Purchase not found', 404);
      return;
    }

    const purchase = purchases[0];

    if (purchase.status !== 'ORDERED') {
      sendError(res, 'Only ORDERED purchases can be edited', 400);
      return;
    }

    if (!quantity || quantity <= 0) {
      sendError(res, 'Quantity must be greater than 0', 400);
      return;
    }
    if (!purchase_price || purchase_price <= 0) {
      sendError(res, 'Purchase price must be greater than 0', 400);
      return;
    }

    const total_amount = quantity * purchase_price;

    await pool.query(
      'UPDATE purchase_items SET quantity = ?, purchase_price = ?, total_amount = ? WHERE purchase_id = ?',
      [quantity, purchase_price, total_amount, id]
    );

    await pool.query(
      'UPDATE purchases SET total_amount = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [total_amount, notes || purchase.notes, id]
    );

    const [updated] = await pool.query(
      `SELECT p.*, 
              s.supplier_name as supplier_name,
              pi.product_id, pi.quantity, pi.purchase_price, pi.total_amount as item_total,
              pr.brand, pr.model_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
       LEFT JOIN products pr ON pi.product_id = pr.id
       WHERE p.id = ?`,
      [id]
    );

    sendSuccess(res, 'Purchase updated successfully', (updated as any[])[0]);
  } catch (error) {
    console.error('Error updating purchase:', error);
    sendError(res, 'Failed to update purchase', 500);
  }
};