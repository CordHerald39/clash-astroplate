---
title: "Clash 换上游 DNS 后仍无法解析怎么查"
description: "Clash 换上游 DNS 后仍无法解析怎么查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

更换 Clash（mihomo）上游 DNS 后仍然无法解析，应按照官方 DNS 配置做条件排查。无法解析可能是模块未启用、查询未进入监听、域名被其他字段截走、过滤改写结果，或 DNS 服务器域名本身解析失败。不要只反复替换 `nameserver` 地址。

## 适用条件

本过程适用于配置了 `dns` 段并期望由 Clash 解析的场景。`enable` 为 `false` 时使用系统 DNS 解析，更换 Clash 上游不会作用于查询。`listen` 支持 udp、tcp，查询未到达监听则与上游无关。

`ipv6` 为 `false` 则回应 AAAA 的空解析，只有 AAAA 失败时应先看该开关。`enhanced-mode` 可选 fake-ip 或 redir-host，默认 redir-host。处于 fake-ip 时，`fake-ip-range` 为 fakeip 下的 IP 段；`fake-ip-filter` 内地址不会下发 fakeip 映射用于连接；`fake-ip-filter-mode` 默认 blacklist，whitelist 即只有匹配成功才返回 fake-ip；为 rule 时写法与路由 rules 匹配逻辑一致，支持 GEOSITE、RuleSet、DOMAIN 类与 MATCH，最后需要 fake-ip 或 real-ip。这些表现容易被当成上游失效。`fake-ip-ttl` 非必要情况下请勿修改。

## 换上游后的核对步骤

场景：把默认 `nameserver` 改成新的加密 DNS 后，业务域名或节点域名仍不能解析。

第一步，核对 `default-nameserver`。它用于解析 DNS 服务器的域名，必须为 IP，可为加密 DNS。新上游若本身是域名，缺少合法 `default-nameserver` 会出现改了上游仍失败。

第二步，按优先级看该域名到底有没有用到刚改的列表。`nameserver-policy` 优先于 `nameserver`/`fallback`。命中政策的域名仍走政策里的服务器。节点域名应查 `proxy-server-nameserver`；不填才遵循政策、`nameserver` 和 `fallback`。`proxy-server-nameserver-policy` 仅当 `proxy-server-nameserver` 不为空时生效。direct 出口查 `direct-nameserver` 与 `direct-nameserver-follow-policy`（默认不遵守政策，仅当 direct-nameserver 不为空时生效）。只改 `nameserver` 解决不了这两类对象。

第三步，核 `fallback` 与 `fallback-filter`。配置 `fallback` 后默认启用 filter，`geoip-code` 为 cn。`geoip` 启用时，非该国 IP 视为污染并将采用 fallback 结果；`domain` 匹配只使用 fallback、不去使用 nameserver；`ipcidr` 污染同样改写 nameserver 结果。`geosite` 已废弃，请使用 `nameserver-policy`。`fallback-lazy-query` 默认 `false`，为 `true` 会先判断 nameserver 结果是否满足条件再查询 fallback。换了 nameserver 仍得到另一侧结果时，先看 filter 是否强制改写。

第四步，核连接与丢弃项。`respect-rules` 需配置 `proxy-server-nameserver`，强烈不建议和 `prefer-h3` 一起使用。附加参数指定代理时，不存在该名称则指定接口连接；经代理查询却未配置 `proxy-server-nameserver` 会遇到鸡蛋问题。`h3`、`skip-cert-verify`、`name-cert-verify` 与服务器能力不符会导致加密 DNS 失败。`disable-ipv4`、`disable-ipv6`、`disable-qtype-<int>` 会丢弃对应回应。`use-hosts` 与 `use-system-hosts` 默认 `true`，hosts 命中时看不到新上游。

## 判断依据与失败时下一步

判断依据：`enable` 与 `listen` 是否让查询进入 Clash；待查名是否仍被政策、节点专用、direct 专用或 fallback 条件截走；`default-nameserver` 是否为 IP；hosts、fake-ip-filter、disable 类参数是否吞记录。`cache-algorithm` 支持 lru（默认）与 arc，只描述缓存，不能单独解释失败。

对完仍失败时，把业务域名、节点域名、DNS 服务器域名三件事拆开分别对字段。不要修改非必要的 `fake-ip-ttl`。下一步只修正官方已定义字段，对照 DNS 配置文档核对语法与优先级。

参考资料：https://wiki.metacubex.one/config/dns/
