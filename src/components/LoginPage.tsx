import { useState, useCallback, KeyboardEvent } from 'react';
import { useT } from '../i18n';
import styles from './LoginPage.module.css';

interface Props {
  onLogin: (username: string, token: string) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const { t } = useT();
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = useCallback(() => {
    const trimmedUsername = username.trim();
    const trimmedToken = token.trim();

    if (!trimmedUsername || !trimmedToken) {
      setError(true);
      return;
    }

    setError(false);
    onLogin(trimmedUsername, trimmedToken);
  }, [username, token, onLogin]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.logo}>⬡</div>
        <h1 className={styles.title}>{t('login.title')}</h1>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-username">
            {t('login.username')}
          </label>
          <input
            id="login-username"
            className={styles.input}
            type="text"
            autoComplete="username"
            placeholder={t('login.usernamePlaceholder')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-token">
            {t('login.token')}
          </label>
          <input
            id="login-token"
            className={styles.input}
            type="password"
            autoComplete="current-password"
            placeholder={t('login.tokenPlaceholder')}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {error && <p className={styles.error}>{t('login.error.empty')}</p>}

        <button className={styles.submitBtn} onClick={handleSubmit}>
          {t('login.submit')}
        </button>
      </div>
    </div>
  );
}
