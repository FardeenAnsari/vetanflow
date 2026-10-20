import type { getSupabaseServiceClient } from '../../lib/supabase.js'

type ServiceClient = NonNullable<ReturnType<typeof getSupabaseServiceClient>>

export class EmployeeAccountLinkError extends Error {
  readonly statusCode = 409
}

export const normalizeWorkEmail = (email: string) => email.trim().toLowerCase()
const exactEmailPattern = (email: string) => normalizeWorkEmail(email).replace(/[\\%_]/g, '\\$&')

export async function findEmployeeForAccount(client: ServiceClient, organizationId: string, email: string) {
  const { data, error } = await client.from('employees').select('id, profile_id')
    .eq('organization_id', organizationId).ilike('work_email', exactEmailPattern(email)).limit(2)
  if (error) throw error
  if (data && data.length > 1) throw new EmployeeAccountLinkError('Multiple employee records use this email. Correct them before granting access.')
  return data?.[0] ?? null
}

export async function resolveEmployeeProfile(
  client: ServiceClient, organizationId: string, email: string, employeeId?: string, currentProfileId?: string | null,
) {
  const employee = await findEmployeeForAccount(client, organizationId, email)
  if (employee && employee.id !== employeeId) throw new EmployeeAccountLinkError('An employee already uses this work email.')

  if (currentProfileId) {
    const { data, error } = await client.from('profiles').select('email')
      .eq('id', currentProfileId).eq('organization_id', organizationId).single()
    if (error) throw error
    if (normalizeWorkEmail(data.email) !== normalizeWorkEmail(email)) {
      throw new EmployeeAccountLinkError('This employee has a login account. Update the account email before changing the work email.')
    }
    return currentProfileId
  }

  const { data, error } = await client.from('profiles').select('id')
    .eq('organization_id', organizationId).ilike('email', exactEmailPattern(email)).limit(2)
  if (error) throw error
  if (data && data.length > 1) throw new EmployeeAccountLinkError('Multiple accounts use this email. Contact the organization owner.')
  const profileId = data?.[0]?.id ?? null
  if (!profileId) return null

  const linked = await client.from('employees').select('id').eq('organization_id', organizationId)
    .eq('profile_id', profileId).limit(2)
  if (linked.error) throw linked.error
  if (linked.data?.some((row) => row.id !== employeeId)) {
    throw new EmployeeAccountLinkError('This account is already linked to another employee.')
  }
  return profileId
}

export async function linkInvitedEmployee(client: ServiceClient, organizationId: string, email: string, userId: string) {
  const employee = await findEmployeeForAccount(client, organizationId, email)
  if (!employee || employee.profile_id === userId) return
  if (employee.profile_id) throw new EmployeeAccountLinkError('This employee is already linked to another account.')
  const { data, error } = await client.from('employees').update({ profile_id: userId })
    .eq('id', employee.id).eq('organization_id', organizationId).is('profile_id', null).select('id').maybeSingle()
  if (error) throw error
  if (!data) throw new EmployeeAccountLinkError('Employee access changed while inviting. Reload before retrying.')
}
