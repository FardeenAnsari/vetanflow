export type Employee = {
  id: string
  code: string
  fullName: string
  department: string
  role: string
  location: string
  annualCompensation: number
  status: 'draft' | 'active' | 'on_leave' | 'exit_pending' | 'inactive'
}

export type AppRole = 'owner' | 'admin' | 'hr' | 'finance' | 'manager' | 'employee'

export const employees: Employee[] = [
  {
    id: 'emp_001',
    code: 'VF-001',
    fullName: 'Aarav Mehta',
    department: 'Engineering',
    role: 'Frontend Engineer',
    location: 'New York',
    annualCompensation: 120000,
    status: 'active',
  },
  {
    id: 'emp_002',
    code: 'VF-002',
    fullName: 'Naina Kapoor',
    department: 'Finance',
    role: 'Payroll Specialist',
    location: 'Austin',
    annualCompensation: 90000,
    status: 'active',
  },
  {
    id: 'emp_003',
    code: 'VF-003',
    fullName: 'Ritwik Sen',
    department: 'Operations',
    role: 'Operations Manager',
    location: 'Seattle',
    annualCompensation: 150000,
    status: 'draft',
  },
]
