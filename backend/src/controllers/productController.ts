import { Request, Response } from 'express';
import pool from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

interface ProductData {
  sku: string;
  brand: string;
  model_name: string;
  variant?: string;
  ram?: string;
  storage?: string;
  color?: string;
  imei_serial?: string;
  purchase_price: number;
  selling_price: number;
  wholesale_price?: number;
  current_stock: number;
  minimum_stock: number;
  supplier_id?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, brand } = req.query;
    let query = `
      SELECT p.*, s.supplier_name as supplier_name
      FROM products p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
      WHERE p.status = 'ACTIVE'
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (p.sku LIKE ? OR p.brand LIKE ? OR p.model_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'ALL') {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    if (brand) {
      query += ` AND p.brand = ?`;
      params.push(brand);
    }

    query += ` ORDER BY p.created_at DESC`;

    const [rows] = await pool.query(query, params);
    sendSuccess(res, 'Products fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    sendError(res, 'Failed to fetch products', 500);
  }
};


export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT p.*, s.supplier_name as supplier_name
       FROM products p 
       LEFT JOIN suppliers s ON p.supplier_id = s.id 
       WHERE p.id = ?`,
      [id]
    );

    const products = rows as any[];
    if (products.length === 0) {
      sendError(res, 'Product not found', 404);
      return;
    }

    sendSuccess(res, 'Product fetched successfully', products[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    sendError(res, 'Failed to fetch product', 500);
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const productData: ProductData = req.body;
    const userId = (req as any).user?.userId;

    if (!productData.sku || !productData.brand || !productData.model_name) {
      sendError(res, 'SKU, Brand and Model Name are required', 400);
      return;
    }

    if (productData.purchase_price <= 0 || productData.selling_price <= 0) {
      sendError(res, 'Purchase price and Selling price must be greater than 0', 400);
      return;
    }

    const [existing] = await pool.query('SELECT id FROM products WHERE sku = ?', [productData.sku]);
    if ((existing as any[]).length > 0) {
      sendError(res, 'Product with this SKU already exists', 400);
      return;
    }

    if (productData.imei_serial) {
      const [existingImei] = await pool.query(
        'SELECT id FROM products WHERE imei_serial = ?',
        [productData.imei_serial]
      );
      if ((existingImei as any[]).length > 0) {
        sendError(res, 'Product with this IMEI already exists', 400);
        return;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO products (
        sku, brand, model_name, category, variant, ram, storage, color, imei_serial,
        purchase_price, selling_price, wholesale_price,
        current_stock, minimum_stock, supplier_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productData.sku,
        productData.brand,
        productData.model_name,
        productData.category || 'Mobile', // 👈 Add this
        productData.variant || null,
        productData.ram || null,
        productData.storage || null,
        productData.color || null,
        productData.imei_serial || null,
        productData.purchase_price,
        productData.selling_price,
        productData.wholesale_price || null,
        productData.current_stock || 0,
        productData.minimum_stock || 5,
        productData.supplier_id || null,
        productData.status || 'ACTIVE'
      ]
    );

    const insertResult = result as any;
    const productId = insertResult.insertId;

    // ✅ Updated stock transaction - no previous_stock, new_stock
    if (productData.current_stock > 0) {
      await pool.query(
        `INSERT INTO stock_transactions (
          product_id, transaction_type, quantity_change, 
          notes, created_by
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          productId,
          'ADJUSTMENT',
          productData.current_stock,
          'Initial stock added',
          userId || null
        ]
      );
    }

    const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    sendSuccess(res, 'Product created successfully', (newProduct as any[])[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    sendError(res, 'Failed to create product', 500);
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const productData: Partial<ProductData> = req.body;
    const userId = (req as any).user?.userId;

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    const products = existing as any[];
    if (products.length === 0) {
      sendError(res, 'Product not found', 404);
      return;
    }

    const currentProduct = products[0];

    if (productData.sku && productData.sku !== currentProduct.sku) {
      const [dupSku] = await pool.query('SELECT id FROM products WHERE sku = ? AND id != ?', [productData.sku, id]);
      if ((dupSku as any[]).length > 0) {
        sendError(res, 'Product with this SKU already exists', 400);
        return;
      }
    }

    if (productData.imei_serial && productData.imei_serial !== currentProduct.imei_serial) {
      const [dupImei] = await pool.query(
        'SELECT id FROM products WHERE imei_serial = ? AND id != ?',
        [productData.imei_serial, id]
      );
      if ((dupImei as any[]).length > 0) {
        sendError(res, 'Product with this IMEI already exists', 400);
        return;
      }
    }

    const updates: string[] = [];
    const values: any[] = [];

    const fields = [
      'sku', 'brand', 'model_name', 'variant', 'ram', 'storage', 'color',
      'imei_serial',
      'purchase_price', 'selling_price', 'wholesale_price',
      'current_stock', 'minimum_stock', 'supplier_id', 'status'
    ];

    fields.forEach(field => {
      if (productData[field as keyof ProductData] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(productData[field as keyof ProductData]);
      }
    });

    updates.push('updated_at = NOW()');

    if (updates.length === 0) {
      sendError(res, 'No fields to update', 400);
      return;
    }

    values.push(id);

    await pool.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (productData.current_stock !== undefined && productData.current_stock !== currentProduct.current_stock) {
      const stockChange = productData.current_stock - currentProduct.current_stock;
      if (stockChange !== 0) {
        await pool.query(
          `INSERT INTO stock_transactions (
            product_id, transaction_type, quantity, 
            previous_stock, new_stock, notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            'ADJUSTMENT',
            stockChange,
            currentProduct.current_stock,
            productData.current_stock,
            'Stock adjustment via product update',
            userId || null
          ]
        );
      }
    }

    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    sendSuccess(res, 'Product updated successfully', (updated as any[])[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    sendError(res, 'Failed to update product', 500);
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    const products = existing as any[];
    if (products.length === 0) {
      sendError(res, 'Product not found', 404);
      return;
    }

    await pool.query('UPDATE products SET status = ? WHERE id = ?', ['INACTIVE', id]);
    sendSuccess(res, 'Product deleted successfully');
  } catch (error) {
    console.error('Error deleting product:', error);
    sendError(res, 'Failed to delete product', 500);
  }
};

export const getLowStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM products 
       WHERE current_stock <= minimum_stock AND status = 'ACTIVE'
       ORDER BY current_stock ASC`
    );
    sendSuccess(res, 'Low stock products fetched', rows);
  } catch (error) {
    console.error('Error fetching low stock:', error);
    sendError(res, 'Failed to fetch low stock products', 500);
  }
};