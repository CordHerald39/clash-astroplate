---
title: "Clash 重新加载配置失败怎样保留可用状态"
description: "Clash 重新加载配置失败怎样保留可用状态。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

本页没有描述「重新加载配置失败」之后，内存里是否仍保留旧配置。所谓可用状态，不能建立在未记载的失败语义上，而应建立在仍可启动的文本、仍可到达的控制面，以及与 YAML 分开保存的那部分缓存上。加载失败时，优先保住入口，而不是继续改同一份文件。

## 适用条件

适用于改完全局项后进程起不来、控制面连不上、或局域网设备进不了代理端口的情况。适用于你还能访问上一份 YAML、知道 external-controller 与 secret 曾如何填写的场合。不适用于把 Unix socket 或 namedpipe 临时改成无密钥入口来「抢回控制」——该页已写明这两类访问不验证 secret，开启后需自行保证安全。

## 先保住控制面和入站入口

external-controller、external-controller-tls、secret、authentication、allow-lan、bind-address 同属入口。一次失败里如果它们已被写乱，应整段恢复为上一份已知可访问的取值，而不是只改其中一项再赌能否连上。HTTPS-API 还依赖 tls 的证书与私钥；自 v1.19.18 起本地文件支持自动重载，损坏的 PEM 可能立刻影响该监听，因此证书文件也要能回到改前内容。

allow-lan 为 true 时，bind-address、lan-allowed-ips、lan-disallowed-ips 共同决定谁能用代理端口。黑名单优先级高于白名单，默认黑名单为空。失败后若只收紧了黑名单，恢复时应先去掉那几条禁止段。skip-auth-prefixes 用于跳过 http(s)/socks/mixed 的用户验证，本页示例是回环地址段；不要在失败排查中清空验证的同时放开绑定地址。

## 分清 YAML 与可跨启动保留的状态

profile.store-selected 会储存 API 对策略组的选择，供下次启动使用；store-fake-ip 会储存映射表。它们不随你在编辑器里撤销某一行而自动消失。回退 YAML 之后，策略组看起来「还是旧选择」或某域名仍走原映射，只能说明缓存仍在，不能说明失败的那次加载已经成功。mode 缺省为规则模式，find-process-mode 缺省为 strict，ipv6 缺省为 true：删掉这些键会回到缺省，而不是回到你记忆中的上一次自定义值。Android 上 disable-keep-alive 被强制为 true，把该项改回 false 不能作为该平台上的可用回退。

## 失败时下一步

停止向当前文件追加新字段。用上一份可启动文本整体替换，先恢复监听地址与密钥，再恢复 allow-lan 相关段。外部界面路径若不在工作目录，按该页要求检查 SAFE_PATHS，避免因路径不安全而再次加载失败。GEO 地址或自动更新开关与本次入口失败无直接对应关系，不要在入口未恢复时改 geox-url。确认控制台或控制页面在既定 log-level 下重新出现符合该等级的输出后，再考虑是否继续改其他项。

资料来源：
https://wiki.metacubex.one/config/general/
