---
title: "Clash 浏览器提示代理服务器无响应怎么排查"
description: "Clash 浏览器提示代理服务器无响应怎么排查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

浏览器提示“代理服务器无响应”，含义是：浏览器已经按你填写的 HTTP 代理去连接，但没有在预期时间内得到可完成代理握手的应答。它不能直接等同于“网站打不开”，也不能直接等同于规则或节点故障。下面只根据官方全局配置，说明在 Clash 场景下如何排查这一提示。

## 适用条件

适用于浏览器已指向 Clash 的 HTTP 或 mixed 代理，并出现代理无响应、无法连接代理一类提示的情况。官方文档将 http(s)/socks/mixed 作为可配置用户验证的代理入站；是否允许其他设备使用，取决于 `allow-lan` 以及 `bind-address`、`lan-allowed-ips`、`lan-disallowed-ips`。`mode` 为 `rule`、`global` 或 `direct`；`log-level` 控制日志输出；`ipv6` 控制是否接受 IPv6 流量。`external-controller` 示例为 `127.0.0.1:9090`，用于 RESTful API，可选 CORS、Unix socket、named pipe、TLS API 以及在 API 上开启 DOH，这些都不是浏览器应填写的 HTTP 代理。

浏览器未启用代理、填的是系统里另一个代理程序、或提示来自目标网站本身时，应先排除，再按下面步骤查 Clash 入站。

## 具体排查步骤

先核对浏览器代理类型与端口。HTTP 代理栏必须对应 HTTP 或 mixed 入站端口；把 SOCKS 端口填成 HTTP、或把 `external-controller` 的 API 端口填进代理设置，都不会得到 HTTP 代理应答，浏览器常显示为无响应。

再核对监听地址。`bind-address` 为 `"*"` 表示绑定所有 IP；若只绑定单个 IPv4 或单个 IPv6，浏览器只能填该地址。本机应使用确实在听的回环地址。其他电脑或手机上的浏览器，必须在 `allow-lan` 为 true、源 IP 属于 `lan-allowed-ips`（默认 `0.0.0.0/0` 与 `::/0`）且不被 `lan-disallowed-ips` 排除时才能使用代理端口。黑名单优先于白名单。

然后核对鉴权。存在 `authentication` 时，来源若不在 `skip-auth-prefixes` 内，浏览器需要提供用户名和密码。默认跳过 `127.0.0.1/8` 与 `::1/128`。局域网浏览器不在跳过前缀内又未配置凭据时，部分界面会把鉴权失败笼统显示成代理无响应。

接着确认内核仍在接受该入站，并注意 IPv6：浏览器若通过 `::1` 或 IPv6 字面量连接，而 `ipv6` 为 false，入站不会按预期接受。最后把 `log-level` 改为 `info` 或 `debug`，在控制台或控制页面看有没有来自浏览器地址的连接、鉴权失败或绑定错误。

## 判断依据与仍失败时的下一步

可以认为“代理层已通”的依据是：日志出现对应 HTTP/mixed 入站；浏览器主机和端口不是 API 监听；跨设备时 `allow-lan` 与地址段允许该来源；鉴权条件满足。此时若网页仍异常，应转向出站、DNS 或规则，而不是继续改浏览器端口。

若日志完全没有入站，说明报文没有到达 Clash，应回头查地址、端口、`bind-address` 以及来源是否被 `lan-disallowed-ips` 丢掉。有入站但立刻结束时，优先核对 `authentication` 与 `skip-auth-prefixes`。不要用 `mode: direct` 来解释“无响应”——直连模式改变的是出站行为，入站代理端口仍应应答。若只有控制页面能打开而浏览器代理无响应，说明 API 与 HTTP 代理不是同一服务，必须把浏览器改回代理入站端口。

https://wiki.metacubex.one/config/general/
