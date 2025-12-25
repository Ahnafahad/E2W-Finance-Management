/**
 * Role-Based Access Control (RBAC) utilities
 * Defines permissions and authorization logic for different user roles
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  VIEWER = 'VIEWER',
}

export enum Permission {
  // Transaction permissions
  TRANSACTION_CREATE = 'TRANSACTION_CREATE',
  TRANSACTION_READ = 'TRANSACTION_READ',
  TRANSACTION_UPDATE = 'TRANSACTION_UPDATE',
  TRANSACTION_DELETE = 'TRANSACTION_DELETE',

  // Invoice permissions
  INVOICE_GENERATE = 'INVOICE_GENERATE',
  INVOICE_READ = 'INVOICE_READ',

  // Recurring template permissions
  RECURRING_CREATE = 'RECURRING_CREATE',
  RECURRING_READ = 'RECURRING_READ',
  RECURRING_UPDATE = 'RECURRING_UPDATE',
  RECURRING_DELETE = 'RECURRING_DELETE',

  // Exchange rate permissions
  EXCHANGE_RATE_CREATE = 'EXCHANGE_RATE_CREATE',
  EXCHANGE_RATE_READ = 'EXCHANGE_RATE_READ',
  EXCHANGE_RATE_UPDATE = 'EXCHANGE_RATE_UPDATE',
  EXCHANGE_RATE_DELETE = 'EXCHANGE_RATE_DELETE',

  // User management permissions
  USER_CREATE = 'USER_CREATE',
  USER_READ = 'USER_READ',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',

  // Audit log permissions
  AUDIT_LOG_READ = 'AUDIT_LOG_READ',

  // Report permissions
  REPORT_VIEW = 'REPORT_VIEW',
  REPORT_EXPORT = 'REPORT_EXPORT',
}

/**
 * Role permission matrix
 * Defines which permissions each role has
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Full access to everything
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_READ,
    Permission.TRANSACTION_UPDATE,
    Permission.TRANSACTION_DELETE,
    Permission.INVOICE_GENERATE,
    Permission.INVOICE_READ,
    Permission.RECURRING_CREATE,
    Permission.RECURRING_READ,
    Permission.RECURRING_UPDATE,
    Permission.RECURRING_DELETE,
    Permission.EXCHANGE_RATE_CREATE,
    Permission.EXCHANGE_RATE_READ,
    Permission.EXCHANGE_RATE_UPDATE,
    Permission.EXCHANGE_RATE_DELETE,
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.AUDIT_LOG_READ,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
  ],

  [UserRole.MANAGER]: [
    // Can manage transactions and recurring templates, view reports
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_READ,
    Permission.TRANSACTION_UPDATE,
    Permission.TRANSACTION_DELETE,
    Permission.INVOICE_GENERATE,
    Permission.INVOICE_READ,
    Permission.RECURRING_CREATE,
    Permission.RECURRING_READ,
    Permission.RECURRING_UPDATE,
    Permission.RECURRING_DELETE,
    Permission.EXCHANGE_RATE_READ,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
  ],

  [UserRole.ACCOUNTANT]: [
    // Can create and edit transactions, cannot delete
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_READ,
    Permission.TRANSACTION_UPDATE,
    Permission.INVOICE_GENERATE,
    Permission.INVOICE_READ,
    Permission.RECURRING_READ,
    Permission.EXCHANGE_RATE_READ,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
  ],

  [UserRole.VIEWER]: [
    // Read-only access
    Permission.TRANSACTION_READ,
    Permission.INVOICE_READ,
    Permission.RECURRING_READ,
    Permission.EXCHANGE_RATE_READ,
    Permission.REPORT_VIEW,
  ],
};

/**
 * Check if a role has a specific permission
 *
 * @param role - User role
 * @param permission - Permission to check
 * @returns True if role has permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Check if a role has any of the specified permissions
 *
 * @param role - User role
 * @param permissions - Array of permissions to check
 * @returns True if role has at least one permission
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 *
 * @param role - User role
 * @param permissions - Array of permissions to check
 * @returns True if role has all permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 *
 * @param role - User role
 * @returns Array of permissions
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Authorize a user for a specific permission
 * Throws an error if user doesn't have permission
 *
 * @param userRole - User's role
 * @param requiredPermission - Required permission
 * @throws Error if user doesn't have permission
 */
export function authorize(userRole: string | undefined, requiredPermission: Permission): void {
  if (!userRole) {
    throw new Error('Unauthorized: No role assigned');
  }

  const role = userRole as UserRole;
  if (!hasPermission(role, requiredPermission)) {
    throw new Error(`Forbidden: Insufficient permissions. Required: ${requiredPermission}`);
  }
}

/**
 * Get user role from session
 *
 * @param session - NextAuth session
 * @returns User role or undefined
 */
export function getUserRole(session: any): UserRole | undefined {
  return session?.user?.role as UserRole | undefined;
}
