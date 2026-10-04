---
title: "Clash 规则集合解析错误时先核对哪些字段"
description: "Clash 规则集合解析错误时先核对哪些字段。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

Clash（mihomo）里规则集合进入路由，靠的是 `rules` 中的 `RULE-SET` 行。文档对该行的说明是：引用规则集合，需配置 `rule-providers`。解析错误时应先当作「字段无法按本页语法读入」，而不是先改策略名。核对顺序是：本行分段是否完整，名称能否指向集合，再看被展开或内嵌的类型与载荷是否落在已列出的规则类型上。

## 适用条件

适用于配置出现 `- RULE-SET,名称,出站` 后无法引用集合，或把集合内容写进 `rules` 后不能识别类型的情况。也适用于 `AND`/`OR`/`NOT`、`SUB-RULE` 因括号或内层 payload 无法读入的情况。不适用于「请求为 udp 而节点没有 udp 支持则继续向下匹配」这类运行时行为，那是优先级说明，不是集合解析。判断依据是：类型名、逗号分段、括号和载荷形态能否在本页示例中找到同类写法。

## 先核对本行三个字段

对 `RULE-SET` 只先看三段：

1. 类型是否恰好为 `RULE-SET`。写成无连字符或其他近义名称，都不在类型列表中。
2. 第二段是否为集合名（示例为 `providername`）。它必须对应已配置的 `rule-providers`；名称不一致等于引用目标不存在。
3. 第三段是否为出站。缺少出站，或把第二段写成一条域名、一段 CIDR，都与 `RULE-SET,providername,proxy` 不一致。

不要在这一行追加 `no-resolve` 或 `src`。二者仅支持关于目标 IP 的规则，`RULE-SET` 本身不是 `IP-CIDR`、`GEOIP` 这类类型。`MATCH` 无需条件，也不能拿来代替集合名。

## 再核对读入后的类型与载荷

集合内容若被当作普通规则展开，或逻辑规则内层报无法解析，按类型标题对载荷，不要跨类粘贴：

- 域名：`DOMAIN` 是完整域名，`DOMAIN-SUFFIX` 是后缀，`DOMAIN-KEYWORD` 是关键字，`DOMAIN-WILDCARD` 仅 `*` 和 `?` 且与其他处 Clash 通配符不同，`DOMAIN-REGEX` 才是正则；`GEOSITE` 是 Geosite 名。
- 地址：`IP-CIDR` 与 `IP-CIDR6` 效果相同、后者只是别名；`IP-SUFFIX`、`IP-ASN`、`GEOIP` 分别是后缀范围、ASN、国家代码；来源侧用 `SRC-GEOIP`、`SRC-IP-ASN`、`SRC-IP-CIDR`、`SRC-IP-SUFFIX`。
- 端口与入站：`DST-PORT`、`SRC-PORT`、`IN-PORT` 为端口或端口范围；`IN-TYPE`、`IN-USER`（`/` 分隔多个用户名）、`IN-NAME`、`REMATCH-NAME` 各用各的字段。
- `NETWORK` 只能是 `tcp` 或 `udp`；`DSCP` 仅限 tproxy udp 入站；`UID` 是 Linux USER ID。
- 逻辑规则为 `LOGIC_TYPE,((payload1),(payload2)),Proxy`，payload 仍是「规则类型和其他 payload」，必须注意括号。`SUB-RULE` 同样要注意括号。

`PROCESS-PATH` 与 `PROCESS-NAME` 及其 WILDCARD/REGEX 变体分别匹配路径和进程名（Android 上进程名可匹配包名），不能把路径写进名称类字段。

## 仍报错时下一步

把出错行改回与示例同构的最少三段，去掉未记载的额外字段。名称错误时只改 `RULE-SET` 第二段或去补 `rule-providers`，不要改成 `DOMAIN` 来凑合引用。逻辑规则先数括号是否按 `((payload1),(payload2))` 成对，再看内层是否含类型名。通配写进了普通 `DOMAIN`、正则写进了 `-WILDCARD` 时，换到带对应后缀的类型。附加参数写错行时，只保留在目标 IP 类规则末尾。完成上述仍无法与类型小节示例对齐，就停止混入其他载荷，按该类型示例整行重写。

https://wiki.metacubex.one/config/rules/
