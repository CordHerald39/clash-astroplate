---
title: "Clash 面板连接不上内核怎样区分接口与代理故障"
description: "Clash 面板连接不上内核怎样区分接口与代理故障。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

面板连不上内核时，应先分清故障落在控制接口还是落在代理端口。两者在全局配置里分属不同段落：外部控制提供 RESTful API，代理相关项则约束 http(s)/socks/mixed 等入站。把“网页打不开”“节点连不上”“局域网设备不能上网”混成同一类问题，会把排查方向带偏。

## 适用条件

适用于面板提示无法连接内核、API 超时、浏览器控制台出现跨域或鉴权失败，同时本机或局域网代理表现不明的情况。判断前提是配置中确实分别存在控制接口字段和代理相关字段。若尚未启用 `external-controller`，应先按“接口未监听”处理，而不是先改代理规则。本文只区分接口故障与代理故障，不展开策略组或规则匹配。

## 用配置归属来区分两类故障

控制接口一侧，文档给出的关键项是：`external-controller`（API 监听地址，示例为 `127.0.0.1:9090`，可改为 `0.0.0.0` 监听所有 IP）、`secret`（API 访问密钥）、`external-controller-cors`（CORS 标头）、`external-controller-tls`（HTTPS-API，需证书与私钥，且使用 TLS 时必须同时填写 `external-controller`）、`external-controller-unix`、`external-controller-pipe`，以及可选的 `external-doh-server`。外部用户界面挂在 API 上，路径为 API 地址加 `/ui`。面板连内核，走的是这一组，而不是 mixed/http/socks 端口。

代理一侧，文档写明：`allow-lan` 表示是否允许其他设备经过 Clash 的代理端口访问互联网；`bind-address` 约束其他设备通过哪个地址访问；`lan-allowed-ips` 与 `lan-disallowed-ips` 只在 `allow-lan` 为 true 时作用于连接来源；`authentication` 与 `skip-auth-prefixes` 用于 http(s)/socks/mixed 代理的用户验证。这些字段即使全部正确，也不能证明 REST 控制接口可连通；反过来，API 可连通也不等于代理端口已对局域网开放。

可用现象对照：面板完全无法打开或提示连不上指定主机端口，优先看 `external-controller` 是否监听在面板正在访问的地址，以及是否误用了代理端口数字。浏览器能打开页面但 API 被拒绝，优先看 `secret` 与 CORS。本机面板正常、其他设备不能用代理上网，优先看 `allow-lan`、`bind-address` 和地址段名单。其他设备能走代理但不能打开面板，说明代理入站与 API 监听可能不一致，例如 API 仍绑在 `127.0.0.1`，而代理已允许局域网。

还要注意接口内部的鉴权差异，以免误判为“代理认证失败”。Unix socket 与 Windows named pipe 访问 API 不会验证 secret；DOH 若开在 REST 端口上，该 URL 也不验证 secret。面板若走 TCP/TLS 端口却不带密钥，应归为接口鉴权问题。`authentication` 只作用于代理端口，不能用来解释 REST 调用 401 一类现象。

## 判断依据与失败时下一步

建议固定顺序：先问面板填写的内核地址，是否等于配置里的 `external-controller`（HTTPS 则核对其 TLS 端口）；再问该通道是否属于“不校验 secret”的套接字或管道；然后才看 `allow-lan` 与代理认证。CORS 只在浏览器跨源访问 API 时介入。`external-ui` 路径不在工作目录时，还要核 `SAFE_PATHS`，否则表现为界面资源失败，仍属接口/界面侧，不是代理侧。

若按上述仍分不清：把“面板能否访问 API 地址/ui 或 REST 根路径”和“客户端能否使用代理端口出网”当成两次独立试验，不要用同一次联网结果下结论。接口侧失败时，检查监听地址、密钥、TLS 是否缺证书或漏写 `external-controller`、CORS 来源。代理侧失败时，检查 `allow-lan`、绑定地址、黑白名单和代理用户验证。两类同时失败，分别处理，不要用改代理名单的方式去修面板连接。

参考资料：https://wiki.metacubex.one/config/general/
