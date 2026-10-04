---
title: "Clash 面板提示未授权时怎样核对密钥"
description: "Clash 面板提示未授权时怎样核对密钥。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

Clash 外部用户界面或其它调用方提示未授权时，应回到全局配置核对该请求是否命中 RESTful API 的 `secret`，以及当前走的是不是「根本不校验 secret」的入口。未授权首先是鉴权材料与监听入口不匹配，不是把代理端口密码或订阅口令拿来对拍。

## 适用的判断前提

本核对适用于已经配置 `external-controller`（文档示例 `127.0.0.1:9090`）并由外部界面访问 `API 地址/ui` 或直接调用 API 的场景。官方将 API 访问密钥定义为 `secret`。浏览器场景还会受 `external-controller-cors` 影响，但 CORS 处理的是跨域标头，与密钥是否一致不是同一类失败。若请求实际打到 Unix socket、Windows named pipe，或打到在 RESTful API 端口上开启的 DOH 路径，文档写明这些访问不会验证 `secret`：这里出现的「像未授权」往往是连错通道，或把「不校验」理解成「必须带旧密钥」。

使用 HTTPS-API 时，监听在 `external-controller-tls`，且文档要求使用 TLS 也必须填写 `external-controller`。证书、私钥在 `tls` 段。证书问题通常表现为无法建立 TLS，而不是密钥字符串比对失败；两者要先分开。

## 按字段核对密钥的步骤

第一步，在配置里定位 `secret` 的原文，包括空字符串。文档给出的写法是 `secret : ""`，空密钥表示未设置访问密钥。面板或客户端填入的值必须与这一字符串一致，多空格、少引号、用了另一套账号都不算匹配。

第二步，确认请求打到的主机与端口就是 `external-controller`（或对应的 `external-controller-tls`）。文档允许把 `127.0.0.1` 改成 `0.0.0.0` 监听所有 IP。从其它设备访问时，若内核仍只绑回环地址，表现可能是连不上而不是密钥错误；只有已经打到 API 端口、却被拒绝时，才优先比对 `secret`。

第三步，看调用入口：普通 HTTP API 应携带与 `secret` 一致的访问密钥；`external-controller-unix`、`external-controller-pipe`、`external-doh-server` 按文档不验证 secret。若面板被指到套接字或 DOH 路径，却按「密钥错误」反复修改 `secret`，无法按官方逻辑收敛。

第四步，排除把 `authentication` 列表里的 `user:pass` 当成 API 密钥。该段只用于 http(s) / socks / mixed 代理的用户验证，`skip-auth-prefixes` 也只作用于代理验证跳过。用代理账号填面板密钥，会稳定表现为 API 侧不认可。

## 用来判定「已核对正确」的依据

同时满足下列条件，才说明密钥侧已核对完：配置中的 `secret` 与调用方保存的密钥完全一致（或双方都明确为空）；访问的是 `external-controller` / `external-controller-tls` 声明的地址端口；未把 unix、pipe、DOH 的「不验证 secret」误当成鉴权失败；未混用 `authentication`。CORS 仅当浏览器跨域访问时再核对 `allow-origins` 与 `allow-private-network`，它不能代替密钥比对。

界面路径方面，`external-ui` 只把静态资源挂到 `API 地址/ui`，`external-ui-name`、`external-ui-url` 影响目录与下载来源。界面能打开但 API 写操作被拒，仍应回到 `secret`，而不是改 UI 路径。

## 仍提示未授权时的下一步

先重新抄录 `secret` 与监听地址，避免看错端口。若仅 TLS 端口可连，确认证书、私钥路径可用；路径不在工作目录时按文档设置 `SAFE_PATHS`（Windows 分号，其他系统冒号）。自 v1.19.18 起，证书类本地文件支持自动重载，但不要把证书重载理解成密钥已同步。unix/pipe 已开启则先改用文档所述的 HTTP/HTTPS API 再测密钥。CORS 过严只处理浏览器跨域，不能当密钥修复手段。代理端口认证、局域网名单与 API 未授权无关，应移出本次排查。仍无法对应时，以官方「外部控制 (API)」对 `secret` 与各监听项的说明为准。

https://wiki.metacubex.one/config/general/
