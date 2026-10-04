---
title: "Clash 排除规则不生效怎样核对平台条件"
description: "Clash 排除规则不生效怎样核对平台条件。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

## 先判断“不生效”发生在哪一类排除

Clash（mihomo）TUN 排除不生效时，应先按官方字段分类，而不是改代理规则。文档里至少有五类：`route-exclude-address` 在启用 `auto-route` 时排除自定义网段；`route-exclude-address-set` 把规则集中的目标 IP CIDR 加入防火墙，匹配流量绕过路由；`exclude-interface` 排除被路由的接口；`exclude-uid` / `exclude-uid-range` 按用户排除；Android 的 `exclude-package` 按包名排除。MAC 还有 `exclude-mac-address`。每一类的平台条件不同，用错类会表现为整段配置静默无效。

共同前提是 `tun.enable` 为 true，且文档要求该类规则所依赖的 `auto-route`（以及部分场景的 `auto-redirect`）已启用。`auto-redirect` 仅 Linux，用于自动配置 iptables/nftables 重定向 TCP，并要求 `auto-route` 已启用。Android 上该选项仅转发本地 IPv4。若排除的是“根本不进 TUN 的网段或进程”，却只在规则集里写了 DIRECT，则不属于本文要核对的平台条件问题。

## 按操作系统逐项核对启用条件

Linux：UID 规则仅在 Linux 被支持，并且需要 `auto-route`。MAC 限制仅支持 Linux，且需要 `auto-route` 和 `auto-redirect`。`route-address-set` / `route-exclude-address-set` 仅支持 Linux，还需要 nftables，以及上述两个开关。缺 nftables 或缺 `auto-redirect` 时，规则集排除不会按“匹配绕过路由”工作。接口排除与包含互斥：`include-interface` 与 `exclude-interface` 不可一起配置。

Android：用户和应用规则仅在 Android 被支持，并且需要 `auto-route`。应核对 `include-android-user`、`include-package`、`exclude-package`。文档中的常用用户 ID 为机主 0、手机分身 10、应用多开 999。未配置的用户不会被 TUN 路由（在使用包含用户时）；未配置的包名同样不会按包含逻辑进入 TUN。要通过热点或中继共享 VPN 连接，文档指向 VPNHotspot，而不是再加一条排除。

Windows / macOS：不要用 UID、包名、MAC、nftables 规则集解释“排除失败”。macOS 的 `device` 只能是 `utun` 开头。Windows 若开了 `strict-route`，文档说明会添加防火墙规则阻止普通多宿主 DNS 解析造成的 DNS 泄露，也可能让 VirtualBox 等无法正常工作，这会被误认为排除或路由异常。防火墙开启时 system 与 mixed 栈不可用，需按文档放行内核，否则表现为流量未按 TUN 路径处理。

`dns-hijack` 也有平台限制：macOS/Windows 无法自动劫持发往局域网的 DNS；Android 开启私人 DNS 则无法自动劫持。把 DNS 当成“排除对象”时，要先用这三条判断是平台限制还是排除字段无效。

## 核对互斥、旧写法与栈/防火墙

排除不生效时继续核对互斥项：`route-address-set`、`route-exclude-address-set` 与任意配置中的 `routing-mark` 冲突。`route-address` 用于自定义要路由进 TUN 的网段，不是排除。旧写法 `inet4-route-exclude-address`、`inet6-route-exclude-address` 即将废弃，应对照 `route-exclude-address` 是否仍在使用旧键名。IPv6 排除还依赖启动时系统其他网卡是否已有 IPv6，否则功能会被禁用；强制开启需 `SKIP_SYSTEM_IPV6_CHECK=1` 且顶层 `ipv6: true`。

协议栈方面，文档建议无问题情况下使用 mips。system 使用系统协议栈；gvisor 在用户空间实现；mixed 为 TCP 用 system、UDP 用 gvisor。防火墙未放行时不要用 system/mixed 来解释排除结果。Linux 放行示例为对 TUN 网卡出站 `ACCEPT`（文档假设网卡名为 Mihomo）。

## 仍不生效时的下一步

按清单收口：当前 OS 是否在字段支持列表中；`auto-route` / `auto-redirect` / nftables 是否缺一；是否同时写了 include 与 exclude 接口；是否与 `routing-mark` 冲突；是否仍用即将废弃的 inet4/inet6 排除键；IPv6 是否被启动检查关掉。任一项不满足，先改平台条件，再改排除内容。平台根本不提供该排除维度时，停止在 `tun` 段追加同类字段。

资料来源：https://wiki.metacubex.one/config/inbound/tun/
