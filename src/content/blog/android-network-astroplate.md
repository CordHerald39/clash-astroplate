---
title: "Clash Meta 手机端（Android）：换网络后失效先检查哪一层"
description: "Clash Meta 手机端（Android）：换网络后失效先检查哪一层。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

## 适用条件与分层原则

本文只回答：Clash Meta 手机端在 Android 上更换网络（例如 Wi-Fi 与蜂窝互切）后表现为失效时，应先检查哪一层。适用条件是设备能安装并运行 Clash Meta for Android（仓库要求最低 Android 5.0，建议 7.0 及以上），用户已通过系统 VPN 连接请求对话框授权，且问题出现在承载网络变化之后。Clash Meta for Android 把 Clash.Meta 接到 Android `VpnService` 上，每个用户或工作资料同时只能有一个活动 VPN 服务。失效时应按“系统授权与活动服务 → 本地 TUN 与路由/DNS → 受保护的网关套接字 → 底层替代接口”由外向内排查，而不是先假设内核或远端节点。

## 第一层：系统是否仍把该应用当作当前 VPN

先核这一层，因为后续 TUN 都建立在“当前已准备的 VPN 应用”之上。文档要求首次激活前系统会弹出连接请求对话框；之后可在「设置 > 网络和互联网 > VPN」看到已接受请求的应用，并可配置系统选项或忘记该 VPN。活动连接时，状态栏会出现钥匙图标，快捷设置会给出信息面板，应用还需提供不可清除通知。系统也可在 VPN 设置页断开连接、忘记应用，或关闭 always-on；这些操作会停止活动连接。`VpnService.prepare()` 必须再次调用：若返回授权 Intent，说明当前准备状态已丢失或被其他应用占用；若返回 null，才说明仍是已准备状态。`establish()` 在未准备或权限被收回时返回 null，此时不应再解释为“配置没生效”，而是服务根本没有拿到本地接口。

Always-on（Android 7.0 起）由系统拉起服务，应用负责网关隧道。Android 8.0 及以上在 always-on 断开或连不上时会显示不可清除通知。若还打开了“阻止不使用 VPN 的连接”，未走 VPN 的流量会被系统丢掉，设置应用会警告连通前可能没有互联网。这一层失败的判断依据是：钥匙图标与活动通知消失、VPN 列表显示未连接、always-on 无法连接通知出现，或 `prepare()`/`establish()` 表明权限与准备状态无效。

## 第二层：本地 TUN 的地址、路由与 DNS 是否仍被系统使用

仅当第一层显示服务仍活动时，才检查接口配置。建立连接的顺序在文档中是固定的：`prepare()` → `protect()` 隧道套接字 → 连接网关 → 用 `Builder` 配置本地 TUN → `establish()`。`addAddress()` 至少提供一个 IPv4 或 IPv6 地址及掩码；`addRoute()` 按目的地址过滤，若希望系统把流量送进 VPN 接口，需要有路由（接受全部流量时使用 `0.0.0.0/0` 或 `::/0` 这类开放路由）；`addDnsServer()` 决定 VPN 接口上的 DNS。换网络后若服务被停掉再拉起，必须在新的 `establish()` 之前重新设置这些值。分应用 VPN 的允许列表或拒绝列表也必须在连接建立前设定，要改列表只能建立新连接。若第一层正常但目的地址不再匹配已添加路由，或 DNS 服务器未再写入 Builder，应判定问题在接口配置层，而不是蜂窝/Wi-Fi 射频本身。

## 第三层：隧道套接字与替代网络接口

文档强调必须 `VpnService.protect()` 通往网关的套接字，把它排除在系统 VPN 之外，否则会形成环路。换网络后网关可达性、源地址与默认接口都会变，未保护或保护失败时，即便 TUN 还在，封装流量也可能无法离开设备。系统调用 `onRevoke()` 时，替代网络接口已经在转发流量，此时应关闭受保护套接字和 `ParcelFileDescriptor`。这一层的判断依据是：系统 UI 仍显示 VPN，但实际访问已走撤销后的底层网络；或网关套接字未能保持在 VPN 之外。

## 本层无法确认时的下一步

第一层失败：到系统 VPN 页确认应用未被忘记，核 always-on 与“阻止不使用 VPN 的连接”，必要时重新完成 `prepare()` 授权。仓库提供向 `com.github.kr328.clash.ExternalControlActivity` 发送 `START_CLASH`、`STOP_CLASH`、`TOGGLE_CLASH` 以启停服务，应在系统层状态明确后再使用。第一层通过而第二层存疑：按 Builder 规则核对地址、路由、DNS 以及分应用列表是否在新的 `establish()` 前完整写入。前两层都通过仍异常：检查 `protect()` 与 `onRevoke()` 后的资源释放，并先确认新承载网络自身可达。不要跳过系统授权层去解释“换网络后内核一定还在”。

资料：
https://developer.android.com/develop/connectivity/vpn
https://github.com/MetaCubeX/ClashMetaForAndroid
