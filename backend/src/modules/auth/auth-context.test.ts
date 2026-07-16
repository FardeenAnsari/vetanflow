import { describe, expect, it } from 'vitest'
import { canAssignRole } from './auth-context.js'

describe('canAssignRole', () => {
  it('lets owners assign every non-owner role', () => {
    expect(canAssignRole(['owner'], 'admin')).toBe(true)
    expect(canAssignRole(['owner'], 'employee')).toBe(true)
  })

  it('prevents administrators from creating peer administrators', () => {
    expect(canAssignRole(['admin'], 'admin')).toBe(false)
    expect(canAssignRole(['admin'], 'finance')).toBe(true)
  })

  it('limits people operations to manager and employee assignments', () => {
    expect(canAssignRole(['hr'], 'finance')).toBe(false)
    expect(canAssignRole(['hr'], 'manager')).toBe(true)
    expect(canAssignRole(['hr'], 'employee')).toBe(true)
  })
})
