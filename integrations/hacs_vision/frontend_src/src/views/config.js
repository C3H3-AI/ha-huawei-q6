import { LitElement, html, css } from 'lit';
import { api } from '../api.js';
import { showToast } from '../hacs-vision-panel.js';
import { t } from '../i18n.js';
import { ConfirmDialog } from '../shared/confirm-dialog.js';

class ConfigView extends LitElement {
  static properties = {
    config: { type: Object },
    loading: { type: Boolean },
  };

  constructor() {
    super();
    this.config = {};
    this.loading = false;
  }

  static styles = css`
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

    .list { display: flex; flex-direction: column; gap: 6px; }
    .list-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 14px; border: 1px solid var(--divider-color);
      border-radius: 10px; font-size: 13px; transition: all 0.2s;
    }
    .list-item:hover { border-color: var(--primary-color); }
    .list-item .name { color: var(--primary-text-color); font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .list-item .meta { font-size: 11px; color: var(--secondary-text-color); margin-left: 8px; flex-shrink: 0; }

    .empty { font-size: 13px; color: var(--secondary-text-color); padding: 8px 0; }

    .btn {
      padding: 8px 14px; border: 1px solid var(--divider-color); border-radius: 8px;
      background: var(--card-background-color); color: var(--primary-text-color);
      cursor: pointer; font-size: 12px; transition: all 0.2s;
      touch-action: manipulation;
    }
    .btn:hover { border-color: var(--primary-color); color: var(--primary-color); }
    .btn.danger { color: #f44336; border-color: #f44336; }
    .btn.danger:hover { background: #f44336; color: #fff; }
    .btn.sm { padding: 4px 10px; font-size: 11px; }

    .renamed-item .arrow { color: var(--primary-color); margin: 0 6px; }
    .renamed-item .old { text-decoration: line-through; color: var(--secondary-text-color); }
    .renamed-item .new { color: var(--primary-text-color); font-weight: 500; }

    .btn-group { display: flex; gap: 4px; flex-shrink: 0; align-items: center; }

    @media (max-width: 768px) {
      .section { padding: 14px; border-radius: 12px; }
      .btn { min-height: 44px; }
      .btn.sm { min-height: 36px; }
      .list-item { flex-wrap: wrap; gap: 6px; }
      .list-item .name { min-width: 0; }
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this._load();
  }

  async _load() {
    this.loading = true;
    try {
      this.config = (await api.getConfig()) || {};
    } catch(e) {
      console.error('Config load error', e);
    }
    this.loading = false;
  }

  async _removeArchivedRepo(repoName) {
    const ok = await ConfirmDialog.show(this, { message: `${t('confirmRemoveArchived')} ${repoName}?`, confirmText: t('removeArchived'), danger: true });
    if (!ok) return;
    try {
      await api.removeArchivedRepo(repoName);
      this._load();
    } catch(e) {
      showToast(`${t('removeRepoFailed')}: ${e.message}`, 'error');
    }
  }

  async _removeRenamedRepo(oldName) {
    const ok = await ConfirmDialog.show(this, { message: `${t('confirmRemoveRenamed')} ${oldName}?`, confirmText: t('removeRenamed'), danger: true });
    if (!ok) return;
    try {
      await api.removeRenamedRepo(oldName);
      this._load();
    } catch(e) {
      showToast(`${t('removeRepoFailed')}: ${e.message}`, 'error');
    }
  }

  render() {
    const archived = this.config.archived_repositories || [];
    const renamed = this.config.renamed_repositories || {};
    const ignored = this.config.ignored_repositories || [];

    return html`
      <!-- Archived Repositories -->
      <div class="section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
          ${t('archivedRepos')}
        </div>
        ${archived.length > 0 ? html`
          <div class="list">
            ${archived.map(r => html`
              <div class="list-item">
                <span class="name">${r}</span>
                <div class="btn-group">
                  <a class="btn sm" href="https://github.com/${r}" target="_blank" rel="noopener" @click=${(e) => e.stopPropagation()}>${t('viewOnGithub')}</a>
                  <button class="btn danger sm" @click=${() => this._removeArchivedRepo(r)}>${t('removeArchived')}</button>
                </div>
              </div>
            `)}
          </div>
        ` : html`<div class="empty">${t('noArchived')}</div>`}
      </div>

      <!-- Renamed Repositories -->
      <div class="section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
          ${t('renamedRepos')}
        </div>
        ${Object.keys(renamed).length > 0 ? html`
          <div class="list">
            ${Object.entries(renamed).map(([old, nw]) => html`
              <div class="list-item renamed-item">
                <span class="old">${old}</span>
                <span class="arrow">→</span>
                <span class="new">${nw}</span>
                <button class="btn danger sm" @click=${() => this._removeRenamedRepo(old)} style="margin-left:auto;">${t('removeRenamed')}</button>
              </div>
            `)}
          </div>
        ` : html`<div class="empty">${t('noRenamed')}</div>`}
      </div>

      <!-- Ignored Repositories -->
      <div class="section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          ${t('ignoredRepos')}
        </div>
        ${ignored.length > 0 ? html`
          <div class="list">
            ${ignored.map(r => html`
              <div class="list-item"><span class="name">${r}</span></div>
            `)}
          </div>
        ` : html`<div class="empty">${t('noIgnored')}</div>`}
      </div>
    `;
  }
}

customElements.define('config-view', ConfigView);
