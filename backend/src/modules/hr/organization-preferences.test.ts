import { describe, expect, it } from 'vitest'
import { organizationUpdateSchema } from './hr-master-data-repository.js'

const preferences = {
  organizationId: '00000000-0000-0000-0000-000000000001', name: 'VetanFlow Labs',
  countryCode: 'IN', currencyCode: 'INR', locale: 'en-IN', timezone: 'Asia/Kolkata',
}

describe('organization preferences', () => {
  it('accepts and normalizes Indian preferences', () => {
    expect(organizationUpdateSchema.parse({ ...preferences, countryCode: ' in ', currencyCode: ' inr ' })).toEqual(preferences)
  })

  it.each(['@@@', '123', 'ZZZ', 'IN'])('rejects invalid currency %s before it can break formatting', (currencyCode) => {
    expect(organizationUpdateSchema.safeParse({ ...preferences, currencyCode }).success).toBe(false)
  })

  it('rejects invalid country, locale, and timezone inputs', () => {
    for (const patch of [{ countryCode: '12' }, { locale: 'not_a_locale' }, { timezone: 'Mars/Olympus' }]) {
      expect(organizationUpdateSchema.safeParse({ ...preferences, ...patch }).success).toBe(false)
    }
  })
})
