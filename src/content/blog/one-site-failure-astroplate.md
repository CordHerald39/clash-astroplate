---
title: "Clash 一个域名失败但其他网站正常怎么排查"
description: "Clash 一个域名失败但其他网站正常怎么排查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

某一个域名失败、其他网站正常，说明入站和默认出站大体可用，排查应围绕“这一条请求”进行：它命中了哪一条规则，匹配的是主机名还是解析后的 IP。官方文档明确，规则将按照从上到下的顺序匹配，顶部优先级更高。下面只处理单域名失败、其余站点可用的情况。

## 适用条件

适用于 `rules` 已经生效，其他域名可以按预期分流，仅单个域名或其明确子域失败的场景。文档中的匹配器包括 `DOMAIN`、`DOMAIN-SUFFIX`、`DOMAIN-KEYWORD`、`DOMAIN-WILDCARD`、`DOMAIN-REGEX`、`GEOSITE`，以及 `IP-CIDR`、`GEOIP`、`IP-ASN` 等目标 IP 类规则。若每次失败的主机名都不固定，应先选定一个完整域名再查，避免把多个不相干主机混成“同一个站”。

## 核对完整域名与后缀是否真正命中

`DOMAIN` 只匹配完整域名，主机名多一个子域就不会命中。`DOMAIN-SUFFIX` 匹配后缀：文档写明 `google.com` 匹配 `www.google.com` / `mail.google.com` 和 `google.com`，但不匹配 `content-google.com`。排查时把失败主机名与规则 payload 逐字对比，确认是否误用后缀去匹配“中间嵌入一段文字”的域名，或用完整 `DOMAIN` 去匹配带额外前缀的访问。`DOMAIN-KEYWORD` 只要关键字出现在域名中即匹配，过宽会把该域名卷进 `REJECT` 或错误策略，过窄则会漏掉。`DOMAIN-WILDCARD` 仅支持 `*` 和 `?`，与配置其他处的 Clash 格式通配符不相同。`DOMAIN-REGEX` 未限制边界时可能意外命中。`GEOSITE` 匹配 Geosite 内的域名，部分内容参考 v2fly/domain-list-community；该域名若不在对应分类，就不会走那一行。

操作上，为失败主机名添加一条最顶部的 `DOMAIN,完整主机名,策略`，策略先用与其他正常站点相同的出站。若此时成功，说明原来没有命中预期规则，或被更高优先级规则截走。若此时仍失败，则域名字符串匹配不是主因，应转入 IP 类规则。

## 排查解析后的 IP 类规则

域名规则未命中时，请求可能落到 `IP-CIDR`、`IP-CIDR6`（二者效果一样，后者是别名）、`IP-SUFFIX`、`IP-ASN`、`GEOIP`。匹配目标 IP 时，mihomo 会触发 DNS 解析以检查目标 IP 是否匹配规则；`no-resolve` 可跳过解析。但如在更早的匹配中触发了 DNS 解析，则依旧会匹配到添加了 `no-resolve` 的目标 IP 类规则。因此其他站正常、这一域名失败，常见于该域名解析到被 `GEOIP` 或某段 `IP-CIDR` 处理的地址，而其他站解析结果不同。

附加参数 `src` 仅支持关于目标 IP 的规则，会将目标 IP 匹配转为来源 IP 匹配，误加会让判断对象从“访问哪个域名”变成“谁发起的连接”。`DST-PORT` 匹配目标端口，`NETWORK` 匹配 tcp 或者 udp。文档指出：请求为 udp 且代理节点没有 udp 支持（例如 ss 节点没写 `udp: true`）时，会继续向下匹配。该域名若依赖 UDP，仅使用 TCP 的其他网站仍可正常。逻辑规则 `AND`、`OR`、`NOT` 的 payload 要写成规则类型加条件，并注意括号，例如 `NOT,((DOMAIN,baidu.com)),PROXY`。`RULE-SET` 引用规则集合，需配置 rule-providers；集合内若包含该域名的拒绝或直连条目，主列表里看不到也能导致单域名失败。

## 失败时下一步

确认顶部精确 `DOMAIN` 已指向与其他成功站点相同的出站后，若仍然失败，不要继续增加后缀或关键字，应检查是否命中 `REJECT`、错误的 `GEOIP` 或 `IP-CIDR`、`RULE-SET`，或过早出现的 `MATCH`。`MATCH` 匹配所有请求且无需条件，放在该域名专用规则之前会吞掉专用项。`PROCESS-NAME` / `PROCESS-PATH`（含通配符与正则）只在特定进程生效，可解释同一域名在某一程序失败、在另一程序正常；Android 上可以匹配包名。`UID` 匹配 Linux USER ID。规则侧已经能确定命中可用出站后，应停止在规则列表上加行，改为检查该出站是否支持所需 `NETWORK`，以及解析 IP 是否落入拒绝或直连 CIDR。

资料来源：https://wiki.metacubex.one/config/rules/
