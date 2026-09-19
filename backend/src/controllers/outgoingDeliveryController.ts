import { Request, Response } from 'express';
import pool from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

// Get all deliveries
export const getAllDeliveries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, customer_id } = req.query;
    let query = `
      SELECT od.*, 
             c.name as customer_name,
             s.customer_id as sale_customer_id
      FROM outgoing_deliveries od
      LEFT JOIN sales s ON od.sale_id = s.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND od.status = ?`;
      params.push(status);
    }

    if (customer_id) {
      query += ` AND s.customer_id = ?`;
      params.push(customer_id);
    }

    query += ` ORDER BY od.created_at DESC`;

    const [rows] = await pool.query(query, params);
    sendSuccess(res, 'Deliveries fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    sendError(res, 'Failed to fetch deliveries', 500);
  }
};

// Get single delivery
export const getDeliveryById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query(
        `SELECT od.*, 
                c.name as customer_name,
                s.customer_id as sale_customer_id,
                odi.product_id, odi.quantity,
                p.brand, p.model_name
         FROM outgoing_deliveries od
         LEFT JOIN sales s ON od.sale_id = s.id
         LEFT JOIN customers c ON s.customer_id = c.id
         LEFT JOIN outgoing_delivery_items odi ON od.id = odi.outgoing_delivery_id
         LEFT JOIN products p ON odi.product_id = p.id
         WHERE od.id = ?`,
        [id]
      );
  
      const deliveries = rows as any[];
      if (deliveries.length === 0) {
        sendError(res, 'Delivery not found', 404);
        return;
      }
  
      sendSuccess(res, 'Delivery fetched successfully', deliveries[0]);
    } catch (error) {
      console.error('Error fetching delivery:', error);
      sendError(res, 'Failed to fetch delivery', 500);
    }
  };

// Create delivery from sale
export const createDelivery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sale_id, notes } = req.body;
      const userId = (req as any).user?.userId;
  
      if (!sale_id) {
        sendError(res, 'Sale ID is required', 400);
        return;
      }
  
      // Check sale exists and get customer_id
      const [saleRows] = await pool.query('SELECT * FROM sales WHERE id = ?', [sale_id]);
      const sales = saleRows as any[];
      if (sales.length === 0) {
        sendError(res, 'Sale not found', 404);
        return;
      }
  
      const sale = sales[0];
      const customer_id = sale.customer_id;
  
      if (!customer_id) {
        sendError(res, 'Sale has no customer', 400);
        return;
      }
  
      // Check if delivery already exists for this sale
      const [existing] = await pool.query('SELECT id FROM outgoing_deliveries WHERE sale_id = ?', [sale_id]);
      if ((existing as any[]).length > 0) {
        sendError(res, 'Delivery already created for this sale', 400);
        return;
      }
  
      // Get sale items
      const [itemRows] = await pool.query(
        'SELECT id, product_id, quantity FROM sale_items WHERE sale_id = ?',
        [sale_id]
      );
      const saleItems = itemRows as any[];
  
      if (saleItems.length === 0) {
        sendError(res, 'No items found in this sale', 400);
        return;
      }
  
      // ✅ Insert with customer_id
      const [result] = await pool.query(
        `INSERT INTO outgoing_deliveries (
          sale_id, customer_id, status, notes, created_by, delivery_date
        ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [sale_id, customer_id, 'PREPARING', notes || null, userId || null]
      );
  
      const deliveryId = (result as any).insertId;
  
      // Insert delivery items
      for (const item of saleItems) {
        await pool.query(
          `INSERT INTO outgoing_delivery_items (
            outgoing_delivery_id, sale_item_id, product_id, quantity
          ) VALUES (?, ?, ?, ?)`,
          [deliveryId, item.id, item.product_id, item.quantity]
        );
      }
  
      const [newDelivery] = await pool.query(
        `SELECT od.*, c.name as customer_name
         FROM outgoing_deliveries od
         LEFT JOIN sales s ON od.sale_id = s.id
         LEFT JOIN customers c ON s.customer_id = c.id
         WHERE od.id = ?`,
        [deliveryId]
      );
  
      sendSuccess(res, 'Delivery created successfully', (newDelivery as any[])[0]);
    } catch (error) {
      console.error('Error creating delivery:', error);
      sendError(res, 'Failed to create delivery', 500);
    }
  };
// Update delivery status
export const updateDeliveryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const [existing] = await pool.query('SELECT * FROM outgoing_deliveries WHERE id = ?', [id]);
    const deliveries = existing as any[];
    if (deliveries.length === 0) {
      sendError(res, 'Delivery not found', 404);
      return;
    }

    const currentDelivery = deliveries[0];

    // If already DELIVERED, don't allow further changes
    if (currentDelivery.status === 'DELIVERED') {
      sendError(res, 'Delivery already completed', 400);
      return;
    }

    // If CANCELLED, don't allow further changes
    if (currentDelivery.status === 'CANCELLED') {
      sendError(res, 'Delivery already cancelled', 400);
      return;
    }

    await pool.query(
      'UPDATE outgoing_deliveries SET status = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [status || currentDelivery.status, notes || currentDelivery.notes, id]
    );

    // Note: Stock already decreased during sale creation
    // No stock change needed here!

    const [updated] = await pool.query(
      `SELECT od.*, c.name as customer_name
       FROM outgoing_deliveries od
       LEFT JOIN sales s ON od.sale_id = s.id
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE od.id = ?`,
      [id]
    );

    sendSuccess(res, 'Delivery status updated successfully', (updated as any[])[0]);
  } catch (error) {
    console.error('Error updating delivery:', error);
    sendError(res, 'Failed to update delivery status', 500);
  }
};

// Delete delivery
export const deleteDelivery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM outgoing_deliveries WHERE id = ?', [id]);
    const deliveries = existing as any[];
    if (deliveries.length === 0) {
      sendError(res, 'Delivery not found', 404);
      return;
    }

    await pool.query('DELETE FROM outgoing_delivery_items WHERE outgoing_delivery_id = ?', [id]);
    await pool.query('DELETE FROM outgoing_deliveries WHERE id = ?', [id]);
    sendSuccess(res, 'Delivery deleted successfully');
  } catch (error) {
    console.error('Error deleting delivery:', error);
    sendError(res, 'Failed to delete delivery', 500);
  }
};