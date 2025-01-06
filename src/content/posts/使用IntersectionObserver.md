---
title: 使用IntersectionObserver
published: 2023-05-14
description: ''
image: ''
tags: [js api]
category: 'JS'
draft: false 
lang: ''
---
## IntersectionObserver
`IntersectionObserver` 接口（从属于 [Intersection Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API)）提供了一种异步观察目标元素与其祖先元素或顶级文档[视口](https://developer.mozilla.org/zh-CN/docs/Glossary/Viewport)（viewport）交叉状态的方法。其祖先元素或视口被称为根（root）。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/88aae0fbf3ef4213960e4aa2f5b71d31~tplv-k3u1fbpfcp-watermark.image?)
<br/>
当一个 `IntersectionObserver` 对象被创建时，其被配置为监听根中一段给定比例的可见区域。一旦 `IntersectionObserver` 被创建，则无法更改其配置，所以一个给定的观察者对象只能用来监听可见区域的特定变化值；然而，你可以在同一个观察者对象中配置监听多个目标元素。
### 1. 用法

通过`new`关键字调用`IntersectionObserver()`构造函数创建一个`IntersectionObserver`对象实例，构造函数接收两个参数`callback`和`options`

```js
const root = document.querySelector('.root')
const imgList = document.querySelectorAll('img')

const option = {
  root: root,
  rootMargin: 0,
  thresholds: 1,
}

// 定义相交监视器
var observer = new IntersectionObserver(entries => {
  console.log(entries); //一个IntersectionObserverEntry对象实例数组，包含所有被监视的IntersectionObserverEntry对象

  entries.forEach(entrie => {
    console.log(entrie.time);               // 发生变化的时间
    console.log(entrie.rootBounds);         // 根元素的矩形区域的信息
    console.log(entrie.boundingClientRect); // 目标元素的矩形区域的信息
    console.log(entrie.intersectionRect);   // 目标元素与视口（或根元素）的交叉区域的信息
    console.log(entrie.intersectionRatio);  // 目标元素与视口（或根元素）的相交比例
    console.log(entrie.target);             // 被监视的目标元素
  })
                
}, option);

// 开始监视某个目标元素
observer.observe(target);

// 停止监视某个目标元素
observer.unobserve(target);

// 关闭监视器
observer.disconnect();
```

### 2. IntersectionObserver callback
`callback`是添加监听后，当监视的目标元素的可见比例超过指定阈值时,即目标元素到达可视区域时触发该回调函函数。该回调函数接受两个参数：
- entries: `IntersectionObserverEntry`对象实例数组，包含所有被监视的`IntersectionObserverEntry`对象，描述所有目标元素与root的交叉状态。
- observer：被调用的`IntersectionObserver`实例
#### 2.1. IntersectionObserverEntry 介绍
IntersectionObserverEntry 对象提供了目标元素与`root`根元素相交的详细信息。他有如下几个属性。
具体参数如下：

| 属性                    | 说明                                                                            |
| --------------------- | ----------------------------------------------------------------------------- |
| boundingClientRect    | 返回包含目标元素的边界信息，返回结果与[Element.getBoundingClientRect()](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getBoundingClientRect) 相同                         |
| **intersectionRatio** | 返回目标元素出现在可视区的比例                                                               |
| intersectionRect      | 用来描述root和目标元素的相交区域                                                            |
| **isIntersecting**    | 返回一个布尔值，下列两种操作均会触发callback：1. 如果目标元素出现在root可视区，返回true。2. 如果从root可视区消失，返回false |
| rootBounds            | 用来描述交叉区域观察者(intersection observer)中的根.                                        |
| target                | 目标元素：与根出现相交区域改变的元素 (Element)                                                  |
| time                  | 返回一个记录从 IntersectionObserver 的时间原点到交叉被触发的时间的时间戳                               |

表格中加粗的两个属性是比较常用的判断条件：**isIntersecting**和**intersectionRatio**

![IntersectionObserverEntry打印的值](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/129f854cc119425b9667989c10678dd2~tplv-k3u1fbpfcp-zoom-1.image)
#### 2.2. IntersectionObserver Entry 图解
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b206bebccfd844caaae755a6d1729572~tplv-k3u1fbpfcp-zoom-1.image) 
- **time**：发生相交到相应的时间，毫秒。
- **rootBounds**：根元素矩形区域的信息，如果没有设置根元素则返回null，图中蓝色部分区域。
- **boundingClientRect**：目标元素的矩形区域的信息，图中黑色边框的区域。
- **intersectionRect**：目标元素与视口（或根元素）的交叉区域的信息，图中蓝色方块和粉红色方块相交的区域。
- **isIntersecting**：目标元素与根元素是否相交
- **intersectionRatio**：目标元素与视口（或根元素）的相交比例。
- **target**：目标元素，图中黑色边框的部分。


### 3. IntersectionObserver options

options是一个对象，用来配置参数，也可以不填。共有三个属性，具体如下：

| 属性         | 说明                                                                                                                                                                                                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| root       | 所监听对象的具体祖先元素。如果未传入值或值为`null`，则默认使用顶级文档的视窗(一般为html)。                                                                                                                                                                                                                                                             |
| rootMargin | 计算交叉时添加到**根(root)**边界盒[bounding box](https://link.juejin.cn?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FGlossary%2Fbounding_box "https://developer.mozilla.org/en-US/docs/Glossary/bounding_box")的矩形偏移量， 可以有效的缩小或扩大根的判定范围从而满足计算需要。所有的偏移量均可用**像素**(`px`)或**百分比**(`%`)来表达, 默认值为"0px 0px 0px 0px"。 |
| threshold  | 一个包含阈值的列表, 按升序排列, 列表中的每个阈值都是监听对象的交叉区域与边界区域的比率。当监听对象的任何阈值被越过时，都会触发callback。默认值为0。                                                                                                                                                                                                                               |

**options图解介绍**
- **root**：设置监视器的根节点，不传则默认为视口。
- **rootMargin**： 类似于 CSS 的 margin 属性。用来缩小或扩大 rootBounds，从而影响相交的触发。如下图，当我们把 rootMargin 设置为["-5px", "-8px", "-10px", "-8px"]时，可视区域缩小为黑色框区域，目标元素只有进入黑色框区域才会触发回调函数。
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d115a1a42297477b974d964817a1c39f~tplv-k3u1fbpfcp-watermark.image?)
- **threshold**：属性决定相交比例为多少时，触发回调函数。取值为 0 ~ 1，或者 0 ~ 1的数组。 如下图，当我们把 threshold 设置为 [0, 0.25, 0.5, 0.75, 1]，绿色方块分别在 0%，25%，50%，75%，100% 可见时，触发回调函数。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0cb0361e4b364981bbdc4df991356379~tplv-k3u1fbpfcp-zoom-1.image)


### 4.方法

介绍了这么多配置项及参数，差点忘了最重要的，IntersectionObserver有哪些方法？ 如果要监听某些元素，则必须要对该元素执行一下observe

| 方法            | 说明                                     |
| ------------- | -------------------------------------- |
| observe()     | 开始监听一个目标元素                             |
| unobserve()   | 停止监听特定目标元素                             |
| takeRecords() | 返回所有观察目标的IntersectionObserverEntry对象数组 |
| disconnect()  | 使IntersectionObserver对象停止全部监听工作        |


### 5.应用
**① 图片懒加载**
1. `img`标签使用默认图片，自定义属性`data-resource-url`存储真实图片地址
2. `img`标签进入可视区域时替换真实图片地址
~~~html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="./index.css">
  <title>Document</title>
</head>
<body>
  <div class="root">
    <img src="./img/default_img.jpg" alt="" data-resource-url="./img/Icon.png">
    <img src="./img/default_img.jpg" alt="" data-resource-url="./img/unko-anime.gif">
    <img src="./img/default_img.jpg" alt="" data-resource-url="./img/喇叭.png">
    <img src="./img/default_img.jpg" alt="" data-resource-url="./img/喵喵.jpg">
    <img src="./img/default_img.jpg" alt="" data-resource-url="./img/带刀剑士.png">
  </div>

  <script src="./index.js"></script>
</body>
</html>
~~~
~~~css
* {
  margin: 0;
  padding: 0;
}

body {
  position:  relative;
  width: 100vw;
  height: 100vh;
}

.root {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  border: 2px solid slategray;
  overflow-y: auto;
}

.root img {
  display: block;
  margin: 0 auto;
  width: 100%;
  height: 210px;
  border: 1px solid rgb(94, 100, 102);
}
~~~
~~~js
const root = document.querySelector('.root')
const imgList = document.querySelectorAll('img')

const observerOption = {
  root: root,
}

//创建监听观察者实例
const observer = new IntersectionObserver((entries) => {
    console.log(entries);
    //entries: 是监听所有IntersectionObserverEntry的集合
    entries.forEach((item) => {
      // isIntersecting是一个Boolean值，判断目标元素当前是否可见
      if (item.isIntersecting) {
        // 进入可视区域替换真实图片地址(定时器延迟加载好观察效果)
        setTimeout(() => {
          item.target.src = item.target.dataset.resourceUrl
        },1000)
        
        // 图片加载后即停止监听该元素
        observer.unobserve(item.target)
      }
    })
    
}, observerOption)

//observe遍历监听所有img节点
imgList.forEach(img => observer.observe(img))
~~~

![演示.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6d089796dc0d48ba819024e1734b757b~tplv-k3u1fbpfcp-watermark.image?)

### 6.参考链接
[MDN: IntersectionObserver](https://link.juejin.cn/?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FIntersectionObserver "https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver")
<br/>
[MDN: IntersectionObserverEntry](https://link.juejin.cn/?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FIntersectionObserverEntry "https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry")
<br/>
[超好用的API之IntersectionObserver - 掘金 (juejin.cn)](https://juejin.cn/post/6844903874302574599)
<br/>
[深入理解 Intersection Observer - 掘金 (juejin.cn)](https://juejin.cn/post/6844903927419256846)
