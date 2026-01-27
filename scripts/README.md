# Scripts 使用说明

## enhance-frontmatter.js

自动完善博客文章的 frontmatter 信息（description、tags、category、lang）。

### 使用方法

#### 方法 1：使用 npm 脚本（推荐）

```bash
pnpm enhance-frontmatter "src/content/posts/文章标题/index.md"
```

#### 方法 2：直接运行 Node.js

```bash
node scripts/enhance-frontmatter.js "src/content/posts/文章标题/index.md"
```

### 功能说明

脚本会自动分析文章内容并生成：

1. **description**：根据文章标题、章节和内容生成描述
2. **tags**：从内容中提取关键词作为标签（最多 6 个）
3. **category**：根据关键词自动判断分类
4. **lang**：根据内容是否包含中文判断语言

### 分类规则

- **前端**：包含 webpack、vite、react、vue、javascript、typescript 等关键词
- **React**：包含 react、react hooks、react api 等关键词
- **资源**：包含资源、工具库、收集、推荐等关键词
- **JS**：包含 javascript、js api 等关键词
- **CICD**：包含 npm、package.json、cicd 等关键词

### 示例

```bash
# 完善 Webpack 文章的 frontmatter
pnpm enhance-frontmatter "src/content/posts/Webpack 深度学习指南/index.md"

# 完善 React 文章的 frontmatter
pnpm enhance-frontmatter "src/content/posts/React 19 新特性 - useOptimistic/index.md"
```

### 注意事项

- 脚本会直接修改原文件，建议先备份或使用 Git
- 如果 frontmatter 中已有内容，脚本会保留 published、image、draft 等字段
- 生成的 description 长度限制在 150 字符以内
- tags 数量限制在 6 个以内
