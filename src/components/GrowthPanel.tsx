import { useEffect, useState } from 'react';
import styles from './GrowthPanel.module.css';
import { listReflections, listEvolutions, listProposals } from '../api';

interface GrowthPanelProps {
  onClose: () => void;
}

type Tab = 'reflections' | 'evolutions' | 'proposals';

export function GrowthPanel({ onClose }: GrowthPanelProps) {
  const [tab, setTab] = useState<Tab>('reflections');
  const [reflections, setReflections] = useState<unknown[]>([]);
  const [evolutions, setEvolutions] = useState<unknown[]>([]);
  const [proposals, setProposals] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([listReflections(), listEvolutions(), listProposals()])
      .then(([r, e, p]) => {
        setReflections(r);
        setEvolutions(e);
        setProposals(p);
      })
      .finally(() => setLoading(false));
  }, []);

  const renderReflection = (item: any, idx: number) => (
    <div key={idx} className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.badge}>{item.agentId}</span>
        <span className={`${styles.badge} ${styles[`assessment-${item.assessment}`]}`}>{item.assessment}</span>
        <span className={styles.time}>{new Date(item.timestamp).toLocaleString()}</span>
      </div>
      <p className={styles.label}>输入</p>
      <p className={styles.text}>{item.taskInput}</p>
      {item.weaknesses?.length > 0 && (
        <>
          <p className={styles.label}>不足</p>
          <ul className={styles.list}>
            {item.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
          </ul>
        </>
      )}
      {item.improvements?.length > 0 && (
        <>
          <p className={styles.label}>改进方向</p>
          <ul className={styles.list}>
            {item.improvements.map((w: string, i: number) => <li key={i}>{w}</li>)}
          </ul>
        </>
      )}
    </div>
  );

  const renderEvolution = (item: any, idx: number) => (
    <div key={idx} className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.badge}>{item.agentId}</span>
        <span className={styles.badge}>G{item.generation}</span>
        <span className={styles.time}>{new Date(item.timestamp).toLocaleString()}</span>
      </div>
      <p className={styles.label}>进化理由</p>
      <p className={styles.text}>{item.reason}</p>
      <p className={styles.label}>新 systemPrompt</p>
      <pre className={styles.code}>{item.newPrompt}</pre>
    </div>
  );

  const renderProposal = (item: any, idx: number) => (
    <div key={idx} className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.badge}>{item.targetType}</span>
        <span className={`${styles.badge} ${styles[`status-${item.status}`]}`}>{item.status}</span>
        <span className={styles.time}>{new Date(item.timestamp).toLocaleString()}</span>
      </div>
      <p className={styles.label}>{item.description}</p>
      <p className={styles.text}>{item.proposedChanges}</p>
      <p className={styles.label}>理由</p>
      <p className={styles.text}>{item.rationale}</p>
    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>智能体成长轨迹</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={styles.tabs}>
          {[
            { key: 'reflections', label: `反思 (${reflections.length})` },
            { key: 'evolutions', label: `进化 (${evolutions.length})` },
            { key: 'proposals', label: `改进方案 (${proposals.length})` },
          ].map((t) => (
            <button
              key={t.key}
              className={`${styles.tab} ${tab === t.key ? styles.activeTab : ''}`}
              onClick={() => setTab(t.key as Tab)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className={styles.content}>
          {loading ? (
            <p className={styles.empty}>加载中...</p>
          ) : tab === 'reflections' ? (
            reflections.length === 0 ? <p className={styles.empty}>暂无反思记录</p> : reflections.map(renderReflection)
          ) : tab === 'evolutions' ? (
            evolutions.length === 0 ? <p className={styles.empty}>暂无进化记录</p> : evolutions.map(renderEvolution)
          ) : proposals.length === 0 ? (
            <p className={styles.empty}>暂无改进方案</p>
          ) : proposals.map(renderProposal)}
        </div>
      </div>
    </div>
  );
}
