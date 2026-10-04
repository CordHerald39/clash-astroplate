---
title: "Clash 启用 TUN 后只有域名访问失败怎么办"
description: "Clash 启用 TUN 后只有域名访问失败怎么办。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

启用 TUN 后如果只有域名访问失败而直连 IP 仍可用，优先从 DNS 劫持是否真正生效、以及路由是否把 53 端口流量送进 TUN 这两方面排查。官方 TUN 文档把 dns-hijack 定义为将匹配连接导入内部 DNS 模块，并把若干平台例外写进说明，这些内容构成判断依据。

## 适用条件
该现象通常出现在 tun.enable 已为 true、auto-route 已打开，但 dns-hijack 未覆盖实际 DNS 请求，或平台限制导致劫持落空的时候。文档写明：MacOS/Windows 无法自动劫持发往局域网的 DNS 请求；Android 开启私人 DNS 时无法自动劫持。strict-route 与 auto-route 同时启用时，Linux 会把所有连接导入 TUN 并防止泄漏、使 Android 劫持工作；Windows 会加防火墙规则抑制多宿主 DNS 泄漏。若这些条件未满足，域名会走系统解析，而系统解析器本身可能已被全局路由切断，于是只表现为域名失败。

## 操作步骤与判断依据
第一步核对 tun.dns-hijack 是否包含 any:53 与 tcp://any:53（或不写协议的 UDP 默认）。没有对应项则内部模块收不到查询。第二步确认 auto-route 为 true，否则 DNS 包到不了 TUN。第三步查看是否启用了 strict-route：文档将其作为让劫持在 Android 生效、并在 Windows 阻止泄漏的手段。第四步对照平台例外，关闭 Android 私人 DNS 或避免依赖局域网 DNS。判断“只有域名失败”的依据是：同一目标用 IP 可通，说明协议栈、mtu、网卡名称（MacOS 须 utun 开头）和出站接口基本正常，问题集中在解析路径。同时检查 route-exclude-address、exclude-interface 是否把 DNS 服务器网段或网卡排除。Linux 还可确认 auto-redirect 是否已配合 auto-route 重定向 TCP。

## 失败后的下一步
若补全 dns-hijack 并打开 strict-route 后仍只有域名失败，按文档检查防火墙：Windows 需允许内核通过防火墙，Linux 需放行 TUN 网卡出站，否则 system/mixed 栈不可用。可临时将 enable 设为 false 恢复系统 DNS 作对照，再单独打开 auto-route 观察 IP 连通，最后只加回 dns-hijack。若使用 include-uid、include-package 等过滤，确认发起解析的进程/应用未被排除。旧的 inet4-route-exclude-address 等写法即将废弃，避免残留排除把 DNS 流量绕开。完成上述核对后仍异常，再审视 auto-detect-interface 是否选错出口，导致解析结果无法回程。

https://wiki.metacubex.one/config/inbound/tun/
