/**
 * Huawei Q6 Router - Full Dashboard (Panel & Card)
 * 
 * Features:
 *   - Sidebar panel (huawei-router-panel) + Lovelace card (huawei-router-card)
 *   - Three view modes: Topology, Card Group, Tree
 *   - Network control switches
 *   - Desktop / Mobile responsive layout
 *   - Router-device relationship visualization
 * 
 * Version: 3.0.0
 *
 * v3.0.0: Comprehensive redesign
 *   - Redesigned stats bar with health indicator & alerts
 *   - Global search across all views
 *   - Status filter (online/offline/weak signal) + sorting
 *   - New table-style device list view
 *   - Enhanced mobile experience
 */

const VERSION = '3.0.0';

// ═══════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════

const STYLES = `
  :host {
    --hw-primary: #07A0F2;
    --hw-primary-dark: #0585CC;
    --hw-primary-light: #E8F7FF;
    --hw-success: #22C55E;
    --hw-warning: #F59E0B;
    --hw-danger: #EF4444;
    --hw-gray-50: #F8FAFC;
    --hw-gray-100: #F1F5F9;
    --hw-gray-200: #E2E8F0;
    --hw-gray-300: #CBD5E1;
    --hw-gray-400: #94A3B8;
    --hw-gray-500: #64748B;
    --hw-gray-600: #475569;
    --hw-gray-700: #334155;
    --hw-gray-800: #1E293B;
    --hw-card-radius: 16px;
    --hw-card-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --hw-card-shadow-hover: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
    --hw-transition: all 0.2s ease;
  }

  /* ── Layout ── */
  .shell { box-sizing: border-box; }
  .shell.panel { padding: 16px; max-width: 1400px; margin: 0 auto; }
  .shell.card { width: 100%; }
  .shell.panel.mobile { padding: 8px; }

  .desktop-layout { display: grid; grid-template-columns: 1fr 320px; gap: 16px; align-items: start; }
  .mobile-layout { display: flex; flex-direction: column; }

  /* ── Shared ── */
  .hdr {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px 16px;
    background: linear-gradient(135deg, var(--hw-primary), var(--hw-primary-dark));
    border-radius: var(--hw-card-radius) var(--hw-card-radius) 0 0;
    color: white; position: relative; overflow: hidden;
  }
  .hdr::before {
    content: ''; position: absolute; top: -50%; right: -20%;
    width: 200px; height: 200px; background: rgba(255,255,255,0.05); border-radius: 50%;
  }
  .hdr::after {
    content: ''; position: absolute; bottom: -30%; left: 30%;
    width: 150px; height: 150px; background: rgba(255,255,255,0.05); border-radius: 50%;
  }
  .hdr-left { display: flex; align-items: center; gap: 12px; z-index: 1; }
  .hdr-icon {
    width: 40px; height: 40px; background: rgba(255,255,255,0.2);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
  }
  .hdr-icon ha-icon { --mdc-icon-size: 22px; color: white; }
  .hdr-title { font-size: 18px; font-weight: 700; }
  .hdr-sub { font-size: 12px; opacity: 0.8; margin-top: 1px; }
  .hdr-right { display: flex; align-items: center; gap: 10px; z-index: 1; flex-shrink: 0; }
  .badge {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 20px;
    font-size: 11px; font-weight: 500; background: rgba(255,255,255,0.2);
  }
  .dot {
    width: 7px; height: 7px; border-radius: 50%; display: inline-block;
  }
  .dot.on { background: var(--hw-success); }
  .dot.off { background: var(--hw-danger); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* ── View Switcher ── */
  .vw-bar { display: flex; gap: 4px; padding: 12px 24px; background: var(--hw-gray-50); border-bottom: 1px solid var(--hw-gray-200); }
  .vw-btn {
    padding: 5px 14px; border-radius: 8px; border: 1px solid var(--hw-gray-200);
    background: white; font-size: 12px; cursor: pointer; color: var(--hw-gray-500);
    font-family: inherit; transition: var(--hw-transition); display: flex; align-items: center; gap: 4px;
  }
  .vw-btn.on { background: var(--hw-primary); color: white; border-color: var(--hw-primary); }
  .vw-btn:hover:not(.on) { background: var(--hw-gray-100); }

  /* ── Stats Bar ── */
  .s-bar {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 8px; padding: 14px 24px; background: white;
    border-bottom: 1px solid var(--hw-gray-200);
  }
  .s-item {
    display: flex; flex-direction: column; align-items: center;
    padding: 10px 8px; background: var(--hw-gray-50); border-radius: 10px;
  }
  .s-val { font-size: 20px; font-weight: 700; color: var(--hw-gray-800); line-height: 1.3; }
  .s-lbl { font-size: 10px; color: var(--hw-gray-500); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 500; }

  /* ── Main Content ── */
  .main-area { padding: 16px 24px 24px; position: relative; }
  .right-area { padding: 16px 24px 24px 0; }

  /* ── Topology ── */
  .topo-wrap { background: #0F172A; border-radius: 12px; padding: 24px; position: relative; min-height: 480px; overflow-y: auto; }
  .topo-node {
    position: absolute; display: flex; flex-direction: column; align-items: center;
    padding: 8px 14px; border-radius: 10px; font-size: 11px; font-weight: 500;
    min-width: 70px; text-align: center; cursor: pointer; transition: transform 0.2s;
  }
  .topo-node:hover { transform: scale(1.05); }
  .topo-node .ico { font-size: 22px; margin-bottom: 2px; }
  .topo-node.main { background: linear-gradient(135deg,#07A0F2,#0585CC); color: white; box-shadow: 0 4px 20px rgba(7,160,242,0.3); }
  .topo-node.sat { background: #1E293B; color: #E2E8F0; border: 1px solid #334155; }
  .topo-node.sat.online { border-color: #22C55E; }
  .topo-node.sat.offline { border-color: #EF4444; opacity: 0.5; }
  .topo-node.device {
    background: #0F172A; color: #94A3B8; border: 1px solid #1E293B;
    font-size: 10px; padding: 4px 8px; min-width: 50px;
  }
  .topo-node.device.online { border-color: #22C55E55; }
  .topo-line { position: absolute; border: 1px solid #334155; pointer-events: none; }

  .topo-legend { position: absolute; bottom: 8px; right: 12px; font-size: 9px; color: #475569; display: flex; gap: 8px; }
  .topo-empty { display: flex; align-items: center; justify-content: center; height: 200px; color: #475569; font-size: 13px; }

  /* ── Card Group ── */
  .cg-wrap { display: flex; flex-direction: column; gap: 12px; }
  .cg-card {
    background: white; border-radius: 12px; padding: 14px 16px;
    box-shadow: var(--hw-card-shadow); border: 1px solid var(--hw-gray-200);
  }
  .cg-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .cg-hdr-l { display: flex; align-items: center; gap: 8px; }
  .cg-name { font-size: 14px; font-weight: 600; }
  .cg-st { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
  .cg-st.on { background: #F0FDF4; color: #16A34A; }
  .cg-st.off { background: #FEF2F2; color: #DC2626; }
  .cg-st.wk { background: #FFF7ED; color: #EA580C; }
  .cg-count { font-size: 11px; color: var(--hw-gray-400); }
  .cg-devices { display: flex; flex-wrap: wrap; gap: 6px; }
  .cg-d {
    display: flex; align-items: center; gap: 4px;
    padding: 4px 10px; background: var(--hw-gray-50); border-radius: 8px;
    font-size: 11px; color: var(--hw-gray-600); cursor: pointer;
    transition: var(--hw-transition);
  }
  .cg-d:hover { background: var(--hw-gray-100); }
  .cg-d .sig {
    display: inline-flex; gap: 1px; margin-left: 4px;
  }
  .cg-d .sig span { width: 2px; height: 6px; background: var(--hw-gray-300); border-radius: 1px; }
  .cg-d .sig span.b1 { background: var(--hw-success); }
  .cg-d .sig span.b2 { background: var(--hw-warning); }
  .cg-d .sig span.b3 { background: var(--hw-danger); }

  /* ── Tree ── */
  .tree-wrap { padding: 4px 0; }
  .tree-item {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 8px; font-size: 12px; border-radius: 6px;
    transition: var(--hw-transition); cursor: pointer;
  }
  .tree-item:hover { background: var(--hw-gray-50); }
  .tree-item .indent {
    display: inline-block; border-left: 1px solid var(--hw-gray-200);
    height: 16px; width: 20px; flex-shrink: 0;
  }
  .tree-item .sp { width: 20px; flex-shrink: 0; }
  .tree-item .sig { font-size: 10px; color: var(--hw-gray-400); margin-left: auto; }
  .tree-item.main { font-weight: 600; font-size: 13px; }
  .tree-item.router { font-weight: 500; font-size: 12px; padding-left: 20px; }
  .tree-item.dev { padding-left: 40px; font-size: 11px; color: var(--hw-gray-500); }

  .tree-toggle {
    cursor: pointer; padding: 2px 4px; border-radius: 4px; user-select: none;
    font-size: 10px; color: var(--hw-gray-400);
  }
  .tree-toggle:hover { background: var(--hw-gray-100); }

  /* ── Right Panel ── */
  .r-section { margin-bottom: 14px; }
  .r-title { font-size: 11px; font-weight: 600; color: var(--hw-gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }

  /* Router Info Card */
  .ri-card { background: white; border-radius: 10px; padding: 12px 14px; box-shadow: var(--hw-card-shadow); border: 1px solid var(--hw-gray-200); margin-bottom: 10px; }
  .ri-row { display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; border-bottom: 1px solid var(--hw-gray-100); }
  .ri-row:last-child { border-bottom: none; }
  .ri-l { color: var(--hw-gray-500); }
  .ri-v { font-weight: 500; color: var(--hw-gray-700); }

  /* ── Network Controls ── */
  .nc-grid { display: grid; grid-template-columns: 1fr; gap: 4px; }
  .nc-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 12px; background: white; border-radius: 8px;
    border: 1px solid var(--hw-gray-200); font-size: 12px;
    transition: var(--hw-transition); cursor: pointer;
  }
  .nc-item:hover { border-color: var(--hw-gray-300); }
  .nc-item .left { display: flex; align-items: center; gap: 6px; }
  .nc-item .left ha-icon { --mdc-icon-size: 14px; color: var(--hw-gray-400); }
  .nc-toggle {
    width: 32px; height: 18px; border-radius: 9px; position: relative;
    transition: background 0.2s; cursor: pointer; flex-shrink: 0;
  }
  .nc-toggle.on { background: var(--hw-primary); }
  .nc-toggle.off { background: var(--hw-gray-300); }
  .nc-toggle .knob {
    width: 14px; height: 14px; border-radius: 50%; background: white;
    position: absolute; top: 2px; transition: left 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.15);
  }
  .nc-toggle.on .knob { left: 16px; }
  .nc-toggle.off .knob { left: 2px; }

  .nc-more { text-align: center; padding: 6px; font-size: 10px; color: var(--hw-gray-400); cursor: pointer; }
  .nc-more:hover { color: var(--hw-primary); }

  /* ── Quick Actions ── */
  .qa-wrap { display: flex; gap: 6px; flex-wrap: wrap; }
  .qa-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 6px 12px; border-radius: 8px; border: 1px solid var(--hw-gray-200);
    background: white; cursor: pointer; font-size: 11px; font-weight: 500;
    color: var(--hw-gray-700); transition: var(--hw-transition); font-family: inherit;
  }
  .qa-btn:hover { background: var(--hw-gray-50); border-color: var(--hw-gray-300); }
  .qa-btn ha-icon { --mdc-icon-size: 14px; }
  .qa-btn.pri { background: var(--hw-primary); color: white; border-color: var(--hw-primary); }
  .qa-btn.pri:hover { background: var(--hw-primary-dark); }
  .qa-btn.dng { color: var(--hw-danger); border-color: var(--hw-danger); }
  .qa-btn.dng:hover { background: #FEF2F2; }

  /* ── Loading / State ── */
  .st-c {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 60px 24px; text-align: center;
  }
  .st-c ha-icon { --mdc-icon-size: 40px; color: var(--hw-gray-300); margin-bottom: 10px; }
  .st-msg { font-size: 13px; color: var(--hw-gray-500); }
  .st-sub { font-size: 11px; color: var(--hw-gray-400); margin-top: 4px; }
  .spin {
    width: 24px; height: 24px; border: 3px solid var(--hw-gray-200);
    border-top-color: var(--hw-primary); border-radius: 50%;
    animation: rot 0.8s linear infinite; margin-bottom: 10px;
  }
  @keyframes rot { to { transform: rotate(360deg); } }

  /* ── Device Detail Popup ── */
  .pop-o {
    display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    z-index: 1000; align-items: center; justify-content: center;
  }
  .pop-o.op { display: flex; }
  .pop-c {
    background: white; border-radius: 16px; width: 90%; max-width: 400px;
    max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  }
  .pop-hdr { padding: 18px 20px 10px; border-bottom: 1px solid var(--hw-gray-200); }
  .pop-bd { padding: 12px 20px 18px; }
  .pop-r {
    display: flex; justify-content: space-between; padding: 6px 0;
    border-bottom: 1px solid var(--hw-gray-100); font-size: 12px;
  }
  .pop-r:last-child { border-bottom: none; }
  .pop-rl { color: var(--hw-gray-500); }
  .pop-rv { font-weight: 500; color: var(--hw-gray-700); text-align: right; }
  .pop-act { display: flex; gap: 8px; margin-top: 12px; }
  .pop-act button { flex: 1; justify-content: center; }

  /* ── Router Device List Popup ── */
  .rd-pop-c { background: white; border-radius: 16px; width: 92%; max-width: 700px; max-height: 88vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
  .rd-pop-hdr { padding: 16px 20px; border-bottom: 1px solid var(--hw-gray-200); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
  .rd-pop-bd { padding: 14px 16px 20px; overflow-y: auto; flex: 1; }
  /* Device card grid */
  .rd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap: 10px; }
  .rd-card {
    background: var(--hw-gray-50); border-radius: 12px; padding: 12px;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    border: 1px solid var(--hw-gray-200); transition: all 0.15s;
    position: relative;
  }
  .rd-card:hover { border-color: var(--hw-blue); box-shadow: 0 2px 8px rgba(37,99,235,0.1); }
  .rd-card .dot-pos { position: absolute; top: 8px; right: 8px; }
  .rd-card .dot-pos .dot { width: 8px; height: 8px; }
  .rd-card .rd-ico { font-size: 24px; width: 44px; height: 44px; border-radius: 10px; background: white; display: flex; align-items: center; justify-content: center; }
  .rd-card .rd-nm { font-size: 12px; font-weight: 600; color: var(--hw-gray-800); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .rd-card .rd-mt { font-size: 10px; color: var(--hw-gray-400); display: flex; flex-direction: column; align-items: center; gap: 1px; }
  .rd-card .rd-mt span { display: inline-flex; align-items: center; gap: 3px; }
  .rd-card .rd-ctl { margin-top: auto; width: 100%; }
  .rd-card .rd-wifi {
    display: block; text-align: center; font-size: 10px; padding: 4px 0; border-radius: 8px;
    cursor: pointer; border: 1px solid; font-weight: 500; transition: all 0.15s;
    user-select: none; font-family: inherit; width: 100%;
  }
  .rd-card .rd-wifi.on { background: #F0FDF4; border-color: #22C55E; color: #16A34A; }
  .rd-card .rd-wifi.off { background: #FEF2F2; border-color: #EF4444; color: #DC2626; }
  .rd-card .rd-wifi.na { opacity: 0.3; cursor: default; background: var(--hw-gray-100); border-color: var(--hw-gray-200); color: var(--hw-gray-400); }
  .rd-card .rd-wifi:hover { opacity: 0.85; }
  .rd-card .rd-wifi:active { transform: scale(0.96); }

  /* ── Card view device extras ── */
  .cg-d-ext { display: flex; align-items: center; gap: 6px; }
  .cg-d-ip { font-size: 9px; color: var(--hw-gray-400); font-family: monospace; }
  .cg-d-wifi {
    font-size: 8px; padding: 1px 6px; border-radius: 8px; cursor: pointer;
    border: 1px solid; font-family: inherit; transition: all 0.1s;
  }
  .cg-d-wifi.on { background: #F0FDF4; border-color: #22C55E55; color: #16A34A; }
  .cg-d-wifi.off { background: #FEF2F2; border-color: #EF444455; color: #DC2626; }
  .cg-d-wifi.na { opacity: 0.3; cursor: default; }

  /* ── Tree view WiFi toggle ── */
  .tr-wifi {
    font-size: 8px; padding: 1px 6px; border-radius: 8px; cursor: pointer;
    border: 1px solid; font-family: inherit; margin-left: 4px;
  }
  .tr-wifi.on { background: #F0FDF4; border-color: #22C55E55; color: #16A34A; }
  .tr-wifi.off { background: #FEF2F2; border-color: #EF444455; color: #DC2626; }
  .tr-wifi.na { opacity: 0.3; cursor: default; }

  /* ── Mobile ── */
  .shell.panel.mobile { padding: 0; }
  .shell.panel.mobile .hdr { padding: 14px 16px 12px; border-radius: 0; }
  .shell.panel.mobile .hdr-title { font-size: 16px; }
  .shell.panel.mobile .s-bar { padding: 10px 14px; grid-template-columns: repeat(3,1fr); gap: 6px; }
  .shell.panel.mobile .s-item { padding: 8px 6px; border-radius: 8px; }
  .shell.panel.mobile .s-val { font-size: 16px; }
  .shell.panel.mobile .vw-bar { padding: 8px 14px; overflow-x: auto; }
  .shell.panel.mobile .vw-btn { font-size: 11px; padding: 4px 10px; flex-shrink: 0; }
  .shell.panel.mobile .main-area { padding: 10px 14px 14px; }
  .shell.panel.mobile .topo-wrap { padding: 14px; min-height: 380px; }
  .shell.panel.mobile .topo-node .ico { font-size: 18px; }
  .shell.panel.mobile .topo-node { padding: 5px 10px; font-size: 10px; min-width: 55px; }
  .shell.panel.mobile .right-area { padding: 4px 12px 60px; }

  /* Mobile bottom bar */
  .mb-bar {
    position: fixed; bottom: 0; left: 0; right: 0;
    display: flex; gap: 0; background: white; border-top: 1px solid var(--hw-gray-200);
    padding: 4px 0; z-index: 100;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
  }
  .mb-bar-btn {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    padding: 4px 0; font-size: 9px; color: var(--hw-gray-400);
    cursor: pointer; border: none; background: none; font-family: inherit;
    gap: 1px; transition: var(--hw-transition);
  }
  .mb-bar-btn ha-icon { --mdc-icon-size: 18px; }
  .mb-bar-btn.on { color: var(--hw-primary); }

  /* Mobile NC Sheet */
  .nc-sheet-o {
    display: none; position: fixed; bottom: 0; left: 0; right: 0;
    z-index: 1001; background: white; border-radius: 16px 16px 0 0;
    box-shadow: 0 -8px 30px rgba(0,0,0,0.12);
    max-height: 70vh; overflow-y: auto;
  }
  .nc-sheet-o.op { display: block; }
  .nc-sheet-h {
    padding: 14px 16px 10px; border-bottom: 1px solid var(--hw-gray-200);
    display: flex; justify-content: space-between; align-items: center;
    font-size: 14px; font-weight: 600;
  }
  .nc-sheet-b { padding: 10px 16px 20px; }
  .nc-sheet-b .nc-item { padding: 10px 12px; font-size: 13px; }

  /* ── Helper ── */
  .empty-dev {
    display: flex; flex-direction: column; align-items: center;
    padding: 24px; color: var(--hw-gray-400); font-size: 12px;
  }
  .empty-dev ha-icon { --mdc-icon-size: 32px; margin-bottom: 6px; }

  @media (max-width: 768px) {
    .shell.panel .desktop-layout { display: none; }
    .shell.panel.mobile .mobile-layout { display: flex; }
  }
  @media (min-width: 769px) {
    .shell.panel .mobile-layout { display: none; }
    .shell.panel.mobile .mobile-layout { display: flex; }
  }
  /* Card mode is same for both */
  .shell.card .desktop-layout { grid-template-columns: 1fr; }
  .shell.card .right-area { display: none; }
  .shell.card .hdr-right .badge:last-child { display: none; }
  .shell.card .s-bar { grid-template-columns: repeat(3,1fr); }
  .shell.card .s-item:nth-child(n+4) { display: none; }

  /* ── Area Filter Bar ── */
  .area-bar { padding: 6px 24px; display: flex; gap: 6px; overflow-x: auto; flex-shrink: 0; scrollbar-width: none; }
  .area-bar::-webkit-scrollbar { display: none; }
  .area-chip {
    flex-shrink: 0; font-size: 11px; padding: 4px 12px; border-radius: 14px;
    border: 1px solid var(--hw-gray-200); background: white; cursor: pointer;
    color: var(--hw-gray-600); font-family: inherit; transition: all 0.15s; white-space: nowrap;
  }
  .area-chip.on { background: var(--hw-blue); color: white; border-color: var(--hw-blue); }
  .area-chip:hover:not(.on) { border-color: var(--hw-blue); color: var(--hw-blue); }
  .shell.panel.mobile .area-bar { padding: 6px 14px; }

  /* ── Search Bar ── */
  .srch-bar { display: flex; gap: 8px; padding: 8px 24px; background: white; border-bottom: 1px solid var(--hw-gray-200); align-items: center; }
  .srch-input {
    flex: 1; padding: 7px 12px; border-radius: 10px; border: 1px solid var(--hw-gray-200);
    background: var(--hw-gray-50); font-size: 12px; font-family: inherit;
    outline: none; transition: var(--hw-transition);
  }
  .srch-input:focus { border-color: var(--hw-primary); background: white; box-shadow: 0 0 0 3px var(--hw-primary-light); }
  .srch-input::placeholder { color: var(--hw-gray-400); }
  .srch-clear {
    background: none; border: none; cursor: pointer; font-size: 14px; color: var(--hw-gray-400);
    padding: 4px; display: none; font-family: inherit;
  }
  .srch-clear.show { display: inline-block; }
  .shell.panel.mobile .srch-bar { padding: 6px 14px; }

  /* ── Status Filter Bar ── */
  .flt-bar { display: flex; gap: 6px; padding: 6px 24px 8px; background: white; border-bottom: 1px solid var(--hw-gray-200); flex-wrap: wrap; align-items: center; }
  .flt-chip {
    font-size: 10px; padding: 3px 10px; border-radius: 12px; border: 1px solid var(--hw-gray-200);
    background: white; cursor: pointer; color: var(--hw-gray-500); font-family: inherit;
    transition: all 0.15s; white-space: nowrap;
    display: flex; align-items: center; gap: 3px;
  }
  .flt-chip.on { background: var(--hw-primary); color: white; border-color: var(--hw-primary); }
  .flt-chip:hover:not(.on) { border-color: var(--hw-primary); color: var(--hw-primary); }
  .flt-chip .dot { width: 5px; height: 5px; }
  .flt-sep { width: 1px; height: 16px; background: var(--hw-gray-200); margin: 0 2px; }
  .flt-label { font-size: 10px; color: var(--hw-gray-400); font-weight: 500; letter-spacing: 0.3px; }
  .sort-btn {
    font-size: 10px; padding: 3px 8px; border-radius: 12px; border: 1px solid var(--hw-gray-200);
    background: white; cursor: pointer; color: var(--hw-gray-500); font-family: inherit;
    transition: all 0.15s; margin-left: auto; display: flex; align-items: center; gap: 3px;
  }
  .sort-btn:hover { border-color: var(--hw-primary); color: var(--hw-primary); }
  .shell.panel.mobile .flt-bar { padding: 4px 14px 6px; }

  /* ── Health Stats ── */
  .s-bar-health { display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 12px 24px; background: white; border-bottom: 1px solid var(--hw-gray-200); }
  .s-bar-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 6px; }
  .s-item-health {
    display: flex; flex-direction: column; align-items: center;
    padding: 8px 6px; background: var(--hw-gray-50); border-radius: 10px;
  }
  .s-item-health .s-val { font-size: 18px; font-weight: 700; color: var(--hw-gray-800); line-height: 1.3; }
  .s-item-health .s-lbl { font-size: 9px; color: var(--hw-gray-500); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 500; }
  .s-item-health .s-val.good { color: var(--hw-success); }
  .s-item-health .s-val.warn { color: var(--hw-warning); }
  .s-item-health .s-val.bad { color: var(--hw-danger); }

  .health-indicator {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 8px 16px; border-radius: 10px; background: var(--hw-gray-50);
    min-width: 80px; gap: 2px;
  }
  .health-indicator.good { background: #F0FDF4; }
  .health-indicator.warn { background: #FFF7ED; }
  .health-indicator.bad { background: #FEF2F2; }
  .health-score { font-size: 22px; font-weight: 800; }
  .health-indicator.good .health-score { color: var(--hw-success); }
  .health-indicator.warn .health-score { color: var(--hw-warning); }
  .health-indicator.bad .health-score { color: var(--hw-danger); }
  .health-label { font-size: 9px; color: var(--hw-gray-500); font-weight: 500; letter-spacing: 0.3px; }

  /* ── Alert Badge ── */
  .alert-pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 500;
    background: #FFF7ED; color: #EA580C; cursor: pointer;
  }
  .alert-pill.warn { background: #FFF7ED; color: #EA580C; }
  .alert-pill.good { background: #F0FDF4; color: #16A34A; }

  /* ── Table / List View ── */
  .tbl-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid var(--hw-gray-200); }
  .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
  .tbl th {
    padding: 8px 10px; text-align: left; font-weight: 600; color: var(--hw-gray-500);
    background: var(--hw-gray-50); border-bottom: 1px solid var(--hw-gray-200);
    font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap;
    cursor: pointer; user-select: none;
  }
  .tbl th:hover { color: var(--hw-primary); }
  .tbl th .sort-arrow { margin-left: 3px; font-size: 9px; opacity: 0.5; }
  .tbl th .sort-arrow.on { opacity: 1; color: var(--hw-primary); }
  .tbl td {
    padding: 7px 10px; border-bottom: 1px solid var(--hw-gray-100);
    vertical-align: middle;
  }
  .tbl tr:last-child td { border-bottom: none; }
  .tbl tr:hover td { background: var(--hw-gray-50); }
  .tbl .tbl-ico { font-size: 18px; }
  .tbl .tbl-name { font-weight: 500; color: var(--hw-gray-800); }
  .tbl .tbl-ip { font-family: monospace; font-size: 11px; color: var(--hw-gray-500); }
  .tbl .tbl-router { font-size: 11px; color: var(--hw-gray-500); }
  .tbl .tbl-sig { display: inline-flex; gap: 2px; align-items: center; }
  .tbl .tbl-sig span { width: 3px; height: 8px; border-radius: 1px; background: var(--hw-gray-200); }
  .tbl .tbl-sig span.b1 { background: var(--hw-success); }
  .tbl .tbl-sig span.b2 { background: var(--hw-warning); }
  .tbl .tbl-sig span.b3 { background: var(--hw-danger); }
  .tbl .tbl-wifi { font-size: 9px; padding: 2px 8px; border-radius: 8px; border: 1px solid; cursor: pointer; font-family: inherit; white-space: nowrap; }
  .tbl .tbl-wifi.on { background: #F0FDF4; border-color: #22C55E55; color: #16A34A; }
  .tbl .tbl-wifi.off { background: #FEF2F2; border-color: #EF444455; color: #DC2626; }
  .tbl .tbl-wifi.na { opacity: 0.3; cursor: default; background: var(--hw-gray-100); border-color: var(--hw-gray-200); color: var(--hw-gray-400); }
  .tbl-empty { text-align: center; padding: 30px; color: var(--hw-gray-400); font-size: 13px; }

  /* Mobile table adjustments */
  .shell.panel.mobile .tbl-wrap { border-radius: 8px; }
  .shell.panel.mobile .tbl th,
  .shell.panel.mobile .tbl td { padding: 5px 6px; font-size: 10px; }
  .shell.panel.mobile .s-bar-health { padding: 8px 14px; grid-template-columns: 1fr; }
  .shell.panel.mobile .s-bar-metrics { grid-template-columns: repeat(3,1fr); }
  .shell.panel.mobile .health-indicator { flex-direction: row; gap: 8px; min-width: auto; padding: 6px 12px; }
  .shell.panel.mobile .health-score { font-size: 18px; }

  /* ── Empty search state ── */
  .no-results { text-align: center; padding: 40px 20px; color: var(--hw-gray-400); }
  .no-results ha-icon { --mdc-icon-size: 36px; color: var(--hw-gray-300); margin-bottom: 8px; }
  .no-results .msg { font-size: 13px; }
  .no-results .sub { font-size: 11px; margin-top: 4px; }
`;

// ═══════════════════════════════════════════════════════════════════
//  ENTITY SCANNER
// ═══════════════════════════════════════════════════════════════════

const ENTITY_PATTERNS = {
  CONNECTED_TO: 'lian_jie_zhi_',
  SIGNAL: 'xin_hao_qiang_du_',
  IP: 'ipdi_zhi_',
  MAC: 'macdi_zhi_',
  CONN_TYPE: 'lian_jie_lei_xing_',
  UPLOAD: 'shang_chuan_su_du_',
  DOWNLOAD: 'xia_zai_su_du_',
  CONN_RATE: 'lian_jie_su_lu_',
  WIFI_BAND: 'wifipin_duan_',
  VENDOR: 'she_bei_han_shang_',
  DEV_TYPE: 'she_bei_lei_xing_',
  TX_DATA: 'fa_song_liu_liang_',
  RX_DATA: 'jie_shou_liu_liang_',
};

class DeviceDB {
  constructor(hass) {
    this.hass = hass;
    this._cache = null;
  }

  scan() {
    if (!this.hass) return { routers: [], devices: [], switches: [], buttons: [], selects: [], stats: {} };
    if (this._cache) return this._cache;

    const states = this.hass.states;
    const prefix = 'huawei_q6_router';

    // ── 1. Discover sensors per device ──
    const deviceSensors = {}; // deviceSlug -> {prop: entity_id}

    for (const [eid, s] of Object.entries(states)) {
      if (!eid.startsWith(`sensor.${prefix}_`)) continue;
      const rest = eid.slice(`sensor.${prefix}_`.length);

      // Check each pattern
      for (const [prop, pattern] of Object.entries(ENTITY_PATTERNS)) {
        if (rest.startsWith(pattern)) {
          const slug = rest.slice(pattern.length);
          if (!deviceSensors[slug]) deviceSensors[slug] = {};
          deviceSensors[slug][prop] = eid;
          break;
        }
      }
    }

    // ── 2. Discover switches ──
    const switches = [];
    const devAccessSwitch = {}; // deviceSlug -> entity_id
    let portMappingSwitch = null;

    for (const [eid, s] of Object.entries(states)) {
      if (!eid.startsWith('switch.')) continue;
      const name = (s.attributes?.friendly_name || '').toLowerCase();
      if (eid.includes(`${prefix}_duan_kou_ying_she_`)) {
        const rest = eid.slice(`switch.${prefix}_duan_kou_ying_she_`.length);
        switches.push({ eid, state: s.state, name: s.attributes?.friendly_name || rest, type: 'port_mapping', label: rest });
      } else if (eid.includes(`${prefix}_she_bei_wififang_wen_`)) {
        const rest = eid.slice(`switch.${prefix}_she_bei_wififang_wen_`.length);
        devAccessSwitch[rest] = eid;
      } else if (eid === `switch.${prefix}_lian_wang_kong_zhi` || name.includes('wifi') && !name.includes('设备')) {
        switches.push({ eid, state: s.state, name: s.attributes?.friendly_name || eid, type: 'wifi' });
      }
    }

    // ── 3. Discover buttons & selects ──
    const buttons = [];
    const selects = [];
    for (const [eid, s] of Object.entries(states)) {
      if (eid.startsWith('button.') && eid.includes('zhong_qi')) {
        buttons.push({ eid, state: s.state, name: s.attributes?.friendly_name || eid });
      }
      if (eid.startsWith('select.') && eid.includes('qu_yu')) {
        selects.push({ eid, state: s.state, name: s.attributes?.friendly_name || eid, options: s.attributes?.options || [] });
      }
    }

    // ── 4. Device trackers ──
    const trackerDevices = []; // {entity_id, name, state}
    const routerNames = new Set();
    for (const [eid, s] of Object.entries(states)) {
      if (!eid.startsWith('device_tracker.')) continue;
      const name = s.attributes?.friendly_name || eid.slice('device_tracker.'.length);
      if (s.state === 'home') {
        trackerDevices.push({ eid, name, state: s.state });
      }
    }

    // ── 5. Identify routers ──
    // Routers are device_trackers with names like: dong_bian_tao, ke_ting, bei_bian_tao, er_lou, xi_bian_tao
    // plus the main router (no device_tracker)
    const routerKeywords = ['dong_bian_tao', 'ke_ting', 'bei_bian_tao', 'er_lou', 'xi_bian_tao'];
    const routerDisplay = { 'dong_bian_tao': '🛋️ 东边套', 'ke_ting': '🛋️ 客厅', 'bei_bian_tao': '🛋️ 北边套', 'er_lou': '🛋️ 二楼', 'xi_bian_tao': '🛋️ 西边套' };

    const satelliteRouters = [];
    for (const [eid, s] of Object.entries(states)) {
      if (!eid.startsWith('device_tracker.')) continue;
      const slug = eid.slice('device_tracker.'.length);
      if (routerKeywords.includes(slug)) {
        satelliteRouters.push({
          slug, name: routerDisplay[slug] || slug,
          eid, state: s.state,
          online: s.state === 'home',
          deviceCount: 0, devices: [],
        });
      }
    }

    // Main router
    const mainRouter = {
      slug: 'main', name: '📡 华为 Q6 主路由',
      eid: null, state: 'home', online: true,
      deviceCount: 0, devices: [],
    };

    const allRouters = [mainRouter, ...satelliteRouters];

    // ── 6. Build device objects ──
    const allDevices = [];

    for (const [slug, sensors] of Object.entries(deviceSensors)) {
      // Skip if this looks like a router itself
      if (routerKeywords.includes(slug)) continue;

      const name = this._friendlyName(slug);
      const connectedTo = sensors.CONNECTED_TO ? this._state(sensors.CONNECTED_TO) : '';
      const signal = sensors.SIGNAL ? this._state(sensors.SIGNAL) : null;
      const ip = sensors.IP ? this._state(sensors.IP) : '';
      const mac = sensors.MAC ? this._state(sensors.MAC) : '';
      const connType = sensors.CONN_TYPE ? this._state(sensors.CONN_TYPE) : '';
      const online = this._isOnline(slug);

      // Determine which router this device belongs to
      let assignedRouter = mainRouter;
      if (connectedTo) {
        for (const r of satelliteRouters) {
          const map = {
            'dong_bian_tao': '东边套', 'ke_ting': '客厅',
            'bei_bian_tao': '北边套', 'er_lou': '二楼', 'xi_bian_tao': '西边套'
          };
          if (connectedTo.includes(map[r.slug])) {
            assignedRouter = r;
            break;
          }
        }
      }

      const device = {
        slug, name, ip, mac, signal, connType, online,
        connectedTo, assignedRouter,
        sensors,
        area: this._getDeviceArea(sensors), // HA area name
        // Switch access
        accessSwitch: devAccessSwitch[slug] || null,
      };
      allDevices.push(device);
      assignedRouter.devices.push(device);
    }

    // Also add tracker-only devices
    for (const td of trackerDevices) {
      const slug = td.eid.slice('device_tracker.'.length);
      if (!deviceSensors[slug] && !routerKeywords.includes(slug)) {
        const device = {
          slug, name: td.name, ip: '', mac: '', signal: null,
          connType: '', online: true, connectedTo: '',
          assignedRouter: mainRouter, sensors: {},
          area: '', // tracker-only: no area
          accessSwitch: devAccessSwitch[slug] || null,
          _trackerOnly: true,
        };
        allDevices.push(device);
        mainRouter.devices.push(device);
      }
    }

    // Update counts
    for (const r of allRouters) {
      r.deviceCount = r.devices.length;
    }

    // ── 7. Speed / Stats ──
    const uploadEid = `sensor.${prefix}_shang_chuan_su_du_${prefix}`;
    const downloadEid = `sensor.${prefix}_xia_zai_su_du_${prefix}`;
    const rxDataEid = `sensor.${prefix}_yi_shou_liu_liang_${prefix}`;
    const txDataEid = `sensor.${prefix}_yi_fa_liu_liang_${prefix}`;

    const totalOnline = allDevices.filter(d => d.online).length;
    const totalDevices = allDevices.length;
    const onlineRouters = allRouters.filter(r => r.online).length;
    const totalRouters = allRouters.length;

    const stats = {
      totalOnline,
      totalDevices,
      onlineRouters,
      totalRouters,
      upload: this._state(uploadEid),
      download: this._state(downloadEid),
      rxData: this._state(rxDataEid),
      txData: this._state(txDataEid),
    };

    // ── 8. Collect areas ──
    const areaSet = new Set(allDevices.filter(d => d.area).map(d => d.area));
    const areas = Array.from(areaSet).sort();

    // Router info
    const routerInfo = {};

    this._cache = {
      routers: allRouters,
      mainRouter,
      satelliteRouters,
      devices: allDevices,
      switches,
      buttons,
      selects,
      stats,
      totalOnline,
      areas,            // unique area names
      prefix,
    };

    return this._cache;
  }

  invalidate() { this._cache = null; }

  _state(eid) {
    if (!eid || !this.hass) return null;
    const s = this.hass.states[eid];
    return s ? s.state : null;
  }

  _friendlyName(slug) {
    // Try to find a friendly name
    for (const [eid, s] of Object.entries(this.hass?.states || {})) {
      if (eid.includes(slug)) {
        const fn = s.attributes?.friendly_name || '';
        if (fn && !fn.includes('IP地址') && !fn.includes('MAC地址') && fn.length < 30) {
          return fn.replace(/ IP地址$/, '').replace(/ MAC地址$/, '').replace(/ 信号强度$/, '').replace(/ 连接类型$/, '').trim();
        }
      }
    }
    // Decode pinyin slug
    return slug.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
  }

  /** Get the HA area name for a device via entity/device/area registries */
  _getDeviceArea(sensors) {
    try {
      const hass = this.hass;
      if (!hass || !hass.entities || !hass.devices || !hass.areas) return '';
      const anyEid = Object.values(sensors)[0];
      if (!anyEid) return '';
      const entReg = hass.entities[anyEid];
      if (!entReg?.device_id) return '';
      const devReg = hass.devices[entReg.device_id];
      if (!devReg?.area_id) return '';
      const areaObj = hass.areas[devReg.area_id];
      return areaObj?.name || '';
    } catch(_) { return ''; }
  }

  _isOnline(slug) {
    // A device is online if it has a device_tracker with state=home
    for (const [eid, s] of Object.entries(this.hass?.states || {})) {
      if (eid === `device_tracker.${slug}`) return s.state === 'home';
    }
    // No tracker = assume online if sensors exist with non-unavailable values
    return true;
  }

  _findReboot(hass) {
    const reboot = [];
    for (const [eid, s] of Object.entries(hass?.states || {})) {
      if (eid.startsWith('button.') && eid.includes('zhong_qi')) {
        reboot.push({ eid, name: s.attributes?.friendly_name || eid });
      }
    }
    return reboot;
  }
}

// ═══════════════════════════════════════════════════════════════════
//  RENDER HELPERS
// ═══════════════════════════════════════════════════════════════════

function fmtSpeed(val) {
  if (!val || val === 'unknown' || val === 'unavailable' || val === '--') return '--';
  const n = parseFloat(val);
  if (isNaN(n)) return '--';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'Mbps';
  return n.toFixed(0) + 'Kbps';
}

function fmtBytes(val) {
  if (!val || val === 'unknown') return '--';
  const n = parseFloat(val);
  if (isNaN(n)) return '--';
  if (n >= 1073741824) return (n / 1073741824).toFixed(1) + 'GB';
  if (n >= 1048576) return (n / 1048576).toFixed(1) + 'MB';
  if (n >= 1024) return (n / 1024).toFixed(1) + 'KB';
  return n + 'B';
}

function signalBars(val) {
  if (val === null || val === undefined || val === '') return 0;
  const n = parseInt(val);
  if (isNaN(n)) return 0;
  if (n >= 50) return 4;
  if (n >= 30) return 3;
  if (n >= 15) return 2;
  if (n >= 5) return 1;
  return 0;
}

function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function deviceIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('iphone') || n.includes('phone') || n.includes('手机') || n.includes('p60') || n.includes('pura') || n.includes('matepad') || n.includes('ipad')) return '📱';
  if (n.includes('macbook') || n.includes('laptop') || n.includes('电脑') || n.includes('matebook') || n.includes('notebook') || n.includes('pc')) return '💻';
  if (n.includes('tv') || n.includes('电视') || n.includes('投影')) return '📺';
  if (n.includes('camera') || n.includes('摄像头') || n.includes('cctv')) return '📹';
  if (n.includes('speaker') || n.includes('音箱') || n.includes('小爱') || n.includes('sound') || n.includes('智能')) return '🔊';
  if (n.includes('printer') || n.includes('打印')) return '🖨️';
  if (n.includes('switch') || n.includes('nintendo')) return '🎮';
  if (n.includes('light') || n.includes('灯') || n.includes('照明')) return '💡';
  if (n.includes('sensor') || n.includes('传感器')) return '📡';
  if (n.includes('lock') || n.includes('门锁') || n.includes('door')) return '🔒';
  if (n.includes('curtain') || n.includes('窗帘')) return '🪟';
  if (n.includes('ac') || n.includes('空调') || n.includes('climate')) return '❄️';
  if (n.includes('fridge') || n.includes('冰箱')) return '🧊';
  if (n.includes('robot') || n.includes('扫地') || n.includes('vacuum')) return '🤖';
  if (n.includes('haos') || n.includes('nas') || n.includes('storage')) return '🖥️';
  if (n.includes('light') || n.includes('筒灯') || n.includes('灯带') || n.includes('柜灯')) return '💡';
  if (n.includes('switch') || n.includes('开关') || n.includes('浴霸')) return '🔌';
  return '📱';
}

// ═══════════════════════════════════════════════════════════════════
//  VIEW RENDERERS
// ═══════════════════════════════════════════════════════════════════

// ─── Topology ───
// Clean topology: only routers as nodes, click to view device list popup

function renderTopology(db, hass, isMobile) {
  const { stats } = db;
  const sats = db.satelliteRouters;
  const satCount = sats.length;

  let html = '<div class="topo-wrap">';

  // ═══ 1. Main router — centered at top ═══
  const mainOnline = db.mainRouter.devices.filter(d => d.online).length;
  html += `<div class="topo-node main" style="left:50%;top:24px;transform:translateX(-50%);" data-router-show="main">
    <span class="ico">📡</span>
    <div style="font-size:13px;font-weight:600;">${esc(db.mainRouter.name)}</div>
    <div style="display:flex;gap:8px;margin-top:3px;font-size:10px;opacity:0.8;">
      <span>${db.mainRouter.deviceCount}台设备</span>
      <span>${mainOnline}在线</span>
    </div>
    <div style="font-size:8px;opacity:0.35;margin-top:3px;">👆 点击查看设备</div>
  </div>`;

  // ═══ 2. Satellites — evenly spread ═══
  const SAT_LEFT_MIN = isMobile ? 6 : 10;
  const SAT_LEFT_MAX = isMobile ? 94 : 90;

  sats.forEach((sat, i) => {
    const leftPct = satCount > 1
      ? SAT_LEFT_MIN + (i / (satCount - 1)) * (SAT_LEFT_MAX - SAT_LEFT_MIN)
      : 50;

    const satOnline = sat.devices.filter(d => d.online).length;
    const cls = `topo-node sat ${sat.online ? 'online' : 'offline'}`;
    html += `<div class="${cls}" style="left:${leftPct}%;top:125px;transform:translateX(-50%);"
      data-router-show="${sat.slug}">
      <span class="ico">📶</span>
      <div style="font-size:12px;font-weight:500;">${esc(sat.name.replace('🛋️ ',''))}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:2px;font-size:10px;opacity:0.7;">
        <span class="dot ${sat.online ? 'on' : 'off'}" style="width:6px;height:6px;"></span>
        <span>${sat.deviceCount}台 · ${satOnline}在线</span>
      </div>
      <div style="font-size:8px;opacity:0.35;margin-top:2px;">👆 查看设备</div>
    </div>`;
  });

  // ═══ 3. Empty state ═══
  if (db.devices.length === 0 && sats.length === 0) {
    html += '<div class="topo-empty">暂未发现设备</div>';
  }

  html += '<div class="topo-legend">🟢 在线 · ⚪ 离线 · 点击路由节点查看设备详情与控制</div>';
  html += '</div>';
  return html;
}

// ─── Card Group ───

function renderCardGroup(db, hass, currentArea) {
  let html = '<div class="cg-wrap">';

  db.routers.forEach(r => {
    // Filter devices by area if specified
    const deviceList = currentArea
      ? r.devices.filter(d => d.area === currentArea)
      : r.devices;
    if (currentArea && deviceList.length === 0) return;

    const cls = r.online ? 'on' : (r === db.mainRouter ? 'on' : 'off');
    const onlineCount = deviceList.filter(d => d.online).length;
    const totalCount = currentArea ? deviceList.length : r.deviceCount;
    html += `<div class="cg-card">
      <div class="cg-hdr">
        <div class="cg-hdr-l">
          <span>${r === db.mainRouter ? '📡' : '📶'}</span>
          <span class="cg-name">${esc(r.name)}</span>
          <span class="cg-st ${cls}">${r.online ? '在线' : '离线'}</span>
        </div>
        <span class="cg-count">${onlineCount}/${totalCount} 在线</span>
      </div>
      <div class="cg-devices">`;

    if (deviceList.length === 0) {
      html += `<div style="font-size:11px;color:var(--hw-gray-400);padding:4px 0;">无连接设备</div>`;
    } else {
      const maxShow = 30;
      const shown = deviceList.slice(0, maxShow);
      shown.forEach(d => {
        const sb = signalBars(d.signal);
        const wifiEid = d.accessSwitch;
        const wifiState = wifiEid && hass?.states[wifiEid]?.state;
        const wifiOn = wifiState === 'on';
        html += `<div class="cg-d" data-device="${esc(d.slug)}">
          <div class="cg-d-ext">
            ${deviceIcon(d.name)}
            <div>
              <div>${esc(d.name.length > 14 ? d.name.slice(0,14)+'…' : d.name)}</div>
              ${d.ip ? `<div class="cg-d-ip">${esc(d.ip)}</div>` : ''}
            </div>
          </div>
          <span class="sig" style="margin-left:auto;">
            <span class="dot ${d.online ? 'on' : 'off'}" style="width:6px;height:6px;margin-right:4px;"></span>
            ${[1,2,3,4].map(i => `<span class="${i <= sb ? 'b1' : ''}"></span>`).join('')}
          </span>
          ${wifiEid ? `<button class="cg-d-wifi ${wifiOn ? 'on' : 'off'}" data-wifi="${wifiEid}" data-wifi-state="${wifiOn ? 'on' : 'off'}">${wifiOn ? '🟢' : '⚪'}</button>` : ''}
        </div>`;
      });
      const remaining = deviceList.length - maxShow;
      if (remaining > 0) {
        html += `<div style="font-size:11px;color:var(--hw-gray-400);padding:6px 4px;">⋯ 还有 ${remaining} 台设备</div>`;
      }
    }

    html += `</div></div>`;
  });

  html += '</div>';
  return html;
}

// ─── Tree ───

function renderTree(db, hass, currentArea) {
  let html = '<div class="tree-wrap">';

  // Helper: filter device list by area
  const byArea = (list) => currentArea ? list.filter(d => d.area === currentArea) : list;

  // Main router
  const mainDevices = byArea(db.mainRouter.devices);
  const mainOnline = mainDevices.filter(d => d.online).length;
  html += `<div class="tree-item main">📡 ${esc(db.mainRouter.name)} <span class="sig">${mainOnline}/${mainDevices.length} 在线</span></div>`;

  mainDevices.slice(0, 50).forEach(d => {
    const wifiEid = d.accessSwitch;
    const wifiState = wifiEid && hass?.states[wifiEid]?.state;
    const wifiOn = wifiState === 'on';
    html += `<div class="tree-item dev" data-device="${esc(d.slug)}">
      <span class="sp"></span>${deviceIcon(d.name)} ${esc(d.name.length > 20 ? d.name.slice(0,20)+'…' : d.name)}
      <span style="color:var(--hw-gray-400);font-size:10px;">
        ${d.ip ? esc(d.ip) : ''}${d.connType ? ' · ' + esc(d.connType) : ''}
      </span>
      <span class="sig">
        <span class="dot ${d.online ? 'on' : 'off'}" style="width:5px;height:5px;margin-right:3px;"></span>
        ${d.signal ? d.signal + 'dBm' : ''}
        ${wifiEid ? `<button class="tr-wifi ${wifiOn ? 'on' : 'off'}" data-wifi="${wifiEid}" data-wifi-state="${wifiOn ? 'on' : 'off'}">${wifiOn ? '🟢' : '⚪'}WiFi</button>` : ''}
      </span>
    </div>`;
  });
  if (mainDevices.length > 50) {
    html += `<div class="tree-item dev" style="color:var(--hw-gray-400);font-size:10px;padding-left:40px;">⋯ 还有 ${mainDevices.length - 50} 台设备</div>`;
  }

  // Each satellite
  db.satelliteRouters.forEach(r => {
    const satDevices = byArea(r.devices);
    if (currentArea && satDevices.length === 0) return;
    const satOnline = satDevices.filter(d => d.online).length;
    html += `<div class="tree-item router">${r.online ? '🟢' : '⚪'} 📶 ${esc(r.name.replace('🛋️ ',''))} <span class="sig">${satOnline}/${satDevices.length} 在线</span></div>`;
    satDevices.slice(0, 40).forEach(d => {
      const wifiEid = d.accessSwitch;
      const wifiState = wifiEid && hass?.states[wifiEid]?.state;
      const wifiOn = wifiState === 'on';
      html += `<div class="tree-item dev" data-device="${esc(d.slug)}">
        <span class="sp"></span>${deviceIcon(d.name)} ${esc(d.name.length > 18 ? d.name.slice(0,18)+'…' : d.name)}
        <span style="color:var(--hw-gray-400);font-size:10px;">${d.ip ? esc(d.ip) : ''}${d.connType ? ' · ' + esc(d.connType) : ''}</span>
        <span class="sig">
          <span class="dot ${d.online ? 'on' : 'off'}" style="width:5px;height:5px;margin-right:3px;"></span>
          ${d.signal ? d.signal + 'dBm' : ''}
          ${wifiEid ? `<button class="tr-wifi ${wifiOn ? 'on' : 'off'}" data-wifi="${wifiEid}" data-wifi-state="${wifiOn ? 'on' : 'off'}">${wifiOn ? '🟢' : '⚪'}WiFi</button>` : ''}
        </span>
      </div>`;
    });
    if (satDevices.length > 40) {
      html += `<div class="tree-item dev" style="color:var(--hw-gray-400);font-size:10px;padding-left:40px;">⋯ 还有 ${satDevices.length - 40} 台设备</div>`;
    }
  });

  html += '</div>';
  return html;
}

// ─── List / Table View ───

function renderListView(db, hass, currentArea, searchTerm, statusFilter, sortBy) {
  let devices = [];

  // Collect all devices, applying area filter
  db.routers.forEach(r => {
    const list = currentArea ? r.devices.filter(d => d.area === currentArea) : r.devices;
    devices = devices.concat(list.map(d => ({ ...d, _routerName: r.name, _isMain: r === db.mainRouter })));
  });

  // Apply search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    devices = devices.filter(d =>
      d.name.toLowerCase().includes(term) ||
      d.ip.toLowerCase().includes(term) ||
      d.mac.toLowerCase().includes(term)
    );
  }

  // Apply status filter
  if (statusFilter === 'online') devices = devices.filter(d => d.online);
  else if (statusFilter === 'offline') devices = devices.filter(d => !d.online);
  else if (statusFilter === 'weak') devices = devices.filter(d => d.online && parseInt(d.signal) < 20);

  // Apply sorting
  if (sortBy === 'name') {
    devices.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'signal') {
    devices.sort((a, b) => {
      const sa = parseInt(a.signal) || 0;
      const sb = parseInt(b.signal) || 0;
      return sb - sa; // strongest first
    });
  } else {
    // Default: routers first, then online before offline
    devices.sort((a, b) => {
      if (a._isMain && !b._isMain) return -1;
      if (!a._isMain && b._isMain) return 1;
      if (a.online && !b.online) return -1;
      if (!a.online && b.online) return 1;
      return 0;
    });
  }

  if (devices.length === 0) {
    return `<div class="no-results">
      <ha-icon icon="mdi:search-off"></ha-icon>
      <div class="msg">没有匹配的设备</div>
      <div class="sub">试试调整搜索词或筛选条件</div>
    </div>`;
  }

  let html = `<div class="tbl-wrap"><table class="tbl">
    <thead><tr>
      <th data-sort-col="name">设备 <span class="sort-arrow ${sortBy === 'name' ? 'on' : ''}">${sortBy === 'name' ? '↑' : '⇅'}</span></th>
      <th>IP</th>
      <th data-sort-col="signal">信号 <span class="sort-arrow ${sortBy === 'signal' ? 'on' : ''}">${sortBy === 'signal' ? '↑' : '⇅'}</span></th>
      <th>状态</th>
      <th>接入</th>
      <th>WiFi</th>
    </tr></thead><tbody>`;

  devices.forEach(d => {
    const sb = signalBars(d.signal);
    const wifiEid = d.accessSwitch;
    const wifiState = wifiEid && hass?.states[wifiEid]?.state;
    const wifiOn = wifiState === 'on';
    const routerShort = d._isMain ? '主路由' : d._routerName.replace('🛋️ ','');
    
    html += `<tr data-device="${esc(d.slug)}">
      <td><div style="display:flex;align-items:center;gap:6px;"><span class="tbl-ico">${deviceIcon(d.name)}</span><span class="tbl-name">${esc(d.name.length > 16 ? d.name.slice(0,16)+'…' : d.name)}</span></div></td>
      <td><span class="tbl-ip">${d.ip || '--'}</span></td>
      <td><span class="tbl-sig">${d.signal !== null && d.signal !== '' && d.signal !== undefined ? [1,2,3,4].map(i => `<span class="${i <= sb ? 'b1' : ''}"></span>`).join('') + ' ' + d.signal + 'dBm' : '--'}</span></td>
      <td><span style="color:${d.online ? 'var(--hw-success)' : 'var(--hw-danger)'};font-weight:500;">${d.online ? '在线' : '离线'}</span></td>
      <td><span class="tbl-router">${esc(routerShort)}</span></td>
      <td>${wifiEid ? `<button class="tbl-wifi ${wifiOn ? 'on' : 'off'}" data-wifi="${wifiEid}" data-wifi-state="${wifiOn ? 'on' : 'off'}">${wifiOn ? '🟢 开' : '⚪ 关'}</button>` : '<span class="tbl-wifi na">—</span>'}</td>
    </tr>`;
  });

  html += `</tbody></table></div>`;
  html += `<div style="text-align:right;padding:6px 12px;font-size:10px;color:var(--hw-gray-400);">共 ${devices.length} 台设备</div>`;
  return html;
}

// ─── Network Controls ───

function renderNetworkControls(db, hass) {
  const switches = [
    { id: 'wifi_access', label: 'WiFi 访问控制', desc: '黑/白名单', icon: 'mdi:shield-account' },
    { id: 'guest', label: '访客网络', desc: '独立 SSID', icon: 'mdi:account-group' },
    { id: 'url_filter', label: '网址过滤', desc: '拦截指定网站', icon: 'mdi:web-off' },
    { id: 'port', label: '端口映射', desc: '外网访问内网', icon: 'mdi:lan' },
    { id: 'time', label: '时间控制', desc: '定时断网', icon: 'mdi:clock-outline' },
    { id: 'twt', label: 'WiFi 6 TWT', desc: '节能模式', icon: 'mdi:wifi-settings' },
    { id: 'r', label: '802.11r', desc: '快速漫游', icon: 'mdi:wifi-arrow-right' },
    { id: 'nfc', label: 'NFC', desc: '一碰连网', icon: 'mdi:nfc' },
  ];

  // Try to find actual switch entities
  const actualSwitches = {};
  for (const [eid, s] of Object.entries(hass?.states || {})) {
    if (eid.startsWith('switch.') && eid.includes('huawei_q6')) {
      const name = (s.attributes?.friendly_name || eid).toLowerCase();
      if (name.includes('wifi') && (name.includes('访问') || name.includes('802'))) {
        if (name.includes('802.11r')) actualSwitches['r'] = { eid, state: s.state };
        else if (!name.includes('设备')) actualSwitches['wifi_access'] = { eid, state: s.state };
      } else if (name.includes('nfc') || eid.includes('nfc')) {
        actualSwitches['nfc'] = { eid, state: s.state };
      } else if (name.includes('twt') || eid.includes('twt')) {
        actualSwitches['twt'] = { eid, state: s.state };
      } else if (name.includes('访客') || eid.includes('guest')) {
        actualSwitches['guest'] = { eid, state: s.state };
      } else if (name.includes('网址') || name.includes('url') || eid.includes('url')) {
        actualSwitches['url_filter'] = { eid, state: s.state };
      } else if (name.includes('端口') || name.includes('port')) {
        actualSwitches['port'] = { eid, state: s.state };
      } else if (name.includes('时间') || name.includes('time_control')) {
        actualSwitches['time'] = { eid, state: s.state };
      }
    }
  }

  let html = '<div class="nc-grid">';
  switches.forEach(s => {
    const actual = actualSwitches[s.id];
    const state = actual?.state || 'off';
    const on = state === 'on';
    html += `<div class="nc-item" data-switch="${s.id}" ${actual ? `data-eid="${actual.eid}"` : 'data-unavailable'}>
      <div class="left">
        <ha-icon icon="${s.icon}"></ha-icon>
        <div><div>${s.label}</div><div style="font-size:10px;color:var(--hw-gray-400);">${s.desc}</div></div>
      </div>
      <div class="nc-toggle ${on ? 'on' : (actual ? 'off' : 'off')}" style="opacity:${actual ? 1 : 0.3};">
        <span class="knob"></span>
      </div>
    </div>`;
  });
  html += '</div>';
  html += '<div class="nc-more" data-more-switches>更多开关 →</div>';

  return html;
}

// ─── Right Panel ───

function renderRightPanel(db, hass) {
  const { stats, buttons } = db;

  let html = '';

  // Router info card
  html += `<div class="r-section">
    <div class="r-title">📋 路由器信息</div>
    <div class="ri-card">
      <div class="ri-row"><span class="ri-l">状态</span><span class="ri-v" style="color:var(--hw-success);">${stats.onlineRouters}/${stats.totalRouters} 路由在线</span></div>
      <div class="ri-row"><span class="ri-l">在线设备</span><span class="ri-v">${stats.totalOnline}</span></div>
      <div class="ri-row"><span class="ri-l">下行</span><span class="ri-v">${fmtSpeed(stats.download)}</span></div>
      <div class="ri-row"><span class="ri-l">上行</span><span class="ri-v">${fmtSpeed(stats.upload)}</span></div>
      <div class="ri-row"><span class="ri-l">已收</span><span class="ri-v">${fmtBytes(stats.rxData)}</span></div>
      <div class="ri-row"><span class="ri-l">已发</span><span class="ri-v">${fmtBytes(stats.txData)}</span></div>
    </div>
  </div>`;

  // Network controls
  html += `<div class="r-section">
    <div class="r-title">🔘 网络控制</div>
    ${renderNetworkControls(db, hass)}
  </div>`;

  // Mobile NC sheet (hidden by default, shown via bottom bar)
  html += `<div class="nc-sheet-o">
    <div class="nc-sheet-h">
      <span>🔘 网络控制</span>
      <ha-icon icon="mdi:close" style="cursor:pointer;--mdc-icon-size:20px;" data-close-sheet></ha-icon>
    </div>
    <div class="nc-sheet-b">
      ${renderNetworkControls(db, hass)}
    </div>
  </div>`;

  // Quick actions
  html += `<div class="r-section">
    <div class="r-title">⚡ 快捷操作</div>
    <div class="qa-wrap">
      <button class="qa-btn pri" data-action="refresh"><ha-icon icon="mdi:refresh"></ha-icon>刷新</button>`;

  buttons.forEach(b => {
    html += `<button class="qa-btn dng" data-action="reboot" data-eid="${esc(b.eid)}"><ha-icon icon="mdi:restart"></ha-icon>${esc(b.name.replace('重启',''))}</button>`;
  });

  html += `</div></div>`;

  return html;
}

// ═══════════════════════════════════════════════════════════════════
//  FULL LAYOUT BUILDER
// ═══════════════════════════════════════════════════════════════════

function renderFullLayout(host, mode) {
  const hass = host._hass;
  if (!hass) return '';

  // Detect if mobile
  const isMobile = mode === 'panel' && window.innerWidth < 769;

  // Init DB
  const db = host._db || new DeviceDB(hass);
  db.hass = hass;
  const data = db.scan();
  host._db = db;

  const viewMode = host._viewMode || 'topology';
  const { stats } = data;

  // ── Shell ──
  const shellCls = `shell ${mode} ${isMobile ? 'mobile' : ''}`;
  const layoutCls = isMobile ? 'mobile-layout' : 'desktop-layout';

  let html = `<div class="${shellCls}" id="_shell">`;

  // ── Header ──
  html += `<div class="hdr">
    <div class="hdr-left">
      <div class="hdr-icon"><ha-icon icon="mdi:router-wireless"></ha-icon></div>
      <div>
        <div class="hdr-title">华为 Q6 路由</div>
        <div class="hdr-sub">${stats.totalOnline} 设备在线 · ${stats.onlineRouters} 路由</div>
      </div>
    </div>
    <div class="hdr-right">
      <div class="badge"><span class="dot on"></span>${stats.onlineRouters}/${stats.totalRouters}</div>
      ${!isMobile ? `<div class="badge"><ha-icon icon="mdi:devices" style="--mdc-icon-size:14px;"></ha-icon>${stats.totalOnline}</div>` : ''}
    </div>
  </div>`;

  // ── View Switcher ──
  html += `<div class="vw-bar">
    <button class="vw-btn ${viewMode === 'topology' ? 'on' : ''}" data-view="topology">🔗 拓扑</button>
    <button class="vw-btn ${viewMode === 'cards' ? 'on' : ''}" data-view="cards">📇 卡片</button>
    <button class="vw-btn ${viewMode === 'tree' ? 'on' : ''}" data-view="tree">🌳 树形</button>
    <button class="vw-btn ${viewMode === 'list' ? 'on' : ''}" data-view="list">📋 列表</button>
  </div>`;

  // ── Health Stats Bar ──
  const totalDevices = stats.totalDevices || 0;
  const offlineDevices = totalDevices - (stats.totalOnline || 0);
  const weakSignalDevices = data.devices.filter(d => d.online && parseInt(d.signal) < 20).length;
  const alerts = [];
  if (offlineDevices > 0) alerts.push(`${offlineDevices}台离线`);
  if (weakSignalDevices > 0) alerts.push(`${weakSignalDevices}台信号弱`);
  const healthScore = offlineDevices === 0 && weakSignalDevices === 0 ? 100
    : offlineDevices <= 2 && weakSignalDevices <= 2 ? 85
    : offlineDevices <= 5 ? 65 : 40;
  const healthClass = healthScore >= 85 ? 'good' : healthScore >= 60 ? 'warn' : 'bad';
  const healthEmoji = healthScore >= 85 ? '🟢' : healthScore >= 60 ? '🟡' : '🔴';

  html += `<div class="s-bar-health">
    <div class="s-bar-metrics">
      <div class="s-item-health"><div class="s-val ${stats.totalOnline >= 10 ? 'good' : 'warn'}">${stats.totalOnline}</div><div class="s-lbl">在线设备</div></div>
      <div class="s-item-health"><div class="s-val">${stats.onlineRouters}/${stats.totalRouters}</div><div class="s-lbl">路由</div></div>
      <div class="s-item-health"><div class="s-val">${fmtSpeed(stats.download)}</div><div class="s-lbl">↓ 下行</div></div>
      ${!isMobile ? `
      <div class="s-item-health"><div class="s-val">${fmtSpeed(stats.upload)}</div><div class="s-lbl">↑ 上行</div></div>
      <div class="s-item-health"><div class="s-val">${data.satelliteRouters.length}</div><div class="s-lbl">子路由</div></div>
      <div class="s-item-health"><div class="s-val ${offlineDevices > 0 ? 'warn' : 'good'}">${offlineDevices}</div><div class="s-lbl">离线</div></div>
      ` : ''}
    </div>
    <div class="health-indicator ${healthClass}" title="网络健康评分">
      <div class="health-score">${healthEmoji} ${healthScore}</div>
      <div class="health-label">健康评分</div>
    </div>
  </div>`;

  // ── Area Filter ──
  const currentArea = host._currentArea || '';
  if (data.areas && data.areas.length > 0) {
    html += `<div class="area-bar">
      <button class="area-chip ${currentArea === '' ? 'on' : ''}" data-area="">🏠 全部</button>`;
    data.areas.forEach(a => {
      html += `<button class="area-chip ${currentArea === a ? 'on' : ''}" data-area="${esc(a)}">${esc(a)}</button>`;
    });
    html += `</div>`;
  }

  // ── Search Bar ──
  const hasSearch = !!host._searchTerm;
  html += `<div class="srch-bar">
    <ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;color:var(--hw-gray-400);flex-shrink:0;"></ha-icon>
    <input class="srch-input" type="text" placeholder="搜索设备名称、IP、MAC..." data-search-input value="${esc(host._searchTerm || '')}">
    <button class="srch-clear ${hasSearch ? 'show' : ''}" data-search-clear>✕</button>
  </div>`;

  // ── Status Filter + Sort ──
  const sf = host._statusFilter || '';
  const sb = host._sortBy || '';
  html += `<div class="flt-bar">
    <span class="flt-label">筛选</span>
    <button class="flt-chip ${sf === '' ? 'on' : ''}" data-filter="">全部</button>
    <button class="flt-chip ${sf === 'online' ? 'on' : ''}" data-filter="online"><span class="dot on"></span>在线</button>
    <button class="flt-chip ${sf === 'offline' ? 'on' : ''}" data-filter="offline"><span class="dot off"></span>离线</button>
    <button class="flt-chip ${sf === 'weak' ? 'on' : ''}" data-filter="weak">📶 信号弱</button>
    <span class="flt-sep"></span>
    <span class="flt-label">排序</span>
    <button class="sort-btn" data-sort="">${sb === '' ? '默认' : sb === 'name' ? '名称 ↑' : sb === 'signal' ? '信号 ↑' : ''}${sb === '' ? '▾' : ''}</button>
    <button class="sort-btn ${sb === 'name' ? 'on' : ''}" data-sort="name">名称</button>
    <button class="sort-btn ${sb === 'signal' ? 'on' : ''}" data-sort="signal">信号</button>
    ${sb ? `<button class="sort-btn" data-sort="" style="margin-left:0;">✕ 清除</button>` : ''}
  </div>`;

  // ── Layout ──
  html += `<div class="${layoutCls}">
    <div class="main-area">`;

  // View content
  switch (viewMode) {
    case 'topology': html += renderTopology(data, hass, isMobile); break;
    case 'cards': html += renderCardGroup(data, hass, currentArea); break;
    case 'tree': html += renderTree(data, hass, currentArea); break;
    case 'list': html += renderListView(data, hass, currentArea, host._searchTerm, host._statusFilter, host._sortBy); break;
    default: html += renderTopology(data, hass, isMobile);
  }

  html += `</div>`;

  // Right panel - inside layout container for both desktop and mobile
  html += `<div class="right-area">${renderRightPanel(data, hass)}</div>`;

  html += `</div>`; // close layout

  // Mobile bottom bar
  if (isMobile) {
    html += `<div class="mb-bar">
      <button class="mb-bar-btn on" data-mb-action="view"><ha-icon icon="mdi:view-dashboard"></ha-icon>视图</button>
      <button class="mb-bar-btn" data-mb-action="controls"><ha-icon icon="mdi:tune"></ha-icon>控制</button>
      <button class="mb-bar-btn" data-mb-action="info"><ha-icon icon="mdi:information-outline"></ha-icon>信息</button>
      <button class="mb-bar-btn" data-mb-action="refresh"><ha-icon icon="mdi:refresh"></ha-icon>刷新</button>
    </div>`;
  }

  html += `</div>`; // close shell

  return html;
}

// ═══════════════════════════════════════════════════════════════════
//  EVENT ATTACHMENT
// ═══════════════════════════════════════════════════════════════════

function attachEvents(host, root) {
  if (!root) return;
  const hass = host._hass;

  // View switcher
  root.querySelectorAll('[data-view]').forEach(b => {
    b.addEventListener('click', () => {
      host._viewMode = b.dataset.view;
      host.render();
    });
  });

  // Device clicks (topology + card + tree)
  root.querySelectorAll('[data-device]').forEach(el => {
    el.addEventListener('click', () => {
      const slug = el.dataset.device;
      const data = host._db?.scan();
      if (!data) return;
      const device = data.devices.find(d => d.slug === slug);
      if (device) showDevicePopup(host, device);
    });
  });

  // Router clicks — show device list popup (topology)
  root.querySelectorAll('[data-router-show]').forEach(el => {
    el.addEventListener('click', () => {
      const slug = el.dataset.routerShow;
      const data = host._db?.scan();
      if (!data) return;
      // Find router by slug
      let router = null;
      if (slug === 'main') router = data.mainRouter;
      else router = data.satelliteRouters.find(r => r.slug === slug);
      if (router) showRouterDevicesPopup(host, router);
    });
  });

  // WiFi toggle buttons (card + tree views)
  root.querySelectorAll('[data-wifi]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const eid = btn.dataset.wifi;
      const currentState = btn.dataset.wifiState;
      const newState = currentState === 'on' ? 'off' : 'on';
      // Optimistic update
      btn.dataset.wifiState = newState;
      btn.className = btn.className.replace(/\b(?:on|off)\b/g, newState);
      btn.textContent = btn.textContent.replace(/^[🟢⚪]/, newState === 'on' ? '🟢' : '⚪');
      // Call service
      host._hass.callService('switch', newState === 'on' ? 'turn_on' : 'turn_off', { entity_id: eid });
    });
  });

  // Action buttons
  root.querySelectorAll('[data-action]').forEach(b => {
    b.addEventListener('click', async () => {
      const action = b.dataset.action;
      if (action === 'refresh') {
        if (host._db) host._db.invalidate();
        host.render();
      } else if (action === 'reboot') {
        const eid = b.dataset.eid;
        if (eid && confirm('确定要重启该路由器吗？')) {
          host._hass.callService('button', 'press', { entity_id: eid });
        }
      }
    });
  });

  // Reboot from actions
  root.querySelectorAll('[data-eid]').forEach(b => {
    if (b.dataset.action === 'reboot') {
      b.addEventListener('click', async () => {
        const eid = b.dataset.eid;
        if (eid && confirm('确定要重启路由器吗？')) {
          host._hass.callService('button', 'press', { entity_id: eid });
        }
      });
    }
  });

  // Switch toggles (nc-item)
  root.querySelectorAll('.nc-item[data-eid]').forEach(item => {
    const toggle = item.querySelector('.nc-toggle');
    if (!toggle) return;
    item.addEventListener('click', (e) => {
      if (e.target.closest('.nc-toggle')) {
        // Toggle click
        const eid = item.dataset.eid;
        const isOn = toggle.classList.contains('on');
        host._hass.callService('switch', isOn ? 'turn_off' : 'turn_on', { entity_id: eid });
        toggle.classList.toggle('on');
        toggle.classList.toggle('off');
      }
    });
  });

  // More switches
  root.querySelectorAll('[data-more-switches]').forEach(el => {
    el.addEventListener('click', () => {
      // For mobile: show sheet
      const sheet = root.querySelector('.nc-sheet-o');
      if (sheet) sheet.classList.toggle('op');
    });
  });

  // Close NC sheet
  root.querySelectorAll('[data-close-sheet]').forEach(el => {
    el.addEventListener('click', () => {
      const sheet = root.querySelector('.nc-sheet-o');
      if (sheet) sheet.classList.remove('op');
    });
  });

  // Close sheet by clicking overlay outside
  root.querySelector('.nc-sheet-o')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove('op');
    }
  });

  // Mobile bar actions
  root.querySelectorAll('[data-mb-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.mbAction;
      root.querySelectorAll('[data-mb-action]').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');

      if (action === 'refresh') {
        if (host._db) host._db.invalidate();
        host.render();
      } else if (action === 'view') {
        // Scroll to view area
        root.querySelector('.vw-bar')?.scrollIntoView({ behavior: 'smooth' });
      } else if (action === 'controls') {
        // Show NC sheet
        const existing = root.querySelector('.nc-sheet-o');
        if (existing) existing.classList.add('op');
      } else if (action === 'info') {
        root.querySelector('.right-area')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Close popup handlers (global)
  document.querySelectorAll('.pop-o .pop-act button').forEach(b => {
    if (!b._listener) {
      b._listener = true;
      b.addEventListener('click', () => {
        const pop = b.closest('.pop-o');
        if (pop) pop.classList.remove('op');
      });
    }
  });

  // Area filter clicks
  root.querySelectorAll('[data-area]').forEach(chip => {
    chip.addEventListener('click', () => {
      host._currentArea = chip.dataset.area;
      host._doRender();
    });
  });

  // ── Search input ──
  const searchInput = root.querySelector('[data-search-input]');
  if (searchInput) {
    let searchTimer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        host._searchTerm = searchInput.value;
        host._doRender();
      }, 250);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        host._searchTerm = '';
        host._doRender();
      }
    });
  }

  // ── Search clear ──
  root.querySelectorAll('[data-search-clear]').forEach(btn => {
    btn.addEventListener('click', () => {
      host._searchTerm = '';
      const inp = root.querySelector('[data-search-input]');
      if (inp) inp.value = '';
      host._doRender();
    });
  });

  // ── Status filter clicks ──
  root.querySelectorAll('[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      host._statusFilter = chip.dataset.filter;
      host._doRender();
    });
  });

  // ── Sort button clicks ──
  root.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      host._sortBy = btn.dataset.sort;
      host._doRender();
    });
  });

  // ── Table column sort ──
  root.querySelectorAll('[data-sort-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sortCol;
      host._sortBy = host._sortBy === col ? '' : col;
      host._doRender();
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
//  DEVICE POPUP
// ═══════════════════════════════════════════════════════════════════

function showDevicePopup(host, device) {
  if (!device) return;

  const ii = deviceIcon(device.name);
  const sig = device.signal || '--';
  const routerName = device.assignedRouter?.name || '--';

  const ov = document.createElement('div');
  ov.className = 'pop-o op';
  ov.innerHTML = `<div class="pop-c">
    <div class="pop-hdr">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:40px;height:40px;background:#E8F7FF;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;">${ii}</div>
        <div><div class="pop-t" style="font-size:16px;font-weight:600;">${esc(device.name)}</div>
        <div style="font-size:11px;color:var(--hw-gray-400);margin-top:2px;">${device.mac || ''}</div></div>
      </div>
    </div>
    <div class="pop-bd">
      <div class="pop-r"><span class="pop-rl">IP 地址</span><span class="pop-rv">${device.ip || '--'}</span></div>
      <div class="pop-r"><span class="pop-rl">MAC 地址</span><span class="pop-rv">${device.mac || '--'}</span></div>
      <div class="pop-r"><span class="pop-rl">连接类型</span><span class="pop-rv">${device.connType || '--'}</span></div>
      <div class="pop-r"><span class="pop-rl">信号强度</span><span class="pop-rv">${sig}dBm</span></div>
      <div class="pop-r"><span class="pop-rl">连接至</span><span class="pop-rv">${esc(routerName)}</span></div>
      <div class="pop-r"><span class="pop-rl">状态</span><span class="pop-rv" style="color:${device.online ? 'var(--hw-success)' : 'var(--hw-danger)'}">${device.online ? '在线' : '离线'}</span></div>
      ${device.accessSwitch ? `
      <div class="pop-act" style="margin-top:8px;">
        <button class="qa-btn" data-toggle-wifi data-eid="${device.accessSwitch}" style="justify-content:center;">📶 切换WiFi访问</button>
      </div>` : ''}
      <div class="pop-act"><button class="qa-btn" data-close-popup style="flex:1;justify-content:center;">关闭</button></div>
    </div>
  </div>`;

  host.shadowRoot.appendChild(ov);
  const close = () => { if (ov.parentNode) ov.parentNode.removeChild(ov); };
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  ov.querySelector('[data-close-popup]')?.addEventListener('click', close);

  // Toggle WiFi access
  ov.querySelector('[data-toggle-wifi]')?.addEventListener('click', () => {
    const eid = ov.querySelector('[data-toggle-wifi]').dataset.eid;
    host._hass.callService('switch', 'toggle', { entity_id: eid });
    close();
  });
}

// ═══════════════════════════════════════════════════════════════════
//  ROUTER DEVICE LIST POPUP
// ═══════════════════════════════════════════════════════════════════

function showRouterDevicesPopup(host, router) {
  const hass = host._hass;
  if (!hass || !router) return;

  const devices = router.devices;
  const isMain = router === host._db?.scan().mainRouter;

  const ov = document.createElement('div');
  ov.className = 'pop-o op';

  let gridHtml = '';
  if (devices.length === 0) {
    gridHtml = '<div style="text-align:center;padding:30px;color:var(--hw-gray-400);font-size:13px;">暂无设备</div>';
  } else {
    gridHtml = '<div class="rd-grid">';
    devices.forEach(d => {
      const wifiEid = d.accessSwitch;
      const wifiState = wifiEid && hass.states[wifiEid]?.state;
      const wifiOn = wifiState === 'on';

      gridHtml += `<div class="rd-card">
        <div class="dot-pos"><span class="dot ${d.online ? 'on' : 'off'}"></span></div>
        <div class="rd-ico">${deviceIcon(d.name)}</div>
        <div class="rd-nm">${esc(d.name.length > 14 ? d.name.slice(0,14)+'…' : d.name)}</div>
        <div class="rd-mt">
          ${d.ip ? `<span>🌐 ${esc(d.ip)}</span>` : ''}
          ${d.signal ? `<span>� ${d.signal}dBm</span>` : ''}
          ${d.connType ? `<span>${esc(d.connType)}</span>` : ''}
          ${d.mac ? `<span>🔗 ${esc(d.mac.slice(0,17))}</span>` : ''}
        </div>
        <div class="rd-ctl">
          ${wifiEid
            ? `<button class="rd-wifi ${wifiOn ? 'on' : 'off'}" data-wifi="${wifiEid}" data-wifi-state="${wifiOn ? 'on' : 'off'}">${wifiOn ? '🟢 WiFi 允许' : '⚪ WiFi 禁止'}</button>`
            : '<span class="rd-wifi na">— 无控制</span>'}
        </div>
      </div>`;
    });
    gridHtml += '</div>';
  }

  ov.innerHTML = `<div class="rd-pop-c">
    <div class="rd-pop-hdr">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:24px;">${isMain ? '📡' : '📶'}</span>
        <div>
          <div style="font-size:16px;font-weight:600;">${esc(router.name)}</div>
          <div style="font-size:11px;color:var(--hw-gray-400);">${devices.length} 台设备 · ${devices.filter(d=>d.online).length} 台在线</div>
        </div>
      </div>
      <button class="qa-btn" style="font-size:14px;padding:4px 10px;" data-close-popup>✕</button>
    </div>
    <div class="rd-pop-bd">${gridHtml}</div>
  </div>`;

  // ⚠️ 必须追加到 shadowRoot 内，CSS 才能生效
  host.shadowRoot.appendChild(ov);

  // Close
  const close = () => { if (ov.parentNode) ov.parentNode.removeChild(ov); };
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  ov.querySelector('[data-close-popup]')?.addEventListener('click', close);

  // WiFi toggle in popup
  ov.querySelectorAll('[data-wifi]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const eid = btn.dataset.wifi;
      const currentState = btn.dataset.wifiState;
      const newState = currentState === 'on' ? 'off' : 'on';
      // Optimistic update
      btn.dataset.wifiState = newState;
      btn.className = `rd-wifi ${newState}`;
      btn.textContent = newState === 'on' ? '🟢 WiFi 允许' : '⚪ WiFi 禁止';
      // Call service
      host._hass.callService('switch', newState === 'on' ? 'turn_on' : 'turn_off', { entity_id: eid });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
//  PANEL ELEMENT
// ═══════════════════════════════════════════════════════════════════

class HuaweiRouterPanel extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._viewMode = localStorage.getItem('hw_router_view') || 'topology';
    this._currentArea = ''; // Area filter: '' = all
    this._db = null;

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${STYLES}</style>
      <div class="shell panel st-c" id="_loading">
        <div class="spin"></div>
        <div class="st-msg">加载中...</div>
      </div>`;
  }

  set hass(hass) {
    this._hass = hass;
    if (hass) this._doRender();
  }

  get _root() { return this.shadowRoot.querySelector('#_shell') || this.shadowRoot.children[1] || this.shadowRoot.firstElementChild; }

  render() {
    this._doRender();
  }

  _doRender() {
    if (!this._hass) return;

    // Save view mode
    try { localStorage.setItem('hw_router_view', this._viewMode); } catch(_) {}

    const html = renderFullLayout(this, 'panel');
    const container = this.shadowRoot.querySelector('#_loading') ||
                      this.shadowRoot.querySelector('#_shell');

    if (container) {
      container.outerHTML = html;
    } else {
      this.shadowRoot.innerHTML = `<style>${STYLES}</style>${html}`;
    }

    // Attach events
    const root = this.shadowRoot;
    attachEvents(this, root);
  }

  connectedCallback() {
    if (this._hass) this._doRender();
  }
}

// ═══════════════════════════════════════════════════════════════════
//  CARD ELEMENT
// ═══════════════════════════════════════════════════════════════════

class HuaweiRouterCard extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._config = {};
    this._viewMode = 'cards';
    this._currentArea = '';
    this._searchTerm = '';
    this._statusFilter = '';
    this._sortBy = '';
    this._db = null;

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${STYLES}</style>
      <div class="shell card"><ha-card>
        <div class="st-c"><div class="spin"></div><div class="st-msg">加载中...</div></div>
      </ha-card></div>`;
  }

  set hass(hass) {
    this._hass = hass;
    if (this._config && hass) this._doRender();
  }

  setConfig(config) {
    if (!config) throw new Error('Configuration required');
    this._config = config;
    if (this._hass) this._doRender();
  }

  getCardSize() { return 4; }

  _doRender() {
    if (!this._hass || !this._config) return;

    const html = renderFullLayout(this, 'card');
    this.shadowRoot.innerHTML = `<style>${STYLES}</style><div class="shell card"><ha-card>${html}</ha-card></div>`;

    const root = this.shadowRoot;
    attachEvents(this, root);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  REGISTRATION
// ═══════════════════════════════════════════════════════════════════

customElements.define('huawei-router-panel', HuaweiRouterPanel);
customElements.define('huawei-router-card', HuaweiRouterCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'huawei-router-card',
  name: 'Huawei Q6 Router',
  description: 'Complete Huawei Q6 Mesh Router dashboard',
  preview: true,
});

console.info(
  `%c HUAWEI Q6 ROUTER %c ${VERSION} %c Panel + Card `,
  'background:#07A0F2;color:white;font-weight:bold;border-radius:3px 0 0 3px;padding:2px 6px;',
  'background:#1E293B;color:white;padding:2px 6px;',
  'background:#22C55E;color:green;border-radius:0 3px 3px 0;padding:2px 6px;'
);