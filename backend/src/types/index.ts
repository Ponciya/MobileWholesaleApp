export type UserRole = 'ADMIN' | 'EMPLOYEE';

export type AccountStatus = 'INVITED' | 'ACTIVE' | 'DEACTIVATED';

export type PermissionCode =
  | 'VIEW_PRODUCTS'
  | 'VIEW_STOCK'
  | 'CREATE_SALE'
  | 'MANAGE_SALES'
  | 'MANAGE_CUSTOMERS'
  | 'MANAGE_DELIVERIES'
  | 'MANAGE_PURCHASES'
  | 'VIEW_PAYMENTS'
  | 'MANAGE_PAYMENTS'
  | 'VIEW_EXPENSES'
  | 'VIEW_PROFIT'
  | 'VIEW_REPORTS'
  | 'MANAGE_EMPLOYEES';

export interface UserRecord {
  id: number;
  employee_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: UserRole;
  status: AccountStatus;
}

export interface JwtPayload {
  userId: number;
  role: UserRole;
}

export interface AuthenticatedRequestUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  permissions: PermissionCode[];
}