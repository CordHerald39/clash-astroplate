---
title: "Clash IPv4 正常而 IPv6 异常时怎样分层定位"
description: "Clash IPv4 正常而 IPv6 异常时怎样分层定位。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

## 适用条件

当 IPv4 或 A 记录正常、IPv6 或 AAAA 异常时，要分层定位，一次只验证一个假设。适用条件：能读 DNS 配置，IPv4 可用，问题是 AAAA 为空、IPv6 连不上，或 fake-ip 无 IPv6 映射。官方依据：ipv6 为 false 时回应 AAAA 空解析；disable-ipv6 丢弃 AAAA；disable-ipv4 丢弃 A；fake-ip 另有 fake-ip-range6。分层顺序是先配置意图、再单条参数、再增强模式、再解析链路、最后 DNS 出站，并对照已保存的基线。

## 由近到远的分层步骤

第一层看全局 ipv6。为 false 时，上游即使有 AAAA，Clash 仍给空解析，A 可以正常。判断依据：这与只有 IPv4、没有 AAAA 的现象一致，应视为配置意图。本层成立就不要改 fake-ip-range6。仅当明确需要 AAAA 时才考虑打开，并保留修改前的值。

第二层看单条服务器附加参数。nameserver、fallback、policy 可用 # 附加、& 连接 disable-ipv6 或 disable-ipv4。判断依据：带 disable-ipv6 时该条丢弃 AAAA，A 仍可能存在。同时看 disable-qtype- 是否丢掉特定类型。本层成立时不要同时改 respect-rules。

第三层看增强模式。fake-ip 下 IPv4 用 fake-ip-range（tun 默认 IPv4 也参考此值），IPv6 用 fake-ip-range6。判断依据：只配了 IPv4 段则不会有 IPv6 伪造地址。fake-ip-filter-mode 为 blacklist、whitelist 或 rule，rule 时与路由 rules 一致，结果为 fake-ip 或 real-ip。redir-host 没有这两段，应看真实 A 与 AAAA。

第四层看解析链路。nameserver-policy 优先于 nameserver 与 fallback。配置 fallback 后默认启用 fallback-filter，geoip-code 默认 CN。判断依据：A 与 AAAA 若落入不同过滤结论，会一成一败。default-nameserver 必须是 IP，填错会导致加密 DNS 自己解析失败。geosite 已废弃，应使用 nameserver-policy。

第五层看 DNS 出站。respect-rules 为 true 需配置 proxy-server-nameserver，强烈不建议与 prefer-h3 一起用。节点域名走 proxy-server-nameserver，直连走 direct-nameserver。判断依据：仅 IPv6 的 DNS 出站失败时会只剩 A。use-hosts 与 use-system-hosts 若只有 IPv4，也会单族正常。每一层都要能写出依据，例如空 AAAA 且 ipv6 为 false；写不出依据就回到上一层。

## 本层解释不了时的下一步

ipv6 已为 true、无 disable-ipv6、且已有 fake-ip-range6 仍只有 IPv4 时，下一步核对 policy 是否指向丢弃 AAAA 的服务器，以及 fallback-filter 的 ipcidr、domain 是否把结果判为污染。多个字段同时可疑时，仍按第一层到第五层的顺序排除。仍无法分层时，按官方 DNS 页核对字段，不要同时改路由与 DNS。

资料：https://wiki.metacubex.one/config/dns/
