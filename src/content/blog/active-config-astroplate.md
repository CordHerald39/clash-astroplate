---
title: "Clash 改了文件却没有生效先检查什么"
description: "Clash 改了文件却没有生效先检查什么。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

改了文件却没有生效时，先检查的不是再改一次内容，而是：改动是否落在内核实际用到的那份声明上、该项有没有进入已运行内核、以及会不会被 API、缓存或平台强制值盖住。全局配置页把这些条件写在不同字段下，需要按优先级看，而不是平行猜测。

## 适用条件

适用于已经修改 YAML 或本页列出的证书等外部文件，但日志范围、运行模式、局域网访问、API 或 Keep Alive 没有按预期变化的场合。本页是全局配置，不用来解释某一条路由规则是否命中网站。

## 按优先级检查什么

1. 先核对改的是不是与运行行为对应的那一份。用 log-level、mode、external-controller、bind-address 等做对照。相对路径相对 Clash 工作目录；external-ui 若不在工作目录且未把目录加入 SAFE_PATHS，路径不会按你的设想生效。SAFE_PATHS 的写法与操作系统 PATH 相同。
2. 再确认内核有没有重新读取该项。本页写明：自 v1.19.18，当 tls 的 certificate、private-key 或 ech-key 为本地文件时支持自动重载。这是针对这些证书文件的例外。页面没有写其它全局 YAML 字段会在磁盘保存后自动进入已运行内核。因此只改磁盘、未再次让内核读取该 YAML 时，运行中仍可能是旧值。
3. 检查运行态覆盖。RESTful API 可以控制内核；profile.store-selected 为 true 时会储存 API 对策略组的选择供下次启动使用，文件里的相关意图可能被已储存选择盖住。store-fake-ip 会保留 fakeip 映射。geo-auto-update 按小时间隔更新 GEO，geox-url 指向的资源变化也会让数据与 YAML 文本不同步。
4. 检查观察通道和字段自身条件。log-level 仅在控制台和控制页面输出，silent 不输出；改了级别却到未记载的地方找日志，会误判未生效。allow-lan 为 true 时才谈绑定与局域网白黑名单。authentication 与 skip-auth-prefixes 作用于本页列出的 http(s) / socks / mixed 代理用户验证。disable-keep-alive 在 Android 上强制为 true，在该平台把这一项改成 false 不会按文件生效。
5. 判断依据：磁盘上的目标字段与运行观察一致，才算生效。只改了未加载文件，或改了会被平台强制覆盖的项，不能算。

## 失败时下一步

对照显示内核仍是旧全局值时，停止堆叠修改。先保证工作目录与 SAFE_PATHS 覆盖所用路径，再在一次会读取该 YAML 的启动之后观察。仅策略组选择与文件不一致时查 store-selected。仅 GEO 表现变化时查 geo-auto-update 与 geox-url。证书未变时核对是否为本地文件路径、以及是否达到本页所述自动重载版本条件。Android 上 Keep Alive 相关项与文件不符，应按强制值解释，不要继续改同一字段。

资料来源：
https://wiki.metacubex.one/config/general/
