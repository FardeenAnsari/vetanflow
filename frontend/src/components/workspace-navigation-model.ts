export type WorkspaceRole = 'owner' | 'admin' | 'hr' | 'finance' | 'manager' | 'employee'

export type WorkspaceSection =
  | 'overview'
  | 'self'
  | 'employees'
  | 'leave'
  | 'attendance'
  | 'payroll'
  | 'organization'
  | 'access'
  | 'audit'

const workspaceSections: WorkspaceSection[] = [
  'overview',
  'self',
  'employees',
  'leave',
  'attendance',
  'payroll',
  'organization',
  'access',
  'audit',
]

const roleSections: Record<WorkspaceRole, WorkspaceSection[]> = {
  owner: workspaceSections,
  admin: workspaceSections,
  hr: ['overview', 'self', 'employees', 'leave', 'attendance', 'payroll', 'organization', 'access'],
  finance: ['overview', 'self', 'employees', 'payroll'],
  manager: ['overview', 'self', 'leave', 'attendance'],
  employee: ['overview'],
}

const rolePriority: WorkspaceRole[] = ['owner', 'admin', 'hr', 'finance', 'manager', 'employee']

export const roleLabels: Record<WorkspaceRole, string> = {
  owner: 'Owner workspace',
  admin: 'Administration',
  hr: 'People operations',
  finance: 'Finance operations',
  manager: 'Manager workspace',
  employee: 'Employee workspace',
}

export function getPrimaryWorkspaceRole(roles: WorkspaceRole[]) {
  return rolePriority.find((role) => roles.includes(role)) ?? 'employee'
}

export function getAllowedWorkspaceSections(roles: WorkspaceRole[]) {
  const allowed = new Set<WorkspaceSection>()

  for (const role of roles) {
    for (const section of roleSections[role]) {
      allowed.add(section)
    }
  }

  return workspaceSections.filter((section) => allowed.has(section))
}

export function isWorkspaceSection(value: string): value is WorkspaceSection {
  return workspaceSections.includes(value as WorkspaceSection)
}
