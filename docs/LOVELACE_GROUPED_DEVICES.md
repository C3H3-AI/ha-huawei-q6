# 华为路由器设备分组显示 - Lovelace卡片配置

## 部署步骤

1. 上传 `grouped_devices_sensor.py` 到HA
2. 重启HA核心
3. 在HA中添加以下卡片

---

## 卡片一：所有设备总览卡片

```yaml
type: entities
title: 📱 所有在线设备
entities:
  - entity: sensor.huawei_router_grouped_devices_all_devices
    icon: mdi:account-multiple
    name: 在线设备总数
```

点击该实体可以在详情页看到设备列表和IP地址。

---

## 卡片二：子路由分组卡片

```yaml
type: horizontal-stack
title: 📶 Mesh子路由设备分布
cards:
  - type: entity
    entity: sensor.huawei_router_grouped_devices_ke_ting
    icon: mdi:router-wireless
    name: 客厅
  - type: entity
    entity: sensor.huawei_router_grouped_devices_dong_bian_tao
    icon: mdi:router-wireless
    name: 东边套
  - type: entity
    entity: sensor.huawei_router_grouped_devices_bei_bian_tao
    icon: mdi:router-wireless
    name: 北边套
  - type: entity
    entity: sensor.huawei_router_grouped_devices_er_lou
    icon: mdi:router-wireless
    name: 二楼
  - type: entity
    entity: sensor.huawei_router_grouped_devices_xi_bian_tao
    icon: mdi:router-wireless
    name: 西边套
```

---

## 卡片三：设备详细列表（Markdown）

```yaml
type: markdown
content: >
  {% set devices = state_attr('sensor.huawei_router_grouped_devices_all_devices', 'devices') %}

  # 📱 在线设备列表

  **总计：{{ devices|length }} 台设备**

  ---

  {% if devices %}

  {% for device in devices %}

  ### {{ device.name }}

  - **IP地址**: {{ device.ip }}
  - **MAC地址**: {{ device.mac }}
  - **连接位置**: {{ device.connected_to }}

  ---

  {% endfor %}

  {% else %}

  目前没有在线设备

  {% endif %}
```

---

## 卡片四：按子路由分组的设备表格

```yaml
type: vertical-stack
title: 📋 设备详细列表
cards:
  # 客厅设备
  - type: entities
    title: 🏠 客厅 (5G)
    entities:
      - entity: sensor.huawei_router_grouped_devices_ke_ting
        icon: mdi:router-wireless
  # 东边套设备
  - type: entities
    title: 🛏️ 东边套
    entities:
      - entity: sensor.huawei_router_grouped_devices_dong_bian_tao
        icon: mdi:router-wireless
  # 北边套设备
  - type: entities
    title: 🛏️ 北边套
    entities:
      - entity: sensor.huawei_router_grouped_devices_bei_bian_tao
        icon: mdi:router-wireless
  # 二楼设备
  - type: entities
    title: 🏠 二楼
    entities:
      - entity: sensor.huawei_router_grouped_devices_er_lou
        icon: mdi:router-wireless
  # 西边套设备
  - type: entities
    title: 🛏️ 西边套
    entities:
      - entity: sensor.huawei_router_grouped_devices_xi_bian_tao
        icon: mdi:router-wireless
```

---

## 卡片五：综合仪表盘

```yaml
type: vertical-stack
title: 🌐 华为路由器综合监控
cards:
  # 1. 网络状态
  - type: horizontal-stack
    cards:
      - type: entity
        entity: binary_sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_wan_status
        name: WAN
        icon: mdi:wan
        state_color: true
      - type: entity
        entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_external_ip
        name: 公网IP
        icon: mdi:ip-network
      - type: entity
        entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_uptime
        name: 在线时长
        icon: mdi:clock-outline

  # 2. 流量监控
  - type: horizontal-stack
    cards:
      - type: gauge
        entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_download_speed
        name: ⬇️ 下载
        unit: KiB/s
        min: 0
        max: 1000
        needle: true
      - type: gauge
        entity: sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_upload_speed
        name: ⬆️ 上传
        unit: KiB/s
        min: 0
        max: 200
        needle: true

  # 3. 设备总览
  - type: entities
    title: 📱 在线设备
    entities:
      - entity: sensor.huawei_router_grouped_devices_all_devices
        icon: mdi:account-multiple

  # 4. 子路由分布
  - type: horizontal-stack
    cards:
      - type: entity
        entity: sensor.huawei_router_grouped_devices_ke_ting
        icon: mdi:router-wireless
        name: 客厅
      - type: entity
        entity: sensor.huawei_router_grouped_devices_dong_bian_tao
        icon: mdi:router-wireless
        name: 东边套
      - type: entity
        entity: sensor.huawei_router_grouped_devices_bei_bian_tao
        icon: mdi:router-wireless
        name: 北边套
      - type: entity
        entity: sensor.huawei_router_grouped_devices_er_lou
        icon: mdi:router-wireless
        name: 二楼
      - type: entity
        entity: sensor.huawei_router_grouped_devices_xi_bian_tao
        icon: mdi:router-wireless
        name: 西边套

  # 5. 诊断信息
  - type: entities
    title: 🔧 集成诊断
    entities:
      - entity: sensor.huawei_router_diagnostics
        icon: mdi:diagnostics
```

---

## 查看设备详情

在HA中点击任意分组传感器实体，可以看到：

```
sensor.huawei_router_grouped_devices_ke_ting

状态: 29

属性:
├── devices: [
│     {
│       "name": "华为P60",
│       "ip": "192.168.3.233",
│       "mac": "B2:3D:0A:78:C8:E2"
│     },
│     {
│       "name": "华为P40",
│       "ip": "192.168.3.41",
│       "mac": "A2:5C:E8:0D:E7:D7"
│     },
│     ...
│   ]
├── device_count: 29
└── connection_type: "sub_router"
```

---

## 故障排除

### 问题：没有看到分组传感器

**原因**: `router_clients_sensors` 选项未启用

**解决**:
1. 进入 HA 设置 → 集成
2. 找到华为路由器集成
3. 点击"配置" → "选项"
4. 启用 "Router clients sensors"
5. 保存并重启

### 问题：子路由名称不正确

**原因**: 子路由的 `connected_via_id` 属性与实际名称不匹配

**解决**: 可以在 Lovelace 卡片中手动指定名称
