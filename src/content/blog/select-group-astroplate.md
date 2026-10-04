---
title: "Clash 选了节点却没有影响请求怎么查"
description: "Clash 选了节点却没有影响请求怎么查。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

在 select 策略组里选定某一项之后，请求会不会改走该节点，取决于这个组是否真的处于转发路径上，以及组内字段是否仍把该节点留在有效成员里。界面或 API 上的「已选择」只说明该组的当前项，不能单独证明请求已经进入这个组。下面只根据代理组配置字段排查「选了节点却没有影响请求」。

## 适用条件：先确认选中发生在哪个组

proxy-groups 的 name 是必须字段，其他组通过这个名字引用它。如果当前操作的是 hidden 为 true 的组，官方说明只是在 api 返回 hidden 状态以隐藏展示，并不等于该组被绕过，也不等于请求已经进入它。判断依据：真正改写转发的是请求最终进入的那个组的当前选择，而不是任意一个未出现在路径上的组。

若该组写在另一个组的 proxies 中，外层组的 type 与当前选择决定会不会进入内层。只改内层 select、外层并未选中该内层时，请求不会变化。include-all、include-all-proxies、include-all-providers 引入时都不包含策略组，因此不能指望打开这些开关就会自动把某个手动组串进路径。name 含特殊符号时应当使用引号包裹，引用侧与定义侧不一致时，表现为「改了 A 组、流量仍在 B 组」。

## 核对该节点是否仍在有效成员里

成员来源是 proxies、use，以及三类 include-all 开关。filter 只作用于引入代理集合以及引入所有出站代理；exclude-filter 同样。exclude-type 仅排除引入出站代理，用 | 分割类型名，无视大小写，不支持正则。节点被 filter 漏掉，或被 exclude-filter、exclude-type 去掉之后，即使名称仍出现在别处，该 select 里也不存在这一项，选择不会作用到真实出站。

default-selected 只在默认情况下生效：为空或节点名不存在时，默认选择组中第一个节点。已经完成选择后，不应再用 default-selected 解释当前转发。empty-fallback 在组为空时回退到指定 proxy，不能填代理组，默认为 COMPATIBLE。此时看起来选了组，实际出站名与名单无关，属于「选择未作用到请求」的一种静默偏离。

## UDP、弃用字段、健康检查造成的错觉和失败下一步

disable-udp 为 true 时该策略组禁用 UDP。UDP 请求不能按对 TCP 的选择去理解，这是「选了节点但某一类请求完全不变」时要首先核对的字段。健康检查相关的 url、interval、lazy、timeout、max-failed-times、expected-status 用于可用性探测：lazy 默认为 true，未选择到当前策略组时不进行测试；url 只检查 proxies 里的代理，不检查 use 引入的集合。探测未执行或失败，不等于自动改写 select 的选择，也不能单独解释「选了却没生效」。expected-status 会让「可用」判定变严，可能只影响依赖健康状态的展示。

代理组上的 interface-name 与 routing-mark 已弃用，应在代理节点上指定；优先级为代理节点大于代理策略大于全局。若以为在组上改接口或路由标记就能让选中节点换出口，请求可以完全不变。hidden 与 icon 只服务 api 展示，排除它们后再查引用关系。

失败时下一步：写出请求进入的组 name，确认 type、当前选择、是否嵌套在另一组的 proxies 中；核对 proxies、use、include-all 系列与三条筛选是否仍包含该节点；组空则看 empty-fallback 是否为 proxy 名；UDP 看 disable-udp；出站网卡与标记看节点而非组。仍无变化时，说明当前选择所在组根本不在转发路径上，应改查是哪一个 name 真正被作为出口引用。

https://wiki.metacubex.one/config/proxy-groups/
