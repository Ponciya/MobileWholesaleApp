import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ✅ Authenticate - Check if user is logged in
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log('🔑 Auth Header:', authHeader);

  const token = authHeader?.split(' ')[1];
  console.log('🔑 Token extracted:', token?.substring(0, 20) + '...');

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    console.log('🔑 JWT_SECRET exists?', !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    console.log('✅ Token verified:', decoded);
    (req as any).user = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ✅ Authorize - Check if user has required permissions
export const authorize = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // ✅ Admin has ALL permissions - skip check
    if (user.role === 'ADMIN') {
      return next();
    }

    // ✅ Check if user has any of the required permissions
    const userPermissions = user.permissions || [];
    const hasPermission = permissions.some(p => userPermissions.includes(p));
    
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions. Required: ' + permissions.join(', ') 
      });
    }
    
    next();
  };
};

// ✅ Check if user is ADMIN (for employee management)
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  next();
};