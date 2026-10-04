---
title: "Clash TUN 启动失败时先核对哪些前置条件"
description: "Clash TUN 启动失败时先核对哪些前置条件。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

Tun 启动失败时，应先核对手册列出的前置条件，而不是先改路由表或重装内核。适用条件是：配置里已写 `tun.enable: true`，但虚网卡未起来、路由未接管，或日志提示协议栈、重定向、IPv6、防火墙相关错误。判断依据是：每一项都能在官方字段说明中找到对应限制；不满足时，先改配置再启动。

## 先核对接栈、防火墙与网卡名

`stack` 可选 `system`、`gvisor`、`mixed`、`mips`。无使用问题时手册建议 `mips`，默认也是 `mips`。若打开了防火墙，则无法使用 `system` 和 `mixed`，需要按平台放行内核：Windows 在系统防火墙中放行内核；MacOS 一般无需配置，防火墙默认放行签名软件，若开启防火墙后不可用，再尝试放行应用；Linux 一般无需配置，若防火墙拦截，可放行 TUN 网卡出站（文档示例为对名为 Mihomo 的网卡执行 `iptables` ACCEPT）。

`device` 用于指定 tun 网卡名。MacOS 只能使用 `utun` 开头的名称，写成其他前缀会直接不具备启动条件。`gso` 与 `gso-max-size` 仅支持 Linux；`congestion-controller` 仅在 `mips` 栈生效。若当前平台或栈不支持仍写入这些项，应视为前置条件不满足，先删除或改回默认后再启动。

## 再核对路由、重定向与规则冲突

`auto-route` 才会自动把全局流量导入 tun。`auto-redirect` 仅支持 Linux，用于自动配置 iptables/nftables 重定向 TCP，且要求 `auto-route` 已启用。Android 上它仅转发本地 IPv4；要通过热点或中继共享 VPN 连接，手册指向使用 VPNHotspot，而不是指望 `auto-redirect` 自动完成。Linux 路由器场景下，带 `auto-route` 的 `auto-redirect` 可按预期工作。

`route-address-set` 与 `route-exclude-address-set` 仅支持 Linux，需要 nftables，并且 `auto-route` 与 `auto-redirect` 都已启用；它们与任意配置中的 `routing-mark` 冲突。`include-interface` 与 `exclude-interface` 冲突，不可一起配置。UID 相关规则仅 Linux 且需要 `auto-route`；Android 用户与包名规则仅 Android 且需要 `auto-route`。MAC 过滤仅 Linux，且需要 `auto-route` 与 `auto-redirect`。出现启动失败时，先去掉互相冲突或平台不支持的项，再观察能否创建 tun 设备。

## IPv6、DNS 劫持与失败后的下一步

`inet6-address` 会在启动时检查系统其他网卡是否已有 IPv6，不存在则禁用该功能。若要强制开启 tun 的 v6 地址，需设置环境变量 `SKIP_SYSTEM_IPV6_CHECK=1`，同时把顶层 `ipv6` 设为 `true`，二者缺一则 v6 前置条件不成立。`dns-hijack` 会把匹配连接导入内部 DNS；MacOS/Windows 无法自动劫持发往局域网的 DNS，Android 开启私人 DNS 时也无法自动劫持。这些不是“启动成功”的充分条件，但会导致 Tun 起来后解析行为与预期不符，应在失败排查时一并核对。

若上述条件都满足仍不能启动：Linux 先确认防火墙未拦截 tun 出站，并检查 `iproute2-table-index`（默认 2022）、`iproute2-rule-index`（默认 9000）是否被占用；Windows 核对内核是否已放行，以及 `strict-route` 是否因防火墙规则导致异常；MacOS 把 `device` 改回 `utun` 前缀。多出口设备不要只依赖 `auto-detect-interface`，改为手动指定出口网卡后再试。仍失败则保持配置最小集：`enable` 加推荐栈，暂时关闭 `auto-redirect`、`strict-route` 与各类 include/exclude，确认虚网卡能创建后再逐项加回。

资料：https://wiki.metacubex.one/config/inbound/tun/
