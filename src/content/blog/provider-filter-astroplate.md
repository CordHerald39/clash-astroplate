---
title: "Clash 节点被筛选掉了怎样检查匹配条件"
description: "Clash 节点被筛选掉了怎样检查匹配条件。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

节点从 Clash 代理集合里“消失”，并不自动等于下载失败。`filter`、`exclude-filter`、`exclude-type` 都会在集合内容解析之后改变哪些代理被保留。要检查匹配条件，必须把该节点的 `name`、`type` 放到这三个字段的规则下逐条对照，而不是只看健康检查是否超时。

## 适用条件

适用于集合文件或 `payload` 里仍能找到该节点，但最终未进入可用列表，或你怀疑它被关键词、正则、类型规则丢掉的情况。若 `http`/`file` 整份解析失败，文档允许改用 `payload` 备用；此时应先确认你检查的是备用条目还是未解析的远程文件，否则会把“解析失败”误判成“被筛选掉”。`health-check` 的 `timeout`、`expected-status`、`lazy` 只影响延迟测试是否执行及是否符合期望状态，不使用 `filter` 那套关键词语法。

## 按三个字段核对命中关系

先取出该节点完整 `name`。`filter` 只保留满足关键词或正则的节点；若配置了 `filter` 而名称不匹配，节点不会留下。文档示例为 `"(?i)港|hk|hongkong|hong kong"`：`(?i)` 表示大小写不敏感，未写该标志时，大小写不同可能直接失配。多个正则用反引号区分，要分别测试每一段，而不是把整串当成一个表达式。`exclude-filter` 语法相同，但作用是排除命中者：名称只要满足其中一段，就会被丢掉。因此“`filter` 已命中”仍可能被 `exclude-filter` 再删掉，两个字段要一起看。

再核对该节点配置里的 `type`。`exclude-type` 不支持正则，用 `|` 分割，并按配置文件中的 `type` 排除。例如写成 `ss|http` 时，类型字面量为 `ss` 或 `http` 的条目会被排除；把显示名里的协议简称写进去是无效的。判断依据：分别回答三个问题——`filter` 是否要求命中、是否命中；`exclude-filter` 是否命中；`exclude-type` 是否包含该 `type`。任一“应排除”或“未满足保留条件”成立，即可解释该节点被筛选掉。

## 名称覆写导致的假失配

若同时配置了 `override.additional-prefix`、`additional-suffix`、`override.proxy-name` 或会改 `.name` 的 `override-expr`，你用来对照的字符串可能已不是下载文件里的原名。文档未规定筛选与覆写的先后，因此要用原名和覆写后的名称各测一遍。`proxy-name` 示例把 `IPLC-(.*?)倍` 换成 `iplc x $1`，旧关键词若只认“倍”，在替换后的名称上会失效。

## 失败时的下一步

三个字段都解释不了时，回到集合来源：确认 `path` 仍在 HomeDir（或已设 `SAFE_PATHS`），`http` 更新是否成功，解析失败是否已落到 `payload`。若名称近期被远程改掉，按新 `name` 重写关键词或正则，而不是反复加长无关的 `exclude-type`。需要区分“被筛选”和“测不通”时，查看的是 `filter` 一类字段，而不是只看 `health-check.url`。

https://wiki.metacubex.one/config/proxy-providers/
