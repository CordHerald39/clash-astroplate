---
title: "Clash 切到规则模式后部分网站异常怎么查"
description: "Clash 切到规则模式后部分网站异常怎么查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

切到规则模式之后，只有部分网站异常，说明运行模式多半已经不是全局直连，但「规则匹配」仍会叠加若干全局项：IPv6 是否接受、进程是否匹配、出站网卡、GEO 数据、以及 TCP 并发如何挑选解析地址。本页能查的是这些全局配置，不能把异常直接写成某条未在本页出现的域名规则。

## 适用条件

适用于 `mode` 已设为 `rule`（或使用默认规则模式）后，部分站点失败、超时或走向与切换前不一致的场合。适用于同时改过 `ipv6`、`tcp-concurrent`、`interface-name`、`find-process-mode` 或 GEO 下载项的场合。若实际 `mode` 仍是 `global` 或 `direct`，应先回到运行模式，而不是按「部分网站」去拆规则。

## 排查步骤与判断依据

1. 确认切换结果。`rule` 是规则匹配；`global` 是全局代理，需要在 `GLOBAL` 策略组选择代理或策略；`direct` 是全局直连。判断：只有当前确为 `rule`，才把「部分网站异常」理解为规则匹配加上全局条件的结果。全部站点同一出口或全部直连，优先怀疑模式取值，而不是单个站点。
2. 看地址族与并发连接。`ipv6` 默认 true，为 false 时内核不接受 IPv6 流量，仅有 IPv6 或双栈表现异常的站点要对照该项。`tcp-concurrent` 为 true 时，会使用 dns 解析出的所有 IP 地址进行连接，并使用第一个成功的连接。判断：异常是否只出现在多 A/AAAA 记录的站点；若关闭并发后行为立刻回到单地址路径，应把原因记在并发选路，而不是运行模式名称。
3. 看出站与进程。`interface-name` 指定 mihomo 的流量出站接口；`routing-mark` 为 Linux 下出站连接提供默认流量标记。网卡或标记与系统路由不一致时，可以表现为部分目标不可达。`find-process-mode` 为 `off` 时不匹配进程（资料推荐路由器使用）；为 `always` 则强制匹配所有进程。判断：若你预期按进程区分走代理还是直连，路由器上的 `off` 会让这类匹配条件不具备。
4. 看 GEO 数据是否可用。`geodata-mode` 切换 mmdb 与 dat（true 为 dat，默认 false）；`geodata-loader` 影响加载方式；`geo-auto-update` 与 `geo-update-interval`（小时）决定是否定时换文件；`geox-url` 分别给出 geoip、geosite、mmdb、asn 地址。判断：部分按国家或站点集合区分的流量异常时，先核对这些文件模式和下载地址是否指向你正在用的数据类型，而不是先改日志等级。
5. 排除入口侧干扰。其他设备经代理端口访问时，`allow-lan`、`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips`（黑名单优先于白名单）以及 `authentication` 可能让「部分客户端上的网站」失败。`log-level` 提到的输出只出现在控制台和控制页面，可用来看是否有 error 或 warning，但资料未把日志内容规定成站点级命中说明。

`unified-delay` 只用于计算 RTT 以消除握手带来的延迟差异，不能解释网站打不开。TCP Keep Alive 相关项面向减少移动设备耗电，同样不是站点异常的首选对照项。

## 失败时下一步

仍只有部分站点异常时，维持 `mode: rule`，逐项单独核对 `ipv6`、`tcp-concurrent`、出站接口、进程匹配和 GEO 四组，避免一次改很多项。日志为 `silent` 时先改为 `info` 或 `debug`。局域网个别设备异常时先看允许网段和鉴权。本页没有站点规则表，不要在未给出的规则字段上编造命中结论。

资料来源：
https://wiki.metacubex.one/config/general/
