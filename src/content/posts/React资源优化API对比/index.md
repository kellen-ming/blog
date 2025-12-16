---
title: React资源优化API对比
published: 2025-12-16
description: '深入对比 React 提供的资源提示 API：preload、preloadModule、preinitModule、prefetch、prefetchDNS，帮你理解它们的区别、使用场景和最佳实践。'
image: './images/58mM9Ft3d8.webp'
tags: ['react api', '性能优化', '资源加载']
category: 'React'
draft: false 
lang: 'zh'
---

## 简介
:::IMPORTANT
本文部分内容由AI协助完成，读者自行甄别
:::
React 提供了多个资源提示 API 来优化页面加载性能，但它们的使用场景和优先级各不相同。本文将深入对比这些 API，帮你理解何时使用哪个。

## React 资源提示 API 概览

React 提供了以下 5 个资源提示 API：

1. **ReactDOM.preload** - 预加载关键资源
2. **ReactDOM.preloadModule** - 预加载 ESM 模块
3. **ReactDOM.preinitModule** - 预加载并执行 ESM 模块
4. **ReactDOM.prefetch** - 预取未来可能用到的资源
5. **ReactDOM.prefetchDNS** - DNS 预解析

## 核心区别对比

### 优先级对比

| API | 优先级 | 资源类型 | 执行时机 |
|-----|--------|----------|----------|
| `preload` | 🔴 高 | 所有资源类型 | 立即下载 |
| `preloadModule` | 🔴 高 | ESM 模块 | 立即下载 |
| `preinitModule` | 🔴 高 | ESM 模块 | 立即下载+执行 |
| `prefetch` | 🟡 低 | 所有资源类型 | 空闲时下载 |
| `prefetchDNS` | - | DNS 解析 | 提前解析域名 |

### 详细对比表

| 特性 | preload | preloadModule | preinitModule | prefetch | prefetchDNS |
|------|---------|---------------|---------------|----------|-------------|
| **用途** | 预加载关键资源 | 预加载 ESM 模块 | 预加载+执行模块 | 预取未来资源 | DNS 预解析 |
| **优先级** | 高 | 高 | 高 | 低 | - |
| **资源类型** | 字体、CSS、脚本、图片等 | 仅 ESM 模块 | 仅 ESM 模块 | 所有类型 | 域名 |
| **执行时机** | 立即下载 | 立即下载 | 立即下载+执行 | 空闲时下载 | 提前解析 |
| **适用场景** | 首屏必需资源 | ES 模块预加载 | 需要立即执行的模块 | 可能用到的资源 | 第三方域名 |
| **HTML 等价** | `<link rel="preload">` | `<link rel="modulepreload">` | `<link rel="modulepreload">` + 执行 | `<link rel="prefetch">` | `<link rel="dns-prefetch">` |

## 各 API 详解

### 1. ReactDOM.preload

**用途：** 预加载当前页面**一定会用到**的关键资源

**特点：**
- 高优先级，立即下载
- 支持多种资源类型（字体、CSS、脚本、图片等）
- 适用于首屏关键资源

**使用示例：**
```jsx
// 预加载关键字体
ReactDOM.preload('/fonts/inter.woff2', {
  as: 'font',
  type: 'font/woff2',
  crossOrigin: 'anonymous',
  fetchPriority: 'high'
});

// 预加载关键 CSS
ReactDOM.preload('/critical.css', {
  as: 'style',
  fetchPriority: 'high'
});
```
**何时使用：**
- ✅ 首屏必需的字体文件
- ✅ 关键 CSS 样式
- ✅ 首屏图片（LCP 元素）
- ❌ 未来可能用到的资源（用 prefetch）

---

### 2. ReactDOM.preloadModule

**用途：** 预加载 ESM（ECMAScript 模块）

**特点：**
- 高优先级，立即下载
- 仅支持 `as: "script"`
- 专门用于 ES 模块

**使用示例：**
```jsx
// 预加载 ES 模块
ReactDOM.preloadModule('/analytics-module.js', {
  as: 'script',
  crossOrigin: 'anonymous',
  integrity: 'sha256-abc123...'
});
```

**何时使用：**
- ✅ 需要预加载但不需要立即执行的 ES 模块
- ✅ 路由懒加载的模块
- ❌ 需要立即执行的模块（用 preinitModule）

---

### 3. ReactDOM.preinitModule

**用途：** 预加载并**立即执行** ESM 模块

**特点：**
- 高优先级
- 不仅下载，还会立即执行
- 适用于需要立即运行的模块

**使用示例：**
```jsx
// 预加载并立即执行模块
ReactDOM.preinitModule('/polyfill-module.js', {
  as: 'script',
  crossOrigin: 'anonymous'
});
```
**何时使用：**
- ✅ 需要立即执行的 polyfill
- ✅ 必须在其他代码前运行的初始化模块
- ❌ 只需要预加载的模块（用 preloadModule）

---

### 4. ReactDOM.prefetch

**用途：** 预取**未来可能用到**的资源（低优先级）

**特点：**
- 低优先级，浏览器空闲时下载
- 不阻塞关键资源加载
- 适用于可能访问的页面资源

**使用示例：**
```jsx
// 预取下一个路由的资源
ReactDOM.prefetch('/next-page.css', {
  as: 'style'
});

ReactDOM.prefetch('/next-page.js', {
  as: 'script'
});
```
**何时使用：**
- ✅ 用户可能访问的下一个页面资源
- ✅ 非关键的图片、脚本
- ❌ 当前页面必需的资源（用 preload）

---

### 5. ReactDOM.prefetchDNS

**用途：** 提前进行 DNS 解析

**特点：**
- 提前解析域名，减少连接延迟
- 适用于第三方域名

**使用示例：**
```jsx
// 预解析第三方域名
ReactDOM.prefetchDNS('https://fonts.googleapis.com');
ReactDOM.prefetchDNS('https://cdn.jsdelivr.net');
```
**何时使用：**
- ✅ 即将访问的第三方域名
- ✅ CDN 资源域名
- ✅ 第三方 API 域名

---

## 使用场景对比

### 场景 1：首屏字体加载
```jsx
// ✅ 正确：使用 preload（高优先级，立即加载）
ReactDOM.preload('/fonts/inter.woff2', {
  as: 'font',
  type: 'font/woff2',
  crossOrigin: 'anonymous',
  fetchPriority: 'high'
});
```

```jsx
// ❌ 错误：使用 prefetch（低优先级，可能来不及）
ReactDOM.prefetch('/fonts/inter.woff2', { as: 'font' });
```
### 场景 2：路由预加载
```jsx
// ✅ 正确：使用 prefetch（低优先级，不阻塞当前页面）
function NavigationLink({ to, children }) {
  const handleMouseEnter = () => {
    // 鼠标悬停时预取目标路由资源
    ReactDOM.prefetch(`${to}.css`, { as: 'style' });
    ReactDOM.prefetch(`${to}.js`, { as: 'script' });
  };
  
  return <Link to={to} onMouseEnter={handleMouseEnter}>{children}</Link>;
}
```
```jsx
// ❌ 错误：使用 preload（会阻塞当前页面关键资源）
```
### 场景 3：ES 模块预加载

```jsx
// 只需要预加载，不立即执行
ReactDOM.preloadModule('/lazy-component.js', {
  as: 'script'
});

// 需要立即执行
ReactDOM.preinitModule('/polyfill.js', {
  as: 'script'
});
```

## 决策流程图
```cmd
资源是否当前页面必需？
├─ 是 → 是 ESM 模块？
│   ├─ 是 → 需要立即执行？
│   │   ├─ 是 → 使用 preinitModule
│   │   └─ 否 → 使用 preloadModule
│   └─ 否 → 使用 preload
└─ 否 → 未来可能用到？
    ├─ 是 → 使用 prefetch
    └─ 否 → 第三方域名？
        └─ 是 → 使用 prefetchDNS
```

## 最佳实践
### ✅ 推荐做法
1. 首屏关键资源用 preload
```jsx
ReactDOM.preload('/critical.css', { as: 'style', fetchPriority: 'high' });
```

2. 未来资源用 prefetch
```jsx
// 鼠标悬停时预取   
onMouseEnter={() => ReactDOM.prefetch('/next-page.js', { as: 'script' })}
```

3. 第三方域名用 prefetchDNS
```jsx
ReactDOM.prefetchDNS('https://fonts.googleapis.com');
```
4. ES 模块区分预加载和执行
```jsx
// 只需要预加载   
ReactDOM.preloadModule('/module.js', { as: 'script' });   

// 需要立即执行   
ReactDOM.preinitModule('/polyfill.js', { as: 'script' });
```

### ❌ 避免的做法
1. 不要用 prefetch 加载关键资源
```jsx
  // ❌ 错误   
  ReactDOM.prefetch('/critical-font.woff2', { as: 'font' });      
  
  // ✅ 正确   
  ReactDOM.preload('/critical-font.woff2', { as: 'font' });
```

2. 不要过度使用 preload
```jsx
  // ❌ 错误：预加载太多资源会阻塞关键资源   
  ReactDOM.preload('/image1.jpg', { as: 'image' });   
  ReactDOM.preload('/image2.jpg', { as: 'image' });   
  ReactDOM.preload('/image3.jpg', { as: 'image' });   
  // ... 太多预加载
```

3. 不要混淆 preloadModule 和 preinitModule
```jsx
  // ❌ 错误：只需要预加载却立即执行   
  ReactDOM.preinitModule('/lazy-module.js', { as: 'script' });      
  
  // ✅ 正确   
  ReactDOM.preloadModule('/lazy-module.js', { as: 'script' });
```

## 性能影响

### preload vs prefetch 的性能差异

| 指标 | preload | prefetch |
|------|---------|----------|
| **下载优先级** | 高（与关键资源同级） | 低（空闲时下载） |
| **阻塞关键资源** | 可能阻塞 | 不阻塞 |
| **适用时机** | 当前页面必需 | 未来可能用到 |
| **性能提升** | 显著（首屏） | 中等（后续页面） |

## 总结
选择合适的资源提示 API 的关键：
1. **当前页面必需** → preload / preloadModule / preinitModule
2. **来可能用到** → prefetch
3. **第三方域名** → prefetchDNS
4. **ES 模块需要立即执行** → preinitModule
5. **ES 模块只需预加载** → preloadModule

记住：`preload 用于当前，prefetch 用于未来。`

## 参考

- [React 官方文档 - preload](https://zh-hans.react.dev/reference/react-dom/preload)
- [React 官方文档 - preloadModule](https://zh-hans.react.dev/reference/react-dom/preloadModule)
- [React 官方文档 - preinitModule](https://zh-hans.react.dev/reference/react-dom/preinitModule)
- [React 官方文档 - prefetch](https://zh-hans.react.dev/reference/react-dom/prefetch)
- [React 官方文档 - prefetchDNS](https://zh-hans.react.dev/reference/react-dom/prefetchDNS)
