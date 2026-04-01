---
title: Markdown 扩展功能
published: 2025-05-01
updated: 2025-11-29
description: '了解更多 Fuwari 中的 Markdown 功能'
image: ''
tags: ['blog-example']
category: Examples
draft: false 
---

## GitHub 仓库卡片

你可以添加动态卡片来链接到 GitHub 仓库，页面加载时会自动从 GitHub API 拉取仓库信息。

::github{repo="Fabrizz/MMM-OnSpotify"}

使用代码 `::github{repo="<owner>/<repo>"}` 来创建一个 GitHub 仓库卡片。

```markdown
::github{repo="saicaca/fuwari"}
```

## 提示块（Admonitions）

支持以下类型的提示块：`note` `tip` `important` `warning` `caution`

:::note
高亮显示用户应注意的信息，即使在快速浏览时也不应错过。
:::

:::tip
可选信息，帮助用户更好地完成任务。
:::

:::important
用户成功所必需的关键信息。
:::

:::warning
要求用户立即关注的重要内容，因为可能存在潜在风险。
:::

:::caution
某项操作可能带来的负面后果。
:::

### 基础语法

```markdown
:::note
高亮显示用户应注意的信息，即使在快速浏览时也不应错过。
:::

:::tip
可选信息，帮助用户更好地完成任务。
:::
```

### 自定义标题

提示块的标题可以自定义。

:::note[我的自定义标题]
这是一个带有自定义标题的提示块。
:::

```markdown
:::note[我的自定义标题]
这是一个带有自定义标题的提示块。
:::
```

### GitHub 语法

> [!TIP]
> 同样支持 [GitHub 语法](https://github.com/orgs/community/discussions/16925)。

```
> [!NOTE]
> 同样支持 GitHub 语法。

> [!TIP]
> 同样支持 GitHub 语法。
```

### 剧透遮罩

你可以为文本添加剧透遮罩效果，遮罩内同样支持 **Markdown** 语法。

内容 :spoiler[被隐藏了 **哈哈**]！

```markdown
内容 :spoiler[被隐藏了 **哈哈**]！
```
