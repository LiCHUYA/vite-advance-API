# Vite Advance API 插件

在开发前端时，有时需要编写简化的 Node 接口来提升开发效率。但是目前市面上似乎并没有完全符合我需求的 NPM 包，于是我自己开发了一个 **Vite 插件**

该插件是一个专为 Vite 设计的 API 插件，支持多种路由定义方式，并且具有统一的响应处理机制。其主要特点如下：

- 支持三种不同的路由定义方式
- 统一的响应格式
- 内置常用的工具函数
- 提供 TypeScript 支持

---

## 主要特点

### 1. 内置 `express-async-errors` 库

通过使用 `express-async-errors`，我们无需在每个异步路由处理函数中手动编写 `try-catch` 语句，极大简化了代码结构。

#### 示例：无需 `try-catch`

```js
// 传统的方式：每个异步处理都需要写 try-catch
router.get("/data", async (req, res, next) => {
  try {
    // 异步操作
  } catch (error) {
    next(error);
  }
});

// 使用 vite-advance-api 后，可以直接编写异步函数，无需 try-catch
router.get("/data", async (req, res) => {
  // 异步操作
  // 错误会自动被捕获并传递给错误处理中间件
});
```

### 2. 灵活的路由配置

Vite Advance API 提供了模块化设计，支持通过 `ModuleConfig` 配置两种不同的路由注册模式（`object` 和 `direct`），让代码结构更清晰，易于维护和扩展。

- 支持全局基础路径（`globalBase`）
- 提供统一的路由定义接口
- 支持所有主要的 HTTP 方法（`GET`, `POST`, `PUT`, `DELETE`）
- 统一的响应处理机制
- 集成常用的工具库（如 `lodash`, `axios`, `uuid`）
- 默认集成了 CORS 支持
- 内置 `body-parser` 功能（`express.json` 和 `express.urlencoded`）

---

## 安装

你可以通过以下命令安装插件：

```bash
npm install vite-advance-api
```

或使用 `pnpm`：

```bash
pnpm install vite-advance-api
```

---

## 在 Vite 中使用

### 基础配置

在 `vite.config.ts` 中配置插件时，可以通过 `setup` 函数提供内置的三种工具库（`lodash`, `axios`, `uuid`），用于简化开发过程。

````ts
// vite.config.ts
import { defineConfig } from "vite";
import { createAdvanceApi } from "vite-advance-api";

export default defineConfig({
  plugins: [
    createAdvanceApi({
      base: "/v1", // 全局基础路径
      cors: {
        origin: "*", // CORS 配置
        credentials: true,
      },
      setup: ({ _, axios, uuid }) => [
        // 在此定义你的路由...
      ],
    }),
  ],
});

### 引入插件之后
访问 api/advance-api-test 可以访问到测试路由

- 测试路由: `/api/v1/advance-api-test`

---

## 路由定义模式

### 1. 对象模式

对象模式适合结构清晰、功能较简单的 API 定义。通过该模式，可以明确地设置路径、HTTP 方法和处理函数。

```ts
{
  type: "object", // 定义路由的类型
  base: "/software",  // 模块基础路径
  apis: [
    {
      path: "/status", // 路由的具体路径
      method: "get",   // HTTP 方法
      handler: async (req, res) => {
        res.success({ status: "ok" });
      }
    }
  ]
}
````

使用

```js
export default defineConfig({
  plugins: [
    createAdvanceApi({
      base: "/v1", // 全局基础路径
      cors: {
        origin: "*", // CORS 配置
        credentials: true,
      },
      setup: ({ _, axios, uuid }) => [
        {
          type: "object", // 定义路由的类型
          base: "/software", // 模块基础路径
          apis: [
            {
              path: "/status", // 路由的具体路径
              method: "get", // HTTP 方法
              handler: async (req, res) => {
                res.success({ status: "ok" });
              },
            },
          ],
        },
      ],
    }),
  ],
});
```

### 2. 直接路由模式

该模式类似于传统的 Express 路由定义方式，适用于复杂的路由结构或更灵活的配置需求。

```ts
{
  type: "direct", // 定义路由的类型
  base: "/auth",  // 模块基础路径
  setup: (router) => {
    // 登录路由
    router.post("/login", async (req, res) => {
      res.success({ token: "xxx" });
    });
  }
}
```

### 3. `defineRoutes` 工具函数

通过 `defineRoutes` 函数，可以在 `setup` 函数中直接定义路由。

```ts
setup: ({ defineRoutes }) => {
  // 定义路由：最终路径为 /api/v1/user/profile
  defineRoutes("/user", [
    {
      path: "/profile",
      method: "get",
      handler: async (req, res) => {
        res.success({ name: "John" });
      },
    },
  ]);
};
```

---

## 完整示例

下面是一个完整的使用示例，展示了如何在插件中定义不同的路由模式和逻辑。

```js
import { createAdvanceApi } from "vite-advance-api";
import fs from "fs";

// 创建插件实例
const apiPlugin = createAdvanceApi({
  base: "/v1", // 全局基础路径
  cors: {
    origin: "*",
    credentials: true,
  },
  setup: ({ _, axios, uuid, defineRoutes }) => [
    // 1. 对象模式 - 软件模块
    {
      type: "object",
      base: "/software",
      apis: [
        {
          path: "/status",
          method: "get",
          handler: async (req, res) => {
      		   const status = {
                version: "1.0.0",
                isRunning: true,
                lastCheck: new Date().toISOString(),
              };
              // 使用 lodash 工具函数简化操作
              const publicStatus = _.pick(status, ["version", "isRunning"]);
              res.success(publicStatus);
          },
        },
      ],
    },

    // 2. 直接路由模式 - 认证模块
      type: "direct",
      base: "/auth",
      setup: (router) => {
        // 登出
        router.post("/logout", async (req, res) => {
             const { sessionId } = req.body;
            await axios.post("http://auth-service/logout", { sessionId });
            res.success(null, "登出成功");
        });
      },
    },
  ],
});

// 3. defineRoutes 方式 - 用户模块
apiPlugin.setup(({ defineRoutes, _, axios }) => {
  defineRoutes("/user", [
    {
      path: "/profile",
      method: "get",
      handler: async (req, res) => {
          const userId = req.query.id;
          const { data: user } = await axios.get(
            `http://user-service/users/${userId}`
          );
          const safeUser = _.omit(user, ["password"]);
          res.success(safeUser);
      },
    },
  ]);
});

export default {
  plugins: [apiPlugin],
};
```

---

## 统一响应格式

Vite Advance API 提供了统一的响应格式，便于前后端协作时的一致性。

### 成功响应

```ts
res.success(data, message?, code?)
// 示例：
{
  code: 200,
  data: { ... },
  success: true,
  message: "操作成功"
}
```

### 错误响应

```ts
res.error(data, message?, code?)
// 示例：
{
  code: 400,
  data: null,
  success: false,
  message: "操作失败"
}
```

### 无权限响应

```ts
res.denied(data, message?)
// 示例：
{
  code: 401,
  data: null,
  success: false,
  message: "无权限访问"
}
```

---

## 配置选项

```ts
interface CreateAdvanceApiOptions {
  base?: string;
  cors?: {
    origin?: string | string[];
    credentials?: boolean;
    methods?: string[];
  };
  setup: (utils: {
    _: {
      pick: <T>(obj: T, paths: string[]) => Partial<T>;
      omit: <T>(obj: T, paths: string[]) => Partial<T>;
      get: (obj: any, path: string, defaultValue?: any) => any;
    };
    http: {
      get: (url: string => Promise<any>;
      post: (url: string, data?: any) => Promise<any>;
    };
    uuid: () => string;
   Routes: (base: string, routes: RouteDefinition[]) => void;
  }) => ModuleConfig[];
}
```

---
