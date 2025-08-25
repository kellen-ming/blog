## 我的博客

此仓库为我的个人博客源码，基于 [Astro](https://astro.build) 构建，由 🍥Fuwari 模板生成。

- 模板仓库：[`saicaca/fuwari`](https://github.com/saicaca/fuwari)
- 模板演示：`https://fuwari.vercel.app`

### 本地开发

在项目根目录执行：

- 如未安装 [pnpm](https://pnpm.io)，先运行：`npm install -g pnpm`
- 安装依赖：`pnpm install`，以及图片处理库：`pnpm add sharp`
- 启动开发服务器：`pnpm dev`（默认 `http://localhost:4321`）

### 写作与内容

- 新建文章：`pnpm new-post <filename>`（生成在 `src/content/posts/`）
- 基本 Frontmatter 示例：

```yaml
---
title: 文章标题
published: 2024-01-01
description: 简短描述
image: ./cover.jpg
tags: [Tag1, Tag2]
category: Category
draft: false
---
```

### 构建与预览

- 构建：`pnpm build`（产物输出到 `./dist/`）
- 预览：`pnpm preview`

### 部署

可部署至 Vercel / Netlify / GitHub Pages 等。部署前请在 `astro.config.mjs` 设置正确的 `site`。

### 致谢

本项目使用 🍥Fuwari 模板生成，感谢模板作者 `@saicaca`。


