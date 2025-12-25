/**
 * Audit logging utilities
 * Tracks all modifications to critical entities for compliance and debugging
 */

import { prisma } from '@/lib/db';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';

export interface AuditLogParams {
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
}

/**
 * Create an audit log entry
 *
 * @param params - Audit log parameters
 * @returns Created audit log entry
 */
export async function createAuditLog(params: AuditLogParams) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        changes: params.changes ? JSON.stringify(params.changes) : null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });

    return auditLog;
  } catch (error) {
    // Log error but don't fail the operation
    console.error('Failed to create audit log:', error);
    return null;
  }
}

/**
 * Calculate changes between old and new objects
 *
 * @param oldData - Original data
 * @param newData - Updated data
 * @returns Object with changed fields
 */
export function calculateChanges(
  oldData: Record<string, any>,
  newData: Record<string, any>
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};

  // Check for changed or new fields
  for (const key in newData) {
    if (newData[key] !== oldData[key]) {
      // Skip internal fields and timestamps that change automatically
      if (['updatedAt', 'createdAt'].includes(key)) {
        continue;
      }

      changes[key] = {
        old: oldData[key],
        new: newData[key],
      };
    }
  }

  // Check for removed fields
  for (const key in oldData) {
    if (!(key in newData) && !['updatedAt', 'createdAt'].includes(key)) {
      changes[key] = {
        old: oldData[key],
        new: undefined,
      };
    }
  }

  return changes;
}

/**
 * Get user info from session for audit logging
 *
 * @param session - NextAuth session object
 * @returns User ID and email
 */
export function getUserInfoFromSession(session: any): { userId?: string; userEmail?: string } {
  return {
    userId: session?.user?.id || undefined,
    userEmail: session?.user?.email || session?.user?.name || undefined,
  };
}
