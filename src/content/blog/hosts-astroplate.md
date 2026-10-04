---
title: "Clash 配置 hosts 后仍访问旧地址怎么排查"
description: "Clash 配置 hosts 后仍访问旧地址怎么排查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

配置 hosts 之后仍访问旧地址，说明「记录已经写上」和「这次连接用到的解析结果」不是一回事。官方 DNS 文档写明：`enable` 为 false 时使用系统 DNS 解析；`use-hosts` 控制是否回应配置中的 hosts，默认 true；`use-system-hosts` 控制是否查询系统 hosts，默认 true。排查应沿「查询有没有进 Clash DNS → 模块会不会回应 hosts → 结果有没有被模式、缓存或其他策略换掉」进行，而不是反复粘贴同一条映射。

## 适用条件

本过程适用于已经在配置中的 hosts 或系统 hosts 写入记录，但访问目标仍是旧 IP、旧站点或明显未指向预期地址的情况。判断依据：能指出变更前后的主机名与旧地址；可以逐项阅读 DNS 字段；能区分「解析结果仍是旧 IP」和「解析已变但连接仍走旧路径」。

`enable` 为 false 时，应先按「当前使用系统 DNS」处理，不要按 Clash hosts 没写成功处理。查询从未到达 `listen`（DNS 服务监听，支持 udp、tcp）时，Clash 没有机会回应配置中的 hosts。若访问的其实是代理节点域名，应改看 `proxy-server-nameserver` 与 `proxy-server-nameserver-policy`，它们仅用于解析代理节点的域名，不填则遵循 nameserver-policy、nameserver 和 fallback。

## 按字段逐项排查

先看 `dns.enable`。为 false 时，官方说明使用系统 DNS 解析，`use-hosts` 不会按启用路径工作。先启用，再观察是否仍指向旧地址。

再看映射来源开关。记录写在配置中的 hosts 时，`use-hosts` 必须为 true；写在操作系统 hosts 时，`use-system-hosts` 必须为 true。任一项为 false，都会出现「文件里有记录，模块不回应」，表现就是继续使用旧解析。

接着确认查询是否打到监听。核对该 `listen` 的地址与端口，以及客户端是否把 DNS 发到此处。设备仍使用系统或其他解析器时，看到的只能是旧地址。判断依据：只有到达该监听的查询，才可能被 `use-hosts` 回应。

然后核对该名字的增强模式与过滤。`enhanced-mode` 为 fake-ip 时，连接可能使用 `fake-ip-range` 中的地址，观感会与 hosts 里的真实 IP 不同。`fake-ip-filter` 指定哪些地址不会下发 fakeip 映射；`fake-ip-filter-mode` 可选 blacklist、whitelist 或 rule，默认 blacklist。rule 模式下写法与路由 rules 一致，可指定 fake-ip 或 real-ip。主机名落入过滤或规则条目时，下发地址类型会变化，应对照 filter，而不是只看 hosts。

缓存也要纳入判断。`cache-algorithm` 支持 lru（默认）与 arc。开关和映射都正确、但短时间内仍返回变更前记录，应先考虑缓存命中，而不是认定映射无效。

最后检查该名字是否被其他策略带走。`nameserver-policy` 指定域名查询的解析服务器，优先于 nameserver/fallback。配置 fallback 后默认启用 `fallback-filter`，`geoip-code` 为 cn；匹配 `domain` 列表的域名被视为已污染，会直接使用 fallback 解析，不去使用 nameserver。`ipcidr` 中的网段结果也会被视为污染。旧地址可能来自某次 fallback 或 policy 查询。

`ipv6` 为 false 时回应 AAAA 的空解析。双栈程序可能仍尝试旧的 IPv6 路径，需要分清这次访问用的是 A 还是 AAAA。

## 仍指向旧地址时的下一步

上述核对完成后仍指向旧地址，把问题分成两类。查询未进入 Clash：回到入站与 `listen`，确认系统或应用 DNS 指向。查询已进入但结果不是 hosts：逐项对照 `enable`、`use-hosts`、`use-system-hosts`、`enhanced-mode`、`fake-ip-filter`、`nameserver-policy`、`fallback-filter` 中与该主机名相关的行。

名字属于代理节点时，改查 `proxy-server-nameserver`；direct 出口改查 `direct-nameserver` 与 `direct-nameserver-follow-policy`（仅当 direct-nameserver 不为空时生效，默认不遵守 nameserver-policy）。

`respect-rules` 使 dns 连接遵守路由规则，需配置 `proxy-server-nameserver`，强烈不建议和 `prefer-h3` 一起使用。文档在指定代理查询时提示应配置 `proxy-server-nameserver`，以防出现鸡蛋问题。DNS 查询自身失败或被路由绕开时，也可能继续使用某处留下的旧地址。下一步应先保证查询链路能完成，再验证 hosts 回应。

原因未定位前，不要叠加互相冲突的 hosts 条目。文档没有把 hosts 写成可以覆盖全部策略的最高规则，结论应落在具体字段上。

https://wiki.metacubex.one/config/dns/
