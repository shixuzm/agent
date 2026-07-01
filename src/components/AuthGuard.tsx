import { useState, useEffect, useCallback } from 'react';
import { saveAuth, clearAuth, isAuthenticated } from '../lib/auth';
import { useT } from '../i18n';
import LoginPage from './LoginPage';
import styles from './AuthGuard.module.css';

interface Props {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const { t } = useT();
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setReady(true);
  }, []);

  const handleLogin = useCallback((username: string, token: string) => {
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
    saveAuth({
      userId: crypto.randomUUID(),
      username,
      token,
      expiresAt,
    });
    setAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    clearAuth();
    setAuthenticated(false);
  }, []);

  if (!ready) {
    return null;
  }

  if (!authenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <>
      {children}
      <button className={styles.logoutBtn} onClick={handleLogout}>
        {t('login.logout')}
      </button>
    </>
  );
}
