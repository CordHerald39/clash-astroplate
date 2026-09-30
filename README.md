# Clash Astroplate 中文指南

来自 zeon-studio/astroplate 的真实源码改造，原 MIT 许可证保留。公开演示页已移除，加入 Clash 官网入口、下载、手机版、电脑版、教程和博客。下载直达开发者 Releases。

## 本地运行

Node 24，pnpm 11.19.0。

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm run preview
```

地址 http://127.0.0.1:4192 。未设置 SITE_URL 时 noindex。内容独立保存在 src/content/blog 和 src/content/pages，正文从二级标题开始。frontmatter: title、description、date、updated、category、tags、author、draft。实质修改才更新日期。

## 统一文章导入

```sh
node scripts/import-content.mjs article.json
pnpm run build
```

JSON 字段为 id、slug、title、description、publishedAt、updatedAt、category、tags 数组、body Markdown、sources 数组（title/url）、status（published 或 draft）。先完整验证，再原子写入；非法 slug、日期、来源或状态不会覆盖旧文。draft 不发布。新增文章自动进入博客、首页精选、RSS和sitemap。

## GitHub Pages

仓库 Settings → Pages → Source 选 GitHub Actions。唯一工作流 pages.yml 使用 configure-pages、upload-pages-artifact、deploy-pages，发布到 https://cordherald39.github.io/clash-astroplate/。没有自定义域名或 CNAME。

正式本地构建（PowerShell）：

```powershell
$env:SITE_URL='https://cordherald39.github.io'
$env:BASE_PATH='/clash-astroplate/'
pnpm run build
```

未设置 SITE_URL 为本地预览；设置后默认开放索引，可用 ALLOW_INDEX=false 保持noindex。canonical、RSS和sitemap使用构建地址。内链按BASE_PATH生成，Markdown使用相对路径。不得填参考站域名。

## 模板保留

使用上游main.css、base/buttons/components、generated-theme及主题生成脚本；原BlogCard按中文字段与base适配。 template-source及upstream.zip是2026-09-30的上游本地快照，不提交。许可证留在仓库。
