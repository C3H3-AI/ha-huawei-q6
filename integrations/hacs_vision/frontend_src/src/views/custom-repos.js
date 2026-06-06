import { LitElement, html, css } from 'lit';
import '../components/repo-card.js';
import { api } from '../api.js';
import { showToast } from '../hacs-vision-panel.js';
import { t } from '../i18n.js';
import { commonStyles } from '../shared/styles.js';
import { ConfirmDialog } from '../shared/confirm-dialog.js';

class CustomReposView extends LitElement {
  static properties = {
    repos: { type: Array },
    loading: { type: Boolean },
    showAddForm: { type: Boolean },
    newRepoUrl: { type: String },
    newRepoCategory: { type: String },
    search: { type: String },
    _searchText: { type: String, state: true },
    _installingIds: { type: Object, state: true },
  };

  constructor() {
    super();
    this.repos = [];
    this.loading = false;
    this.showAddForm = false;
    this.newRepoUrl = '';
    this.newRepoCategory = 'integration';
    this.search = '';
    this._searchText = '';
    this._searchTimer = undefined;
    this._installingIds = {};
  }

  static styles = css`
    ${commonStyles}

    :host { display: block; touch-action: manipulation; overflow-x: hidden; }

    .add-form {
      margin-bottom: 14px; padding: 16px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 14px; background: var(--card-background-color, #fff);
    }
    .form-row { display: flex; gap: 8px; margin-bottom: 10px; }
    .form-input {
      flex: 1; padding: 10px 12px; border: 1px solid var(--divider-color);
      border-radius: 10px; font-size: 13px; background: var(--card-background-color);
      color: var(--primary-text-color); outline: none;
    }
    .form-input:focus { border-color: var(--primary-color, #03a9f4); }
    .form-select {
      padding: 10px 12px; border: 1px solid var(--divider-color); border-radius: 10px;
      font-size: 13px; background: var(--card-background-color);
      color: var(--primary-text-color); cursor: pointer; flex-shrink: 0;
    }
    .form-actions { display: flex; gap: 8px; }

    @media (max-width: 480px) {
      .form-row { flex-direction: column; }
      .form-input, .form-select { width: 100%; box-sizing: border-box; }
      .form-actions { flex-direction: column; }
      .form-actions .btn { width: 100%; min-height: 44px; justify-content: center; }
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this._load();
    this.addEventListener('install', (e) => this._handleInstall(e.detail.repo));
    this.addEventListener('update', (e) => this._handleUpdate(e.detail.repo));
    this.addEventListener('uninstall', (e) => this._handleUninstall(e.detail.repo));
    this.addEventListener('detail', (e) => this._handleDetail(e.detail.repo));
    this.addEventListener('readme', (e) => this._handleDetail(e.detail.repo));
  }

  async _load() {
    this.loading = true;
    try {
      const result = await api.getCustomRepos();
      const customList = result.custom_repositories || [];
      // Enrich with browse data for card display
      const browseResult = await api.listRepositories({ limit: 100 });
      const browseMap = {};
      for (const r of (browseResult.repositories || [])) {
        browseMap[r.full_name] = r;
      }
      this.repos = customList.map(cr => {
        const fullName = typeof cr === 'string' ? cr : (cr.repository || '');
        const category = typeof cr === 'string' ? 'integration' : (cr.category || 'integration');
        const installedVersion = typeof cr === 'object' ? cr.installed_version : undefined;
        const browseData = browseMap[fullName];
        if (browseData) {
          return { ...browseData, is_custom: true };
        }
        return {
          full_name: fullName,
          name: fullName.split('/').pop(),
          category,
          installed_version: installedVersion,
          installed: !!installedVersion,
          is_custom: true,
          description: '',
        };
      });
    } catch(e) {
      console.error('Custom repos load error', e);
      this.repos = [];
    }
    this.loading = false;
  }

  async _addRepo() {
    if (!this.newRepoUrl.trim()) return;
    try {
      const result = await api.addCustomRepo(this.newRepoUrl.trim(), this.newRepoCategory);
      if (result.success) {
        showToast(`${t('installComplete')}: ${this.newRepoUrl.trim()}`, 'success');
        this.newRepoUrl = '';
        this.showAddForm = false;
        this._load();
        this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
      } else {
        showToast(`${t('addFailed')}: ${result.error || 'unknown'}`, 'error');
      }
    } catch(e) {
      showToast(`${t('addFailed')}: ${e.message}`, 'error');
    }
  }

  async _handleInstall(repo) {
    const repoId = repo.id || repo.full_name;
    this._installingIds = { ...this._installingIds, [repoId]: true };
    try {
      await api.install(repoId, repo.category);
      showToast(`${t('installComplete')}: ${repo.full_name || repo.name}`, 'success');
      this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
      this._load();
    } catch(e) {
      showToast(`${t('installFailed')}: ${e.message}`, 'error');
    }
    delete this._installingIds[repoId];
    this._installingIds = { ...this._installingIds };
  }

  async _handleUpdate(repo) {
    try {
      await api.update([repo.id || repo.full_name]);
      this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
      this._load();
    } catch(e) {
      console.error('Update failed', e);
    }
  }

  async _handleUninstall(repo) {
    const ok = await ConfirmDialog.show(this, {
      message: `${t('confirmRemove')} ${repo.full_name || repo.name}?`,
      confirmText: t('remove'),
      danger: true,
    });
    if (!ok) return;
    try {
      await api.remove(repo.id || repo.full_name);
      showToast(t('removed'), 'success');
      this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
      this._load();
    } catch(e) {
      showToast(`${t('removeFailed')}: ${e.message}`, 'error');
    }
  }

  _handleDetail(repo) {
    this.dispatchEvent(new CustomEvent('detail', {
      detail: { repo },
      bubbles: true, composed: true,
    }));
  }

  _onSearch(e) {
    this._searchText = e.target.value;
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.search = this._searchText;
    }, 300);
  }

  _clearSearch() {
    this._searchText = '';
    this.search = '';
  }

  _getFiltered() {
    if (!this.search) return this.repos;
    const q = this.search.toLowerCase();
    return this.repos.filter(r =>
      (r.full_name || '').toLowerCase().includes(q) ||
      (r.name || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    );
  }

  render() {
    const filtered = this._getFiltered();

    return html`
      <!-- Controls -->
      <div class="controls">
        <div class="search">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="${t('searchPlaceholder')}" .value=${this._searchText} @input=${this._onSearch} />
          ${this.search ? html`<button class="search-clear" @click=${this._clearSearch}>✕</button>` : ''}
        </div>
        <button class="btn primary" @click=${() => { this.showAddForm = !this.showAddForm; }}>
          ${this.showAddForm ? t('cancel') : t('addCustomRepo')}
        </button>
      </div>

      <!-- Add Form -->
      ${this.showAddForm ? html`
        <div class="add-form">
          <div class="form-row">
            <input class="form-input" type="text" placeholder="${t('repoUrl')}"
                   .value=${this.newRepoUrl} @input=${e => { this.newRepoUrl = e.target.value; }}
                   @keydown=${e => { if (e.key === 'Enter') this._addRepo(); }}>
            <select class="form-select" .value=${this.newRepoCategory}
                    @change=${e => { this.newRepoCategory = e.target.value; }}>
              <option value="integration">${t('catIntegration')}</option>
              <option value="plugin">${t('catPlugin')}</option>
              <option value="theme">${t('catTheme')}</option>
              <option value="appdaemon">${t('catAppDaemon')}</option>
              <option value="python_script">${t('catPython')}</option>
              <option value="template">${t('catTemplate')}</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn primary" @click=${this._addRepo}>${t('add')}</button>
            <button class="btn" @click=${() => { this.showAddForm = false; }}>${t('cancel')}</button>
          </div>
        </div>
      ` : ''}

      <!-- Content -->
      ${this.loading ? html`
        <div class="loading"><div class="spinner"></div><div>${t('loading')}</div></div>
      ` : filtered.length === 0 ? html`
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <div>${t('noCustomRepos')}</div>
          <div style="font-size:12px;margin-top:8px;">${t('noCustomReposHint')}</div>
        </div>
      ` : html`
        <div class="info-bar">
          <span>${t('totalPrefix')} <span class="count">${filtered.length}</span> ${t('customRepos')}</span>
        </div>

        <div class="grid">
          ${filtered.map(r => html`<repo-card .repo=${r} ._installing=${!!this._installingIds?.[r.id || r.full_name]}></repo-card>`)}
        </div>
      `}
    `;
  }
}

customElements.define('custom-repos-view', CustomReposView);
