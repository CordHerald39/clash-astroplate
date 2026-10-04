---
title: "Clash 应用得到特殊 IP 后连接异常怎么排查"
description: "Clash 应用得到特殊 IP 后连接异常怎么排查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

应用在 Clash 环境下拿到特殊 IP 后出现连接超时、重置或无法访问，首先要判断该 IP 是否来自 fake-ip 网段。文档将这类地址定义为内核为连接映射而下发的合成结果，并不代表远程服务器真实位置。排查时始终以当前配置文件中的 dns 段为准。

## 确认特殊 IP 的来源与适用范围
查看 fake-ip-range（示例 198.18.0.1/16）以及可选的 fake-ip-range6。若应用日志、抓包或连接列表里的目的地址落在该前缀内，即可认定 DNS 已经走 Clash 且 enhanced-mode 为 fake-ip。判断依据是：地址属于配置的合成网段，而不是公网单播、链路本地或 127.0.0.1。适用条件包括 dns.enable 为 true、应用使用系统 DNS 或指向 listen 端口，并且 TUN 或系统代理已接管该应用流量。若拿到的是真实公网 IP，则问题不在 fake-ip 映射，而应转向规则或出站节点。

## 检查过滤器、流量路径与 IPv6 行为
阅读 fake-ip-filter 与 fake-ip-filter-mode。blacklist 命中会导致本该合成的域名改回真实 IP，whitelist 未命中则相反，两种情况都会让应用行为与预期不一致。rule 模式须按路由语法自上而下匹配。连接异常还常见于应用绕过 TUN（硬编码 DNS、独立 DoH、QUIC 直连）。文档说明 fake-ip 仅用于映射，实际 TCP/UDP 由内核按 rules 转发。ipv6 为 false 时 AAAA 回应为空，双栈应用可能因此失败。步骤：确认 listen 是否生效；将该域名与 filter 列表逐条对照；观察是否只有 IPv6 查询出错。

## 失败后的验证顺序与回退动作
下一步可将可疑域名临时写入 fake-ip-filter 观察是否恢复真实解析，或把 enhanced-mode 改为 redir-host 做对照。检查 nameserver、fallback 以及 fallback-filter（geoip、geosite 已废弃字段、ipcidr、domain）是否给出被判定为污染的结果。respect-rules 开启时必须存在 proxy-server-nameserver，否则 DNS 查询自身会循环。同时查看 cache-algorithm、use-system-hosts 是否残留旧记录。应用自身若缓存了 TTL，需重启或清除其 DNS 缓存后再测。文档未保证所有程序都尊重系统解析，硬编码解析的程序需要单独规则或排除。

参考资料：https://wiki.metacubex.one/config/dns/
