import { Request, Response } from 'express';
import pool from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

// Get all expenses
export const getAllExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, from_date, to_date } = req.query;
    let query = `SELECT * FROM expenses WHERE 1=1`;
    const params: any[] = [];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (from_date) {
      query += ` AND expense_date >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      query += ` AND expense_date <= ?`;
      params.push(to_date);
    }

    query += ` ORDER BY expense_date DESC, id DESC`;

    const [rows] = await pool.query(query, params);
    sendSuccess(res, 'Expenses fetched successfully', rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    sendError(res, 'Failed to fetch expenses', 500);
  }
};

// Get single expense
export const getExpenseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]);

    const expenses = rows as any[];
    if (expenses.length === 0) {
      sendError(res, 'Expense not found', 404);
      return;
    }

    sendSuccess(res, 'Expense fetched successfully', expenses[0]);
  } catch (error) {
    console.error('Error fetching expense:', error);
    sendError(res, 'Failed to fetch expense', 500);
  }
};

// Create expense
export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, category, amount, expense_date, description } = req.body;
    const userId = (req as any).user?.userId;

    if (!title) {
      sendError(res, 'Title is required', 400);
      return;
    }
    if (!category) {
      sendError(res, 'Category is required', 400);
      return;
    }
    if (!amount || amount <= 0) {
      sendError(res, 'Amount must be greater than 0', 400);
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO expenses (
        title, category, amount, expense_date, description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [title, category, amount, expense_date || new Date(), description || null, userId || null]
    );

    const expenseId = (result as any).insertId;
    const [newExpense] = await pool.query('SELECT * FROM expenses WHERE id = ?', [expenseId]);

    sendSuccess(res, 'Expense added successfully', (newExpense as any[])[0]);
  } catch (error) {
    console.error('Error creating expense:', error);
    sendError(res, 'Failed to create expense', 500);
  }
};

// Update expense
export const updateExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, category, amount, expense_date, description } = req.body;
  
      const [existing] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]);
      const expenses = existing as any[];
      if (expenses.length === 0) {
        sendError(res, 'Expense not found', 404);
        return;
      }
  
      const updates: string[] = [];
      const values: any[] = [];
  
      const fields = ['title', 'category', 'amount', 'description'];
      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(req.body[field]);
        }
      });
  
      // ✅ Fix: Format date correctly
      if (req.body.expense_date) {
        const formattedDate = req.body.expense_date.split('T')[0]; // YYYY-MM-DD
        updates.push(`expense_date = ?`);
        values.push(formattedDate);
      }
  
      updates.push('updated_at = NOW()');
  
      if (updates.length === 0) {
        sendError(res, 'No fields to update', 400);
        return;
      }
  
      values.push(id);
      await pool.query(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`, values);
  
      const [updated] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]);
      sendSuccess(res, 'Expense updated successfully', (updated as any[])[0]);
    } catch (error) {
      console.error('Error updating expense:', error);
      sendError(res, 'Failed to update expense', 500);
    }
  };

// Delete expense
export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]);
    const expenses = existing as any[];
    if (expenses.length === 0) {
      sendError(res, 'Expense not found', 404);
      return;
    }

    await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
    sendSuccess(res, 'Expense deleted successfully');
  } catch (error) {
    console.error('Error deleting expense:', error);
    sendError(res, 'Failed to delete expense', 500);
  }
};