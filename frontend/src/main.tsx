import './instrument.ts'
import * as Sentry from '@sentry/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <main className="grid min-h-dvh place-items-center bg-[var(--vf-surface)] px-4 text-[var(--vf-navy)]">
          <section className="w-full max-w-md rounded-lg border border-[color:var(--vf-border)] bg-white p-6 text-center shadow-lg">
            <h1 className="text-xl font-semibold">Workspace could not be displayed</h1>
            <p className="mt-2 text-sm text-slate-500">The error was recorded. You can safely reload the workspace.</p>
            <button className="mt-6 min-h-11 rounded-lg bg-[var(--vf-primary)] px-4 text-sm font-semibold text-white" onClick={resetError} type="button">
              Reload workspace
            </button>
          </section>
        </main>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
