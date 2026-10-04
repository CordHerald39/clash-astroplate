---
title: "Clash 所有请求都落到最终规则该检查什么"
description: "Clash 所有请求都落到最终规则该检查什么。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

当 Clash（mihomo 路由规则）几乎所有连接都走到列表末尾的 MATCH 时，原因是上方规则都未命中，或命中后因 UDP 被继续向下匹配。官方约定：规则按从上到下的顺序匹配，顶部优先级更高；MATCH 匹配所有请求，无需条件。不要把现象理解成 MATCH 损坏。

## 适用条件与规则列表结构

适用条件：`rules` 含 MATCH，且大量不同目标的出站都等于该 MATCH。判断依据：MATCH 若不在底部，其后规则不会再被评估，也会像「全部落到最终规则」。官方示例将 MATCH 放在列表最后作为无条件兜底。具体操作：确认 MATCH 只在末尾出现一次；检查列表项逗号与出站名是否完整。`AND`、`OR`、`NOT` 与 `SUB-RULE` 必须注意括号；`RULE-SET` 需配置规则集合。括号错误或集合名不一致时，这些行等于未生效，流量会落到 MATCH。

## 核对域名、进程、入站是否覆盖当前请求

用实际主机名对照类型定义。`DOMAIN` 匹配完整域名。`DOMAIN-SUFFIX` 匹配后缀：`google.com` 可匹配 `www.google.com`、`mail.google.com` 和 `google.com`，但不匹配 `content-google.com`。`DOMAIN-KEYWORD` 为关键字；`DOMAIN-WILDCARD` 仅星号与问号（星号为零个或多个字符，问号为一个字符），且不同于配置其他处的 Clash 格式通配符；`DOMAIN-REGEX` 为正则；`GEOSITE` 匹配 Geosite 内域名。判断依据：主机名对不上，则这些规则都应跳过。

`PROCESS-PATH` 要用完整路径；`PROCESS-NAME` 在 Android 上可匹配包名。`IN-PORT`、`IN-TYPE`、`IN-USER`、`IN-NAME`、`UID`、`NETWORK`、`DSCP`（仅 tproxy udp）以及各类 `SRC-*`、`DST-PORT` 只在对应字段存在且满足时成立。判断依据：没有进程信息却写了进程规则，或把来源规则当成目标规则，都不会拦住请求，最终仍到 MATCH。

## 目标 IP、no-resolve、UDP 与失败下一步

`IP-CIDR` 与 `IP-CIDR6` 效果相同；还有 `IP-SUFFIX`、`IP-ASN`、`GEOIP`。域名开始匹配目标 IP 规则时，mihomo 会触发 DNS 解析以检查目标 IP；`no-resolve` 可跳过解析。若更早匹配已触发解析，带 `no-resolve` 的目标 IP 规则仍可命中。附加参数 `src` 把目标 IP 匹配转为来源 IP 匹配。判断依据：前部全是带 `no-resolve` 的 IP 或 GEOIP，且从未解析时，纯域名请求会直达 MATCH。

请求为 udp 且该条出站没有 udp 支持（例如 ss 未写 `udp: true`）时，会继续向下匹配。判断依据：同一目标 TCP 能走某规则、UDP 却到 MATCH，应查该出站是否声明 UDP，而不是先改 MATCH。

失败时下一步：选一条仍落到 MATCH 的连接，列出域名、目标 IP、端口、tcp 或 udp、入站与进程，从第一条规则按上述定义判断应命中还是应跳过，找到第一处与文档语义不符的写法后再改配置。

https://wiki.metacubex.one/config/rules/
