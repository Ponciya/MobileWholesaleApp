import { Request, Response } from 'express';
import pool from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

// 1. Sales Report
export const getSalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to, customer_id } = req.query;
    let query = `
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (from) {
      query += ` AND s.sale_date >= ?`;
      params.push(from);
    }
    if (to) {
      query += ` AND s.sale_date <= ?`;
      params.push(to);
    }
    if (customer_id) {
      query += ` AND s.customer_id = ?`;
      params.push(customer_id);
    }

    query += ` ORDER BY s.sale_date DESC, s.id DESC`;

    const [rows] = await pool.query(query, params);
    sendSuccess(res, 'Sales report fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching sales report:', error);
    sendError(res, 'Failed to fetch sales report', 500);
  }
};

// 2. Purchase Report
export const getPurchaseReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to, supplier_id } = req.query;
    let query = `
      SELECT p.*, s.supplier_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (from) {
      query += ` AND p.purchase_date >= ?`;
      params.push(from);
    }
    if (to) {
      query += ` AND p.purchase_date <= ?`;
      params.push(to);
    }
    if (supplier_id) {
      query += ` AND p.supplier_id = ?`;
      params.push(supplier_id);
    }

    query += ` ORDER BY p.purchase_date DESC, p.id DESC`;

    const [rows] = await pool.query(query, params);
    sendSuccess(res, 'Purchase report fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching purchase report:', error);
    sendError(res, 'Failed to fetch purchase report', 500);
  }
};

// 3. Stock Report
export const getStockReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    let query = `
      SELECT p.*, s.supplier_name
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.status = 'ACTIVE'
    `;
    const params: any[] = [];

    if (category) {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    query += ` ORDER BY p.current_stock ASC`;

    const [rows] = await pool.query(query, params);
    sendSuccess(res, 'Stock report fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching stock report:', error);
    sendError(res, 'Failed to fetch stock report', 500);
  }
};

// 4. Profit Report
export const getProfitReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;
    let dateFilter = '';
    const params: any[] = [];

    if (from && to) {
      dateFilter = ' AND sale_date BETWEEN ? AND ?';
      params.push(from, to);
    }

    // Total Sales
    const [salesRows] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_sales,
              COUNT(*) as total_orders
       FROM sales 
       WHERE 1=1 ${dateFilter}`,
      params
    );

    // COGS - Only products SOLD
    const [cogsRows] = await pool.query(
      `SELECT COALESCE(SUM(si.quantity * pi.purchase_price), 0) as cogs
       FROM sale_items si
       JOIN products pr ON si.product_id = pr.id
       JOIN purchase_items pi ON pi.product_id = pr.id
       JOIN purchases pu ON pi.purchase_id = pu.id
       WHERE pu.status = 'RECEIVED'
       ${dateFilter ? 'AND pu.purchase_date BETWEEN ? AND ?' : ''}`,
      dateFilter ? [...params] : []
    );

    // Total Expenses
    const [expenseRows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses
       FROM expenses
       WHERE 1=1 ${dateFilter ? 'AND expense_date BETWEEN ? AND ?' : ''}`,
      dateFilter ? [...params] : []
    );

    const salesData = (salesRows as any[])[0] || { total_sales: 0, total_orders: 0 };
    const cogs = (cogsRows as any[])[0]?.cogs || 0;
    const totalExpenses = (expenseRows as any[])[0]?.total_expenses || 0;

    const grossProfit = salesData.total_sales - cogs;
    const netProfit = grossProfit - totalExpenses;

    sendSuccess(res, 'Profit report fetched successfully', {
      totalSales: salesData.total_sales,
      totalOrders: salesData.total_orders,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
    });
  } catch (error) {
    console.error('Error fetching profit report:', error);
    sendError(res, 'Failed to fetch profit report', 500);
  }
};

// 5. Expense Report
export const getExpenseReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to, category } = req.query;
    let query = `
      SELECT * FROM expenses WHERE 1=1
    `;
    const params: any[] = [];

    if (from) {
      query += ` AND expense_date >= ?`;
      params.push(from);
    }
    if (to) {
      query += ` AND expense_date <= ?`;
      params.push(to);
    }
    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    query += ` ORDER BY expense_date DESC, id DESC`;

    const [rows] = await pool.query(query, params);
    sendSuccess(res, 'Expense report fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching expense report:', error);
    sendError(res, 'Failed to fetch expense report', 500);
  }
};

// 6. Low Stock Report
export const getLowStockReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, s.supplier_name,
              (p.minimum_stock - p.current_stock) as required_quantity,
              (p.minimum_stock - p.current_stock) * p.purchase_price as reorder_amount
       FROM products p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.current_stock <= p.minimum_stock
       AND p.status = 'ACTIVE'
       ORDER BY p.current_stock ASC`
    );
    sendSuccess(res, 'Low stock report fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching low stock report:', error);
    sendError(res, 'Failed to fetch low stock report', 500);
  }
};

// Keep these for Profit & Loss and Dashboard
export const getProfitLoss = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;
    let dateFilter = '';
    const params: any[] = [];

    if (from && to) {
      dateFilter = ' AND sale_date BETWEEN ? AND ?';
      params.push(from, to);
    }

    const [salesRows] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_sales 
       FROM sales 
       WHERE 1=1 ${dateFilter}`,
      params
    );
    const totalSales = (salesRows as any[])[0]?.total_sales || 0;

    const [cogsRows] = await pool.query(
      `SELECT COALESCE(SUM(si.quantity * pi.purchase_price), 0) as cogs
       FROM sale_items si
       JOIN products pr ON si.product_id = pr.id
       JOIN purchase_items pi ON pi.product_id = pr.id
       JOIN purchases pu ON pi.purchase_id = pu.id
       WHERE pu.status = 'RECEIVED'
       ${dateFilter ? 'AND pu.purchase_date BETWEEN ? AND ?' : ''}`,
      dateFilter ? [...params] : []
    );
    const cogs = (cogsRows as any[])[0]?.cogs || 0;

    const [expenseRows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses 
       FROM expenses 
       WHERE 1=1 ${dateFilter ? 'AND expense_date BETWEEN ? AND ?' : ''}`,
      dateFilter ? [...params] : []
    );
    const totalExpenses = (expenseRows as any[])[0]?.total_expenses || 0;

    const grossProfit = totalSales - cogs;
    const netProfit = grossProfit - totalExpenses;

    const [saleCountRows] = await pool.query(
      `SELECT COUNT(*) as total_orders FROM sales WHERE 1=1 ${dateFilter}`,
      dateFilter ? [...params] : []
    );
    const totalOrders = (saleCountRows as any[])[0]?.total_orders || 0;

    sendSuccess(res, 'Profit & Loss fetched successfully', {
      totalSales,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
      totalOrders,
    });
  } catch (error) {
    console.error('Error fetching profit & loss:', error);
    sendError(res, 'Failed to fetch profit & loss', 500);
  }
};

export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const [todaySales] = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as today_sales FROM sales WHERE DATE(sale_date) = CURDATE()"
    );
    const [todayPurchases] = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as today_purchases FROM purchases WHERE DATE(purchase_date) = CURDATE() AND status = 'RECEIVED'"
    );
    const [productCount] = await pool.query(
      "SELECT COUNT(*) as total_products FROM products WHERE status = 'ACTIVE'"
    );
    const [lowStock] = await pool.query(
      "SELECT COUNT(*) as low_stock FROM products WHERE current_stock <= minimum_stock AND status = 'ACTIVE'"
    );

    sendSuccess(res, 'Dashboard summary fetched', {
      todaySales: (todaySales as any[])[0]?.today_sales || 0,
      todayPurchases: (todayPurchases as any[])[0]?.today_purchases || 0,
      totalProducts: (productCount as any[])[0]?.total_products || 0,
      lowStock: (lowStock as any[])[0]?.low_stock || 0,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    sendError(res, 'Failed to fetch dashboard summary', 500);
  }
};