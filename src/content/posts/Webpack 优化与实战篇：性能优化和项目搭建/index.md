---
title: Webpack 优化与实战篇：性能优化和项目搭建
published: 2026-01-27
description: ''
image: ''
tags: []
category: ''
draft: false 
lang: ''
---

# Webpack 优化与实战篇：性能优化和项目搭建

> 本文档从实战角度讲解 Webpack 的性能优化、项目搭建、最佳实践等。
> 包括完整的 React 和 Vue 项目配置、真实的优化案例。

---

## 第一章：构建性能优化

### 1.1 构建性能分析

在优化前，必须先测量。使用工具分析构建瓶颈：

```javascript
// webpack.config.js
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const smp = new SpeedMeasurePlugin()

module.exports = smp.wrap({
  // webpack 配置
})

// npm run build 后会输出：
// webpack: 45.123 s
// ├─ babel-loader: 25.234 s (55%)
// ├─ css-loader: 10.123 s (22%)
// ├─ postcss-loader: 8.456 s (19%)
// └─ other: 1.310 s (3%)
```

### 1.2 优化策略 1：使用文件系统缓存

```javascript
// webpack.config.js
module.exports = {
  // Webpack 5 内置缓存
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.webpack_cache'),
    buildDependencies: {
      config: [__filename]
    }
  }
}

// 效果：
// 首次构建：45s
// 第二次（文件未改）：3s （快 15 倍！）
```

**缓存原理：**
- 第一次构建时，Webpack 将编译结果存储到硬盘
- 第二次构建时，检查文件内容哈希
- 如果文件没改，直接使用缓存
- 如果文件改了，只重新编译改动的模块

### 1.3 优化策略 2：并行处理（thread-loader）

```javascript
// webpack.config.js
const os = require('os')

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'thread-loader',
            options: {
              workers: os.cpus().length - 1  // 使用 CPU 核心数 - 1
            }
          },
          'babel-loader'
        ]
      }
    ]
  }
}

// 效果：
// 单线程：25s
// 多线程（4 核）：12s （快 2 倍）
```

**何时使用 thread-loader：**
- loader 处理耗时长（如 babel-loader）
- 项目文件很多（>1000 个）
- CPU 有多核

### 1.4 优化策略 3：减少 Loader 的作用范围

```javascript
// ❌ 不好：广泛的 test 范围
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,  // 会匹配 src 和 node_modules 中的所有 .js
        use: 'babel-loader'
      }
    ]
  }
}

// ✅ 好：限制范围
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,  // ← 关键：排除 node_modules
        include: path.resolve(__dirname, 'src'),  // ← 关键：仅包含 src
        use: 'babel-loader'
      }
    ]
  }
}

// 效果：快 30-40%
```

### 1.5 优化策略 4：使用高效的 Loader

```javascript
// 比较不同 loader 的性能

// ❌ ts-loader（相对较慢）
module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader'  // 完整的 TypeScript 检查，较慢
      }
    ]
  }
}

// ✅ babel-loader with @babel/preset-typescript（更快）
module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-typescript']
          }
        }
      }
    ]
  }
}

// 或者 ✅ swc-loader（最快，Rust 写的）
module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'swc-loader'  // 可以快 10 倍
      }
    ]
  }
}

// 性能对比：
// ts-loader: 25s
// babel-loader: 18s
// swc-loader: 3s
```

### 1.6 优化策略 5：关闭不必要的功能

```javascript
// webpack.config.js
module.exports = {
  // 开发环境下关闭性能提示
  performance: process.env.NODE_ENV === 'production' ? {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  } : false,

  // 关闭 source map（开发环境除外）
  devtool: process.env.NODE_ENV === 'development'
    ? 'eval-cheap-module-source-map'
    : false,

  // 关闭插件的不必要功能
  plugins: [
    new TerserPlugin({
      terserOptions: {
        // 生产环境删除 console
        compress: {
          drop_console: true
        }
      }
    })
  ]
}
```

### 1.7 完整的构建优化配置

```javascript
// webpack.config.js
const path = require('path')
const os = require('os')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')

const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  // 1. 文件系统缓存
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.webpack_cache')
  },

  // 2. 模式
  mode: isDev ? 'development' : 'production',

  // 3. Source map
  devtool: isDev ? 'eval-cheap-module-source-map' : false,

  // 3. 提取 CSS
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css'
    })
  ],

  // 4. 压缩和优化
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            // 生产环境配置
            presets: [
              ['@babel/preset-env', {
                modules: false,  // 保持 ES6 modules
                useBuiltIns: 'usage',
                corejs: 3
              }]
            ]
          }
        }
      }
    ]
  }
}

// 生产时的最佳实践：
// 1. 压缩代码（JS、CSS）
// 2. 代码分割（vendor、common）
// 3. 提取 CSS
// 4. 使用 contenthash
// 5. 删除 console 和 debugger
// 6. Gzip 压缩
// 7. 按需加载
```

**优化效果：首次 60s → 12s，增量 3s → 0.3s** 💪

---

## 第二章：打包体积优化

### 2.1 分析工具

```javascript
// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false
    })
  ]
}

// npm run build 后生成 bundle-report.html
// 可视化显示每个模块的大小
```

### 2.2 优化策略 1：删除 console 和 debugger

```javascript
// webpack.config.js
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,      // 删除 console
            drop_debugger: true      // 删除 debugger
          },
          format: {
            comments: false          // 删除注释
          }
        },
        extractComments: false
      })
    ]
  }
}

// 效果：减少 5-10% 的体积
```

### 2.3 优化策略 2：移除不需要的语言包

```javascript
// webpack.config.js
const webpack = require('webpack')

module.exports = {
  plugins: [
    // 移除 moment.js 的语言包
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/
    }),

    // 移除 day.js 的语言包
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /dayjs$/
    })
  ]
}

// 效果：
// moment.js: 67KB → 2KB
// 总体积减少 30%
```

### 2.4 优化策略 3：替换重型库

```javascript
// ❌ 不好：moment.js
import moment from 'moment'
const now = moment().format('YYYY-MM-DD')

// ✅ 好：dayjs（替换品，只有 2KB）
import dayjs from 'dayjs'
const now = dayjs().format('YYYY-MM-DD')

// ✅ 更好：内置方法
const now = new Date().toISOString().split('T')[0]

// 大库替换方案：
// lodash → lodash-es （支持 Tree Shaking）
// momentjs → dayjs
// jQuery → native API
// underscore → lodash-es
```

### 2.5 优化策略 4：动态导入 + Tree Shaking

```javascript
// ❌ 不好：顶级导入，即使不用也会打包
import { Chart } from 'echarts'
import _ from 'lodash'

function MyComponent() {
  // 但只用了很小的一部分
  return null
}

// ✅ 好：动态导入，只在需要时加载
async function loadChart() {
  const { Chart } = await import('echarts')
  return Chart
}

// ✅ 更好：按需导入
import { debounce } from 'lodash-es'  // 只导入需要的函数

// Tree Shaking 配置
module.exports = {
  optimization: {
    usedExports: true,        // 标记未使用的导出
    sideEffects: false,       // 标记无副作用的模块
    minimize: true            // 删除未使用的代码
  }
}
```

### 2.6 优化策略 5：Gzip 压缩

```javascript
// webpack.config.js
const CompressionPlugin = require('compression-webpack-plugin')

module.exports = {
  plugins: [
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,  // 10KB 以上的文件才压缩
      minRatio: 0.8      // 压缩率 < 80% 才保存
    })
  ]
}

// 效果：
// main.js: 100KB → 30KB（压缩后）
// 用户下载快 3 倍！
```

### 2.7 完整的体积优化配置

```javascript
// webpack.config.js
const TerserPlugin = require('terser-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const webpack = require('webpack')

module.exports = {
  mode: 'production',

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          },
          format: {
            comments: false
          }
        }
      })
    ],

    usedExports: true,
    sideEffects: false,

    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },

    runtimeChunk: 'single'
  },

  plugins: [
    // 移除语言包
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/
    }),

    // Gzip 压缩
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8
    })
  ]
}

// 优化效果：
// 原始：500KB → 优化后：120KB（压缩前）
//                       35KB（gzip 后）
// 用户下载快 14 倍！
```

---

## 第三章：React 项目完整配置

### 3.1 从零搭建 React 项目

```bash
# 创建项目
mkdir my-react-app
cd my-react-app
npm init -y

# 安装依赖
npm install -D webpack webpack-cli webpack-dev-server
npm install -D @babel/core @babel/preset-env @babel/preset-react babel-loader
npm install -D style-loader css-loader postcss-loader autoprefixer
npm install -D html-webpack-plugin mini-css-extract-plugin
npm install -D clean-webpack-plugin terser-webpack-plugin

# React 库
npm install react react-dom
```

### 3.2 React 项目的 webpack 配置

```javascript
// webpack.config.js
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  mode: isDev ? 'development' : 'production',

  entry: './src/index.js',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].js',
    publicPath: '/'
  },

  devtool: isDev ? 'eval-cheap-module-source-map' : false,

  cache: {
    type: 'filesystem'
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },

  module: {
    rules: [
      // JavaScript / JSX
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }]
            ],
            cacheDirectory: true
          }
        }
      },

      // CSS / SCSS
      {
        test: /\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ]
      },

      // 图片
      {
        test: /\.(png|jpg|gif|webp)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024
          }
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]'
        }
      },

      // SVG
      {
        test: /\.svg$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name].[hash:8][ext]'
        }
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(),

    new HtmlWebpackPlugin({
      template: './src/index.html',
      minify: !isDev ? {
        removeComments: true,
        collapseWhitespace: true
      } : false
    }),

    ...(isDev ? [] : [
      new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash:8].css'
      })
    ]),

    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ],

  optimization: {
    minimize: !isDev,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: !isDev
          }
        }
      })
    ],

    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          priority: 40
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 20
        },
        common: {
          minChunks: 2,
          priority: 10,
          reuseExistingChunk: true
        }
      }
    },

    runtimeChunk: 'single'
  },

  devServer: {
    port: 3000,
    open: true,
    hot: true,
    historyApiFallback: true,
    compress: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        pathRewrite: { '^/api': '' },
        changeOrigin: true
      }
    }
  },

  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  }
}
```

### 3.3 React 项目的 package.json

```json
{
  "name": "my-react-app",
  "version": "1.0.0",
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production",
    "analyze": "webpack-bundle-analyzer dist/bundle-report.html"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@babel/core": "^7.22.0",
    "@babel/preset-env": "^7.22.0",
    "@babel/preset-react": "^7.22.0",
    "autoprefixer": "^10.4.14",
    "babel-loader": "^9.1.2",
    "clean-webpack-plugin": "^4.0.0",
    "css-loader": "^6.8.1",
    "html-webpack-plugin": "^5.5.0",
    "mini-css-extract-plugin": "^2.7.6",
    "postcss": "^8.4.24",
    "postcss-loader": "^7.3.3",
    "style-loader": "^3.3.3",
    "terser-webpack-plugin": "^5.3.9",
    "webpack": "^5.88.0",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^4.15.1"
  }
}
```

### 3.4 React 项目的目录结构

```
my-react-app/
├── src/
│   ├── components/
│   │   ├── Button.jsx
│   │   └── Header.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   └── About.jsx
│   ├── styles/
│   │   └── index.css
│   ├── App.jsx
│   ├── index.jsx
│   └── index.html
├── webpack.config.js
├── package.json
└── .gitignore
```

### 3.5 核心文件内容

```javascript
// src/index.html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>

// src/index.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<App />)

// src/App.jsx
import { lazy, Suspense } from 'react'
import Header from '@/components/Header'

const Home = lazy(() => import('@/pages/Home'))
const About = lazy(() => import('@/pages/About'))

export default function App() {
  return (
    <div>
      <Header />
      <Suspense fallback={<div>Loading...</div>}>
        <Home />
      </Suspense>
    </div>
  )
}
```

---

## 第四章：Vue 项目完整配置

### 4.1 Vue 项目的 webpack 配置

```javascript
// webpack.config.js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  mode: isDev ? 'development' : 'production',

  entry: './src/main.js',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].js',
    publicPath: '/'
  },

  devtool: isDev ? 'eval-cheap-module-source-map' : false,

  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'vue': 'vue/dist/vue.esm.js'
    }
  },

  module: {
    rules: [
      // Vue 文件
      {
        test: /\.vue$/,
        use: 'vue-loader'
      },

      // JavaScript
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            cacheDirectory: true
          }
        }
      },

      // CSS
      {
        test: /\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ]
      },

      // 图片
      {
        test: /\.(png|jpg|gif)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: { maxSize: 8 * 1024 }
        }
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(),

    new VueLoaderPlugin(),

    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),

    ...(isDev ? [] : [
      new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash:8].css'
      })
    ])
  ],

  optimization: {
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
  },

  devServer: {
    port: 3000,
    open: true,
    hot: true,
    historyApiFallback: true
  }
}
```

---

## 第五章：库打包最佳实践

### 5.1 库的打包目标

库需要支持多种使用方式：

```javascript
// 用户可能这样使用库：

// 方式 1：ES6 import
import MyLib from 'my-lib'

// 方式 2：CommonJS require
const MyLib = require('my-lib')

// 方式 3：全局变量
<script src="my-lib.js"></script>
<script>
  const lib = window.MyLib
</script>

// 方式 4：UMD（通用）
```

### 5.2 库的 package.json 配置

```json
{
  "name": "my-lib",
  "version": "1.0.0",
  "description": "A useful library",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "sideEffects": false,
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --mode development --watch"
  }
}
```

### 5.3 库的 Webpack 配置

```javascript
// webpack.config.js
const path = require('path')

module.exports = [
  // ES Module 版本
  {
    name: 'esm',
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.esm.js',
      library: {
        type: 'module'
      }
    },
    experiments: {
      outputModule: true
    }
  },

  // CommonJS 版本
  {
    name: 'cjs',
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.js',
      library: {
        type: 'commonjs2'
      }
    }
  },

  // UMD 版本（用于浏览器）
  {
    name: 'umd',
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.umd.js',
      library: {
        name: 'MyLib',
        type: 'umd'
      }
    }
  }
]
```

---

## 第六章：最佳实践总结

### 6.1 开发阶段最佳实践

```javascript
// webpack.config.js (development)
module.exports = {
  mode: 'development',

  // 1. 快速编译
  cache: { type: 'filesystem' },

  // 2. 完整的 source map
  devtool: 'eval-cheap-module-source-map',

  // 3. 快速的 HMR
  devServer: {
    hot: true,
    port: 3000
  },

  // 4. 快速的 loader
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          options: { cacheDirectory: true }
        }
      }
    ]
  }
}

// 开发时的最佳实践：
// 1. 不要压缩代码
// 2. 不要提取 CSS
// 3. 启用 HMR
// 4. 使用快速 loader
// 5. 关闭不必要的优化
```

### 6.2 生产阶段最佳实践

```javascript
// webpack.config.js (production)
module.exports = {
  mode: 'production',

  // 1. 无 source map（或只有必要的）
  devtool: 'cheap-module-source-map',

  // 2. 完整的优化
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all'
    },
    runtimeChunk: 'single'
  },

  // 3. 提取 CSS
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css'
    })
  ],

  // 4. 压缩和优化
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            // 生产环境配置
            presets: [
              ['@babel/preset-env', {
                modules: false,  // 保持 ES6 modules
                useBuiltIns: 'usage',
                corejs: 3
              }]
            ]
          }
        }
      }
    ]
  }
}

// 生产时的最佳实践：
// 1. 压缩代码（JS、CSS）
// 2. 代码分割（vendor、common）
// 3. 提取 CSS
// 4. 使用 contenthash
// 5. 删除 console 和 debugger
// 6. Gzip 压缩
// 7. 按需加载
```

### 6.3 日常开发中的最佳实践

```javascript
// 1. 使用别名避免相对路径
import Button from '@/components/Button'  // ✅
// 而不是
import Button from '../../components/Button'  // ❌

// 2. 使用动态导入实现路由懒加载
const Home = lazy(() => import('@/pages/Home'))  // ✅

// 3. 按需导入库函数
import { debounce } from 'lodash-es'  // ✅
// 而不是
import _ from 'lodash'  // ❌ 打包整个库

// 4. 避免在循环中导入
for (let i = 0; i < 10; i++) {
  const module = require(`./modules/${i}`)  // ❌
}

// 正确做法
const modules = require.context('./modules', true, /\.js$/)  // ✅

// 5. 缓存 API 请求结果
const memoizedFetch = (() => {
  const cache = {}
  return async (url) => {
    if (cache[url]) return cache[url]
    const result = await fetch(url)
    cache[url] = result
    return result
  }
})()

// 6. 合理使用 code splitting
// 第一次加载页面，只加载必要的代码
// 用户交互时，再加载其他功能的代码
```

### 6.4 常见的优化对比

```javascript
// 对比 1：Bundle 大小
// ❌ 不优化：500KB
// 优化后：120KB (gzip: 35KB)
// 改进：76% 减少

// 对比 2：首屏时间
// ❌ 不优化：5 秒
// 优化后：1.2 秒
// 改进：76% 减少

// 对比 3：打包时间
// ❌ 不优化：45 秒
// 优化后：12 秒（冷启动）/ 0.3 秒（增量）
// 改进：73% 减少（冷启动）/ 90% 减少（增量）

// 关键优化的影响：
// 1. code splitting: -40% bundle 大小
// 2. tree shaking: -15% bundle 大小
// 3. lazy loading: -30% 首屏时间
// 4. cache: -80% 增量构建时间
// 5. 并行处理: -50% 构建时间
```

---

## 第七章：实战案例：完整的优化项目

### 7.1 优化前的状态

```
初始状态：
├─ 打包时间：60 秒
├─ Bundle 大小：2.5 MB
├─ 首屏时间：4.5 秒
├─ 缓存命中率：0%
└─ Lighthouse 得分：40/100
```

### 7.2 优化步骤 1：添加缓存

```javascript
cache: { type: 'filesystem' }
```

**效果：**
- 冷启动：60s → 45s（25% 优化）
- 增量：45s → 3s（93% 优化）

### 7.3 优化步骤 2：并行处理

```javascript
module: {
  rules: [{
    test: /\.js$/,
    use: ['thread-loader', 'babel-loader']
  }]
}
```

**效果：**
- 冷启动：45s → 20s（55% 优化）

### 7.4 优化步骤 3：代码分割

```javascript
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      react: {
        test: /react/,
        name: 'react',
        priority: 40
      },
      vendor: {
        test: /node_modules/,
        name: 'vendors',
        priority: 20
      }
    }
  }
}
```

**效果：**
- Bundle 大小：2.5MB → 1.2MB（52% 优化）

### 7.5 优化步骤 4：移除不必要的库

```javascript
// 删除 moment.js，使用 dayjs
// 删除 jQuery，使用 native API
// 删除 underscore，使用 lodash-es
```

**效果：**
- Bundle 大小：1.2MB → 600KB（50% 优化）

### 7.6 优化步骤 5：路由懒加载

```javascript
const Home = lazy(() => import('./pages/Home'))
const Product = lazy(() => import('./pages/Product'))
const Admin = lazy(() => import('./pages/Admin'))
```

**效果：**
- 首屏大小：600KB → 200KB（67% 优化）
- 首屏时间：2.5s → 0.8s（68% 优化）

### 7.7 优化步骤 6：Gzip 压缩

```javascript
plugins: [
  new CompressionPlugin({
    algorithm: 'gzip',
    test: /\.(js|css)$/
  })
]
```

**效果：**
- 传输大小：200KB → 60KB（70% 优化）

### 7.8 最终结果

```
优化完成：
├─ 打包时间：60s → 8s（87% 优化）
├─ Bundle 大小：2.5MB → 60KB（98% 优化！）
├─ 首屏时间：4.5s → 0.6s（87% 优化）
├─ 缓存命中率：0% → 85%
└─ Lighthouse 得分：40/100 → 95/100
```

**投入产出分析：**
- 优化投入：1-2 天工作
- 用户体验提升：显著
- 服务器带宽节省：90%
- 用户流失率降低：15-20%

---

## 总结

### 优化的优先级

```
第 1 优先级：立即做
├─ 启用文件系统缓存
├─ 添加 code splitting
└─ 路由懒加载

第 2 优先级：尽快做
├─ 删除不必要的库
├─ Tree shaking
└─ Gzip 压缩

第 3 优先级：有时间再做
├─ Preload / Prefetch
├─ 图片优化
└─ CDN 部署
```

### 优化检查清单

- [ ] 启用文件系统缓存（cache.type = 'filesystem'）
- [ ] 设置合理的 source map（开发 eval-cheap，生产 false）
- [ ] 配置 code splitting（至少分离 vendor）
- [ ] 实现路由懒加载
- [ ] 使用 contenthash
- [ ] 删除 console 和 debugger
- [ ] 启用 Gzip 压缩
- [ ] 移除不必要的库
- [ ] 配置别名避免相对路径
- [ ] 使用 lodash-es 而不是 lodash
- [ ] 提取 runtime chunk
- [ ] 设置 sideEffects: false

### 性能目标

```
开发环境：
- 冷启动：< 20s
- HMR：< 1s

生产环境：
- Bundle 大小：< 200KB（gzip）
- 首屏时间：< 2s（3G 网络）
- Lighthouse 得分：> 90

长期维护：
- 构建可重复性
- 清晰的文档
- 易于团队维护
```

---

**现在你已经学完了 Webpack 的四个阶段：基础、进阶、高级应用、优化与实战！** 🎉

建议：
1. ✅ 在自己的项目中应用这些优化
2. ✅ 测量优化前后的效果
3. ✅ 建立性能监控机制
4. ✅ 定期审视和改进配置

加油！🚀压缩和优化