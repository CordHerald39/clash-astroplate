---
title: "Clash 加了过滤项却未改善怎样检查匹配范围"
description: "Clash 加了过滤项却未改善怎样检查匹配范围。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

已经在 fake-ip-filter 中加入条目后连接状况没有改善，说明当前匹配范围可能没有覆盖目标域名，或模式与语法导致行为与预期相反。本节只说明如何依据官方 DNS 配置检查匹配范围，给出适用条件、逐步核对方法以及仍无改善时的下一步，不扩展到其他配置块。

## 先核对过滤模式是否与预期一致
fake-ip-filter-mode 可选 blacklist、whitelist、rule，默认 blacklist。blacklist 下匹配成功的地址不会下发 fakeip 映射；whitelist 则只有匹配成功才返回 fake-ip。若添加条目后无变化，第一步必须确认当前模式。适用条件是 enhanced-mode 已设为 fake-ip 且 dns.enable 为 true。判断依据是文档对三种模式的直接描述。若模式为 whitelist 而所加条目并未命中，目标域名仍会拿到 fake-ip，表现为“加了却没用”。rule 模式下写法完全改变，变成与路由规则相同的自上而下匹配，最后必须有 MATCH 项决定默认 fake-ip 或 real-ip，漏写 MATCH 会导致范围不可控。

同时检查 fake-ip-range 是否与 tun 使用的地址一致，避免因网段理解偏差而误判过滤是否生效。ipv6 为 false 时 AAAA 为空，可能让仅有 IPv6 记录的域名看起来“未匹配”。

## 检查条目语法、集合类型与规则顺序
普通模式下值必须是域名通配或可引入的域名集合。rule 模式下 RULE-SET 的 behavior 必须为 domain 或 classical，classical 时仅域名类规则生效。若使用了错误的集合类型，匹配范围会为空。操作步骤：打开配置，逐条核对 fake-ip-filter 列表的写法是否与文档示例一致，例如 DOMAIN、DOMAIN-SUFFIX、GEOSITE、RULE-SET 的参数顺序。rule 模式必须自上而下，先写的规则优先，因此后写的条目可能永远轮不到。

再对照 nameserver-policy。其键支持域名通配且优先于 nameserver/fallback，若目标域名已被 policy 单独指定服务器，过滤范围的判断会叠加解析路径差异。fallback-filter 的 domain、ipcidr 同样会改变实际使用的结果，这些列表若与过滤条目重叠，会出现“过滤写了但解析路径已变”的假象。use-hosts 与 use-system-hosts 默认 true，hosts 中的名称若未进入过滤范围，仍可能被 fake-ip 覆盖。

## 范围偏差的交叉验证与后续动作
检查 respect-rules。该选项为 true 时 DNS 连接遵守路由规则，必须配置 proxy-server-nameserver。若未配置，可能因循环或错误出口导致过滤看起来未生效。direct-nameserver 专用于 direct 出口，direct-nameserver-follow-policy 默认不遵守 policy。若目标域名走 direct 却仍分配 fake-ip，说明过滤范围未包含该名称或其通配。proxy-server-nameserver-policy 只在对应 nameserver 非空时生效，节点域名一般不在过滤范围内，不必反复检查。

若核对后范围仍不正确，下一步将模式改为 rule 并显式写出最后一条 MATCH,real-ip 或 MATCH,fake-ip，用单条 DOMAIN 项缩小范围做对照。也可临时改回 blacklist 并只保留一条最精确的通配，观察是否开始生效。fake-ip-ttl 非必要勿改，不能用来扩大或缩小匹配。配置保存后重新加载核心。全部检查项均来自官方对 fake-ip-filter、mode 及关联 DNS 字段的说明。

https://wiki.metacubex.one/config/dns/
