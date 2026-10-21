import { lazy, Suspense } from 'react'
import { BrandLogo } from './components/BrandLogo'

const WorkspaceApp = lazy(() => import('./WorkspaceApp'))
const DemoAccessPage = lazy(() => import('./demo/DemoAccessPage'))
const PublicSite = lazy(() =>
  import('./public-site/PublicSite').then((module) => ({ default: module.PublicSite })),
)

export default function App() {
  const path = window.location.pathname
  return (
    <Suspense
      fallback={
        <main aria-busy="true" className="grid min-h-dvh place-items-center bg-[var(--vf-surface)]">
          <div className="text-center">
            <BrandLogo />
            <p className="mt-4 text-sm text-[var(--vf-text-muted)]" role="status">
              Opening VetanFlow
            </p>
          </div>
        </main>
      }
    >
      {path === '/demo' ? (
        <DemoAccessPage />
      ) : path.startsWith('/login') ? (
        <WorkspaceApp forceAccountChoice />
      ) : path.startsWith('/app') ? (
        <WorkspaceApp />
      ) : (
        <PublicSite />
      )}
    </Suspense>
  )
}
