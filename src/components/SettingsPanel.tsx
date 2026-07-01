import { useEffect, useState } from 'react';
import styles from './SettingsPanel.module.css';
import {
  getAppConfig,
  setAppConfig,
  clearAppConfig,
  hasAppConfig,
  type AppConfig,
} from '../lib/appConfig';
import { useT } from '../i18n';

const DEFAULT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const DEFAULT_MODEL = '@makers/deepseek-v4-flash';

interface SettingsPanelProps {
  onClose: () => void;
  /** When true, show a "first-run" hint banner at the top. */
  firstRun?: boolean;
}

export function SettingsPanel({ onClose, firstRun }: SettingsPanelProps) {
  const { t } = useT();

  const [aiGatewayApiKey, setAiGatewayApiKey] = useState('');
  const [aiGatewayBaseUrl, setAiGatewayBaseUrl] = useState(DEFAULT_BASE_URL);
  const [aiGatewayModel, setAiGatewayModel] = useState(DEFAULT_MODEL);
  const [dsparkEndpoint, setDsparkEndpoint] = useState('');
  const [dsparkApiKey, setDsparkApiKey] = useState('');
  const [dsparkDefaultCluster, setDsparkDefaultCluster] = useState('');

  const [status, setStatus] = useState<{ kind: 'ok' | 'warn' | null; text: string }>({ kind: null, text: '' });

  // Hydrate the form from localStorage on mount.
  useEffect(() => {
    const config = getAppConfig();
    if (!config) return;
    setAiGatewayApiKey(config.aiGatewayApiKey);
    setAiGatewayBaseUrl(config.aiGatewayBaseUrl || DEFAULT_BASE_URL);
    setAiGatewayModel(config.aiGatewayModel || DEFAULT_MODEL);
    setDsparkEndpoint(config.dsparkEndpoint);
    setDsparkApiKey(config.dsparkApiKey);
    setDsparkDefaultCluster(config.dsparkDefaultCluster);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config: AppConfig = {
      aiGatewayApiKey: aiGatewayApiKey.trim(),
      aiGatewayBaseUrl: aiGatewayBaseUrl.trim() || DEFAULT_BASE_URL,
      aiGatewayModel: aiGatewayModel.trim() || DEFAULT_MODEL,
      dsparkEndpoint: dsparkEndpoint.trim(),
      dsparkApiKey: dsparkApiKey.trim(),
      dsparkDefaultCluster: dsparkDefaultCluster.trim(),
    };
    setAppConfig(config);
    setStatus({
      kind: config.aiGatewayApiKey ? 'ok' : 'warn',
      text: config.aiGatewayApiKey
        ? t('settings.saved')
        : t('settings.closeUnconfiguredHint'),
    });
  };

  const handleClear = () => {
    clearAppConfig();
    setAiGatewayApiKey('');
    setAiGatewayBaseUrl(DEFAULT_BASE_URL);
    setAiGatewayModel(DEFAULT_MODEL);
    setDsparkEndpoint('');
    setDsparkApiKey('');
    setDsparkDefaultCluster('');
    setStatus({ kind: 'warn', text: t('settings.cleared') });
  };

  const handleClose = () => {
    // Per Task 5: don't block closing, but warn if still unconfigured.
    if (!hasAppConfig()) {
      // Best-effort notice — non-blocking.
      setStatus({ kind: 'warn', text: t('settings.closeUnconfiguredHint') });
    }
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{t('settings.title')}</h3>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {firstRun && (
          <p className={styles.hint}>{t('settings.firstRunHint')}</p>
        )}

        <div className={styles.body}>
          <form className={styles.form} onSubmit={handleSave}>
            <label>
              <span>{t('settings.apiKey')}</span>
              <input
                type="password"
                value={aiGatewayApiKey}
                onChange={(e) => setAiGatewayApiKey(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label>
              <span>{t('settings.baseUrl')}</span>
              <input
                type="text"
                value={aiGatewayBaseUrl}
                onChange={(e) => setAiGatewayBaseUrl(e.target.value)}
                placeholder={DEFAULT_BASE_URL}
              />
            </label>
            <label>
              <span>{t('settings.model')}</span>
              <input
                type="text"
                value={aiGatewayModel}
                onChange={(e) => setAiGatewayModel(e.target.value)}
                placeholder={DEFAULT_MODEL}
              />
            </label>

            <p className={styles.optional}>DSpark (optional)</p>

            <label>
              <span>{t('settings.dsparkEndpoint')}</span>
              <input
                type="text"
                value={dsparkEndpoint}
                onChange={(e) => setDsparkEndpoint(e.target.value)}
              />
            </label>
            <label>
              <span>{t('settings.dsparkApiKey')}</span>
              <input
                type="password"
                value={dsparkApiKey}
                onChange={(e) => setDsparkApiKey(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label>
              <span>{t('settings.dsparkCluster')}</span>
              <input
                type="text"
                value={dsparkDefaultCluster}
                onChange={(e) => setDsparkDefaultCluster(e.target.value)}
              />
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={handleClear}
              >
                {t('settings.clear')}
              </button>
              <div className={styles.actionsRight}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handleClose}
                >
                  {t('settings.cancel')}
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  {t('settings.save')}
                </button>
              </div>
            </div>

            {status.kind && (
              <div
                className={`${styles.status} ${
                  status.kind === 'ok' ? styles.statusOk : styles.statusWarn
                }`}
              >
                {status.text}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
