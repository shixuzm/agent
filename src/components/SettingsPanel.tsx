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

interface MemoryStats {
  total: number;
  byType: Record<'project' | 'note' | 'task' | 'checkpoint' | 'generic', number>;
  sizeBytes: number;
}

async function getMemoryStats(): Promise<MemoryStats | null> {
  if (window.electronAPI?.getMemoryStats) {
    return window.electronAPI.getMemoryStats();
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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
  const [activeTab, setActiveTab] = useState<'general' | 'memory' | 'context'>('general');

  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(false);
  const [isElectron, setIsElectron] = useState<boolean>(false);

  // Context management settings
  const [contextWindow, setContextWindow] = useState<number>(32000);
  const [checkpointThreshold, setCheckpointThreshold] = useState<number>(0.55);
  const [rebuildThreshold, setRebuildThreshold] = useState<number>(0.80);
  const [recentMessagesRatio, setRecentMessagesRatio] = useState<number>(0.45);
  const [memoryRatio, setMemoryRatio] = useState<number>(0.10);
  const [taskProgressRatio, setTaskProgressRatio] = useState<number>(0.10);

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
    setContextWindow(config.contextWindow ?? 32000);
    setCheckpointThreshold(config.checkpointThreshold ?? 0.55);
    setRebuildThreshold(config.rebuildThreshold ?? 0.80);
    setRecentMessagesRatio(config.recentMessagesRatio ?? 0.45);
    setMemoryRatio(config.memoryRatio ?? 0.10);
    setTaskProgressRatio(config.taskProgressRatio ?? 0.10);
  }, []);

  // Load memory stats on mount and when switching to the memory tab.
  useEffect(() => {
    const electronAvailable = typeof window !== 'undefined' && !!window.electronAPI?.getMemoryStats;
    setIsElectron(electronAvailable);

    if (!electronAvailable) {
      setMemoryEnabled(false);
      setMemoryStats(null);
      return;
    }

    getMemoryStats().then((stats) => {
      setMemoryStats(stats);
      setMemoryEnabled(!!stats);
    }).catch(() => {
      setMemoryStats(null);
      setMemoryEnabled(false);
    });
  }, [activeTab]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config: AppConfig = {
      aiGatewayApiKey: aiGatewayApiKey.trim(),
      aiGatewayBaseUrl: aiGatewayBaseUrl.trim() || DEFAULT_BASE_URL,
      aiGatewayModel: aiGatewayModel.trim() || DEFAULT_MODEL,
      dsparkEndpoint: dsparkEndpoint.trim(),
      dsparkApiKey: dsparkApiKey.trim(),
      dsparkDefaultCluster: dsparkDefaultCluster.trim(),
      contextWindow: Math.max(1024, contextWindow),
      checkpointThreshold: clamp(checkpointThreshold, 0, 1),
      rebuildThreshold: clamp(rebuildThreshold, 0, 1),
      recentMessagesRatio: clamp(recentMessagesRatio, 0, 1),
      memoryRatio: clamp(memoryRatio, 0, 1),
      taskProgressRatio: clamp(taskProgressRatio, 0, 1),
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
    setContextWindow(32000);
    setCheckpointThreshold(0.55);
    setRebuildThreshold(0.80);
    setRecentMessagesRatio(0.45);
    setMemoryRatio(0.10);
    setTaskProgressRatio(0.10);
    setStatus({ kind: 'warn', text: t('settings.cleared') });
  };

  const handleClearMemories = async () => {
    if (!window.confirm(t('settings.memory.clearConfirm'))) return;
    try {
      const ok = await window.electronAPI?.clearAllMemories();
      if (ok) {
        setStatus({ kind: 'ok', text: t('settings.memory.clearSuccess') });
      } else {
        setStatus({ kind: 'warn', text: t('settings.memory.disabled') });
      }
      const stats = await getMemoryStats();
      setMemoryStats(stats);
      setMemoryEnabled(!!stats);
    } catch (e) {
      setStatus({ kind: 'warn', text: e instanceof Error ? e.message : String(e) });
    }
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

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'general' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('general')}
          >
            {t('settings.title')}
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'memory' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('memory')}
          >
            {t('settings.memory.title')}
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'context' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('context')}
          >
            {t('settings.context.title')}
          </button>
        </div>

        <div className={styles.body}>
          {activeTab === 'general' && (
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
            </form>
          )}

          {activeTab === 'memory' && (
            <div className={styles.memoryPanel}>
              <div className={styles.memoryStatus}>
                <span
                  className={`${styles.memoryIndicator} ${
                    memoryEnabled ? styles.memoryIndicatorOn : styles.memoryIndicatorOff
                  }`}
                />
                <span>
                  {memoryEnabled
                    ? t('settings.memory.enabled')
                    : t('settings.memory.disabled')}
                </span>
              </div>

              {!isElectron && (
                <p className={styles.memoryHint}>{t('settings.memory.desktopOnly')}</p>
              )}

              {isElectron && memoryStats && (
                <>
                  <div className={styles.memoryStatRow}>
                    <span>{t('settings.memory.total')}</span>
                    <strong>{memoryStats.total}</strong>
                  </div>
                  <div className={styles.memoryStatRow}>
                    <span>{t('settings.memory.size')}</span>
                    <strong>{formatBytes(memoryStats.sizeBytes)}</strong>
                  </div>
                  <div className={styles.memoryTypeGrid}>
                    {(
                      ['project', 'note', 'task', 'checkpoint', 'generic'] as const
                    ).map((type) => (
                      <div key={type} className={styles.memoryTypeItem}>
                        <span className={styles.memoryTypeLabel}>{type}</span>
                        <strong className={styles.memoryTypeValue}>
                          {memoryStats.byType[type] ?? 0}
                        </strong>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {isElectron && !memoryStats && (
                <p className={styles.memoryHint}>{t('settings.memory.disabled')}</p>
              )}

              <div className={styles.memoryActions}>
                <button
                  type="button"
                  className={styles.dangerBtn}
                  onClick={handleClearMemories}
                  disabled={!isElectron}
                >
                  {t('settings.memory.clear')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'context' && (
            <form className={styles.form} onSubmit={handleSave}>
              <label>
                <span>{t('settings.context.window')}</span>
                <input
                  type="number"
                  min={1024}
                  step={1024}
                  value={contextWindow}
                  onChange={(e) => setContextWindow(Number(e.target.value))}
                />
              </label>
              <label>
                <span>{t('settings.context.checkpointThreshold')}</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={checkpointThreshold}
                  onChange={(e) => setCheckpointThreshold(Number(e.target.value))}
                />
              </label>
              <label>
                <span>{t('settings.context.rebuildThreshold')}</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={rebuildThreshold}
                  onChange={(e) => setRebuildThreshold(Number(e.target.value))}
                />
              </label>
              <label>
                <span>{t('settings.context.recentMessagesRatio')}</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={recentMessagesRatio}
                  onChange={(e) => setRecentMessagesRatio(Number(e.target.value))}
                />
              </label>
              <label>
                <span>{t('settings.context.memoryRatio')}</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={memoryRatio}
                  onChange={(e) => setMemoryRatio(Number(e.target.value))}
                />
              </label>
              <label>
                <span>{t('settings.context.taskProgressRatio')}</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={taskProgressRatio}
                  onChange={(e) => setTaskProgressRatio(Number(e.target.value))}
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
            </form>
          )}

          {status.kind && (
            <div
              className={`${styles.status} ${
                status.kind === 'ok' ? styles.statusOk : styles.statusWarn
              }`}
            >
              {status.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
