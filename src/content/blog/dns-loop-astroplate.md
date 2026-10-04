---
title: "Clash DNS 请求循环时会出现哪些排查线索"
description: "Clash DNS 请求循环时会出现哪些排查线索。了解适用条件、操作步骤与常见问题的排查方法。"
date: "2026-10-04"
updated: "2026-10-04"
category: "故障排查"
tags: ["故障排查"]
author: "编辑部"
draft: false
---

DNS 请求循环在手册中最接近的表述是鸡蛋问题：查询要走代理，而代理节点域名又依赖同一次 DNS。循环还可能来自上游指向自身监听，或 `default-nameserver` 不是 IP。排查应收集配置线索，而不是假定存在固定报错文案或界面提示。

## 适用条件

当 `enable` 为 true 且查询进入 `listen` 之后，若解析长时间无结果、同一查询反复指向需要再解析的主机名、或 DNS 连接又进入需要域名解析的出站，才按循环线索排查。`enable` 为 false 时走系统 DNS，不属于这条路径上的循环。手册明确三点：如需经过代理查询，应配置 `proxy-server-nameserver`；`respect-rules` 需配置 `proxy-server-nameserver`；`default-nameserver` 必须为 IP，用于解析 DNS 服务器的域名。不满足这三点时，应先把它们当作循环嫌疑，而不是先改 `fake-ip-filter`。

## 可从配置中直接读取的线索

线索一：`nameserver`、`fallback`、`nameserver-policy` 的值是域名形式的 DoH 或 DoT，但 default-nameserver 缺失、不是 IP、或同样是还需要解析的名字。手册允许 default 使用加密 DNS，但仍要求其为 IP。线索二：`respect-rules` 为 true，或上游使用 `#RULES`、`#proxy`，但 proxy-server-nameserver 为空，节点域名会回头走 nameserver-policy、nameserver 和 fallback，与正在等待代理的查询互相卡住。线索三：`prefer-h3` 与 respect-rules 同时出现，手册强烈不建议，DoH 连接方式与路由遵守会缠在一起。线索四：listen 的地址端口被写进 nameserver 列表，查询回到入口。线索五：`direct-nameserver` 为空时，direct 域名遵循 policy、nameserver 和 fallback；这些上游的连接若又依赖 direct 出站，会绕回。线索六：fallback-filter 使部分域名只走 fallback，若 fallback 与 nameserver 指向同一需要解析的主机，过滤不能切断循环。线索七：`use-hosts`、`use-system-hosts` 未覆盖这些服务器名，hosts 无法短路。线索八：`proxy-server-nameserver-policy` 仅当 proxy-server-nameserver 不为空时生效，空值时该政策不会单独提供出口。

## 判断是否像循环以及失败下一步

判断依据：路径上是否存在“解析上游名字，该解析又依赖同一组上游或依赖尚未解析的代理节点”。满足鸡蛋问题描述即可视为循环风险。`cache-algorithm` 的 lru 或 arc 只解释重复应答从何而来，不是环路成因。`fake-ip-ttl` 非必要请勿修改，也不能当作断环手段。下一步：把 default-nameserver 改成 IP；为经代理的查询补 proxy-server-nameserver；去掉指回 listen 的上游；拆开 respect-rules 与 prefer-h3。fallback-filter.geosite 已废弃，不要把它列成排查依据。若线索仍对不上，回到字段定义逐项核对，不添加手册未记载的外部步骤。

资料：https://wiki.metacubex.one/config/dns/
