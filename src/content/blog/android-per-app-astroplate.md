---
title: "Clash Meta 手机端（Android）：只有一个应用不走代理如何排查"
description: "Clash Meta 手机端（Android）：只有一个应用不走代理如何排查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

当 Clash Meta for Android 作为当前 VPN 服务运行时，若出现“只有一个应用不走代理”，应先按 Android per-app VPN 的语义判断：该应用的流量是否根本没有进入本地 TUN 接口。未进入接口的数据包不会交给 Clash.Meta 内核，内核侧规则再完整也无法改变该应用的出口。Clash Meta for Android 是 Clash.Meta 的图形界面，包名为 `com.github.metacubex.clash.meta`，最低系统 Android 5.0，建议 7.0 及以上。仓库未提供逐步菜单名称，下列排查以官方 VPN 接口行为为准。

## 适用条件与优先核对项

每个用户或工作资料只能有一个活动 VPN 服务，启动新服务会停止旧服务。若系统里另有 VPN 处于已连接状态，Clash Meta 可能根本不是正在接管流量的那一个。设置里的 VPN 界面（Settings > Network & Internet > VPN）会列出曾接受连接请求的应用；状态栏钥匙图标、快捷设置信息面板以及服务存活时的不可关闭通知，用来确认连接是否仍活动。always-on VPN 由系统拉起服务；若连接断开，Android 8.0 及以上会给出不可关闭通知。确认是 Clash Meta 在跑之后，再查“单应用例外”是列表问题、重建连接问题，还是应用自己绑定了其他网络。

## 按允许列表与拒绝列表排查

Android 允许创建允许列表或拒绝列表，不能两者同时使用。未创建任何列表时，全部应用流量进入 VPN。允许列表一旦包含一个或多个应用，则**只有列表内应用走 VPN**，其余应用使用系统网络，效果等同于 VPN 未对该应用运行。拒绝列表中的应用使用系统网络，其余应用走 VPN。因此，单个应用不走代理的典型原因是：当前采用允许列表且该包名不在其中；或采用拒绝列表且该包名在其中。

加入列表前必须确认应用已安装。官方做法是对包名调用 `PackageManager.getPackageInfo`，未安装会抛出 `NameNotFoundException`，该项不会进入 Builder。只记住桌面名称、填错包名，或在应用尚未安装时就写入列表，都会造成“看起来配置了、实际未接管”。列表必须在 `establish()` 前设置；更改列表必须建立新的 VPN 连接，只改内存中的名单、不重建接口，系统仍按旧接口的过滤结果转发。

## 排除应用主动绕过与拦截策略

若名单与重建都正确，仍要考虑旁路。`VpnService.Builder.allowBypass()` 在建立接口时决定应用能否绕过 VPN 并自行选择网络，该值在服务启动后不能更改。应用若在连接套接字前调用 `ConnectivityManager.bindProcessToNetwork()` 或 `Network.bindSocket()`，其流量不会走 VPN。未绑定特定网络的应用则继续经 VPN。当设置中打开“阻止不使用 VPN 的连接”时，系统会拦截所有不走 VPN 的流量；此时不在允许列表（或按拒绝列表语义应走 VPN 却未进入接口）的应用会失去网络，表现为完全无法上网，而不只是“不走代理”。二者表现不同，不要混为一谈。工作资料与个人资料可运行不同 VPN 应用，只在一个资料里修改名单不会影响另一个资料中的同一应用。

## 失败后的下一步

按顺序缩小范围：确认状态栏与 VPN 设置中当前服务仍是 Clash Meta；用包名确认该应用已安装；明确当前是允许列表、拒绝列表还是未建列表；在修改名单后重新建立连接。需要停启服务时，可向 `ExternalControlActivity` 发送 `com.github.metacubex.clash.meta.action.STOP_CLASH` 与 `START_CLASH`（或 `TOGGLE_CLASH`）。若怀疑应用绑定了其他网络，应在该应用侧取消对特定网络的绑定，而不是继续追加内核规则。`establish()` 返回空表示未准备或权限被撤销，须重新 `VpnService.prepare()` 并完成系统对话框。若 always-on 与“阻止非 VPN 连接”同时开启，先区分该应用是“走了系统网”还是“被系统切断”，再决定改列表还是调整拦截开关。隧道套接字本身应 `protect()`，以免客户端自环，但这不解释第三方应用不走代理的现象。

https://developer.android.com/develop/connectivity/vpn
https://github.com/MetaCubeX/ClashMetaForAndroid
