import { z } from 'zod'
import { getSupabaseServiceClient } from '../../lib/supabase.js'
import { postgresUuidSchema } from '../../lib/validation.js'
import { adminAssignableRoles, canAssignRole, invitationActorRoles } from '../auth/auth-context.js'
import { getUserRoles, hasAnyRole } from '../auth/roles.js'

export const invitationSchema = z.object({
  email: z.email(),
  fullName: z.string().min(2).max(120),
  organizationId: postgresUuidSchema,
  role: z.enum(adminAssignableRoles),
})

export type InvitationInput = z.infer<typeof invitationSchema>

export type OrganizationMember = {
  createdAt: string
  email: string
  fullName: string
  roles: string[]
  userId: string
}

type MemberRow = {
  created_at: string
  email: string
  full_name: string
  id: string
}

type MemberRoleRow = {
  role: string
  user_id: string
}

export async function listOrganizationMembers(actorUserId: string) {
  const supabase = getSupabaseServiceClient()

  if (!supabase) {
    return { status: 'not_configured' as const }
  }

  const profileResult = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', actorUserId)
    .maybeSingle()

  if (profileResult.error) {
    throw profileResult.error
  }

  const organizationId = profileResult.data?.organization_id

  if (!organizationId) {
    return { status: 'forbidden' as const }
  }

  const actorRoles = await getUserRoles(actorUserId, organizationId)

  if (!hasAnyRole(actorRoles, invitationActorRoles)) {
    return { status: 'forbidden' as const }
  }

  const [membersResult, rolesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('organization_id', organizationId)
      .order('full_name'),
    supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('organization_id', organizationId),
  ])

  if (membersResult.error) {
    throw membersResult.error
  }

  if (rolesResult.error) {
    throw rolesResult.error
  }

  const rolesByUser = ((rolesResult.data ?? []) as MemberRoleRow[]).reduce((map, assignment) => {
    map.set(assignment.user_id, [...(map.get(assignment.user_id) ?? []), assignment.role])
    return map
  }, new Map<string, string[]>())

  const members = ((membersResult.data ?? []) as MemberRow[]).map((member) => ({
    createdAt: member.created_at,
    email: member.email,
    fullName: member.full_name,
    roles: rolesByUser.get(member.id) ?? [],
    userId: member.id,
  }))

  return { data: members satisfies OrganizationMember[], status: 'ok' as const }
}

export async function inviteUser(actorUserId: string, input: InvitationInput) {
  const supabase = getSupabaseServiceClient()

  if (!supabase) {
    return { status: 'not_configured' as const }
  }

  const actorRoles = await getUserRoles(actorUserId, input.organizationId)

  if (!hasAnyRole(actorRoles, invitationActorRoles)) {
    return { status: 'forbidden' as const }
  }

  if (!canAssignRole(actorRoles, input.role)) {
    return { status: 'forbidden' as const }
  }

  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    input.email,
    {
      data: {
        full_name: input.fullName,
      },
    },
  )

  if (inviteError || !inviteData.user) {
    throw inviteError ?? new Error('Supabase did not return an invited user')
  }

  const userId = inviteData.user.id

  const { error: profileError } = await supabase.from('profiles').upsert({
    email: input.email,
    full_name: input.fullName,
    id: userId,
    organization_id: input.organizationId,
  })

  if (profileError) {
    throw profileError
  }

  const { error: roleError } = await supabase.from('user_roles').upsert({
    organization_id: input.organizationId,
    role: input.role,
    user_id: userId,
  })

  if (roleError) {
    throw roleError
  }

  return {
    data: {
      email: input.email,
      role: input.role,
      userId,
    },
    status: 'created' as const,
  }
}
