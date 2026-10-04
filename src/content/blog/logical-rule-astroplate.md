---
title: "Clash 逻辑规则结果异常怎样逐项验证条件"
description: "Clash 逻辑规则结果异常怎样逐项验证条件。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

## 适用条件：先确认异常出在逻辑这一行

逻辑规则结果异常，指 `AND`、`OR`、`NOT` 或 `SUB-RULE` 实际采用的出站与按子条件推算的不一致，或请求根本没有进入该行。适用条件是：配置里确有手册格式的逻辑规则；你能提供该请求的域名、网络类型、端口、IP 或进程等字段；你知道 `rules` 的从上到下顺序。手册对逻辑规则特别提示要注意括号，对全局则强调顶部规则优先。核对前不要先改出站名称。也要先排除两种已写明的行为：`MATCH` 过早收口；以及请求为 UDP、而出站没有 UDP 支持时会继续向下匹配。

## 逐项验证条件的步骤

第一项，验证有没有轮到这一行。从列表首条向下看，任何先命中的 `DOMAIN`、`DOMAIN-SUFFIX`、`GEOSITE`、`IP-CIDR`、`RULE-SET` 等，都会使后面的逻辑规则不再执行。若逻辑条写在 `MATCH` 之后，则该行不会被执行。`MATCH` 匹配所有请求、无需条件。

第二项，把 payload 拆成可单独判真假的简单条件。官方格式是 `LOGIC_TYPE,((payload1),(payload2)),Proxy`。对 `DOMAIN,baidu.com` 只问完整域名是否相等；对 `NETWORK,UDP` 只问是否为 udp。若子条件是 `DOMAIN-SUFFIX`，要用手册给出的包含与排除关系验证，而不是把后缀当成任意包含。进程、端口、入站类型同理，每次只验证自己那一类字段。

第三项，按关键字解释组合。全部成立才命中的是 `AND`；任一成立即命中的是 `OR`；括号内条件不成立才命中的是 `NOT`。对照示例：`AND,((DOMAIN,baidu.com),(NETWORK,UDP)),DIRECT`、`OR,((NETWORK,UDP),(DOMAIN,baidu.com)),REJECT`、`NOT,((DOMAIN,baidu.com)),PROXY`。`NOT` 命中后采用的是行末策略，不是自动拒绝。

第四项，验证附加参数是否用在允许的位置。`no-resolve` 与 `src` 仅支持关于目标 IP 的规则。域名开始匹配目标 IP 规则时会触发 DNS 解析；若更早匹配已经解析，后面带 `no-resolve` 的目标 IP 规则依旧可能命中。逻辑组合里如果夹了 `IP-CIDR`，要把这一项单独按上述说明检查。

第五项，若为 `SUB-RULE,(NETWORK,tcp),sub-rule`，分别验证括号内条件是否成立，以及子规则名是否按手册方式给出。

## 判断依据与失败时下一步

某一项通过的依据是：该 payload 单独看类型合法、对当前请求真值明确、括号结构与示例一致，并且该行仍排在 `MATCH` 前。

失败时下一步：第一项失败，应上移逻辑规则或收窄上方宽泛条件，而不是继续叠加 `AND`。第二项单条件为假，应改类型选择，例如完整域名是否其实更接近 `DOMAIN-SUFFIX`，或 `NETWORK` 取值是否只能是 `tcp` 或 `udp`。单项为真但组合为假，核对是否把 `OR` 写成 `AND`，或 `NOT` 括号包错对象。组合推算应为命中而流量仍走到 `MATCH,auto` 时，再查 UDP 继续向下的情况，以及出站名是否写在逻辑结构之后。payload 中出现 `RULE-SET` 时，下一步是确认已配置 `rule-providers`。全程不要使用该页未列出的匹配器。

资料来源：https://wiki.metacubex.one/config/rules/
