import {
  PDFDocument,
  StandardFonts,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  rgb,
} from 'pdf-lib'
import { createSupabaseUserClient, getSupabaseServiceClient } from '../../lib/supabase.js'

type EmployeeIdCardRow = {
  departments: { name: string } | Array<{ name: string }> | null
  designation: string
  employee_code: string
  full_name: string
  id: string
  joining_date: string
  location: string
  organization_id: string
  organizations: { locale: string; name: string } | Array<{ locale: string; name: string }> | null
  photo_path: string | null
  status: string
  work_email: string | null
}

type EmployeeIdCardPdfInput = {
  department: string
  designation: string
  employeeCode: string
  employeeId: string
  fullName: string
  joiningDate: string
  locale?: string
  location: string
  organizationName: string
  photo?: {
    bytes: Uint8Array
    mimeType: string
  } | null
  status: string
  workEmail: string | null
}

export type EmployeeIdCardDocument = {
  filename: string
  pdf: Buffer
}

type EmployeeIdCardResult =
  | { data: EmployeeIdCardDocument; status: 'ok' }
  | { status: 'not_configured' }
  | { status: 'not_found' }

const pointsPerMillimeter = 72 / 25.4
const cardWidth = 85.6 * pointsPerMillimeter
const cardHeight = 53.98 * pointsPerMillimeter
const navy = rgb(10 / 255, 41 / 255, 71 / 255)
const navySoft = rgb(24 / 255, 62 / 255, 94 / 255)
const blue = rgb(37 / 255, 99 / 255, 235 / 255)
const cyan = rgb(49 / 255, 174 / 255, 227 / 255)
const green = rgb(22 / 255, 138 / 255, 88 / 255)
const greenSoft = rgb(231 / 255, 251 / 255, 243 / 255)
const white = rgb(1, 1, 1)
const paper = rgb(248 / 255, 250 / 255, 252 / 255)
const border = rgb(215 / 255, 227 / 255, 238 / 255)
const muted = rgb(89 / 255, 113 / 255, 133 / 255)

function firstRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value
}

function safeText(value: string | null | undefined) {
  return String(value ?? '').replace(/[^\x20-\x7E]/g, ' ').trim()
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00.000Z`))
}

function getInitials(name: string) {
  return safeText(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'VF'
}

function fitText(font: PDFFont, value: string, maxWidth: number, preferredSize: number, minimumSize = 5) {
  let text = safeText(value)
  let size = preferredSize

  while (size > minimumSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5
  }

  while (text.length > 1 && font.widthOfTextAtSize(text, size) > maxWidth) {
    text = `${text.slice(0, -4).trimEnd()}...`
  }

  return { size, text }
}

function drawFittedText(
  page: PDFPage,
  font: PDFFont,
  value: string,
  options: {
    color?: ReturnType<typeof rgb>
    maxWidth: number
    minimumSize?: number
    preferredSize: number
    x: number
    y: number
  },
) {
  const fitted = fitText(font, value, options.maxWidth, options.preferredSize, options.minimumSize)
  page.drawText(fitted.text, {
    color: options.color ?? navy,
    font,
    size: fitted.size,
    x: options.x,
    y: options.y,
  })
}

function drawField(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont },
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  page.drawText(label.toUpperCase(), { color: muted, font: fonts.bold, size: 4.5, x, y })
  drawFittedText(page, fonts.bold, value, {
    color: navy,
    maxWidth,
    preferredSize: 6.2,
    x,
    y: y - 10,
  })
}

async function embedPhoto(pdf: PDFDocument, photo: EmployeeIdCardPdfInput['photo']) {
  if (!photo) {
    return null
  }

  try {
    if (photo.mimeType === 'image/png') {
      return await pdf.embedPng(photo.bytes)
    }

    if (photo.mimeType === 'image/jpeg' || photo.mimeType === 'image/jpg') {
      return await pdf.embedJpg(photo.bytes)
    }
  } catch {
    return null
  }

  return null
}

function drawPhoto(page: PDFPage, photo: PDFImage | null, initials: string, bold: PDFFont) {
  const x = 14
  const y = 44
  const width = 42
  const height = 57

  page.drawRectangle({ borderColor: white, borderWidth: 1.5, color: navySoft, height, width, x, y })

  if (photo) {
    page.drawImage(photo, { height: height - 4, width: width - 4, x: x + 2, y: y + 2 })
    return
  }

  const size = 13
  const initialsWidth = bold.widthOfTextAtSize(initials, size)
  page.drawText(initials, {
    color: white,
    font: bold,
    size,
    x: x + (width - initialsWidth) / 2,
    y: y + 22,
  })
}

function drawVerificationMark(page: PDFPage, bold: PDFFont, employeeId: string) {
  page.drawRectangle({ color: navySoft, height: 66, width: 67, x: 160, y: 31 })
  page.drawCircle({ borderColor: cyan, borderWidth: 1.2, color: navy, size: 14, x: 193.5, y: 76 })
  page.drawText('VF', { color: white, font: bold, size: 8, x: 187.5, y: 73 })
  page.drawText('VERIFIED RECORD', { color: white, font: bold, size: 5, x: 171, y: 56 })
  page.drawText(employeeId.slice(-8).toUpperCase(), { color: cyan, font: bold, size: 5.5, x: 177, y: 47 })

  const bars = [2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1]
  let cursor = 170
  for (const barWidth of bars) {
    page.drawRectangle({ color: white, height: 8, width: barWidth * 0.6, x: cursor, y: 34 })
    cursor += barWidth * 0.6 + 1.3
  }
}

export async function buildEmployeeIdCardPdf(input: EmployeeIdCardPdfInput) {
  const pdf = await PDFDocument.create()
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const photo = await embedPhoto(pdf, input.photo)
  const initials = getInitials(input.fullName)
  const status = formatLabel(input.status)
  const verificationCode = `VF-${safeText(input.employeeCode)}-${input.employeeId.slice(-6).toUpperCase()}`

  pdf.setTitle(`${safeText(input.fullName)} employee ID card`)
  pdf.setAuthor('VetanFlow')
  pdf.setSubject('Digital employee identification card')
  pdf.setKeywords(['employee ID', 'VetanFlow', safeText(input.employeeCode)])
  pdf.setCreator('VetanFlow')
  pdf.setProducer('VetanFlow document service')

  const front = pdf.addPage([cardWidth, cardHeight])
  front.drawRectangle({ color: paper, height: cardHeight, width: cardWidth, x: 0, y: 0 })
  front.drawRectangle({ color: navy, height: cardHeight, width: 68, x: 0, y: 0 })
  front.drawRectangle({ color: blue, height: 5, width: cardWidth, x: 0, y: cardHeight - 5 })
  front.drawCircle({ color: cyan, opacity: 0.14, size: 48, x: cardWidth - 7, y: cardHeight - 5 })
  front.drawCircle({ color: blue, opacity: 0.09, size: 34, x: cardWidth - 31, y: 1 })
  front.drawText('VETANFLOW', { color: blue, font: bold, size: 8.5, x: 82, y: 132 })
  front.drawText('DIGITAL EMPLOYEE ID', { color: muted, font: bold, size: 4.5, x: 82, y: 121 })
  drawPhoto(front, photo, initials, bold)
  drawFittedText(front, bold, input.fullName, {
    maxWidth: 144,
    preferredSize: 13,
    x: 82,
    y: 96,
  })
  drawFittedText(front, regular, input.designation, {
    color: muted,
    maxWidth: 132,
    preferredSize: 6.5,
    x: 82,
    y: 84,
  })
  front.drawRectangle({ color: navy, height: 18, width: 78, x: 82, y: 56 })
  front.drawText('EMPLOYEE CODE', { color: cyan, font: bold, size: 4, x: 89, y: 67 })
  drawFittedText(front, bold, input.employeeCode, {
    color: white,
    maxWidth: 64,
    preferredSize: 7.5,
    x: 89,
    y: 59,
  })
  front.drawRectangle({ color: greenSoft, height: 18, width: 57, x: 169, y: 56 })
  front.drawCircle({ color: green, size: 2.5, x: 178, y: 65 })
  drawFittedText(front, bold, status, {
    color: green,
    maxWidth: 39,
    preferredSize: 5.5,
    x: 185,
    y: 62.5,
  })
  drawField(front, { bold, regular }, 'Department', input.department, 82, 43, 64)
  drawField(front, { bold, regular }, 'Location', input.location, 160, 43, 66)
  front.drawRectangle({ color: navy, height: 12, width: cardWidth, x: 0, y: 0 })
  front.drawText('AUTHORIZED ORGANIZATION ID', { color: white, font: bold, size: 4, x: 14, y: 4.5 })
  drawFittedText(front, bold, input.organizationName, {
    color: white,
    maxWidth: 112,
    preferredSize: 5,
    x: 114,
    y: 4.2,
  })

  const back = pdf.addPage([cardWidth, cardHeight])
  back.drawRectangle({ color: white, height: cardHeight, width: cardWidth, x: 0, y: 0 })
  back.drawRectangle({ color: navy, height: 34, width: cardWidth, x: 0, y: cardHeight - 34 })
  back.drawRectangle({ color: cyan, height: 3, width: 48, x: 14, y: cardHeight - 3 })
  back.drawText('VETANFLOW', { color: white, font: bold, size: 8, x: 14, y: 132 })
  back.drawText('IDENTITY & VERIFICATION', { color: cyan, font: bold, size: 4.5, x: 14, y: 122 })
  drawFittedText(back, bold, input.organizationName, {
    color: white,
    maxWidth: 105,
    preferredSize: 5.5,
    x: 122,
    y: 130,
  })
  drawField(back, { bold, regular }, 'Work email', input.workEmail ?? 'Not provided', 14, 103, 130)
  drawField(back, { bold, regular }, 'Department', input.department, 14, 79, 64)
  drawField(back, { bold, regular }, 'Location', input.location, 86, 79, 60)
  drawField(back, { bold, regular }, 'Joined', formatDate(input.joiningDate, input.locale ?? 'en-US'), 14, 54, 64)
  drawField(back, { bold, regular }, 'Status', status, 86, 54, 60)
  drawVerificationMark(back, bold, input.employeeId)
  back.drawRectangle({ borderColor: border, borderWidth: 0.7, height: 17, width: 132, x: 14, y: 20 })
  back.drawText('VERIFICATION CODE', { color: muted, font: bold, size: 4, x: 20, y: 30 })
  drawFittedText(back, bold, verificationCode, {
    color: navy,
    maxWidth: 116,
    preferredSize: 6,
    x: 20,
    y: 22.5,
  })
  back.drawRectangle({ color: navy, height: 12, width: cardWidth, x: 0, y: 0 })
  back.drawText('This card remains the property of the issuing organization.', {
    color: white,
    font: regular,
    size: 4.3,
    x: 14,
    y: 4.5,
  })
  back.drawText('vetanflow', { color: cyan, font: bold, size: 4.5, x: 207, y: 4.5 })

  return Buffer.from(await pdf.save())
}

function getPhotoMimeType(path: string, reportedType: string) {
  if (reportedType === 'image/png' || path.toLowerCase().endsWith('.png')) {
    return 'image/png'
  }

  if (
    reportedType === 'image/jpeg' ||
    reportedType === 'image/jpg' ||
    path.toLowerCase().endsWith('.jpg') ||
    path.toLowerCase().endsWith('.jpeg')
  ) {
    return 'image/jpeg'
  }

  return reportedType
}

export async function getEmployeeIdCardDocument(
  employeeId: string,
  accessToken: string | undefined,
  actorUserId: string | undefined,
): Promise<EmployeeIdCardResult> {
  const userClient = accessToken ? createSupabaseUserClient(accessToken) : null
  const serviceClient = getSupabaseServiceClient()

  if (!userClient || !serviceClient || !actorUserId) {
    return { status: 'not_configured' }
  }

  const result = await userClient
    .from('employees')
    .select(`
      id,
      organization_id,
      employee_code,
      full_name,
      work_email,
      designation,
      location,
      joining_date,
      status,
      photo_path,
      departments(name),
      organizations(name, locale)
    `)
    .eq('id', employeeId)
    .maybeSingle()

  if (result.error) {
    throw result.error
  }

  const employee = result.data as EmployeeIdCardRow | null

  if (!employee) {
    return { status: 'not_found' }
  }

  let photo: EmployeeIdCardPdfInput['photo'] = null

  if (employee.photo_path) {
    const photoResult = await serviceClient.storage.from('employee-photos').download(employee.photo_path)

    if (!photoResult.error && photoResult.data) {
      photo = {
        bytes: new Uint8Array(await photoResult.data.arrayBuffer()),
        mimeType: getPhotoMimeType(employee.photo_path, photoResult.data.type),
      }
    }
  }

  const department = firstRelation(employee.departments)?.name ?? 'Unassigned'
  const organization = firstRelation(employee.organizations)
  const organizationName = organization?.name ?? 'Organization'
  const pdf = await buildEmployeeIdCardPdf({
    department,
    designation: employee.designation,
    employeeCode: employee.employee_code,
    employeeId: employee.id,
    fullName: employee.full_name,
    joiningDate: employee.joining_date,
    location: employee.location,
    locale: organization?.locale ?? 'en-US',
    organizationName,
    photo,
    status: employee.status,
    workEmail: employee.work_email,
  })
  const auditResult = await serviceClient.from('audit_logs').insert({
    action: 'employee_id_card_downloaded',
    actor_id: actorUserId,
    entity_id: employee.id,
    entity_type: 'employee',
    metadata: { employee_code: employee.employee_code },
    organization_id: employee.organization_id,
  })

  if (auditResult.error) {
    throw auditResult.error
  }

  return {
    data: {
      filename: `${safeText(employee.employee_code).replace(/[^A-Za-z0-9_-]/g, '-')}-id-card.pdf`,
      pdf,
    },
    status: 'ok',
  }
}
