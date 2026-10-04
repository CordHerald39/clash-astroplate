---
title: "Clash 上游 DNS 使用域名却无法启动解析怎么查"
description: "Clash 上游 DNS 使用域名却无法启动解析怎么查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

上游 DNS 写成域名却无法启动解析，本质是引导链断裂：最终查询服务器的主机名还没有变成 IP，后续加密查询建连无从开始。适用条件是内置 DNS 已启用（`dns.enable` 为 true），并且 `nameserver`、`fallback`、`nameserver-policy`、`proxy-server-nameserver` 或 `direct-nameserver` 里出现了需要先解析的主机名。若 `enable` 为 false，进程使用系统 DNS，不能再按内置字段解释这次失败。排查时应沿「引导、建连策略、结果筛选」顺序收缩，而不是先改 `enhanced-mode` 或 fake-ip 段。

## 先核对引导地址是否满足必须为 IP

手册规定：`default-nameserver` 用于解析 DNS 服务器的域名，必须为 IP，可为加密 DNS。第一步打开该列表，检查是否为空、是否混入域名、是否把最终查询用的主机名误填进来。判断依据很直接：引导列表自身不能再依赖 DNS。示例形态是 IP，如 `223.5.5.5`。加密可以，但仍须 IP 形态。

针对「上游是域名、进程无法开始解析」的场景，步骤如下。确认 `enable` 为 true；逐条检查引导列表；把域名条目移到 `nameserver` 或 policy，引导只留 IP；再确认其他列表里的主机名确实依赖这次引导。若引导已是 IP 仍不能解开上游主机名，进入下一节，而不是反复更换 `fake-ip-range` 或 TTL。`use-hosts` 与 `use-system-hosts` 只决定是否回应 hosts，不能替代引导 IP。

## 再查经代理查询造成的鸡蛋问题

手册指出：如需经过代理查询，应配置 `proxy-server-nameserver`，以防出现鸡蛋问题。`respect-rules` 让 DNS 连接遵守路由规则，同样需要该字段。附加参数里指定代理时，优先使用已有代理；不存在该名称则指定接口。`#RULES` 等同 `respect-rules`。手册强烈不建议 `respect-rules` 与 `prefer-h3` 一起使用。`proxy-server-nameserver-policy` 当且仅当节点解析列表非空才生效，列表为空时不要指望政策单独工作。

判断依据：上游是域名，且 DNS 连接被要求走代理或遵守路由，却没有独立的节点域名解析服务器，就可能在「先有代理才能解析、先解析才有代理」之间卡住。下一步只补 `proxy-server-nameserver`，并保证它能在不依赖该上游主机名的前提下工作。若节点解析服务器自身仍是域名，还要回到引导列表，确认这些主机名能被 `default-nameserver` 解开。

## 把筛选器从启动失败中剥离

`fallback-filter` 的 geoip、ipcidr、domain 决定何时采用 fallback 结果；匹配 `domain` 的域名会直接使用 fallback，不再使用 nameserver。`geosite` 已废弃，应改用 `nameserver-policy`。这些影响的是结果取舍，不是上游主机名第一次如何变成 IP。`ipv6` 为 false 时回应 AAAA 空解析，只改变记录类型。`cache-algorithm` 只影响缓存。`fake-ip-filter` 与 `fake-ip-filter-mode` 影响如何向连接下发映射。

若引导为 IP、鸡蛋问题已排除，仍无解析，再核对该主机名是否被 policy 指向了另一组仍是域名且无法引导的服务器，或 `direct-nameserver` 为空时错误回退到了不可用的列表。`direct-nameserver-follow-policy` 默认不遵守 policy，仅当直连列表非空时生效，避免把这一默认行为误判成启动故障。每次只改一处职责错误的字段，便于对照手册定位。

https://wiki.metacubex.one/config/dns/
