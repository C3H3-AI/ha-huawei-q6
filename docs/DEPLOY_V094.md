# 华为路由器集成 v0.9.4 部署说明

## 问题修复

本次更新修复了以下问题：

1. **子路由器识别问题**
   - 增强了 `is_hilink` 属性，添加了华为设备名称和 MAC OUI 识别
   - 增强了 `is_router` 属性，添加了多种路由器识别模式
   - 添加了备用路由器检测机制，当 device_topology API 返回空时从 HostInfo 中识别

2. **子路由器 IP 地址显示**
   - uptime 传感器现在会显示 IP 地址在 `extra_state_attributes` 中

## 识别模式

路由器现在通过以下方式识别：

1. **HiLink 设备标志**：`HiLinkDevice == True`
2. **名称模式**：`ActualName` 或 `HostName` 包含以下关键词：
   - WS-、HW-、Huawei、WS8000、WS8500、Q6、凌霄、Mesh、Router
3. **华为 MAC OUI**：MAC 地址前缀属于华为设备
4. **备用检测**：当 topology API 无返回时，从 HostInfo 中检测

## 部署步骤

### 方法1：通过 HA UI 上传（推荐）

1. 下载 `huawei_router_update.zip` 文件
2. 打开 Home Assistant UI
3. 进入 **设置** → **系统** → **重载** 或 **重启**
4. 进入 **设置** → **设备与服务** → **集成**
5. 找到"华为路由器"集成，点击右侧的三个点 → **重新加载**

注意：由于是更新现有集成，UI 上传方式可能不适用，请使用方法2。

### 方法2：手动替换文件

1. 通过 SFTP/SCP 连接 Home Assistant
   ```bash
   ssh doula@api.homediy.top
   # 密码：cdd633723
   ```

2. 导航到集成目录：
   ```bash
   cd ~/.homeassistant/custom_components/huawei_router/
   ```

3. 备份当前文件：
   ```bash
   cp -r . ../huawei_router_backup_$(date +%Y%m%d)
   ```

4. 解压新文件覆盖：
   ```bash
   unzip -o /path/to/huawei_router_update.zip
   ```

5. 重启 Home Assistant：
   ```bash
   ha core restart
   ```

### 方法3：通过 HA Terminal addon

如果安装了 Terminal addon：

1. 打开 Terminal addon
2. 执行：
   ```bash
   cd /config/custom_components/huawei_router
   # 上传 zip 文件后
   unzip -o /tmp/huawei_router_update.zip
   ha core restart
   ```

## 验证步骤

1. 打开 Home Assistant UI
2. 进入 **设置** → **设备与服务**
3. 检查华为路由器集成，应该显示：
   - 1 个主路由器（Primary router / WS8000-16）
   - 5 个子路由器（东边套、客厅、北边套、二楼、西边套）
4. 点击主路由器，查看传感器
5. 点击子路由器，验证：
   - uptime 传感器属性中包含 `ip_address`
   - clients 传感器显示该子路由下的设备数量

## 预期结果

- 设备列表应该显示 **6 个设备**（1 主路由 + 5 子路由）
- 每个子路由器的 uptime 传感器应该有 `ip_address` 属性
- 实体数量应该保持稳定（约 292 个实体）

## 故障排除

### 子路由器仍不显示

检查 HA 日志：
```bash
ha logs --tail 100 | grep -i huawei
```

如果看到以下日志：
```
No routers found from device topology. Trying fallback detection from HostInfo.
Fallback detected router: xxx (MAC: xxx, HostName: xxx)
```
说明备用检测已触发。

### 查看调试日志

在 `configuration.yaml` 中添加：
```yaml
logger:
  default: info
  logs:
    custom_components.huawei_router: debug
```

然后重启 HA 并查看日志。

## 文件列表

本次更新修改了以下文件：
- `client/classes.py` - 添加华为 OUI 识别和辅助函数
- `update_coordinator.py` - 添加备用路由器检测逻辑
- `sensor.py` - uptime 传感器添加 IP 地址属性
