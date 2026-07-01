import { useEffect, useMemo, useState } from 'react';
import styles from './AgentsPanel.module.css';
import { listAgents, listSkills, saveAgent, deleteAgent } from '../api';
import type { AgentDefinition, SkillDefinition } from '../types';

interface AgentsPanelProps {
  onClose: () => void;
  onAgentsChanged?: () => void;
}

const ROLE_LABELS: Record<AgentDefinition['role'], string> = {
  super: '主智能体',
  coder: '代码',
  writer: '写作',
  researcher: '研究',
  reviewer: '审核',
  custom: '自定义',
};

export function AgentsPanel({ onClose, onAgentsChanged }: AgentsPanelProps) {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [skills, setSkills] = useState<SkillDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formAvatar, setFormAvatar] = useState('🤖');
  const [formDescription, setFormDescription] = useState('');
  const [formRole, setFormRole] = useState<AgentDefinition['role']>('custom');
  const [formPrompt, setFormPrompt] = useState('');
  const [formSkillIds, setFormSkillIds] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    const [a, s] = await Promise.all([listAgents(), listSkills()]);
    setAgents(a);
    setSkills(s);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const builtInAgents = useMemo(() => agents.filter(a => a.isBuiltIn), [agents]);
  const customAgents = useMemo(() => agents.filter(a => !a.isBuiltIn), [agents]);

  const resetForm = () => {
    setFormId('');
    setFormName('');
    setFormAvatar('🤖');
    setFormDescription('');
    setFormRole('custom');
    setFormPrompt('');
    setFormSkillIds(['skill_reflect', 'skill_evolve_agent']);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
    setSelectedAgent(null);
  };

  const openEdit = (agent: AgentDefinition) => {
    setFormId(agent.id);
    setFormName(agent.name);
    setFormAvatar(agent.avatar ?? '🤖');
    setFormDescription(agent.description);
    setFormRole(agent.role);
    setFormPrompt(agent.systemPrompt);
    setFormSkillIds(agent.skillIds);
    setShowForm(true);
    setSelectedAgent(null);
  };

  const toggleSkill = (id: string) => {
    setFormSkillIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const agent: AgentDefinition = {
      id: formId || `agent_${Date.now()}`,
      name: formName.trim(),
      avatar: formAvatar.trim() || '🤖',
      description: formDescription.trim(),
      role: formRole,
      systemPrompt: formPrompt.trim(),
      skillIds: formSkillIds,
      isBuiltIn: false,
      generation: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const saved = await saveAgent(agent);
    if (saved) {
      setShowForm(false);
      resetForm();
      await load();
      onAgentsChanged?.();
    }
  };

  const handleDelete = async (agent: AgentDefinition) => {
    if (!confirm(`确定要删除智能体「${agent.name}」吗？`)) return;
    const ok = await deleteAgent(agent.id);
    if (ok) {
      setSelectedAgent(null);
      await load();
      onAgentsChanged?.();
    }
  };

  const renderAgentCard = (agent: AgentDefinition) => (
    <div
      key={agent.id}
      className={`${styles.card} ${selectedAgent?.id === agent.id ? styles.cardActive : ''}`}
      onClick={() => setSelectedAgent(agent)}
    >
      <div className={styles.cardHeader}>
        <span className={styles.avatar}>{agent.avatar}</span>
        <div className={styles.titleBlock}>
          <span className={styles.name}>{agent.name}</span>
          <span className={styles.role}>{ROLE_LABELS[agent.role]}</span>
        </div>
        {agent.generation ? <span className={styles.genBadge}>G{agent.generation}</span> : null}
      </div>
      <p className={styles.description}>{agent.description}</p>
      <div className={styles.skillTags}>
        {agent.skillIds.map(id => {
          const skill = skills.find(s => s.id === id);
          return <span key={id} className={styles.skillTag}>{skill?.name ?? id}</span>;
        })}
      </div>
    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>智能体管理</h3>
          <div className={styles.headerActions}>
            <button className={styles.primaryBtn} onClick={openCreate}>+ 新建智能体</button>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.list}>
            {loading ? (
              <p className={styles.empty}>加载中...</p>
            ) : (
              <>
                <h4 className={styles.sectionTitle}>内置智能体</h4>
                {builtInAgents.length === 0 ? <p className={styles.empty}>无</p> : builtInAgents.map(renderAgentCard)}

                <h4 className={styles.sectionTitle}>自定义智能体</h4>
                {customAgents.length === 0 ? <p className={styles.empty}>暂无自定义智能体，点击右上角新建。</p> : customAgents.map(renderAgentCard)}
              </>
            )}
          </div>

          <div className={styles.detail}>
            {showForm ? (
              <form className={styles.form} onSubmit={handleSubmit}>
                <h4>{formId ? '编辑智能体' : '新建智能体'}</h4>
                <label>
                  <span>名称</span>
                  <input value={formName} onChange={e => setFormName(e.target.value)} required />
                </label>
                <label>
                  <span>头像 Emoji</span>
                  <input value={formAvatar} onChange={e => setFormAvatar(e.target.value)} maxLength={4} />
                </label>
                <label>
                  <span>描述</span>
                  <input value={formDescription} onChange={e => setFormDescription(e.target.value)} required />
                </label>
                <label>
                  <span>角色类型</span>
                  <select value={formRole} onChange={e => setFormRole(e.target.value as AgentDefinition['role'])}>
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>System Prompt</span>
                  <textarea value={formPrompt} onChange={e => setFormPrompt(e.target.value)} rows={8} required />
                </label>
                <div className={styles.skillSelect}>
                  <span>技能</span>
                  <div className={styles.skillOptions}>
                    {skills.map(skill => (
                      <label key={skill.id} className={styles.checkOption}>
                        <input
                          type="checkbox"
                          checked={formSkillIds.includes(skill.id)}
                          onChange={() => toggleSkill(skill.id)}
                        />
                        {skill.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setShowForm(false)}>取消</button>
                  <button type="submit" className={styles.primaryBtn}>保存</button>
                </div>
              </form>
            ) : selectedAgent ? (
              <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <span className={styles.bigAvatar}>{selectedAgent.avatar}</span>
                  <div>
                    <h4>{selectedAgent.name}</h4>
                    <span className={styles.role}>{ROLE_LABELS[selectedAgent.role]}</span>
                    {selectedAgent.generation ? <span className={styles.genBadge}>G{selectedAgent.generation}</span> : null}
                  </div>
                </div>
                <p className={styles.description}>{selectedAgent.description}</p>
                <p className={styles.label}>System Prompt</p>
                <pre className={styles.promptBlock}>{selectedAgent.systemPrompt}</pre>
                <p className={styles.label}>技能</p>
                <div className={styles.skillTags}>
                  {selectedAgent.skillIds.map(id => {
                    const skill = skills.find(s => s.id === id);
                    return <span key={id} className={styles.skillTag}>{skill?.name ?? id}</span>;
                  })}
                </div>
                {!selectedAgent.isBuiltIn && (
                  <div className={styles.detailActions}>
                    <button className={styles.secondaryBtn} onClick={() => openEdit(selectedAgent)}>编辑</button>
                    <button className={styles.dangerBtn} onClick={() => handleDelete(selectedAgent)}>删除</button>
                  </div>
                )}
              </div>
            ) : (
              <p className={styles.empty}>选择一个智能体查看详情，或点击右上角新建。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
