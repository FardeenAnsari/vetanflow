import { getSupabaseServiceClient } from '../../lib/supabase.js'
import { getUserRoles } from './roles.js'

const workspaceRoles = ['owner', 'admin', 'hr', 'finance', 'manager', 'employee']

export async function resolveWorkspaceAccess(userId: string) {
  const client = getSupabaseServiceClient()
  if (!client) return { status: 'not_configured' as const }
  const profile = await client.from('profiles').select('organization_id').eq('id', userId).maybeSingle()
  if (profile.error) throw profile.error
  if (!profile.data?.organization_id) return { status: 'unassigned' as const }
  const roles = await getUserRoles(userId, profile.data.organization_id)
  if (!roles.length || roles.some((role) => !workspaceRoles.includes(role))) return { status: 'unassigned' as const }
  return { status: 'ok' as const, data: { userId, organizationId: profile.data.organization_id, roles } }
}
