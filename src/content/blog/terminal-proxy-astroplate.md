---
title: "Clash 电脑端：终端可用而浏览器不可用怎样定位差异"
description: "Clash 电脑端：终端可用而浏览器不可用怎样定位差异。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

## 适用条件：两条客户端路径并不自动相同

终端里某条命令可以完成请求、同一台电脑上的浏览器却失败时，不要先假设内核已经停止。全局配置里，http(s)、socks、mixed 才是入站；终端进程与浏览器进程只要源地址、认证或所填端口用途不同，就会一个成功一个失败。适用本篇的条件是：内核仍在运行，mode 不是明显的 direct，终端已经能够访问，而浏览器扩展或浏览器代理设置失败。需要先排除把外部控制地址当成浏览器代理，以及把策略组名称填进扩展。unified-delay、tcp-concurrent 等项不解释这种“一侧可用一侧不可用”的差异。

## 用全局字段定位差异

第一项，端口用途。浏览器应填写与 http(s)/socks/mixed 对应的入站，而不是 API。external-controller 文档示例为 127.0.0.1:9090，还可启用 Unix socket、Windows namedpipe、TLS API；这些路径使用 secret，socket 与 namedpipe 甚至不验证 secret，它们不能说明“终端可用”。第二项，源地址与 allow-lan。终端若走 127.0.0.1，浏览器扩展却填了局域网地址，则 allow-lan 为 false 时后者会被拒绝；bind-address 若只绑定某一 IPv4 或 IPv6，浏览器填了另一地址也会失败。第三项，authentication 与 skip-auth-prefixes。入站可设置多组 user:pass，并允许 127.0.0.1/8 与 ::1/128 跳过验证。终端走回环且免密成功，不等于浏览器从其他网卡或不带密码时也能成功。第四项，lan-allowed-ips 与 lan-disallowed-ips。黑名单优先。浏览器所在地址若写入禁止段，会出现本机终端正常、浏览器被拒。第五项，ipv6 默认为 true；设为 false 后，浏览器若仍使用 IPv6 主机，会与使用 IPv4 的终端不一致。第六项，find-process-mode 为 always、strict 或 off，改变的是规则中的进程匹配，不是给浏览器注入代理。

判断差异归属的依据是：失败一侧是否曾经连到当前 bind-address，以及失败点落在认证、网段还是根本未入站。不要用终端成功来证明浏览器填写的主机仍然有效。

## 用日志收窄，避免同时改很多项

把 log-level 调到 debug 或 info，分别在终端成功与浏览器失败的时间点对照控制台。浏览器侧若出现认证失败，应改扩展账号，或确认源地址是否属于 skip-auth-prefixes 覆盖范围，而不是改 mode。若没有任何入站记录，说明浏览器没连到当前绑定，应清理扩展中的旧主机，而不是去改缓存或 GEO 相关项。mode 为 global 时确认 GLOBAL 组已选节点；为 rule 时更应怀疑浏览器未进入入站。profile 的 store-selected 与 store-fake-ip 只涉及策略选择和 fakeip 映射，不能当作浏览器开关。若日志显示连接被局域网策略拒绝，核对 lan-disallowed-ips。确认差异属于“浏览器未使用当前入站”之后，只改扩展侧主机与认证，保持终端环境不动，以便判断依据保持单一。keep-alive-interval、keep-alive-idle、disable-keep-alive 用于 TCP Keep Alive，与“只有浏览器失败”无对应关系，失败时不要把它们当作下一步。

https://wiki.metacubex.one/config/general/
