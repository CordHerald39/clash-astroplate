---
title: "Clash 网页可用但游戏无法连接怎样分层检查"
description: "Clash 网页可用但游戏无法连接怎样分层检查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

浏览器能打开网页、游戏客户端不能建立会话时，说明 HTTP 路径可能已经可用，但不能据此认为游戏流量走了同一条入站。应按接管、传输层、DNS 与过滤范围分层检查。以下只依据 TUN 文档。

## 第一层：网页通路不能代替 TUN 接手

适用条件是：同一设备上普通网页访问正常，游戏启动器或对局连接失败。网页常可经系统代理或浏览器自身设置走端口，而游戏进程未必使用这些端口。第一层检查 `enable` 是否为 true，以及 `auto-route` 是否把全局流量路由进 tun 网卡。Linux 上 TCP 还要看 `auto-redirect` 是否已启用（需 `auto-route` 已启用）。

判断依据：网页正常而 `enable` 为 false，应判定游戏未进入 TUN，而不是节点对 HTTP 可用就对游戏可用。Android 文档写明 `auto-redirect` 仅转发本地 IPv4 连接；若游戏在热点对端或其他用户空间，这一层即不满足。出现 `include-package` 时，未列出的应用包不会被 Tun 路由；`exclude-package` 会排除指定包。游戏包名若被排除或未被包含，网页浏览器仍可被接管，从而出现网页可以、游戏不行。Linux 上对应检查 UID 包含与排除；接口层检查 `include-interface` 与 `exclude-interface`（二者冲突，不可一起配置）。

## 第二层：协议栈、UDP 会话与防火墙

`stack` 可选 system、gvisor、mixed、mips。mixed 的文档定义是 TCP 使用 system 栈、UDP 使用 gvisor 栈。网页以 TCP 为主，游戏常用 UDP。因此 mixed 下网页可用只说明 TCP 侧大致可工作，不能推出 UDP 侧同样可用。system 与 mixed 在打开防火墙时无法使用，需按文档在 Windows、MacOS 或 Linux 放行后再测游戏。文档说明如无使用问题建议使用 mips，默认 mips。文档中的协议栈网络回环测试写明仅供参考，且 Windows 与 MacOS 可能会有差异，不能当作游戏可玩性结论。

`udp-timeout` 为 UDP NAT 过期时间，单位秒，默认为 300。对局长连接或心跳间隔超过该值时，应把失败阶段记为 NAT 过期而不是网页协议失败。`endpoint-independent-nat` 启用独立于端点的 NAT，文档写明性能可能会略有下降，所以不建议在不需要的时候开启；仅当游戏依赖该 NAT 行为时再作为单独一层开关来对比。

`mtu` 影响极限状态下的速率，文档称一般用户默认即可，网页能打开时通常不必把 MTU 当作首层原因。Linux 上 `gso` 为通用分段卸载，仅支持 Linux，应与网页通路分开记录。

## 第三层：DNS、路由排除与失败后下一步

`dns-hijack` 将匹配连接导入内部 dns 模块。MacOS 与 Windows 无法自动劫持发往局域网的 dns 请求；Android 开启私人 dns 则无法自动劫持。网页若已缓存或走了未被劫持的解析，仍可能显示可用，游戏则在解析阶段失败。`strict-route` 启用时，Linux 会将所有连接路由到 tun 并让不支持的网络无法到达；Windows 会添加防火墙规则阻止多宿主 DNS 泄露，并可能使某些应用程序无法正常工作。

`route-exclude-address` 在启用 `auto-route` 时排除自定义网段。`route-address` 则是改用自定义路由网段而不是默认路由。`route-address-set` 与 `route-exclude-address-set` 仅支持 Linux，且需要 nftables 以及 `auto-route` 与 `auto-redirect` 已启用，并与任意配置中的 `routing-mark` 冲突。游戏服务器若落在排除网段或未进入路由集合，会表现为未被排除的网页可用、游戏不可用。`inet6-address` 指定 tun 的 IPv6 地址，文档说明启动时会检查系统其他网卡是否有 IPv6，不存在会禁用该功能；若游戏走 IPv6 而网页走 IPv4，应把这一层单独记下，需要强制开启时文档要求设置 `SKIP_SYSTEM_IPV6_CHECK=1`，并同时将顶层 `ipv6` 设为 true。

失败后下一步：先根据包名与 UID 确认游戏是否在接管集合内；再按 TCP 与 UDP 对照 `stack` 与防火墙放行；然后检查 dns-hijack 在当前系统上的限制与 `udp-timeout`。Linux 还要核对这些集合项是否与 `routing-mark` 冲突。以上任一层不满足时，不要跨层去改无关字段。

资料：https://wiki.metacubex.one/config/inbound/tun/
