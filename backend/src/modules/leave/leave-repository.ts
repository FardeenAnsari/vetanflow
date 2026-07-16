import { z } from 'zod'
import { createSupabaseUserClient, getSupabaseServiceClient } from '../../lib/supabase.js'
import { postgresUuidSchema } from '../../lib/validation.js'
import { getUserRoles, hasAnyRole } from '../auth/roles.js'
import type { AppRole } from '../employees/sample-data.js'

type DataSource = 'fixture' | 'supabase'

type Result<T> = {
  data: T
  source: DataSource
}

type WriteStatus = 'created' | 'forbidden' | 'not_configured' | 'not_found' | 'updated'
type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
type ApprovalStage = 'manager' | 'hr' | 'closed'

export type LeaveEmployee = {
  code: string
  fullName: string
  id: string
  managerEmployeeId: string | null
  organizationId: string
}

export type LeaveRequest = {
  approvalStage: ApprovalStage
  createdAt: string
  decisionNote: string | null
  employeeCode: string
  employeeId: string
  employeeName: string
  endDate: string
  id: string
  leaveType: string
  reason: string
  reviewedAt: string | null
  startDate: string
  status: LeaveStatus
  totalDays: number
}

export type LeaveDashboard = {
  currentUserRoles: AppRole[]
  employees: LeaveEmployee[]
  organization: {
    id: string
    name: string
  } | null
  requests: LeaveRequest[]
}

export const leaveRequestCreateSchema = z.object({
  employeeId: postgresUuidSchema,
  endDate: z.iso.date(),
  leaveType: z.enum(['casual', 'sick', 'earned', 'unpaid', 'other']).default('casual'),
  organizationId: postgresUuidSchema,
  reason: z.string().trim().min(2).max(500),
  startDate: z.iso.date(),
})

export const leaveRequestReviewSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'escalated']),
  decisionNote: z.string().trim().max(500).optional(),
  organizationId: postgresUuidSchema,
})

export const leaveRequestCancelSchema = z.object({
  organizationId: postgresUuidSchema,
})

export type LeaveRequestCreateInput = z.infer<typeof leaveRequestCreateSchema>
export type LeaveRequestReviewInput = z.infer<typeof leaveRequestReviewSchema>
export type LeaveRequestCancelInput = z.infer<typeof leaveRequestCancelSchema>

export class LeaveWriteError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

type ProfileRow = {
  organization_id: string | null
  organizations: { id: string; name: string } | { id: string; name: string }[] | null
}

type EmployeeRow = {
  employee_code: string
  full_name: string
  id: string
  manager_employee_id: string | null
  organization_id: string
  profile_id: string | null
}

type LeaveRequestRow = {
  approval_stage: ApprovalStage
  created_at: string
  decision_note: string | null
  employee_id: string
  employees:
    | { employee_code: string; full_name: string; manager_employee_id: string | null; profile_id?: string | null }
    | { employee_code: string; full_name: string; manager_employee_id: string | null; profile_id?: string | null }[]
    | null
  end_date: string
  id: string
  leave_type: string
  reason: string
  reviewed_at: string | null
  start_date: string
  status: LeaveStatus
}

type RoleRow = {
  role: AppRole
}

type ServiceClient = NonNullable<ReturnType<typeof getSupabaseServiceClient>>

export type LeaveRepository = {
  cancelLeaveRequest: (
    requestId: string,
    actorUserId: string | undefined,
    input: LeaveRequestCancelInput,
  ) => Promise<{ data?: LeaveRequest; status: WriteStatus }>
  createLeaveRequest: (
    actorUserId: string | undefined,
    input: LeaveRequestCreateInput,
  ) => Promise<{ data?: LeaveRequest; status: WriteStatus }>
  list: (accessToken?: string) => Promise<Result<LeaveDashboard>>
  reviewLeaveRequest: (
    requestId: string,
    actorUserId: string | undefined,
    input: LeaveRequestReviewInput,
  ) => Promise<{ data?: LeaveRequest; status: WriteStatus }>
}

function firstRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value
}

function getFallbackDashboard(): LeaveDashboard {
  return {
    currentUserRoles: ['owner'],
    employees: [],
    organization: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'VetanFlow Demo India',
    },
    requests: [],
  }
}

function getInclusiveDays(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00.000Z`)
  const end = Date.parse(`${endDate}T00:00:00.000Z`)

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    throw new LeaveWriteError(400, 'Leave end date must be on or after start date')
  }

  return Math.floor((end - start) / 86_400_000) + 1
}

function toLeaveEmployee(row: EmployeeRow): LeaveEmployee {
  return {
    code: row.employee_code,
    fullName: row.full_name,
    id: row.id,
    managerEmployeeId: row.manager_employee_id,
    organizationId: row.organization_id,
  }
}

function toLeaveRequest(row: LeaveRequestRow): LeaveRequest {
  const employee = firstRelation(row.employees)

  return {
    approvalStage: row.approval_stage,
    createdAt: row.created_at,
    decisionNote: row.decision_note,
    employeeCode: employee?.employee_code ?? 'Unknown',
    employeeId: row.employee_id,
    employeeName: employee?.full_name ?? 'Unknown employee',
    endDate: row.end_date,
    id: row.id,
    leaveType: row.leave_type,
    reason: row.reason,
    reviewedAt: row.reviewed_at,
    startDate: row.start_date,
    status: row.status,
    totalDays: getInclusiveDays(row.start_date, row.end_date),
  }
}

async function canWrite(actorUserId: string | undefined, organizationId: string, allowedRoles: AppRole[]) {
  if (!actorUserId) {
    return false
  }

  const actorRoles = await getUserRoles(actorUserId, organizationId)

  return hasAnyRole(actorRoles, allowedRoles)
}

async function isDirectManager(supabase: ServiceClient, actorUserId: string | undefined, employeeId: string) {
  if (!actorUserId) {
    return false
  }

  const employeeResult = await supabase
    .from('employees')
    .select('manager_employee_id')
    .eq('id', employeeId)
    .maybeSingle()

  if (employeeResult.error) {
    throw employeeResult.error
  }

  const row = employeeResult.data as { manager_employee_id: string | null } | null

  if (!row?.manager_employee_id) {
    return false
  }

  const managerResult = await supabase
    .from('employees')
    .select('profile_id')
    .eq('id', row.manager_employee_id)
    .maybeSingle()

  if (managerResult.error) {
    throw managerResult.error
  }

  const manager = managerResult.data as { profile_id: string | null } | null

  return manager?.profile_id === actorUserId
}

async function getExistingLeaveRequest(supabase: ServiceClient, requestId: string) {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(
      `
        approval_stage,
        created_at,
        decision_note,
        employee_id,
        end_date,
        id,
        leave_type,
        organization_id,
        reason,
        reviewed_at,
        start_date,
        status,
        employees(employee_code, full_name, manager_employee_id, profile_id)
      `,
    )
    .eq('id', requestId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as
    | (LeaveRequestRow & {
        organization_id: string
        employees:
          | {
              employee_code: string
              full_name: string
              manager_employee_id: string | null
              profile_id: string | null
            }
          | {
              employee_code: string
              full_name: string
              manager_employee_id: string | null
              profile_id: string | null
            }[]
          | null
      })
    | null
}

export function createLeaveRepository(): LeaveRepository {
  return {
    async list(accessToken) {
      const supabase = accessToken ? createSupabaseUserClient(accessToken) : null

      if (!supabase) {
        return { data: getFallbackDashboard(), source: 'fixture' }
      }

      const [profileResult, rolesResult, employeesResult, requestsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('organization_id, organizations(id, name)')
          .single(),
        supabase.from('user_roles').select('role').order('role'),
        supabase
          .from('employees')
          .select('id, organization_id, employee_code, full_name, profile_id, manager_employee_id')
          .order('employee_code', { ascending: true }),
        supabase
          .from('leave_requests')
          .select(
            `
              approval_stage,
              created_at,
              decision_note,
              employee_id,
              end_date,
              id,
              leave_type,
              reason,
              reviewed_at,
              start_date,
              status,
              employees(employee_code, full_name, manager_employee_id)
            `,
          )
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      for (const result of [profileResult, rolesResult, employeesResult, requestsResult]) {
        if (result.error) {
          throw result.error
        }
      }

      const profile = profileResult.data as ProfileRow | null
      const organization = firstRelation(profile?.organizations ?? null)

      return {
        data: {
          currentUserRoles: ((rolesResult.data ?? []) as RoleRow[]).map((row) => row.role),
          employees: ((employeesResult.data ?? []) as EmployeeRow[]).map(toLeaveEmployee),
          organization: organization
            ? {
                id: organization.id,
                name: organization.name,
              }
            : null,
          requests: ((requestsResult.data ?? []) as LeaveRequestRow[]).map(toLeaveRequest),
        },
        source: 'supabase',
      }
    },

    async createLeaveRequest(actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      getInclusiveDays(input.startDate, input.endDate)

      const employeeResult = await supabase
        .from('employees')
        .select('id, organization_id, employee_code, full_name, profile_id, manager_employee_id')
        .eq('id', input.employeeId)
        .maybeSingle()

      if (employeeResult.error) {
        throw employeeResult.error
      }

      const employee = employeeResult.data as EmployeeRow | null

      if (!employee) {
        return { status: 'not_found' }
      }

      if (employee.organization_id !== input.organizationId) {
        return { status: 'forbidden' }
      }

      const isSelfRequest = employee.profile_id === actorUserId
      const canCreateForEmployee =
        isSelfRequest || (await canWrite(actorUserId, input.organizationId, ['owner', 'admin', 'hr']))

      if (!canCreateForEmployee) {
        return { status: 'forbidden' }
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          approval_stage: employee.manager_employee_id ? 'manager' : 'hr',
          employee_id: input.employeeId,
          end_date: input.endDate,
          leave_type: input.leaveType,
          organization_id: input.organizationId,
          reason: input.reason,
          requested_by: actorUserId,
          start_date: input.startDate,
          status: 'pending',
        })
        .select(
          `
            approval_stage,
            created_at,
            decision_note,
            employee_id,
            end_date,
            id,
            leave_type,
            reason,
            reviewed_at,
            start_date,
            status,
            employees(employee_code, full_name, manager_employee_id)
          `,
        )
        .single()

      if (error) {
        throw error
      }

      await supabase.from('audit_logs').insert({
        action: 'leave_request_created',
        actor_id: actorUserId,
        entity_id: data.id,
        entity_type: 'leave_request',
        metadata: {
          employee_code: employee.employee_code,
          end_date: input.endDate,
          leave_type: input.leaveType,
          start_date: input.startDate,
        },
        organization_id: input.organizationId,
      })

      return { data: toLeaveRequest(data as LeaveRequestRow), status: 'created' }
    },

    async reviewLeaveRequest(requestId, actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const existing = await getExistingLeaveRequest(supabase, requestId)

      if (!existing) {
        return { status: 'not_found' }
      }

      if (existing.organization_id !== input.organizationId) {
        return { status: 'forbidden' }
      }

      if (existing.status !== 'pending') {
        throw new LeaveWriteError(400, 'Only pending leave requests can be reviewed')
      }

      const canHrReview = await canWrite(actorUserId, existing.organization_id, ['owner', 'admin', 'hr'])
      const canManagerReview =
        existing.approval_stage === 'manager' &&
        input.decision !== 'escalated' &&
        (await isDirectManager(supabase, actorUserId, existing.employee_id))
      const canManagerEscalate =
        existing.approval_stage === 'manager' &&
        input.decision === 'escalated' &&
        (await isDirectManager(supabase, actorUserId, existing.employee_id))

      if (!canHrReview && !canManagerReview && !canManagerEscalate) {
        return { status: 'forbidden' }
      }

      const now = new Date().toISOString()
      const update =
        input.decision === 'escalated'
          ? {
              approval_stage: 'hr',
              decision_note: input.decisionNote ?? null,
              escalated_at: now,
              escalated_by: actorUserId,
              updated_at: now,
            }
          : {
              approval_stage: 'closed',
              decision_note: input.decisionNote ?? null,
              reviewed_at: now,
              reviewed_by: actorUserId,
              status: input.decision,
              updated_at: now,
            }

      const { data, error } = await supabase
        .from('leave_requests')
        .update(update)
        .eq('id', requestId)
        .select(
          `
            approval_stage,
            created_at,
            decision_note,
            employee_id,
            end_date,
            id,
            leave_type,
            reason,
            reviewed_at,
            start_date,
            status,
            employees(employee_code, full_name, manager_employee_id)
          `,
        )
        .single()

      if (error) {
        throw error
      }

      await supabase.from('audit_logs').insert({
        action: input.decision === 'escalated' ? 'leave_request_escalated' : `leave_request_${input.decision}`,
        actor_id: actorUserId,
        entity_id: requestId,
        entity_type: 'leave_request',
        metadata: {
          decision_note: input.decisionNote ?? null,
          previous_stage: existing.approval_stage,
          previous_status: existing.status,
        },
        organization_id: existing.organization_id,
      })

      return { data: toLeaveRequest(data as LeaveRequestRow), status: 'updated' }
    },

    async cancelLeaveRequest(requestId, actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const existing = await getExistingLeaveRequest(supabase, requestId)

      if (!existing) {
        return { status: 'not_found' }
      }

      const employee = firstRelation(existing.employees)
      const isSelfRequest = employee?.profile_id === actorUserId

      if (existing.organization_id !== input.organizationId) {
        return { status: 'forbidden' }
      }

      if (existing.status !== 'pending') {
        throw new LeaveWriteError(400, 'Only pending leave requests can be cancelled')
      }

      if (!isSelfRequest && !(await canWrite(actorUserId, existing.organization_id, ['owner', 'admin', 'hr']))) {
        return { status: 'forbidden' }
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          approval_stage: 'closed',
          reviewed_at: new Date().toISOString(),
          reviewed_by: actorUserId,
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select(
          `
            approval_stage,
            created_at,
            decision_note,
            employee_id,
            end_date,
            id,
            leave_type,
            reason,
            reviewed_at,
            start_date,
            status,
            employees(employee_code, full_name, manager_employee_id)
          `,
        )
        .single()

      if (error) {
        throw error
      }

      await supabase.from('audit_logs').insert({
        action: 'leave_request_cancelled',
        actor_id: actorUserId,
        entity_id: requestId,
        entity_type: 'leave_request',
        metadata: { previous_stage: existing.approval_stage, previous_status: existing.status },
        organization_id: existing.organization_id,
      })

      return { data: toLeaveRequest(data as LeaveRequestRow), status: 'updated' }
    },
  }
}
