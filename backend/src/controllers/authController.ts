import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import pool from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { JwtPayload, UserRole, AccountStatus, PermissionCode } from '../types';

interface LoginRequestBody {
  emailOrEmployeeId: string;
  password: string;
}

interface UserRow {
  id: number;
  employee_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: UserRole;
  status: AccountStatus;
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { emailOrEmployeeId, password } = req.body as LoginRequestBody;

    if (!emailOrEmployeeId || !password) {
      sendError(res, 'Email/Employee ID and password are required', 400);
      return;
    }

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR employee_id = ? LIMIT 1',
      [emailOrEmployeeId, emailOrEmployeeId]
    );
    const users = rows as UserRow[];

    if (users.length === 0) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const user = users[0];

    if (user.status !== 'ACTIVE') {
      sendError(res, 'Account is not active. Contact your administrator.', 403);
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      sendError(res, 'Server configuration error', 500);
      return;
    }

    const payload: JwtPayload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    const [permRows] = await pool.query(
      `SELECT p.code FROM permissions p
       INNER JOIN user_permissions up ON up.permission_id = p.id
       WHERE up.user_id = ?`,
      [user.id]
    );
    const permissions = (permRows as Array<{ code: PermissionCode }>).map((r) => r.code);

    sendSuccess(res, 'Login successful', {
      token,
      user: {
        id: user.id,
        employeeId: user.employee_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        permissions,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed. Please try again.', 500);
  }
}