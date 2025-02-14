---
title: package.json_v11
published: 2025-02-13
description: 'NPM的package.json文件一些基础字段解释'
image: ''
tags: ['npm']
category: 'CICD'
draft: false 
lang: ''
---
> - [相关手册](https://docs.npmjs.com/cli/v11/configuring-npm/package-json)
```json
{
  // ====== 基础标识字段 ======
  "name": "@your-scope/package-name", // 包名（必须全小写，支持scope）
  "version": "1.0.0", // 版本号（必须符合语义化版本规范）
  "description": "A sample package description", // 包描述（npm搜索会索引此字段）
  "keywords": ["keyword1", "keyword2"], // 关键词数组（用于npm搜索）

  // ====== 入口文件配置 ======
  "main": "dist/index.js", // 主入口文件（CommonJS规范）
  "module": "dist/index.esm.js", // ESM模块入口（现代打包工具优先使用）
  "browser": "dist/index.umd.js", // 浏览器环境专用入口
  "types": "dist/index.d.ts", // TypeScript类型声明文件路径

  // ====== 脚本命令 ======
  "scripts": {
    "build": "tsc", // 编译命令
    "test": "jest",
    "prepublishOnly": "npm test && npm run build", // 发布前自动执行的钩子
    "start": "node src/index.js"
  },

  // ====== 依赖管理 ======
  "dependencies": {
    "lodash": "^4.17.21" // 生产依赖
  },
  "devDependencies": {
    "@types/node": "^14.0.0", // 开发依赖
    "typescript": "^4.0.0"
  },
  "peerDependencies": {
    "react": ">=16.8.0" // 宿主环境必须安装的依赖
  },
  "optionalDependencies": {
    "fsevents": "^2.3.2" // 可选依赖（安装失败不会中断流程）
  },

  // ====== 发布配置 ======
  "files": ["dist"], // 包含在npm包中的文件/目录
  "private": false, // 设为true可防止意外发布
  "publishConfig": {
    "access": "public", // 作用域包发布权限（public/restricted）
    "registry": "https://registry.npmjs.org/" // 自定义发布仓库
  },

  // ====== 环境配置 ======
  "engines": {
    "node": ">=14.0.0", // Node.js版本要求
    "npm": ">=7.0.0" // npm版本要求
  },
  "os": ["darwin", "linux"], // 支持的操作系统
  "cpu": ["x64", "arm64"], // 支持的CPU架构

  // ====== 元信息 ======
  "author": "Your Name <your.email@example.com>", // 作者信息
  "contributors": ["Contributor1 <c1@example.com>"],
  "license": "MIT", // 开源协议
  "repository": {
    "type": "git",
    "url": "https://github.com/yourname/yourrepo.git"
  },
  "homepage": "https://your-package.org", // 项目主页
  "bugs": {
    "url": "https://github.com/yourname/yourrepo/issues"
  },

  // ====== 现代包配置 ======
  "type": "module", // 定义包使用ES模块（Node.js >=13.2.0）
  "exports": {
    ".": {
      "import": "./dist/esm/index.js", // ESM导入入口
      "require": "./dist/cjs/index.js" // CommonJS导入入口
    },
    "./features": "./dist/features/index.js" // 子路径导出
  }
}
```