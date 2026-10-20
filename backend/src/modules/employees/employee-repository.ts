import { createSupabaseUserClient, getSupabaseServiceClient } from '../../lib/supabase.js'
import { postgresUuidSchema } from '../../lib/validation.js'
import { getUserRoles, hasAnyRole } from '../auth/roles.js'
import { EmployeeAccountLinkError, normalizeWorkEmail, resolveEmployeeProfile } from '../auth/employee-account-link.js'
import { employees as fixtureEmployees, type Employee } from './sample-data.js'
import { z } from 'zod'

type EmployeeDataSource = 'fixture' | 'supabase'

type EmployeeResult<T> = {
  data: T
  source: EmployeeDataSource
}

export const employeeCreateSchema = z.object({
  annualCompensation: z.number().min(0).default(0),
  departmentId: postgresUuidSchema.optional(),
  designation: z.string().min(2).max(120),
  employeeCode: z.string().min(2).max(40),
  fullName: z.string().min(2).max(120),
  joiningDate: z.iso.date(),
  location: z.string().min(2).max(120),
  organizationId: postgresUuidSchema,
  profileId: postgresUuidSchema.optional(),
  status: z.enum(['draft', 'active', 'on_leave', 'exit_pending', 'inactive']).default('draft'),
  workEmail: z.string().trim().pipe(z.email()).transform(normalizeWorkEmail).optional(),
  workLocationId: postgresUuidSchema.optional(),
})

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>

type EmployeeRow = {
  id: string
  employee_code: string
  full_name: string
  designation: string
  location: string
  annual_compensation?: string | number
  status: Employee['status']
  departments: { name: string } | { name: string }[] | null
}

export type EmployeeRepository = {
  list: (accessToken?: string) => Promise<EmployeeResult<Employee[]>>
  findById: (id: string, accessToken?: string) => Promise<EmployeeResult<Employee | null>>
  create: (
    actorUserId: string | undefined,
    input: EmployeeCreateInput,
  ) => Promise<{ data?: Employee; status: 'created' | 'forbidden' | 'not_configured' }>
}

function toEmployee(row: EmployeeRow): Employee {
  const department = Array.isArray(row.departments) ? row.departments[0] : row.departments

  return {
    id: row.id,
    code: row.employee_code,
    fullName: row.full_name,
    department: department?.name ?? 'Unassigned',
    role: row.designation,
    location: row.location,
    annualCompensation: Number(row.annual_compensation ?? 0),
    status: row.status,
  }
}

export function createEmployeeRepository(): EmployeeRepository {
  return {
    async list(accessToken) {
      const supabase = accessToken ? createSupabaseUserClient(accessToken) : null

      if (!supabase) {
        return { data: fixtureEmployees, source: 'fixture' }
      }

      const { data, error } = await supabase
        .from('employees')
        .select(
          `
            id,
            employee_code,
            full_name,
            designation,
            location,
            status,
            departments(name)
          `,
        )
        .order('employee_code', { ascending: true })

      if (error) {
        throw error
      }

      return { data: ((data ?? []) as EmployeeRow[]).map(toEmployee), source: 'supabase' }
    },

    async findById(id, accessToken) {
      const supabase = accessToken ? createSupabaseUserClient(accessToken) : null

      if (!supabase) {
        return {
          data: fixtureEmployees.find((employee) => employee.id === id) ?? null,
          source: 'fixture',
        }
      }

      const { data, error } = await supabase
        .from('employees')
        .select(
          `
            id,
            employee_code,
            full_name,
            designation,
            location,
            status,
            departments(name)
          `,
        )
        .eq('id', id)
        .maybeSingle()

      if (error) {
        throw error
      }

      return { data: data ? toEmployee(data as EmployeeRow) : null, source: 'supabase' }
    },

    async create(actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      if (!actorUserId) {
        return { status: 'forbidden' }
      }

      const actorRoles = await getUserRoles(actorUserId, input.organizationId)

      if (!hasAnyRole(actorRoles, ['owner', 'admin', 'hr'])) {
        return { status: 'forbidden' }
      }

      if (input.profileId && !input.workEmail) throw new EmployeeAccountLinkError('A linked account requires its matching work email.')
      const profileId = input.workEmail
        ? await resolveEmployeeProfile(supabase, input.organizationId, input.workEmail, undefined, input.profileId)
        : null

      const { data, error } = await supabase
        .from('employees')
        .insert({
          annual_compensation: input.annualCompensation,
          department_id: input.departmentId,
          designation: input.designation,
          employee_code: input.employeeCode,
          full_name: input.fullName,
          joining_date: input.joiningDate,
          location: input.location,
          organization_id: input.organizationId,
          profile_id: profileId,
          status: input.status,
          work_email: input.workEmail,
          work_location_id: input.workLocationId,
        })
        .select(
          `
            id,
            employee_code,
            full_name,
            designation,
            location,
            annual_compensation,
            status,
            departments(name)
          `,
        )
        .single()

      if (error) {
        throw error
      }

      return { data: toEmployee(data as EmployeeRow), status: 'created' }
    },
  }
}
