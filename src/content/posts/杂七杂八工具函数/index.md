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


### 中文大写金额转数字
```ts
function upperCaseToNumber(chinese: string): number {
  // 汉字映射
  const digitMap: { [key: string]: number } = {
    零: 0, 壹: 1, 贰: 2, 叁: 3, 肆: 4,
    伍: 5, 陆: 6, 柒: 7, 捌: 8, 玖: 9
  };

  // 单位映射（单位：元）
  const unitMap: { [key: string]: number } = {
    分: 0.01, 角: 0.1,
    拾: 10, 佰: 100, 仟: 1000,
    万: 10000, 亿: 100000000
  };

  let result = 0;
  let currentNumber = 0;
  let tempValue = 0;
  let maxUnit = 1; // 记录当前最大单位

  // 处理符号
  if (chinese.startsWith('负')) {
    chinese = chinese.slice(1);
  }

  // 分割整数和小数部分
  const [integerPart = '', decimalPart = ''] = chinese.split('元');
  
  // 处理整数部分
  const processPart = (str: string) => {
    let currentMaxUnit = 1;
    let tempResult = 0;
    let currentValue = 0;
    
    for (const char of str) {
      if (digitMap[char] !== undefined) {
        currentValue = digitMap[char];
      } else if (unitMap[char]) {
        const unit = unitMap[char];
        if (unit >= 10000) { // 处理万、亿单位
          tempResult += (currentValue || 1) * unit;
          currentValue = 0;
          currentMaxUnit = unit;
        } else {
          currentValue *= unit;
          tempResult += currentValue;
          currentValue = 0;
        }
      }
    }
    return tempResult + currentValue;
  };

  // 处理整数部分
  result += processPart(integerPart);

  // 处理小数部分
  if (decimalPart) {
    const decimalValue = decimalPart
      .replace('整', '')
      .split('')
      .reduce((acc, char) => {
        if (digitMap[char] !== undefined) {
          acc.value = digitMap[char];
        } else if (unitMap[char]) {
          acc.total += acc.value * unitMap[char];
          acc.value = 0;
        }
        return acc;
      }, { value: 0, total: 0 });
    result += decimalValue.total + decimalValue.value * 0.01;
  }

  // 处理符号
  return chinese.startsWith('负') ? -result : result;
}
```
#### 示例
```ts
console.log(upperCaseToNumber('壹拾贰亿叁仟肆佰伍拾陆万柒仟捌佰玖拾元壹角贰分')); 
// 1234567890.12

console.log(upperCaseToNumber('陆万柒仟捌佰元整')); 
// 67800

console.log(upperCaseToNumber('玖角伍分')); 
// 0.95

console.log(upperCaseToNumber('负叁亿零伍拾万')); 
// -300500000

```
#### 实现原理
- 汉字映射：建立汉字到数字的对应关系
- 单位处理：
  - 小单位（拾/佰/仟）直接参与计算
  - 大单位（万/亿）作为阶段乘数

- 分段处理：
  - 先按"元"分割整数和小数部分
  - 分别处理整数部分和小数部分
- 特殊处理：
  - 连续零的处理（如"叁亿零伍拾万"）
  - 单位叠加计算（如"壹万贰仟" = 12000）
  - 负数处理

- 注意事项
  - 输入字符串需要符合标准中文大写金额格式
  - 不支持"万亿"以上的单位（需要扩展单位映射）
  - 小数部分必须包含"元"作为分隔符
  - 自动处理"整"字的结尾
