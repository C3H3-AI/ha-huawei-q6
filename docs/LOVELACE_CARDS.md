# 华为路由器综合仪表盘 - Lovelace YAML配置

## 使用说明

1. 在HA中打开仪表盘设置
2. 点击"编辑仪表盘"
3. 点击右上角"..."菜单
4. 选择"编辑原始配置"
5. 将以下YAML粘贴到适当位置

---

## 方案一：完整综合仪表盘

```yaml
type: vertical-stack
title: 华为路由器综合监控
cards:
  # ===== 第一行：网络状态概览 =====
  - type: horizontal-stack
    cards:
      # WAN状态
      - type: entity
        entity: binary_sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_wan_status
        name: WAN状态
        icon: mdi:wan
        state_color: true
        
      # 公网IP
      - type: entity
        entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_external_ip
        name: 公网IP
        icon: mdi:ip-network
        
      # 在线时长
      - type: entity
        entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_uptime
        name: 在线时长
        icon: mdi:clock-outline
        unit: 秒

  # ===== 第二行：流量监控 =====
  - type: horizontal-stack
    cards:
      # 下载速度仪表
      - type: gauge
        entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_download_speed
        name: 下载速度
        unit: KiB/s
        min: 0
        max: 1000
        needle: true
        severity:
          green: 0
          yellow: 500
          red: 800
        
      # 上传速度仪表
      - type: gauge
        entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_upload_speed
        name: 上传速度
        unit: KiB/s
        min: 0
        max: 200
        needle: true
        severity:
          green: 0
          yellow: 100
          red: 150

  # ===== 第三行：流量统计 =====
  - type: horizontal-stack
    cards:
      # 总下载
      - type: entity
        entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_data_received
        name: 总下载
        icon: mdi:download
        unit: B
        layout: vertical
        
      # 总上传
      - type: entity
        entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_data_sent
        name: 总上传
        icon: mdi:upload
        unit: B
        layout: vertical
        
      # 数据包统计
      - type: entity
        entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_packets_received
        name: 收包数
        icon: mdi:package-variant
        layout: vertical

  # ===== 第四行：华为路由器设备追踪 =====
  - type: entities
    title: 📱 华为设备状态
    entities:
      - entity: device_tracker.huawei_p60
        icon: mdi:cellphone
      - entity: device_tracker.huawei_p40
        icon: mdi:cellphone
      - entity: device_tracker.huawei_matebook_b3_420
        icon: mdi:laptop

  # ===== 第五行：Mesh子路由状态 =====
  - type: horizontal-stack
    cards:
      - type: entity
        entity: sensor.huawei_router_clients_ke_ting
        name: 客厅
        icon: mdi:router-wireless
      - type: entity
        entity: sensor.huawei_router_clients_dong_bian_tao
        name: 东边套
        icon: mdi:router-wireless
      - type: entity
        entity: sensor.huawei_router_clients_bei_bian_tao
        name: 北边套
        icon: mdi:router-wireless
      - type: entity
        entity: sensor.huawei_router_clients_er_lou
        name: 二楼
        icon: mdi:router-wireless
      - type: entity
        entity: sensor.huawei_router_clients_xi_bian_tao
        name: 西边套
        icon: mdi:router-wireless

  # ===== 第六行：诊断信息 =====
  - type: entities
    title: 🔧 集成诊断
    entities:
      - entity: sensor.huawei_router_diagnostics
        icon: mdi:diagnostics
```

---

## 方案二：精简版（适合侧边栏）

```yaml
type: entities
title: 华为路由器
entities:
  # 状态概览
  - entity: binary_sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_wan_status
    icon: mdi:wan
  - entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_external_ip
    icon: mdi:ip-network
  - type: divider
  # 流量
  - entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_download_speed
    icon: mdi:download
    name: 下载
  - entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_upload_speed
    icon: mdi:upload
    name: 上传
  - type: divider
  # 设备
  - entity: device_tracker.huawei_p60
    icon: mdi:cellphone
  - entity: device_tracker.huawei_p40
    icon: mdi:cellphone
  - type: divider
  # Mesh
  - entity: sensor.huawei_router_total_clients
    icon: mdi:account-multiple
  - entity: sensor.huawei_router_clients
    icon: mdi:account
    name: 活跃设备
```

---

## 方案三：流量趋势图

```yaml
type: vertical-stack
title: 流量监控
cards:
  # 速度趋势
  - type: history-graph
    title: 带宽趋势 (最近1小时)
    hours_to_show: 1
    entities:
      - entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_download_speed
        name: 下载
        color: '#00ff00'
      - entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_upload_speed
        name: 上传
        color: '#ff0000'

  # 数据包趋势
  - type: history-graph
    title: 数据包趋势
    hours_to_show: 1
    entities:
      - entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_packet_download_speed
        name: 下载包速
      - entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_packet_upload_speed
        name: 上传包速

  # 流量统计卡片
  - type: horizontal-wrap
    cards:
      - type: statistic
        entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_data_received
        title: 总下载
        period:
          type: hour
        stat_type: change
      - type: statistic
        entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_data_sent
        title: 总上传
        period:
          type: hour
        stat_type: change
```

---

## 方案四：完整网络状态页面

```yaml
type: custom:mod-card
card_mod:
  style: |
    ha-card {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
card:
  type: vertical-stack
  cards:
    # 头部信息
    - type: custom:html-template
      template: |
        <div style="padding: 16px; color: white;">
          <h2>🌐 华为凌霄子母路由 Q6 网线版</h2>
          <p style="color: #888;">主路由 + 5个子路由 Mesh网络</p>
        </div>

    # 状态卡片
    - type: glance
      entities:
        - entity: binary_sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_wan_status
          name: WAN
        - entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_external_ip
          name: 公网IP
        - entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_uptime
          name: 在线

    # 流量仪表
    - type: grid
      cards:
        - type: gauge
          entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_download_speed
          name: ⬇️ 下载
          unit: KiB/s
          min: 0
          max: 1000
        - type: gauge
          entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_upload_speed
          name: ⬆️ 上传
          unit: KiB/s
          min: 0
          max: 200

    # Mesh拓扑
    - type: custom:upcoming-media-card
      # 这里可以自定义显示Mesh拓扑
```

---

## 方案五：设备列表（含IP地址）

```yaml
type: entities
title: 📱 华为设备列表
entities:
  # 主设备
  - entity: device_tracker.huawei_p60
    icon: mdi:cellphone
    name: P60 Pro
  - entity: device_tracker.huawei_p40
    icon: mdi:cellphone
    name: P40
  - entity: device_tracker.huawei_matebook_b3_420
    icon: mdi:laptop
    name: MateBook
  # 其他华为设备...
```

---

## 自定义卡片推荐

建议安装以下自定义卡片以获得更好的展示效果：

1. **bar-card** - 进度条显示
2. **mini-graph-card** - 迷你图表
3. **config-template-card** - 动态配置

安装后可以使用更美观的展示方式。

---

## 快速复制

将上方任意方案的YAML代码复制到你的HA仪表盘配置中即可使用。
