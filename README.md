# Huawei Q6 Router Integration for Home Assistant

Home Assistant 自定义集成，用于控制华为 Q6 路由器（基于 vmakeev/huawei_mesh_router 修改）。

[![HACS Default](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)
[![License](https://img.shields.io/github/license/C3H3-AI/ha-huawei-q6)](https://github.com/C3H3-AI/ha-huawei-q6/blob/main/LICENSE.md)

## 功能特性

- 获取整个 Mesh 网络中所有路由器和连接设备的信息
  - 连接设备跟踪和标记
  - 设备连接参数（频率、信号强度、访客设备和 HiLink 设备、上传/下载速率）
  - 设备连接到的特定路由器名称
  - 连接设备数量（总计和每个路由器）
- Wi-Fi 访问管理
  - 启用/禁用/配置访客 Wi-Fi 网络
  - 启用或禁用 Wi-Fi 访问控制
  - 从黑名单/白名单添加/删除设备
  - 每个客户设备的 Wi-Fi 访问开关
- 启用和禁用对特定站点的访问
- 主路由器的硬件和固件版本
- Internet 连接详细信息（IP 地址、状态、上传/下载速率）
- 每个路由器的运行时间
- 控制每个路由器的 NFC（OneHop Connect）
- 控制快速漫游功能（802.11r）
- 控制目标唤醒时间（降低 Wi-Fi 6 设备在睡眠模式下的功耗）
- 端口映射开关
- Internet 访问时间控制开关
- 重启按钮
- Mesh 网络中设备连接、断开连接或移动的事件
- 自动检测可用功能

## 已确认支持的型号

| 名称 | 型号 | 备注 |
|------|------|------|
| 华为 Q6 网线版 | WS8000-16 | 已测试 |

## 安装

### 方法 1：通过 HACS

1. 在 HACS 中搜索 "Huawei Q6 Router"
2. 点击安装
3. 重启 Home Assistant

### 方法 2：手动安装

1. 下载 `custom_components/huawei_router` 目录
2. 将其复制到 Home Assistant 的 `custom_components/` 目录
3. 重启 Home Assistant

## 配置

1. 转到 **设置** → **设备与服务** → **添加集成**
2. 搜索 "Huawei Q6 Router"
3. 输入路由器的 IP 地址、用户名和密码
4. 点击提交

## 更新日志

### v1.10.0

- **修复主路由重启按键缺失问题**：华为 Q6 网线版主路由之前没有重启按键，现在已修复
- **清理冗余代码**：移除注释掉的子路由 API 创建逻辑，精简 update_coordinator.py
- **移除工具脚本**：删除 check_ha.py、deploy_to_ha.py、upload_*.py 等开发辅助脚本
- **代码整理**：清理 button.py，分离主路由和子路由按键创建逻辑

## 基于

本集成基于 [vmakeev/huawei_mesh_router](https://github.com/vmakeev/huawei_mesh_router) 修改而来。

## 许可证

MIT License
