---
title: react-router鉴权方案
published: 2023-06-06
description: ''
image: ''
tags: [react-router]
category: 'React'
draft: false 
lang: ''
---

## 1 提出需求

*   有四个页面：

```jsx
/index
/login
/backend
/admin
```

*   三种角色

```jsx
1.  `未登录用户` ：只能访问网站首页 `/index` 和登录页 `/login`
2.  `普通用户` ：可以访问网站首页 `/index` ，登录页 `/login` 和后台页面 `/backend`
3.  `管理员` ：可以访问管理页面 `/admin` 和其他所有页面
```

## 2 安装依赖库

```bash
npm install react-router-dom
```

## 3 首先简单搭建一下路由

### 3.1 基本结构

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/466249bdc8b94c7194dd252614d5b2d7~tplv-k3u1fbpfcp-watermark.image?)

### 3.2 写点代码

```jsx
// App.jsx
import React, { Suspense, lazy } from "react"
import {
  Route,
  Routes,
} from 'react-router-dom'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Backend = lazy(() => import('./pages/Backend'))
const Admin = lazy(() => import('./pages/Admin'))
function App() {

  return (
    //注册路由 
      <Suspense fallback = {<div>Loading...</div>}>
        <Routes>
            <Route index path="/" element={<Home />} />
            <Route path="/login" element={ <Login/> }/>
            <Route path="/backend" element={ <Backend/> }/>
            <Route path="/admin" element={<Admin/> }/>
        </Routes>
      </Suspense>
  )
}

export default App

```

```jsx
//Home.jsx
import React from "react";
import { Link } from 'react-router-dom'
export default function Home (props) {
  return (
    <ul>
      <h1>首页</h1>
      <ul>
        <li><Link to="/login">登录</Link></li>
        <li><Link to="/backend">后台</Link></li>
        <li><Link to="/admin">管理员</Link></li>
      </ul>
    </ul>
  )
}


//Admin.jsx
import React from "react";
import { useNavigate } from "react-router-dom"; 
export default function Admin (props) {
  const navigate = useNavigate()
  return <div>
      Admin
      <button onClick={() => navigate('/')}>首页</button>
    </div>
}

//Backend.jsx
import React from "react";
import { useNavigate } from "react-router-dom"; 
export default function Backend (props) {
  const navigate = useNavigate()
  return <div>
      backend
      <button onClick={() => navigate('/')}>首页</button>
    </div>
}

//Login.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
export default function Login (props) {
  const navigate = useNavigate()
  return <div>
    login 
    <button onClick={() => navigate('/')}>首页</button>
  </div>
}

```

### 3.4 效果

![演示1111.gif](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8093419527424ba888b317be82c1b33a~tplv-k3u1fbpfcp-watermark.image?)

## 4 模块划分

观察需求，其实我们总共就三种角色，对应三种不同的权限，这三个权限还有层级关系，高级别的权限包含了低级别的权限，所以我们的页面也可以按照这些权限分为三种：**公共页面**，**普通页面**和**管理员页面**。

为了好管理这三种页面，我们可以将他们抽取成三个文件，放到一个独立的文件夹 `routes` 里面，三个文件分别命名为 `publicRoutes.js` ， `privateRoutes.js` ， `adminRoutes.js` 。且每种权限的文件我们都可以制定一个特有的路由表再导出使用，如，`publicRoutes.js` ：

```jsx
import { lazy } from "react"
const Login = lazy(() => import('../pages/Login'))
const Home = lazy(() => import('../pages/Home'))

const publicRoutes = [
  {
    path: '/login',
    element: <Login />,
    exact: true
  },
  {
    path: '/',
    element: <Home />,
    exact: true
  }
]

export default publicRoutes
```

在App使用的时候就可以改写成遍历路由表的方式生成路由

```jsx
import React, { Suspense } from "react"
import {
  Route,
  Routes,
} from 'react-router-dom'
import publicRoutes from "./routes/publicRoutes"

function App() {

  return (
    //注册路由 
      <Suspense fallback = {<div>Loading...</div>}>
        <Routes>
            { publicRoutes.map(({ path, element, ...routes}) => (
                <Route key={path} path={path} element={element} {...routes} />
              ))
            }
        </Routes>
      </Suspense>
  )
}

export default App

```

但是对于需要登录才能访问的页面和管理员页面我们不能直接渲染 `Route` 组件，我们最好再封装一个高级组件，将鉴权的工作放到这个组件里面去，这样我们普通的页面在实现时就不需要关心怎么鉴权了。

## 5 封装高阶组件

要封装这个鉴权组件思路也很简单，前面我们将 `publicRoutes` 直接拿来循环渲染了 `Route` 组件，我们的鉴权组件只需要在这个基础上再加一个逻辑就行了：在渲染真正的 `Route` 组件前先检查一下当前用户是否有对应的权限，如果有就直接渲染 `Route` 组件，如果没有就返回某个页面，可以是登录页或者后台首页，具体根据自己项目需求来。所以我们的路由配置文件 `privateRoutes.js` ， `adminRoutes.js` 里面的路由会比 `publicRoutes.js` 的多两个参数：

```jsx
// adminRoutes.jsx
import { lazy } from "react"
const Admin = lazy(() => import('../pages/Admin'))

const adminRoutes = [
  {
    path: '/admin',
    element: <Admin />,
    exact: true,
    role: 'admin',       // 当前路由需要的角色权限(可以设置多个，看需求多个的话可以用数组存)
    backUrl: '/login'   // 不满足权限跳转的路由
  },
  
]

export default adminRoutes


// privateRoutes.jsx
import { lazy } from "react"
const Backend = lazy(() => import('../pages/Backend'))

const privateRoutes = [
  {
    path: '/backend',
    element: <Backend />,
    exact: true,
    role: 'user',       // 当前路由需要的角色权限(可以设置多个，看需求多个的话可以用数组存)
    backUrl: '/login'   // 不满足权限跳转的路由
  },
  
]

export default privateRoutes
```

写一个高阶组件 `AuthRoute` 为路由组件添加上鉴权判断。注意我们这里假设的用户登录时后端API会返回给我们当前用户的角色，一个用户可能有多个角色，比如普通用户的角色是 `['user']` ，管理员的角色是 `['user', 'admin']` ，具体的权限验证逻辑要看自己项目权限的设计。

```jsx
// AuthRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

function AuthRoute(props) {
  const {
    userRole = [], //用户角色[role1, role2, ...]
    role, //路由角色
    backUrl, //失败默认返回url
    children
  } = props

  //如果用户有权限，就渲染对应路由
  if(userRole && userRole.includes(role)) {
    return children
  }
  else {
    // 如果没有权限，返回配置的默认路由
    return <Navigate to={backUrl} replace />
  }
}

export default AuthRoute
```

使用 `AuthRoute` 高阶组件渲染 `adminRoutes` 和 `privateRoutes` :

```jsx
// App.jsx
import React, { Suspense} from "react"
import {
  Route,
  Routes,
} from 'react-router-dom'
import publicRoutes from "./routes/publicRoutes"
import privateRoutes from "./routes/privateRoutes"
import adminRoutes from "./routes/adminRoutes"
import AuthRoute from "./routes/AuthRoute"

function App() {
  //模拟获取的用户权限标识(请求拿到的)
  const userRole = ['user']

  return (
    //注册路由 
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* 公共路由菜单 */}
        { publicRoutes.map(({ path, element, ...routes }) => (
            <Route key={path} path={path} element={element} {...routes} />
        ))}
        {/* 私有路由菜单 */}
        { privateRoutes.map(({ path, element, backUrl, role, ...routes }) => (
            <Route
              key={path}
              path={path}
              element={
                <AuthRoute
                  userRole={userRole}
                  role={role}
                  backUrl={backUrl}
                >
                  {element}
                </AuthRoute>
              }
              {...routes}
            />
        ))}
        {/* 管理员路由菜单 */}
        { adminRoutes.map(({ path, element, backUrl, role, ...routes }) => (
            <Route
              key={path}
              path={path}
              element={
                <AuthRoute
                  userRole={userRole}
                  role={role}
                  backUrl={backUrl}
                >
                  {element}
                </AuthRoute>
              }
              {...routes}
            />
        ))}
      </Routes>
    </Suspense>
  )
}

export default App

```

## 6 效果

这里设置的全是只有 `[user]` （在5的代码中），所以只能查看到 `首页`、`登录页` 和 `后台页` ，点击 `管理员页` , 会重定向到 `登录页`。

![演示1111123.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/382dc7f2ad204d6a858f1feecc04d013~tplv-k3u1fbpfcp-watermark.image?)
