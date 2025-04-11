---
title: 杂七杂八工具函数
published: 2025-04-11
description: ''
image: ''
tags: ['function']
category: 'JS'
draft: false 
lang: ''
---

### 拼接字符串
```tsx
/**
 * 
 * @param strArr 字符串数组
 * @param spliceStr 拼接字符
 * @returns 
 */
export function spliceString(
  strArr: (string | null | undefined)[],
  spliceStr?: string
): string | undefined {
  // 检查数组非空且所有元素为 null 或 undefined
  if (strArr.length > 0 && strArr.every(item => item == null)) {
    return undefined;
  }
  // 将 null/undefined 转为空字符串后连接
  return strArr
    .map(item => (item == null ? '' : item))
    .join(spliceStr ?? '');
}
```