import { getSupabaseServiceClient } from '../../lib/supabase.js'
import type { AppRole } from '../employees/sample-data.js'

type RoleRow = {
  role: AppRole
}

export async function getUserRoles(userId: string, organizationId: string) {
  const supabase = getSupabaseServiceClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)

  if (error) {
    throw error
  }

  return ((data ?? []) as RoleRow[]).map((row) => row.role)
}

export function hasAnyRole(userRoles: AppRole[], allowedRoles: AppRole[]) {
  return userRoles.some((role) => allowedRoles.includes(role))
}
