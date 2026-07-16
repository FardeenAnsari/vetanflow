import { Router } from 'express'
import { requireAuth } from '../modules/auth/auth-middleware.js'
import { invitationSchema, inviteUser } from '../modules/invitations/invitation-service.js'

export const invitationsRouter = Router()

invitationsRouter.post('/', requireAuth, async (req, res) => {
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
    res.status(500).json({ error: 'Unable to invite user' })
  }
})
