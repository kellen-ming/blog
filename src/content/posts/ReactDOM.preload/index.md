---
title: ReactDOM.preload
published: 2025-12-16
description: 'ReactDOM.preload 用于在组件渲染前预加载关键资源，优化首屏性能。本文介绍其参数配置和 10 个实用场景，涵盖字体、CSS、脚本、图片等资源的预加载策略。'
image: './images/random-img.webp'
tags: ['react-api', '预加载']
category: 'React'
draft: false 
lang: 'zh'
---

## 简介
`ReactDOM.preload`React 提供的资源预加载 API，用于在组件真正渲染前，提前告诉浏览器高优先级加载“当前页面一定会用到”的关键资源。

它在语义上等价于`<link rel="preload"> `，但由 React 统一管理，适用于并发渲染和 SSR / Streaming 场景。

## 主要功能（它解决了什么问题）
用于提前预加载关键资源（脚本、样式、字体、图像等），优化页面性能。即：将`“资源加载”提前到渲染之前，缩短关键渲染路径。`

在并发渲染或 Streaming SSR 场景中：
- 组件可能还没 render
- 但已经确定某些资源马上会被使用（图片 / 字体 / CSS / JS）

如果等组件 render 后再触发资源加载，会导致：
- 首屏资源下载启动过晚
- LCP（Largest Contentful Paint）变慢
- Suspense resolve 后出现二次等待



## 参数/属性
### `preload(href, options) `

参数名 | 类型 | 必填 | 默认值 | 描述
|---|---|---|---|---|
|`href`|string|	✅|-|要预加载的资源URL|
|`options`|object|✅	|-|配置选项|

### `options` 对象参数:
| 属性            | 类型    | 必填 | 默认值     | 描述                    | 有效值                                                                                 |
| --------------- | ------- | ---- | ---------- | ----------------------- | -------------------------------------------------------------------------------------- |
| as              | string  | ✅   | -          | 资源类型                | 'audio', 'document', 'embed', 'font', 'image', 'object', 'script', 'style', 'track', 'video', 'worker' |
| crossOrigin     | string  | ❌   | undefined  | CORS设置                | 'anonymous', 'use-credentials'                                                         |
| integrity       | string  | ❌   | undefined  | 子资源完整性(SRI)       | 哈希字符串 (如 'sha256-abc123...')                                                     |
| type            | string  | ❌   | undefined  | 资源MIME类型            | 'font/woff2', 'text/css', 'application/javascript' 等                                  |
| fetchPriority   | string  | ❌   | 'auto'     | 加载优先级              | 'high', 'low', 'auto'                                                                  |
| referrerPolicy  | string  | ❌   | undefined  | Referrer策略            | 'no-referrer', 'no-referrer-when-downgrade', 'origin', 'origin-when-cross-origin', 'unsafe-url' |
| imageSrcSet     | string  | ❌   | undefined  | 响应式图片源集          | 仅当 as: 'image' 时有效                                                                |
| imageSizes      | string  | ❌   | undefined  | 响应式图片尺寸          | 仅当 as: 'image' 时有效                                                                |
| media           | string  | ❌   | undefined  | 媒体查询条件            | 如 '(max-width: 768px)'                                                                |

## 使用场景
### Case1：预加载字体文件
```jsx
import ReactDOM from 'react-dom';

// 预加载自定义字体，避免FOUT/FOIT
ReactDOM.preload('/fonts/inter-bold.woff2', {
  as: 'font',
  type: 'font/woff2',
  crossOrigin: 'anonymous',
  fetchPriority: 'high'
});
```
> 📌字体 preload 几乎总是需要`crossOrigin`。

### Case2：预加载关键CSS
```jsx
// 分离关键CSS和非关键CSS
ReactDOM.preload('/critical.css', {
  as: 'style',
  fetchPriority: 'high'
});

// 延迟加载非关键CSS
ReactDOM.preload('/non-critical.css', {
  as: 'style',
  fetchPriority: 'low',
  media: 'print', // 初始设为print，加载后切换
  onLoad: () => {
    document.querySelector('link[href="/non-critical.css"]').media = 'all';
  }
});
```

### Case3：预加载脚本模块

```jsx
// 预加载ES模块
ReactDOM.preload('/analytics-module.js', {
  as: 'script',
  type: 'module',
  crossOrigin: 'anonymous',
  integrity: 'sha256-abc123...'
});

// 预加载JSON模块
ReactDOM.preload('/config.json', {
  as: 'fetch',
  type: 'application/json'
});
```

### Case4：响应式图片预加载

```jsx
// 预加载响应式图片
ReactDOM.preload('/hero-image.jpg', {
  as: 'image',
  fetchPriority: 'high',
  imageSrcSet: `
    hero-image-320w.jpg 320w,
    hero-image-480w.jpg 480w,
    hero-image-800w.jpg 800w
  `,
  imageSizes: `
    (max-width: 320px) 280px,
    (max-width: 480px) 440px,
    800px
  `
});
```

### Case5：视频资源预加载

```jsx
// 预加载视频元数据，但不下载整个视频
ReactDOM.preload('/product-demo.mp4', {
  as: 'video',
  type: 'video/mp4',
  fetchPriority: 'low', // 非关键资源用低优先级
  media: '(min-width: 1024px)' // 仅在大屏幕预加载
});
```

### Case6：第三方资源预加载

```jsx
// 预加载Google字体
ReactDOM.preload('https://fonts.gstatic.com/s/inter/v12/...woff2', {
  as: 'font',
  crossOrigin: 'anonymous',
  type: 'font/woff2'
});

// 预加载CDN上的脚本
ReactDOM.preload('https://cdn.jsdelivr.net/npm/chart.js', {
  as: 'script',
  crossOrigin: 'anonymous'
});
```

### Case7：条件性预加载策略

```jsx
import { useState, useEffect } from 'react';

function SmartPreloadComponent() {
  const [shouldPreload, setShouldPreload] = useState(false);
  
  // 用户接近特定区域时触发预加载
  useEffect(() => {
    const observer = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !shouldPreload) {
        setShouldPreload(true);
        
        // 预加载下一屏内容
        ReactDOM.preload('/next-section.css', { as: 'style' });
        ReactDOM.preload('/interactive-widget.js', { as: 'script' });
      }
    }, { threshold: 0.1 });
    
    const trigger = document.querySelector('#next-section-trigger');
    if (trigger) observer.observe(trigger);

    return () => observer.disconnect();
  }, [shouldPreload]);
  
  return <div id="next-section-trigger">...</div>;
}
```

### Case8：基于网络条件的智能预加载

```jsx
import { useEffect } from 'react';

function AdaptivePreload() {
  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      switch (connection.effectiveType) {
        case '4g':
          // 高速网络：预加载更多资源
          ReactDOM.preload('/carousel-images.jpg', { as: 'image' });
          ReactDOM.preload('/video-preview.mp4', { as: 'video' });
          ReactDOM.preload('/comments-widget.js', { as: 'script' });
          break;
        case '3g':
          // 中速网络：只预加载关键资源
          ReactDOM.preload('/hero-image.jpg', { as: 'image', fetchPriority: 'high' });
          break;
        case '2g':
        case 'slow-2g':
          // 低速网络：不预加载额外资源
          break;
      }
      if (connection.saveData) {
        console.log('省流量模式开启，跳过非关键预加载');
      }
    }
  }, []);
  
  return <div>自适应预加载组件</div>;
}
```

### Case9：路由级资源预加载

```jsx
import { useNavigate } from 'react-router-dom';

const routePreloadConfig = {
  '/dashboard': [
    { href: '/dashboard-styles.css', as: 'style' },
    { href: '/charts-library.js', as: 'script' }
  ],
  '/editor': [
    { href: '/monaco-editor.css', as: 'style' },
    { href: '/monaco-editor.js', as: 'script', fetchPriority: 'high' }
  ]
};

function useRoutePreload() {
  const navigate = useNavigate();
  
  const preloadAndNavigate = (path) => {
    // 预加载目标路由资源
    const resources = routePreloadConfig[path] || [];
    resources.forEach(({ href, ...options }) => {
      ReactDOM.preload(href, options);
    });
    // 延迟导航，确保资源开始加载
    setTimeout(() => navigate(path), 50);
  };
  
  return preloadAndNavigate;
}
```

### Case10：错误处理和回退

```jsx
import { useState, useEffect } from 'react';

function SafePreloadComponent({ imageUrl, fallbackUrl }) {
  const [preloadFailed, setPreloadFailed] = useState(false);
  
  useEffect(() => {
    // 创建link元素进行预加载
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = imageUrl;
    link.as = 'image';
    
    // 添加错误处理
    link.addEventListener('error', () => {
      console.warn(`预加载失败: ${imageUrl}`);
      setPreloadFailed(true);
      // 尝试预加载回退资源
      if (fallbackUrl) {
        ReactDOM.preload(fallbackUrl, { as: 'image' });
      }
    });
    
    // 添加成功回调
    link.addEventListener('load', () => {
      console.log(`预加载成功: ${imageUrl}`);
    });
    
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, [imageUrl, fallbackUrl]);
  
  return (
    <img 
      src={preloadFailed ? fallbackUrl : imageUrl} 
      alt="示例图片"
      onError={(e) => {
        if (fallbackUrl && e.target.src !== fallbackUrl) {
          e.target.src = fallbackUrl;
        }
      }}
    />
  );
}
```
## 什么时候使用
:::tip
只有当“资源一定会在当前页面立即使用，并且影响首屏体验”时，才考虑使用 ReactDOM.preload。
:::



## 参考
[React 官网](https://zh-hans.react.dev/reference/react-dom/preload)