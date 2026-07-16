import 'dotenv/config'
import './instrument.js'
import { createApp } from './app.js'
import { env } from './config/env.js'

const app = createApp()

app.listen(env.port, () => {
  console.log(`Payroll API listening on http://localhost:${env.port}`)
})
