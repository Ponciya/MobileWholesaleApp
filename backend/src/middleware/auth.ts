import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import pool from '../config/db';
import { sendError } from '../utils/response';
import { JwtPayload, AuthenticatedRequestUser, PermissionCode, UserRole, AccountStatus } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'No authentication token provided', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      sendError(res, 'Server configuration error', 500);
      return;
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, secret) as JwtPayload;
    } catch (err) {
      sendError(res, 'Invalid or expired token', 401);
      return;
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, role, status FROM users WHERE id = ?',
      [payload.userId]
    );
    const users = rows as Array<{ id: number; name: string; email: string; role: UserRole; status: AccountStatus }>;

    if (users.length === 0) {
      sendError(res, 'User not found', 401);
      return;
    }

    const userRow = users[0];

    if (userRow.status !== 'ACTIVE') {
      sendError(res, 'Account is not active', 403);
      return;
    }

    const [permRows] = await pool.query(
      `SELECT p.code FROM permissions p
       INNER JOIN user_permissions up ON up.permission_id = p.id
       WHERE up.user_id = ?`,
      [userRow.id]
    );
    const permissions = (permRows as Array<{ code: PermissionCode }>).map((r) => r.code);

    req.user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      status: userRow.status,
      permissions,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    sendError(res, 'Authentication failed', 500);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'Insufficient role permissions', 403);
      return;
    }
    next();
  };
}

export function requirePermission(permission: PermissionCode) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }
    if (!req.user.permissions.includes(permission)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }
    next();
  };
}