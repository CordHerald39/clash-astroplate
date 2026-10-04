---
title: "Clash 电脑端：Git 拉取失败而网页能打开怎么排查"
description: "Clash 电脑端：Git 拉取失败而网页能打开怎么排查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

## 适用条件

网页能打开而 Git 拉取失败，说明浏览器路径与 Git 路径并不相同，不能用内核已经在工作直接推论 Git 一定能连上。电脑端 Clash 的入站、运行模式、进程匹配和日志级别，只解释进入内核的那部分流量。Git 可能走 HTTPS 代理、走 SSH，或完全直连。本文只排查这一差异。

适用条件：同一台电脑上浏览器能打开目标站点或仓库页；`git fetch` 或 `git pull` 失败；你怀疑流量应经过本机 http、https、socks 或 mixed 入站。若远程是 SSH URL，失败原因通常不在 HTTP 入站，应先改协议再查代理。网页能打开还可能只是浏览器走了直连或另一条入口，和 Git 是否携带 authentication 所需信息没有等价关系，必须分开取证。

## 拆开协议、入口和内核模式

先看远程 URL。HTTPS 才可能使用 Git 的 `http.proxy` 或环境里的 `HTTP_PROXY`、`HTTPS_PROXY`。SSH 不经过这些键。接着确认 Git 实际使用的代理：读取 `http.proxy` 与 `https.proxy`，再查看终端是否仍有代理变量。判断依据：Git 指向的地址应是 Clash 入站；若为空，Git 可能直连，和浏览器是否经代理无关。

然后看内核 mode。rule 按规则匹配，global 把进入内核的流量交给 GLOBAL，direct 则全局直连。浏览器能打开，只说明浏览器那条路径可用，不能说明 Git 进程的连接已经进入内核，更不能说明匹配结果一致。allow-lan 与 bind-address 只在非本机访问时有意义；本机失败不要先改这两项。lan-disallowed-ips 黑名单优先于白名单，但那是局域网入站限制，不是解释浏览器与 Git 差异的第一依据。

若入站启用了 authentication，而 Git 代理字符串没有用户信息，且源地址又不在 skip-auth-prefixes 默认的 `127.0.0.1/8`、`::1/128` 内，入站会拒绝，浏览器却可能已经带上凭据。ipv6 为 false 时，Git 若只尝试 IPv6 也会失败，网页仍可能走 IPv4。

## 用日志和进程匹配收集证据

把 log-level 调到 info 或 debug，再执行一次拉取。判断依据：控制台或控制页面在拉取瞬间有没有新连接。有连接说明流量已进内核，应查规则与 mode；完全没有连接，说明 Git 没打到入站，问题在 Git 代理、环境变量或远程协议，而不是规则写错。silent 无法取证；error 只覆盖无法使用的情况，warning 也不包含一般运行内容，这两档都不够用来对比网页和 Git。

find-process-mode 为 always 时强制匹配进程，为 strict 时由内核决定是否匹配，为 off 时不匹配进程。电脑端若为 off，不要用看不到 Git 进程名证明没有请求。进程匹配只影响能否按进程选路，不能把直连的 Git 拉进入站。接口监听地址、secret 或外部用户界面只说明你能否打开控制页，不能代替上述连接证据。

## 仍失败时的下一步

若日志没有 Git 的连接：回到 URL 协议和代理键，确认不是 SSH，确认代理指向本机入站，确认 authentication 与 skip-auth-prefixes 一致。若日志有连接但仍失败：记录 mode 是 rule、global 还是 direct。direct 下进入内核也会直连，表现可能是超时或被目标拒绝，而不是浏览器那种已打开的页面。

不要在原因未分层前同时改 bind-address、lan-allowed-ips 和 Git 配置。先固定一层再测一层。external-controller 用于接口，不能代替看日志。secret 未填或填错只影响接口访问，不会单独解释网页能开、Git 不能拉。tcp-concurrent、unified-delay 也不解释入口是否连上。若 IPv6 相关存疑，对照 ipv6 开关与 Git 解析到的地址族后再决定是否继续查代理。

参考资料：
https://wiki.metacubex.one/config/general/
