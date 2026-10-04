---
title: "Clash 电脑端：进程规则不命中时如何核对进程信息"
description: "Clash 电脑端：进程规则不命中时如何核对进程信息。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

## 适用条件：什么叫进程规则不命中

当 `PROCESS-PATH`、`PROCESS-NAME` 及其通配、正则形式没有把请求送到预期策略时，应核对当时用于比较的进程信息与 payload 是否为同一对象。适用条件是：配置里确实存在上述进程类规则，且该行位于 `MATCH` 之前。规则按从上到下顺序匹配，顶部优先级更高。若更早的 `DOMAIN`、`GEOSITE`、`IP-CIDR` 或 `RULE-SET` 已经命中，后面的进程规则看不到这次请求，这不属于进程信息写错。

官方定义：`PROCESS-PATH` 使用完整进程路径匹配；`PROCESS-NAME` 使用进程匹配。两者不是同一核对项。把短进程名拿去和完整路径规则比较，或把完整路径拿去和进程名规则比较，都会表现为不命中。电脑端核对进程名时，对照的是 `curl`、`chrome.exe` 这类进程名；`PROCESS-NAME` 在 Android 平台可以匹配包名，不能把 `com.termux` 当作电脑端核对标准。

## 按规则类型逐项核对进程信息

先确定该行类型。若是 `PROCESS-PATH`，把实际发起请求的可执行文件完整路径与 payload 逐字对照，包括目录、文件名和扩展名。官方 Unix 示例为 `/usr/bin/wget`，Windows 示例为 `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`。少写目录、少写 `.exe`、斜杠方向不一致、未按示例写成 `\\`，都应视为路径信息不一致。

若是 `PROCESS-NAME`，只对照进程名，不要把目录加进去。若是 `PROCESS-PATH-WILDCARD` 或 `PROCESS-NAME-WILDCARD`，只按 `*`（零个或多个字符）和 `?`（一个字符）理解，且与配置文件其他地方的 Clash 格式通配符不相同。若是 `PROCESS-PATH-REGEX` 或 `PROCESS-NAME-REGEX`，按正则核对；官方出现过 `.*bin/wget`、`curl$`、`(?i)Telegram`、`(?i).*Application\\\\chrome.*`。未写 `(?i)` 时，不要假定大小写一定被忽略。

然后确认是否轮到该行：从列表顶部找出第一条命中规则。逻辑规则 `AND` / `OR` / `NOT` 以及 `SUB-RULE` 需要注意括号，进程条件可能被其它 payload 一起限制。若请求为 UDP 且节点没有 UDP 支持，官方说明会继续向下匹配，看起来也会像进程规则未命中。进程规则与目标 IP 规则的 `no-resolve`、`src` 无关，不要用有没有解析 IP 来解释进程不命中。

## 判断依据与失败时下一步

判断依据：能指出用于比较的是完整路径还是进程名；能指出该字符串与 payload 是否逐字一致，或是否符合所写的通配、正则；能指出从顶部起第一条命中的规则类型。

失败时下一步：若第一条命中的不是进程规则，先处理更早规则的顺序，而不是改进程字符串。若类型用错，把 `PROCESS-NAME` 与 `PROCESS-PATH` 换成与实际信息一致的那种。路径不一致时，只改路径文本，不要改成域名。名称不一致时，按实际进程名重写，而不是补上目录。通配不命中时，检查是否误用了其它位置的 Clash 通配符习惯。正则不命中时，对照是否需要 `$`、`.*` 或 `(?i)`。确认进程信息已一致仍不命中时，检查 `MATCH` 是否提前。不要在未分清路径与进程名之前改用更宽的 `*`。

https://wiki.metacubex.one/config/rules/
