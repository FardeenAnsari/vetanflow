import { z } from 'zod'
import { getSupabaseServiceClient } from '../../lib/supabase.js'
import { postgresUuidSchema } from '../../lib/validation.js'
import { adminAssignableRoles, invitationActorRoles } from '../auth/auth-context.js'
import { getUserRoles, hasAnyRole } from '../auth/roles.js'

export const invitationSchema = z.object({
  email: z.email(),
  fullName: z.string().min(2).max(120),
  organizationId: postgresUuidSchema,
  role: z.enum(adminAssignableRoles),
})

export type InvitationInput = z.infer<typeof invitationSchema>

export async function inviteUser(actorUserId: string, input: InvitationInput) {
  const supabase = getSupabaseServiceClient()

  if (!supabase) {
    return { status: 'not_configured' as const }
  }

  const actorRoles = await getUserRoles(actorUserId, input.organizationId)

  if (!hasAnyRole(actorRoles, invitationActorRoles)) {
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
