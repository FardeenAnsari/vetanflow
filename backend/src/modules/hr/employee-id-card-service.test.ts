import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { buildEmployeeIdCardPdf } from './employee-id-card-service.js'

describe('buildEmployeeIdCardPdf', () => {
  it('creates a two-sided standard-size employee card', async () => {
    const bytes = await buildEmployeeIdCardPdf({
      department: 'Engineering',
      designation: 'Product Engineer',
      employeeCode: 'VF-006',
      employeeId: '40000000-0000-0000-0000-000000000006',
      fullName: 'Noah Williams',
      joiningDate: '2025-06-15',
      location: 'Seattle',
      organizationName: 'VetanFlow Labs',
      status: 'active',
      workEmail: 'employee.demo@vetanflow.example.com',
    })
    const pdf = await PDFDocument.load(bytes)

    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdf.getPageCount()).toBe(2)

    for (const page of pdf.getPages()) {
      expect(page.getWidth()).toBeCloseTo(242.65, 1)
      expect(page.getHeight()).toBeCloseTo(153.01, 1)
    }
  })
})
