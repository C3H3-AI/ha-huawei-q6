import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { api } from '../api.js';
import { t } from '../i18n.js';
import { showToast } from '../hacs-vision-panel.js';
import { ConfirmDialog } from '../shared/confirm-dialog.js';

export class ManagementView extends LitElement {
  static properties = {
    customRepos: { type: Array },
    archivedRepos: { type: Array },
    ignoredRepos: { type: Array },
    renamedEntries: { type: Array },
    loading: { type: Boolean },
    _customRepoUrl: { type: String },
    _customRepoCategory: { type: String },
    _showAddCustom: { type: Boolean },
    _addingCustom: { type: Boolean },
    erLoading: { type: Boolean },
    iLoading: { type: Boolean },
    importing: { type: Boolean },
    exporting: { type: Boolean },
    _viewMode: { type: String },
    _collapsed: { type: Object },
    _renamedRefreshing: { type: Boolean },
    _depResults: { type: Object },
    _depLoading: { type: Boolean },
  };

  constructor() {
    super();
    this.customRepos = [];
    this.archivedRepos = [];
    this.ignoredRepos = [];
    this.renamedEntries = [];
    this.loading = false;
    this.exporting = false;
    this.importing = false;
    this._depResults = null;
    this._depLoading = false;
    this._renamedRefreshing = false;
    this._showAddCustom = false;
    this._customRepoUrl = '';
    this._customRepoCategory = 'integration';
    this._addingCustom = false;
    this._viewMode = 'card';
    this._collapsed = {
      customRepos: false,
      archived: false,
      ignored: false,
      tools: false,
    };
  }

  static styles = css`
    :host { display: block; touch-action: manipulation; }

    /* ===== Section Base ===== */
    .section {
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 14px; padding: 20px; margin-bottom: 16px;
    }
    .section-title {
      font-size: 15px; font-weight: 700; color: var(--primary-text-color);
      display: flex; align-items: center; gap: 8px; flex: 1;
    }
    .section-title svg { width: 20px; height: 20px; color: var(--primary-color); flex-shrink: 0; }
    .section-desc { font-size: 13px; color: var(--secondary-text-color); margin-bottom: 16px; line-height: 1.6; }

    /* ===== Collapsible ===== */
    .section-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
      cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent;
    }
    .section-header .arrow {
      width: 18px; height: 18px; transition: transform 0.25s; flex-shrink: 0;
      color: var(--secondary-text-color);
    }
    .section-header .arrow.open { transform: rotate(0deg); }
    .section-header .arrow.closed { transform: rotate(-90deg); }
    .section-content { overflow: hidden; }
    .section-content.collapsed { display: none; }

    /* ===== View Toggle ===== */
    .view-toggle {
      display: flex; gap: 2px;
      background: var(--secondary-background-color, #f0f0f0);
      border-radius: 8px; padding: 2px; flex-shrink: 0;
    }
    .view-toggle button {
      border: none; background: none; padding: 4px 10px; border-radius: 6px;
      cursor: pointer; font-size: 11px; color: var(--secondary-text-color);
      transition: all 0.2s; font-family: inherit;
    }
    .view-toggle button.active {
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* ===== List View (enhanced) ===== */
    .repo-list { display: flex; flex-direction: column; gap: 8px; }
    .repo-item {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 12px 14px; border: 1px solid var(--divider-color);
      border-radius: 10px; font-size: 13px; transition: all 0.2s; gap: 12px;
      cursor: pointer;
    }
    .repo-item:hover { border-color: var(--primary-color); }
    .repo-info { flex: 1; min-width: 0; }
    .repo-top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
    .repo-name { color: var(--primary-text-color); font-weight: 600; font-size: 14px; }
    .repo-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 11px; color: var(--secondary-text-color); margin-bottom: 4px; }
    .repo-fullname { color: var(--secondary-text-color); }
    .repo-version { color: var(--text-primary-color); }
    .repo-not-installed { color: var(--secondary-text-color); font-style: italic; font-size: 10px; }
    .update-badge { color: #f44336; font-weight: 600; }
    .repo-stars { color: #f9a825; }
    .repo-desc { font-size: 12px; color: var(--secondary-text-color); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 2px; }
    .repo-actions { display: flex; gap: 4px; flex-shrink: 0; align-items: center; flex-wrap: wrap; }

    .category-badge {
      display: inline-block; padding: 1px 8px; border-radius: 4px;
      font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .category-badge.integration { background: #e8f5e9; color: #2e7d32; }
    .category-badge.plugin { background: #fff3e0; color: #e65100; }
    .category-badge.theme { background: #f3e5f5; color: #7b1fa2; }
    .category-badge.python_script { background: #e3f2fd; color: #1565c0; }
    .category-badge.template { background: #fce4ec; color: #c62828; }
    .category-badge.appdaemon { background: #e0f2f1; color: #00695c; }
    .category-badge.netdaemon { background: #ede7f6; color: #4527a0; }
    .category-badge.dashboard { background: #fff8e1; color: #f57f17; }

    .renamed-badge {
      display: inline-flex; align-items: center; gap: 3px;
      padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;
      background: #fff3e0; color: #e65100; letter-spacing: 0.3px;
    }
    .section-badge {
      display: inline-flex; align-items: center; padding: 2px 10px;
      border-radius: 10px; font-size: 11px; font-weight: 500;
      background: var(--primary-color); color: #fff;
    }

    /* ===== Card View ===== */
    .repo-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }
    .repo-card {
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 14px; overflow: hidden;
      transition: border-color 0.2s, box-shadow 0.2s; cursor: pointer;
      display: flex; flex-direction: column; position: relative;
    }
    .repo-card:hover { border-color: var(--primary-color, #03a9f4); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .repo-card-img {
      height: 100px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      position: relative;
    }
    .repo-card-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700; color: #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .repo-card-badge-cat {
      position: absolute; top: 10px; left: 10px;
      padding: 3px 8px; border-radius: 6px;
      font-size: 10px; font-weight: 600; color: #fff; text-transform: uppercase;
    }
    .repo-card-actions-img {
      position: absolute; top: 10px; right: 10px; z-index: 2;
    }
    .repo-card-actions-img .btn-icon {
      width: 30px; height: 30px;
      background: rgba(255,255,255,0.85); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: none; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.12);
      padding: 0; color: var(--secondary-text-color);
      transition: all 0.2s;
    }
    .repo-card-actions-img .btn-icon:hover { color: #f44336; }
    .repo-card-installed {
      position: absolute; bottom: 10px; left: 10px;
      padding: 2px 8px; border-radius: 6px;
      font-size: 10px; font-weight: 600;
      background: rgba(76,175,80,0.15); color: #4caf50;
    }
    .repo-card-body { padding: 12px; flex: 1; display: flex; flex-direction: column; }
    .repo-card-body .name {
      font-size: 14px; font-weight: 600; color: var(--primary-text-color);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px;
    }
    .repo-card-body .fullname {
      font-size: 11px; color: var(--secondary-text-color);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px;
    }
    .repo-card-body .desc {
      font-size: 12px; color: var(--secondary-text-color);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden; margin-bottom: 8px; line-height: 1.5; height: 36px;
    }
    .repo-card-body .meta {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 4px; margin-top: auto;
    }
    .repo-card-body .meta .stars {
      display: flex; align-items: center; gap: 3px;
      font-size: 11px; color: var(--secondary-text-color);
    }
    .repo-card-renamed {
      position: absolute; top: 10px; right: 48px; z-index: 2;
      padding: 3px 8px; border-radius: 6px; font-size: 9px; font-weight: 600;
      background: #fff3e0; color: #e65100;
    }

    /* ===== Buttons ===== */
    .btn {
      padding: 8px 14px; border: 1px solid var(--divider-color); border-radius: 8px;
      background: var(--card-background-color); color: var(--primary-text-color);
      cursor: pointer; font-size: 12px; transition: all 0.2s;
      touch-action: manipulation; display: inline-flex; align-items: center; gap: 8px; font-family: inherit;
    }
    .btn:hover { border-color: var(--primary-color); color: var(--primary-color); }
    .btn.primary { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
    .btn.primary:hover { opacity: 0.9; }
    .btn.danger { color: #f44336; border-color: #f44336; }
    .btn.danger:hover { background: #f44336; color: #fff; }
    .btn.sm { padding: 4px 10px; font-size: 11px; }
    .btn-icon {
      width: 32px; height: 32px; padding: 0; display: inline-flex;
      align-items: center; justify-content: center; border-radius: 8px;
      border: 1px solid var(--divider-color); cursor: pointer;
      color: var(--primary-text-color); transition: all 0.2s; text-decoration: none;
    }
    .btn-icon:hover { border-color: var(--primary-color); color: var(--primary-color); }

    .edit-input {
      padding: 6px 10px; border: 1px solid var(--primary-color); border-radius: 6px;
      font-size: 13px; background: var(--card-background-color);
      color: var(--primary-text-color); outline: none; flex: 1; min-width: 0; font-family: inherit;
    }
    .edit-input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 2px rgba(var(--rgb-primary-color), 0.15); }

    .btn-group { display: flex; gap: 4px; flex-shrink: 0; align-items: center; }
    .btn-group-wide { display: flex; gap: 12px; flex-wrap: wrap; }

    .empty { font-size: 13px; color: var(--secondary-text-color); padding: 8px 0; }

    /* ===== Add Form ===== */
    .add-form {
      padding: 14px; border: 1px dashed var(--primary-color);
      border-radius: 10px; background: rgba(var(--rgb-primary-color, 0, 123, 255), 0.04);
      margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px;
    }
    .add-form-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .add-form-controls select { flex: 0 0 auto; max-width: 160px; }
    .add-preview { font-size: 12px; color: var(--secondary-text-color); padding: 4px 2px; }
    .add-error { color: #f44336; }

    /* ===== Dep Check Results ===== */
    .dep-panel {
      margin-top:12px;padding:12px 14px;border-radius:10px;font-size:13px;
      background:var(--secondary-background-color);
    }
    .dep-summary { display:flex;justify-content:space-between;align-items:center;margin-bottom:8px; }
    .dep-summary .title { font-weight:600;color:var(--primary-text-color); }
    .dep-summary .issues { color:#f44336;font-weight:600; }
    .dep-item {
      margin-top:8px;padding:10px 12px;border-radius:8px;
      background:var(--card-background-color);border:1px solid var(--divider-color);
    }
    .dep-item .repo { font-weight:500;color:var(--primary-text-color);margin-bottom:4px; }
    .dep-item .missing { font-size:11px;color:#f44336; }
    .dep-ok { color:var(--success-color,#0f9d58);font-weight:500; }

    /* ===== Mobile ===== */
    @media (max-width: 768px) {
      .section { padding: 14px; border-radius: 12px; }
      .btn { min-height: 44px; }
      .btn.sm { min-height: 36px; }
      .btn-group-wide { flex-direction: column; gap: 8px; }
      .btn-group-wide .btn { width: 100%; justify-content: center; }
      .repo-item { flex-direction: column; gap: 8px; padding: 10px 12px; }
      .repo-actions { width: 100%; justify-content: flex-end; }
      .repo-name { font-size: 13px; }
      .repo-meta { font-size: 10px; }
      .repo-desc { font-size: 11px; }
      .repo-cards { grid-template-columns: 1fr; }
      .repo-card-img { height: 80px; }
      .repo-card-avatar { width: 36px; height: 36px; font-size: 16px; }
      .add-form { padding: 10px; }
      .add-form-controls { flex-direction: column; align-items: stretch; }
      .add-form-controls select { max-width: 100%; }
      .add-form-controls .btn { width: 100%; justify-content: center; }
      .section-badge { font-size: 10px; padding: 1px 8px; }
      .category-badge { font-size: 9px; padding: 1px 6px; }
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this._load();
  }

  async _load() {
    this.loading = true;
    try {
      const config = (await api.getConfig()) || {};
      this.archivedRepos = config.archived_repositories || [];
      this.ignoredRepos = config.ignored_repositories || [];
      this.renamedEntries = Object.entries(config.renamed_repositories || {});
      const customResult = await api.getCustomRepos();
      this.customRepos = Array.isArray(customResult) ? customResult : (customResult.custom_repositories || []);
    } catch(e) {
      console.error('Config load error', e);
    }
    this.loading = false;
  }

  async _removeArchivedRepo(repoName) {
    const ok = await ConfirmDialog.show(this, {
      message: `${t('confirmRemoveArchived')} ${repoName}?`,
      confirmText: t('removeArchived'), danger: true,
    });
    if (!ok) return;
    try {
      await api.removeArchivedRepo(repoName);
      this._load();
    } catch(e) {
      showToast(`${t('removeRepoFailed')}: ${e.message}`, 'error');
    }
  }

  async _removeRenamedRepo(oldName) {
    const ok = await ConfirmDialog.show(this, {
      message: `${t('confirmRemoveRenamed')} ${oldName}?`,
      confirmText: t('removeRenamed'), danger: true,
    });
    if (!ok) return;
    try {
      await api.removeRenamedRepo(oldName);
      this._load();
    } catch(e) {
      showToast(`${t('removeRepoFailed')}: ${e.message}`, 'error');
    }
  }

  async _replaceRenamedOneClick(oldName, newName) {
    const ok = await ConfirmDialog.show(this, {
      message: `${t('confirmReplaceRenamed')}: ${oldName} → ${newName}${t('replaceRenamedWarning')}?`,
      confirmText: t('replace'), danger: true,
    });
    if (!ok) return;
    this._renamedRefreshing = true;
    try {
      await api.replaceRenamedRepo(oldName, newName);
      showToast(`${t('replace')}: ${oldName} → ${newName}`, 'success');
      await api.refresh();
      this._load();
      this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
    } catch(e) {
      showToast(`${t('updateFailed')}: ${e.message}`, 'error');
    }
    this._renamedRefreshing = false;
  }

  async _checkDependencies() {
    this._depLoading = true;
    try {
      const result = await api.checkDependencies();
      this._depResults = result;
      if (result.all_ok) showToast(t('depOk'), 'success');
      else showToast(`${t('depMissing')} (${result.issues_count})`, 'error');
    } catch(e) {
      this._depResults = null;
      showToast(`${t('checkFailed')}: ${e.message}`, 'error');
    }
    this._depLoading = false;
  }

  _depMissingCount() {
    if (!this._depResults?.dependencies) return 0;
    return this._depResults.dependencies.filter(r => r.has_issues).length;
  }

  async _export() {
    this.exporting = true;
    try {
      const data = await api.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `hacs-vision-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(url);
      showToast(t('exportSuccess'), 'success');
    } catch(e) {
      showToast(`${t('exportFailed')}: ${e.message}`, 'error');
    }
    this.exporting = false;
  }

  async _import() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
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

  _toggleAddCustom() {
    this._showAddCustom = !this._showAddCustom;
    if (!this._showAddCustom) {
      this._customRepoUrl = '';
      this._customRepoCategory = 'integration';
    }
  }

  _parseRepoUrl(url) {
    url = url.trim();
    const match = url.match(/github\.com\/([^/]+\/[^/\s?#]+)/i);
    if (match) return match[1].replace(/\.git$/, '');
    if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(url)) return url;
    return null;
  }

  async _addCustomRepo() {
    const fullName = this._parseRepoUrl(this._customRepoUrl);
    if (!fullName) { showToast(t('invalidRepoUrl'), 'error'); return; }
    const exists = this.customRepos.some(r => (r.full_name || r.repository) === fullName);
    if (exists) { showToast(`⚠️ ${fullName} ${t('alreadyExists')}`, 'error'); return; }
    this._addingCustom = true;
    try {
      const result = await api.addCustomRepo(fullName, this._customRepoCategory);
      if (result.success) {
        showToast(`${t('addSuccess')}: ${fullName}`, 'success');
        this._customRepoUrl = '';
        this._load();
        this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
      } else showToast(`${t('addFailed')}: ${result.error}`, 'error');
    } catch(e) { showToast(`${t('addFailed')}: ${e.message}`, 'error'); }
    this._addingCustom = false;
  }

  async _removeCustomRepo(repoName, category) {
    const ok = await ConfirmDialog.show(this, {
      message: `${t('confirmRemoveRepo')} ${repoName}?`,
      confirmText: t('remove'), danger: true,
    });
    if (!ok) return;
    try {
      await api.removeCustomRepo(repoName);
      this._load();
      this.dispatchEvent(new CustomEvent('refresh-stats', { bubbles: true, composed: true }));
    } catch(e) { showToast(`${t('removeRepoFailed')}: ${e.message}`, 'error'); }
  }

  _toggleSection(name) {
    this._collapsed = { ...this._collapsed, [name]: !this._collapsed[name] };
  }

  _setViewMode(mode) {
    this._viewMode = mode;
  }

  _openCardDetail(repo) {
    this.dispatchEvent(new CustomEvent('detail', {
      detail: { repo },
      bubbles: true, composed: true,
    }));
  }

  _getInitials(name) {
    if (!name) return '?';
    const parts = name.split('/');
    const last = parts[parts.length - 1] || name;
    return last.charAt(0).toUpperCase();
  }

  _getCategoryColor(cat) {
    const colors = {
      integration: '#1565c0', plugin: '#7b1fa2', theme: '#2e7d32',
      python_script: '#f9a825', template: '#6a1b9a', appdaemon: '#e65100',
      netdaemon: '#00838f', dashboard: '#f57f17',
    };
    return colors[cat] || '#78909c';
  }

  _getCategoryLabel(category) {
    const labels = {
      integration: t('catIntegration'), plugin: t('catPlugin'), theme: t('catTheme'),
      appdaemon: t('catAppDaemon'), netdaemon: t('catNetDaemon'),
      python_script: t('catPython'), template: t('catTemplate'),
      dashboard: t('catDashboard'),
    };
    return labels[category] || category;
  }

  /* ===== Render a single repo as Card ===== */
  _renderCard(r, renamedEntries) {
    const fullName = r.full_name || r.repository;
    const displayName = r.manifest_name || r.name || fullName;
    const renamedEntry = renamedEntries.find(([old, nw]) => nw === fullName);
    const isRenamed = !!renamedEntry;
    const oldName = isRenamed ? renamedEntry[0] : null;
    const installedVer = r.installed_version || '';
    const latestVer = r.latest_version || '';
    const hasUpdate = r.has_update;
    const stars = r.stargazers_count || 0;
    const desc = r.description || '';
    const isInstalled = r.installed || false;
    const catColor = this._getCategoryColor(r.category);

    return html`
      <div class="repo-card" @click=${() => this._openCardDetail(r)}>
        <div class="repo-card-img" style="background:linear-gradient(135deg, ${catColor}44 0%, ${catColor}22 100%);">
          <div class="repo-card-avatar" style="background:${catColor}">
            ${this._getInitials(displayName)}
          </div>
          <span class="repo-card-badge-cat" style="background:${catColor}">
            ${this._getCategoryLabel(r.category)}
          </span>
          ${isRenamed ? html`<span class="repo-card-renamed">🔄 ${oldName}</span>` : ''}
          ${isInstalled ? html`<span class="repo-card-installed">✅ ${t('installed')}</span>` : ''}
          <div class="repo-card-actions-img">
            <button class="btn-icon" @click=${(e) => { e.stopPropagation(); this._removeCustomRepo(fullName, r.category); }} title="${t('remove')}">
              ✕
            </button>
          </div>
        </div>
        <div class="repo-card-body">
          <div class="name" title=${displayName}>${displayName}</div>
          <div class="fullname">${fullName}</div>
          <div class="desc">${desc || t('noDesc')}</div>
          <div class="meta">
            <span class="stars">
              ⭐ ${stars > 0 ? (typeof stars === 'number' ? stars.toLocaleString() : stars) : 0}
            </span>
            ${isInstalled ? html`
              <span style="font-size:10px;color:var(--secondary-text-color);">
                📦 ${installedVer}${hasUpdate ? html` <span class="update-badge">⬆ ${latestVer}</span>` : ''}
              </span>
            ` : html`<span class="repo-not-installed">${t('notInstalled')}</span>`}
          </div>
        </div>
      </div>
    `;
  }

  /* ===== Render a single repo as List Item ===== */
  _renderListItem(r, renamedEntries) {
    const fullName = r.full_name || r.repository;
    const displayName = r.manifest_name || r.name || fullName;
    const renamedEntry = renamedEntries.find(([old, nw]) => nw === fullName);
    const isRenamed = !!renamedEntry;
    const oldName = isRenamed ? renamedEntry[0] : null;
    const installedVer = r.installed_version || '';
    const latestVer = r.latest_version || '';
    const hasUpdate = r.has_update;
    const stars = r.stargazers_count || 0;
    const desc = r.description || '';

    return html`
      <div class="repo-item" @click=${() => this._openCardDetail(r)}>
        <div class="repo-info">
          <div class="repo-top">
            <span class="repo-name">${displayName}</span>
            <span class="category-badge ${r.category}">${this._getCategoryLabel(r.category)}</span>
            ${isRenamed ? html`<span class="renamed-badge">🔄 ${oldName}</span>` : ''}
          </div>
          <div class="repo-meta">
            <span class="repo-fullname">${fullName}</span>
            <span class="stars" style="color:#f9a825;">⭐ ${stars > 0 ? (typeof stars === 'number' ? stars.toLocaleString() : stars) : 0}</span>
            ${r.installed ? html`
              <span class="repo-version">📦 ${installedVer}</span>
              ${hasUpdate ? html`<span class="update-badge">⬆ ${latestVer}</span>` : ''}
            ` : html`<span class="repo-not-installed">${t('notInstalled')}</span>`}
          </div>
          ${desc ? html`<div class="repo-desc">${desc}</div>` : ''}
        </div>
        <div class="repo-actions">
          <a class="btn btn-icon" href="https://github.com/${fullName}" target="_blank" rel="noopener" @click=${e => e.stopPropagation()} title="GitHub">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
          ${isRenamed ? html`
            <button class="btn primary sm" @click=${(e) => { e.stopPropagation(); this._replaceRenamedOneClick(oldName, fullName); }} ?disabled=${this._renamedRefreshing}>
              ${this._renamedRefreshing ? '⏳' : t('replace')}
            </button>
            <button class="btn danger sm" @click=${(e) => { e.stopPropagation(); this._removeRenamedRepo(oldName); }} title=${t('removeRenamed')}>✕</button>
          ` : ''}
          <button class="btn danger sm" @click=${(e) => { e.stopPropagation(); this._removeCustomRepo(fullName, r.category); }}>✕</button>
        </div>
      </div>
    `;
  }

  render() {
    const { archivedRepos, ignoredRepos, renamedEntries, customRepos, loading, _viewMode, _collapsed } = this;

    return html`
      ${loading ? html`
        <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:60px 16px;color:var(--secondary-text-color);">
          <div class="spinner"></div>
          <div>${t('loading')}</div>
        </div>
      ` : ''}

      <!-- Custom Repos -->
      <div class="section">
        <div class="section-header" @click=${() => this._toggleSection('customRepos')}>
          <svg class="arrow ${_collapsed.customRepos ? 'closed' : 'open'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
            ${t('customRepos')}
            ${renamedEntries.length > 0 ? html`<span class="section-badge">${renamedEntries.length} ${t('renamedRepos')}</span>` : ''}
          </div>
          <div class="view-toggle">
            <button class=${classMap({ active: _viewMode === 'card' })} @click=${(e) => { e.stopPropagation(); this._setViewMode('card'); }}>
              🃏 ${t('catDashboard') || '卡片'}
            </button>
            <button class=${classMap({ active: _viewMode === 'list' })} @click=${(e) => { e.stopPropagation(); this._setViewMode('list'); }}>
              ☰ ${t('list') || '列表'}
            </button>
          </div>
          <button class="btn sm" @click=${(e) => { e.stopPropagation(); this._load(); }} title="${t('refresh')}" style="flex-shrink:0;">🔄</button>
        </div>
        <div class="section-content ${_collapsed.customRepos ? 'collapsed' : ''}">
          <div class="section-desc">${t('customReposDesc')}</div>

          ${this._showAddCustom ? html`
            <div class="add-form">
              <input class="edit-input" .value=${this._customRepoUrl} @input=${e => this._customRepoUrl = e.target.value} placeholder="owner/repo 或 GitHub URL" @keydown=${e => e.key === 'Enter' && this._addCustomRepo()}>
              <div class="add-form-controls">
                <select class="edit-input" .value=${this._customRepoCategory} @change=${e => this._customRepoCategory = e.target.value}>
                  ${['integration','plugin','theme','dashboard','python_script','template','appdaemon','netdaemon'].map(c => html`<option value=${c}>${this._getCategoryLabel(c)}</option>`)}
                </select>
                <button class="btn primary sm" @click=${this._addCustomRepo} ?disabled=${this._addingCustom || !this._customRepoUrl.trim()}>
                  ${this._addingCustom ? '⏳' : '✓'} ${t('add')}
                </button>
                <button class="btn sm" @click=${this._toggleAddCustom}>${t('cancel')}</button>
              </div>
              ${this._customRepoUrl.trim() ? html`
                <div class="add-preview">${this._parseRepoUrl(this._customRepoUrl)
                  ? html`📦 ${this._parseRepoUrl(this._customRepoUrl)}`
                  : html`<span class="add-error">${t('invalidRepoUrl')}</span>`}</div>
              ` : ''}
            </div>
          ` : html`
            <button class="btn primary" @click=${this._toggleAddCustom} style="margin-bottom:12px;">+ ${t('addRepo')}</button>
          `}

          ${customRepos.length > 0
            ? (_viewMode === 'card'
              ? html`<div class="repo-cards">${customRepos.map(r => this._renderCard(r, renamedEntries))}</div>`
              : html`<div class="repo-list">${customRepos.map(r => this._renderListItem(r, renamedEntries))}</div>`)
            : html`<div class="empty">${t('noCustomRepos')}</div>`}
        </div>
      </div>

      <!-- Archived -->
      <div class="section">
        <div class="section-header" @click=${() => this._toggleSection('archived')}>
          <svg class="arrow ${_collapsed.archived ? 'closed' : 'open'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
            ${t('archivedRepos')}
          </div>
        </div>
        <div class="section-content ${_collapsed.archived ? 'collapsed' : ''}">
          ${archivedRepos.length > 0 ? html`
            <div class="repo-list">
              ${archivedRepos.map(r => html`
                <div class="repo-item" style="cursor:default;">
                  <div class="repo-info"><div class="repo-top"><span class="repo-name">${r}</span></div></div>
                  <div class="repo-actions">
                    <a class="btn sm" href="https://github.com/${r}" target="_blank" rel="noopener">${t('viewOnGithub')}</a>
                    <button class="btn danger sm" @click=${() => this._removeArchivedRepo(r)}>${t('removeArchived')}</button>
                  </div>
                </div>
              `)}
            </div>
          ` : html`<div class="empty">${t('noArchived')}</div>`}
        </div>
      </div>

      <!-- Ignored -->
      <div class="section">
        <div class="section-header" @click=${() => this._toggleSection('ignored')}>
          <svg class="arrow ${_collapsed.ignored ? 'closed' : 'open'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            ${t('ignoredRepos')}
          </div>
        </div>
        <div class="section-content ${_collapsed.ignored ? 'collapsed' : ''}">
          ${ignoredRepos.length > 0 ? html`
            <div class="repo-list">
              ${ignoredRepos.map(r => html`
                <div class="repo-item" style="cursor:default;"><div class="repo-info"><div class="repo-top"><span class="repo-name">${r}</span></div></div></div>
              `)}
            </div>
          ` : html`<div class="empty">${t('noIgnored')}</div>`}
        </div>
      </div>

      <!-- Tools: Export / Import / Dep Check -->
      <div class="section">
        <div class="section-header" @click=${() => this._toggleSection('tools')}>
          <svg class="arrow ${_collapsed.tools ? 'closed' : 'open'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M14.31 8l5.74 5.74-.94 3.71-3.71.94L8 14.31"/><path d="M14.31 8L8 14.31l-2.23.45a1 1 0 0 0-.86 1.16l.6 3.02a1 1 0 0 0 1.16.86l3.02-.6L16 12.69"/></svg>
            ${t('tools') || '工具'}
          </div>
        </div>
        <div class="section-content ${_collapsed.tools ? 'collapsed' : ''}">
          <div class="section-desc">${t('toolsDesc') || '导出、导入和依赖检查'}</div>

          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
            <button class="btn primary" @click=${this._export} ?disabled=${this.exporting}>
              ${this.exporting ? t('exporting') : t('exportBtn')}
            </button>
            <button class="btn" @click=${this._import} ?disabled=${this.importing}>
              ${this.importing ? t('importing') : t('importBtn')}
            </button>
            <button class="btn" @click=${this._checkDependencies} ?disabled=${this._depLoading}>
              ${this._depLoading ? '⏳' : '🔍'} ${this._depLoading ? t('checkingUpdates') : t('checkDep')}
            </button>
          </div>

          ${this._depResults ? html`
            <div class="dep-panel">
              <div class="dep-summary">
                <span class="title">${this._depResults.all_ok ? '✅' : '⚠️'} ${t('totalPrefix') || '共'} ${this._depResults.total_checked} ${t('totalRepos')}</span>
                ${!this._depResults.all_ok ? html`<span class="issues">${this._depResults.issues_count} ${t('depMissing') || '缺失'}</span>` : ''}
              </div>
              ${!this._depResults.all_ok ? html`
                ${this._depResults.dependencies.filter(r => r.has_issues).map(r => html`
                  <div class="dep-item">
                    <div class="repo">${r.repository}</div>
                    <div class="missing">${r.missing.join(', ')}</div>
                  </div>
                `)}
              ` : html`<div class="dep-ok">✅ ${t('depOk')}</div>`}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}

customElements.define('management-view', ManagementView);