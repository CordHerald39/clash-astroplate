---
title: "Clash TUN 开启后局域网访问异常怎么排查"
description: "Clash TUN 开启后局域网访问异常怎么排查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

Clash TUN 开启后出现局域网访问异常，常见原因是自动路由把局域网网段一并导入 tun，或接口、MAC、重定向规则把本应直连的流量捕获。排查须严格按官方对 auto-route、排除网段、接口限制和平台差异的说明进行，不引入文档未记载的菜单或效果承诺。

## 适用条件

异常排查的前提是 tun.enable 与 auto-route 均为 true，因为只有此时才会自动设置全局路由。route-exclude-address 用于在 auto-route 启用时排除自定义网段，文档示例包含 192.168.0.0/16 与 fc00::/7。include-interface 与 exclude-interface 互相冲突，用于限制或排除被路由的接口。Linux 下 include-mac-address、exclude-mac-address 可按来源 MAC 限制局域网设备，且需要 auto-route 和 auto-redirect。auto-redirect 仅 Linux，用于 iptables/nftables 重定向 TCP，文档称在路由器上带 auto-route 时可按预期工作。Android 的 auto-redirect 仅转发本地 IPv4，要通过热点或中继共享需使用 VPNHotspot。Windows 与 macOS 无法自动劫持发往局域网的 DNS 请求。strict-route 启用时会进一步改变到达性。不满足上述平台和依赖时，对应排除或限制字段不会生效。

## 具体排查步骤

先核对 tun 段是否启用 auto-route，以及 route-exclude-address 是否覆盖当前局域网 CIDR。若列表为空或网段不匹配，局域网流量可能被导入 tun。接着检查 include-interface、exclude-interface 是否把局域网口错误包含或排除。Linux 再查 include-mac-address 与 exclude-mac-address 是否把局域网设备排除错误，以及 auto-redirect 是否已启用。查看 strict-route 是否为 true：Linux 下它会将所有连接路由到 tun 并让不支持网络无法到达。Android 确认是否因未使用 VPNHotspot 导致共享异常，以及私人 DNS 是否开启。多网卡时看 auto-detect-interface 是否选错出口。最后看 route-address 是否只列出了公网段，导致局域网行为与预期相反。旧的 inet4-route-exclude-address 等可作对照，但应以新字段为准。

## 判断依据

文档写明 auto-route 会自动将全局流量路由进入 tun 网卡。因此，若 route-exclude-address 未包含实际局域网网段，局域网访问被导向 tun 即符合该描述，可视为异常来源。反之，已正确排除的网段应绕过。include-mac-address 仅让列出的 MAC 被路由，exclude-mac-address 则让匹配设备绕过。strict-route 在 Linux 的“所有连接路由到 tun”会放大局域网被捕获的范围。dns-hijack 在 Windows/macOS 对局域网 DNS 无效，可能表现为解析异常而非连通性本身。route-address-set 或 route-exclude-address-set 在 nftables 下会在防火墙层决定绕过或捕获，且与 routing-mark 冲突。用当前局域网 CIDR、接口名、MAC 与这些字段逐项对照，即可判断是未排除、误包含还是平台限制。

## 失败时下一步

在 route-exclude-address 中补上实际使用的局域网网段后重新加载。检查 include-interface 与 exclude-interface 是否同时出现或把局域网接口配错。Linux 核对 nftables 规则是否因 address-set 导致绕过失败，并确认未与 routing-mark 一起使用。尝试将 strict-route 设为 false 对比。Android 按文档使用 VPNHotspot 处理热点共享，并关闭私人 DNS 观察劫持。防火墙方面，Linux 一般无需配置，遇拦截可放行 TUN 网卡出站；Windows 需允许内核。确认 device 名称正确后，可临时关闭 auto-route 对比系统原路由下的局域网访问，再逐项恢复字段。

https://wiki.metacubex.one/config/inbound/tun/
