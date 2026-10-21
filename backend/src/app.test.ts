import request from 'supertest'
import express from 'express'
import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'
import { createHrRouter } from './routes/hr.js'
import { createHrMasterDataRepository } from './modules/hr/hr-master-data-repository.js'

const app = createApp()

describe('app', () => {
  it('does not open a cloud workspace without an assigned role', async () => {
    const repository = createHrMasterDataRepository()
    const fixture = await repository.list()
    const isolatedApp = express()
    isolatedApp.use('/api/hr', createHrRouter({
      ...repository,
      list: async () => ({ source: 'supabase', data: { ...fixture.data, currentUserRoles: [] } }),
    }))
    const response = await request(isolatedApp).get('/api/hr/master-data').expect(403)
    expect(response.body.error).toContain('No workspace role')
  })
  it('returns a useful client error for malformed JSON', async () => {
    const response = await request(app).post('/api/employees').set('Content-Type', 'application/json').send('{invalid').expect(400)
    expect(response.body.error).toBe('Invalid JSON request body')
  })

  it('rejects oversized bodies with a payload-too-large response', async () => {
    await request(app).post('/api/employees').send({ value: 'x'.repeat(110_000) }).expect(413)
  })
  it('adds security and rate-limit headers to API responses', async () => {
    const response = await request(app).get('/api/employees')

    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers.ratelimit).toBeTruthy()
    expect(response.headers['x-powered-by']).toBeUndefined()
    expect(response.headers['cache-control']).toBe('no-store')
  })

  it('returns health status', async () => {
    const response = await request(app).get('/health').expect(200)

    expect(response.body.ok).toBe(true)
  })

  it('returns health status through the same-origin API prefix', async () => {
    const response = await request(app).get('/api/health').expect(200)

    expect(response.body.ok).toBe(true)
  })

  it('returns sample employees', async () => {
    const response = await request(app).get('/api/employees').expect(200)

    expect(response.body.data).toHaveLength(3)
    expect(response.body.meta.source).toBe('fixture')
  })

  it('returns an employee by id', async () => {
    const response = await request(app).get('/api/employees/emp_001').expect(200)

    expect(response.body.data.fullName).toBe('Aarav Mehta')
  })

  it('returns 404 for missing employees', async () => {
    const response = await request(app).get('/api/employees/missing').expect(404)

    expect(response.body.error).toBe('Employee not found')
  })

  it('returns HR master data in fixture mode', async () => {
    const response = await request(app).get('/api/hr/master-data').expect(200)

    expect(response.body.data.employees).toHaveLength(3)
    expect(response.body.data.departments).toHaveLength(3)
    expect(response.body.data.locations).toHaveLength(3)
    expect(response.body.meta.source).toBe('fixture')
  })

  it('returns leave dashboard in fixture mode', async () => {
    const response = await request(app).get('/api/leave/dashboard').expect(200)

    expect(response.body.data.requests).toEqual([])
    expect(response.body.meta.source).toBe('fixture')
  })

  it('returns attendance dashboard in fixture mode', async () => {
    const response = await request(app)
      .get('/api/attendance/dashboard')
      .query({ periodMonth: '2026-08-01' })
      .expect(200)

    expect(response.body.data.period.month).toBe('2026-08-01')
    expect(response.body.data.summaries).toHaveLength(3)
    expect(response.body.meta.source).toBe('fixture')
  })

  it('returns payroll runs in fixture mode', async () => {
    const response = await request(app).get('/api/payroll/runs').expect(200)

    expect(response.body.data.runs).toEqual([])
    expect(response.body.meta.source).toBe('fixture')
  })

  it('returns payslips in fixture mode', async () => {
    const response = await request(app).get('/api/payroll/payslips').expect(200)

    expect(response.body.data.payslips).toEqual([])
    expect(response.body.meta.source).toBe('fixture')
  })

  it('does not invite users until Supabase Auth is configured', async () => {
    const response = await request(app)
      .post('/api/invitations')
      .send({
        email: 'new.employee@example.com',
        fullName: 'New Employee',
        organizationId: '00000000-0000-0000-0000-000000000001',
        role: 'employee',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase Auth is not configured')
  })

  it('does not create employees until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/employees')
      .send({
        annualCompensation: 840000,
        designation: 'People Operations Associate',
        employeeCode: 'VF-004',
        fullName: 'Demo Employee',
        joiningDate: '2026-07-01',
        location: 'New York',
        organizationId: '00000000-0000-0000-0000-000000000001',
        status: 'draft',
        workEmail: 'demo.employee@example.com',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not create HR master data until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/hr/departments')
      .send({
        name: 'People Ops',
        organizationId: '00000000-0000-0000-0000-000000000001',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not update organization preferences until Supabase is configured', async () => {
    const response = await request(app)
      .patch('/api/hr/organization')
      .send({
        countryCode: 'US',
        currencyCode: 'USD',
        locale: 'en-US',
        name: 'VetanFlow Labs',
        organizationId: '00000000-0000-0000-0000-000000000001',
        timezone: 'America/New_York',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('validates organization locale and timezone before writing', async () => {
    const response = await request(app)
      .patch('/api/hr/organization')
      .send({
        countryCode: 'USA',
        currencyCode: 'US',
        locale: 'not a locale',
        name: 'VetanFlow Labs',
        organizationId: '00000000-0000-0000-0000-000000000001',
        timezone: 'Mars/Olympus',
      })
      .expect(400)

    expect(response.body.error).toBe('Invalid organization settings')
    expect(response.body.details).toBeTruthy()
  })

  it('does not update HR departments until Supabase is configured', async () => {
    const response = await request(app)
      .patch('/api/hr/departments/10000000-0000-0000-0000-000000000001')
      .send({
        isActive: true,
        name: 'People Ops',
        organizationId: '00000000-0000-0000-0000-000000000001',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not archive HR departments until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/hr/departments/10000000-0000-0000-0000-000000000001/archive')
      .send({
        organizationId: '00000000-0000-0000-0000-000000000001',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not update HR locations until Supabase is configured', async () => {
    const response = await request(app)
      .patch('/api/hr/locations/20000000-0000-0000-0000-000000000001')
      .send({
        city: 'New York',
        countryCode: 'US',
        isActive: true,
        name: 'New York HQ',
        organizationId: '00000000-0000-0000-0000-000000000001',
        state: 'West Bengal',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not archive HR locations until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/hr/locations/20000000-0000-0000-0000-000000000001/archive')
      .send({
        organizationId: '00000000-0000-0000-0000-000000000001',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not create HR employees until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/hr/employees')
      .send({
        annualCompensation: 840000,
        code: 'VF-004',
        departmentId: '10000000-0000-0000-0000-000000000001',
        fullName: 'Demo Employee',
        joiningDate: '2026-07-01',
        organizationId: '00000000-0000-0000-0000-000000000001',
        role: 'People Operations Associate',
        status: 'draft',
        workEmail: 'demo.employee@example.com',
        workLocationId: '20000000-0000-0000-0000-000000000001',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not create leave requests until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/leave/requests')
      .send({
        employeeId: '00000000-0000-0000-0000-000000000001',
        endDate: '2026-07-12',
        leaveType: 'casual',
        organizationId: '00000000-0000-0000-0000-000000000001',
        reason: 'Family function',
        startDate: '2026-07-10',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not save attendance entries until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/attendance/entries')
      .send({
        attendanceStatus: 'present',
        employeeId: '00000000-0000-0000-0000-000000000001',
        organizationId: '00000000-0000-0000-0000-000000000001',
        workDate: '2026-07-20',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not save holidays until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/attendance/holidays')
      .send({
        holidayDate: '2026-07-21',
        name: 'Company holiday',
        organizationId: '00000000-0000-0000-0000-000000000001',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not lock attendance months until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/attendance/month-locks')
      .send({
        organizationId: '00000000-0000-0000-0000-000000000001',
        periodMonth: '2026-07-01',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not create payroll runs until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/payroll/runs')
      .send({
        organizationId: '00000000-0000-0000-0000-000000000001',
        periodMonth: '2026-07-01',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not export payroll reports until Supabase is configured', async () => {
    const response = await request(app)
      .get('/api/payroll/runs/00000000-0000-0000-0000-000000000001/exports/bank')
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not create payroll adjustments until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/payroll/runs/00000000-0000-0000-0000-000000000001/adjustments')
      .send({
        amount: 1500,
        componentCode: 'BONUS',
        componentName: 'Performance bonus',
        componentType: 'earning',
        employeeId: '00000000-0000-0000-0000-000000000001',
        taxTreatment: 'taxable',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not delete payroll adjustments until Supabase is configured', async () => {
    const response = await request(app)
      .delete(
        '/api/payroll/runs/00000000-0000-0000-0000-000000000001/adjustments/00000000-0000-0000-0000-000000000002',
      )
      .send({})
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not submit payroll runs until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/payroll/runs/00000000-0000-0000-0000-000000000001/submit')
      .send({})
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not approve payroll runs until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/payroll/runs/00000000-0000-0000-0000-000000000001/approve')
      .send({})
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not finalize payroll runs until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/payroll/runs/00000000-0000-0000-0000-000000000001/finalize')
      .send({})
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not generate payslips until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/payroll/runs/00000000-0000-0000-0000-000000000001/payslips')
      .send({})
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('does not prepare payslip downloads until Supabase is configured', async () => {
    const response = await request(app)
      .get('/api/payroll/payslips/00000000-0000-0000-0000-000000000001/download')
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })

  it('validates leave review ids before writing', async () => {
    const response = await request(app)
      .patch('/api/leave/requests/not-a-uuid/review')
      .send({})
      .expect(400)

    expect(response.body.error).toBe('Invalid leave request id')
  })

  it('validates attendance entry ids before writing', async () => {
    const response = await request(app)
      .post('/api/attendance/entries')
      .send({
        employeeId: 'not-a-uuid',
        organizationId: '00000000-0000-0000-0000-000000000001',
        workDate: '2026-07-20',
      })
      .expect(400)

    expect(response.body.error).toBe('Invalid attendance entry input')
  })

  it('validates payroll run ids before recalculating', async () => {
    const response = await request(app)
      .post('/api/payroll/runs/not-a-uuid/recalculate')
      .send({})
      .expect(400)

    expect(response.body.error).toBe('Invalid payroll run id')
  })

  it('validates payroll export types', async () => {
    const response = await request(app)
      .get('/api/payroll/runs/00000000-0000-0000-0000-000000000001/exports/unknown')
      .expect(400)

    expect(response.body.error).toBe('Invalid payroll export type')
  })

  it('validates payroll adjustment input before writing', async () => {
    const response = await request(app)
      .post('/api/payroll/runs/00000000-0000-0000-0000-000000000001/adjustments')
      .send({
        amount: -100,
        componentCode: 'bad code',
        componentName: '',
        componentType: 'earning',
        employeeId: 'not-a-uuid',
      })
      .expect(400)

    expect(response.body.error).toBe('Invalid payroll adjustment input')
  })

  it('validates payroll adjustment ids before deleting', async () => {
    const response = await request(app)
      .delete('/api/payroll/runs/00000000-0000-0000-0000-000000000001/adjustments/not-a-uuid')
      .send({})
      .expect(400)

    expect(response.body.error).toBe('Invalid payroll adjustment id')
  })

  it('validates payroll run ids before approval actions', async () => {
    const response = await request(app)
      .post('/api/payroll/runs/not-a-uuid/approve')
      .send({})
      .expect(400)

    expect(response.body.error).toBe('Invalid payroll run id')
  })

  it('validates payroll run ids before generating payslips', async () => {
    const response = await request(app)
      .post('/api/payroll/runs/not-a-uuid/payslips')
      .send({})
      .expect(400)

    expect(response.body.error).toBe('Invalid payroll run id')
  })

  it('validates payslip ids before download', async () => {
    const response = await request(app)
      .get('/api/payroll/payslips/not-a-uuid/download')
      .expect(400)

    expect(response.body.error).toBe('Invalid payslip id')
  })

  it('validates HR employee updates before writing', async () => {
    const response = await request(app)
      .patch('/api/hr/employees/not-a-uuid')
      .send({})
      .expect(400)

    expect(response.body.error).toBe('Invalid employee id')
  })

  it('validates HR employee photo ids before uploading', async () => {
    const response = await request(app)
      .post('/api/hr/employees/not-a-uuid/photo')
      .attach('photo', Buffer.from('fake image'), {
        contentType: 'image/png',
        filename: 'photo.png',
      })
      .expect(400)

    expect(response.body.error).toBe('Invalid employee id')
  })

  it('validates employee IDs before generating ID cards', async () => {
    const response = await request(app).get('/api/hr/employees/not-a-uuid/id-card').expect(400)

    expect(response.body.error).toBe('Invalid employee id')
  })

  it('does not generate employee ID cards until Supabase is configured', async () => {
    const response = await request(app)
      .get('/api/hr/employees/00000000-0000-0000-0000-000000000001/id-card')
      .expect(501)

    expect(response.body.error).toBe('Supabase document service is not configured')
  })

  it('does not upload employee photos until Supabase is configured', async () => {
    const response = await request(app)
      .post('/api/hr/employees/00000000-0000-0000-0000-000000000001/photo')
      .attach('photo', Buffer.from('fake image'), {
        contentType: 'image/png',
        filename: 'photo.png',
      })
      .expect(501)

    expect(response.body.error).toBe('Supabase service role is not configured')
  })
})
