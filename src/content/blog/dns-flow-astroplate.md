---
title: "Clash IP 可连接而域名失败时先收集什么"
description: "Clash IP 可连接而域名失败时先收集什么。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

当目的地址写成 IP 可以连接、写成域名却失败时，应先收集 DNS 相关配置和解析路径，再去改节点或规则。文档说明 dns.enable 为 false 时使用系统 DNS；为 true 时由内核按 enhanced-mode、nameserver 等处理。IP 连接不经过域名解析，域名连接必须先得到记录或 fake-ip 映射。

## 适用条件

适用于已经能复现同一目标 IP 成功、域名失败，并准备排查 Clash DNS 的场景。失败对象若是代理节点自己的域名，还必须收集 proxy-server-nameserver，因为节点域名解析与普通网站不是同一组服务器。respect-rules 为 true 时 DNS 连接遵守路由规则，且需配置 proxy-server-nameserver，清单里要同时记录这两项。

## 应先收集的项目与判断依据

按清单抄写当前值，先不要改。

1. dns.enable、listen、ipv6。未启用则解析不在内核；ipv6 为 false 时对 AAAA 回应空解析，双栈域名会表现为部分记录缺失。
2. enhanced-mode（fake-ip 或 redir-host，默认 redir-host）、fake-ip-range、fake-ip-filter、fake-ip-filter-mode。fake-ip 下域名可能先得到映射再连接；过滤名单内的域名不会下发 fakeip。失败域名是否命中过滤，或规则模式中的 real-ip、fake-ip 动作，是后续判断的依据。
3. default-nameserver：用于解析 DNS 服务器的域名，必须为 IP，可为加密 DNS。nameserver 写成域名而 default 不可用时，会出现 IP 能连、域名链路上的 DNS 服务器自己无法解析。
4. nameserver、fallback、nameserver-policy、fallback-filter（含 geoip、geoip-code、ipcidr、domain）。policy 优先于 nameserver 与 fallback。要记下失败域名会命中哪一条，以及 nameserver 结果是否会被视为污染而改用 fallback。文档标明 geosite 字段已废弃，若仍在用需要单独记下来。
5. proxy-server-nameserver 与 proxy-server-nameserver-policy：仅用于解析代理节点域名；不填则遵循 nameserver-policy、nameserver 和 fallback。节点域名失败而网站 IP 成功时，先看这一组。
6. direct-nameserver 与 direct-nameserver-follow-policy：direct 出口的域名解析。
7. use-hosts、use-system-hosts：是否回应配置中的 hosts、是否查询系统 hosts。
8. 发向公网 DNS 的附加参数。文档说明使用井号附加、用与号连接，可指定代理或接口、ecs、disable-ipv4、disable-ipv6 等。文档中的 RULES 附加写法表示遵守路由规则，等同 respect-rules。收集这些才能区分解析被丢弃还是查询走错出口。

判断依据：IP 成功说明传输与出站大致可用；域名失败应能在上述某一项对应到未解析、空解析、解析到不可用地址，或 fake-ip 映射与过滤不一致。

## 失败时下一步

清单不完整就不要同时改 nameserver 和模式。先区分失败的是网站域名还是节点域名，只核对对应的服务器组。default-nameserver 不是 IP 时先处理这项。需要 DNS 走代理时应配置 proxy-server-nameserver，避免文档所说的鸡蛋问题。prefer-h3 与 respect-rules 强烈不建议一起使用，若两者都开，先记录再单独处理。收集完成后，用同一域名对照 hosts、policy、filter、fallback 的命中顺序。

资料：https://wiki.metacubex.one/config/dns/
