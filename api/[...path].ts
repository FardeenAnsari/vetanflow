import type { Request, Response } from 'express'

type VetanFlowApp = ReturnType<(typeof import('../backend/src/app.js'))['createApp']>

let appPromise: Promise<VetanFlowApp> | undefined

function getApp() {
  appPromise ??= Promise.all([
    import('../backend/src/instrument.js'),
    import('../backend/src/app.js'),
  ]).then(([, { createApp }]) => createApp())

  return appPromise
}

export default async function handler(request: Request, response: Response) {
  try {
    const app = await getApp()
    app(request, response)
  } catch (error) {
    appPromise = undefined
    console.error('VetanFlow API initialization failed', error)

    if (!response.headersSent) {
      response.status(500).json({ error: 'Internal server error' })
    }
  }
}
