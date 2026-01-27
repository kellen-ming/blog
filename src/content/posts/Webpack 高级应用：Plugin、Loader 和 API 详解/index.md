---
title: Webpack 高级应用：Plugin、Loader 和 API 详解
published: 2026-01-27
description: '深入讲解 Webpack 的核心扩展机制：Plugin 和 Loader 的工作原理、开发实践，以及 Webpack API 的详细用法。包含多个实战案例和最佳实践，帮助开发者掌握 Webpack 高级应用技巧。'
image: ''
tags: ['webpack', 'plugin', 'loader', '打包工具', '前端', '构建工具']
category: '前端'
draft: false 
lang: 'zh'
---

# Webpack 高级应用：Plugin、Loader 和 API 详解

> 本文档深入讲解 Webpack 的核心扩展机制：Plugin 和 Loader，
> 包括工作原理、常用 API、开发实例等。

---

## 第一章：Loader 深度理解

### 1.1 什么是 Loader？

**Loader 本质上就是一个函数**，接收文件内容，返回转换后的内容。

```javascript
// 最简单的 loader
module.exports = function(source) {
  // source 是文件的原始内容（字符串）
  
  // 对内容进行转换
  const result = source.toUpperCase()
  
  // 返回转换后的内容
  return result
}
```

**Webpack 为什么需要 Loader？**

Webpack 默认只理解 JavaScript 和 JSON。但项目中有：
- TypeScript → 需要 ts-loader
- JSX → 需要 babel-loader
- CSS → 需要 css-loader
- 图片 → 需要 file-loader

每种文件都需要一个 Loader 来"翻译"成 Webpack 能理解的东西。

### 1.2 Loader 的执行流程

```javascript
// 使用多个 loader 的配置
module.exports = {
  module: {
    rules: [
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      }
    ]
  }
}
```

**执行流程：**

```
.less 文件
  ↓
[1] less-loader: .less → .css
  ↓
  .css 代码
  ↓
[2] css-loader: 处理 @import、url()
  ↓
  CSS as JavaScript module
  ↓
[3] style-loader: CSS → 注入到 <style> 标签
  ↓
最终输出：页面上的 <style> 标签
```

**重要**：Loader 是从右到左执行的！

```javascript
use: ['style-loader', 'css-loader', 'less-loader']
//    ↑ 最后执行      ↑ 中间        ↑ 最先执行
```

### 1.3 Loader 的四种写法

#### 写法 1：同步 Loader（最简单）

```javascript
// loaders/simple-loader.js
module.exports = function(source) {
  // source 是文件内容
  console.log('Processing:', this.resourcePath)
  
  const result = source.replace(/foo/g, 'bar')
  
  return result
}
```

#### 写法 2：同步 Loader with this.callback

当你需要返回多个值时（不仅仅是转换后的内容）：

```javascript
// loaders/callback-loader.js
module.exports = function(source, sourceMap) {
  // this.callback 用来返回多个值
  this.callback(
    null,                    // error
    source.toUpperCase(),    // 转换后的内容
    sourceMap,              // 可选：source map
    meta                    // 可选：元数据
  )
  
  // 使用 callback 时，不要 return！
}

// 等价于
module.exports = function(source, sourceMap) {
  return source.toUpperCase()
}
```

#### 写法 3：异步 Loader with this.callback

当需要执行异步操作（如读取文件、网络请求）：

```javascript
// loaders/async-loader.js
module.exports = function(source) {
  const callback = this.callback
  
  // 执行异步操作
  setTimeout(() => {
    const result = source.toUpperCase()
    
    // 用 callback 返回结果
    callback(null, result)
    
    // 或者返回错误
    // callback(new Error('Something went wrong'), null)
  }, 1000)
  
  // 异步 loader 不 return
}

// 这样 Webpack 会等待 callback 执行后再继续
```

#### 写法 4：异步 Loader with async/await（推荐）

```javascript
// loaders/async-await-loader.js
module.exports = async function(source) {
  // 执行异步操作
  const data = await fetchData()
  
  // 处理内容
  const result = source + `\n/* Fetched: ${data} */`
  
  return result
}
```

### 1.4 Loader 中的 this 上下文

Loader 中的 `this` 包含很多有用的属性和方法：

```javascript
module.exports = function(source) {
  // 当前被处理的文件路径
  console.log(this.resourcePath)
  // 输出：/home/user/project/src/app.js

  // 当前 loader 的查询参数
  console.log(this.query)
  // 如果配置了 loader?foo=bar，this.query = { foo: 'bar' }

  // 当前 loader 在 rules 中的索引
  console.log(this.loaderIndex)

  // 当前 rule 的所有 loaders
  console.log(this.loaders)

  // 添加文件依赖（如果文件改变，会重新打包）
  this.addDependency('/path/to/file.js')

  // 获取 loader 的选项
  const options = this.getOptions()
  // 比 this.query 更推荐

  // 发送警告信息
  this.emitWarning(new Error('Warning message'))

  // 缓存 loader 结果
  this.cacheable()

  // Source Map 相关
  this.sourceMap

  return source
}
```

### 1.5 Loader 的参数处理

**获取 loader 选项的标准方式：**

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties']
          }
        }
      }
    ]
  }
}

// loaders/my-loader.js
const { getOptions } = require('loader-utils')

module.exports = function(source) {
  // 标准方式：使用 loader-utils
  const options = getOptions(this) || {}
  
  console.log(options.presets)
  // 输出：['@babel/preset-env']

  return source
}
```

**不同版本的 Webpack 兼容性：**

```javascript
// 兼容多个 Webpack 版本
const getOptions = require('loader-utils').getOptions || function(context) {
  return context.query
}

module.exports = function(source) {
  const options = getOptions(this)
  // ...
}
```

### 1.6 Loader 验证和错误处理

```javascript
const { getOptions, validateOptions } = require('loader-utils')
const schema = require('./my-loader.schema.json')

module.exports = function(source) {
  // 获取和验证选项
  const options = getOptions(this)
  const validationErrors = validateOptions(schema, options)
  
  if (validationErrors) {
    throw new Error(`Invalid loader options: ${validationErrors}`)
  }

  // 处理源代码
  try {
    const result = doSomething(source)
    return result
  } catch (error) {
    // 使用 this.callback 返回错误
    this.callback(error)
    return
  }
}

// my-loader.schema.json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "timeout": { "type": "number" }
  },
  "additionalProperties": false
}
```

### 1.7 实战案例 1：自定义 Babel Loader

```javascript
// loaders/simple-babel-loader.js
const { getOptions } = require('loader-utils')
const babel = require('@babel/core')

module.exports = function(source, sourceMap) {
  // 获取选项
  const options = getOptions(this) || {}

  // 调用 Babel 转译
  const result = babel.transformSync(source, {
    ...options,
    sourceMap: true,
    ast: true
  })

  // 返回转译结果和 source map
  this.callback(
    null,
    result.code,
    result.map
  )
}

module.exports.raw = false
```

### 1.8 实战案例 2：自定义 Markdown Loader

```javascript
// loaders/markdown-loader.js
const marked = require('marked')
const { getOptions } = require('loader-utils')

module.exports = function(source) {
  const options = getOptions(this) || {}

  // 编译 Markdown
  const html = marked.marked(source, options)

  // 转成 JavaScript 模块
  const code = `
    export default ${JSON.stringify(html)}
  `

  return code
}

// 使用方式
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.md$/,
        use: 'markdown-loader'
      }
    ]
  }
}

// app.js
import content from './README.md'
console.log(content)  // HTML 字符串
```

### 1.9 实战案例 3：自定义 YAML Loader

```javascript
// loaders/yaml-loader.js
const yaml = require('js-yaml')

module.exports = function(source) {
  try {
    // 解析 YAML
    const data = yaml.load(source)

    // 转成 JavaScript module
    const code = `export default ${JSON.stringify(data)}`

    return code
  } catch (error) {
    // 使用 callback 返回错误
    this.callback(error)
  }
}

// 使用
// config.yaml
database:
  host: localhost
  port: 5432
  name: myapp

// app.js
import config from './config.yaml'
console.log(config.database.host)  // 'localhost'
```

### 1.10 Loader 的最佳实践

```javascript
module.exports = function(source, sourceMap, meta) {
  // 1. 获取选项
  const options = getOptions(this) || {}

  // 2. 验证选项
  if (!options.required) {
    this.emitWarning(new Error('required 选项未设置'))
  }

  // 3. 标记 loader 可缓存
  this.cacheable()

  // 4. 处理内容
  let result
  try {
    result = doTransform(source, options)
  } catch (error) {
    return this.callback(error)
  }

  // 5. 返回结果
  if (sourceMap) {
    return this.callback(null, result, sourceMap)
  } else {
    return result
  }
}

// 禁止处理 Raw Buffer
module.exports.raw = false
```

---

## 第二章：Plugin 深度理解

### 2.1 什么是 Plugin？

**Plugin 是一个类或函数**，它在 Webpack 编译过程中的特定时刻执行自定义逻辑。

**Loader vs Plugin 的区别：**

| 特性 | Loader | Plugin |
|------|--------|--------|
| 作用对象 | 单个文件 | 整个编译过程 |
| 执行时机 | 编译时转换文件 | 在生命周期钩子处执行 |
| 返回值 | 转换后的文件内容 | 无（通过钩子修改） |
| 配置位置 | module.rules | plugins |

### 2.2 Webpack 的编译流程和钩子

Webpack 的编译是一个事件驱动的过程，分为这几个阶段：

```
初始化阶段
  ↓
{ entry } → 创建 Compiler 对象
  ↓
Compiler.run() 开始编译
  ↓
构建阶段
  ├─ beforeCompile
  ├─ compile (创建 Compilation 对象)
  ├─ compilation (Compilation 创建)
  ├─ make (构建模块)
  └─ seal (优化)
  ↓
输出阶段
  ├─ emit (输出文件前)
  ├─ afterEmit (输出文件后)
  └─ done (编译完成)
```

### 2.3 Plugin 的基本结构

```javascript
// plugins/my-plugin.js
class MyPlugin {
  // Plugin 是一个类
  
  constructor(options) {
    // 接收配置选项
    this.options = options
  }

  apply(compiler) {
    // apply 方法是入口
    // compiler 是 Webpack 的 Compiler 实例

    // 监听钩子
    compiler.hooks.emit.tap('MyPlugin', (compilation) => {
      // 在 emit 阶段执行
      console.log('Emitting files...')
    })
  }
}

module.exports = MyPlugin

// 使用方式
// webpack.config.js
const MyPlugin = require('./plugins/my-plugin')

module.exports = {
  plugins: [
    new MyPlugin({ /* options */ })
  ]
}
```

### 2.4 Compiler 和 Compilation 对象

**Compiler 对象：**
- 代表整个 Webpack 编译过程
- 有一个 Compiler 实例，贯穿整个生命周期
- 包含配置信息、插件系统等

**Compilation 对象：**
- 代表一次编译过程（包括增量编译）
- 每次编译都会创建一个新的 Compilation
- 包含本次编译的所有模块、chunks、assets 等

```javascript
class MyPlugin {
  apply(compiler) {
    // Compiler 钩子：监听整个编译过程
    compiler.hooks.compilation.tap('MyPlugin', (compilation) => {
      // Compilation 钩子：监听单次编译
      compilation.hooks.seal.tap('MyPlugin', () => {
        // 在本次编译的 seal 阶段执行
      })
    })
  }
}
```

### 2.5 钩子系统（Hooks）

Webpack 使用 **Tapable** 库来实现钩子系统。有几种钩子类型：

#### Hook 类型 1：SyncHook（同步钩子）

```javascript
class MyPlugin {
  apply(compiler) {
    // SyncHook：钩子函数必须同步执行
    compiler.hooks.afterPlugins.tap('MyPlugin', (compiler) => {
      console.log('Plugins 加载完毕')
      // 必须同步返回，不能有异步操作
    })
  }
}
```

#### Hook 类型 2：AsyncSeriesHook（异步串行钩子）

```javascript
class MyPlugin {
  apply(compiler) {
    // AsyncSeriesHook：钩子函数按顺序执行（串行）
    compiler.hooks.beforeCompile.tapPromise('MyPlugin', async () => {
      // 使用 tapPromise，返回 Promise
      const result = await fetchData()
      console.log('Fetched data:', result)
    })

    // 或者使用 tapAsync，用 callback
    compiler.hooks.beforeCompile.tapAsync('MyPlugin', (params, callback) => {
      setTimeout(() => {
        console.log('Done')
        callback()  // 必须调用 callback
      }, 1000)
    })
  }
}
```

#### Hook 类型 3：AsyncParallelHook（异步并行钩子）

```javascript
class MyPlugin {
  apply(compiler) {
    // AsyncParallelHook：多个钩子并行执行（不等待）
    compiler.hooks.normalModuleFactory.tapPromise(
      'MyPlugin',
      async (factory) => {
        // 可以不按顺序执行
        await doSomething()
      }
    )
  }
}
```

**钩子类型总结：**

```
SyncHook
  ├─ tap('name', callback)
  └─ callback 必须同步

AsyncSeriesHook （串行）
  ├─ tap('name', callback) - 不推荐
  ├─ tapAsync('name', (params, callback) => {})
  └─ tapPromise('name', async () => {})

AsyncParallelHook （并行）
  ├─ tap('name', callback) - 不推荐
  ├─ tapAsync('name', (params, callback) => {})
  └─ tapPromise('name', async () => {})
```

### 2.6 常用的 Compiler 钩子

```javascript
class MyPlugin {
  apply(compiler) {
    // 1. beforeRun - 编译前
    compiler.hooks.beforeRun.tap('MyPlugin', (compiler) => {
      console.log('编译前')
    })

    // 2. run - 开始编译
    compiler.hooks.run.tap('MyPlugin', (compiler) => {
      console.log('开始编译')
    })

    // 3. beforeCompile - 创建 Compilation 前
    compiler.hooks.beforeCompile.tap('MyPlugin', (params) => {
      console.log('即将创建 Compilation')
    })

    // 4. compile - 创建 Compilation
    compiler.hooks.compile.tap('MyPlugin', (params) => {
      console.log('创建 Compilation')
    })

    // 5. make - 构建所有模块
    compiler.hooks.make.tapAsync('MyPlugin', (compilation, callback) => {
      console.log('开始构建模块')
      callback()
    })

    // 6. emit - 输出文件前（可以修改产物）
    compiler.hooks.emit.tapAsync('MyPlugin', (compilation, callback) => {
      console.log('输出文件前')
      // 修改 compilation.assets
      callback()
    })

    // 7. afterEmit - 输出文件后
    compiler.hooks.afterEmit.tap('MyPlugin', (compilation) => {
      console.log('输出文件后')
    })

    // 8. done - 编译完成
    compiler.hooks.done.tap('MyPlugin', (stats) => {
      console.log('编译完成')
      console.log('总时间:', stats.endTime - stats.startTime, 'ms')
    })
  }
}
```

### 2.7 常用的 Compilation 钩子

```javascript
class MyPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('MyPlugin', (compilation) => {
      // 1. buildModule - 构建单个模块前
      compilation.hooks.buildModule.tap('MyPlugin', (module) => {
        console.log('构建模块:', module.name)
      })

      // 2. succeedModule - 模块构建成功
      compilation.hooks.succeedModule.tap('MyPlugin', (module) => {
        console.log('模块构建成功:', module.name)
      })

      // 3. failedModule - 模块构建失败
      compilation.hooks.failedModule.tap('MyPlugin', (module, error) => {
        console.log('模块构建失败:', module.name, error)
      })

      // 4. seal - 优化阶段（代码分割、Tree Shaking）
      compilation.hooks.seal.tap('MyPlugin', () => {
        console.log('开始优化')
      })

      // 5. afterSeal - 优化完成
      compilation.hooks.afterSeal.tap('MyPlugin', () => {
        console.log('优化完成')
      })

      // 6. optimizeChunks - 优化 chunks
      compilation.hooks.optimizeChunks.tap('MyPlugin', (chunks) => {
        console.log('优化 chunks，共', chunks.size, '个')
      })
    })
  }
}
```

### 2.8 实战案例 1：自定义 HTML Plugin

```javascript
// plugins/simple-html-plugin.js
const fs = require('fs')
const path = require('path')

class SimpleHtmlPlugin {
  constructor(options) {
    this.options = {
      filename: 'index.html',
      template: null,
      ...options
    }
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync('SimpleHtmlPlugin', (compilation, callback) => {
      // 获取所有的 assets（打包产物）
      const assets = compilation.assets

      // 获取所有的 js 文件
      const jsFiles = Object.keys(assets)
        .filter(name => name.endsWith('.js'))

      // 读取模板
      const template = this.options.template
        ? fs.readFileSync(this.options.template, 'utf-8')
        : `<!DOCTYPE html>
          <html>
          <head>
            <title>My App</title>
          </head>
          <body>
            <div id="root"></div>
          </body>
          </html>`

      // 生成 script 标签
      const scriptTags = jsFiles
        .map(file => `<script src="${file}"></script>`)
        .join('\n')

      // 注入到 HTML 中
      const html = template.replace(
        '</body>',
        `${scriptTags}\n</body>`
      )

      // 添加到产物中
      compilation.assets[this.options.filename] = {
        source() {
          return html
        },
        size() {
          return html.length
        }
      }

      callback()
    })
  }
}

module.exports = SimpleHtmlPlugin

// 使用
// webpack.config.js
const SimpleHtmlPlugin = require('./plugins/simple-html-plugin')

module.exports = {
  plugins: [
    new SimpleHtmlPlugin({
      filename: 'index.html',
      template: './src/index.html'
    })
  ]
}
```

### 2.9 实战案例 2：自定义文件大小监控 Plugin

```javascript
// plugins/file-size-monitor-plugin.js
class FileSizeMonitorPlugin {
  constructor(options) {
    this.options = {
      limit: 500000,  // 500KB 限制
      ...options
    }
  }

  apply(compiler) {
    compiler.hooks.emit.tap('FileSizeMonitorPlugin', (compilation) => {
      const { limit } = this.options
      const assets = compilation.assets

      console.log('\n文件大小报告：')
      console.log('================')

      Object.entries(assets).forEach(([filename, asset]) => {
        const size = asset.size()
        const sizeKb = (size / 1024).toFixed(2)

        // 如果超过限制，发出警告
        if (size > limit) {
          compilation.warnings.push(
            new Error(`${filename} (${sizeKb}KB) 超过限制 (${(limit / 1024).toFixed(2)}KB)`)
          )
          console.log(`❌ ${filename}: ${sizeKb}KB`)
        } else {
          console.log(`✓ ${filename}: ${sizeKb}KB`)
        }
      })

      console.log('================\n')
    })
  }
}

module.exports = FileSizeMonitorPlugin
```

### 2.10 实战案例 3：自定义编译时间统计 Plugin

```javascript
// plugins/compile-time-plugin.js
class CompileTimePlugin {
  apply(compiler) {
    let startTime

    compiler.hooks.compile.tap('CompileTimePlugin', () => {
      startTime = Date.now()
    })

    compiler.hooks.done.tap('CompileTimePlugin', (stats) => {
      const duration = Date.now() - startTime

      console.log('\n编译统计：')
      console.log('================')
      console.log(`总编译时间: ${duration}ms`)
      console.log(`模块总数: ${stats.compilation.modules.size}`)
      console.log(`Chunks 数: ${stats.compilation.chunks.size}`)
      console.log(`Assets 数: ${Object.keys(stats.compilation.assets).length}`)

      // 警告和错误统计
      if (stats.compilation.warnings.length) {
        console.log(`⚠️  警告: ${stats.compilation.warnings.length} 个`)
      }
      if (stats.compilation.errors.length) {
        console.log(`❌ 错误: ${stats.compilation.errors.length} 个`)
      }

      console.log('================\n')
    })
  }
}

module.exports = CompileTimePlugin
```

### 2.11 实战案例 4：自定义环境变量注入 Plugin

```javascript
// plugins/inject-env-plugin.js
class InjectEnvPlugin {
  constructor(env) {
    this.env = env
  }

  apply(compiler) {
    // 使用 DefinePlugin 的方式
    const webpack = require('webpack')

    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(this.env),
      'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
      'process.env.BUILD_VERSION': JSON.stringify(require('../package.json').version)
    }).apply(compiler)
  }
}

module.exports = InjectEnvPlugin
```

### 2.12 实战案例 5：自定义产物分析 Plugin

```javascript
// plugins/assets-analysis-plugin.js
class AssetsAnalysisPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('AssetsAnalysisPlugin', (compilation) => {
      const assets = compilation.assets
      const analysis = {
        total: 0,
        js: { count: 0, size: 0 },
        css: { count: 0, size: 0 },
        image: { count: 0, size: 0 },
        other: { count: 0, size: 0 }
      }

      Object.entries(assets).forEach(([filename, asset]) => {
        const size = asset.size()
        analysis.total += size

        if (filename.endsWith('.js')) {
          analysis.js.count++
          analysis.js.size += size
        } else if (filename.endsWith('.css')) {
          analysis.css.count++
          analysis.css.size += size
        } else if (/\.(png|jpg|gif|svg)$/.test(filename)) {
          analysis.image.count++
          analysis.image.size += size
        } else {
          analysis.other.count++
          analysis.other.size += size
        }
      })

      // 生成报告
      const report = `
================
产物分析报告
================
总大小: ${(analysis.total / 1024 / 1024).toFixed(2)}MB

JavaScript:
  文件数: ${analysis.js.count}
  总大小: ${(analysis.js.size / 1024).toFixed(2)}KB

CSS:
  文件数: ${analysis.css.count}
  总大小: ${(analysis.css.size / 1024).toFixed(2)}KB

Image:
  文件数: ${analysis.image.count}
  总大小: ${(analysis.image.size / 1024).toFixed(2)}KB

Other:
  文件数: ${analysis.other.count}
  总大小: ${(analysis.other.size / 1024).toFixed(2)}KB
================
      `

      console.log(report)

      // 写入报告文件
      compilation.assets['ANALYSIS_REPORT.txt'] = {
        source() { return report },
        size() { return report.length }
      }
    })
  }
}

module.exports = AssetsAnalysisPlugin
```

---

## 第三章：Webpack API 详解

### 3.1 Compiler API

```javascript
// Compiler 实例上的常用属性和方法

class MyPlugin {
  apply(compiler) {
    // 属性
    compiler.options      // Webpack 配置对象
    compiler.context      // 项目根目录
    compiler.hooks        // 所有的钩子
    compiler.inputFileSystem  // 文件系统接口
    compiler.outputFileSystem // 输出文件系统接口
    compiler._plugins     // 已加载的插件

    // 方法
    compiler.run((err, stats) => {})        // 开始编译
    compiler.watch({}, (err, stats) => {})  // 监听编译
    compiler.watchFileSystem                 // 文件监听系统
  }
}
```

### 3.2 Compilation API

```javascript
class MyPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('MyPlugin', (compilation) => {
      // 属性
      compilation.assets         // 输出产物
      compilation.chunks         // 所有的 chunks
      compilation.modules        // 所有的模块
      compilation.errors         // 编译错误
      compilation.warnings       // 编译警告
      compilation.name           // 编译名称
      compilation.hash           // 编译 hash

      // 方法
      compilation.getPath(filename)  // 获取输出路径
      compilation.createAsset(name, asset)  // 创建 asset
      compilation.emitAsset(name, asset)    // 发射 asset
    })
  }
}
```

### 3.3 Asset 对象

Asset 代表一个输出文件：

```javascript
class MyPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('MyPlugin', (compilation) => {
      // Asset 有两个方法：source() 和 size()
      const assets = compilation.assets

      // 读取 asset
      Object.entries(assets).forEach(([filename, asset]) => {
        const content = asset.source()    // 获取内容
        const size = asset.size()         // 获取大小
      })

      // 创建 asset
      compilation.assets['new-file.txt'] = {
        source() {
          return 'Hello World'
        },
        size() {
          return 11
        }
      }

      // 修改现有 asset
      const oldAsset = assets['main.js']
      const oldContent = oldAsset.source()
      const newContent = '/* Modified */\n' + oldContent

      assets['main.js'] = {
        source() {
          return newContent
        },
        size() {
          return newContent.length
        }
      }

      // 删除 asset
      delete assets['unwanted-file.js']
    })
  }
}
```

### 3.4 Chunk 和 Module

**Chunk：** 打包的产物单位，通常对应一个 `.js` 文件

```javascript
compilation.chunks  // Set<Chunk>

// 遍历 chunks
compilation.chunks.forEach(chunk => {
  chunk.name              // chunk 名称
  chunk.id                // chunk id
  chunk.hash              // chunk hash
  chunk.contentHash       // 内容 hash
  chunk.modules           // chunk 包含的模块
  chunk.files             // chunk 生成的文件
})
```

**Module：** 源代码的一个模块（一个文件）

```javascript
compilation.modules  // Set<Module>

// 遍历 modules
compilation.modules.forEach(module => {
  module.name               // 模块名称
  module.resource           // 模块的文件路径
  module.dependencies       // 模块的依赖
  module.type               // 模块类型
  module.originalSource()   // 原始源代码
  module.source()           // 处理后的源代码
})
```

---

## 第四章：高级 Plugin 开发模式

### 4.1 Plugin 的设计模式

**模式 1：修改打包产物**

```javascript
class ModifyAssetPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('ModifyAssetPlugin', (compilation) => {
      // 遍历所有产物，进行修改
      Object.entries(compilation.assets).forEach(([name, asset]) => {
        if (name.endsWith('.js')) {
          const content = asset.source()
          const modified = content + '\n/* Modified by plugin */'

          compilation.assets[name] = {
            source() { return modified },
            size() { return modified.length }
          }
        }
      })
    })
  }
}
```

**模式 2：添加新的产物**

```javascript
class AddNewAssetPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('AddNewAssetPlugin', (compilation) => {
      // 添加新的产物文件
      const manifest = {
        version: '1.0.0',
        files: Object.keys(compilation.assets),
        time: new Date().toISOString()
      }

      compilation.assets['manifest.json'] = {
        source() {
          return JSON.stringify(manifest, null, 2)
        },
        size() {
          return JSON.stringify(manifest).length
        }
      }
    })
  }
}
```

**模式 3：监听编译过程**

```javascript
class MonitorPlugin {
  apply(compiler) {
    // 记录编译的各个阶段
    const startTime = {}

    compiler.hooks.compile.tap('MonitorPlugin', () => {
      startTime.compile = Date.now()
    })

    compiler.hooks.compilation.tap('MonitorPlugin', (compilation) => {
      compilation.hooks.seal.tap('MonitorPlugin', () => {
        const duration = Date.now() - startTime.compile
        console.log(`编译耗时: ${duration}ms`)
      })
    })

    compiler.hooks.done.tap('MonitorPlugin', (stats) => {
      console.log('总编译耗时:', stats.endTime - stats.startTime)
    })
  }
}
```

**模式 4：条件式执行**

```javascript
class ConditionalPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    // 根据条件执行
    if (this.options.enabled === false) return

    compiler.hooks.done.tap('ConditionalPlugin', () => {
      console.log('Plugin 已执行')
    })
  }
}
```

### 4.2 Plugin 的访问和修改模块

```javascript
class ModuleAnalysisPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('ModuleAnalysisPlugin', (compilation) => {
      // 访问所有模块
      compilation.hooks.seal.tap('ModuleAnalysisPlugin', () => {
        const analysis = {}

        compilation.modules.forEach(module => {
          const path = module.resource

          if (!path) return

          analysis[path] = {
            size: module.size(),
            dependencies: Array.from(module.dependencies || [])
              .map(d => d.module?.resource)
              .filter(Boolean)
          }
        })

        // 输出分析结果
        console.log('模块分析：')
        console.log(JSON.stringify(analysis, null, 2))
      })
    })
  }
}
```

### 4.3 Plugin 的错误处理

```javascript
class SafePlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('SafePlugin', (compilation) => {
      try {
        // 可能出错的操作
        Object.entries(compilation.assets).forEach(([name, asset]) => {
          if (!asset || !asset.source) {
            throw new Error(`Asset ${name} 无效`)
          }
        })
      } catch (error) {
        // 添加到编译错误中
        compilation.errors.push(
          new Error(`SafePlugin 出错: ${error.message}`)
        )
      }
    })
  }
}
```

---

## 第五章：实战项目：打包分析工具

把前面学的所有知识整合起来，开发一个真实的打包分析工具：

```javascript
// plugins/bundle-analyzer-plugin.js
class BundleAnalyzerPlugin {
  constructor(options) {
    this.options = {
      outputPath: './analysis',
      ...options
    }
  }

  apply(compiler) {
    compiler.hooks.emit.tap('BundleAnalyzerPlugin', (compilation) => {
      // 第 1 步：收集数据
      const analysis = {
        timestamp: new Date().toISOString(),
        assets: {},
        chunks: {},
        modules: {},
        summary: {}
      }

      // 分析 assets
      Object.entries(compilation.assets).forEach(([filename, asset]) => {
        const size = asset.size()
        analysis.assets[filename] = {
          size,
          sizeKb: (size / 1024).toFixed(2),
          type: this._getFileType(filename)
        }
      })

      // 分析 chunks
      compilation.chunks.forEach(chunk => {
        analysis.chunks[chunk.name || chunk.id] = {
          size: chunk.size,
          modules: Array.from(chunk.modules).length,
          files: Array.from(chunk.files)
        }
      })

      // 分析 modules
      const moduleMap = {}
      compilation.modules.forEach(module => {
        if (module.resource) {
          moduleMap[module.resource] = {
            size: module.size(),
            dependencies: this._getModuleDependencies(module)
          }
        }
      })

      // 排序并取前 10 个最大的模块
      analysis.modules = Object.entries(moduleMap)
        .sort((a, b) => b[1].size - a[1].size)
        .slice(0, 10)
        .reduce((obj, [key, value]) => {
          obj[key] = value
          return obj
        }, {})

      // 计算统计
      analysis.summary = {
        totalAssets: Object.keys(analysis.assets).length,
        totalSize: Object.values(analysis.assets)
          .reduce((sum, asset) => sum + asset.size, 0),
        jsSize: Object.values(analysis.assets)
          .filter(a => a.type === 'js')
          .reduce((sum, a) => sum + a.size, 0),
        cssSize: Object.values(analysis.assets)
          .filter(a => a.type === 'css')
          .reduce((sum, a) => sum + a.size, 0),
        totalModules: compilation.modules.size
      }

      // 第 2 步：生成报告
      const report = this._generateReport(analysis)

      // 第 3 步：添加到产物
      compilation.assets['BUNDLE_ANALYSIS.txt'] = {
        source() { return report },
        size() { return report.length }
      }

      // 第 4 步：输出到文件（如果配置了）
      if (this.options.outputPath) {
        this._saveToFile(analysis)
      }

      console.log(report)
    })
  }

  _getFileType(filename) {
    if (filename.endsWith('.js')) return 'js'
    if (filename.endsWith('.css')) return 'css'
    if (/\.(png|jpg|gif)/.test(filename)) return 'image'
    return 'other'
  }

  _getModuleDependencies(module) {
    if (!module.dependencies) return []
    return Array.from(module.dependencies)
      .map(dep => dep.module?.resource)
      .filter(Boolean)
  }

  _generateReport(analysis) {
    const { assets, summary, modules } = analysis

    let report = `
=====================================
         Bundle Analysis Report
=====================================
Generated: ${analysis.timestamp}

SUMMARY
-------
Total Assets: ${summary.totalAssets}
Total Size: ${(summary.totalSize / 1024 / 1024).toFixed(2)}MB
  - JavaScript: ${(summary.jsSize / 1024).toFixed(2)}KB
  - CSS: ${(summary.cssSize / 1024).toFixed(2)}KB
Total Modules: ${summary.totalModules}

TOP 10 LARGEST MODULES
----------------------
`

    Object.entries(modules).forEach(([name, module], idx) => {
      report += `${idx + 1}. ${name}\n`
      report += `   Size: ${module.size}B (${(module.size / 1024).toFixed(2)}KB)\n`
    })

    report += `

ALL ASSETS
----------
`

    Object.entries(assets).forEach(([name, asset]) => {
      report += `${name}: ${asset.sizeKb}KB\n`
    })

    report += `
=====================================
    `

    return report
  }

  _saveToFile(analysis) {
    const fs = require('fs')
    const path = require('path')

    const dir = this.options.outputPath
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(
      path.join(dir, 'bundle-analysis.json'),
      JSON.stringify(analysis, null, 2)
    )
  }
}

module.exports = BundleAnalyzerPlugin
```

---

## 总结

### Plugin 和 Loader 的对比

| 特性 | Loader | Plugin |
|------|--------|--------|
| **本质** | 函数 | 类 |
| **作用范围** | 单个文件 | 整个编译过程 |
| **入口** | module.exports | apply(compiler) |
| **参数** | 文件内容 source | compiler 对象 |
| **修改方式** | 返回转换后的内容 | 通过钩子修改产物 |
| **执行时机** | 文件被导入时 | 编译的特定阶段 |

### 何时使用 Loader，何时使用 Plugin？

**使用 Loader 当：**
- 需要转换特定类型的文件
- 需要处理文件内容本身

**使用 Plugin 当：**
- 需要在编译流程中插入逻辑
- 需要修改、添加产物
- 需要监控编译过程

### 最佳实践

1. **Plugin：** 使用 tapAsync 或 tapPromise，避免阻塞
2. **Loader：** 标记可缓存，处理错误正确
3. **都要：** 参数验证、错误处理、文档完善

加油！🚀