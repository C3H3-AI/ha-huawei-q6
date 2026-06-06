import { LitElement, html, css } from 'lit';
import { api } from '../api.js';
import { showToast } from '../hacs-vision-panel.js';
import { t } from '../i18n.js';
import { commonStyles } from '../shared/styles.js';
import { ConfirmDialog } from '../shared/confirm-dialog.js';

class UpdatesView extends LitElement {
  static properties = {
    updates: { type: Array },
    loading: { type: Boolean },
    updating: { type: Boolean },
    search: { type: String },
    _installingIds: { type: Object, state: true },
    _changelogs: { type: Object, state: true },
    _searchText: { type: String, state: true },
    _selectedIds: { type: Object, state: true },
  };

  constructor() {
    super();
    this.updates = [];
    this.loading = false;
    this.updating = false;
    this.search = '';
    this._searchTimer = null;
    this._installingIds = {};
    this._changelogs = {};
    this._searchText = '';
    this._selectedIds = {};
  }

  static styles = [
    commonStyles,
    css`
      :host { display: block; touch-action: manipulation; }

      .search { min-width: 160px; }

      .card {
        border: 1px solid var(--divider-color); border-radius: 14px;
        background: var(--card-background-color); overflow: hidden;
        padding: 16px; transition: all 0.2s; cursor: pointer;
        display: flex; flex-direction: column; min-height: 220px;
      }
      .card:hover { border-color: var(--primary-color); }

      .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
      .card-left { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
      .card-name { font-size: 14px; font-weight: 600; color: var(--primary-text-color); word-break: break-all; }
      .card-name .category-badge {
        display: inline-block; font-size: 9px; padding: 2px 7px;
        border-radius: 4px; background: rgba(var(--rgb-primary-color), 0.08);
        color: var(--primary-color); margin-left: 6px; vertical-align: middle;
      }

      .version-row { display: flex; gap: 12px; margin-bottom: 12px; }
      .version-item { flex: 1; text-align: center; padding: 8px; border-radius: 8px; background: var(--secondary-background-color); }
      .version-label { font-size: 10px; color: var(--secondary-text-color); text-transform: uppercase; margin-bottom: 4px; }
      .version-value { font-size: 14px; font-weight: 700; }
      .version-value.old { color: var(--warning-color, #ff8f00); }
      .version-value.new { color: var(--success-color, #0f9d58); }

      .card-desc { font-size: 12px; color: var(--secondary-text-color); margin-bottom: 12px; line-height: 1.5; }

      /* Multi-select checkbox */
      .checkbox {
        width: 18px; height: 18px; border-radius: 4px;
        border: 2px solid var(--secondary-text-color); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; transition: all 0.2s; background: transparent;
        -webkit-appearance: none; appearance: none; touch-action: manipulation;
      }
      .checkbox:checked {
        background: var(--primary-color); border-color: var(--primary-color);
      }
      .checkbox:checked::after {
        content: '✓'; color: #fff; font-size: 12px; font-weight: 700;
      }
      .select-all {
        display: flex; align-items: center; gap: 6px;
        font-size: 12px; color: var(--secondary-text-color); cursor: pointer;
        touch-action: manipulation; user-select: none;
      }
      .select-all:hover { color: var(--primary-text-color); }

      .btn.primary { width: 100%; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-top: auto; }
      .btn.primary:hover { opacity: 0.9; }
      /* F3: Progress button pulse */
      .btn.primary.installing {
        opacity: 0.7; cursor: not-allowed;
        animation: btnPulse 1.5s infinite;
      }
      @keyframes btnPulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 0.45; } }

      /* F6: Changelog preview */
      .changelog-preview {
        margin-top: 8px; padding: 10px 12px;
        background: var(--secondary-background-color);
        border-radius: 8px; font-size: 12px;
      }
      .changelog-preview-title { font-weight: 600; margin-bottom: 6px; color: var(--primary-text-color); }
      .changelog-preview-body {
        color: var(--secondary-text-color); white-space: pre-wrap;
        line-height: 1.5; max-height: 80px; overflow: hidden;
      }
      .changelog-preview-link {
        color: var(--primary-color); font-size: 11px; text-decoration: none;
        display: inline-block; margin-top: 6px;
      }
      .changelog-preview-link:hover { text-decoration: underline; }

      .update-all-bar {
        display: flex; justify-content: flex-end; margin-bottom: 12px;
      }
      .update-all-btn {
        padding: 10px 20px; border-radius: 10px;
        background: var(--primary-color); color: #fff; border: none;
        font-size: 13px; font-weight: 600; cursor: pointer;
        display: flex; align-items: center; gap: 6px; transition: opacity 0.2s;
        touch-action: manipulation;
      }
      .update-all-btn:hover { opacity: 0.9; }
      .update-all-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      @media (max-width: 768px) {
        .search { min-width: 0; }
        .card { padding: 12px; }
        .version-row { gap: 8px; }
        .version-item { padding: 6px; }
        .version-label { font-size: 9px; }
        .version-value { font-size: 12px; }
        .card-desc { font-size: 11px; margin-bottom: 10px; }
        .btn.primary { min-height: 44px; }
        .update-all-bar { justify-content: stretch; }
        .update-all-btn { width: 100%; justify-content: center; min-height: 44px; }
      }
    `
  ];

  async connectedCallback() {
    super.connectedCallback();
    await this._load();
  }

  async _load() {
    this.loading = true;
    try {
      const result = await api.getUpdates();
      this.updates = Array.isArray(result) ? result : (result.updates || []);
      // F6: Load changelogs asynchronously
      this._loadChangelogs();
    } catch(e) {
      console.error('Failed to load updates', e);
      this.updates = [];
    }
    this.loading = false;
  }

  /* F6: Load changelogs for all updates — parallel */
  async _loadChangelogs() {
    const repos = this.updates.filter(r => r.full_name);
    if (repos.length === 0) return;
    const results = await Promise.allSettled(
      repos.map(r =>
        api.getChangelog(r.full_name).then(data => ({ fullName: r.full_name, data }))
      )
    );
    const logs = {};
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.data?.body) {
        logs[r.value.fullName] = r.value.data;
      }
    }
    if (Object.keys(logs).length > 0) {
      this._changelogs = { ...this._changelogs, ...logs };
    }
  }

  /* Multi-select: update only selected repos */
  async _updateSelected() {
    const ids = Object.keys(this._selectedIds).filter(k => this._selectedIds[k]);
    if (ids.length === 0) return;
    const confirmed = await ConfirmDialog.show(this, {
      message: `${t('confirmUpdateAll')} ${ids.length}?`,
      confirmText: t('confirmUpdate'),
      danger: false,
    });
    if (!confirmed) return;
    this.updating = true;
    try {
      await api.update(ids);
      showToast(`${t('allUpdatesStarted')} (${ids.length})`, 'success');
      this._selectedIds = {};
      this._load();
      this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
    } catch(e) {
      showToast(`${t('updateFailed')}: ${e.message}`, 'error');
    }
    this.updating = false;
  }

  _toggleSelect(repoId) {
    this._selectedIds = { ...this._selectedIds, [repoId]: !this._selectedIds[repoId] };
  }

  _toggleSelectAll() {
    const filtered = this._getFiltered();
    if (this._isAllSelected()) {
      this._selectedIds = {};
    } else {
      const sel = {};
      for (const r of filtered) {
        sel[r.id || r.full_name] = true;
      }
      this._selectedIds = sel;
    }
  }

  _isAllSelected() {
    const filtered = this._getFiltered();
    if (filtered.length === 0) return false;
    return filtered.every(r => this._selectedIds[r.id || r.full_name]);
  }

  _selectedCount() {
    return Object.keys(this._selectedIds).filter(k => this._selectedIds[k]).length;
  }

  /* F3: Single update with progress indicator + polling */
  async _updateOne(repo) {
    const repoId = repo.id || repo.full_name;
    this._installingIds = { ...this._installingIds, [repoId]: true };
    try {
      await api.update([repoId]);
      // Poll for completion
      const targetVer = repo.latest_version;
      let attempts = 0;
      const poll = async () => {
        if (attempts++ > 30) {
          this._installingIds = { ...this._installingIds };
          delete this._installingIds[repoId];
          showToast(`${t('installFailed')}: timeout`, 'error');
          return;
        }
        try {
          const status = await api.getRepoStatus(repoId);
          if (status?.installed_version === targetVer || (status?.installed && !status?.has_update)) {
            this._installingIds = { ...this._installingIds };
            delete this._installingIds[repoId];
            showToast(`${t('updateComplete')}: ${repo.full_name || repo.name}`, 'success');
            this._load();
            this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
            return;
          }
        } catch(e) {}
        setTimeout(poll, 2000);
      };
      setTimeout(poll, 2000);
    } catch(e) {
      this._installingIds = { ...this._installingIds };
      delete this._installingIds[repoId];
      showToast(`${t('updateFailed')}: ${e.message}`, 'error');
    }
  }

  _getFiltered() {
    if (!this.search) return this.updates;
    const q = this.search.toLowerCase();
    return this.updates.filter(r => (r.full_name || r.name || '').toLowerCase().includes(q));
  }

  _clearSearch() {
    this._searchText = '';
    this.search = '';
    if (this._searchTimer) {
      clearTimeout(this._searchTimer);
      this._searchTimer = null;
    }
  }

  _openDetail(repo) {
    this.dispatchEvent(new CustomEvent('detail', { detail: { repo }, bubbles: true, composed: true }));
  }

  render() {
    const filtered = this._getFiltered();

    return html`
      <div class="controls">
        <div class="search">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="${t('searchUpdates')}" .value=${this._searchText || ''}
                 @input=${e => {
                   this._searchText = e.target.value;
                   clearTimeout(this._searchTimer);
                   this._searchTimer = setTimeout(() => { this.search = this._searchText; }, 300);
                 }}>
          ${this.search ? html`
            <button class="search-clear" @click=${this._clearSearch}>✕</button>
          ` : ''}
        </div>
      </div>

      ${this.loading ? html`
        <div class="loading"><div class="spinner"></div><div>${t('checkingUpdates')}</div></div>
      ` : this.updates.length === 0 ? html`
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <div>${t('allUpToDate')}</div>
        </div>
      ` : html`
        <div class="info-bar">
          <div style="display:flex;align-items:center;gap:8px;">
            <label class="select-all">
              <input type="checkbox" class="checkbox" .checked=${this._isAllSelected()}
                     @click=${(e) => e.stopPropagation()}
                     @change=${this._toggleSelectAll}>
              ${t('selectAll') || '全选'}
            </label>
            <span>${t('totalPrefix')} <span class="count">${this.updates.length}</span> ${t('totalUpdates')}</span>
          </div>
          <button class="btn" @click=${this._load}>${t('refresh')}</button>
        </div>

        ${this.updates.length > 1 ? html`
          <div class="update-all-bar">
            <button class="update-all-btn" @click=${this._updateSelected} ?disabled=${this.updating || this._selectedCount() === 0}>
              ⬆ ${this.updating ? t('updatingProgress') : `${t('updateAll')} (${this._selectedCount() || 0})`}
            </button>
          </div>
        ` : ''}

        <div class="grid">
          ${filtered.map(r => {
            const repoId = r.id || r.full_name;
            const isInstalling = !!this._installingIds?.[repoId];
            const changelog = this._changelogs?.[r.full_name];
            const isChecked = !!this._selectedIds[repoId];
            return html`
            <div class="card" @click=${(e) => { if (e.target.closest('.btn') || e.target.closest('a') || e.target.closest('.checkbox')) return; this._openDetail(r); }}>
              <div class="card-header">
                <div class="card-left">
                  <input type="checkbox" class="checkbox" .checked=${isChecked}
                         @click=${(e) => e.stopPropagation()}
                         @change=${() => this._toggleSelect(repoId)}>
                  <div class="card-name">
                    ${r.name || r.full_name}
                    ${r.category ? html`<span class="category-badge">${r.category}</span>` : ''}
                  </div>
                </div>
              </div>
              <div class="version-row">
                <div class="version-item">
                  <div class="version-label">${t('currentVersion')}</div>
                  <div class="version-value old">${r.installed_version || '?'}</div>
                </div>
                <div class="version-item">
                  <div class="version-label">${t('latestVersion')}</div>
                  <div class="version-value new">${r.latest_version || '?'}</div>
                </div>
              </div>
              <div class="card-desc">${r.description || ''}</div>

              <!-- F6: Changelog preview -->
              ${changelog?.body ? html`
                <div class="changelog-preview">
                  <div class="changelog-preview-title">${t('changelogTitle')} ${changelog.tag ? html`<small>(${changelog.tag})</small>` : ''}</div>
                  <div class="changelog-preview-body">${changelog.body}</div>
                  <a class="changelog-preview-link" href="${changelog.url || `https://github.com/${r.full_name}/releases`}" target="_blank" rel="noopener">${t('viewFullChangelog')} →</a>
                </div>
              ` : ''}

              <!-- F3: Progress button -->
              <button class="btn primary ${isInstalling ? 'installing' : ''}"
                      @click=${() => this._updateOne(r)} ?disabled=${isInstalling || this.updating}>
                ${isInstalling
                  ? html`⏳ ${t('updatingProgress')}`
                  : html`⬆ ${t('updateNow')}`}
              </button>
            </div>
          `;})}
        </div>
      `}
    `;
  }
}

customElements.define('updates-view', UpdatesView);
