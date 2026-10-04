---
title: "Clash 代理开启后路由器页面打不开怎么查"
description: "Clash 代理开启后路由器页面打不开怎么查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

Clash（mihomo）在 Tun 入站开启后，路由器管理页打不开，应先按官方字段判断：流量是否被 `auto-route` 送进虚接口、网关网段是否未排除、严格路由是否让该地址不可达，以及解析是否未按预期工作。下面只覆盖这一故障的检查顺序，不把协议栈选型或分段卸载当成第一步。

## 适用条件与要先看的开关

适用于：`tun.enable` 已为 true，浏览器访问的是网关管理页，开启代理后该页无法加载。`auto-route` 会自动设置全局路由，将全局流量路由进入 Tun 网卡。若管理页在关闭 Tun 时可用、打开后不可用，优先怀疑目的地址被全局路由进了隧道。

`stack` 可选 system、gvisor、mixed、mips。文档指出若打开了防火墙，则无法使用 system 和 mixed，并分别给出 Windows、MacOS、Linux 的放行说明。只有当前正使用 system 或 mixed 且系统防火墙开启时，才需要把“内核或 Tun 网卡出站是否被拦住”列入排查；使用 mips 或 gvisor 时不要把防火墙放行当成必做项。`auto-redirect` 仅支持 Linux，需要 `auto-route` 已启用，用于自动配置 iptables 或 nftables 以重定向 TCP。Android 中仅转发本地 IPv4 连接。这些条件决定重定向是否存在，但不能单独证明管理页必须走代理。

## 对照排除项、严格路由和应用过滤

检查 `route-exclude-address` 是否包含网关所在网段。文档示例为 `192.168.0.0/16` 与 `fc00::/7`。若路由器地址是 `192.168.1.1` 且存在该 IPv4 排除，则按字段含义，在启用 `auto-route` 时应排除该网段；若网关是 `10.0.0.1` 而排除列表只有 `192.168.0.0/16`，则例外未覆盖，管理页流量仍可能被自动路由进 Tun。旧字段 `inet4-route-exclude-address`、`inet6-route-exclude-address` 即将废弃，混写时不要假设两套列表会叠加。

同时查看 `route-address`：启用 `auto-route` 时路由自定义网段而不是默认路由。自定义集合很大而排除集合漏写网关前缀，与“例外未覆盖”的判断一致。Linux 上 `route-exclude-address-set` 把规则集中的目标 IP CIDR 加入防火墙，匹配流量绕过路由，但要求 nftables 以及 `auto-route`、`auto-redirect`，且与 `routing-mark` 冲突；条件不满足时不能认为规则集已经绕过。

`strict-route` 在启用 `auto-route` 时执行严格路由。Linux 中会让不支持的网络无法到达，将所有连接路由到 Tun，防止地址泄漏，并使 DNS 劫持在 Android 上工作。网关地址未排除或被视为不可达时，页面打不开与严格路由相符。Windows 中会添加防火墙规则，以阻止普通多宿主 DNS 解析行为造成的 DNS 泄露，并可能使部分应用程序在某些情况下无法正常工作。若现象是名称解析异常而直接访问 IP 的行为不同，应把多宿主 DNS 相关行为纳入，而不是改 `mtu`。

`include-interface` 与 `exclude-interface` 冲突、不可一起配置。接在未纳入或被排除接口上的管理流量，可能根本未按预期进入或绕过 Tun。Linux 的 MAC、UID 规则以及 Android 的用户与包名规则，都会缩小“谁的流量被 Tun 路由”。一旦写了 `include-package`，未配置的应用包不会被 Tun 路由；被 `exclude-package` 排除的应用则避免被路由。浏览器所在应用与其他程序表现不一致时，应先按应用规则解释。

## 仍然打不开时的下一步

排除 CIDR 已覆盖网关但页面仍无响应时，检查 `dns-hijack`。MacOS 与 Windows 无法自动劫持发往局域网的 DNS 请求；Android 开启私人 DNS 则无法自动劫持。管理页若使用域名，解析可能未进入内部 DNS 模块。下一步改为使用网关 IP 访问，以隔离解析问题。若只有 IPv6 访问失败，核对启动时是否因系统无 IPv6 而禁用 Tun 的 v6，以及顶层 `ipv6` 是否为 true；不要在未确认地址族时重复追加 IPv4 排除。

Linux 上 `auto-redirect` 与 nftables 相关项不生效时，不要继续叠加 `route-address-set`。应先满足 `auto-route`、`auto-redirect` 与 nftables，并避免 `routing-mark` 冲突。当前栈为 system 或 mixed 且防火墙开启时，按文档处理：Windows 在安全中心允许内核通过防火墙；Linux 可对 Tun 网卡出站追加 ACCEPT。完成后再回到目的 IP 与排除列表的对照，而不是调整 `udp-timeout` 或 `gso-max-size`。

参考资料：https://wiki.metacubex.one/config/inbound/tun/
