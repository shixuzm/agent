import { useState, useCallback } from 'react';
import { useT } from '../i18n';
import styles from './CloudLandingPage.module.css';

const REPO_URL = 'https://github.com/shixuzm/agent';
const CLONE_COMMAND = `git clone ${REPO_URL}`;
const QUICK_START_COMMAND = 'cd agent && npm install && npm run dev';
const PACKAGE_URL = '/agent-local-package.zip';

export default function CloudLandingPage() {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CLONE_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failures.
    }
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={styles.card}>
        <div className={styles.logo}>⬡</div>
        <h1 className={styles.title}>{t('cloud.title')}</h1>
        <p className={styles.subtitle}>{t('cloud.subtitle')}</p>
        <p className={styles.intro}>{t('cloud.intro')}</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('cloud.featureTitle')}</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🤖</div>
              <h3 className={styles.featureName}>{t('cloud.feature.agentManagement')}</h3>
              <p className={styles.featureDesc}>{t('cloud.feature.agentManagementDesc')}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🌱</div>
              <h3 className={styles.featureName}>{t('cloud.feature.selfGrowth')}</h3>
              <p className={styles.featureDesc}>{t('cloud.feature.selfGrowthDesc')}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💬</div>
              <h3 className={styles.featureName}>{t('cloud.feature.multiTurnChat')}</h3>
              <p className={styles.featureDesc}>{t('cloud.feature.multiTurnChatDesc')}</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('cloud.cloneTitle')}</h2>
          <p className={styles.sectionDesc}>{t('cloud.cloneDescription')}</p>
          <div className={styles.codeBlock}>
            <code className={styles.code}>{CLONE_COMMAND}</code>
            <button className={styles.copyBtn} onClick={handleCopy} type="button">
              {copied ? t('cloud.copied') : t('cloud.copyButton')}
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('cloud.downloadTitle')}</h2>
          <p className={styles.sectionDesc}>{t('cloud.downloadDescription')}</p>
          <a className={styles.downloadBtn} href={PACKAGE_URL} download>
            {t('cloud.downloadButton')}
          </a>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('cloud.quickStartTitle')}</h2>
          <p className={styles.sectionDesc}>{t('cloud.quickStartDescription')}</p>
          <div className={styles.codeBlock}>
            <code className={styles.code}>{QUICK_START_COMMAND}</code>
          </div>
        </section>
      </div>
    </div>
  );
}
