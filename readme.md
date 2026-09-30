本轮采用 Frontend Design：搜索与问题分类主导，输入匹配文章标题摘要，类别筛选组合生效，零结果提供清空入口；无 JavaScript 时文章仍完整可读。仅本地4202，无推送。

# Clash 自主设计站 · 蓝色软件帮助台

2026-09-30 本地重设计。保持 Astro 静态站架构，界面与 CSS 自主实现，活跃页面不再依赖上游 Tailwind、CustomStyles、main.css 或模板组件。原许可证作为来源记录保留。

本轮仅本地修改，未推送、未部署。工作流文件保留但没有触发。修改前源代码压缩备份在工作区 `私密维护教程/redesign-backups/`。

## 运行

Node 24，pnpm 11.19.0。

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm run preview
```

预览 http://127.0.0.1:4202/ ，默认根路径、noindex。构建后自动检查16个HTML的H1、描述、站内链接与锚点。

## 编辑

- `src/pages/index.astro`：自主首页结构。
- `src/styles/guide.css`：完整响应式视觉与内页样式。
- `src/layouts/GuideLayout.astro`：共用头尾、SEO。
- `src/content/blog/`：6篇独立Markdown文章。
- `src/content/pages/`：下载、手机、电脑、教程、来源、关于与隐私。

文章信息使用title、description、date、updated、category、tags、author、draft。正文从二级标题开始。文章修改会自动更新列表、RSS及sitemap；草稿不公开。

## JSON导入接口

```sh
node scripts/import-content.mjs article.json
pnpm run build
```

统一字段为id、slug、title、description、publishedAt、updatedAt、category、tags、body、sources（title/url）、status（published或draft）。非法路径、日期与字段先校验，失败不覆盖既有文章。

## 将来发布时

现有GitHub Pages工作流保持原样。本轮没有修改线上站点。SITE_URL和BASE_PATH仅在明确发布时设置；本地不要继承正式环境变量。Markdown内链是相对路径，正式构建仍支持仓库子路径。不会自动绑定域名。
