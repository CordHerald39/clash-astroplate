---
title: "Clash 切到直连后仍有连接错误怎么定位"
description: "Clash 切到直连后仍有连接错误怎么定位。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

把运行模式改成 `direct` 只表示全局直连，并不表示内核停止处理连接。入站端口、出站接口、IPv6、路由标记、进程匹配和访问控制仍然生效，因此切到直连后若连接错误还在，应把对象从“节点和规则”转到这些仍起作用的全局项。前提是配置里的 `mode` 已经是 `direct` 且已被加载；缺省 `mode` 时官方默认为规则模式，不能把那种状态当成直连故障。

## 适用条件

本定位流程适用于：对照实验已经切到全局直连；同一目标在 `rule` 或 `global` 下失败，在 `direct` 下同样失败；需要区分“代理选择错误”与“内核仍把连接送上错误路径”。若尚未证明当前模式是 `direct`，应先核对配置再谈定位。`global` 即使策略组里看起来像直连出口，语义上仍是全局代理，不能并入本场景。

## 按字段收集证据

先提高可见性。`log-level` 决定控制台和控制页面能看到什么：需要至少 `info`，必要时 `debug`。`silent` 不会给出材料；`error` 只覆盖无法使用级别，容易漏掉仍能运行但不正确的情况。

再看出站。`interface-name` 是 mihomo 的流量出站接口，网卡写错时全局直连 equally 会失败。Linux 的 `routing-mark` 为出站连接提供默认流量标记，与系统防火墙或策略路由不一致时，直连同样送不出去。`ipv6` 控制内核是否接受 IPv6 流量，对偶栈或 IPv6 目标会改变失败形态。`tcp-concurrent` 启用后会使用 DNS 解析出的所有 IP 地址进行连接并采用第一个成功的连接，它可能改变成功或失败的表象，但不能把它理解成关闭了直连模式。TCP Keep Alive 相关项（间隔、最大空闲、是否禁用；Android 上禁用项强制为 true）仍作用于内核维护的连接，它们不是运行模式字段，却可能让“直连后仍断开”看起来像代理故障。

然后看入站与访问控制。`allow-lan`、`bind-address`、默认包含 `0.0.0.0/0` 与 `::/0` 的 `lan-allowed-ips`、以及优先级更高的 `lan-disallowed-ips`，决定谁能打到代理端口。http(s)/socks/mixed 上的 `authentication` 与 `skip-auth-prefixes` 在直连模式下仍然执行。`find-process-mode` 为 `always`、`strict`（默认）或 `off`（文档推荐在路由器上使用），它不会把模式改回代理，但会改变你对“哪条连接被内核处理”的判断。

## 失败时下一步

上述对照仍无结论时，不要在未记录的情况下把 `mode` 改回 `rule`。保持全局直连，一次只动一个字段：先处理可疑的 `interface-name` 与 `routing-mark`，再评估 `ipv6`，再检查局域网白黑名单与认证。需要确认进程仍在监听时，可使用文档中的外部控制器地址，同时遵守 `secret` 要求，并注意 Unix socket、Windows namedpipe 以及 DOH 路径不验证 secret 的安全说明。若纠正全局项后直连依旧失败，应把原因转向系统路由、目标主机或上游网络，而不是继续在策略组之间切换。

资料：https://wiki.metacubex.one/config/general/
