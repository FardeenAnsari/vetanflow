import { z } from 'zod'
import { getSupabaseServiceClient, createSupabaseUserClient } from '../../lib/supabase.js'
import { postgresUuidSchema } from '../../lib/validation.js'
import { getUserRoles, hasAnyRole } from '../auth/roles.js'
import { employees as fixtureEmployees, type AppRole } from '../employees/sample-data.js'

type DataSource = 'fixture' | 'supabase'

type Result<T> = {
  data: T
  source: DataSource
}

export type HrDepartment = {
  id: string
  isActive: boolean
  name: string
  organizationId: string
}

export type HrLocation = {
  id: string
  city: string
  countryCode: string
  isActive: boolean
  name: string
  organizationId: string
  state: string
}

export type HrEmployee = {
  id: string
  annualCtc: number
  bankAccountHolderName: string | null
  bankAccountNumber: string | null
  bankIfsc: string | null
  bankName: string | null
  code: string
  department: string
  departmentId: string | null
  fullName: string
  joiningDate: string
  location: string
  photoUrl: string | null
  role: string
  status: 'draft' | 'active' | 'on_leave' | 'exit_pending' | 'inactive'
  workEmail: string | null
  workLocationId: string | null
}

export type SalaryRevision = {
  id: string
  annualCtc: number
  createdAt: string
  effectiveFrom: string
  employeeId: string
  reason: string
}

export type AuditEntry = {
  id: string
  action: string
  createdAt: string
  entityId: string | null
  entityType: string
  metadata: unknown
}

export type HrMasterData = {
  auditEntries: AuditEntry[]
  currentUserRoles: AppRole[]
  departments: HrDepartment[]
  employees: HrEmployee[]
  locations: HrLocation[]
  organization: {
    id: string
    name: string
  } | null
  salaryRevisions: SalaryRevision[]
}

export const departmentCreateSchema = z.object({
  name: z.string().min(2).max(120),
  organizationId: postgresUuidSchema,
})

export const departmentUpdateSchema = departmentCreateSchema.extend({
  isActive: z.boolean().default(true),
})

export const departmentArchiveSchema = z.object({
  organizationId: postgresUuidSchema,
})

export const locationCreateSchema = z.object({
  city: z.string().min(2).max(120),
  countryCode: z.string().length(2).default('IN'),
  isActive: z.boolean().default(true),
  name: z.string().min(2).max(140),
  organizationId: postgresUuidSchema,
  state: z.string().min(2).max(120),
})

export const locationUpdateSchema = locationCreateSchema

export const locationArchiveSchema = z.object({
  organizationId: postgresUuidSchema,
})

const optionalBankTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null))

const bankAccountNumberSchema = optionalBankTextSchema(20).refine(
  (value) => value === null || /^[0-9]{6,20}$/.test(value),
  'Bank account number must be 6 to 20 digits',
)

const bankIfscSchema = z
  .string()
  .trim()
  .max(11)
  .optional()
  .transform((value) => (value ? value.toUpperCase() : null))
  .refine((value) => value === null || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value), {
    message: 'IFSC must use the standard 11-character format',
  })

const employeeWriteSchema = z.object({
  bankAccountHolderName: optionalBankTextSchema(120),
  bankAccountNumber: bankAccountNumberSchema,
  bankIfsc: bankIfscSchema,
  bankName: optionalBankTextSchema(120),
  code: z.string().trim().min(2).max(40),
  departmentId: postgresUuidSchema,
  fullName: z.string().trim().min(2).max(120),
  joiningDate: z.iso.date(),
  organizationId: postgresUuidSchema,
  role: z.string().trim().min(2).max(120),
  status: z.enum(['draft', 'active', 'on_leave', 'exit_pending', 'inactive']).default('draft'),
  workEmail: z.email(),
  workLocationId: postgresUuidSchema,
})

export const hrEmployeeCreateSchema = employeeWriteSchema.extend({
  annualCtc: z.number().min(0),
})

export const hrEmployeeUpdateSchema = employeeWriteSchema

export const salaryRevisionCreateSchema = z.object({
  annualCtc: z.number().min(0),
  effectiveFrom: z.iso.date(),
  employeeId: postgresUuidSchema,
  organizationId: postgresUuidSchema,
  reason: z.string().min(2).max(240),
})

export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>
export type DepartmentArchiveInput = z.infer<typeof departmentArchiveSchema>
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>
export type HrEmployeeCreateInput = z.infer<typeof hrEmployeeCreateSchema>
export type HrEmployeeUpdateInput = z.infer<typeof hrEmployeeUpdateSchema>
export type LocationArchiveInput = z.infer<typeof locationArchiveSchema>
export type LocationCreateInput = z.infer<typeof locationCreateSchema>
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>
export type SalaryRevisionCreateInput = z.infer<typeof salaryRevisionCreateSchema>

type WriteStatus = 'created' | 'forbidden' | 'not_configured' | 'not_found' | 'updated'

export type EmployeePhotoUploadInput = {
  buffer: Buffer
  mimeType: string
  size: number
}

export class HrMasterDataWriteError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

type EmployeeRow = {
  id: string
  annual_ctc: number | string
  bank_account_holder_name: string | null
  bank_account_number: string | null
  bank_ifsc: string | null
  bank_name: string | null
  department_id: string | null
  departments: { id: string; name: string } | { id: string; name: string }[] | null
  designation: string
  employee_code: string
  full_name: string
  joining_date: string
  location: string
  photo_path: string | null
  status: HrEmployee['status']
  work_email: string | null
  work_location_id: string | null
  work_locations:
    | { id: string; name: string; city: string; state: string }
    | { id: string; name: string; city: string; state: string }[]
    | null
}

type ExistingEmployeeRow = {
  employee_code: string
  full_name: string
  id: string
  organization_id: string
  photo_path: string | null
  profile_id: string | null
  status: HrEmployee['status']
}

type DepartmentRow = {
  id: string
  is_active: boolean
  name: string
  organization_id: string
}

type LocationRow = {
  id: string
  city: string
  country_code: string
  is_active: boolean
  name: string
  organization_id: string
  state: string
}

type SalaryRevisionRow = {
  id: string
  annual_ctc: number | string
  created_at: string
  effective_from: string
  employee_id: string
  reason: string
}

type AuditRow = {
  id: string
  action: string
  created_at: string
  entity_id: string | null
  entity_type: string
  metadata: unknown
}

type ProfileRow = {
  organization_id: string | null
  organizations: { id: string; name: string } | { id: string; name: string }[] | null
}

type RoleRow = {
  role: AppRole
}

export type HrMasterDataRepository = {
  createEmployee: (
    actorUserId: string | undefined,
    input: HrEmployeeCreateInput,
  ) => Promise<{ data?: HrEmployee; status: WriteStatus }>
  createDepartment: (
    actorUserId: string | undefined,
    input: DepartmentCreateInput,
  ) => Promise<{ data?: HrDepartment; status: WriteStatus }>
  createLocation: (
    actorUserId: string | undefined,
    input: LocationCreateInput,
  ) => Promise<{ data?: HrLocation; status: WriteStatus }>
  archiveDepartment: (
    departmentId: string,
    actorUserId: string | undefined,
    input: DepartmentArchiveInput,
  ) => Promise<{ data?: HrDepartment; status: WriteStatus }>
  archiveLocation: (
    locationId: string,
    actorUserId: string | undefined,
    input: LocationArchiveInput,
  ) => Promise<{ data?: HrLocation; status: WriteStatus }>
  list: (accessToken?: string) => Promise<Result<HrMasterData>>
  recordSalaryRevision: (
    actorUserId: string | undefined,
    input: SalaryRevisionCreateInput,
  ) => Promise<{ data?: SalaryRevision; status: WriteStatus }>
  uploadEmployeePhoto: (
    employeeId: string,
    actorUserId: string | undefined,
    input: EmployeePhotoUploadInput,
  ) => Promise<{ data?: HrEmployee; status: WriteStatus }>
  updateEmployee: (
    employeeId: string,
    actorUserId: string | undefined,
    input: HrEmployeeUpdateInput,
  ) => Promise<{ data?: HrEmployee; status: WriteStatus }>
  updateDepartment: (
    departmentId: string,
    actorUserId: string | undefined,
    input: DepartmentUpdateInput,
  ) => Promise<{ data?: HrDepartment; status: WriteStatus }>
  updateLocation: (
    locationId: string,
    actorUserId: string | undefined,
    input: LocationUpdateInput,
  ) => Promise<{ data?: HrLocation; status: WriteStatus }>
}

const fallbackOrganization = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'VetanFlow Demo India',
}

const fallbackDepartments: HrDepartment[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    isActive: true,
    name: 'Engineering',
    organizationId: fallbackOrganization.id,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    isActive: true,
    name: 'Finance',
    organizationId: fallbackOrganization.id,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    isActive: true,
    name: 'Operations',
    organizationId: fallbackOrganization.id,
  },
]

const fallbackLocations: HrLocation[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    city: 'Kolkata',
    countryCode: 'IN',
    isActive: true,
    name: 'Kolkata HQ',
    organizationId: fallbackOrganization.id,
    state: 'West Bengal',
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    city: 'Mumbai',
    countryCode: 'IN',
    isActive: true,
    name: 'Mumbai Finance Office',
    organizationId: fallbackOrganization.id,
    state: 'Maharashtra',
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    city: 'Bengaluru',
    countryCode: 'IN',
    isActive: true,
    name: 'Bengaluru Operations Hub',
    organizationId: fallbackOrganization.id,
    state: 'Karnataka',
  },
]

function firstRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value
}

const employeeSelectQuery = `
  id,
  annual_ctc,
  bank_account_holder_name,
  bank_account_number,
  bank_ifsc,
  bank_name,
  department_id,
  designation,
  employee_code,
  full_name,
  joining_date,
  location,
  photo_path,
  status,
  work_email,
  work_location_id,
  departments(id, name),
  work_locations(id, name, city, state)
`

const employeePhotoBucket = 'employee-photos'
const employeePhotoMaxBytes = 2 * 1024 * 1024
const employeePhotoMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

function toEmployee(row: EmployeeRow, photoUrl: string | null = null): HrEmployee {
  const department = firstRelation(row.departments)
  const workLocation = firstRelation(row.work_locations)

  return {
    id: row.id,
    annualCtc: Number(row.annual_ctc),
    bankAccountHolderName: row.bank_account_holder_name,
    bankAccountNumber: row.bank_account_number,
    bankIfsc: row.bank_ifsc,
    bankName: row.bank_name,
    code: row.employee_code,
    department: department?.name ?? 'Unassigned',
    departmentId: row.department_id,
    fullName: row.full_name,
    joiningDate: row.joining_date,
    location: workLocation?.city ?? row.location,
    photoUrl,
    role: row.designation,
    status: row.status,
    workEmail: row.work_email,
    workLocationId: row.work_location_id,
  }
}

function getPhotoExtension(mimeType: string) {
  if (mimeType === 'image/jpeg') {
    return 'jpg'
  }

  if (mimeType === 'image/png') {
    return 'png'
  }

  if (mimeType === 'image/webp') {
    return 'webp'
  }

  throw new HrMasterDataWriteError(400, 'Upload a JPG, PNG, or WebP image')
}

function toDepartment(row: DepartmentRow): HrDepartment {
  return {
    id: row.id,
    isActive: row.is_active,
    name: row.name,
    organizationId: row.organization_id,
  }
}

function toLocation(row: LocationRow): HrLocation {
  return {
    id: row.id,
    city: row.city,
    countryCode: row.country_code,
    isActive: row.is_active,
    name: row.name,
    organizationId: row.organization_id,
    state: row.state,
  }
}

function toSalaryRevision(row: SalaryRevisionRow): SalaryRevision {
  return {
    id: row.id,
    annualCtc: Number(row.annual_ctc),
    createdAt: row.created_at,
    effectiveFrom: row.effective_from,
    employeeId: row.employee_id,
    reason: row.reason,
  }
}

function toAuditEntry(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    action: row.action,
    createdAt: row.created_at,
    entityId: row.entity_id,
    entityType: row.entity_type,
    metadata: row.metadata,
  }
}

function getFallbackMasterData(): HrMasterData {
  return {
    auditEntries: [],
    currentUserRoles: ['owner'],
    departments: fallbackDepartments,
    employees: fixtureEmployees.map((employee) => ({
      ...employee,
      bankAccountHolderName: null,
      bankAccountNumber: null,
      bankIfsc: null,
      bankName: null,
      departmentId:
        fallbackDepartments.find((department) => department.name === employee.department)?.id ?? null,
      joiningDate: '2026-01-01',
      photoUrl: null,
      workEmail: `${employee.code.toLowerCase()}@example.com`,
      workLocationId:
        fallbackLocations.find((location) => location.city === employee.location)?.id ?? null,
    })),
    locations: fallbackLocations,
    organization: fallbackOrganization,
    salaryRevisions: fixtureEmployees.map((employee) => ({
      id: `salary_${employee.id}`,
      annualCtc: employee.annualCtc,
      createdAt: '2026-07-04T00:00:00.000Z',
      effectiveFrom: '2026-01-01',
      employeeId: employee.id,
      reason: 'Initial setup',
    })),
  }
}

async function canWrite(actorUserId: string | undefined, organizationId: string, allowedRoles: AppRole[]) {
  if (!actorUserId) {
    return false
  }

  const actorRoles = await getUserRoles(actorUserId, organizationId)

  return hasAnyRole(actorRoles, allowedRoles)
}

type ServiceClient = NonNullable<ReturnType<typeof getSupabaseServiceClient>>

async function createSignedPhotoUrl(supabase: ServiceClient, photoPath: string | null) {
  if (!photoPath) {
    return null
  }

  const { data, error } = await supabase.storage
    .from(employeePhotoBucket)
    .createSignedUrl(photoPath, 60 * 60)

  if (error) {
    return null
  }

  return data.signedUrl
}

async function toEmployeeWithPhoto(supabase: ServiceClient, row: EmployeeRow) {
  return toEmployee(row, await createSignedPhotoUrl(supabase, row.photo_path))
}

async function requireWritableEmployeeReferences(
  supabase: ServiceClient,
  input: HrEmployeeCreateInput | HrEmployeeUpdateInput,
) {
  const [departmentResult, locationResult] = await Promise.all([
    supabase
      .from('departments')
      .select('id')
      .eq('id', input.departmentId)
      .eq('organization_id', input.organizationId)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('work_locations')
      .select('id, city')
      .eq('id', input.workLocationId)
      .eq('organization_id', input.organizationId)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  if (departmentResult.error) {
    throw departmentResult.error
  }

  if (locationResult.error) {
    throw locationResult.error
  }

  if (!departmentResult.data) {
    throw new HrMasterDataWriteError(400, 'Selected department is not available')
  }

  if (!locationResult.data) {
    throw new HrMasterDataWriteError(400, 'Selected work location is not available')
  }

  return { location: locationResult.data.city }
}

export function createHrMasterDataRepository(): HrMasterDataRepository {
  return {
    async list(accessToken) {
      const supabase = accessToken ? createSupabaseUserClient(accessToken) : null

      if (!supabase) {
        return { data: getFallbackMasterData(), source: 'fixture' }
      }

      const [
        profileResult,
        rolesResult,
        departmentsResult,
        locationsResult,
        employeesResult,
        salariesResult,
        auditResult,
      ] = await Promise.all([
          supabase
            .from('profiles')
            .select('organization_id, organizations(id, name)')
            .single(),
          supabase.from('user_roles').select('role').order('role'),
          supabase.from('departments').select('id, organization_id, name, is_active').order('name'),
          supabase
            .from('work_locations')
            .select('id, organization_id, name, city, state, country_code, is_active')
            .order('city'),
          supabase
            .from('employees')
            .select(employeeSelectQuery)
            .order('employee_code', { ascending: true }),
          supabase
            .from('salary_revisions')
            .select('id, employee_id, annual_ctc, effective_from, reason, created_at')
            .order('effective_from', { ascending: false }),
          supabase
            .from('audit_logs')
            .select('id, action, entity_type, entity_id, metadata, created_at')
            .order('created_at', { ascending: false })
            .limit(50),
        ])

      for (const result of [
        profileResult,
        rolesResult,
        departmentsResult,
        locationsResult,
        employeesResult,
        salariesResult,
        auditResult,
      ]) {
        if (result.error) {
          throw result.error
        }
      }

      const profile = profileResult.data as ProfileRow | null
      const organization = firstRelation(profile?.organizations ?? null)
      const employeeRows = (employeesResult.data ?? []) as EmployeeRow[]
      const signingClient = getSupabaseServiceClient()
      const employees = signingClient
        ? await Promise.all(employeeRows.map((row) => toEmployeeWithPhoto(signingClient, row)))
        : employeeRows.map((row) => toEmployee(row))

      return {
        data: {
          auditEntries: ((auditResult.data ?? []) as AuditRow[]).map(toAuditEntry),
          currentUserRoles: ((rolesResult.data ?? []) as RoleRow[]).map((row) => row.role),
          departments: ((departmentsResult.data ?? []) as DepartmentRow[]).map(toDepartment),
          employees,
          locations: ((locationsResult.data ?? []) as LocationRow[]).map(toLocation),
          organization: organization
            ? {
                id: organization.id,
                name: organization.name,
              }
            : null,
          salaryRevisions: ((salariesResult.data ?? []) as SalaryRevisionRow[]).map(toSalaryRevision),
        },
        source: 'supabase',
      }
    },

    async createEmployee(actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      if (!(await canWrite(actorUserId, input.organizationId, ['owner', 'admin', 'hr']))) {
        return { status: 'forbidden' }
      }

      const { location } = await requireWritableEmployeeReferences(supabase, input)

      const { data, error } = await supabase
        .from('employees')
        .insert({
          annual_ctc: input.annualCtc,
          bank_account_holder_name: input.bankAccountHolderName,
          bank_account_number: input.bankAccountNumber,
          bank_ifsc: input.bankIfsc,
          bank_name: input.bankName,
          department_id: input.departmentId,
          designation: input.role,
          employee_code: input.code,
          full_name: input.fullName,
          joining_date: input.joiningDate,
          location,
          organization_id: input.organizationId,
          status: input.status,
          work_email: input.workEmail,
          work_location_id: input.workLocationId,
        })
        .select(employeeSelectQuery)
        .single()

      if (error) {
        throw error
      }

      await supabase.from('audit_logs').insert({
        action: 'employee_created',
        actor_id: actorUserId,
        entity_id: data.id,
        entity_type: 'employee',
        metadata: {
          bank_details_present: Boolean(input.bankAccountNumber && input.bankIfsc),
          employee_code: input.code,
          full_name: input.fullName,
          status: input.status,
        },
        organization_id: input.organizationId,
      })

      const salaryRevisionResult = await supabase.rpc('record_salary_revision', {
        p_actor_id: actorUserId,
        p_annual_ctc: input.annualCtc,
        p_effective_from: input.joiningDate,
        p_employee_id: data.id,
        p_reason: 'Initial compensation',
      })

      if (salaryRevisionResult.error) {
        throw salaryRevisionResult.error
      }

      return { data: await toEmployeeWithPhoto(supabase, data as EmployeeRow), status: 'created' }
    },

    async createDepartment(actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      if (!(await canWrite(actorUserId, input.organizationId, ['owner', 'admin', 'hr']))) {
        return { status: 'forbidden' }
      }

      const { data, error } = await supabase
        .from('departments')
        .insert({
          is_active: true,
          name: input.name,
          organization_id: input.organizationId,
        })
        .select('id, organization_id, name, is_active')
        .single()

      if (error) {
        throw error
      }

      await supabase.from('audit_logs').insert({
        action: 'department_created',
        actor_id: actorUserId,
        entity_id: data.id,
        entity_type: 'department',
        metadata: { name: input.name },
        organization_id: input.organizationId,
      })

      return { data: toDepartment(data as DepartmentRow), status: 'created' }
    },

    async updateDepartment(departmentId, actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const existingResult = await supabase
        .from('departments')
        .select('id, organization_id, name, is_active')
        .eq('id', departmentId)
        .maybeSingle()

      if (existingResult.error) {
        throw existingResult.error
      }

      const existing = existingResult.data as DepartmentRow | null

      if (!existing) {
        return { status: 'not_found' }
      }

      if (existing.organization_id !== input.organizationId) {
        return { status: 'forbidden' }
      }

      if (!(await canWrite(actorUserId, existing.organization_id, ['owner', 'admin', 'hr']))) {
        return { status: 'forbidden' }
      }

      const { data, error } = await supabase
        .from('departments')
        .update({
          is_active: input.isActive,
          name: input.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', departmentId)
        .select('id, organization_id, name, is_active')
        .single()

      if (error) {
        throw error
      }

      await supabase.from('audit_logs').insert({
        action: 'department_updated',
        actor_id: actorUserId,
        entity_id: departmentId,
        entity_type: 'department',
        metadata: {
          after: { is_active: input.isActive, name: input.name },
          before: { is_active: existing.is_active, name: existing.name },
        },
        organization_id: existing.organization_id,
      })

      return { data: toDepartment(data as DepartmentRow), status: 'updated' }
    },

    async archiveDepartment(departmentId, actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const existingResult = await supabase
        .from('departments')
        .select('id, organization_id, name, is_active')
        .eq('id', departmentId)
        .maybeSingle()

      if (existingResult.error) {
        throw existingResult.error
      }

      const existing = existingResult.data as DepartmentRow | null

      if (!existing) {
        return { status: 'not_found' }
      }

      if (existing.organization_id !== input.organizationId) {
        return { status: 'forbidden' }
      }

      if (!(await canWrite(actorUserId, existing.organization_id, ['owner', 'admin', 'hr']))) {
        return { status: 'forbidden' }
      }

      const { data, error } = await supabase
        .from('departments')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', departmentId)
        .select('id, organization_id, name, is_active')
        .single()

      if (error) {
        throw error
      }

      await supabase.from('audit_logs').insert({
        action: 'department_archived',
        actor_id: actorUserId,
        entity_id: departmentId,
        entity_type: 'department',
        metadata: { name: existing.name },
        organization_id: existing.organization_id,
      })

      return { data: toDepartment(data as DepartmentRow), status: 'updated' }
    },

    async createLocation(actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      if (!(await canWrite(actorUserId, input.organizationId, ['owner', 'admin', 'hr']))) {
        return { status: 'forbidden' }
      }

      const { data, error } = await supabase
        .from('work_locations')
        .insert({
          city: input.city,
          country_code: input.countryCode,
          is_active: input.isActive,
          name: input.name,
          organization_id: input.organizationId,
          state: input.state,
        })
        .select('id, organization_id, name, city, state, country_code, is_active')
        .single()

      if (error) {
        throw error
      }

      await supabase.from('audit_logs').insert({
        action: 'work_location_created',
        actor_id: actorUserId,
        entity_id: data.id,
        entity_type: 'work_location',
        metadata: { city: input.city, name: input.name, state: input.state },
        organization_id: input.organizationId,
      })

      return { data: toLocation(data as LocationRow), status: 'created' }
    },

    async updateLocation(locationId, actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const existingResult = await supabase
        .from('work_locations')
        .select('id, organization_id, name, city, state, country_code, is_active')
        .eq('id', locationId)
        .maybeSingle()

      if (existingResult.error) {
        throw existingResult.error
      }

      const existing = existingResult.data as LocationRow | null

      if (!existing) {
        return { status: 'not_found' }
      }

      if (existing.organization_id !== input.organizationId) {
        return { status: 'forbidden' }
      }

      if (!(await canWrite(actorUserId, existing.organization_id, ['owner', 'admin', 'hr']))) {
        return { status: 'forbidden' }
      }

      const { data, error } = await supabase
        .from('work_locations')
        .update({
          city: input.city,
          country_code: input.countryCode,
          is_active: input.isActive,
          name: input.name,
          state: input.state,
          updated_at: new Date().toISOString(),
        })
        .eq('id', locationId)
        .select('id, organization_id, name, city, state, country_code, is_active')
        .single()

      if (error) {
        throw error
      }

      await supabase.from('audit_logs').insert({
        action: 'work_location_updated',
        actor_id: actorUserId,
        entity_id: locationId,
        entity_type: 'work_location',
        metadata: {
          after: {
            city: input.city,
            is_active: input.isActive,
            name: input.name,
            state: input.state,
          },
          before: {
            city: existing.city,
            is_active: existing.is_active,
            name: existing.name,
            state: existing.state,
          },
        },
        organization_id: existing.organization_id,
      })

      return { data: toLocation(data as LocationRow), status: 'updated' }
    },

    async archiveLocation(locationId, actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const existingResult = await supabase
        .from('work_locations')
        .select('id, organization_id, name, city, state, country_code, is_active')
        .eq('id', locationId)
        .maybeSingle()

      if (existingResult.error) {
        throw existingResult.error
      }

      const existing = existingResult.data as LocationRow | null

      if (!existing) {
        return { status: 'not_found' }
      }

      if (existing.organization_id !== input.organizationId) {
        return { status: 'forbidden' }
      }

      if (!(await canWrite(actorUserId, existing.organization_id, ['owner', 'admin', 'hr']))) {
        return { status: 'forbidden' }
      }

      const { data, error } = await supabase
        .from('work_locations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', locationId)
        .select('id, organization_id, name, city, state, country_code, is_active')
        .single()

      if (error) {
        throw error
      }

      await supabase.from('audit_logs').insert({
        action: 'work_location_archived',
        actor_id: actorUserId,
        entity_id: locationId,
        entity_type: 'work_location',
        metadata: { city: existing.city, name: existing.name, state: existing.state },
        organization_id: existing.organization_id,
      })

      return { data: toLocation(data as LocationRow), status: 'updated' }
    },

    async recordSalaryRevision(actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      if (!(await canWrite(actorUserId, input.organizationId, ['owner', 'admin', 'hr', 'finance']))) {
        return { status: 'forbidden' }
      }

      const { data, error } = await supabase.rpc('record_salary_revision', {
        p_actor_id: actorUserId,
        p_annual_ctc: input.annualCtc,
        p_effective_from: input.effectiveFrom,
        p_employee_id: input.employeeId,
        p_reason: input.reason,
      })

      if (error) {
        throw error
      }

      return { data: toSalaryRevision(data as SalaryRevisionRow), status: 'created' }
    },

    async uploadEmployeePhoto(employeeId, actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      if (!actorUserId) {
        return { status: 'forbidden' }
      }

      if (input.size <= 0) {
        throw new HrMasterDataWriteError(400, 'Choose a photo before uploading')
      }

      if (input.size > employeePhotoMaxBytes) {
        throw new HrMasterDataWriteError(413, 'Photo must be 2 MB or smaller')
      }

      if (!employeePhotoMimeTypes.has(input.mimeType)) {
        throw new HrMasterDataWriteError(400, 'Upload a JPG, PNG, or WebP image')
      }

      const extension = getPhotoExtension(input.mimeType)
      const existingResult = await supabase
        .from('employees')
        .select('id, organization_id, profile_id, employee_code, full_name, photo_path, status')
        .eq('id', employeeId)
        .maybeSingle()

      if (existingResult.error) {
        throw existingResult.error
      }

      const existing = existingResult.data as ExistingEmployeeRow | null

      if (!existing) {
        return { status: 'not_found' }
      }

      const isSelfUpload = existing.profile_id === actorUserId
      const canManagePhoto = isSelfUpload || (await canWrite(actorUserId, existing.organization_id, ['owner', 'admin', 'hr']))

      if (!canManagePhoto) {
        return { status: 'forbidden' }
      }

      const photoPath = `${existing.organization_id}/${employeeId}/id-card.${extension}`
      const uploadResult = await supabase.storage
        .from(employeePhotoBucket)
        .upload(photoPath, input.buffer, {
          cacheControl: '3600',
          contentType: input.mimeType,
          upsert: true,
        })

      if (uploadResult.error) {
        throw uploadResult.error
      }

      const { data, error } = await supabase
        .from('employees')
        .update({
          photo_path: photoPath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employeeId)
        .select(employeeSelectQuery)
        .single()

      if (error) {
        throw error
      }

      if (existing.photo_path && existing.photo_path !== photoPath) {
        await supabase.storage.from(employeePhotoBucket).remove([existing.photo_path])
      }

      await supabase.from('audit_logs').insert({
        action: 'employee_photo_updated',
        actor_id: actorUserId,
        entity_id: employeeId,
        entity_type: 'employee',
        metadata: {
          employee_code: existing.employee_code,
          mime_type: input.mimeType,
          self_upload: isSelfUpload,
        },
        organization_id: existing.organization_id,
      })

      return { data: await toEmployeeWithPhoto(supabase, data as EmployeeRow), status: 'updated' }
    },

    async updateEmployee(employeeId, actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const existingResult = await supabase
        .from('employees')
        .select('id, organization_id, profile_id, employee_code, full_name, photo_path, status')
        .eq('id', employeeId)
        .maybeSingle()

      if (existingResult.error) {
        throw existingResult.error
      }

      const existing = existingResult.data as ExistingEmployeeRow | null

      if (!existing) {
        return { status: 'not_found' }
      }

      if (existing.organization_id !== input.organizationId) {
        return { status: 'forbidden' }
      }

      if (!(await canWrite(actorUserId, existing.organization_id, ['owner', 'admin', 'hr']))) {
        return { status: 'forbidden' }
      }

      const { location } = await requireWritableEmployeeReferences(supabase, input)

      const { data, error } = await supabase
        .from('employees')
        .update({
          bank_account_holder_name: input.bankAccountHolderName,
          bank_account_number: input.bankAccountNumber,
          bank_ifsc: input.bankIfsc,
          bank_name: input.bankName,
          department_id: input.departmentId,
          designation: input.role,
          employee_code: input.code,
          full_name: input.fullName,
          joining_date: input.joiningDate,
          location,
          status: input.status,
          updated_at: new Date().toISOString(),
          work_email: input.workEmail,
          work_location_id: input.workLocationId,
        })
        .eq('id', employeeId)
        .select(employeeSelectQuery)
        .single()

      if (error) {
        throw error
      }

      await supabase.from('audit_logs').insert({
        action: 'employee_updated',
        actor_id: actorUserId,
        entity_id: employeeId,
        entity_type: 'employee',
        metadata: {
          after: {
            bank_details_present: Boolean(input.bankAccountNumber && input.bankIfsc),
            employee_code: input.code,
            full_name: input.fullName,
            status: input.status,
          },
          before: {
            employee_code: existing.employee_code,
            full_name: existing.full_name,
            status: existing.status,
          },
        },
        organization_id: existing.organization_id,
      })

      return { data: await toEmployeeWithPhoto(supabase, data as EmployeeRow), status: 'updated' }
    },
  }
}
