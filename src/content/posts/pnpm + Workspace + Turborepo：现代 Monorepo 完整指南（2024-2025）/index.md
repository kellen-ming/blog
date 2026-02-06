---
title: pnpm + Workspace + Turborepo：现代 Monorepo 完整指南（2024-2025）
published: 2026-02-06
description: '基于 2024-2025 最佳实践：pnpm + Workspace 基础配置与依赖管理，Turborepo 集成、实战案例、Changeset 版本发布，以及性能优化与常见问题，适合生产环境 Monorepo 搭建。'
image: ''
tags: ['pnpm', 'workspace', 'turborepo', 'monorepo', '前端', '构建工具', 'changeset', ]
category: '前端'
draft: false 
lang: 'zh'
---

# pnpm + Workspace + Turborepo：现代 Monorepo 完整指南（2024-2025）

> 基于 2024-2025 年的最新最佳实践，涵盖 pnpm + Workspace 的完整配置，
> 以及 pnpm + Workspace + Turborepo 的高级方案，适合生产环境使用。

---

## 第一章：为什么选择 pnpm？

### 1.1 pnpm 相比 npm/yarn 的优势

pnpm 使用内容寻址存储（content-addressable store）来管理依赖，相比传统包管理器有以下优势：
- **磁盘空间效率**：通过硬链接而不是复制来管理 node_modules，节省大量磁盘空间
- **更快的安装速度**：并行安装和更好的缓存机制
- **严格的依赖隔离**：防止幽灵依赖（phantom dependencies）
- **工作区支持**：原生支持 monorepo，无需额外工具

### 1.2 pnpm vs Yarn Workspaces

```
pnpm 的优势：
✅ 更快的性能（硬链接 vs 软链接）
✅ 更小的磁盘占用
✅ 严格的依赖隔离
✅ 内置 workspace 支持
✅ 更活跃的维护

Yarn 的现状：
❌ 相对较慢
❌ 磁盘占用大
❌ 社区活跃度下降
❌ 生产环境不再推荐用于新项目
```

### 1.3 pnpm 的核心概念

```javascript
// pnpm 的存储模式
~/.pnpm-store/
├── v3/
│   └── node_modules/
│       └── {hash}/
│           └── node_modules/
│               └── 实际包文件

// workspace 中的 node_modules
project/
└── node_modules/
    └── package-name (symlink to ~/.pnpm-store)
```

---

## 第二章：pnpm + Workspace 基础配置

### 2.1 快速开始

使用以下命令初始化 pnpm monorepo：

```bash
# 创建项目目录
mkdir awesome-monorepo
cd awesome-monorepo

# 初始化 pnpm
pnpm init

# 设置 Node.js 版本要求
npm pkg set engines.node=">=16.13.0"

# 指定包管理器
npm pkg set packageManager="pnpm@latest"

# 支持 ES modules
npm pkg set type="module"
```

### 2.2 创建 pnpm-workspace.yaml

创建工作区配置文件：

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

这告诉 pnpm 将 packages 和 apps 目录下的所有文件夹视为工作区包。

### 2.3 根项目的 package.json

根项目应该有以下结构：

```json
{
  "name": "awesome-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "build": "pnpm --filter=@awesome/* run build",
    "test": "pnpm --filter=@awesome/* run test",
    "lint": "pnpm --filter=@awesome/* run lint",
    "clean": "rimraf 'packages/*/{dist,node_modules}' && rimraf node_modules",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "pnpm build && pnpm changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.26.0",
    "rimraf": "^4.1.2",
    "typescript": "^4.9.4",
    "only-allow": "^1.1.1"
  }
}
```

### 2.4 .npmrc 配置

```ini
# .npmrc
# 启用工作区包链接
auto-install-peers=true

# 严格的 peer 依赖检查
strict-peer-dependencies=true

# 处理 peer 依赖警告（如果需要）
# hoist-pattern[]=*eslint*
# hoist-pattern[]=*prettier*
```

### 2.5 项目目录结构

推荐的项目结构：

```
awesome-monorepo/
├── .changeset/
│   └── config.json
├── apps/
│   └── web-app/
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── ui-components/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── utils/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── api-client/
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── tools/
│   └── build-scripts/
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── README.md
```

---

## 第三章：pnpm Workspace 依赖管理

### 3.1 workspace: 协议

在 package.json 中使用 workspace:* 协议来引用本地包：

```json
{
  "name": "@awesome/api-client",
  "dependencies": {
    "@awesome/utils": "workspace:*"
  }
}
```

这意味着在开发时链接本地包，发布到 npm 时自动转换为实际版本。

### 3.2 添加依赖到特定包

使用 --filter 标志来管理特定包的依赖：

```bash
# 添加到单个包
pnpm add react react-dom --filter @awesome/ui-components

# 添加到多个包
pnpm add dayjs --filter "@awesome/*"

# 添加开发依赖
pnpm add -D @types/jest --filter @awesome/utils

# 添加本地包依赖
pnpm add @awesome/utils@workspace:* --filter @awesome/api-client
```

### 3.3 root 级别的依赖管理

在根项目安装共享的开发依赖：

```bash
# 在根项目安装
pnpm add -Dw typescript @types/node eslint prettier jest

# 在根项目安装通用依赖
pnpm add -w lodash axios
```

---

## 第四章：高级：pnpm + Workspace + Turborepo

### 4.1 为什么添加 Turborepo？

Turborepo 提供了 pnpm workspaces 之上的构建优化：
- **智能缓存**：避免重复构建相同的代码
- **并行执行**：同时运行多个任务
- **任务编排**：定义任务之间的依赖关系
- **远程缓存**：与团队共享构建工件

性能提升：初始构建 30 秒，缓存后 0.2 秒（150 倍加速）

### 4.2 安装 Turborepo

```bash
# 安装 Turborepo 作为开发依赖
pnpm add -Dw turbo
```

### 4.3 创建 turbo.json 配置

在项目根目录创建 turbo.json：

```json
{
  "$schema": "https://turborepo.org/schema.json",
  "baseBranch": "origin/main",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**", ".next/**", "!.next/cache/**"],
      "env": [
        "NODE_ENV",
        "NEXT_PUBLIC_*"
      ]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

关键配置说明：
- `dependsOn: ["^build"]` - 先构建依赖的包
- `outputs` - 要缓存的文件输出
- `env` - 影响缓存的环境变量
- `cache: false` - dev 任务不缓存（因为它一直在运行）

### 4.4 更新根项目 package.json

更新脚本使用 turbo：

```json
{
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rm -rf node_modules pnpm-lock.yaml"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "packageManager": "pnpm@9.0.0"
}
```

### 4.5 在各个包中定义构建脚本

```json
{
  "name": "@awesome/ui-components",
  "scripts": {
    "build": "tsc && vite build",
    "dev": "vite",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  }
}
```

### 4.6 Turborepo 运行任务

```bash
# 构建所有包（智能缓存）
pnpm run build

# 开发模式（监听所有包）
pnpm run dev

# 构建特定包
turbo run build --filter=@awesome/ui-components

# 构建及其依赖
turbo run build --filter=@awesome/web-app...

# 并行运行（最多 4 个并发）
turbo run build --concurrency 4

# 显示构建图
turbo run build --graph
```

---

## 第五章：实战案例：完整的 Monorepo 设置

### 5.1 项目目录结构

```
awesome-monorepo/
├── .github/
│   └── workflows/
│       └── ci.yaml
├── apps/
│   ├── web/              # Next.js 应用
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── api/              # NestJS API
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── ui/               # React 组件库
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── utils/            # 工具函数
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── types/            # 共享类型
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── config/           # 共享配置
│       ├── eslint-config/
│       ├── typescript-config/
│       └── prettier-config/
├── .npmrc
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
└── README.md
```

### 5.2 根 tsconfig.json

配置 TypeScript 路径映射：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@awesome/ui": ["packages/ui/src"],
      "@awesome/utils": ["packages/utils/src"],
      "@awesome/types": ["packages/types/src"],
      "@awesome/config/*": ["packages/config/*/src"]
    }
  }
}
```

### 5.3 各包的 package.json 示例

**packages/utils/package.json**

```json
{
  "name": "@awesome/utils",
  "version": "1.0.0",
  "description": "Shared utilities",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc && vite build",
    "dev": "tsc --watch",
    "test": "jest",
    "lint": "eslint src"
  }
}
```

**apps/web/package.json**

```json
{
  "name": "@awesome/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint src"
  },
  "dependencies": {
    "@awesome/ui": "workspace:*",
    "@awesome/utils": "workspace:*",
    "@awesome/types": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 5.4 CI/CD 配置（GitHub Actions）

```yaml
# .github/workflows/ci.yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: '8.15.0'
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      
      - run: pnpm lint
      
      - run: pnpm test
      
      - run: pnpm build
```

---

## 第六章：版本管理与发布

### 6.1 使用 Changesets

Changesets 是管理 monorepo 版本和发布的最佳实践：

```bash
# 安装 changesets
pnpm add -Dw @changesets/cli

# 初始化
pnpm changeset init

# 创建 changeset
pnpm changeset

# 版本更新
pnpm changeset version

# 发布
pnpm changeset publish
```

### 6.2 .changeset/config.json

```json
{
  "$schema": "https://unpkg.com/@changesets/config@2.3.0/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "your-org/awesome-monorepo" }],
  "commit": false,
  "fixed": [],
  "linked": [["@awesome/*"]],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@awesome/build-tools"],
  "snapshot": {
    "useCalculatedVersion": true,
    "prereleaseTemplate": "{tag}-{datetime}"
  }
}
```

---

## 第七章：最佳实践与常见问题

### 7.1 依赖管理最佳实践

```bash
# 使用 workspace:* 链接本地包
pnpm add @awesome/utils@workspace:* --filter @awesome/api-client

# 提升常见的开发依赖到根
pnpm add -Dw typescript eslint prettier jest

# 为共享库指定 peer dependencies
# 在 ui 库的 package.json 中
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}

# 对多个包执行命令
pnpm --filter="@awesome/*" run build

# 只对改变的包执行命令（需要 git）
turbo run build --since origin/main
```

### 7.2 常见问题解决

**问题 1：TypeScript 找不到路径**

```json
// 确保 tsconfig.json 中有路径映射
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@awesome/*": ["packages/*/src"]
    }
  }
}
```

**问题 2：循环依赖**

```
解决方案：
1. 创建 @awesome/types 包
2. 把共享类型放在 types 包中
3. 其他包引用 @awesome/types
4. 避免交叉引用
```

**问题 3：构建缓存失效**

```bash
# 清除 pnpm 缓存
pnpm store prune

# 清除 turbo 缓存
turbo run clean

# 重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 第八章：性能指标

### 8.1 预期性能指标

```
初始构建：
- 小型项目（3-5 个包）：5-15 秒
- 中型项目（10-20 个包）：15-45 秒
- 大型项目（50+ 个包）：1-5 分钟

缓存后：
- 所有项目：< 1 秒（通常 0.2-0.5 秒）

增量构建（改变 1 个文件）：
- 受影响包及其依赖：2-10 秒
- 其他包：从缓存加载（< 0.5 秒）
```

### 8.2 监控构建性能

```bash
# 显示任务图
turbo run build --graph

# 显示构建详情
turbo run build --verbose

# 显示任务依赖
turbo run build --graph > graph.mmd

# 分析性能
turbo run build --profile
```

---

## 第九章：总结与建议

### 核心技术栈对比

```
pnpm alone:
✅ 快速、高效
✅ 原生 workspace 支持
❌ 缺乏高级构建优化
❌ 无缓存机制

pnpm + Turborepo:
✅ 快速、高效
✅ 智能缓存（150 倍加速）
✅ 任务编排和并行执行
✅ 远程缓存支持
✅ 生产环境推荐

其他方案：
- Nx：功能完整但学习曲线陡峭，配置复杂
- Lerna：已过时，性能较差，维护不活跃
- npm/yarn workspaces：功能基础，缺乏优化
```

### 2024-2025 推荐方案

**强烈推荐：pnpm + Workspace + Turborepo**

原因：
1. **性能最优**：pnpm 的高效依赖管理 + Turborepo 的智能缓存
2. **生态活跃**：两个工具都在积极维护和改进
3. **易于使用**：Turborepo 配置简单，学习成本低
4. **灵活性**：可以随时降级到原生 pnpm workspaces
5. **社区支持**：越来越多的大型项目采用这个方案

### 快速决策树

```
你需要 Monorepo 吗？
├─ 不需要 → 使用单一 git 仓库
└─ 需要 → 选择包管理器
   ├─ 有 CI/CD 需求？
   │  ├─ 有 → 使用 pnpm + Turborepo
   │  └─ 没有 → 使用 pnpm workspace
   └─ 需要简单高效？→ 使用 pnpm + Turborepo
```

---🚀