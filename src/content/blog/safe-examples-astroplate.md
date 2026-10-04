---
title: "Clash 复制网上示例无法运行怎样核对占位符"
description: "Clash 复制网上示例无法运行怎样核对占位符。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

从网上复制的 Clash 示例无法运行，常见原因不是“缺了未写明的开关”，而是示例里的占位符仍按说明性数据留着，或 YAML 文本在复制后已经不是可加载的流。YAML 规范把加载失败首先指向形态不合法的输入；手册则规定了全局项和代理集合的必填关系。适用条件：你手头有一份复制来的配置，内核拒绝启动或代理集合无法更新，且你能对照原文逐项查看。

## 先确认文本还是不是合法 YAML

YAML 用缩进表示层次，用冒号加空格写映射，用 `#` 写注释。复制时若把缩进变成制表符与空格混用、把成对引号弄丢、或把注释符复制进键名，解析会在构造数据之前失败。判断依据：文件应能被看成映射和列表，而不是一堆断开的行。具体操作：从文件头开始检查每个键是否对齐到同一层、列表项是否以 `- ` 开头、含冒号或特殊字符的标量是否加了引号。官方示例里的 `authentication`、`secret`、`url`、`password` 都是普通标量，复制后不应多出未闭合引号。

若这一步就失败，下一步是只修复形态，不要同时改节点内容。形态通过后，再进入占位符核对；否则你会分不清是语法问题还是示例值问题。

## 按类型核对哪些占位必须换成你自己的值

代理集合的 `name` 必须且不能重复；`type` 必须，可选 `http` / `file` / `inline`。`type` 为 `http` 时需要配置 `url`。文档示例使用 `http://test.com`，这是说明性地址，不是可更新的集合。`path` 可选，但不填写时会用 `url` 的 MD5 作为文件名，且路径被限制在 HomeDir（由启动参数 `-d` 配置）中，其他位置需要 `SAFE_PATHS`。`payload` 仅在 `type` 为 `inline` 时作为内容生效；当 `http` 或 `file` 解析失败时，也可以把 `payload` 当作备用代理，但它不是远程订阅本身。

全局段同样有占位。`authentication` 示例为 `user1:pass1`；`secret` 示例为空字符串；这些都不能让你连上别人的环境。判断依据：若键的值从字面即可看出是单词 `password`、`server`、`user1:pass1`、`http://test.com` 或空 `secret`，应视为尚未替换的占位，而不是“复制后即可用”。订阅类查询若出现在示例中，只能把 `token=示例` 这类片段当作提示，不能指望它对应真实集合。

```yaml
proxy-providers:
  provider1:
    type: http
    url: "http://test.com"  # 占位：http 类型必须换成你可访问的 url
    interval: 3600
```

## 用内核日志判断还剩哪一类占位

把 `log-level` 设为 `warning` 或 `error`，在控制台或控制页面阅读输出（文档写明日志只在这两处出现）。判断依据：若报错指向集合下载或路径，先核对 `type`、`url`、`path`、`SAFE_PATHS`；若指向验证，先核对 `authentication` 是否仍是示例用户；若指向外部控制，先核对 `secret` 是否仍为空或与客户端不一致。`header` 里的 `Authorization: token 1231231` 也是说明串，复制后不会通过真实校验。`age-secret-key` 只有在文件确实按文档所述 age armor 加密时才有意义，示例密钥格式不能解开你没有的密文。

失败时下一步：先让 YAML 可加载；再按 `type` 决定要填 `url`、本地 `path` 还是 `payload`；把所有说明性口令、空 `secret`、示例 `url` 换成你自己持有的值；仍失败则升高到 `debug` 只抓这一次更新窗口，对照字段名而不是整段重贴另一份网文。健康检查可改用文档推荐的 `https://www.gstatic.com/generate_204` 或 `https://cp.cloudflare.com`，不要把占位探测地址当成故障原因。

资料：https://yaml.org/spec/1.2.2/  
https://wiki.metacubex.one/config/general/  
https://wiki.metacubex.one/config/proxy-providers/
