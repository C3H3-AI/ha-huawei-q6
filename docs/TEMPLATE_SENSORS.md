# 华为路由器模板传感器配置

## configuration.yaml 中的 sensor 配置

将以下配置添加到你的 `configuration.yaml` 文件中：

```yaml
# ===== 华为路由器模板传感器 =====
template:
  - sensor:
      # 华为路由器总览传感器
      - name: "华为路由器状态总览"
        unique_id: huawei_router_overview
        state: >
          {% if states('binary_sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_wan_status') == 'on' %}
            在线
          {% else %}
            离线
          {% endif %}
        icon: mdi:router-wireless
        attributes:
          公网IP: >
            {{ states('sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_external_ip') }}
          下载速度: >
            {{ states('sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_download_speed') }} KiB/s
          上传速度: >
            {{ states('sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_upload_speed') }} KiB/s
          在线时长: >
            {{ states('sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_uptime') }} 秒
          总下载: >
            {{ states('sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_data_received') }} B
          总上传: >
            {{ states('sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_data_sent') }} B

      # 华为设备在线状态
      - name: "华为设备在线数"
        unique_id: huawei_devices_online
        state: >
          {% set count = 0 %}
          {% if states('device_tracker.huawei_p60') == 'home' %}{% set count = count + 1 %}{% endif %}
          {% if states('device_tracker.huawei_p40') == 'home' %}{% set count = count + 1 %}{% endif %}
          {% if states('device_tracker.huawei_matebook_b3_420') == 'home' %}{% set count = count + 1 %}{% endif %}
          {{ count }}
        icon: mdi:account-multiple
        unit_of_measurement: 台

      # 华为P60详细信息
      - name: "华为P60详细信息"
        unique_id: huawei_p60_detail
        state: >
          {% if states('device_tracker.huawei_p60') == 'home' %}
            在家
          {% else %}
            离线
          {% endif %}
        icon: mdi:cellphone
        attributes:
          状态: >
            {{ states('device_tracker.huawei_p60') }}
          IP地址: >
            {{ state_attr('device_tracker.huawei_p60', 'ip') }}
          MAC地址: >
            {{ state_attr('device_tracker.huawei_p60', 'mac') }}
          最后出现: >
            {{ state_attr('device_tracker.huawei_p60', 'last_seen') }}
          连接方式: >
            {{ state_attr('device_tracker.huawei_p60', 'source_type') }}
          路由器: >
            {{ state_attr('device_tracker.huawei_p60', 'host_name') }}

      # 华为P40详细信息
      - name: "华为P40详细信息"
        unique_id: huawei_p40_detail
        state: >
          {% if states('device_tracker.huawei_p40') == 'home' %}
            在家
          {% else %}
            离线
          {% endif %}
        icon: mdi:cellphone
        attributes:
          状态: >
            {{ states('device_tracker.huawei_p40') }}
          IP地址: >
            {{ state_attr('device_tracker.huawei_p40', 'ip') }}
          MAC地址: >
            {{ state_attr('device_tracker.huawei_p40', 'mac') }}
          最后出现: >
            {{ state_attr('device_tracker.huawei_p40', 'last_seen') }}

      # 华为MateBook详细信息
      - name: "MateBook详细信息"
        unique_id: huawei_matebook_detail
        state: >
          {% if states('device_tracker.huawei_matebook_b3_420') == 'home' %}
            在家
          {% else %}
            离线
          {% endif %}
        icon: mdi:laptop
        attributes:
          状态: >
            {{ states('device_tracker.huawei_matebook_b3_420') }}
          IP地址: >
            {{ state_attr('device_tracker.huawei_matebook_b3_420', 'ip') }}
          MAC地址: >
            {{ state_attr('device_tracker.huawei_matebook_b3_420', 'mac') }}
          最后出现: >
            {{ state_attr('device_tracker.huawei_matebook_b3_420', 'last_seen') }}

      # 流量数据格式化显示
      - name: "华为路由器流量显示"
        unique_id: huawei_traffic_display
        state: "正常"
        icon: mdi:chart-line
        attributes:
          下载速度: >
            {{ "%.2f"|format(states('sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_download_speed')|float) }} KiB/s
          上传速度: >
            {{ "%.2f"|format(states('sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_upload_speed')|float) }} KiB/s
          总下载: >
            {{ (states('sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_data_received')|int / 1024 / 1024 / 1024)|round(2) }} GB
          总上传: >
            {{ (states('sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_data_sent')|int / 1024 / 1024 / 1024)|round(2) }} GB
          下载包速: >
            {{ "%.1f"|format(states('sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_packet_download_speed')|float) }} 包/s
          上传包速: >
            {{ "%.1f"|format(states('sensor.hua_wei_ling_xiao_zi_mu_lu_you_q6_wang_xian_ban_packet_upload_speed')|float) }} 包/s

      # 华为设备汇总表
      - name: "华为设备汇总"
        unique_id: huawei_devices_summary
        state: "华为设备"
        icon: mdi:devices
        attributes:
          P60: >
            {% if states('device_tracker.huawei_p60') == 'home' %}
              🟢 在家 - {{ state_attr('device_tracker.huawei_p60', 'ip') }}
            {% else %}
              🔴 离线
            {% endif %}
          P40: >
            {% if states('device_tracker.huawei_p40') == 'home' %}
              🟢 在家 - {{ state_attr('device_tracker.huawei_p40', 'ip') }}
            {% else %}
              🔴 离线
            {% endif %}
          MateBook: >
            {% if states('device_tracker.huawei_matebook_b3_420') == 'home' %}
              🟢 在家 - {{ state_attr('device_tracker.huawei_matebook_b3_420', 'ip') }}
            {% else %}
              🔴 离线
            {% endif %}
```

---

## Lovelace中直接显示IP地址

在Lovelace实体卡片中，可以直接显示IP地址属性：

```yaml
type: entities
title: 华为设备状态
entities:
  # 方式1：显示为实体属性
  - entity: device_tracker.huawei_p60
    icon: mdi:cellphone
  - entity: sensor.huawei_p60_detail
    icon: mdi:information

  # 方式2：使用entity-row自定义
  - type: custom:entity-attributes-row
    entity: device_tracker.huawei_p60
    attributes:
      - ip
      - mac
      - last_seen
```

---

## 完整设备卡片配置

```yaml
type: vertical-stack
title: 📱 华为设备监控
cards:
  # 设备汇总
  - type: entities
    entities:
      - entity: sensor.huawei_devices_summary
        icon: mdi:devices

  # 华为P60
  - type: entity
    entity: device_tracker.huawei_p60
    name: 华为P60 Pro
    icon: mdi:cellphone
    secondary_info: >
      IP: {{ state_attr('device_tracker.huawei_p60', 'ip') }}
    state_color: true

  # 华为P40
  - type: entity
    entity: device_tracker.huawei_p40
    name: 华为P40
    icon: mdi:cellphone
    secondary_info: >
      IP: {{ state_attr('device_tracker.huawei_p40', 'ip') }}
    state_color: true

  # MateBook
  - type: entity
    entity: device_tracker.huawei_matebook_b3_420
    name: MateBook B3 420
    icon: mdi:laptop
    secondary_info: >
      IP: {{ state_attr('device_tracker.huawei_matebook_b3_420', 'ip') }}
    state_color: true

  # 华为设备详情
  - type: entities
    title: 设备详细信息
    entities:
      - entity: sensor.huawei_p60_detail
      - entity: sensor.huawei_p40_detail
      - entity: sensor.huawei_matebook_detail
```

---

## 配置后自动刷新

添加自动化使传感器定期更新：

```yaml
automation:
  - alias: 更新华为设备传感器
    trigger:
      - platform: time
        at: "*/5 * * * *"  # 每5分钟
    action:
      - service: homeassistant.update_entity
        target:
          entity_id:
            - sensor.huawei_devices_summary
            - sensor.huawei_traffic_display
```

---

## 查看实体属性

在HA开发者工具中检查device_tracker实体的所有属性：

```python
# 在模板中访问所有属性
{{ state_attr('device_tracker.huawei_p60', 'ip') }}
{{ state_attr('device_tracker.huawei_p60', 'mac') }}
{{ state_attr('device_tracker.huawei_p60', 'last_seen') }}
{{ state_attr('device_tracker.huawei_p60', 'source_type') }}
{{ state_attr('device_tracker.huawei_p60', 'host_name') }}
```
