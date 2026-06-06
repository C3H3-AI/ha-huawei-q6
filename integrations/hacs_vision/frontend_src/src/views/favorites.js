import { LitElement, html, css } from 'lit';
import '../components/repo-card.js';
import { api } from '../api.js';
import { showToast } from '../hacs-vision-panel.js';
import { t } from '../i18n.js';
import { commonStyles } from '../shared/styles.js';
import { ConfirmDialog } from '../shared/confirm-dialog.js';

class FavoritesView extends LitElement {
  static properties = {
    repos: { type: Array },
    loading: { type: Boolean },
    _refreshKey: { type: Number, state: true },
    _installingIds: { type: Object, state: true },
    _favorites: { type: Array, state: true },
  };

  constructor() {
    super();
    this.repos = [];
    this.loading = false;
    this._refreshKey = 0;
    this._installingIds = {};
    this._favorites = [];
  }

  static styles = css`
    :host { display: block; touch-action: manipulation; }

    ${commonStyles}

    .empty .hint { font-size: 13px; margin-top: 8px; color: var(--secondary-text-color); }

    .clear-all-btn {
      padding: 6px 12px; border: 1px solid var(--divider-color); border-radius: 8px;
      background: var(--card-background-color); color: var(--secondary-text-color);
      cursor: pointer; font-size: 12px; transition: all 0.2s;
      touch-action: manipulation;
    }
    .clear-all-btn:hover { border-color: #f44336; color: #f44336; }
  `;

  async connectedCallback() {
    super.connectedCallback();
    this.addEventListener('install', (e) => this._handleInstall(e.detail.repo));
    this.addEventListener('update', (e) => this._handleUpdate(e.detail.repo));
    this.addEventListener('uninstall', (e) => this._handleUninstall(e.detail.repo));
    this.addEventListener('detail', (e) => this._handleDetail(e.detail.repo));
    this.addEventListener('favorite', (e) => this._handleFavorite(e.detail));
    await this._load();
  }

  async _load() {
    try {
      const result = await api.getFavorites();
      const favIds = Array.isArray(result) ? result : (result.favorites || []);
      this._favorites = favIds;
    } catch(e) {
      this._favorites = [];
    }

    if (this._favorites.length === 0) {
      this.repos = [];
      return;
    }

    this.loading = true;
    try {
      // Load installed repos and filter by favorites
      const installedResult = await api.getInstalled();
      const installedRepos = Array.isArray(installedResult) ? installedResult : (installedResult.installed || installedResult.repositories || []);
      const installedFavs = installedRepos.filter(r => this._favorites.includes(r.id || r.full_name));
      const foundIds = new Set(installedFavs.map(r => r.id || r.full_name));

      // Also load from browse to find uninstalled favorites
      const browseResult = await api.listRepositories({ limit: 200 });
      const browseRepos = browseResult.repositories || [];
      const browseFavs = browseRepos
        .filter(r => this._favorites.includes(r.id || r.full_name) && !foundIds.has(r.id || r.full_name))
        .map(r => ({ ...r, installed: false }));

      this.repos = [...installedFavs, ...browseFavs];
    } catch(e) {
      console.error('Favorites load error', e);
      this.repos = [];
    }
    this.loading = false;
  }

  /* F3: Install with progress */
  async _handleInstall(repo) {
    const repoId = repo.id || repo.full_name;
    this._installingIds = { ...this._installingIds, [repoId]: true };
    try {
      await api.install(repoId, repo.category);
      showToast(`${t('installComplete')}: ${repo.full_name || repo.name}`, 'success');
      this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
      this._load();
    } catch(e) {
      console.error('Install failed', e);
      showToast(`${t('installFailed')}: ${e.message}`, 'error');
    }
    this._installingIds = { ...this._installingIds };
    delete this._installingIds[repoId];
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
    const confirmed = await ConfirmDialog.show(this, {
      message: `${t('confirmRemove')} ${repo.full_name || repo.name}?`,
      confirmText: t('remove'),
      danger: true,
    });
    if (!confirmed) return;
    try {
      await api.remove(repo.id || repo.full_name);
      this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
      this._load();
    } catch(e) {
      console.error('Uninstall failed', e);
    }
  }

  _handleDetail(repo) {
    this.dispatchEvent(new CustomEvent('detail', {
      detail: { repo },
      bubbles: true, composed: true,
    }));
  }

  _handleFavorite(detail) {
    // If unfavorited, remove from list
    if (!detail.isFavorite) {
      this.repos = this.repos.filter(r => (r.id || r.full_name) !== (detail.repo.id || detail.repo.full_name));
    }
    // Bubble up to panel for count update
    this.dispatchEvent(new CustomEvent('favorite', {
      detail,
      bubbles: true, composed: true,
    }));
  }

  async _clearAll() {
    const confirmed = await ConfirmDialog.show(this, {
      message: t('confirmClear'),
      confirmText: t('confirm'),
      danger: true,
    });
    if (!confirmed) return;
    try {
      await api.setFavorites([]);
    } catch(e) {}
    this._favorites = [];
    this.repos = [];
    this.dispatchEvent(new CustomEvent('favorite', {
      detail: { isFavorite: false },
      bubbles: true, composed: true,
    }));
    showToast(t('favoritesCleared'), 'success');
  }

  render() {
    return html`
      ${this.loading ? html`
        <div class="loading">
          <div class="spinner"></div>
          <div>${t('loading')}</div>
        </div>
      ` : this.repos.length === 0 ? html`
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <div>${t('noFavorites')}</div>
          <div class="hint">${t('noFavoritesHint')}</div>
        </div>
      ` : html`
        <div class="info-bar">
          <span>${t('totalPrefix')} <span class="count">${this.repos.length}</span> ${t('totalRepos')}</span>
          <button class="clear-all-btn" @click=${this._clearAll}>${t('clearAll')}</button>
        </div>

        <div class="grid">
          ${this.repos.map(r => {
            const repoId = r.id || r.full_name;
            return html`<repo-card .repo=${r} ._installing=${!!this._installingIds?.[repoId]}></repo-card>`;
          })}
        </div>
      `}
    `;
  }
}

customElements.define('favorites-view', FavoritesView);
