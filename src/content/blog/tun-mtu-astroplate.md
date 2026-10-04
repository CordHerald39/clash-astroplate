---
title: "Clash 小请求成功大请求卡住如何记录"
description: "Clash 小请求成功大请求卡住如何记录。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

mihomo TUN 文档并未把“小请求成功、大请求卡住”直接写成某种故障代码或必改项，只说明 mtu 作为最大传输单元会影响极限状态下的速率，且一般用户默认即可。因此当出现请求大小差异导致的行为不同时，记录工作应完整覆盖官方列出的全部 TUN 字段和平台限制，用来判断该现象是否落在极限速率描述范围内，而不是先假设必须改 mtu。记录本身不改变任何值，只形成可对照的基线。

## 先固定适用条件并保存完整配置快照
适用条件是 tun.enable 为 true，并且已经稳定复现小请求能完成而较大请求卡住。操作步骤是把当前整个 tun 映射原样复制出来，重点标出 mtu 是否存在及其数值（文档示例为 9000）、stack 取值、gso 是否开启。判断依据是文档对栈的区分：system 更稳定占用相对低，gvisor 在用户空间实现协议栈安全性更高，mixed 为 TCP 用 system、UDP 用 gvisor，mips 为自研栈；无使用问题建议 mips。同时记下防火墙状态，因为开启防火墙时 system 与 mixed 不可用，Linux 还需确认是否已对 TUN 网卡做 OUTPUT 放行。快照必须包含 device 名称（MacOS 只能 utun 开头）。

## 按平台记录卡住发生时的关联选项与流量路径
接着记录 auto-route、auto-redirect（仅 Linux，Android 仅转发本地 IPv4）、auto-detect-interface、dns-hijack 列表（MacOS/Windows 无法自动劫持发往局域网的 DNS，Android 私人 DNS 会使其失效）、strict-route 的具体影响（Linux 让不支持网络无法到达并防泄漏，Windows 加防火墙规则防普通多宿主 DNS 泄露但可能让部分应用异常）。判断卡住是否伴随文档所说的极限状态，而不是普通延迟。还要记下 inet6-address 及系统 IPv6 检查逻辑、udp-timeout、endpoint-independent-nat、congestion-controller、自定义 route-address 与排除网段、uid/mac/android 包过滤。这些项决定流量是否真正进入 TUN，记录它们才能避免把路径问题写成 mtu 问题。

## 对照文档做判断以及记录失败时的下一步
将记录结果与“一般用户默认即可”对照：若现象并非极限速率场景，或能被栈、防火墙、劫持、路由过滤解释，则不应进入 mtu 修改。失败时下一步是保持 mtu 不变，优先按文档检查栈与防火墙是否匹配、dns-hijack 在当前系统是否生效、route-address-set 是否满足 nftables 且未与 routing-mark 冲突。把现象描述、配置快照和操作系统信息一起保存。若配置文件当时无法读取，先解决权限或进程状态，再补做上述记录，而不是直接改数值。

资料来源：https://wiki.metacubex.one/config/inbound/tun/
