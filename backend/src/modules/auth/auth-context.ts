import type { AppRole } from '../employees/sample-data.js'

export type AuthContext = {
  accessToken: string
  email: string | null
  userId: string
}

declare global {
  namespace Express {
    interface Locals {
      auth?: AuthContext
    }
  }
}

export const adminAssignableRoles = ['admin', 'hr', 'finance', 'manager', 'employee'] as const
export const invitationActorRoles: AppRole[] = ['owner', 'admin', 'hr']
