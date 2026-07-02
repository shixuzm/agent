import { useEffect, useMemo, useState } from 'react';
import styles from './SettingsPanel.module.css';
import {
  getAppConfig,
  setAppConfig,
  clearAppConfig,
  hasAppConfig,
  DEFAULT_CONFIG,
  type AppConfig,
  type CustomAgentConfig,
  type MCPServerConfig,
} from '../lib/appConfig';
import { useT, type MessageKeys } from '../i18n';

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

type SettingsCategory =
  | 'general'
  | 'agents'
  | 'context'
  | 'memory'
  | 'mcp'
  | 'shortcuts'
  | 'appearance'
  | 'compose';

interface NavItem {
  key: SettingsCategory;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'general' },
  { key: 'agents' },
  { key: 'context' },
  { key: 'memory' },
  { key: 'mcp' },
  { key: 'shortcuts' },
  { key: 'appearance' },
  { key: 'compose' },
];

const TAB_I18N_KEYS: Record<SettingsCategory, MessageKeys> = {
  general: 'settings.tabs.general',
  agents: 'settings.tabs.agents',
  context: 'settings.tabs.context',
  memory: 'settings.tabs.memory',
  mcp: 'settings.tabs.mcp',
  shortcuts: 'settings.tabs.shortcuts',
  appearance: 'settings.tabs.appearance',
  compose: 'settings.tabs.compose',
};

const PROVIDER_OPTIONS: { value: NonNullable<AppConfig['provider']>; labelZh: string; labelEn: string }[] = [
  { value: 'makers', labelZh: 'Makers', labelEn: 'Makers' },
  { value: 'openai', labelZh: 'OpenAI', labelEn: 'OpenAI' },
  { value: 'anthropic', labelZh: 'Anthropic', labelEn: 'Anthropic' },
  { value: 'custom', labelZh: '自定义', labelEn: 'Custom' },
];

const THEME_OPTIONS: { value: NonNullable<AppConfig['theme']>; labelZh: string; labelEn: string; i18nKey: MessageKeys }[] = [
  { value: 'light', labelZh: '浅色', labelEn: 'Light', i18nKey: 'settings.appearance.light' },
  { value: 'dark', labelZh: '深色', labelEn: 'Dark', i18nKey: 'settings.appearance.dark' },
  { value: 'system', labelZh: '跟随系统', labelEn: 'System', i18nKey: 'settings.appearance.system' },
];

const LANGUAGE_OPTIONS: { value: NonNullable<AppConfig['language']>; labelZh: string; labelEn: string }[] = [
  { value: 'zh', labelZh: '中文', labelEn: 'Chinese' },
  { value: 'en', labelZh: '英文', labelEn: 'English' },
];

const ROLE_OPTIONS: CustomAgentConfig['role'][] = ['coder', 'writer', 'researcher', 'reviewer', 'custom'];

const ROLE_LABELS: Record<CustomAgentConfig['role'], { zh: string; en: string }> = {
  coder: { zh: '代码', en: 'Coder' },
  writer: { zh: '写作', en: 'Writer' },
  researcher: { zh: '研究', en: 'Researcher' },
  reviewer: { zh: '审核', en: 'Reviewer' },
  custom: { zh: '自定义', en: 'Custom' },
};

const SKILL_OPTIONS = [
  { id: 'skill_file_operation', labelZh: '文件操作', labelEn: 'File Operation' },
  { id: 'skill_knowledge_retrieval', labelZh: '知识库检索', labelEn: 'Knowledge Retrieval' },
  { id: 'skill_code_execution', labelZh: '代码执行', labelEn: 'Code Execution' },
  { id: 'skill_web_search', labelZh: '网页搜索', labelEn: 'Web Search' },
  { id: 'skill_calculator', labelZh: '计算工具', labelEn: 'Calculator' },
  { id: 'skill_reflect', labelZh: '自我反思', labelEn: 'Self Reflect' },
  { id: 'skill_evolve_agent', labelZh: '智能体进化', labelEn: 'Evolve Agent' },
  { id: 'skill_create_agent', labelZh: '创建智能体', labelEn: 'Create Agent' },
  { id: 'skill_read_code', labelZh: '代码阅读', labelEn: 'Read Code' },
  { id: 'skill_list_project', labelZh: '项目结构扫描', labelEn: 'List Project' },
  { id: 'skill_dialogue_assistant', labelZh: '对话助手', labelEn: 'Dialogue Assistant' },
  { id: 'skill_file_handler', labelZh: '文件处理', labelEn: 'File Handler' },
  { id: 'skill_content_generator', labelZh: '内容生成', labelEn: 'Content Generator' },
  { id: 'skill_workflow_orchestrator', labelZh: '流程编排', labelEn: 'Workflow Orchestrator' },
  { id: 'skill_scheduler', labelZh: '定时任务', labelEn: 'Scheduler' },
  { id: 'skill_mnn', labelZh: 'MNN 端侧推理', labelEn: 'MNN Inference' },
];

const SHORTCUT_KEYS = ['newChat', 'openSettings', 'toggleTheme'] as const;

type ShortcutKey = (typeof SHORTCUT_KEYS)[number];

const SHORTCUT_I18N_KEYS: Record<ShortcutKey, MessageKeys> = {
  newChat: 'settings.shortcuts.newChat',
  openSettings: 'settings.shortcuts.openSettings',
  toggleTheme: 'settings.shortcuts.toggleTheme',
};

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

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function SettingsPanel({ onClose, firstRun }: SettingsPanelProps) {
  const { lang, t } = useT();
  const tZh = lang === 'zh';

  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<{ kind: 'ok' | 'warn' | null; text: string }>({ kind: null, text: '' });

  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(false);
  const [isElectron, setIsElectron] = useState<boolean>(false);

  // Hydrate the form from localStorage on mount.
  useEffect(() => {
    const saved = getAppConfig();
    setConfig(saved ?? DEFAULT_CONFIG);
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
  }, [activeCategory]);

  const updateConfig = (patch: Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    const next: AppConfig = {
      ...config,
      aiGatewayApiKey: config.aiGatewayApiKey.trim(),
      aiGatewayBaseUrl: config.aiGatewayBaseUrl.trim() || DEFAULT_BASE_URL,
      aiGatewayModel: config.aiGatewayModel.trim() || DEFAULT_MODEL,
      contextWindow: Math.max(1024, config.contextWindow ?? 32000),
      checkpointThreshold: clamp(config.checkpointThreshold ?? 0.55, 0, 1),
      rebuildThreshold: clamp(config.rebuildThreshold ?? 0.80, 0, 1),
      recentMessagesRatio: clamp(config.recentMessagesRatio ?? 0.45, 0, 1),
      memoryRatio: clamp(config.memoryRatio ?? 0.10, 0, 1),
      taskProgressRatio: clamp(config.taskProgressRatio ?? 0.10, 0, 1),
      temperature: clamp(config.temperature ?? 0.7, 0, 1),
      maxTokens: Math.max(1, config.maxTokens ?? 2048),
      composeMaxSteps: Math.max(1, config.composeMaxSteps ?? 20),
    };
    setAppConfig(next);
    setConfig(next);
    setStatus({
      kind: next.aiGatewayApiKey ? 'ok' : 'warn',
      text: next.aiGatewayApiKey
        ? t('settings.saved')
        : t('settings.closeUnconfiguredHint'),
    });
  };

  const handleClear = () => {
    clearAppConfig();
    setConfig(DEFAULT_CONFIG);
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
    if (!hasAppConfig()) {
      setStatus({ kind: 'warn', text: t('settings.closeUnconfiguredHint') });
    }
    onClose();
  };

  const filteredNavItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return NAV_ITEMS;
    return NAV_ITEMS.filter((item) => {
      const label = t(TAB_I18N_KEYS[item.key]).toLowerCase();
      return label.includes(q) || item.key.toLowerCase().includes(q);
    });
  }, [searchQuery, t]);

  const renderNavLabel = (item: NavItem) => t(TAB_I18N_KEYS[item.key]);

  const renderSectionTitle = (zh: string, en: string) => (
    <h4 className={styles.sectionTitle}>{tZh ? zh : en}</h4>
  );

  const renderSectionTitleKey = (key: MessageKeys) => (
    <h4 className={styles.sectionTitle}>{t(key)}</h4>
  );

  const renderGeneralPanel = () => (
    <form className={styles.form} onSubmit={handleSave}>
      {renderSectionTitle('AI Gateway（兼容配置）', 'AI Gateway (Legacy)')}
      <label>
        <span>{tZh ? 'AI Gateway API Key' : 'AI Gateway API Key'}</span>
        <input
          type="password"
          value={config.aiGatewayApiKey}
          onChange={(e) => updateConfig({ aiGatewayApiKey: e.target.value })}
          autoComplete="off"
        />
      </label>
      <label>
        <span>{tZh ? 'AI Gateway Base URL' : 'AI Gateway Base URL'}</span>
        <input
          type="text"
          value={config.aiGatewayBaseUrl}
          onChange={(e) => updateConfig({ aiGatewayBaseUrl: e.target.value })}
          placeholder={DEFAULT_BASE_URL}
        />
      </label>
      <label>
        <span>{tZh ? 'AI Gateway 模型' : 'AI Gateway Model'}</span>
        <input
          type="text"
          value={config.aiGatewayModel}
          onChange={(e) => updateConfig({ aiGatewayModel: e.target.value })}
          placeholder={DEFAULT_MODEL}
        />
      </label>

      {renderSectionTitle('Provider 与模型选择', 'Provider & Model')}
      <label>
        <span>{t('settings.general.provider')}</span>
        <select
          value={config.provider ?? 'makers'}
          onChange={(e) => updateConfig({ provider: e.target.value as AppConfig['provider'] })}
        >
          {PROVIDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {tZh ? opt.labelZh : opt.labelEn}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t('settings.general.model')}</span>
        <input
          type="text"
          value={config.modelId ?? ''}
          onChange={(e) => updateConfig({ modelId: e.target.value })}
          placeholder="@makers/deepseek-v4-flash"
        />
      </label>
      <label>
        <span>{t('settings.general.apiKey')}</span>
        <input
          type="password"
          value={config.apiKey ?? ''}
          onChange={(e) => updateConfig({ apiKey: e.target.value })}
          autoComplete="off"
        />
      </label>
      {config.provider === 'custom' && (
        <label>
          <span>{t('settings.general.baseUrl')}</span>
          <input
            type="text"
            value={config.baseUrl ?? ''}
            onChange={(e) => updateConfig({ baseUrl: e.target.value })}
            placeholder="https://api.example.com/v1"
          />
        </label>
      )}
      <label>
        <span>{t('settings.general.temperature')} ({config.temperature ?? 0.7})</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.temperature ?? 0.7}
          onChange={(e) => updateConfig({ temperature: Number(e.target.value) })}
        />
      </label>
      <label>
        <span>{t('settings.general.maxTokens')}</span>
        <input
          type="number"
          min={1}
          step={1}
          value={config.maxTokens ?? 2048}
          onChange={(e) => updateConfig({ maxTokens: Number(e.target.value) })}
        />
      </label>

      {renderActions()}
    </form>
  );

  const renderAgentsPanel = () => {
    const customAgents = config.customAgents ?? [];
    const agentOverrides = config.agentOverrides ?? {};

    const updateCustomAgent = (index: number, patch: Partial<CustomAgentConfig>) => {
      const next = [...customAgents];
      next[index] = { ...next[index], ...patch };
      updateConfig({ customAgents: next });
    };

    const removeCustomAgent = (index: number) => {
      const next = [...customAgents];
      next.splice(index, 1);
      updateConfig({ customAgents: next });
    };

    const addCustomAgent = () => {
      const newAgent: CustomAgentConfig = {
        id: generateId('agent'),
        name: t('settings.agents.newAgent'),
        description: '',
        systemPrompt: '',
        role: 'custom',
        skillIds: [],
        toolPermissions: [],
      };
      updateConfig({ customAgents: [...customAgents, newAgent] });
    };

    const toggleSkill = (agent: CustomAgentConfig, skillId: string) => {
      const has = agent.skillIds.includes(skillId);
      return has ? agent.skillIds.filter((id) => id !== skillId) : [...agent.skillIds, skillId];
    };

    const updateOverride = (agentId: string, patch: Partial<{ toolPermissions?: string[]; skillIds?: string[] }>) => {
      updateConfig({
        agentOverrides: {
          ...agentOverrides,
          [agentId]: { ...agentOverrides[agentId], ...patch },
        },
      });
    };

    const removeOverride = (agentId: string) => {
      const next = { ...agentOverrides };
      delete next[agentId];
      updateConfig({ agentOverrides: next });
    };

    return (
      <div className={styles.form}>
        {renderSectionTitleKey('settings.agents.customAgents')}
        {customAgents.length === 0 && (
          <p className={styles.emptyHint}>{tZh ? '暂无自定义 Agent' : 'No custom agents'}</p>
        )}
        {customAgents.map((agent, index) => (
          <div key={agent.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <input
                type="text"
                value={agent.name}
                onChange={(e) => updateCustomAgent(index, { name: e.target.value })}
                placeholder={t('settings.agents.name')}
                className={styles.cardTitleInput}
              />
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => removeCustomAgent(index)}
                title={t('settings.agents.deleteAgent')}
              >
                ×
              </button>
            </div>
            <label>
              <span>{tZh ? 'ID' : 'ID'}</span>
              <input type="text" value={agent.id} readOnly />
            </label>
            <label>
              <span>{t('settings.agents.description')}</span>
              <input
                type="text"
                value={agent.description}
                onChange={(e) => updateCustomAgent(index, { description: e.target.value })}
              />
            </label>
            <label>
              <span>{t('settings.agents.role')}</span>
              <select
                value={agent.role}
                onChange={(e) => updateCustomAgent(index, { role: e.target.value as CustomAgentConfig['role'] })}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {tZh ? ROLE_LABELS[role].zh : ROLE_LABELS[role].en}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t('settings.agents.systemPrompt')}</span>
              <textarea
                value={agent.systemPrompt}
                onChange={(e) => updateCustomAgent(index, { systemPrompt: e.target.value })}
                rows={4}
              />
            </label>
            <div className={styles.fieldGroup}>
              <span>{t('settings.agents.skills')}</span>
              <div className={styles.checkboxGrid}>
                {SKILL_OPTIONS.map((skill) => (
                  <label key={skill.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={agent.skillIds.includes(skill.id)}
                      onChange={() => updateCustomAgent(index, { skillIds: toggleSkill(agent, skill.id) })}
                    />
                    <span>{tZh ? skill.labelZh : skill.labelEn}</span>
                  </label>
                ))}
              </div>
            </div>
            <label>
              <span>{t('settings.agents.permissions')}</span>
              <input
                type="text"
                value={(agent.toolPermissions ?? []).join(', ')}
                onChange={(e) =>
                  updateCustomAgent(index, {
                    toolPermissions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </label>
          </div>
        ))}
        <button type="button" className={styles.secondaryBtn} onClick={addCustomAgent}>
          + {t('settings.agents.newAgent')}
        </button>

        {renderSectionTitle('Agent 覆盖配置', 'Agent Overrides')}
        {Object.keys(agentOverrides).length === 0 && (
          <p className={styles.emptyHint}>{tZh ? '暂无覆盖配置' : 'No overrides'}</p>
        )}
        {Object.entries(agentOverrides).map(([agentId, override]) => (
          <div key={agentId} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>{agentId}</span>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => removeOverride(agentId)}
                title={tZh ? '删除' : 'Delete'}
              >
                ×
              </button>
            </div>
            <label>
              <span>{tZh ? '覆盖技能（逗号分隔）' : 'Override skills (comma separated)'}</span>
              <input
                type="text"
                value={(override.skillIds ?? []).join(', ')}
                onChange={(e) =>
                  updateOverride(agentId, {
                    skillIds: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </label>
            <label>
              <span>{tZh ? '覆盖工具权限（逗号分隔）' : 'Override tool permissions (comma separated)'}</span>
              <input
                type="text"
                value={(override.toolPermissions ?? []).join(', ')}
                onChange={(e) =>
                  updateOverride(agentId, {
                    toolPermissions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </label>
          </div>
        ))}
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => {
            const agentId = window.prompt(tZh ? '输入 Agent ID' : 'Enter agent ID');
            if (agentId?.trim()) {
              updateOverride(agentId.trim(), { skillIds: [], toolPermissions: [] });
            }
          }}
        >
          {tZh ? '+ 添加 Agent 覆盖' : '+ Add Agent Override'}
        </button>

        {renderActions()}
      </div>
    );
  };

  const renderContextPanel = () => (
    <form className={styles.form} onSubmit={handleSave}>
      <label>
        <span>{t('settings.context.contextWindow')}</span>
        <input
          type="number"
          min={1024}
          step={1024}
          value={config.contextWindow ?? 32000}
          onChange={(e) => updateConfig({ contextWindow: Number(e.target.value) })}
        />
      </label>
      <label>
        <span>{t('settings.context.checkpointThreshold')}</span>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={config.checkpointThreshold ?? 0.55}
          onChange={(e) => updateConfig({ checkpointThreshold: Number(e.target.value) })}
        />
      </label>
      <label>
        <span>{t('settings.context.rebuildThreshold')}</span>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={config.rebuildThreshold ?? 0.80}
          onChange={(e) => updateConfig({ rebuildThreshold: Number(e.target.value) })}
        />
      </label>
      <label>
        <span>{t('settings.context.recentMessagesRatio')}</span>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={config.recentMessagesRatio ?? 0.45}
          onChange={(e) => updateConfig({ recentMessagesRatio: Number(e.target.value) })}
        />
      </label>
      <label>
        <span>{t('settings.context.memoryRatio')}</span>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={config.memoryRatio ?? 0.10}
          onChange={(e) => updateConfig({ memoryRatio: Number(e.target.value) })}
        />
      </label>
      <label>
        <span>{t('settings.context.taskProgressRatio')}</span>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={config.taskProgressRatio ?? 0.10}
          onChange={(e) => updateConfig({ taskProgressRatio: Number(e.target.value) })}
        />
      </label>
      {renderActions()}
    </form>
  );

  const renderMemoryPanel = () => (
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
  );

  const renderMcpPanel = () => {
    const servers = config.mcpServers ?? [];

    const updateServer = (index: number, patch: Partial<MCPServerConfig>) => {
      const next = [...servers];
      next[index] = { ...next[index], ...patch };
      updateConfig({ mcpServers: next });
    };

    const removeServer = (index: number) => {
      const next = [...servers];
      next.splice(index, 1);
      updateConfig({ mcpServers: next });
    };

    const addServer = () => {
      const newServer: MCPServerConfig = {
        id: generateId('mcp'),
        name: t('settings.mcp.name'),
        command: '',
        args: [],
        env: {},
        enabled: true,
      };
      updateConfig({ mcpServers: [...servers, newServer] });
    };

    return (
      <div className={styles.form}>
        {servers.length === 0 && (
          <p className={styles.emptyHint}>{tZh ? '暂无 MCP 服务器' : 'No MCP servers'}</p>
        )}
        {servers.map((server, index) => (
          <div key={server.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <input
                type="text"
                value={server.name}
                onChange={(e) => updateServer(index, { name: e.target.value })}
                placeholder={t('settings.mcp.name')}
                className={styles.cardTitleInput}
              />
              <div className={styles.cardHeaderActions}>
                <label className={styles.inlineCheckbox}>
                  <input
                    type="checkbox"
                    checked={server.enabled ?? true}
                    onChange={(e) => updateServer(index, { enabled: e.target.checked })}
                  />
                  <span>{t('settings.mcp.enabled')}</span>
                </label>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => removeServer(index)}
                  title={t('settings.mcp.delete')}
                >
                  ×
                </button>
              </div>
            </div>
            <label>
              <span>{tZh ? 'ID' : 'ID'}</span>
              <input type="text" value={server.id} readOnly />
            </label>
            <label>
              <span>{t('settings.mcp.command')}</span>
              <input
                type="text"
                value={server.command ?? ''}
                onChange={(e) => updateServer(index, { command: e.target.value })}
              />
            </label>
            <label>
              <span>{t('settings.mcp.args')}</span>
              <input
                type="text"
                value={(server.args ?? []).join(', ')}
                onChange={(e) =>
                  updateServer(index, {
                    args: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </label>
            <label>
              <span>{t('settings.mcp.env')}</span>
              <textarea
                value={Object.entries(server.env ?? {})
                  .map(([k, v]) => `${k}=${v}`)
                  .join('\n')}
                onChange={(e) => {
                  const env: Record<string, string> = {};
                  e.target.value.split('\n').forEach((line) => {
                    const idx = line.indexOf('=');
                    if (idx > 0) {
                      env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
                    }
                  });
                  updateServer(index, { env });
                }}
                rows={3}
              />
            </label>
          </div>
        ))}
        <button type="button" className={styles.secondaryBtn} onClick={addServer}>
          + {t('settings.mcp.add')}
        </button>
        {renderActions()}
      </div>
    );
  };

  const renderShortcutsPanel = () => (
    <form className={styles.form} onSubmit={handleSave}>
      {renderSectionTitleKey('settings.shortcuts.title')}
      {SHORTCUT_KEYS.map((key) => (
        <label key={key}>
          <span>{t(SHORTCUT_I18N_KEYS[key])}</span>
          <input
            type="text"
            value={config.shortcuts?.[key] ?? ''}
            onChange={(e) =>
              updateConfig({
                shortcuts: { ...(config.shortcuts ?? {}), [key]: e.target.value },
              })
            }
          />
        </label>
      ))}
      {renderActions()}
    </form>
  );

  const renderAppearancePanel = () => (
    <form className={styles.form} onSubmit={handleSave}>
      <label>
        <span>{t('settings.appearance.theme')}</span>
        <select
          value={config.theme ?? 'system'}
          onChange={(e) => updateConfig({ theme: e.target.value as AppConfig['theme'] })}
        >
          {THEME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.i18nKey)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t('settings.appearance.language')}</span>
        <select
          value={config.language ?? 'zh'}
          onChange={(e) => updateConfig({ language: e.target.value as AppConfig['language'] })}
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {tZh ? opt.labelZh : opt.labelEn}
            </option>
          ))}
        </select>
      </label>
      {renderActions()}
    </form>
  );

  const renderComposePanel = () => (
    <form className={styles.form} onSubmit={handleSave}>
      {renderSectionTitleKey('settings.compose.title')}
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={config.composeEnabled ?? true}
          onChange={(e) => updateConfig({ composeEnabled: e.target.checked })}
        />
        <span>{t('settings.compose.enabled')}</span>
      </label>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={config.composeAutoExecute ?? false}
          onChange={(e) => updateConfig({ composeAutoExecute: e.target.checked })}
        />
        <span>{t('settings.compose.autoExecute')}</span>
      </label>
      <label>
        <span>{t('settings.compose.maxSteps')}</span>
        <input
          type="number"
          min={1}
          step={1}
          value={config.composeMaxSteps ?? 20}
          onChange={(e) => updateConfig({ composeMaxSteps: Number(e.target.value) })}
        />
      </label>
      {renderActions()}
    </form>
  );

  const renderActions = () => (
    <div className={styles.actions}>
      <button type="button" className={styles.dangerBtn} onClick={handleClear}>
        {t('settings.clear')}
      </button>
      <div className={styles.actionsRight}>
        <button type="button" className={styles.secondaryBtn} onClick={handleClose}>
          {t('settings.cancel')}
        </button>
        <button type="button" className={styles.primaryBtn} onClick={() => handleSave()}>
          {t('settings.save')}
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case 'general':
        return renderGeneralPanel();
      case 'agents':
        return renderAgentsPanel();
      case 'context':
        return renderContextPanel();
      case 'memory':
        return renderMemoryPanel();
      case 'mcp':
        return renderMcpPanel();
      case 'shortcuts':
        return renderShortcutsPanel();
      case 'appearance':
        return renderAppearancePanel();
      case 'compose':
        return renderComposePanel();
      default:
        return renderGeneralPanel();
    }
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

        <div className={styles.layout}>
          <div className={styles.sidebar}>
            <input
              type="text"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('settings.search')}
            />
            <nav className={styles.navList}>
              {filteredNavItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.navItem} ${activeCategory === item.key ? styles.navItemActive : ''}`}
                  onClick={() => setActiveCategory(item.key)}
                >
                  {renderNavLabel(item)}
                </button>
              ))}
            </nav>
          </div>

          <div className={styles.content}>
            {renderContent()}

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
    </div>
  );
}
