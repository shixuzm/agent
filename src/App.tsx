import { lazy, Suspense } from 'react';
import AuthGuard from './components/AuthGuard';
import CloudLandingPage from './components/CloudLandingPage';
import { I18nProvider, LangToggle } from './i18n';

const AppInner = import.meta.env.VITE_APP_MODE === 'cloud'
  ? undefined
  : lazy(() => import('./AppInner'));

export default function App() {
  return (
    <I18nProvider>
      <LangToggle />
      <AuthGuard>
        {import.meta.env.VITE_APP_MODE === 'cloud' ? (
          <CloudLandingPage />
        ) : (
          <Suspense fallback={<div>Loading...</div>}>
            {AppInner ? <AppInner /> : null}
          </Suspense>
        )}
      </AuthGuard>
    </I18nProvider>
  );
}
