---
title: "Clash 提示地址已被使用时应该检查什么"
description: "Clash 提示地址已被使用时应该检查什么。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

Clash 提示地址已被使用，表示内核在为某一入口执行 bind 时失败，故障停在入站套接字，而不是规则未命中或节点不可用。适用条件是：进程已经尝试启动，控制台或日志出现地址占用类错误，需要按全局配置核对究竟是哪一个地址没有绑上。

## 先把报错对齐到具体监听项

资料中会占用地址的入口至少分两类。第一类是代理端口。无论 `allow-lan` 为 true 还是 false，内核都要在 `bind-address` 指定的地址上绑定这些端口；该值为 true 只表示其他设备可以经过代理端口访问互联网。`bind-address` 为 `*` 时绑定所有 IP，为具体 IPv4 或 IPv6 时只绑定那一个地址。报错里出现的 IP 应能与当前 `bind-address` 对上：若配置写的是单一局域网地址，却在其他网卡或未声明的地址上报告占用，说明正在运行的很可能不是你正在编辑的那份配置。

第二类是外部控制。示例为 `external-controller: 127.0.0.1:9090`。启用 TLS 时还有 `external-controller-tls`（示例 `127.0.0.1:9443`），资料要求使用 TLS 必须同时填写 `external-controller`，因此一次启动可能绑定两个 TCP 控制端口。Unix socket 与 Windows named pipe 分别由 `external-controller-unix`、`external-controller-pipe` 声明，报错可能表现为路径或管道已被使用。检查时应把报错中的地址、端口、路径与上述字段逐字对照，而不是只改代理端口。`tls` 段的证书和私钥是 TLS API 的前置条件，缺证书会导致 TLS 监听起不来，但那与「地址已被使用」不是同一条错误。

## 再核对绑定范围，不要把局域网策略当成占用原因

`allow-lan`、`lan-allowed-ips`、`lan-disallowed-ips` 容易被误当成端口开关。允许或禁止的 IP 段只约束谁能连上已经绑定成功的代理端口：默认允许 `0.0.0.0/0` 与 `::/0`，黑名单优先。它们不会让内核放弃 bind。若提示地址已被使用，判断依据仍是目标地址上的端口或路径无法绑定，而不是某网段被写入 `lan-disallowed-ips`。

若 `bind-address` 从具体 IP 改成 `*`，监听范围变大，本机其他接口上已被占用的同端口会立刻变成启动错误。反过来，若只绑定 `127.0.0.1`，局域网网卡上的同端口占用通常不会影响这次绑定。判断时以报错中的地址为准，它必须出现在当前的 `bind-address` 或 `external-controller` / `external-controller-tls` 声明里。`external-controller-cors`、`secret`、`external-ui` 影响 API 的跨域、密钥和界面文件路径，不能解释地址占用。`external-controller-routing-mark` 只为 Linux 上的 API 监听套接字设置 routing-mark，也不占用额外端口。

## 排除无关项之后的下一步

`authentication` 与 `skip-auth-prefixes` 只用于代理用户验证，失败表现是认证被拒绝。`mode` 为 rule、global 或 direct 只决定流量怎么走。`log-level`、`ipv6`、`find-process-mode` 以及 GEO 相关项也不会抢 TCP 端口。若这些字段改来改去而报错不变，应停止在无关项上尝试。

失败时下一步按顺序进行。第一，确认没有第二个内核实例仍在监听同一 `external-controller` 或同一代理端口。第二，按报错地址把配置改到空闲端口，或把 `bind-address` 改到确实空闲的地址。第三，若使用 Unix socket 或 named pipe，检查旧进程是否仍占着配置中的路径；资料写明从这两类入口访问 API 不会验证 secret，处理残留实例时要先确认进程身份，而不是反复修改 `secret`。需要看清失败细节时，把 `log-level` 调到能够输出 error 或 warning 的级别，对照日志中的地址再改配置，不要同时改 `interface-name` 或 `routing-mark` 等出站项。

资料来源：https://wiki.metacubex.one/config/general/
