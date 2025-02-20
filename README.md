## Vite Advance API 插件

在前端开发中，提升开发效率是每个开发者的目标，尤其是在处理 API 时。虽然市面上有许多成熟的解决方案，但它们往往无法完全满足特定需求。为此，我开发了一个 **Vite 插件**，即 **Vite Advance API**，旨在简化前端 API 开发，支持多种路由定义方式，并提供统一的响应处理机制。

---

### 安装

您可以通过以下命令来安装该插件：

```bash
npm install vite-advance-api
```

或者使用 `pnpm`：

```bash
pnpm install vite-advance-api
```

---

### 主要特点

#### 1. 内置 `express-async-errors` 库

该插件集成了 `express-async-errors`，使得在编写异步路由时，开发者不需要手动处理 `try-catch`，自动捕获错误并传递给错误处理中间件，从而简化代码。

##### 示例：无需 `try-catch`

```js
// 传统方式：每个异步处理都需要写 try-catch
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

#### 2. 灵活的路由配置

Vite Advance API 提供了模块化的路由设计，支持通过 `ModuleConfig` 配置多种路由注册方式（如 `object` 和 `direct`）。此外，插件还具备如下特性：

- 支持全局基础路径配置 (`globalBase`)
- 统一的路由定义接口
- 支持所有主要的 HTTP 方法（`GET`, `POST`, `PUT`, `DELETE`）
- 统一的响应处理机制
- 集成常用工具库（如 `lodash`, `axios`, `uuid`）
- 默认支持 CORS
- 内置 `body-parser`（`express.json` 和 `express.urlencoded`）

### 在 Vite 中使用

#### 基础配置

在 `vite.config.ts` 中配置插件时，您可以通过 `setup` 函数提供常用的工具库（如 `lodash`, `axios`, `uuid`），以便更方便地编写路由和处理请求。

```js
// vite.config.ts
import { defineConfig } from "vite";
import { createAdvanceApi } from "vite-advance-api";

// 最简单的用法 - 只启用测试接口
const apiPlugin = createAdvanceApi();

// 或者完整配置
const apiPlugin = createAdvanceApi({
  prefix: "/api", // 可选，默认为 "/api"
  setup: ({ _, axios }) => [
    {
      type: "object", // 路由类型
      base: "/v1/user", // 模块路径，最终为 /api/v1/user/xxx
      apis: [
        {
          path: "/profile",
          method: "get",
          handler: async (req, res) => {
            // ...
          },
        },
      ],
    },
  ],
});

export default defineConfig({
  plugins: [apiPlugin],
});
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { createAdvanceApi } from "vite-advance-api";

export default defineConfig({
  plugins: [
    createAdvanceApi({
      prefix: "/api", // 可选，默认为 "/api"
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
```

#### 引入插件之后

访问 `/api/v1/advance-api-test` 即可访问测试路由。

---

## 路由定义模式

### 1. 对象模式（`object`）

对象模式适用于路由结构简单、功能明确的 API 定义。通过该模式，可以直观地设置路径、HTTP 方法和对应的处理函数。

```ts
{
  type: "object", // 路由类型
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
```

#### 使用方式

```js
export default defineConfig({
  plugins: [
    createAdvanceApi({
      prefix: "/api", // 可选，默认为 "/api"
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
              path: "/status", // 路由路径
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

### 2. 直接路由模式（`direct`）

此模式适用于需要更加灵活的路由配置，可以直接在 `setup` 函数中注册路由。

```ts
{
  type: "direct", // 路由类型
  base: "/auth", // 模块基础路径
  setup: (router) => {
    // 登录路由
    router.post("/login", async (req, res) => {
      res.success({ token: "xxx" });
    });
  },
}
```

### 3. `defineRoutes` 工具函数

通过 `defineRoutes` 函数，可以直接在 `setup` 函数中定义路由，简化代码结构。

```ts
setup: ({ defineRoutes }) => {
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

以下是一个完整的使用示例，展示了如何在插件中定义不同的路由模式及其逻辑。

```js
import { createAdvanceApi } from "vite-advance-api";
import fs from "fs";

// 创建插件实例
const apiPlugin = createAdvanceApi({
  prefix: "/api", // 可选，默认为 "/api"
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
            const publicStatus = _.pick(status, ["version", "isRunning"]);
            res.success(publicStatus);
          },
        },
      ],
    },

    // 2. 直接路由模式 - 认证模块
    {
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

  // 3. defineRoutes 方式 - 用户模块
  setup: ({ defineRoutes, _, axios }) => {
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
  },
});

// Vite 配置文件中注册插件
export default {
  plugins: [apiPlugin],
};
```

---

## 统一响应格式

Vite Advance API 提供了统一的响应格式，确保前后端数据的一致性。

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
  prefix?: string; // 可选，默认为 "/api"
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
      get: (url: string) => Promise<any>;
      post: (url: string, data?: any) => Promise<any>;
    };
    uuid: () => string;
    defineRoutes: (base: string, routes: RouteDefinition[]) => void;
  }) => ModuleConfig[];
}
```

---
