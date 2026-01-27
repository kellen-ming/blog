---
title: Webpack 进阶篇：练习题与深化案例
published: 2026-01-27
description: 'Webpack 进阶实践指南，包含模块系统、代码分割、HMR、性能优化等主题的练习题和深化案例。通过动手实践和思考题，帮助你巩固进阶知识，提升实际项目中的 Webpack 应用能力。'
image: ''
tags: ['webpack', '打包工具', '前端', '构建工具', '练习题', '实践案例', '性能优化']
category: '前端'
draft: false 
lang: 'zh'
---
# Webpack 进阶篇：练习题与深化案例

> 这份文档包含详细的练习题、深化案例和思考题，帮助你巩固进阶知识。
> 建议边读边思考，最好能动手实践。

---

## 第一部分：模块系统深化练习

### 练习 1.1：理解模块的执行顺序

**题目：** 以下代码打包后会输出什么？

```javascript
// utils.js
console.log('utils.js executed')
export const add = (a, b) => a + b

// app.js
console.log('app.js start')
import { add } from './utils.js'
console.log('app.js end')
console.log(add(1, 2))

// main.js
console.log('main.js start')
import './app.js'
console.log('main.js end')
```

**答案和解释：**

```
输出顺序：
1. utils.js executed
2. app.js start
3. app.js end
4. 3
5. main.js start
6. main.js end

解释：
- import 是静态的，Webpack 会先处理依赖
- main.js 导入 app.js，app.js 导入 utils.js
- Webpack 会按这个顺序执行模块：utils → app → main
- 每个模块只执行一次，即使被导入多次
```

---

### 练习 1.2：CommonJS vs ES6 Module 的区别

**题目：** 以下两段代码有什么区别？

```javascript
// 版本 A：CommonJS
// counter.js
let count = 0
module.exports = {
  count: count,
  increment: () => { count++ }
}

// app.js
const counter = require('./counter.js')
console.log(counter.count)  // ?
counter.increment()
console.log(counter.count)  // ?
```

```javascript
// 版本 B：ES6 Module
// counter.js
export let count = 0
export const increment = () => { count++ }

// app.js
import { count, increment } from './counter.js'
console.log(count)  // ?
increment()
console.log(count)  // ?
```

**答案和解释：**

```javascript
// 版本 A 输出：
// 0
// 0  ← 问题！count 没有改变

// 原因：CommonJS 导出的是值的拷贝
// module.exports = { count: 0 }
// 这是值的拷贝，改变 count 不会影响导出的对象

// 版本 B 输出：
// 0
// 1  ← 正确！count 改变了

// 原因：ES6 Module 导出的是引用
// 所以 count 改变会影响导入的值
```

**深化思考：**
```javascript
// 为什么 CommonJS 导出值的拷贝？
// 因为 require() 是同步执行的，无法建立动态绑定

// 为什么 ES6 Module 导出引用？
// 因为 import 是静态的，在编译时就知道依赖关系
// 可以建立"指向原始值"的引用

// 实际代码中怎样应用这个知识？
// 1. 避免导出可变的对象
export const config = { timeout: 5000 }  // ❌ 危险，外面可以改
export const getConfig = () => ({ timeout: 5000 })  // ✅ 安全

// 2. 如果确实需要可变状态，用函数导出
export const getCount = () => count
export const increment = () => { count++ }
```

---

### 练习 1.3：循环依赖问题

**题目：** 以下代码会报错吗？为什么？

```javascript
// A.js
import { funcB } from './B.js'
export const funcA = () => funcB()

// B.js
import { funcA } from './A.js'
export const funcB = () => funcA()

// main.js
import { funcA } from './A.js'
funcA()
```

**答案和解释：**

```
会报错：TypeError: funcB is not a function

执行流程：
1. main.js 导入 funcA（来自 A.js）
2. A.js 导入 funcB（来自 B.js）
3. B.js 导入 funcA（来自 A.js）
   ↑ 此时 A.js 还没有执行完，funcA 还没被定义
4. 所以在 B.js 中，funcA 是 undefined

解决方案 1：延迟导入
// B.js
export const funcB = () => {
  const { funcA } = require('./A.js')  // 运行时导入
  return funcA()
}

解决方案 2：用中间文件打破循环
// index.js
export { funcA } from './A.js'
export { funcB } from './B.js'

// A.js
import * as all from './index.js'
export const funcA = () => all.funcB()

// B.js
import * as all from './index.js'
export const funcB = () => all.funcA()

实际项目中怎么避免？
- 重新设计代码结构，避免互相导入
- 把共用代码提取到第三个文件
```

---

### 练习 1.4：模块名解析

**题目：** Webpack 会如何解析以下 import？

```javascript
// 情景 1：相对路径
import Button from './Button'
// webpack.config.js 中 extensions: ['.js', '.jsx', '.ts']
// 会尝试：./Button.js, ./Button.jsx, ./Button.ts

// 情景 2：别名
import Button from '@/components/Button'
// webpack.config.js 中 alias: { '@': path.resolve('src') }
// 解析为：src/components/Button

// 情景 3：node_modules
import lodash from 'lodash'
// 会搜索：
// 1. node_modules/lodash/package.json 中的 main 字段
// 2. 如果 main: 'dist/lodash.js'，就加载这个文件

// 情景 4：目录导入
import utils from './utils'
// ./utils 是个目录，会搜索：
// 1. ./utils/package.json 中的 main 字段
// 2. 或 ./utils/index.js

// 问题：哪个会最快？
// 答案：情景 2（别名）最快，因为路径已经确定
//      情景 3（node_modules）可能最慢，因为要查 package.json
```

**优化建议：**

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    // 指定具体的文件扩展名（不要太多）
    extensions: ['.js', '.jsx'],  // 别加 '.json'，除非确实需要

    // 使用别名避免复杂的相对路径
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'utils': path.resolve(__dirname, 'src/utils')
    },

    // 缓存解析结果（Webpack 5 自动启用）
    cache: true
  }
}
```

---

## 第二部分：代码分割深化练习

### 练习 2.1：理解 SplitChunks 的执行

**题目：** 给定以下项目结构，Webpack 会生成什么样的 chunks？

```
src/
├── index.js       # 入口 1
├── admin.js       # 入口 2
├── utils.js       # 工具函数
├── api.js         # API 函数
└── components/
    └── Button.js

依赖关系：
- index.js 导入：React、utils、components/Button
- admin.js 导入：React、Lodash、utils、api
- utils.js 没有外部依赖
- api.js 导入：axios
- components/Button 导入：React

splitChunks 配置：
{
  chunks: 'all',
  cacheGroups: {
    vendor: {
      test: /[\\/]node_modules[\\/]/,
      name: 'vendors',
      priority: 10
    },
    common: {
      minChunks: 2,
      priority: 5
    }
  }
}
```

**问题：**
1. 会生成哪些 chunk？
2. 每个 chunk 包含什么？
3. 初始加载时会加载哪些 chunk？

**答案：**

```
生成的 chunks：
1. vendors.js
   - React（被 index 和 admin 都导入）
   - Lodash（只被 admin 导入，但 minChunks: 2 不符合）
   - axios（只被 api 导入）
   
2. common.js
   - utils.js（被 index 和 admin 都导入，符合 minChunks: 2）

3. index.js（入口 1）
   - index.js 本身的代码
   - components/Button 代码（只在 index 中用）

4. admin.js（入口 2）
   - admin.js 本身的代码
   - api.js（只在 admin 中用）
   - Lodash（只在 admin 中用）

初始加载：
- 访问页面 1：加载 vendors.js + common.js + index.js
- 访问页面 2：加载 vendors.js + common.js + admin.js

优点：
- React 被缓存，不需要重新下载
- utils 被提取，两个入口共用
- 各入口只加载自己特有的代码

问题：Lodash 为什么没被提取？
因为 minChunks: 2，但 Lodash 只被 admin 导入（1 次）
如果希望提取 Lodash，需要：
{
  cacheGroups: {
    lodash: {
      test: /[\\/]node_modules[\\/]lodash[\\/]/,
      name: 'lodash',
      priority: 15  // 优先级要高于 vendor
    }
  }
}
```

---

### 练习 2.2：动态导入的实现

**题目：** 以下代码是如何实现路由懒加载的？

```javascript
const Home = React.lazy(() => import('./pages/Home'))
const About = React.lazy(() => import('./pages/About'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Suspense>
  )
}
```

**问题和答案：**

```javascript
// Q1: import() 和 import 的区别是什么？
// A: import() 是动态导入，返回一个 Promise
//    import 是静态导入，编译时解析

// Q2: Webpack 如何处理 import()？
// A: Webpack 会：
//    1. 检测到 import()
//    2. 为这个模块创建一个单独的 chunk
//    3. 生成 JSONP 加载代码
//    4. 用户需要时，动态加载脚本

// 打包后的伪代码：
webpackJsonpCallback([
  ['./pages/Home.js', function(module, exports) {
    // Home 组件代码
  }]
])

// 运行时加载代码：
function __webpack_require_async__(chunkId) {
  return new Promise(resolve => {
    const script = document.createElement('script')
    script.src = `./${chunkId}.js`
    script.onload = () => {
      // chunk 加载完成，模块已注册
      resolve(__webpack_require__(chunkId))
    }
    document.head.appendChild(script)
  })
}

// Q3: React.lazy 和 import() 的关系？
// A: React.lazy 包装 import() 的 Promise
//    使得懒加载的组件可以在 Suspense 中使用

// Q4: 如果网络慢，用户看到 Loading 多久？
// A: 取决于 chunk 的大小和网络速度
//    比如 About.js 是 200KB，3G 网络可能需要 5 秒

// 优化方案：
// 1. 在路由切换时预加载下一个 chunk
const About = React.lazy(() => 
  import(/* webpackPrefetch: true */ './pages/About')
)

// 2. 预连接到 CDN
// <link rel="preconnect" href="https://cdn.example.com" />

// 3. 使用预加载提示
const Home = React.lazy(() =>
  import(/* webpackPreload: true */ './pages/Home')
)
```

---

### 练习 2.3：缓存策略的影响

**题目：** 以下代码有什么问题？

```javascript
// webpack.config.js（不好的做法）
module.exports = {
  output: {
    filename: '[name].js'  // ❌ 每次构建的 hash 都一样
  }
}

// 用户 A 在 2024-01-01 访问应用
// 加载：main.js（version 1.0）

// 你发布了新版本（修复了 bug）
// 用户 B 在 2024-01-02 访问应用
// 但浏览器仍然使用缓存的 main.js（version 1.0）
// 看不到 bug 修复！
```

**问题分析和解决方案：**

```javascript
// 问题：
// 使用 [name].js 时，文件名不变
// 浏览器会缓存旧的 main.js
// 新用户加载的仍然是旧代码

// 解决方案 1：使用 hash
output: {
  filename: '[name].[hash].js'
}
// 每次构建都会生成新的 hash
// 问题：如果只改了一个文件，所有 chunk 的 hash 都会变

// 解决方案 2（推荐）：使用 contenthash
output: {
  filename: '[name].[contenthash:8].js'
}
// 只有内容改变时，hash 才改变
// 如果 utils.js 没变，utils 的 chunk hash 就不变
// 用户可以继续使用缓存

// 实际效果：
// 版本 1.0：
// vendors.abc123de.js (React 代码)
// main.def456ab.js (应用代码)

// 版本 1.1（只改了 main.js）：
// vendors.abc123de.js (没变，使用缓存)
// main.xyz789gh.js (改了，重新下载)

// 这样能节省大量带宽！

// 最佳实践配置：
module.exports = {
  output: {
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].js'
  },
  
  optimization: {
    runtimeChunk: 'single',  // Webpack 运行时单独文件
    
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        common: {
          minChunks: 2,
          priority: 5
        }
      }
    }
  }
}
```

---

## 第三部分：HMR 和性能优化深化

### 练习 3.1：HMR 的工作流程

**题目：** 手动跟踪一个 HMR 更新的完整流程

```javascript
// 初始状态：
// src/App.js
function App() {
  return <div>Hello World</div>
}

// src/index.js
import App from './App'
ReactDOM.render(<App />, document.getElementById('root'))

// 打包结果：
// dist/main.js (包含 App 和 ReactDOM.render)
// dist/runtime.js (Webpack 运行时)
```

**场景：** 用户打开应用，然后修改 App.js

```javascript
// 用户修改后
function App() {
  return <div>Hello World 2</div>  // 改了这一行
}
```

**问题：** 逐步描述 HMR 会发生什么？

**答案和解释：**

```
第 1 步：文件检测
├─ Webpack 的 file watcher 检测到 App.js 改变
└─ 触发重新编译

第 2 步：增量编译
├─ Webpack 只重新编译 App.js
├─ 生成新的 App 模块代码
└─ 保留其他模块的缓存

第 3 步：生成更新包
├─ Webpack 生成 manifest 文件
│  {
│    h: 'hash-id',
│    c: { './App.js': 'new-module-id' }
│  }
├─ 生成 chunk 文件
│  (新的 App.js 的代码)
└─ 存储到 devServer 内存中

第 4 步：推送更新
├─ Webpack Dev Server 通过 WebSocket 通知浏览器
│  { type: 'ok' }
└─ 并返回 manifest 和 chunk 的路径

第 5 步：浏览器下载更新
├─ 浏览器向 devServer 请求：
│  GET /main.hash-id.hot-update.js
└─ 浏览器接收新的 App 模块代码

第 6 步：模块替换
├─ 浏览器调用 module.hot.accept()
├─ 卸载旧的 App 模块
├─ 加载新的 App 模块
└─ React 进行最小化重新渲染

第 7 步：完成
├─ 页面显示新的内容
├─ 应用状态被保留
└─ 没有整个页面刷新

关键要点：
- 只有改变的模块被重新下载，不是整个 main.js
- 应用状态被保留（如果有 HMR handler）
- 速度快（通常 1 秒内）
```

**为什么有时 HMR 会失败并刷新页面？**

```javascript
// 原因 1：模块没有 HMR handler
// webpack.config.js 中没有启用 HMR 的 loader

// 原因 2：模块之间有循环依赖
// HMR 无法正确替换循环依赖的模块

// 原因 3：模块级别的错误
// 新代码有语法错误，无法加载

// 原因 4：涉及副作用的代码
function App() {
  console.log('App loaded')  // ← 这是副作用
  // 更新时会重复执行，可能导致问题
}

// 解决方案：
if (module.hot) {
  module.hot.accept('./App', () => {
    console.log('App updated')
    // 手动处理更新逻辑
    renderApp()
  })
}
```

---

### 练习 3.2：打包体积分析

**题目：** 用以下工具分析打包结果，发现问题

```javascript
// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ]
}

// 运行 npm run build
// 打开 report.html
```

**假设分析结果显示：**

```
总体积：2.5 MB

占比分布：
- React: 150 KB (6%)
- moment.js: 500 KB (20%)  ← 最大！
- lodash: 80 KB (3%)
- antd: 400 KB (16%)
- 应用代码: 300 KB (12%)
- 其他: 575 KB (23%)
```

**问题：**
1. 为什么 moment.js 这么大？
2. 怎样优化？

**答案：**

```javascript
// 问题分析：
// moment.js 包含很多语言包和时区数据
// 但应用可能只需要英文和中文

// 解决方案 1：使用 webpack.IgnorePlugin 排除语言包
module.exports = {
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/
    })
  ]
}
// 效果：moment.js 从 500 KB 减少到 100 KB

// 解决方案 2：替换为 dayjs（更小的时间库）
// moment.js: 67 KB (gzip)
// dayjs: 2 KB (gzip)
// import dayjs from 'dayjs'
// dayjs().format('YYYY-MM-DD')

// 解决方案 3：按需加载 antd
// ❌ 不好
import { Button, Table, Form, Input } from 'antd'

// ✅ 好
import Button from 'antd/es/button'
import Table from 'antd/es/table'

// 或配置 babel-plugin-import 自动转换

// 解决方案 4：分析其他 23% 的"其他"
// 可能包含：
// - 重复的第三方库依赖
// - 不必要的 polyfill
// - 不用的 CSS
```

---

### 练习 3.3：构建性能优化

**题目：** 你的项目打包需要 45 秒，怎样优化？

```javascript
// webpack.config.js
module.exports = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader']  // 可能很慢
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  }
}

// 构建时间分析：
// - babel-loader: 25 秒
// - postcss-loader: 10 秒
// - 其他: 10 秒
```

**优化方案：**

```javascript
// 方案 1：启用 babel-loader 缓存
{
  test: /\.js$/,
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true  // 启用缓存
    }
  }
}
// 效果：第二次构建从 25s 减少到 2s

// 方案 2：使用 thread-loader 并行处理
{
  test: /\.js$/,
  use: [
    'thread-loader',
    {
      loader: 'babel-loader',
      options: {
        cacheDirectory: true
      }
    }
  ]
}
// 效果：25s 减少到 12s（4 核处理器）

// 方案 3：缩小搜索范围
{
  test: /\.js$/,
  exclude: /node_modules/,
  include: path.resolve(__dirname, 'src'),  // ← 明确指定
  use: ['thread-loader', 'babel-loader']
}
// 效果：减少 20% 时间

// 方案 4：使用 webpack 5 的文件系统缓存
module.exports = {
  cache: {
    type: 'filesystem'  // 跨构建缓存
  }
}
// 效果：第三次构建（冷启动）从 45s 减少到 8s

// 最终优化方案：
module.exports = {
  cache: { type: 'filesystem' },
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        include: path.resolve(__dirname, 'src'),
        use: [
          'thread-loader',
          {
            loader: 'babel-loader',
            options: { cacheDirectory: true }
          }
        ]
      }
    ]
  }
}

// 优化效果：
// 冷启动：45s → 8s (82% 优化)
// 增量：2s → 0.5s (75% 优化)
// 开发体验大幅提升！
```

---

## 第四部分：思考题和综合案例

### 思考题 4.1：tradeoff（权衡）

**题目：** 以下是常见的权衡，解释每个选择的优缺点：

**1. 是否提取第三方库？**

```javascript
// 选择 A：不提取
optimization: {
  splitChunks: {
    chunks: 'none'
  }
}
// ✅ 优点：文件数少，请求数少
// ❌ 缺点：第三方库改变时用户要重新下载整个 main.js

// 选择 B：提取第三方库
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors'
      }
    }
  }
}
// ✅ 优点：第三方库被缓存，应用更新时不需要重新下载
// ❌ 缺点：多一个请求，多一个文件

// 选择建议：
// - 应用代码更新频繁 → 选择 B
// - 第三方库很小 (<50KB) → 选择 A
// - 正常情况 → 选择 B（现代 HTTP/2 请求很快）
```

**2. 是否启用 Source Map？**

```javascript
// 选择 A：生产环境不启用 Source Map
output: {
  devtool: false
}
// ✅ 优点：产物体积小，加载快
// ❌ 缺点：出错时无法定位源代码，困难排查问题

// 选择 B：生产环境启用 Source Map
output: {
  devtool: 'cheap-module-source-map'
}
// ✅ 优点：出错时能定位源代码，便于 bug 修复
// ❌ 缺点：产物体积增加 30-50%，用户首屏更慢

// 选择建议：
// - 应用是 SaaS 产品（你控制版本） → 启用
// - 应用是开源项目（用户自部署） → 禁用
// - 关键应用（金融、支付） → 启用，上传到监控服务
```

**3. 是否提取 Runtime？**

```javascript
// 选择 A：不提取 Runtime
optimization: {
  runtimeChunk: false
}
// ✅ 优点：少一个文件和请求
// ❌ 缺点：vendors 改变时，runtime 也被修改，cache 失效

// 选择 B：提取 Runtime
optimization: {
  runtimeChunk: 'single'
}
// ✅ 优点：vendors 改变时，runtime 不变，cache 命中率高
// ❌ 缺点：多一个请求，多一个文件

// 选择建议：
// 大多数情况下选择 B
// 因为长期缓存的收益 > 多一个请求的开销
```

---

### 综合案例 4.1：优化现有项目

**场景：** 你接手了一个 React 项目，打包需要 60 秒，首屏加载需要 3 秒，性能很差。

**诊断步骤：**

```javascript
// 步骤 1：启用构建分析
// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')

const smp = new SpeedMeasurePlugin()

module.exports = smp.wrap({
  plugins: [
    new BundleAnalyzerPlugin()
  ]
})

// npm run build 查看时间和体积

// 预期发现：
// - 打包时间：babel-loader 30s，postcss-loader 15s
// - 产物体积：
//   - moment.js: 500 KB
//   - antd: 300 KB
//   - 应用代码: 200 KB
```

**优化方案：**

```javascript
// 优化 1：加速构建
cache: {
  type: 'filesystem'
},

module: {
  rules: [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      include: path.resolve(__dirname, 'src'),
      use: [
        'thread-loader',
        {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      ]
    }
  ]
}
// 效果：60s → 15s（冷启动）

// 优化 2：减少包体积
plugins: [
  // 移除 moment.js 的语言包
  new webpack.IgnorePlugin({
    resourceRegExp: /^\.\/locale$/,
    contextRegExp: /moment$/
  })
],

optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      // 分离 antd
      antd: {
        test: /[\\/]node_modules[\\/]antd[\\/]/,
        name: 'antd',
        priority: 15
      },
      // 分离其他第三方库
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10
      },
      // 分离公共代码
      common: {
        minChunks: 2,
        priority: 5
      }
    }
  },
  runtimeChunk: 'single'
}

// 优化 3：路由懒加载
// pages/Home.jsx
const Home = React.lazy(() => import('./pages/Home'))
const About = React.lazy(() => import('./pages/About'))
const Product = React.lazy(() => import('./pages/Product'))

// 优化 4：动态导入重型库
// 而不是顶级导入
const { Chart } = await import('echarts')
const moment = await import('moment')

// 优化效果：
// 构建时间：60s → 12s (80% 优化)
// 首屏大小：1.2 MB → 350 KB (71% 优化)
// 首屏时间：3s → 0.8s (73% 优化)
```

---

## 第五部分：自我检查清单

### 检查你是否真正理解了进阶内容

**模块系统（Module System）**
- [ ] 能解释 CommonJS 和 ES6 Module 的区别
- [ ] 知道 Webpack 使用 IIFE 和 require 函数管理模块
- [ ] 理解循环依赖为什么会出问题
- [ ] 知道模块解析的顺序（相对路径 → 别名 → node_modules）

**代码分割（Code Splitting）**
- [ ] 能解释为什么需要代码分割
- [ ] 理解 SplitChunks 的三个关键概念：minChunks、priority、reuseExistingChunk
- [ ] 知道动态导入（import()）是怎样工作的
- [ ] 能设计一个合理的 SplitChunks 策略

**热更新（HMR）**
- [ ] 理解 HMR 的 7 个步骤流程
- [ ] 知道为什么有时 HMR 会失败
- [ ] 能配置 devServer 启用 HMR
- [ ] 知道不同的 loader 对 HMR 的支持程度

**缓存策略（Cache）**
- [ ] 理解 hash、chunkhash、contenthash 的区别
- [ ] 知道为什么需要提取 runtime chunk
- [ ] 能设计一个有效的缓存策略

**性能优化（Performance）**
- [ ] 能使用 BundleAnalyzer 分析打包结果
- [ ] 知道常见的包体积优化手段
- [ ] 能识别和优化构建瓶颈
- [ ] 了解 tradeoff（权衡），知道什么时候选择什么方案

---

## 第六部分：学习资源和进一步深化

### 推荐的进阶阅读

**官方文档：**
- Webpack 官方指南：https://webpack.js.org/guides/
- SplitChunks 配置详解：https://webpack.js.org/plugins/split-chunks-plugin/

**优秀的第三方文章：**
- 「深入浅出 Webpack」书籍（电子版或纸质）
- Webpack 源码解析系列文章

**工具和插件：**
- webpack-bundle-analyzer（可视化分析）
- speed-measure-webpack-plugin（性能分析）
- webpack-dashboard（彩色输出）

---

## 实践建议

### 建议的学习路径

**第 1 周：理解原理**
- 深入学习本文档的每一个练习题
- 在自己的项目中验证

**第 2 周：动手实践**
- 给一个现有项目配置 splitChunks
- 使用 BundleAnalyzer 分析自己的项目
- 进行代码分割和路由懒加载

**第 3 周：性能优化**
- 识别项目的性能瓶颈
- 实施优化方案并测量效果
- 了解 tradeoff 并做出合理决策

**第 4 周：深化理解**
- 研究 Webpack 源码（可选）
- 尝试写一个自定义 plugin 或 loader
- 总结最佳实践

---

## 总结

进阶篇的核心要点：

1. **模块系统是基础** - 理解模块化，才能理解代码分割、HMR 等高级功能

2. **代码分割是关键** - 合理的代码分割能显著提升用户体验

3. **HMR 影响开发效率** - 好的 HMR 配置能大幅提升开发速度

4. **缓存是长期优化** - 使用 contenthash 和 runtimeChunk，让用户充分利用缓存

5. **没有银弹** - 每个优化方案都有 tradeoff，要根据实际情况选择

---

**下一步建议：**

完成本文档的所有练习后，建议：
1. 在自己的项目中应用这些知识
2. 测量优化前后的效果
3. 学习 Webpack 优化与实战篇（React/Vue 项目搭建、最佳实践）

加油！🚀