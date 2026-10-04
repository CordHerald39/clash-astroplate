---
title: "Clash 同一配置只在某个网络失效如何排查"
description: "Clash 同一配置只在某个网络失效如何排查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

同一份配置在一种网络可用、在另一种网络失效时，应先把全局配置里与接口、地址、协议栈和日志有关的项当作排查变量。官方文档中的出站接口、绑定地址、IPv6、TCP 并发、进程匹配和运行模式，都会让同一 YAML 在不同网段走出不同路径，不能直接理解为节点集体失效。

## 适用条件

适用于配置文件未改、仅网络环境变了就失败的情况。先确认 mode 仍是预期值：rule 规则匹配、global 全局代理、direct 全局直连。global 需要在 GLOBAL 策略组选择代理或策略。若 store-selected 为 true，上次在可用网络里选中的项会被储存，到失效网络仍沿用，排查时要先看该项是否开启。ipv6 默认 true；若失效网络没有 IPv6 路由，内核仍接受 IPv6 流量时，可能表现为部分连接失败，这是协议栈条件，不是配置文件损坏。

## 按顺序缩小范围的步骤

第一步，调整 log-level。silent 无输出；error 只留下发生错误至无法使用的日志；需要区分不影响运行的错误时用 warning；要看一般运行过程用 info；仍不够则用 debug。日志只在控制台和控制页面出现，应在失效网络当场保存。

第二步，核对 interface-name。出站接口写死后，目标网络若没有同名网卡，流量无法按配置离开主机。判断依据是：失效网络里该接口名不存在或未就绪，而可用网络里该名存在。此时应记录两套网络的接口名，而不是先改代理组。

第三步，核对 allow-lan、bind-address、lan-allowed-ips、lan-disallowed-ips。绑定单一地址时，新网段的本机 IP 变化会导致监听或允许范围不匹配。黑名单优先，当前网段若在 lan-disallowed-ips 中，就会表现为只有这个网络不行。

第四步，核对 tcp-concurrent。启用后会使用 DNS 解析出的所有 IP 地址进行连接，并使用第一个成功的连接。某网络 DNS 返回不可达地址时，并发与非并发的成败可以不同。应在失效网络分别记录该值为 true 与 false 时的日志，每次只改这一项。

第五步，核对 find-process-mode 是 always、strict 还是 off。进程匹配影响规则是否落到具体进程；off 推荐在路由器使用。电脑在一种网络走系统代理、另一种走不同入站时，同一规则集也会表现不同。

## 仍失败时的下一步

检查 unified-delay 是否开启。开启时会计算 RTT，以消除连接握手等带来的不同类型节点的延迟差异，避免把延迟对比当成连通性结论。Linux 检查 routing-mark。外部控制若监听所有 IP，或配置了 Unix socket、Windows namedpipe（后两者不验证 secret），确认没有其他客户端在失效网络里改 mode。若怀疑规则依赖地理数据，只记录 geodata-mode、geodata-loader、geo-auto-update 和 geo-update-interval，不要把未列入本题来源的下载地址写进结论。排查结果应指向具体字段与日志原文。

参考资料：https://wiki.metacubex.one/config/general/
