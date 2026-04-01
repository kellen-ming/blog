---
title: Fuwari 简易使用指南
published: 2025-04-01
description: "如何使用这个博客模板。"
image: "./cover.jpeg"
tags: ['blog-example']
category: Examples
draft: false
---

> 封面图片来源：[原图链接](https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/208fc754-890d-4adb-9753-2c963332675d/width=2048/01651-1456859105-(colour_1.5),girl,_Blue,yellow,green,cyan,purple,red,pink,_best,8k,UHD,masterpiece,male%20focus,%201boy,gloves,%20ponytail,%20long%20hair,.jpeg)

这个博客模板基于 [Astro](https://astro.build/) 构建。对于本指南未涉及的内容，你可以在 [Astro 文档](https://docs.astro.build/) 中找到答案。

## 文章的 Front-matter

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg
tags: [Foo, Bar]
category: Front-end
draft: false
---
```

| 属性          | 说明                                                                                                                                                                                        |
|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `title`       | 文章标题。                                                                                                                                                                                  |
| `published`   | 文章发布日期。                                                                                                                                                                              |
| `description` | 文章的简短描述，显示在首页列表中。                                                                                                                                                          |
| `image`       | 文章封面图片路径。<br/>1. 以 `http://` 或 `https://` 开头：使用网络图片<br/>2. 以 `/` 开头：使用 `public` 目录下的图片<br/>3. 其他情况：相对于当前 Markdown 文件的路径 |
| `tags`        | 文章标签。                                                                                                                                                                                  |
| `category`    | 文章分类。                                                                                                                                                                                  |
| `draft`       | 若为草稿状态则不会显示。                                                                                                                                                                    |

## 文章文件的存放位置

你的文章文件应放置在 `src/content/posts/` 目录下。你也可以创建子目录来更好地组织文章和相关资源。

```
src/content/posts/
├── post-1.md
└── post-2/
    ├── cover.png
    └── index.md
```
