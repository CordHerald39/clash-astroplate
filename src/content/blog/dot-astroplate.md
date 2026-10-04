---
title: "Clash DoT 无法连接时如何记录端口与证书线索"
description: "Clash DoT 无法连接时如何记录端口与证书线索。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

## 适用条件

当 Clash 里以 `tls://` 写出的 DoT 无法连接时，先收集端口与证书两条线索，再决定是否改附加参数或改列表位置。手册示例把 `tls://` 地址放在 `fallback` 等列表中；附加参数用 `#` 追加、`&` 连接，其中与证书直接相关的是 `skip-cert-verify`（跳过 TLS 证书验证）和 `name-cert-verify`（仅修改证书 DNSName 校验目标，不修改 SNI）。

本节适用于 `dns.enable` 为 true 但仍连不上该 DoT 的情况。enable 为 false 时走系统 DNS，谈不上 DoT 连接失败。不要把 DoH 的 HTTPS 路径、`prefer-h3`、`h3` 当作本次故障的传输证据：后两项在文档中明确对应 DoH 与 HTTP/3。`listen` 只描述本机 DNS 服务监听（支持 udp、tcp），不能当成上游 DoT 的端口字段。

## 如何记录端口线索

第一，原样抄写配置中的整条服务器字符串，包括 `tls://`、主机，以及你是否在主机后自行写了端口。官方示例中的 `tls://` 地址没有额外端口字段，因此“示例未写端口”与“本地条目写了端口”都要记下来。手册未给出未记载的默认端口，记录时应区分“配置里实际出现的端口文字”和“文档未写的推断”。

第二，记录该字符串属于哪一个键：`nameserver`、`fallback`、`nameserver-policy`、`proxy-server-nameserver`、`proxy-server-nameserver-policy` 或 `direct-nameserver`。列表不同，失败含义不同。`fallback` 会默认启用 `fallback-filter`；`proxy-server-nameserver` 只用于节点域名，为空时节点解析会退回其他列表；`direct-nameserver` 为空则遵循 nameserver-policy、nameserver 和 fallback。

第三，记录连接附加信息：是否用 `#` 指定了代理名或接口；不存在该代理时将改走接口；是否使用 `#RULES`（等同 `respect-rules`）。经代理查询却未配置 `proxy-server-nameserver` 时，手册提示存在鸡蛋问题，这属于连接路径线索，应与端口文字分开保存。

## 如何记录证书线索及下一步

证书线索至少包括：是否出现 `skip-cert-verify`；是否出现 `name-cert-verify`；若出现后者，记录所改的 DNSName 目标，并注明 SNI 按文档不被修改。没有这两项时，应记录“仍使用默认证书校验，且未改 DNSName”。不要把 `ecs`、`ecs-override`、`disable-ipv4`、`disable-ipv6`、`disable-qtype-<int>` 写成证书项，它们分别影响 subnet 与记录类型。

判断“线索记全”的依据：能复述完整 `tls://` 字符串、列表键名、代理或接口以及 `#RULES`、证书两项的有无与含义。

下一步：主机名无法解析时检查 `default-nameserver`（必须为 IP）。证书名称不匹配时，只有在明确需要跳过校验或改 DNSName 时才追加相应参数。需要遵守路由则配置 `respect-rules` 与 `proxy-server-nameserver`，并避免与 `prefer-h3` 共用。`ipv6: false` 会导致 AAAA 空解析，应与“连接失败”区分。`cache-algorithm`、`enhanced-mode` 不替代上游可达性。核对完毕后再改最小相关字段，避免一次清空 `fallback` 或整段 `dns`。

参考资料：https://wiki.metacubex.one/config/dns/
