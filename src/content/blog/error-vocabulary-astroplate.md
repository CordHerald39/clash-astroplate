---
title: "Clash timeout、refused 与 reset 分别从哪里查起"
description: "Clash timeout、refused 与 reset 分别从哪里查起。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

## 适用条件：先固定观察面再分头查

看到 timeout、refused、reset 这类英文片段时，不要把它们当成同一种连不上。适用本分头排查的条件是：你能阅读全局配置，并且已经记下当前 `log-level`、`mode` 以及入站、出站相关字段的取值。官方说明日志级别仅在控制台和控制页面输出；若为 `silent`，先改为至少 `error`，否则没有文字可查。`mode` 会改变流量走向：`rule` 规则匹配、`global` 全局代理、`direct` 全局直连。同一关键字在三种模式下指向的配置域不同，必须先记下来再选入口。

判断依据不是主观快慢，而是：该关键字属于哪一类套接字结果，以及官方全局项里哪一组字段专门描述这类行为的前置条件。每次只查一个域，避免把入站拒绝和出站等待写进同一次修改。

## 三类关键字分别从哪一组字段查起

timeout 从等待、握手差异和多地址尝试查起。相关全局项是 `keep-alive-interval`、`keep-alive-idle`、`disable-keep-alive`、`unified-delay`、`tcp-concurrent`。官方说明：Keep Alive 间隔与最大空闲时间单位为秒；统一延迟会计算 RTT，以消除连接握手等带来的不同类型节点的延迟差异；TCP 并发会使用 DNS 解析出的所有 IP 地址进行连接，并使用第一个成功的连接。因此 timeout 应先对照：保活是否被禁用（官方写明在 Android 上强制为 true）、失败是否出现在超过空闲时间之后、是否处于多 IP 并发而只看到部分地址未完成。GEO 自动更新、GEO 下载、ETag 与 `global-ua` 属于外部资源拉取；只有当 timeout 明确出现在 GEO 或外部资源上下文时，才转到 `geo-auto-update`、`geo-update-interval`、`etag-support`。默认不要从 GEO 查起。

refused 从「听谁的、允许谁来、要不要认证」查起。对应字段是 `allow-lan`、`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips`、`authentication`、`skip-auth-prefixes`。官方说明：`allow-lan` 决定其他设备能否经过代理端口访问互联网；`bind-address` 可为 `*`、单个 IPv4 或单个 IPv6；允许段默认 `0.0.0.0/0` 与 `::/0`；禁止段黑名单优先级高于白名单；`authentication` 用于 http(s)/socks/mixed 的用户验证；`skip-auth-prefixes` 设置允许跳过验证的 IP 段。若 refused 发生在其他设备访问代理端口，先核对该 IP 是否落在禁止段，或是否未匹配跳过验证前缀且没有合法用户。若文字出现在 API 而非代理端口，改查 `external-controller` 的监听地址与 `secret`，不要继续在 `allow-lan` 上转。

reset 从连接被打断的传输与 TLS 项查起。优先看 `disable-keep-alive`、间隔与空闲时间，它们改变长连接如何被维持。若 reset 出现在外部控制的 HTTPS，再核 `tls` 中的 certificate、private-key、可选 ech-key；官方注明自 v1.19.18 起，当这些项为本地文件时支持自动重载。reset 出现在普通出站 TCP 时，回到 Keep Alive 三项和 `interface-name`；Linux 再看 `routing-mark`。不要用 `authentication` 或 `secret` 解释 reset：前者是代理用户验证，后者是 RESTful API 访问密钥，Unix socket 与 namedpipe 访问甚至不会验证 secret。

## 缩小范围的步骤与查无对应时的下一步

步骤一，原样记录关键字、`log-level`、`mode`。步骤二，按上一节只选一个起步域，把该域字段取值抄下来。步骤三，用官方优先级判断：局域网问题先看禁止段是否覆盖允许段；认证问题先看是否属于 `skip-auth-prefixes`。步骤四，timeout 若与 DNS 多地址有关，再看 `tcp-concurrent` 是否开启，而不是先改 `mode`。

若三个起步域都没有对应字段变化，下一步不是把三种关键字合成一句网络错误，而是：把日志级别升到能看见 warning 或 info，确认输出是否只在控制台和控制页面；检查是否把「socket/pipe 不验证 secret」误当成连接重置。仍无对应则停止在全局项里猜测，保持三类关键字分列，等待能表明这是入站、出站还是 API 的更多上下文。

资料：
https://wiki.metacubex.one/config/general/
