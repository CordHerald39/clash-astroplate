---
title: "Clash 恢复配置后设置缺失怎样查来源"
description: "Clash 恢复配置后设置缺失怎样查来源。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

恢复配置后若监听、鉴权、模式或界面与预期不符，应先区分三种来源：键被省略后走了默认值、键在 YAML 里但路径或环境变量无效、值存在于 API 缓存而不在配置正文。下面只说明如何按全局配置查缺失项来源。依据为全局配置说明。

## 适用条件

适用于已把配置放回工作目录并启动内核、但部分全局行为消失的场景。查来源前需要当前正在加载的 YAML，以及手册给出的默认值。出站节点或路由规则缺失不在本文范围；此处只覆盖全局段能解释的现象。

## 用默认值判断是丢失还是未写

先把“看起来没了”的行为对应到字段，再和默认值比较。`mode` 默认为规则模式 `rule`；恢复后若不是 global 或 direct，可能是文件未写 `mode`，而不是模式功能损坏。`ipv6` 默认 true，未写并不等于关闭 IPv6。`find-process-mode` 默认 `strict`；若路由器上曾经设为 `off` 却在恢复文件中消失，进程匹配会回到由内核判断是否开启，来源是键被省略。`lan-allowed-ips` 默认 `0.0.0.0/0` 与 `::/0`，`lan-disallowed-ips` 默认空，且黑名单优先级高于白名单。局域网能连或不能连时，应同时查 `allow-lan`、`bind-address` 与这两份名单，而不是只看端口是否还在。

GEO 与外部资源要用另一组默认值解释：`geodata-mode` 默认 false（使用 mmdb 而非 dat）；`geodata-loader` 默认 `memconservative`；`geo-auto-update` 默认 false，`geo-update-interval` 默认 24 小时；`etag-support` 默认 true；`global-ua` 默认为 `clash.meta`。表现变化时，先看这些键是否从文件消失从而回到默认，再看 `geox-url` 是否还在。Keep Alive 相关键亦然；Android 上 `disable-keep-alive` 强制为 true，不能用其他平台文件里的值解释手机侧行为。`log-level` 为 `silent` 时不输出日志，不要把“控制台没字”当成配置未加载。

## 查路径、密钥与 API 缓存

外部界面缺失时，按路径链追查：`external-ui` 可为绝对路径或相对工作目录的路径；路径不在工作目录时必须设置 `SAFE_PATHS`，否则资源不会按预期加载。`external-ui-name` 会合并为 `external-ui` 下的子目录，未配置则更新到 `external-ui` 目录。`external-ui-url` 决定下载来源。应依次确认：路径是否随备份迁移、`SAFE_PATHS` 是否仍包含该路径、name 是否指向空目录、url 是否被去掉。

API 控制缺失时，查 `external-controller`、`secret` 与 CORS。使用 TLS 时必须填写 `external-controller-tls`，并配置 `tls` 的证书和私钥，同时也必须填写 `external-controller`。Unix socket、Windows namedpipe 以及 `external-doh-server` 访问不验证 secret。恢复后若“不用密钥也能控”或“密钥完全无效”，来源可能是启用了这类监听，而不是只把 `secret` 写错。Linux 上 `external-controller-routing-mark` 只作用于 API 监听 socket，不要把它当成一般出站 `routing-mark` 丢失的唯一解释。出站 `interface-name` 与 `routing-mark` 在文件中消失会直接改变出口，应在 YAML 全局段定位。

TLS 的 `certificate`、`private-key`、`ech-key` 可以是 PEM 文本或路径；本地文件自 v1.19.18 支持自动重载。HTTPS API 不可用时，应查证书是否未随 YAML 拷贝、路径是否失效。`authentication` 与 `skip-auth-prefixes` 丢失，会表现为代理端口突然不需要用户，或某网段被要求验证，来源是这两键而非 `secret`。

`profile.store-selected` 为 true 时，策略组选择存在独立存储、供下次启动使用；`store-fake-ip` 保存 fakeip 映射。只恢复 YAML、未恢复对应存储，会表现为“配置在、选择不在”或域名映射变化，来源是 profile 缓存。

## 排查步骤与失败时下一步

步骤：列出缺失现象，映射到全局键，看文件是键不存在、值为空，还是路径或环境变量不存在；用手册默认值解释“未写”；对界面和证书再查 `SAFE_PATHS` 与文件是否随备份；对策略组选择查 `store-selected` 是否为 true 以及缓存是否一并恢复。`bind-address` 若仍是旧机器地址，表现为允许局域网但连不上，来源是绑定地址与当前网卡不匹配，需按说明改回 `*` 或当前地址。

若对照全局段仍无法解释：确认加载的确实是这份文件、没有另一工作目录。若仅 API 异常，分开验证 TCP 端口、unix/pipe、TLS 三种监听。判断以字段和默认值为准。

https://wiki.metacubex.one/config/general/
