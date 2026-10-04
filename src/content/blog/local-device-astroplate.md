---
title: "Clash 开启 TUN 后无法访问 NAS 怎么排查"
description: "Clash 开启 TUN 后无法访问 NAS 怎么排查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

Clash 开启 TUN 后无法访问 NAS，应围绕「全局路由是否把存储网段送进 tun」以及「严格路由是否让该网段不可达」排查。NAS 多落在私网。官方示例在 `route-exclude-address` 中排除 `192.168.0.0/16`，说明自动路由面向更广的流量，局域网存储需要单独划出。下文只处理该故障，不把结论推广成所有内网设备的通用教程。

## 适用条件

适用：`tun.enable` 已为 true，并且打开了 `auto-route`；NAS 有明确的 IPv4 或 IPv6 地址；故障出现在开启接管之后。`auto-route` 会自动将全局流量路由进入 tun 网卡。开启后才不能访问、关闭后恢复，时间上与该开关一致时，应优先查路由范围，而不是先改共享协议。

`auto-redirect` 仅支持 Linux，需要 auto-route 已启用。在 Android 中仅转发本地 IPv4 连接。NAS 若在其他网段或主要走 IPv6，不能把热点转发的说明直接套到桌面故障上。MacOS 设备只能使用 utun 开头的网卡名，名称不合规则时应先纠正 `device`。

## 排查步骤与判断依据

1. 核对排除网段是否覆盖 NAS。启用 auto-route 时，`route-exclude-address` 用于排除自定义网段，示例为 `192.168.0.0/16` 与 `fc00::/7`。判断依据：地址为 `192.168.1.x` 且已排除 `/16`，记「排除已覆盖」；地址落在 `10.x` 或仅有单个主机而列表未包含，则应补上对应 CIDR 后再观察。旧字段 `inet4-route-exclude-address`、`inet6-route-exclude-address` 即将废弃，配置混用时不要把废弃字段当成唯一依据。
2. 检查 `strict-route`。启用 auto-route 时执行严格的路由规则。Linux 中：让不支持的网络无法到达，将所有连接路由到 tun，它可以防止地址泄漏，并使 DNS 劫持在 Android 上工作。若 NAS 所在路径被当成不支持的网络，表现就是无法访问。Windows 中：添加防火墙规则以阻止 Windows 的普通多宿主 DNS 解析行为造成的 DNS 泄露，它可能会使某些应用程序在某些情况下无法正常工作。判断依据：仅关闭严格路由后 NAS 恢复，原因记在严格路由；若无变化，继续查排除网段与协议栈。
3. 检查协议栈与防火墙。`stack` 可用 system、gvisor、mixed、mips。打开防火墙则无法使用 system 和 mixed。Windows、MacOS、Linux 分别需要放行内核、应用或 TUN 网卡出站。若故障与「防火墙开启后 Tun 不可用」同时出现，应先满足放行条件。
4. 检查接口与自动出口。`auto-detect-interface` 会自动选择流量出口接口，多出口同时连接时建议手动指定。`include-interface` 与 `exclude-interface` 冲突、不可一起配置。NAS 位于被排除接口一侧时，流量不会按自动路由的设想处理。
5. 区分域名访问与地址访问。`dns-hijack` 在 MacOS / Windows 无法自动劫持发往局域网的 dns 请求。用名称失败、用 IP 可以，应记录为局域网 DNS 劫持限制。Android 如开启私人 DNS 则无法自动劫持 dns 请求，需先排除该项再判断 NAS 服务是否真的不可达。

## 失败时下一步

排除网段、严格路由、协议栈与 DNS 都核对后仍不通：在 Linux 上检查 `include-uid`、`exclude-uid` 及其 range 形式（仅 Linux 且需要 auto-route）是否把访问 NAS 的用户排除或错误包含。检查 `route-address` 是否改成只路由部分前缀，把返回路径一并改写。使用 `route-exclude-address-set` 时必须已启用 nftables、auto-route、auto-redirect，且不与 routing-mark 冲突，否则「按规则集绕过」并未真正下发。需要 Tun 的 IPv6 地址时，须同时将顶层 `ipv6` 设为 true；启动时会检查系统其他网卡是否有 IPv6，不存在会禁用该功能，若需强制开启可设置 `SKIP_SYSTEM_IPV6_CHECK=1`。仍失败则回到 `enable` 与 `auto-route` 的组合，确认故障是否仅在两者同时为 true 时出现，以便把范围锁在自动路由而不是 NAS 进程本身。

资料：https://wiki.metacubex.one/config/inbound/tun/
