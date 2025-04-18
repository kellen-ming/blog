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
 * @example 
 *  spliceString(['12313', 'kellen']) => "12313-kellen"
 *  spliceString(['12313', undefined]) => "12313"
 *  spliceString([null, 'kellen']) => "kellen"
 */
function spliceString(
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

### 数字大写转换
```tsx
/**
 * 
 * @param number 需要转换的数字
 * @returns 
 * @example upperCaseNumber(1234567890.12) // "壹拾贰亿叁仟肆佰伍拾陆万柒仟捌佰玖拾元壹角贰分"
 */
function upperCaseNumber (number: number) {
  const fraction = [ '角', '分' ];
  const digit = [ '零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖' ];
  const unit = [
    [ '元', '万', '亿', '万亿' ],
    [ '', '拾', '佰', '仟' ],
  ];
  const sign = number < 0 ? '负' : '';
  let num = Math.abs(number);
  let s = '';
  fraction.forEach((item, index) => {
    s += (digit[Math.floor(num * 10 * 10 ** index) % 10] + item).replace(/零./, '');
  });
  s = s || '整';
  num = Math.floor(num);
  for (let i = 0; i < unit[0].length && num > 0; i += 1) {
    let p = '';
    for (let j = 0; j < unit[1].length && num > 0; j += 1) {
      p = digit[num % 10] + unit[1][j] + p;
      num = Math.floor(num / 10);
    }
    s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
  }
  return sign + s
    .replace(/(零.)*零元/, '元')
    .replace(/(零.)+/g, '零')
    .replace(/^整$/, '零元整');
}

```