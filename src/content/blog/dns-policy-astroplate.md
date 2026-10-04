---
title: "Clash 某个域名仍使用其他 DNS 怎样核对配置"
description: "Clash 某个域名仍使用其他 DNS 怎样核对配置。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

当某个域名仍使用其他 DNS 时，应按照 Clash DNS 字段的覆盖关系逐项核对，而不是先改代理分流规则。官方说明中，`nameserver-policy` 指定域名查询的解析服务器，可使用 geosite，并且优先于 `nameserver` 与 `fallback`。若 `dns.enable` 为 false，将使用系统 DNS，后面所有策略都不会被问到。同一字符串域名还可能出现在节点解析或直连出口解析路径上，这两条路径有独立字段，会出现“业务查询已按策略走、节点查询仍走默认上游”的表面矛盾。核对目标是找出该次查询实际落入哪一层，而不是假设只有一张上游表。

## 适用条件

本核对适用于已经编写 `nameserver-policy`、`nameserver`、`fallback` 或直连、节点专用 DNS，但某一个业务域名、节点域名或直连域名的查询来源不符合预期。前提是该查询确实由 Clash DNS 处理，即 `enable` 为 true。若客户端应用自己对目标域名发起独立加密 DNS，请求不会进入这些字段，不属于键写错，但需要先排除。文档以配置语义为准，没有把核对过程绑定到某一界面操作。具体场景可以是：已为 `example.com` 写了策略，结果仍像走了 `nameserver`、`fallback`、系统 DNS，或走了 `direct-nameserver`。

## 按字段优先级核对的步骤

第一步，看 `enable`。为 false 时使用系统 DNS，这是“仍使用其他 DNS”最直接的原因。第二步，看该域名是否能被 `nameserver-policy` 的键匹配。键支持域名通配，也可使用 geosite；值可以是字符串或数组。文档示例包含 `+.arpa` 与 `rule-set:cn`。键未覆盖时，查询会落到 `nameserver`，并在配置了 `fallback` 后进入 `fallback-filter`。第三步，把 `fallback-filter` 与策略分开看。`domain` 匹配到的域名会直接使用 `fallback`、不去使用 `nameserver`；其中的 `geosite` 字段已废弃，应改用 `nameserver-policy`。`geoip`、`geoip-code`、`ipcidr` 是对解析结果的污染判断，不是按域名指定上游。第四步，若对象是代理节点域名，检查 `proxy-server-nameserver`：如果不填，则遵循 `nameserver-policy`、`nameserver` 和 `fallback`。`proxy-server-nameserver-policy` 仅当 `proxy-server-nameserver` 非空时生效，只写 policy、不写前者，不会单独生效。第五步，若对象是 `direct` 出口上的域名，检查 `direct-nameserver`：如果不填，同样遵循 `nameserver-policy`、`nameserver` 和 `fallback`。`direct-nameserver-follow-policy` 默认为不遵守 `nameserver-policy`，且仅当 `direct-nameserver` 非空时生效。第六步，检查 DNS 查询连接能否到达你指定的上游。`respect-rules` 为 true 时，DNS 连接遵守路由规则，必须配置 `proxy-server-nameserver`。附加参数里的 `#RULES` 等同于 `respect-rules`；`#proxy` 会优先使用已有代理，不存在该名称则指定接口连接。缺专用解析服务器时，可能出现文档所说的鸡蛋问题，表现为根本问不到预期上游。第七步，确认 `use-hosts`、`use-system-hosts` 是否先回应了配置或系统 hosts，这会让人误以为策略上游被跳过。`default-nameserver` 只解析 DNS 服务器自己的域名，不会改写该业务域名的上游选择。

## 判断依据与失败时下一步

判断依据：域名能被 `nameserver-policy` 匹配却仍表现得像默认列表，说明键实际未命中，或查询落在直连、节点专用 DNS 路径上。未写策略但写了 `fallback-filter.domain`，则匹配域名本来就会只用 `fallback`。`ipv6` 为 false 时对 AAAA 回应空解析，不能据此判断上游选错。附加参数只作用于该条发向公网的 DNS 服务器，不能补上缺失的策略键。

失败时下一步：把该域名写成更精确的策略键，避免只依赖可能未包含它的 geosite 或 `rule-set:`；删除或迁移已废弃的 `fallback-filter.geosite`；节点解析应先补 `proxy-server-nameserver` 再写对应 policy；直连场景若已填 `direct-nameserver`，再判断是否需要打开 follow-policy；上游需要经代理访问时补齐 `proxy-server-nameserver`，并避免将 `respect-rules` 与 `prefer-h3` 同时使用。仍无法定位时，回到 `enable` 与 hosts 两项，确认查询是否进入 Clash DNS。

资料：https://wiki.metacubex.one/config/dns/
