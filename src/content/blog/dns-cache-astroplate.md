---
title: "Clash 改 DNS 后结果没变是否一定是配置无效"
description: "Clash 改 DNS 后结果没变是否一定是配置无效。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

改完 Clash 的 DNS 字段后，外部查询或页面解析看起来没变，不能直接等同于配置无效。手册里有多处会让你改的那一行根本轮不到，或改了仍显示旧地址。下面只依据官方 DNS 配置说明，给出适用条件、判断步骤和失败时下一步，不把某次查询成功写成配置一定生效。

## 先界定观察对象

要先固定你在看哪一类结果。enhanced-mode 可选 fake-ip 或 redir-host，默认 redir-host。若为 fake-ip，应用拿到的是 fake-ip-range 地址段内的映射，用未指向 Clash 的解析器去问公网，本来就不会显示 nameserver 的真实结果。此时「没变」往往是看错了出口，而不是 YAML 没加载。redir-host 下看到的更接近上游返回的地址，才适合用来对比 nameserver 或 fallback 是否切换。

enable 为 false 时使用系统 DNS。改 nameserver、fallback 或 nameserver-policy 都不会进入解析路径，结果不变是预期。listen 支持 UDP 与 TCP 监听；查询未发到该地址，配置再完整也不会改变结果。use-hosts 默认 true，use-system-hosts 默认 true，命中配置或系统 hosts 时直接回应，改上游不会覆盖。把浏览器或系统里另一套解析当成 Clash 结果，也会造成「改了没变」的误判。

## 哪些字段会让改动轮空

nameserver-policy 指定域名查询所用服务器，可使用 geosite，优先于 nameserver 和 fallback。只改默认 nameserver 而域名命中策略，结果仍走策略服务器，不能据此说默认项无效。proxy-server-nameserver 仅用于解析代理节点域名，不填则遵循 nameserver-policy、nameserver 和 fallback。direct-nameserver 用于 direct 出口域名解析；direct-nameserver-follow-policy 默认不遵守策略，且仅当 direct-nameserver 非空时生效。改错段会出现节点域名变了但页面解析没变之类错位。

配置 fallback 后默认启用 fallback-filter，geoip-code 默认为 CN。geoip 开启时，非该国结果会被视为污染并改用 fallback。ipcidr 所列网段、domain 所列域名也会走过滤逻辑。geosite 字段已废弃，应改用 nameserver-policy。只改 nameserver 未改过滤条件时，最终仍可能采用 fallback，观感像没改。fallback-lazy-query 默认 false，为 true 会先判断 nameserver 结果是否满足过滤再发起 fallback 查询，时序不同。

缓存会造成旧结果。cache-algorithm 支持 lru（默认）和 arc。default-nameserver 必须为 IP，用于解析 DNS 服务器域名，可为加密 DNS；这里不可用会导致上游连不上，表现可能是旧缓存或失败，而不是新地址。respect-rules 为真时 dns 连接遵守路由规则，需配置 proxy-server-nameserver，手册强烈不建议与 prefer-h3 一起使用。附加参数 disable-ipv4、disable-ipv6 会丢弃 A 或 AAAA，缺一类记录不等于整段 DNS 无效。

## 逐步判断与失败分支

第一步，读生效配置，确认 enable 为 true。为 false 则先启用再判断是否无效。

第二步，确认待测域名查询发往 listen。未进入该监听则先改解析指向，而不是继续改 nameserver 列表。

第三步，查该域名是否命中 nameserver-policy、hosts 或 fake-ip-filter。命中策略以策略值为准；命中 hosts 以 hosts 为准。fake-ip-filter 名单内的域名不会下发 fakeip 映射；filter-mode 为 whitelist 时只有匹配成功才返回 fake-ip，为 rule 时写法与路由规则一致，可含 RULE-SET、GEOSITE、DOMAIN 与 MATCH。

第四步，若使用 fallback，对照 geoip、ipcidr、domain，判断应采用哪一组。不要用未经过 Clash 的公共查询去对比 fake-ip。

第五步，排除缓存后再查。仍不符则对照是否改错了节点解析与默认解析两段；核对附加参数有没有丢弃记录类型。

若字段均已加载仍无变化，检查是否有另一份配置覆盖、是否未重新加载、以及 default-nameserver 是否仍能解析上游域名。这些成立之前，不能下配置无效的结论。系统 DNS、浏览器私有 DNS 或应用内置解析绕过 listen 时，应先让查询进入 Clash，再评价 YAML。

https://wiki.metacubex.one/config/dns/
