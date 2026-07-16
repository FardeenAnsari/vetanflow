export type Employee = {
  id: string
  code: string
  fullName: string
  department: string
  role: string
  location: string
  annualCtc: number
  status: 'draft' | 'active' | 'on_leave' | 'exit_pending' | 'inactive'
}

export type AppRole = 'owner' | 'admin' | 'hr' | 'finance' | 'manager' | 'employee'

export const employees: Employee[] = [
  {
    id: 'emp_001',
    code: 'IND-001',
    fullName: 'Aarav Mehta',
    department: 'Engineering',
    role: 'Frontend Engineer',
    location: 'Kolkata',
    annualCtc: 1200000,
    status: 'active',
  },
  {
    id: 'emp_002',
    code: 'IND-002',
    fullName: 'Naina Kapoor',
    department: 'Finance',
    role: 'Payroll Specialist',
    location: 'Mumbai',
    annualCtc: 900000,
    status: 'active',
  },
  {
    id: 'emp_003',
    code: 'IND-003',
    fullName: 'Ritwik Sen',
    department: 'Operations',
    role: 'Operations Manager',
    location: 'Bengaluru',
    annualCtc: 1500000,
    status: 'draft',
  },
]
