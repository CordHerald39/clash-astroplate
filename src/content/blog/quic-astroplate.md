---
title: "Clash 同网站不同浏览器表现不同时怎么对照"
description: "Clash 同网站不同浏览器表现不同时怎么对照。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

同一网站在不同浏览器上表现不同，对照目标是找出「哪一条官方全局轴不一致」，而不是同时改模式、入站和出站。资料提供的对照轴包括运行模式、进程匹配、IPv6、fakeip 缓存、本机跳过认证的网段，以及 TCP 并发与 Keep Alive。一次只变动其中一个轴，其余必须与第一次观察时相同。

## 适用条件

适用于两款浏览器访问同一目标、结果不一致，且内核可输出日志、策略组选择可保存的场景。先确认两款浏览器都受同一 `mode` 约束：`rule` 走规则，`global` 取决于 GLOBAL 策略组当前选择，`direct` 则全部直连。若其中一款浏览器所在环境被改成 `direct`，对照已经无效。

若一个浏览器在本机、另一个在局域网设备上，还必须先对齐入站：`allow-lan`、`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips`。黑名单优先于白名单；默认允许 `0.0.0.0/0` 与 `::/0`。未对齐入站时，差异来自谁能连代理端口，不能写成浏览器差异。

## 对照步骤与判断依据

1. 固定 `mode`、`log-level`、`ipv6`、`interface-name`。日志建议用 `debug` 以便看到尽可能多的运行信息；不要用 `silent`。`ipv6` 默认 true，两款浏览器对照期间不可一只走 IPv6 接受开启、一只关闭。
2. 以 `find-process-mode` 作为第一条对照轴。`always` 强制匹配所有进程，适合需要按进程区分浏览器时；`strict` 为默认；`off` 不匹配，路由器场景资料推荐 off。判断依据：仅当该项为 `always`（或内核在 `strict` 下确实匹配）时，才能讨论「某浏览器进程是否命中规则」；为 `off` 时，进程名不能作为两款浏览器差异的解释。
3. 核对 `skip-auth-prefixes` 与 `authentication`。http(s)/socks/mixed 可启用用户验证。若一款浏览器走回环且命中跳过前缀（如 `127.0.0.1/8`），另一款走局域网 IP 且必须认证，表现不同是认证条件不同。
4. 核对 `profile.store-fake-ip`。开启时会储存 fakeip 映射表，域名再次连接使用原映射。一款浏览器若仍使用旧映射、另一款触发新解析，目标看起来相同，解析结果可能不同。对照期间不要开关该项，只记录它当前是 true 还是未开启。
5. `profile.store-selected` 为 true 时，API 对策略组的选择会保存到下次启动。对照前确认两款浏览器没有把流量打进不同策略选择。
6. 不要把 `tcp-concurrent` 或 Keep Alive 当作浏览器差异的第一解释。前者使用解析得到的全部 IP 做 TCP 连接，后者改空闲探测；它们可能放大差异，但应在进程匹配与认证对齐之后再单独开关一次观察。

可记录如下口径（数值以你当前文件为准，不要为对照编造新值）：

```yaml
mode: rule
log-level: debug
find-process-mode: strict
ipv6: true
profile:
  store-selected: true
  store-fake-ip: true
skip-auth-prefixes:
  - 127.0.0.1/8
  - ::1/128
```

判断依据：只有单一轴变化且日志级别足够观察时，才能把差异归到该轴；多轴同时变，结论无效。

## 失败时下一步

按进程匹配对照后仍无法解释：检查是否误改 `unified-delay`（开启时会算 RTT 以消除握手带来的节点延迟差异），或误改 GEO 数据模式与加载器。这些不区分浏览器。

下一步把 `find-process-mode` 恢复为对照开始时的值，仅把 `log-level` 留在 `debug`，核对外部控制 API 地址是否仍为预期监听（资料示例为 `127.0.0.1:9090`），避免看的是另一套选择。若必须在路由器上保持 `off`，放弃进程名对照，改为核对两款浏览器源 IP 是否同属 `lan-allowed-ips` 且都不在 `lan-disallowed-ips`。

https://wiki.metacubex.one/config/general/
