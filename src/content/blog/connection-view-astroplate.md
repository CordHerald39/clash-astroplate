---
title: "Clash 连接列表为空时先确认什么"
description: "Clash 连接列表为空时先确认什么。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

Clash 连接列表为空时，不要先改规则或节点，应先确认：内核有没有对外提供控制面、流量有没有进入代理端口、日志有没有被静默。官方全局配置把“能否看见运行数据”和“谁被允许连入”写在不同项里。列表为空只说明当前观察窗口里没有被内核记录的连接，不能直接证明网络中断，也不能证明策略写错。

## 适用条件：控制面本身必须能连上内核

连接列表依赖外部控制器。`external-controller` 是 RESTful API 监听地址，示例为 `127.0.0.1:9090`。若监听回环，其他设备上的控制界面读不到本机内核，列表会一直空。使用 HTTPS-API 时要配置 `external-controller-tls`，且必须同时存在 `external-controller`，并在 `tls` 中给出证书与私钥。`secret` 为空或填错时，带密钥的客户端会取数失败。文档指出 Unix socket 与 Windows named pipe 访问 API 不验证 secret，但普通 HTTP/HTTPS 控制面仍受密钥约束。`external-controller-cors` 的 `allow-origins` 与 `allow-private-network` 会影响浏览器里的控制页面能否调用 API。`external-ui` 只是把静态资源挂到 API 的 `/ui`，路径无效或未列入安全路径时，页面可能打不开，表现为“看不到连接”。

判断依据：先用本机访问已配置的 API 地址。连不上控制器时，空列表是观察通道问题，不是“当前没有请求”。能够调用 API 但列表仍空，再进入下一节核流入站。

## 先确认流量有没有资格进入代理端口

`allow-lan` 为 false 时，其他设备不能经 Clash 代理端口访问互联网，这些设备在列表中不会出现。`bind-address` 不是 `*` 时，只接受绑定地址上的连接。`lan-allowed-ips` 默认放行 `0.0.0.0/0` 与 `::/0`；来源不在白名单，或落在 `lan-disallowed-ips`（黑名单优先）中，入站会被拒绝，列表同样为空。`authentication` 启用后，http(s)/socks/mixed 需要用户验证；验证失败的会话到不了路由阶段。`skip-auth-prefixes` 只对列出的前缀免验证，本机回环以外的客户端不在其中就会被挡下。

`ipv6` 为 false 时内核不接受 IPv6 流量，纯 IPv6 访问不会形成记录。`mode` 为 `direct` 时流量全局直连，是否仍经可观察的入站，取决于系统是否把套接字送进代理端口；未送入则列表为空是预期现象，不是故障本身。`find-process-mode` 为 `off` 时不匹配进程，列表里即使后来有连接，也可能缺少进程维度，但“完全为空”通常仍是入站未建立，而不是进程模式导致。

## 日志级别与空列表的交叉判断及下一步

`log-level` 仅输出到控制台和控制页面。`silent` 下没有日志可对照；`error` 只在严重到无法使用时才有记录。连接列表空且日志也空，优先怀疑流量未进端口或 API 未指向该进程。出现 `warning`/`error` 且内容与验证、绑定地址、局域网拒绝有关，则空列表是准入失败的结果。`profile.store-fake-ip`、`store-selected` 只影响 Fake-IP 映射和策略组选择是否落盘，不会在无入站时凭空生成连接。

失败时下一步：确认 `external-controller`、`secret`、TLS 与 CORS 后，再看本机进程是否真的把请求发到混合/HTTP/SOCKS 端口。其他设备访问时打开 `allow-lan`，检查 `bind-address`、白名单与黑名单、`authentication`。需要观察 IPv6 时打开 `ipv6`。将 `log-level` 调到 `info` 或 `debug` 复现一次访问：仍无入站日志，问题在系统代理或端口未被使用；有拒绝类日志，按对应配置项收紧或放行来源。不要在列表为空时先调整 GEO 或策略组，那些项不负责“有没有连接可显示”。

资料：https://wiki.metacubex.one/config/general/
