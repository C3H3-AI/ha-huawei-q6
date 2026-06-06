import { LitElement, html, css } from 'lit';
import '../components/repo-card.js';
import { api } from '../api.js';
import { showToast } from '../hacs-vision-panel.js';
import { t } from '../i18n.js';
import { commonStyles } from '../shared/styles.js';
import { getCategoryColor } from '../shared/constants.js';
import { ConfirmDialog } from '../shared/confirm-dialog.js';

class InstalledView extends LitElement {
  static properties = {
    items: { type: Array },
    loading: { type: Boolean },
    search: { type: String },
    filterType: { type: String },
    _installingIds: { type: Object, state: true },
  };

  constructor() {
    super();
    this.items = [];
    this.loading = false;
    this.search = '';
    this.filterType = 'all';
    this._searchTimer = undefined;
    this._installingIds = {};
  }

  static styles = css`
    :host { display: block; touch-action: manipulation; }

    ${commonStyles}

    .filter-select {
      padding: 10px 14px; border: 1px solid var(--divider-color); border-radius: 10px;
      background: var(--card-background-color); color: var(--primary-text-color);
      font-size: 13px; cursor: pointer; outline: none;
    }

    @media (max-width: 768px) {
      .filter-select { padding: 8px 10px; font-size: 12px; }
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
    this.addEventListener('favorite', (e) => this._handleFavorite(e.detail));
  }

  async _load() {
    this.loading = true;
    try {
      const result = await api.getInstalled();
      this.items = Array.isArray(result) ? result : (result.installed || result.repositories || []);
    } catch(e) {
      console.error('Failed to load installed', e);
      this.items = [];
    }
    this.loading = false;
  }

  _getFiltered() {
    let list = [...this.items];
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(r => (r.full_name || r.name || '').toLowerCase().includes(q));
    }
    if (this.filterType !== 'all') {
      list = list.filter(r => (r.category || '') === this.filterType);
    }
    return list;
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
    this._installingIds = { ...this._installingIds };
    delete this._installingIds[repoId];
  }

  async _handleUpdate(repo) {
    const repoId = repo.id || repo.full_name;
    this._installingIds = { ...this._installingIds, [repoId]: true };
    try {
      await api.update([repoId]);
      showToast(`${t('updateComplete')}: ${repo.full_name || repo.name}`, 'success');
      this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
      this._load();
    } catch(e) {
      showToast(`${t('updateFailed')}: ${e.message}`, 'error');
    }
    this._installingIds = { ...this._installingIds };
    delete this._installingIds[repoId];
  }

  async _handleUninstall(repo) {
    const confirmed = await ConfirmDialog.show(this, {
      message: `${t('confirmRemove')} ${repo.full_name || repo.name}?`,
      confirmText: t('remove'),
      danger: true,
    });
    if (!confirmed) return;
    try {
      await api.remove(repo.id || repo.full_name);
      showToast(`${t('removed')} ${repo.full_name || repo.name}`, 'success');
      this._load();
      this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
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

  _handleFavorite(detail) {
    this.dispatchEvent(new CustomEvent('favorite', {
      detail,
      bubbles: true, composed: true,
    }));
  }

  _clearSearch() {
    this.search = '';
    const input = this.renderRoot?.querySelector('.search input');
    if (input) input.value = '';
  }

  render() {
    const filtered = this._getFiltered();

    return html`
      <div class="controls">
        <div class="search">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="${t('searchInstalled')}" .value=${this.search}
                 @input=${e => { clearTimeout(this._searchTimer); this._searchTimer = setTimeout(() => { this.search = e.target.value; }, 300); }}>
          ${this.search ? html`<button class="search-clear" @click=${this._clearSearch}>✕</button>` : ''}
        </div>
        <select class="filter-select" @change=${e => { this.filterType = e.target.value; }}>
          <option value="all">📋 ${t('allTypes')}</option>
          <option value="integration">🔌 ${t('catIntegration')}</option>
          <option value="plugin">🧩 ${t('catPlugin')}</option>
          <option value="theme">🎨 ${t('catTheme')}</option>
          <option value="appdaemon">🤖 ${t('catAppDaemon')}</option>
          <option value="python_script">🐍 ${t('catPython')}</option>
          <option value="template">📄 ${t('catTemplate')}</option>
        </select>
      </div>

      ${this.loading ? html`
        <div class="loading"><div class="spinner"></div><div>${t('loading')}</div></div>
      `: filtered.length === 0 ? html`
        <div class="empty">
          <div>${this.search ? t('noMatchInstalled') : t('noInstalled')}</div>
        </div>
      ` : html`
        <div class="info-bar">
          <span>${t('totalPrefix')} <span class="count">${filtered.length}</span> ${t('totalInstalled')}</span>
          <button class="btn" @click=${this._load}>${t('refresh')}</button>
        </div>

        <div class="grid">
          ${filtered.map(r => html`<repo-card .repo=${r} ._installing=${!!this._installingIds?.[r.id || r.full_name]}></repo-card>`)}
        </div>
      `}
    `;
  }
}

customElements.define('installed-view', InstalledView);
