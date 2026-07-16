import { describe, expect, it } from 'vitest'
import { getPayrollMakerCheckerConflict } from './payroll-run-repository.js'

describe('getPayrollMakerCheckerConflict', () => {
  it('blocks the payroll submitter from acting as checker', () => {
    expect(
      getPayrollMakerCheckerConflict(
        {
          created_by: 'user_creator',
          submitted_by: 'user_submitter',
        },
        'user_submitter',
      ),
    ).toBe('submitter')
  })

  it('blocks the payroll creator when a submitted actor is missing', () => {
    expect(
      getPayrollMakerCheckerConflict(
        {
          created_by: 'user_creator',
          submitted_by: null,
        },
        'user_creator',
      ),
    ).toBe('creator')
  })

  it('allows a different checker', () => {
    expect(
      getPayrollMakerCheckerConflict(
        {
          created_by: 'user_creator',
          submitted_by: 'user_submitter',
        },
        'user_checker',
      ),
    ).toBeNull()
  })
})
