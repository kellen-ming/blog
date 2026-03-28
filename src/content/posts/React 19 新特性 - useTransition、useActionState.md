---
title: React 19 新特性 - useTransition、useActionState
published: 2024-12-23
description: 'react 19 新特性'
image: ''
tags: ['react-hooks']
category: 'React'
draft: false 
---


### 在 React 中如何实现乐观更新

在开始看 useOptimistic 前，我们先将状态分成两种。

*   **真正的状态**：由 useState 返回的 state
*   **乐观状态**：预设更新成功时的状态

由 useOptimistic 返回的 optimisticState (乐观状态)。
有了基本观念之后就可以来看 useOptimistic，他接收两个参数，也返回两个值

```tsx
import { useOptimistic } from 'react';

function App() {
  const [optimisticState, addOptimistic] = useOptimistic<any, any>(
    state, // 初始 state
    // 处理乐观更新的函数 updateFn
    (currentState, optimisticValue) => {
      // 回传生成的乐观状态，当非同步处理完成后回传真正的新值
    }
  );
}
```

接着让我们详细看看 useOptimistic 函数的参数：

*   第一个参数 state: 初始的真正状态，通常是由 useState 返回的 state
*   第二个参数 updateFn(currentState, optimisticValue)：是一个函数，它接受当前的真正状态和传递给 addOptimistic 的乐观值 (optimisticValue)，并返回生成的乐观状态 (optimisticState)

也就是说这个函数接收两个参数，真正的状态和乐观状态，并返回新的乐观状态

### useState 和 useOptimistic 的差别

其实 useOptimistic 和 useState 有点像，一样回传两个值，第一个值是状态，第二个值是更新状态的函数

```tsx
type Todo = {
  text: string;
}

const initValue: Todo[] = [{text: '吃饭'}]

const [state, setState] = useState<Todo[]>(initValue);
const [optimisticState, setOptimisticState] = useOptimistic(state,
  (currentState, optimisticValue) => {
    return [
      ...state,
      {text: optimisticValue}
    ]
  }
)
```

只不过 useOptimistic 除了接收初始状态，也接收第二个参数负责生成乐观状态。**在真正的状态完成更新前，都会显示乐观状态**

### 实际案例

接下来让我们看看实际应用场景，假设我们有个更新代办清单的操作，我们希望用户输入完新的代办事项后乐观更新 UI，而不用等待伺服器回传成功后才更新 UI

首先创建 `addTodoAction` 函数用于模拟异步请求新增待办事项

```tsx
/** 新增代表事件 */
export async function addTodoAction(todo: string) {
  return new Promise<string>((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.3) {
        resolve(todo);
      } else {
        reject("Failed!");
      }
    }, 1000);
  });
}
```

然后写一下form主体代码

```tsx
function TodoList() {
  const formRef = useRef<HTMLFormElement>(null);

  const [todos, setTodos] = useState<Todo[]>([{ text: "吃饭", adding: false }]);
 
  const formAction = async (formData: FormData) => {
     // to do somethings...
  };

  return (
    <>
      <h3>TodoList:</h3>
      <ul>
        {/* 👇 用 map 去渲染所有的 todo */}
        {todos.map((todo, index) => (
          <li key={index}>
            {todo.text}
          </li>
        ))}
      </ul>

      <br />

      <form action={formAction} ref={formRef}>
        <input type="text" name="todo" placeholder="add new todo" />
        <button type="submit">新增</button>
      </form>
    </>
  );
}
```

### 非乐观更新-使用useState实现

我们可以直接在formAction函数里调用接口请求，当请求成功后再使用setTodos更新状态。

> formAction 也是 React 19 更新的特性。可以[参考 React 官方的介绍](https://react.dev/reference/react-dom/components/form)。

```tsx
/**
 * @description 不使用乐观更新的例子
 * @returns 
 */
function TodoList() {
  const formRef = useRef<HTMLFormElement>(null);

  const [todos, setTodos] = useState<Todo[]>([{ text: "吃饭", adding: false }]);
 
  const formAction = async (formData: FormData) => {
    const newTodo = formData.get("todo");
    if(!newTodo) return;

    formRef.current?.reset();

    try {
      const response = await addTodoAction(newTodo as string);
      setTodos((prevTodos) => [
        ...prevTodos,
        { text: response, adding: false },
      ]);
    } catch (err) {
      alert(`待办事件添加失败：${err}`);
    }
  };

  return (
    <>
      <h3>TodoList(非乐观更新):</h3>
      <ul>
        {/* 👇 用 map 去渲染所有的 todo */}
        {todos.map((todo, index) => (
          <li key={index}>
            {todo.text}
          </li>
        ))}
      </ul>

      <br />

      <form action={formAction} ref={formRef}>
        <input type="text" name="todo" placeholder="add new todo" />
        <button type="submit">新增</button>
      </form>
    </>
  );
}
```

可以看到，只有在接口响应之后才会加载新增的todo，显得非常的生硬。
****
![PixPin\_2024-12-24\_17-53-15.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/426d92d734d34bfeb6d8a394ff9ca1f1~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgS2VsbGVu:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMTAwNzU4NzAzMDk5MTE2NSJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1736243329&x-orig-sign=Zj0B3K6fQkk7OcMSKW5cQooouAw%3D)

### 乐观更新-使用useOptimistic实现

我们先通过 `useOptimistic` 获取到一个乐观更新值和乐观更新函数。 `useOptimistic`第一个参数接收由 useState 返回的 todos，第二个参数接收一个生成 optimisticTodos 的函数，也就是新增一个 adding 为 true 的 todo 物件。

```tsx
import { useOptimistic, useState, useRef } from "react";

/** 新增代表事件 */
export async function addTodoAction(todo: string) {
 //...
}

/**
 * @description 使用乐观更新的例子
 * @returns 
 */
export function TodoList() {
  // ...
  const [todos, setTodos] = useState<Todo[]>([{ text: "吃饭", adding: false }]);
  
  // 👇 useOptimistic
  const [optimisticTodos, setOptimisticTodos] = useOptimistic(
    todos, // 初始状态state
    // 会先生成乐观状态，直到新的 todos state 更新后才会取代乐观状态
    (prevTodos, newTodo) => [
      ...prevTodos,
      {
        text: newTodo,
        adding: true,
      },
    ]
  );

  //...

  return (<>{/*...*/}</>)
  
}
```

接着调整 formAction，在对接口请求前，先更新乐观状态。并在接口响应成功时更新真正的 todo state，如果失败，还原乐观更新的状态。

这里用 adding 是为了更清楚看到整个流程，当接口请求的时候，会先使用乐观状态 (adding: ture)，直到请求回传成功后，才会更新真正的状态 (adding: false)

```tsx
import { useOptimistic, useState, useRef } from "react";

/** 新增代表事件 */
export async function addTodoAction(todo: string) {
 //...
}

/**
 * @description 使用乐观更新的例子
 * @returns 
 */
export function TodoList() {
  // ...
  
  // 👇 useOptimistic
  const [optimisticTodos, setOptimisticTodos] = useOptimistic(...);

  const formAction = async (formData: FormData) => {
    const newTodo = String(formData.get("todo"));
    if(!newTodo) return;

    // 客观更新👍 UI
    setOptimisticTodos(newTodo)
    formRef.current?.reset();

    try {
      // 请求成功后，用真正的数据替换乐观数据（useOptimistic 监听的是 useState 的值）
      const response = await addTodoAction(newTodo);
      setTodos((prevTodos) => [
        ...prevTodos,
        { text: response, adding: false },
      ]);
    } catch (err) {
      // 如果请求失败，就还原todo state 的值，即还原optimisticTodos
      alert(`待办事件添加失败：${err}`);
      setTodos((prevTodos) => [...prevTodos]);
    }
  };
 
  return (<>{/*...*/}</>)
  
}
```

最后再render JSX

```tsx
import { useOptimistic, useState, useRef } from "react";
  // ...
  
   return (
    <>
      <h3>TodoList(useOptimistic乐观更新):</h3>
      <ul>
        {/* 👇 用乐观setOptimisticTodos去渲染所有的 todo */}
        {optimisticTodos.map((todo, index) => (
          <li key={index}>
            { todo.text }
            {/* 真正状态前，会显示由 useOptimistic 生成的乐观状态 */}
            {/* 也就是 todo.adding 会是 true 的数据 */}
            { !!todo.adding && <small>adding...</small> }
          </li>
        ))}
      </ul>

      <br />

      <form action={formAction} ref={formRef}>
        <input type="text" name="todo" placeholder="add new todo" />
        <button type="submit">新增</button>
      </form>
    </>
  );
  
}
```

这时就简单的实现乐观更新了。在接口响应前会先乐观更新UI，并添加loading状态。等到接口正常响应后会用新的 state 覆盖 乐观更新的 state

![PixPin\_2024-12-24\_17-59-58.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/b95e4a6c3d534331a27aa4191303c883~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgS2VsbGVu:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMTAwNzU4NzAzMDk5MTE2NSJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1736243329&x-orig-sign=ipQcEH94NBIWq1HghbxwZWAtfss%3D)
如果请求失败，则回退到新增之前的状态，取消乐观更新

![PixPin\_2024-12-24\_18-04-18.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/4e83614745cd4ea5b807aba6f3295a17~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgS2VsbGVu:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMTAwNzU4NzAzMDk5MTE2NSJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1736243329&x-orig-sign=p8tiI6wOXa6Og%2BCarUe%2Bz1P93Fk%3D)

以下为完整的代码

```tsx
import { useState, useRef, useOptimistic } from "react";

/** 新增代表事件 */
async function addTodoAction(todo: string) {
  return new Promise<string>((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.3) {
        resolve(todo);
      } else {
        reject("Failed!");
      }
    }, 1000);
  });
}

type Todo = {
  text: string;
  adding: boolean;
}

/**
 * @description 不使用乐观更新的例子
 * @returns 
 */
function StateAction() {
  const formRef = useRef<HTMLFormElement>(null);

  const [todos, setTodos] = useState<Todo[]>([{ text: "吃饭", adding: false }]);
 
  const formAction = async (formData: FormData) => {
    const newTodo = formData.get("todo");
    if(!newTodo) return;

    formRef.current?.reset();

    try {
      const response = await addTodoAction(newTodo as string);
      setTodos((prevTodos) => [
        ...prevTodos,
        { text: response, adding: false },
      ]);
    } catch (err) {
      alert(`待办事件添加失败：${err}`);
    }
  };

  return (
    <>
      <h3>TodoList(非乐观更新):</h3>
      <ul>
        {/* 👇 用 map 去渲染所有的 todo */}
        {todos.map((todo, index) => (
          <li key={index}>
            {todo.text}
          </li>
        ))}
      </ul>

      <br />

      <form action={formAction} ref={formRef}>
        <input type="text" name="todo" placeholder="add new todo" />
        <button type="submit">新增</button>
      </form>
    </>
  );
}


/**
 * @description 使用乐观更新的例子
 * @returns 
 */
function OptimisticAction() {
  const formRef = useRef<HTMLFormElement>(null);

  const [todos, setTodos] = useState<Todo[]>([{ text: "吃饭", adding: false }]);
 
  // 使用useOptimistic乐观更新 state 的值
  const [optimisticTodos, setOptimisticTodos] = useOptimistic<Todo[], string>(
    // 初始值（state）
    todos,
    // 会先生成乐观状态，直到新的 todos state 更新后才会取代乐观状态
    (prevTodos, newTodo) => ([
      ...prevTodos,
      {
        text: newTodo,
        adding: true,
      }
    ])
  )

  const formAction = async (formData: FormData) => {
    const newTodo = String(formData.get("todo"));
    if(!newTodo) return;

    // 客观更新👍 UI
    setOptimisticTodos(newTodo)
    formRef.current?.reset();

    try {
      // 请求成功后，用真正的数据替换乐观数据（useOptimistic 监听的是 useState 的值）
      const response = await addTodoAction(newTodo);
      setTodos((prevTodos) => [
        ...prevTodos,
        { text: response, adding: false },
      ]);
    } catch (err) {
      // 如果请求失败，optimisticTodos会自动还原上一次操作的数据
      alert(`待办事件添加失败：${err}`);
    }
  };

  return (
    <>
      <h3>TodoList(useOptimistic乐观更新):</h3>
      <ul>
        {/* 👇 用乐观setOptimisticTodos去渲染所有的 todo */}
        {optimisticTodos.map((todo, index) => (
          <li key={index}>
            { todo.text }
            {/* 真正状态前，会显示由 useOptimistic 生成的乐观状态 */}
            {/* 也就是 todo.adding 会是 true 的数据 */}
            { !!todo.adding && <small>adding...</small> }
          </li>
        ))}
      </ul>

      <br />

      <form action={formAction} ref={formRef}>
        <input type="text" name="todo" placeholder="add new todo" />
        <button type="submit">新增</button>
      </form>
    </>
  );
}

export  function UseOptimisticPage() {
  return (
    <>
      <StateAction />
      <hr />
      <OptimisticAction />
    </>
  )
}
```
