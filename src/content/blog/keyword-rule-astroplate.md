---
title: "Clash 关键词规则误命中其他网站怎么定位"
description: "Clash 关键词规则误命中其他网站怎么定位。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

## 适用条件与定位目标

当某条 `DOMAIN-KEYWORD` 把不在意图内的网站送进了同一出站时，应先定位“是哪一行、凭什么命中”，而不是直接删掉整段 `rules`。官方定义该规则为域名关键字匹配，并且规则按从上到下的顺序匹配，顶部优先。适用条件是：异常站点的域名已知，配置里存在一条或多条 `DOMAIN-KEYWORD`，且 IPv4/IPv6、端口类规则不是当前怀疑对象。

定位目标有三层：确认域名字符串是否包含该关键字；确认没有被更靠上的规则截走；确认不是 `DOMAIN-SUFFIX`、`DOMAIN-WILDCARD`、`DOMAIN-REGEX`、`GEOSITE` 或逻辑规则造成的同结果。官方不提供图形化命中面板，结论只能来自规则文本与匹配定义。

## 按规则类型与优先级逐层核对

第一层，取出异常域名的完整主机名，与每条 `DOMAIN-KEYWORD` 的关键字做子串对照。判断依据：主机名中出现该关键字，即满足关键字匹配条件。文档在后缀规则中明确：`google.com` 不匹配 `content-google.com`；但若关键字是 `google`，`content-google.com` 仍含该子串，应优先把这类“后缀不命中、关键字命中”的名字标成误命中候选。

第二层，看该行在列表中的位置。顶部规则优先级更高。判断依据：若误命中域名在更上方已被 `DOMAIN`、`DOMAIN-SUFFIX` 或另一条关键字命中，真正生效的是上方那一行，当前关键字可能只是“看起来像”。反之，若关键字写在后缀规则之上，则会先于 `DOMAIN-SUFFIX,google.com` 抢走 `content-google.com` 以及所有含子串的名字。必须把该行以上的全部域名类规则列入对照，不能只看关键字本身。

第三层，排除其他域名规则的同结果。`DOMAIN` 只匹配完整域名，示例为 `ad.com`。`DOMAIN-WILDCARD` 仅支持 `*` 与 `?`，示例 `*.google.com`；这里的通配符与配置其他地方的 Clash 格式通配符不同。`DOMAIN-REGEX` 按正则匹配，示例 `^abc.*com`。`GEOSITE` 匹配 Geosite 内的域名。判断依据：若异常域名并不包含关键字，却仍走了同一出站，应改为检查通配符、正则、Geosite 或 `RULE-SET`，而不是继续扩写关键字。

第四层，检查逻辑规则与兜底。`AND`、`OR`、`NOT` 的写法是 `LOGIC_TYPE,((payload1),(payload2)),Proxy`，payload 为规则类型加其他 payload，官方强调注意括号。例如 `NOT,((DOMAIN,baidu.com)),PROXY` 会对“不是该完整域名”的请求生效，范围远大于一条关键字。`SUB-RULE` 同样需要注意括号。`MATCH` 匹配所有请求、无需条件。判断依据：误命中若发生在逻辑规则或 `MATCH` 上，应停止把责任归给 `DOMAIN-KEYWORD`。

## 判定已定位成功与失败时下一步

已定位的判断依据是：能指出具体行号或规则原文、该域名满足该行的匹配定义、并且上方没有更高优先级的域名规则先命中。三者缺一，只能称为怀疑，不能称为定位完成。

若域名并不包含关键字，下一步转向同列表中的 `DOMAIN-REGEX`、`DOMAIN-WILDCARD`、`GEOSITE`、`RULE-SET`。若包含关键字但业务上不能接受，下一步是把该域名用更高优先级的 `DOMAIN` 或 `DOMAIN-SUFFIX` 写在关键字之前，而不是在列表底部重复一条相反规则——底部优先级更低，无法覆盖顶部已命中的结果。若规则写在 `OR` 中，下一步先拆开括号内每条 payload 单独判断。仍无法对应到任一行时，检查是否实际加载了另一份 `rules`，避免对未生效文本做定位。

https://wiki.metacubex.one/config/rules/
