import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { requireAuth } from '../modules/auth/auth-middleware.js'
import { EmployeeAccountLinkError } from '../modules/auth/employee-account-link.js'
import {
  invitationSchema,
  inviteUser,
  listOrganizationMembers,
} from '../modules/invitations/invitation-service.js'

export const invitationsRouter = Router()
const invitationRateLimiter = rateLimit({
  legacyHeaders: false,
  limit: 10,
  message: { error: 'Too many invitation attempts. Try again later.' },
  standardHeaders: 'draft-8',
  windowMs: 60 * 60 * 1000,
})

invitationsRouter.get('/', requireAuth, async (_, res) => {
  if (!res.locals.auth) {
    res.status(501).json({ error: 'Supabase Auth is not configured' })
    return
  }

  try {
    const result = await listOrganizationMembers(res.locals.auth.userId)

    if (result.status === 'not_configured') {
      res.status(501).json({ error: 'Supabase service role is not configured' })
      return
    }

    if (result.status === 'forbidden') {
      res.status(403).json({ error: 'You do not have permission to manage access' })
      return
    }

    res.json({ data: result.data })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Unable to load organization members' })
  }
})

invitationsRouter.post('/', invitationRateLimiter, requireAuth, async (req, res) => {
  if (!res.locals.auth) {
    res.status(501).json({ error: 'Supabase Auth is not configured' })
    return
  }

  const parsed = invitationSchema.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid invitation input', details: parsed.error.flatten() })
    return
  }

  try {
    const result = await inviteUser(res.locals.auth.userId, parsed.data)

    if (result.status === 'not_configured') {
      res.status(501).json({ error: 'Supabase service role is not configured' })
      return
    }

    if (result.status === 'forbidden') {
      res.status(403).json({ error: 'You do not have permission to invite users' })
      return
    }

    res.status(201).json({ data: result.data })
  } catch (error) {
    console.error(error)
    if (error instanceof EmployeeAccountLinkError) {
      res.status(error.statusCode).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Unable to invite user' })
  }
})
