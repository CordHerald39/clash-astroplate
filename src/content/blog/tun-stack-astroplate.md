---
title: "Clash 更换 TUN 栈后异常怎样逐项比较"
description: "Clash 更换 TUN 栈后异常怎样逐项比较。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

更换 Clash（mihomo）TUN 的 `stack` 后出现异常，应按官方入站说明做逐项比较：先确认改动是否只落在协议栈，再按文档列出的栈差异、防火墙限制和「仅某系统或某栈生效」的字段，一项一项排除。不要把路由、DNS、网卡名和栈名混在同一次修改里对照。

## 先比较栈值本身以及 TCP/UDP 实现是否被一起换掉

可用值仍是 `system`、`gvisor`、`mixed`、`mips`。比较时要写出更换前后的具体值，并对照文档职责：`system` 走系统协议栈；`gvisor` 走用户空间协议栈；`mixed` 是 TCP 使用 system、UDP 使用 gvisor；`mips` 为自研 IP 协议栈。若从单一栈改到 `mixed`，等于 TCP 与 UDP 的实现被拆开，异常可能只出现在其中一类流量。

判断依据：能复现的问题是否与「全部流量」还是「仅 TCP 或仅 UDP」一致。若只在 UDP 相关场景异常，而当前栈是 `mixed`，应优先把它与纯 `system` 或纯 `gvisor` 比较，而不是先改 `mtu` 或路由表。文档对 `mixed` 的表述是使用体验可能相对更好，这是描述而非保证；比较时只记录行为是否变化。

## 再比较防火墙是否挡住了 system 与 mixed

资料写明打开防火墙时无法使用 `system` 和 `mixed`。因此，从 `mips` 或 `gvisor` 换成这两项之后立刻失败，应把防火墙状态列为第二比较项。Windows 放行路径为设置 → Windows 安全中心 → 允许应用通过防火墙 → 选中内核。MacOS 一般无需配置；若开启防火墙无法使用，可尝试系统设置 → 网络 → 防火墙 → 选项 → 添加 mihomo app。Linux 一般无需配置；必要时放行 TUN 网卡出站（示例）：`sudo iptables -A OUTPUT -o Mihomo -j ACCEPT`。

判断依据：同一份配置在关闭防火墙或完成放行后，`system`/`mixed` 是否仍失败。若放行后恢复，问题在过滤规则而不在栈名拼写。页面中的协议栈网络回环测试注明仅供参考，且 linux 与 Windows、MacOS 可能有差异，跨系统比较时不能把一张回环图当作故障结论。

## 最后比较「换栈后其实不会跟着生效」的字段

`congestion-controller` 仅在 mips 协议栈时生效。从 `mips` 换成其他栈后，即使该字段仍写在配置里，也不应再把它当作故障原因或修复手段。`gso` 仅 Linux；`auto-redirect` 仅 Linux 且需要 `auto-route` 已启用。MacOS 上 `device` 只能是 utun 开头。`strict-route` 在 Windows 上会添加防火墙规则以阻止普通多宿主 DNS 解析造成的泄露，并写明可能使某些应用程序（如 VirtualBox）在某些情况下无法正常工作。`dns-hijack` 在 MacOS/Windows 无法自动劫持发往局域网的请求，Android 开启私人 DNS 也无法自动劫持。

操作顺序：记录更换前后的 `stack` → 标明本机系统与防火墙 → 列出本次未改但受栈或系统约束的字段 → 每次只恢复或核对其中一类。失败时下一步：先处理 `system`/`mixed` 与防火墙的组合；再确认拥塞控制、GSO、自动重定向是否被用在不适用的栈或系统；仍异常则单独核对 `auto-route`、`strict-route`、`dns-hijack`、`device`，避免继续叠加改栈。

资料：https://wiki.metacubex.one/config/inbound/tun/
