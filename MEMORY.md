# Long-Term Memory

_Last updated: 2026-06-11_

---

## 🏠 Home Assistant Projects

### HACS Vision (HACS 增强面板)
- **版本**: v2.1.2 | **GitHub**: https://github.com/C3H3-AI/hacs-vision
- **源路径**: `D:\ai-hub\integrations\hacs_vision\`
- **生产代码**: `custom_components/hacs_vision/` — 后端 api.py + 前端 panel.js
- **前端源码**: `frontend_src/` — Lit Element, Rollup 构建
- **部署**: 构建后用 `ha_remote.py` upload 到 `/config/custom_components/hacs_vision/`，需继续用 HACS 安装（Release 才是官方分发方式）
- **核心功能**: 商店浏览/更新/管理/集成配置弹窗/中文本地化翻译
- **翻译机制**: 自建 API `/api/hacs_vision/translations/{domain}` 读取各集成 `translations/zh-Hans.json`，`_t()` 适配 config/options 双键结构
- **发布流程**: GitHub Draft Release → 写 Changelog → Publish → HA 商店检测到新 Tag
- ⚠️ **踩坑**: HA 2026.6.0 不通过 REST API 暴露自定义组件翻译，`hass.loadBackendTranslation()` 无效，需自建翻译 API

### HA Instance Info
- **外网**: http://api.homediy.top:8123
- **内网**: 192.168.3.3:8123
- **SSH**: `root@api.homediy.top`, 密钥 `~/.ssh/id_ha`
- **Token**: 环境变量 `HA_TOKEN`（有效期至 2036 年）
- **Node.js WS 脚本**: 必须设置 `dns.setDefaultResultOrder('ipv4first')`

### Claw Dashboard (Claw Plus Integration)
- **目的**: 为 Claw Assistant 开发全屏仪表盘，可视化/控制配置项，查看已安装技能/插件/工作区文档
- **集成路径**: `D:\ai-hub\integrations\ha-claw-plus\custom_components\claw_plus\`
- **仪表盘文件**: `D:\ai-hub\claw-dashboard-v5.yaml` (~28KB)
- **仪表盘 URL**: http://api.homediy.top:8123/dashboard-test/claw
- **4 个服务**: `set_option`, `list_workspace`, `read_workspace_file`, `write_workspace_file`
- **Sensor**: `sensor.claw_dashboard_config_claw_config`

#### ⚠️ 已知待修复 Bug
- `sensor.py` 中 `_get_claw_base(hass)` 把 `hass` 对象传入 executor job → 应改为传 `config_dir: str`
- 修复后需重新部署 sensor.py + 重启 HA

#### HA 路径
- Skills: `/config/custom_components/claw_assistant/data/skills/`
- Workspace docs: `/config/custom_components/claw_assistant/data/workspace/`
- Plugins: `/config/custom_components/claw_assistant/plugins/`

### 和风天气集成
- 已通过 HACS 安装（仓库: `c1pher-cn/heweather`）
- 本地: `D:\ai-hub\heweather_extracted\heweather-main\`

---

## 🃏 html-card-pro 核心知识

### API
- **Data Binding**: `data-entity` + `data-action`, `data-state-text`, `data-brightness` 等
- **JS Globals**: `root`, `$`, `$$`, `hass` (live proxy), `config`, `overlay`
- **Live Updates**: `root._watchedEntities` + `root._onHassUpdate`, 零轮询
- **claw API**: `claw.callService()`, `claw.toggle()`, `claw.state()`, `claw.navigate()`

### 设计规则
- 所有颜色用 HA CSS 变量（零硬编码）
- `border-radius: 10px` 强制
- 禁止 card 背景/阴影（ha-card 提供）
- 禁止 emoji（用 ha-icon 或 SVG）
- 禁止 position:fixed（在 card 容器内）

### 关键踩坑
1. `document.currentScript` 始终为 null → 用 `root`/`card` 变量
2. inline event handler（如 `onclick="..."`）完全不工作 → 用 `data-action` 或事件委托
3. 用 `root.__init` 防重入确保 script 只执行一次

### 技能文件
- 路径: `.trae/skills/ha-html-pro-card/SKILL.md`

---

## 🔧 Home Assistant 开发踩坑集

1. **ConfigEntry Options 不是实体** → 不能用 `data-entity` 绑定
2. **阻塞 I/O 检测** → `os.scandir()`/`open()` 在 async handler 中必须用 `async_add_executor_job`
3. **`.pyc` 缓存** → 部署新代码后必须删除 `__pycache__` 并重启
4. **`hass` 对象跨线程** → executor job 中不应访问 `hass` 对象，传基本类型字符串
5. **REST API vs WebSocket** → `supports_response=True` 的服务用 REST 返回空数组，必须用 WebSocket `return_response:true`
6. **`set_option` 后 sensor 不刷新** → 需手动调用 `homeassistant.update_entity`
7. **`pipeline_timeout` 单位** → HA 存储秒数，UI 显示分钟，需要转换
8. **YAML 部署** → 用 `lovelace/config/save` WS 命令，需先获取完整 config 再修改后回写
9. **自定义组件翻译** → HA 2026.6.0 不通过 REST API 暴露 `custom_components/{domain}/translations/`，`hass.loadBackendTranslation()` 在 iframe 中返回空值，必须自建后端 API 读取 JSON 文件

---

## 🔧 小艺 Push 功能

- 完成开发：const.py / models.py / services.yaml / __init__.py / xiaoyi.py 4 个文件修改
- **根因**: `send_text()` 走 A2A artifact-update 需要活跃会话，主动推送被云端静默丢弃
- **解决方案**: `send_push()` 走 HTTP Webhook (hag.cloud.huawei.com)
- 语法验证已通过

---

## 📂 重要项目文件索引

| 路径 | 用途 |
|------|------|
| `D:\ai-hub\integrations\ha-claw-plus\` | claw_plus 集成源码 |
| `D:\ai-hub\integrations\hacs_vision\` | HACS Vision 集成源码 |
| `D:\ai-hub\claw-dashboard-v5.yaml` | 当前仪表盘配置 |
| `D:\ai-hub\claw-dashboard-v4.yaml` | v4 备份 |
| `D:\ai-hub\scripts\ha_remote.py` | HA 文件上传和 SSH 工具 |
| `D:\ai-hub\scripts\ha_*.js` | HA 测试和部署脚本 |

## Promoted From Short-Term Memory (2026-06-03)

<!-- openclaw-memory-promotion:memory:memory/2026-05-27.md:4:4 -->
- 用户要求为 HA 安装天气集成 [score=0.843 recalls=0 avg=0.620 source=memory/2026-05-27.md:4-4]

## Promoted From Short-Term Memory (2026-06-06)

<!-- openclaw-memory-promotion:memory:memory/2026-05-29.md:35:35 -->
- **Time**: ~09:25–09:34 CST [score=0.875 recalls=0 avg=0.620 source=memory/2026-05-29.md:35-35]
