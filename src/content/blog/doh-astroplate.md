---
title: "Clash DoH 连接报错如何区分 TLS 与解析故障"
description: "Clash DoH 连接报错如何区分 TLS 与解析故障。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

DoH 连接失败时，要把“上游主机名有没有被解析出来”和“HTTPS/TLS 有没有按证书与 HTTP 版本建起来”分开看。手册没有给出固定的报错文案，因此区分依据是字段职责与查询阶段，而不是去对应并不存在于文档中的按钮或日志标题。

## 解析故障：引导、鸡蛋问题与应答被丢弃

适用条件：DoH 条目的主机名是域名，或查询结果突然变成空、被换成另一组上游。`default-nameserver` 用于解析 DNS 服务器的域名，必须为 IP，可为加密 DNS。判断依据：进程还没有对 DoH 主机名完成解析时，后续 TLS 不会进入“对正确证书名做校验”的阶段，这类情况应先当解析故障。

文档还指出：如需经过代理查询，应配置 `proxy-server-nameserver`，以防出现鸡蛋问题；`respect-rules` 需配置该项。节点域名若依赖尚未连通的代理，或 DNS 连接要遵守路由却没有独立的节点解析上游，会表现为连 DoH 主机名都得不到。`ipv6` 为 `false` 时回应 AAAA 的空解析；附加参数里的 `disable-ipv4`、`disable-ipv6`、`disable-qtype-` 会丢弃特定类型回应。`use-hosts`、`use-system-hosts` 会让部分名字在上游之前就被本地回答。

步骤：1. 看 DoH 是域名还是 IP 入口，域名则检查 `default-nameserver` 是否为可达 IP；2. 看查询是否要求走代理或 `respect-rules`，是则检查 `proxy-server-nameserver` 是否非空；3. 看空结果是否正好对应关闭 IPv6 或 disable 类参数。失败时下一步：先把引导项改回 IP，或给节点解析单独写上游；不要在主机名未解析时去改 `skip-cert-verify`。

## TLS 故障：证书校验与 HTTP/3 建连

适用条件：DoH 主机名已经能得到地址，但 HTTPS 建连不成功，或你正在使用证书、HTTP/3 相关参数。DoH 以 HTTPS 发向公网 DNS；`skip-cert-verify` 跳过 TLS 证书验证；`name-cert-verify` 仅修改证书 DNSName 校验目标，不修改 SNI。判断依据：问题随证书参数或 HTTP 版本开关变化，而引导 IP 并未改动，更接近 TLS/HTTP 层，而不是“名字解析不到”。

`prefer-h3` 表示 DOH 优先使用 HTTP/3；单条 `h3` 强制 HTTP/3 建立 DOH 连接，使用前需确保 DOH 服务器支持 HTTP/3，二者不冲突。文档同时写明：`respect-rules` 强烈不建议和 `prefer-h3` 一起使用。步骤：1. 记录是否带 `h3` 或全局 `prefer-h3`；2. 记录是否跳过证书、是否只改了 DNSName；3. 在不改动 `default-nameserver` 的前提下，去掉强制 HTTP/3 或恢复证书校验，观察失败是否仍在建连阶段。失败时下一步：服务器不支持 HTTP/3 则取消强制；证书 DNSName 与访问名不一致时，只用 `name-cert-verify`，不要误当成 SNI 修改项；需要跳过校验时明确这是证书策略，而不是解析策略。

## 用分流结果避免把污染判断当成 TLS

适用条件：已经能得到应答，但最终采用的服务器不是你写的那条 DoH。`nameserver-policy` 优先于 nameserver/fallback。配置 `fallback` 后默认启用 `fallback-filter`：`geoip` 判断下，除 `geoip-code` 国家以外的 IP 结果会被视为污染；`ipcidr` 网段也会被视为污染并改用 fallback；`domain` 列表会直接使用 fallback 解析。`geosite` 字段已废弃，请使用 `nameserver-policy`。判断依据：TLS 成功但答案来源被换成 fallback，属于过滤与分流，不是证书错误。

`enhanced-mode` 为 fake-ip 时，过滤名单内的名字不会下发 fakeip 映射，容易被误认成“DoH 没查到”。步骤：对照 policy、fallback-filter 与 fake-ip-filter 的匹配顺序；确认失败域名是否命中“只走 fallback”或“real-ip”。失败时下一步：先把该域名从污染/过滤条件中单独标出，再决定是否修改 DoH 地址；若此时主机名都解析不了，仍回到上一节的引导 IP，而不是交叉改证书项。

资料：https://wiki.metacubex.one/config/dns/
