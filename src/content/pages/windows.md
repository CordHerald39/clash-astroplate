---
title: "Clash 电脑版下载与 Windows 配置"
description: "找到 Windows 客户端原始下载入口，区分 x64 与 ARM64，完成系统代理与连接检查。"
date: "2026-09-30"
updated: "2026-09-30"
category: "下载与教程"
tags: ["Clash", "下载与教程"]
author: "Clash 下载导航编辑部"
draft: false
---

你可以先浏览本页目录，按正在使用的设备或遇到的问题进入对应步骤。

## 选择桌面客户端

[Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev/releases)和[FlClash](https://github.com/chen08209/FlClash/releases)提供 Windows 发行包。Clash for Windows 是不同的历史客户端名称，不应将所有桌面项目当作其连续升级版。

## 确认系统类型

Windows 的设备信息会列出“系统类型”，它比电脑品牌更适合作为选包依据。Intel 和 AMD 的常见 64 位系统通常选 x64；Windows on ARM 则检查 ARM64 资产。不要只见到 EXE 扩展名就认为需要安装，开发者可能将主程序直接以此格式发布。

## 导入与开启代理

导入订阅，更新并激活配置，然后选择模式与节点。先用系统代理测试浏览器；需要接管其他程序时再按照文档配置 TUN。全局模式与流量接管范围是两回事。

## 验证与退出

查看连接记录中的目标域名和命中规则，比较一个目标网页与日常直连页面。退出后确认 Windows 没有遗留不可用的本地代理设置。

详细说明：[Windows 设置](../blog/windows-setup/)、[订阅导入](../blog/subscription-import/)。
