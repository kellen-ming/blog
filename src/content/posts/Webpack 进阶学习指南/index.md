---
title: Webpack 进阶学习指南
published: 2026-01-27
description: 'Webpack 进阶内容深度解析，涵盖模块系统、代码分割、热更新、构建分析、Webpack 5 新特性、高级配置技巧和性能优化案例。适合已掌握 Webpack 基础知识的开发者深入学习。'
image: ''
tags: ['webpack', '打包工具', '前端', '构建工具', '代码分割', 'HMR', '性能优化']
category: '前端'
draft: false 
lang: 'zh'
---
# Webpack 进阶学习指南

> 本文档是 Webpack 的进阶内容，假设你已经掌握了基础篇的知识点。
> 这里我们深入探讨模块系统、代码分割、热更新等高级特性。

---

## 第一章：深入理解模块系统（Module）

### 什么是模块？

在 Webpack 中，**一切皆模块**。不仅是 JavaScript 文件，CSS、图片、字体都可以是模块。

模块的作用：
- 代码隔离（不污染全局作用域）
- 依赖管理（明确表示依赖关系）
- 复用（可被多个地方引入）

### JavaScript 的两种模块系统

Webpack 需要理解两种模块标准：CommonJS 和 ES6 Module。

#### CommonJS（Node.js 标准）

```javascript
// 导出
module.exports = {
  name: 'utils',
  add: (a, b) => a + b
}

// 或者
exports.add = (a, b) => a + b

// 导入
const utils = require('./utils')
utils.add(1, 2)
```

**特点：**
- 运行时加载（require 时才执行）
- 同步加载（必须等待加载完成）
- 值的复制（导出的是值的拷贝）

```javascript
// utils.js
let count = 0
module.exports = {
  count: count,
  increment: () => { count++ }
}

// app.js
const utils = require('./utils')
console.log(utils.count)  // 0
utils.increment()
console.log(utils.count)  // 还是 0，因为是值的复制
```

#### ES6 Module（标准模块系统）

```javascript
// 导出
export const add = (a, b) => a + b

// 或者
const add = (a, b) => a + b
export { add }

// 默认导出
export default {
  name: 'utils'
}

// 导入
import { add } from './utils'
import utils from './utils'
import * as allUtils from './utils'
```

**特点：**
- 编译时加载（import 时进行解析）
- 异步加载（可以异步导入）
- 动态绑定（导出的是引用）

```javascript
// utils.js
export let count = 0
export const increment = () => { count++ }

// app.js
import { count, increment } from './utils'
console.log(count)  // 0
increment()
console.log(count)  // 1，因为是引用关系
```

### Webpack 如何处理模块？

Webpack 把所有模块转成一个大对象，每个模块对应一个函数。

```javascript
// 源代码
// utils.js
export const add = (a, b) => a + b

// app.js
import { add } from './utils'
console.log(add(1, 2))

// 打包后的伪代码
(function(modules) {
  // 模块缓存
  var installedModules = {}
  
  // 模块加载函数
  function __webpack_require__(moduleId) {
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports
    }
    var module = installedModules[moduleId] = {
      id: moduleId,
      loaded: false,
      exports: {}
    }
    modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__
    )
    module.loaded = true
    return module.exports
  }
  
  return __webpack_require__('main')
})({
  './utils.js': function(module, exports, __webpack_require__) {
    exports.add = (a, b) => a + b
  },
  './app.js': function(module, exports, __webpack_require__) {
    const { add } = __webpack_require__('./utils.js')
    console.log(add(1, 2))
  }
})
```

**关键点：**
- Webpack 使用 `__webpack_require__` 来管理模块依赖
- 每个模块是一个函数，有独立的作用域
- 模块有缓存，重复导入同一模块只执行一次

### 模块的解析规则

Webpack 按这个顺序解析模块：

```javascript
// 1. 相对路径
import utils from './utils'      // 搜索 ./utils.js
import utils from '../utils'     // 搜索 ../utils.js

// 2. 绝对路径
import utils from '/home/user/utils'  // 直接使用绝对路径

// 3. 模块名（node_modules）
import lodash from 'lodash'      // 搜索 node_modules/lodash

// 4. resolve.alias 别名
import utils from '@/utils'      // 搜索 src/utils
```

**配置补充文件扩展名：**

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    extensions: ['.js', '.json', '.jsx', '.ts', '.tsx']
  }
}

// 现在可以这样写
import Button from './Button'  // 会自动尝试 Button.js、Button.jsx 等
```

---

## 第二章：代码分割（Code Splitting）详解

### 为什么需要代码分割？

假设你的项目包含：
- 业务代码：100KB
- React：150KB
- Lodash：50KB
- 总计：300KB

如果打成一个 bundle，用户第一次加载需要下载 300KB。但是：
- React 几个月才更新一次
- Lodash 可能永远不更新
- 只有业务代码经常变化

**代码分割的好处：**
1. 减少首屏加载体积
2. 利用浏览器缓存（不经常变的代码被缓存）
3. 按需加载（用户只加载需要的代码）

### 代码分割的三种方式

#### 方式 1：Entry Points（入口分割）

```javascript
module.exports = {
  entry: {
    main: './src/index.js',
    admin: './src/admin.js'
  },
  output: {
    filename: '[name].js'
  }
}

// 打包结果：
// main.js (业务代码)
// admin.js (管理后台代码)
```

**缺点：**
- 如果两个入口都引入 React，React 会被打包两次
- 需要手动管理入口

#### 方式 2：防止重复（SplitChunks）

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // 提取第三方库
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        // 提取公共代码
        common: {
          minChunks: 2,    // 被至少 2 个 chunk 使用
          priority: 5,
          reuseExistingChunk: true
        }
      }
    }
  }
}

// 打包结果：
// vendors.js (React、Lodash 等第三方库)
// main.js (业务代码)
// admin.js (管理后台代码)
```

**原理：**

```
入口 1 (main.js)
  ├─ React
  ├─ Lodash
  └─ 业务代码 A

入口 2 (admin.js)
  ├─ React
  ├─ Lodash
  └─ 业务代码 B

分割后：
  vendors.js (React + Lodash，被两个入口共用)
  main.js (业务代码 A)
  admin.js (业务代码 B)

这样 React 只被打包一次！
```

#### 方式 3：动态导入（Dynamic Import）

```javascript
// 路由懒加载的常见用法
import React from 'react'
import { BrowserRouter, Route } from 'react-router-dom'

const Home = React.lazy(() => import('./pages/Home'))
const About = React.lazy(() => import('./pages/About'))
const Contact = React.lazy(() => import('./pages/Contact'))

export default function App() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<div>Loading...</div>}>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
      </React.Suspense>
    </BrowserRouter>
  )
}

// 打包结果：
// main.js (入口代码，包含 React 和路由配置)
// Home.js (在用户访问 / 时才加载)
// About.js (在用户访问 /about 时才加载)
// Contact.js (在用户访问 /contact 时才加载)
```

**原理：**

```javascript
// import() 会转成 Webpack 的 require.ensure()
// 浏览器在需要时动态加载脚本

// 用户访问 / → 加载 Home.js
// 用户访问 /about → 加载 About.js
```

### SplitChunks 深度配置

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      // 应用于哪些 chunk
      // 'initial': 只应用于入口 chunk
      // 'async': 只应用于异步 chunk
      // 'all': 应用于所有 chunk
      chunks: 'all',

      // 最小 chunk 大小（字节）
      minSize: 20000,

      // 最小重用次数
      minChunks: 1,

      // 最大异步加载 chunk 数
      maxAsyncRequests: 30,

      // 最大初始加载 chunk 数
      maxInitialRequests: 30,

      // 缓存组
      cacheGroups: {
        // 优先级高的 cacheGroup
        vendor: {
          // 匹配条件
          test: /[\\/]node_modules[\\/]/,

          // chunk 名
          name: 'vendors',

          // 优先级（越高越先匹配）
          priority: 10,

          // 强制提取（即使不满足其他条件）
          enforce: true,

          // 是否复用已有 chunk
          reuseExistingChunk: true
        },

        // 优先级低的 cacheGroup
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          name: 'common'
        }
      }
    },

    // 提取 Webpack 运行时代码
    runtimeChunk: {
      name: 'runtime'
    }
  }
}

// 打包结果：
// vendors.js (第三方库)
// common.js (公共业务代码)
// main.js (业务代码)
// runtime.js (Webpack 运行时)
```

### 为什么需要提取 runtimeChunk？

```javascript
// 不提取 runtimeChunk：
// Webpack 的运行时代码被打包到 main.js 中
// 当 vendors.js 内容改变时，main.js 的 hash 也会改变
// 用户需要重新下载 main.js（虽然它的业务代码没变）

// 提取 runtimeChunk：
// 运行时代码单独成一个文件
// vendors.js 改变只影响 vendors.js 的 hash
// main.js 的 hash 不变，用户可以使用缓存
```

### 实战配置：最佳实践

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // React、Vue 等框架
        frameworks: {
          test: /[\\/]node_modules[\\/](react|react-dom|vue)[\\/]/,
          name: 'frameworks',
          priority: 40
        },

        // 其他第三方库
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 20
        },

        // 项目中的公共代码（被引入多次）
        common: {
          minChunks: 2,
          priority: 10,
          reuseExistingChunk: true,
          name: 'common'
        }
      }
    },

    runtimeChunk: 'single'  // 运行时代码提取
  }
}

// 打包结果：
// frameworks.js (React/Vue)
// vendors.js (其他第三方库)
// common.js (公共业务代码)
// main.js (业务代码)
// runtime.js (运行时)
```

---

## 第三章：热更新（Hot Module Replacement）详解

### 什么是 HMR？

Hot Module Replacement 是开发时的功能：代码改变时，浏览器不刷新，直接更新改变的模块。

**没有 HMR：**
```
1. 修改代码
2. Webpack 重新编译
3. 浏览器刷新整个页面
4. 应用重新初始化（丧失页面状态）
```

**有 HMR：**
```
1. 修改代码
2. Webpack 增量编译
3. Webpack Dev Server 推送更新
4. 浏览器只更新改变的模块
5. 应用保留页面状态
```

### HMR 的工作原理

```
Webpack Dev Server
      ↓
      ├─ 监听文件变化
      ├─ 重新编译
      ├─ 生成更新信息（manifest 和 chunk）
      └─ 通过 WebSocket 推送给浏览器
      
浏览器
      ↓
      ├─ 接收更新信息
      ├─ 下载新的 chunk
      ├─ 调用 module.hot.accept()
      ├─ 卸载旧模块
      └─ 加载新模块（保留应用状态）
```

### 启用 HMR

```javascript
// webpack.config.js
module.exports = {
  devServer: {
    // 启用 HMR
    hot: true,

    // 如果 HMR 失败，自动刷新页面
    liveReload: true
  }
}
```

### 手动处理模块更新

在某些情况下，你需要告诉 Webpack 怎样处理模块更新。

```javascript
// app.js
import Button from './components/Button'

// 默认情况下，Button 改变时页面会刷新
// 如果你想保留应用状态，需要手动处理

if (module.hot) {
  module.hot.accept('./components/Button', () => {
    // Button 被更新时执行这里
    // 重新渲染应用
    renderApp()
  })
}

function renderApp() {
  // 重新渲染整个应用
  ReactDOM.render(<App />, document.getElementById('root'))
}
```

### React 中使用 HMR

```javascript
// 在 Create React App 或 Vite 中，已经内置了 HMR
// 通常无需手动配置

// 如果用 Webpack，可以使用 @pmmmwh/react-refresh-webpack-plugin

const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

module.exports = {
  devServer: {
    hot: true
  },

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ['react-refresh/babel']
          }
        }
      }
    ]
  },

  plugins: [
    new ReactRefreshWebpackPlugin()
  ]
}
```

### CSS 的 HMR

使用 style-loader 时，CSS 变化会自动热更新（因为 style-loader 有内置 HMR 支持）。

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
        // style-loader 已经内置 HMR，无需配置
      }
    ]
  }
}

// CSS 修改时，会直接更新 <style> 标签内容，不需要刷新页面
```

使用 MiniCssExtractPlugin 时，HMR 支持有限（因为是生成独立文件），建议开发时使用 style-loader，生产时再用 MiniCssExtractPlugin。

```javascript
const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  }
}
```

---

## 第四章：构建分析与监控

### 分析打包结果

#### 1. 使用 webpack-bundle-analyzer

```javascript
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'report.html',
      openAnalyzer: false
    })
  ]
}

// 打包后在 report.html 可以看到可视化报告
// 可以识别出哪些模块最大
```

#### 2. 使用 speed-measure-webpack-plugin

```javascript
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const smp = new SpeedMeasurePlugin()

module.exports = smp.wrap({
  // webpack 配置
})

// 打包后会看到每个 loader 和 plugin 花费的时间
```

#### 3. 使用 Webpack 内置的统计信息

```bash
webpack --profile --json > stats.json

# 然后用在线工具分析：
# http://webpack.github.io/analyse/
```

### 监控构建过程

```javascript
// webpack.config.js
const ProgressPlugin = require('webpack/lib/ProgressPlugin')

module.exports = {
  plugins: [
    new ProgressPlugin((percentage, message) => {
      console.log(`${(percentage * 100).toFixed(2)}% ${message}`)
    })
  ]
}

// 输出示例：
// 0.00% compiling
// 10.00% building modules
// 20.00% sealing
// ...
```

### 性能监控

```javascript
module.exports = {
  performance: {
    // 入口 chunk 最大大小（字节）
    maxEntrypointSize: 512000,

    // 单个 chunk 最大大小（字节）
    maxAssetSize: 512000,

    // 超过限制时的提示方式
    hints: 'warning'  // 'warning' | 'error' | false
  }
}

// 如果超过限制，Webpack 会在打包时给出警告
// WARNING in ...
// The following asset(s) exceed the recommended size limit (512 KB).
```

---

## 第五章：Webpack 5 新特性

### 1. 资源模块（Asset Module）

Webpack 4 需要用 file-loader、url-loader 等处理资源。Webpack 5 内置了资源模块系统。

```javascript
// Webpack 4
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg)$/,
        use: {
          loader: 'file-loader',
          options: { name: '[name].[hash:8][ext]' }
        }
      }
    ]
  }
}

// Webpack 5
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg)$/,
        type: 'asset/resource',
        generator: {
          filename: '[name].[hash:8][ext]'
        }
      }
    ]
  }
}
```

资源模块的四种类型：

```javascript
// asset/resource：文件资源（相当于 file-loader）
{ test: /\.png$/, type: 'asset/resource' }

// asset/inline：内联资源（相当于 url-loader）
{ test: /\.svg$/, type: 'asset/inline' }

// asset/source：源代码资源（相当于 raw-loader）
{ test: /\.txt$/, type: 'asset/source' }

// asset：自动选择（相当于 url-loader + file-loader）
{
  test: /\.(png|jpg)$/,
  type: 'asset',
  parser: {
    dataUrlCondition: {
      maxSize: 8 * 1024  // 小于 8KB 用 inline，否则用 resource
    }
  }
}
```

### 2. 缓存（Cache）

Webpack 5 有强大的缓存机制，二次构建会快很多。

```javascript
module.exports = {
  cache: {
    type: 'filesystem'  // 使用文件系统缓存
  }
}

// 或者更详细的配置
cache: {
  type: 'filesystem',
  cacheDirectory: path.resolve(__dirname, '.webpack_cache'),
  buildDependencies: {
    config: [__filename]
  }
}

// 缓存文件存储在 node_modules/.cache 目录
// 如果源文件没变，二次构建会直接使用缓存
```

### 3. 模块联邦（Module Federation）

允许多个独立的构建可以形成一个应用。这是微前端的基础。

```javascript
// 应用 A（提供者）
// webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'app_a',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/components/Button'
      }
    })
  ]
}

// 应用 B（消费者）
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      remotes: {
        app_a: 'app_a@http://localhost:3001/remoteEntry.js'
      }
    })
  ]
}

// 在应用 B 中使用应用 A 的组件
import Button from 'app_a/Button'
```

### 4. Top Level Await

在 ES modules 中支持顶级 await。

```javascript
// 不需要 async 包装
const data = await fetch('/api/data').then(r => r.json())

// 这样会自动转成异步 module，导入时需要处理
```

### 5. Tree Shaking 改进

Webpack 5 的 Tree Shaking 更加精确。

```javascript
// 可以精确识别副作用
// webpack.config.js
module.exports = {
  mode: 'production',  // Tree Shaking 需要生产模式
  optimization: {
    usedExports: true,  // 标记未使用的导出
    minimize: true      // 删除未使用的代码
  }
}

// package.json 中标记无副作用的包
{
  "sideEffects": false  // 所有文件都没有副作用
}

// 或者指定有副作用的文件
{
  "sideEffects": ["./src/styles/**/*"]
}
```

### 6. 长期缓存优化

Webpack 5 改进了产物的稳定性，方便长期缓存。

```javascript
module.exports = {
  output: {
    filename: '[name].[contenthash:8].js',  // 使用 contenthash
    chunkFilename: '[name].[contenthash:8].js'
  },

  optimization: {
    runtimeChunk: 'single',  // 运行时单独输出
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        }
      }
    }
  }
}

// 这样同样内容的文件永远有同样的 hash
// 不会因为 Webpack 版本或构建顺序改变
```

---

## 第六章：高级配置技巧

### 1. 条件编译

根据环境变量提供不同的代码。

```javascript
// webpack.config.js
const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.IS_DEV': JSON.stringify(isDev),
      'process.env.API_URL': JSON.stringify(
        isDev ? 'http://localhost:3000' : 'https://api.example.com'
      )
    })
  ]
}

// 你的代码
if (process.env.IS_DEV) {
  console.log('开发环境')
}

// 打包时会被替换成实际值
// 生产环境这段代码会被删除（Tree Shaking）
```

### 2. 构建时注入版本号

```javascript
const webpack = require('webpack')
const pkg = require('./package.json')

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.APP_VERSION': JSON.stringify(pkg.version),
      'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString())
    })
  ]
}

// 代码中可以显示版本和构建时间
console.log(`App v${process.env.APP_VERSION}`)
console.log(`Built at ${process.env.BUILD_TIME}`)
```

### 3. 多个打包目标

可以同时生成多个目标的产物。

```javascript
module.exports = [
  {
    name: 'web',
    target: 'web',
    entry: './src/index.js',
    output: {
      filename: 'web.js'
    }
  },
  {
    name: 'node',
    target: 'node',
    entry: './src/server.js',
    output: {
      filename: 'server.js'
    }
  }
]

// 打包时会同时生成 web.js 和 server.js
```

### 4. 自定义 Loader

```javascript
// loaders/my-loader.js
module.exports = function(source) {
  // source 是文件内容
  
  // 对内容进行转换
  const result = source.replace(/foo/g, 'bar')
  
  // 返回转换后的内容
  return result
}

// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: './loaders/my-loader.js'
      }
    ]
  }
}
```

### 5. 自定义 Plugin

```javascript
// plugins/my-plugin.js
class MyPlugin {
  apply(compiler) {
    // 监听 compiler 的钩子
    compiler.hooks.emit.tapAsync('MyPlugin', (compilation, callback) => {
      // compilation 包含了所有打包信息
      
      // 修改产物
      Object.keys(compilation.assets).forEach(filename => {
        console.log(`输出文件：${filename}`)
      })
      
      callback()
    })
  }
}

module.exports = MyPlugin

// webpack.config.js
const MyPlugin = require('./plugins/my-plugin')

module.exports = {
  plugins: [
    new MyPlugin()
  ]
}
```

---

## 第七章：常见问题解答

### Q1：为什么代码分割后，首屏加载时间更长了？

**原因：** 可能分割得过细，发送了太多请求。

**解决方案：**
```javascript
optimization: {
  splitChunks: {
    minSize: 50000,  // 增加最小 chunk 大小
    maxAsyncRequests: 5,  // 减少并行请求数
    maxInitialRequests: 3  // 减少初始请求数
  }
}
```

### Q2：为什么更新了代码，但浏览器还是显示旧的？

**原因：** 浏览器缓存了旧产物。

**解决方案：**
```javascript
output: {
  filename: '[name].[contenthash:8].js'  // 使用 contenthash
}

// 内容改变 → hash 改变 → 文件名改变 → 浏览器加载新文件
// 内容不变 → hash 不变 → 文件名不变 → 浏览器使用缓存
```

### Q3：HMR 不工作怎么办？

**常见原因和解决方案：**

```javascript
// 1. 检查 devServer 配置
devServer: {
  hot: true,  // 必须启用
  port: 3000
}

// 2. 检查浏览器控制台是否有错误
// 如果 WebSocket 连接失败，可能是代理或防火墙问题

// 3. 手动处理模块更新
if (module.hot) {
  module.hot.accept()
}

// 4. 清除浏览器缓存并重启开发服务器
```

### Q4：动态导入的 chunk 没有被加载怎么办？

**原因：** publicPath 配置不对。

**解决方案：**
```javascript
output: {
  publicPath: '/'  // 必须正确配置
}

// 如果应用部署在子目录
output: {
  publicPath: '/app/'  // 子目录路径
}
```

### Q5：如何调试打包过程？

```javascript
// 设置调试环境变量
// package.json
{
  "scripts": {
    "debug": "node --inspect-brk ./node_modules/.bin/webpack"
  }
}

// 然后在 Chrome DevTools 中调试
```

---

## 第八章：性能优化案例

### 案例 1：大型 React 应用优化

```javascript
// 现状：首屏加载 5MB，2 秒才能渲染

module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // React 框架
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          priority: 40,
          reuseExistingChunk: true
        },

        // 路由库
        router: {
          test: /[\\/]node_modules[\\/]react-router[\\/]/,
          name: 'router',
          priority: 30
        },

        // UI 库
        ui: {
          test: /[\\/]node_modules[\\/](antd|@mui)[\\/]/,
          name: 'ui',
          priority: 20
        },

        // 其他第三方库
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },

        // 项目公共代码
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },

    runtimeChunk: 'single'
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true  // 启用缓存
          }
        }
      }
    ]
  }
}

// 结果：首屏加载 1.2MB，0.8 秒渲染
// React 被缓存，不需要重新下载
```

### 案例 2：路由懒加载

```javascript
// 原来的做法：所有页面都在 main.js 中
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'

// 改进：使用路由懒加载
const Home = React.lazy(() => import('./pages/Home'))
const About = React.lazy(() => import('./pages/About'))
const Contact = React.lazy(() => import('./pages/Contact'))

// 结果：
// main.js：50KB（只包含路由配置）
// Home.js：200KB（在访问时加载）
// About.js：150KB（在访问时加载）
// Contact.js：100KB（在访问时加载）

// 用户访问主页只加载 50KB + Home.js，而不是 500KB
```

### 案例 3：库的打包优化

```javascript
// package.json
{
  "name": "my-lib",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js"
    }
  }
}

// webpack.config.js
module.exports = [
  {
    // CommonJS 版本
    entry: './src/index.js',
    output: {
      filename: 'index.js',
      libraryTarget: 'commonjs2'
    }
  },
  {
    // ES Module 版本
    entry: './src/index.js',
    output: {
      filename: 'index.esm.js',
      libraryTarget: 'es'
    }
  }
]

// 用户可以根据场景选择：
// CommonJS: const lib = require('my-lib')
// ES Module: import lib from 'my-lib'
```

---

## 总结

### 进阶篇的核心知识点

1. **Module System（模块系统）**
   - CommonJS vs ES6 Module
   - Webpack 的模块加载原理
   - 模块解析规则

2. **Code Splitting（代码分割）**
   - Entry points 分割
   - SplitChunks 防止重复
   - Dynamic import 按需加载

3. **HMR（热更新）**
   - 工作原理
   - DevServer 配置
   - 手动处理模块更新

4. **Webpack 5 新特性**
   - Asset module（资源模块）
   - Cache（文件系统缓存）
   - Module Federation（模块联邦）

5. **性能优化**
   - 构建分析工具
   - 代码分割策略
   - 缓存策略

### 下一步

完成了基础篇和进阶篇后，你已经能够：
- ✅ 理解 Webpack 的工作原理
- ✅ 配置复杂的 Webpack 项目
- ✅ 优化应用和库的打包性能
- ✅ 解决常见的 Webpack 问题

下一个文档将讲解：
- Webpack 优化与实战案例
- 从零搭建 React/Vue 项目
- Webpack 最佳实践

加油！🚀