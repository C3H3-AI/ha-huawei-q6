import { LitElement, html, css } from 'lit';
import { api } from '../api.js';
import { showToast } from '../hacs-vision-panel.js';
import { t } from '../i18n.js';
import { commonStyles } from '../shared/styles.js';

class BackupView extends LitElement {
  static properties = {
    loading: { type: Boolean },
    exporting: { type: Boolean },
    importing: { type: Boolean },
    exportData: { type: Object },
  };

  constructor() {
    super();
    this.loading = false;
    this.exporting = false;
    this.importing = false;
    this.exportData = null;
  }

  static styles = css`
    ${commonStyles}

    :host { display: block; touch-action: manipulation; }

    .section {
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 14px; padding: 20px; margin-bottom: 16px;
    }
    .section-title {
      font-size: 15px; font-weight: 700; color: var(--primary-text-color);
      margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
    }
    .section-title svg { width: 20px; height: 20px; color: var(--primary-color); }
    .section-desc { font-size: 13px; color: var(--secondary-text-color); margin-bottom: 16px; line-height: 1.6; }

    .btn {
      padding: 12px 24px; border-radius: 10px;
      font-size: 14px; font-weight: 500;
      display: inline-flex; align-items: center; gap: 8px;
    }
    .btn-group { display: flex; gap: 12px; flex-wrap: wrap; }

    .file-input-wrap {
      display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
    }
    .file-input {
      padding: 10px 14px; border: 1px solid var(--divider-color);
      border-radius: 8px; font-size: 13px; background: var(--card-background-color);
      color: var(--primary-text-color);
    }

    .preview {
      margin-top: 16px; padding: 16px; border: 1px solid var(--divider-color);
      border-radius: 10px; background: var(--secondary-background-color);
    }
    .preview-title { font-size: 13px; font-weight: 600; color: var(--primary-text-color); margin-bottom: 8px; }
    .preview-item { font-size: 12px; color: var(--secondary-text-color); margin: 4px 0; }

    @media (max-width: 768px) {
      .section { padding: 14px; border-radius: 12px; }
      .btn {
        width: 100%; justify-content: center; min-height: 44px;
        padding: 10px 16px; font-size: 13px;
      }
      .btn-group { flex-direction: column; gap: 8px; }
    }
  `;

  async _export() {
    this.exporting = true;
    try {
      const data = await api.exportBackup();
      this.exportData = data;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hacs-vision-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t('exportSuccess'), 'success');
    } catch(e) {
      showToast(`${t('exportFailed')}: ${e.message}`, 'error');
    }
    this.exporting = false;
  }

  async _import() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      this.importing = true;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await api.importBackup(data);
        showToast(t('importSuccess'), 'success');
        this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
      } catch(e) {
        showToast(`${t('importFailed')}: ${e.message}`, 'error');
      }
      this.importing = false;
    };
    input.click();
  }

  render() {
    return html`
      <div class="section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          ${t('exportBackup')}
        </div>
        <div class="section-desc">
          ${t('exportDesc')}
        </div>
        <div class="btn-group">
          <button class="btn primary" @click=${this._export} ?disabled=${this.exporting}>
            ${this.exporting ? t('exporting') : t('exportBtn')}
          </button>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          ${t('importBackup')}
        </div>
        <div class="section-desc">
          ${t('importDesc')}
        </div>
        <div class="btn-group">
          <button class="btn danger" @click=${this._import} ?disabled=${this.importing}>
            ${this.importing ? t('importing') : t('importBtn')}
          </button>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          ${t('depCheck')}
        </div>
        <div class="section-desc">
          ${t('depDesc')}
        </div>
        <button class="btn" @click=${async () => {
          try {
            const result = await api.checkDependencies();
            const ok = result.status === 'ok' || result.all_ok;
            showToast(ok ? t('depOk') : t('depMissing'), ok ? 'success' : 'error');
          } catch(e) {
            showToast(`${t('checkFailed')}: ${e.message}`, 'error');
          }
        }}>${t('checkDep')}</button>
      </div>
    `;
  }
}

customElements.define('backup-view', BackupView);
