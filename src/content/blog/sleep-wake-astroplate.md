---
title: "Clash 电脑端：睡眠前正常唤醒后异常怎么收集信息"
description: "Clash 电脑端：睡眠前正常唤醒后异常怎么收集信息。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

睡眠前工作正常、唤醒后异常时，应先按全局配置把内核当时的状态收集齐，而不是先改规则。可收集的对象包括运行模式、日志实际输出、出站接口、IPv6、TCP Keep Alive、外部控制 API、局域网绑定，以及 profile 是否保存策略组选择和 fakeip 映射。下面只说明这类场景怎样收集信息：适用条件、采集步骤、材料是否够用的判断依据，以及采集失败时下一步。

## 适用条件与要采集的三类状态

适用于电脑端内核在睡眠前可按 `rule`、`global` 或 `direct` 之一工作，唤醒后出现不能访问、仅双栈一侧失败、延迟口径异常，或 API 读不到状态的情况。需要采集的信息分成三类：控制面，即 `external-controller` 是否仍监听、在已配置 `secret` 时能否访问；数据面，即 `interface-name`、`ipv6`、`tcp-concurrent` 实际使用的地址；传输参数，即 `keep-alive-interval`、`keep-alive-idle`、`disable-keep-alive`。三类不齐就改 `mode`，会把网卡未就绪和模式错误混在一起。

日志是时间线证据。`log-level` 为 `silent` 时不输出；`error` 仅输出发生错误至无法使用的内容；`warning` 还包含不影响运行的错误；`info` 包含一般运行内容；`debug` 尽可能输出运行中所有信息。睡眠前与唤醒后必须使用同一级别。若睡眠前是 `info`、唤醒后才改成 `debug`，两段日志不能当作同一粒度的对比材料。

## 按字段收集，而不是只记结论

第一步，记录运行模式。`mode` 默认规则模式。唤醒后若为 `direct`，表现是全局直连；若为 `global`，则取决于 GLOBAL 策略组当时的选择。必须记下唤醒后读到的值，不要用记忆中的值代替。

第二步，从 API 取快照。`external-controller` 是 API 监听地址；还可配置 Unix socket、Windows namedpipe、`external-controller-tls`。文档写明从 Unix socket 或 namedpipe 访问不会验证 `secret`，HTTP API 则使用 `secret`。Linux 上还可为监听 socket 设置 `external-controller-routing-mark`。采集时应注明用的是哪一种监听、是否携带 `secret`、唤醒后端口是否仍可连。API 都连不上时，把监听地址、TLS 是否启用、证书与私钥配置是否仍可读一并记下。Unix socket 与 namedpipe 不验证 `secret`，记录里要写明通道，以免把「未校验通道可访问」写成「密钥仍然有效」。

第三步，记录出站和地址条件。`interface-name` 决定流量从哪块网卡出去；`routing-mark` 是 Linux 出站默认流量标记。唤醒后要留下睡眠前与唤醒后两份：接口是否仍存在、IPv4/IPv6 地址、`ipv6` 开关（默认 true）。`allow-lan` 为 true 时，记录 `bind-address`、`lan-allowed-ips`、`lan-disallowed-ips`，以及 `authentication`、`skip-auth-prefixes`。本机地址在唤醒后变化时，这些项能解释「内核在听，但谁都连不上」。黑名单优先级高于白名单，默认白名单为 `0.0.0.0/0` 和 `::/0`。

第四步，记录 TCP、进程匹配和缓存开关。Keep Alive 三项、`tcp-concurrent`、`unified-delay` 都要原样抄写。`find-process-mode` 为 `always`、`strict`、`off`；规则若依赖进程名，唤醒后进程表重建可能改变匹配结果，该值必须在材料里。`profile.store-selected` 与 `store-fake-ip` 分别决定策略组选择和 fakeip 映射是否保存供下次启动使用。若异常表现为选择丢失或域名映射变化，应收集这两项的开关，而不是只写「DNS 不正常」。

## 材料是否够用，以及采集失败时下一步

一份材料是否够用，看它是否同时包含：唤醒后的 `mode`、`interface-name`、`ipv6`、当时 `log-level` 下的实际输出、API 是否可访问。缺日志且级别为 `silent`，应先改为 `info` 或 `debug`，再完整做一次「睡眠前记录 → 睡眠 → 唤醒 → 立即采集」，不要把多次唤醒拼成一条时间线。`error` 表示已无法使用，`warning` 表示出错但仍在运行，二者都要保留原文，不要只保留「失败」二字。

若按上述仍采不到 API 数据：检查监听是否绑在唤醒前才存在的地址上、`secret` 是否为空或已变更、TLS 监听是否因证书或私钥无法使用。若日志仍空，确认不是 `silent`，并注明日志是否在内核被突然结束后被截断。控制台和控制页面之外没有这份全局配置所描述的第三种日志出口。收集齐之后，再用接口是否仍有效、双栈是否对称、Keep Alive 是否仍按秒级间隔去解释异常；GEO 下载地址、全局指纹、外部用户界面路径与本次唤醒异常无直接对应关系，不必塞进同一份材料。

资料：
https://wiki.metacubex.one/config/general/
