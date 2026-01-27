---
name: complete-frontmatter
description: Automatically complete blog post frontmatter (description, tags, category, lang). Use when asked to "complete frontmatter", "improve frontmatter", "add description", "补充前置信息", or "完善 frontmatter".
argument-hint: <post-file-path>
metadata:
  author: channelwill-kellen
  version: "1.0.0"
---

# Auto-complete Frontmatter Skill

自动完善博客文章的 frontmatter 信息（description、tags、category、lang）。

## 触发条件

当用户要求完善或补充博客文章的 frontmatter 信息时，自动执行此 skill。

触发关键词：
- "完善 frontmatter"
- "补充前置信息"
- "complete frontmatter"
- "improve frontmatter"
- "添加描述"
- "add description"

## 执行步骤

### 1. 分析文章内容
- 读取文章标题和前 100-200 行，理解文章主题
- 使用 `grep` 查找 `^##` 模式，识别主要章节
- 提取主要主题和技术关键词

### 2. 生成 Description
生成简洁的描述（50-150 字符），要求：
- 总结文章核心内容和价值
- 提及关键主题
- 说明目标受众（如适用）
- 使用清晰、吸引人的语言
- 中文描述控制在 80-150 字符
- 英文描述控制在 100-200 字符

### 3. 提取 Tags
根据文章内容，建议 3-8 个相关标签：
- 技术名称（如 'webpack', 'react', 'typescript'）
- 主题（如 '打包工具', '性能优化', '前端'）
- 文章类型（如 '教程', '实践案例', '练习题'）
- 英文标签使用小写，中文标签保持原样
- 避免重复或过于相似的标签

### 4. 确定 Category
根据文章主题匹配分类：
- **'前端'** - 前端相关主题（webpack、vite、react、vue、javascript、typescript 等）
- **'React'** - React 特定内容（react、react hooks、react api 等）
- **'资源'** - 资源集合（资源、工具库、收集、推荐等）
- **'JS'** - JavaScript 主题（javascript、js api 等）
- **'CICD'** - CI/CD 相关（npm、package.json、cicd 等）

### 5. 设置 Language
- 中文文章：使用 'zh'
- 英文文章：使用 'en'
- 如果与站点默认语言一致，可以留空

### 6. Frontmatter 格式
始终保持一致的前置元数据格式：
```yaml
---
title: Article Title
published: YYYY-MM-DD
description: 'Concise description of the article content and value'
image: ''
tags: ['tag1', 'tag2', 'tag3']
category: 'Category'
draft: false 
lang: 'zh'
---
```

## 示例

### Webpack 文章
```yaml
description: 'Webpack 进阶学习指南，深入探讨代码分割、热更新原理、构建优化等高级特性。'
tags: ['webpack', '打包工具', '前端', '构建工具', '性能优化']
category: '前端'
lang: 'zh'
```

### React 文章
```yaml
description: 'ReactDOM.preload 用于预加载关键资源，优化首屏性能。本文介绍其参数配置和实用场景。'
tags: ['react', 'react api', '性能优化', '前端']
category: 'React'
lang: 'zh'
```

### 资源收集文章
```yaml
description: '收集前端开发中常用的优秀资源库，包括状态管理、路由、UI组件等，持续更新中。'
tags: ['资源', '工具库', '前端']
category: '资源'
lang: 'zh'
```

## 执行流程

1. 使用 `read_file` 读取文章文件（通常前 200-300 行足够）
2. 使用 `grep` 查找章节标题：`grep -n "^##" <file>` 
3. 分析内容结构（标题、章节、关键词）
4. 生成合适的 frontmatter 字段
5. 使用 `search_replace` 更新文件中的空字段
6. 验证修改结果

## 注意事项

- 保留现有的 `title`、`published`、`image`、`draft` 等字段
- description 长度控制在 150 字符以内
- tags 数量控制在 3-8 个
- 确保格式与博客中其他文章保持一致
- 不要覆盖已有的非空字段（除非用户明确要求）
- 优先使用文章中已有的技术术语作为标签

## 工具使用建议

- `read_file`: 读取文章内容，建议读取前 200-300 行
- `grep`: 查找章节标题和关键模式
- `search_replace`: 更新 frontmatter 字段
- `read_lints`: 验证修改后的文件格式
