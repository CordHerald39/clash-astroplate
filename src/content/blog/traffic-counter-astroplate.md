---
title: "Clash 网页打不开但流量数字在变怎么解释"
description: "Clash 网页打不开但流量数字在变怎么解释。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

浏览器打不开目标网页、但流量计数仍在跳动时，不能直接推断代理已经连通，也不能把跳动数字当成该页面正在下载。官方全局配置只说明内核如何接受连接、如何出站以及日志打到哪里，并没有把某一网站是否渲染成功绑定到流量读数上。要把“内核仍在处理某些连接”和“该网页的响应是否成功”分成两件事。

## 先判断流量是不是来自当前这次打开网页

适用条件是你能查看当前全局配置，并知道本机或局域网里还有哪些程序可能使用代理端口。`allow-lan` 为 `true` 时，其他设备可经代理端口访问互联网；`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips` 决定谁能连进来，且黑名单优先于白名单。判断依据：若允许局域网且绑定 `"*"`，流量变化完全可能来自另一台设备，与当前浏览器标签无关。未配置 `authentication`，或 `skip-auth-prefixes` 覆盖了回环等前缀时，本机其他进程也能使用 http(s) / socks / mixed 端口。操作步骤：先把 `allow-lan` 设为 `false` 并收紧绑定地址，只保留本机观察；若数字明显下降，说明原先跳动并非该网页产生。

## 再排除保活、资料更新和控制面自己的后台流量

`keep-alive-interval`、`keep-alive-idle` 会按秒级间隔发送 TCP Keep Alive；Android 上 `disable-keep-alive` 被强制为 `true`，其他平台则可能仍有保活包。页面未打开成功的连接，仍可能维持探测。`geo-auto-update` 为 `true` 时按 `geo-update-interval`（单位小时）拉取 `geox-url` 中的 geoip、geosite、mmdb、asn 等文件，这些下载会改变计数，却不会让业务网页变为可访问。`external-controller` 提供 RESTful API，`external-ui` 只是把静态资源挂在 API 的 `/ui` 路径；控制面轮询或加载这些静态文件也会产生流量。`external-doh-server`、Unix socket 与 named pipe 访问 API 时不验证 `secret`，若被其他程序使用，同样会出现持续数字变化。判断依据：关闭 GEO 自动更新并提高 `log-level` 后，若日志里是外部资源下载或 API 访问、而没有目标站点的成功出站，即可解释“有流量、无网页”。

## 用模式、双栈和出站条件解释网页失败

`mode` 为 `direct` 时流量不走代理节点；为 `rule` 时未命中代理的请求不会按你想象的节点出去；为 `global` 时还须在 GLOBAL 策略组选出代理或策略。网页打不开，可能是规则未覆盖、策略组未选择，或 `ipv6` 为 `true` 时走了不通的 IPv6 路径。`tcp-concurrent` 会对所有解析 IP 并发连接并采用第一个成功者，可能造成“有握手流量，但业务并没有落到可用地址”。`interface-name` 与 `routing-mark` 会把出站送到指定网卡或标记，接口错误时本地尝试仍可能增加计数，页面仍然失败。`tls` 段目前仅用于 API 的 HTTPS，不能拿来解释普通网站证书问题。

把 `log-level` 调到 `warning`、`info` 或 `debug`（`silent` 不输出，`error` 只保留无法使用级别），在控制台或控制页面查看记录。若没有该域名的出站成功、只有保活、GEO 或 API，结论就是流量与网页无关。下一步应核对规则与 DNS 等本页未展开的部分，并避免把 Clash 的 `/ui` 能打开误当成目标网站能打开。

参考资料：https://wiki.metacubex.one/config/general/
