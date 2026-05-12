# 华为路由器集成增强版 - 部署说明

## 修改内容

### 1. 修复 button/select unknown 问题
- 修改 `update_coordinator.py` 中的 `is_router_online` 方法
- 子路由在没有独立API时回退到主路由检查

### 2. 添加端口映射管理服务
- `huawei_router.port_mapping_add` - 添加端口映射
- `huawei_router.port_mapping_remove` - 删除端口映射
- `huawei_router.port_mapping_list` - 列出所有端口映射

### 3. 添加诊断传感器
- `sensor.huawei_router_diagnostics` - 显示集成健康状态

### 4. 添加设备分组传感器（新功能）
- `sensor.huawei_router_grouped_devices_all_devices` - 所有在线设备总览
- `sensor.huawei_router_grouped_devices_ke_ting` - 客厅子路由设备
- `sensor.huawei_router_grouped_devices_dong_bian_tao` - 东边套子路由设备
- `sensor.huawei_router_grouped_devices_bei_bian_tao` - 北边套子路由设备
- `sensor.huawei_router_grouped_devices_er_lou` - 二楼子路由设备
- `sensor.huawei_router_grouped_devices_xi_bian_tao` - 西边套子路由设备

每个传感器属性包含：
- `devices`: 设备列表（名称、IP、MAC）
- `device_count`: 设备数量
- `connection_type`: 连接类型

## 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `update_coordinator.py` | 修改 | 修复is_router_online，添加diagnostics_info属性 |
| `services.py` | 修改 | 添加端口映射CRUD服务 |
| `sensor.py` | 修改 | 添加HuaweiDiagnosticsSensor类 |
| `grouped_devices_sensor.py` | **新增** | 添加设备分组传感器 |

## 部署步骤

### 方式一：手动部署

1. **备份原文件**
```bash
# SSH到HA服务器
ssh root@你的HA服务器IP

# 备份原文件
cp /config/custom_components/huawei_mesh_router/update_coordinator.py \
   /config/custom_components/huawei_mesh_router/update_coordinator.py.bak

cp /config/custom_components/huawei_mesh_router/services.py \
   /config/custom_components/huawei_mesh_router/services.py.bak

cp /config/custom_components/huawei_mesh_router/sensor.py \
   /config/custom_components/huawei_mesh_router/sensor.py.bak
```

2. **上传修改后的文件**
```bash
# 使用scp上传
scp update_coordinator.py root@你的HA服务器IP:/config/custom_components/huawei_mesh_router/
scp services.py root@你的HA服务器IP:/config/custom_components/huawei_mesh_router/
scp sensor.py root@你的HA服务器IP:/config/custom_components/huawei_mesh_router/
scp grouped_devices_sensor.py root@你的HA服务器IP:/config/custom_components/huawei_mesh_router/
```

3. **重启HA**
```bash
ha core restart
```

### 方式二：使用SMB共享

1. 在HA中启用SMB共享（如果未启用）
2. 通过Windows文件资源管理器访问 `\\你的HA服务器IP\config`
3. 备份并替换文件
4. 重启HA

## 验证

### 1. 检查button是否可用
在HA界面中检查以下实体状态：
- `button.huawei_router_reboot` - 应显示"点击运行"而非"unknown"
- `button.huawei_router_reboot_*` - 子路由的重启按钮

### 2. 检查select是否可用
在HA界面中检查以下实体：
- `select.huawei_router_zone_*` - 应显示可选择的区域选项

### 3. 检查诊断传感器
- `sensor.huawei_router_diagnostics` - 应显示"ok"状态
- 点击实体查看详细属性

### 4. 测试端口映射服务

在HA开发者工具中调用服务：

```yaml
# 添加端口映射
service: huawei_router.port_mapping_add
data:
  internal_host: "192.168.3.100"
  internal_port: 8123
  external_port: 8123
  protocol: "TCP"
  description: "Home Assistant"
  enabled: true

# 删除端口映射
service: huawei_router.port_mapping_remove
data:
  external_port: 8123
  protocol: "TCP"

# 列出端口映射（会在日志中输出）
service: huawei_router.port_mapping_list
```

## 服务调用示例（自动化）

```yaml
# 自动创建端口映射
automation:
  - alias: "添加HA端口映射"
    trigger:
      - platform: time
        at: "00:00:00"
    action:
      - service: huawei_router.port_mapping_add
        data:
          internal_host: "192.168.3.3"
          internal_port: 8123
          external_port: 8123
          protocol: "TCP"
          description: "Home Assistant Web"
```

## 故障排除

### 按钮仍然显示unknown
1. 检查HA日志中的认证错误
2. 确认路由器密码正确
3. 检查网络连接

### 服务调用失败
1. 检查API是否支持端口映射功能
2. 查看HA日志中的具体错误信息

## 回滚

如需回滚，执行：
```bash
# 恢复备份
cp /config/custom_components/huawei_mesh_router/update_coordinator.py.bak \
   /config/custom_components/huawei_mesh_router/update_coordinator.py

cp /config/custom_components/huawei_mesh_router/services.py.bak \
   /config/custom_components/huawei_mesh_router/services.py

cp /config/custom_components/huawei_mesh_router/sensor.py.bak \
   /config/custom_components/huawei_mesh_router/sensor.py

# 重启HA
ha core restart
```

## 文件位置

修改后的文件位于：
```
C:\Users\duola\Documents\huawei_mesh_router\
├── update_coordinator.py       (已修改)
├── services.py               (已修改)
├── sensor.py                 (已修改)
├── grouped_devices_sensor.py (新增)
└── DEPLOY.md                (本文件)
```

## Lovelace卡片配置

详见 `LOVELACE_GROUPED_DEVICES.md`

---

**注意**: 部署前请确保已备份原文件！
