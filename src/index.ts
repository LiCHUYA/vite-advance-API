import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import axios from "axios";
import pick from "lodash/pick";
import omit from "lodash/omit";
import get from "lodash/get";
import { v4 as uuidv4 } from "uuid";
import "express-async-errors";
import type { ViteDevServer } from "vite";
import type {
  CreateAdvanceApiOptions,
  Utils,
  ModuleConfig,
  RouterDefiner,
  RouteDefinition,
  RouteHandler,
  ApiRequest,
  ExtendedResponse,
  NetworkInterfaceInfo,
} from "./types";
import { CommonResponse } from "./response";
import chalk from "chalk";

// 内置的测试路由工厂函数
function createBuiltInRoutes(
  routeCollector: RouteCollector,
  serverInfo: any
): RouteDefinition[] {
  return [
    {
      path: "/advance-api-test",
      method: "get",
      handler: async (req, res) => {
        res.success({
          status: "ok",
          time: new Date().toISOString(),
          version: "1.0.0",
          message: "Vite Advance API is working!",
        });
      },
    },
    // API文档路由
    {
      path: "/docs",
      method: "get",
      handler: async (req, res) => {
        const routes = routeCollector.getRoutes().map((route) => ({
          method: route.method,
          path: route.path,
          module: route.moduleName || "未分类",
          description: route.path.endsWith("/docs")
            ? "API文档接口"
            : route.path === "/advance-api-test"
              ? "插件测试接口"
              : route.description || "用户自定义接口",
          examples: {
            fetch: `fetch('${route.path}', {
  method: '${route.method}',
  headers: {
    'Content-Type': 'application/json'
  }${route.method !== "GET" ? ",\n  body: JSON.stringify({\n    // your data here\n  })" : ""}
})
  .then(response => response.json())
  .then(data => console.log(data));`,
            axios: `axios.${route.method.toLowerCase()}('${route.path}'${
              route.method !== "GET"
                ? `, {
  // your data here
}`
                : ""
            })
  .then(response => console.log(response.data));`,
          },
        }));

        // 返回 HTML 页面
        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API 接口文档</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
    <link rel="stylesheet" href="https://unpkg.com/antd@5/dist/reset.css">
    <style>
        :root {
            --primary: #1677ff;
            --success: #52c41a;
            --warning: #faad14;
            --error: #ff4d4f;
            --border: #f0f0f0;
            --bg: #ffffff;
            --text: rgba(0, 0, 0, 0.88);
            --text-secondary: rgba(0, 0, 0, 0.45);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
                'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
            color: var(--text);
            background: #f5f5f5;
        }

        .layout {
            display: flex;
            min-height: 100vh;
        }

        .sidebar {
            width: 280px;
            background: var(--bg);
            border-right: 1px solid var(--border);
            padding: 24px;
            overflow-y: auto;
            position: fixed;
            height: 100vh;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .main-content {
            flex: 1;
            margin-left: 280px;
            padding: 24px;
            max-width: calc(100% - 280px);
        }

        .header {
            background: var(--bg);
            padding: 24px;
            border-radius: 8px;
            margin-bottom: 24px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
            transition: box-shadow 0.3s;
        }

        .header:hover {
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
        }

        .title {
            font-size: 20px;
            font-weight: 500;
            margin-bottom: 16px;
            color: var(--text);
        }

        .search {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--border);
            border-radius: 6px;
            margin-bottom: 16px;
            transition: all 0.3s;
        }

        .search:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
        }

        .api-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .api-item {
            background: var(--bg);
            border-radius: 8px;
            border: 1px solid var(--border);
            padding: 20px;
            transition: all 0.3s;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .api-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-color: var(--primary);
        }

        .api-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }

        .method-tag {
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 500;
            text-transform: uppercase;
        }

        .get { background: #e6f4ff; color: var(--primary); }
        .post { background: #f6ffed; color: var(--success); }
        .put { background: #fff7e6; color: var(--warning); }
        .delete { background: #fff1f0; color: var(--error); }

        .path {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 14px;
            color: var(--text);
            background: #f5f5f5;
            padding: 4px 8px;
            border-radius: 4px;
        }

        .description {
            color: var(--text-secondary);
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 16px;
            padding: 12px 16px;
            background: #fafafa;
            border-radius: 4px;
        }

        .meta {
            display: flex;
            gap: 16px;
            font-size: 13px;
            color: var(--text-secondary);
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .meta-label {
            color: var(--text-secondary);
        }

        .meta-value {
            color: var(--text);
            background: #f5f5f5;
            padding: 2px 8px;
            border-radius: 4px;
        }

        .nav-list {
            list-style: none;
        }

        .nav-item {
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .nav-item:hover {
            background: #f5f5f5;
        }

        .nav-item.active {
            background: #e6f4ff;
            color: var(--primary);
        }

        @media (max-width: 768px) {
            .layout { flex-direction: column; }
            .sidebar {
                width: 100%;
                height: auto;
                position: static;
                border-right: none;
                border-bottom: 1px solid var(--border);
            }
            .main-content {
                margin-left: 0;
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="layout">
        <aside class="sidebar">
            <div class="title">接口导航</div>
            <input type="text" class="search" placeholder="搜索接口..." id="searchInput">
            <ul class="nav-list" id="navList">
                ${routes
                  .map(
                    (route, index) => `
                    <li class="nav-item" data-index="${index}">
                        <span class="method-tag ${route.method.toLowerCase()}">${route.method}</span>
                        ${route.path}
                    </li>
                `
                  )
                  .join("")}
            </ul>
        </aside>

        <main class="main-content">
            <header class="header">
                <div class="title">API 接口文档</div>
                <div class="meta">
                    <div class="meta-item">
                        <span class="meta-label">接口前缀：</span>
                        <span class="meta-value">${serverInfo.prefix}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">接口总数：</span>
                        <span class="meta-value">${routes.length}</span>
                    </div>
                </div>
            </header>

            <div class="api-list" id="apiList">
                ${routes
                  .map(
                    (route) => `
                    <div class="api-item">
                        <div class="api-header">
                            <span class="method-tag ${route.method.toLowerCase()}">${route.method}</span>
                            <span class="path">${route.path}</span>
                        </div>
                        <p class="description">${route.description || "暂无描述"}</p>
                        <div class="meta">
                            <div class="meta-item">
                                <span class="meta-label">所属模块：</span>
                                <span class="meta-value">${route.module}</span>
                            </div>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        </main>
    </div>

    <script>
        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        const apiItems = document.querySelectorAll('.api-item');
        const navItems = document.querySelectorAll('.nav-item');

        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            
            apiItems.forEach((item, index) => {
                const path = item.querySelector('.path').textContent.toLowerCase();
                const method = item.querySelector('.method-tag').textContent.toLowerCase();
                const description = item.querySelector('.description').textContent.toLowerCase();
                const visible = path.includes(value) || method.includes(value) || description.includes(value);
                
                item.style.display = visible ? 'block' : 'none';
                navItems[index].style.display = visible ? 'block' : 'none';
            });
        });
    </script>
</body>
</html>`;

        res.send(html);
      },
    },
  ];
}

// 路径拼接工具改进
function joinPaths(...paths: string[]): string {
  return (
    "/" +
    paths
      .map((path) => path.replace(/^\/+|\/+$/g, "")) // 去除首尾斜杠
      .filter(Boolean) // 过滤空字符串
      .join("/")
  );
}

// 路由收集器
class RouteCollector {
  private routes: Array<{
    method: string;
    path: string;
    moduleName?: string;
    description?: string; // 新增描述字段
  }> = [];

  add(method: string, path: string, moduleName?: string, description?: string) {
    this.routes.push({
      method: method.toUpperCase(),
      path,
      moduleName,
      description,
    });
  }

  getRoutes() {
    return this.routes;
  }

  printRoutes() {
    if (this.routes.length === 0) {
      console.log("  😶 暂无注册的接口");
      return;
    }

    this.routes.forEach(({ method, path, moduleName }) => {
      const methodColors = {
        GET: chalk.blue,
        POST: chalk.green,
        PUT: chalk.yellow,
        DELETE: chalk.red,
      };

      const colorMethod =
        methodColors[method as keyof typeof methodColors]?.(method.padEnd(6)) ||
        chalk.gray(method.padEnd(6));

      console.log(
        `  ${colorMethod} ${path}${
          moduleName ? chalk.gray(` (${moduleName})`) : ""
        }`
      );
    });
  }
}

// 统一的路由处理函数
function createRouteHandler(
  router: express.Router,
  method: string,
  basePath: string = "",
  path: string,
  handler: RouteHandler,
  prefix: string,
  routeCollector: RouteCollector,
  moduleName: string,
  description?: string
) {
  const fullPath = joinPaths(basePath, path);
  const routerMethod =
    router[method.toLowerCase() as "get" | "post" | "put" | "delete"];
  if (routerMethod) {
    routerMethod.bind(router)(fullPath, async (req: Request, res: Response) => {
      // 使用类型断言来扩展 res 对象
      const extendedRes = res as ExtendedResponse;

      extendedRes.success = function (data: any) {
        return this.json({
          code: 200,
          data,
          message: "success",
        });
      };

      extendedRes.error = function (message: string, code: number = 500) {
        return this.status(code).json({
          code,
          message,
          data: null,
        });
      };

      await handler(req as ApiRequest, extendedRes);
    });
  }
  routeCollector.add(
    method.toUpperCase(),
    `${prefix}${fullPath}`,
    moduleName,
    description
  );
}

function createRouterDefiner(
  router: express.Router,
  basePath: string,
  prefix: string,
  routeCollector: RouteCollector
): RouterDefiner {
  return {
    get: (path, handler, description?) =>
      createRouteHandler(
        router,
        "get",
        basePath,
        path,
        handler,
        prefix,
        routeCollector,
        "direct模式",
        description
      ),
    post: (path, handler, description?) =>
      createRouteHandler(
        router,
        "post",
        basePath,
        path,
        handler,
        prefix,
        routeCollector,
        "direct模式",
        description
      ),
    put: (path, handler, description?) =>
      createRouteHandler(
        router,
        "put",
        basePath,
        path,
        handler,
        prefix,
        routeCollector,
        "direct模式",
        description
      ),
    delete: (path, handler, description?) =>
      createRouteHandler(
        router,
        "delete",
        basePath,
        path,
        handler,
        prefix,
        routeCollector,
        "direct模式",
        description
      ),
  };
}

export function createAdvanceApi(options: CreateAdvanceApiOptions = {}) {
  const router = express.Router();
  const app = express();
  const prefix = options.prefix || "/api";
  const routeCollector = new RouteCollector();

  const serverInfo = {
    prefix,
    baseUrl: "",
    apiBase: "",
  };

  // 创建内置路由
  const builtInRoutes = createBuiltInRoutes(routeCollector, serverInfo);

  const utils: Utils = {
    router,
    app,
    express,
    uuid: uuidv4,
    _: { pick, omit, get },
    axios,
    defineRoutes: (base: string = "", routes: RouteDefinition[]) => {
      routes.forEach(({ path, method, handler }) => {
        createRouteHandler(
          router,
          method,
          base,
          path,
          handler,
          prefix,
          routeCollector,
          "defineRoutes",
          routes[0].description
        );
      });
      return {
        type: "object",
        base,
        apis: routes,
      } as ModuleConfig;
    },
    getRoutes: () => routeCollector.getRoutes(),
    printRoutes: () => routeCollector.printRoutes(),
  };

  // 注册内置路由
  builtInRoutes.forEach(({ path, method, handler }) => {
    createRouteHandler(
      router,
      method,
      "",
      path,
      handler,
      prefix,
      routeCollector,
      "内置",
      builtInRoutes[0].description
    );
  });

  // 只有在提供了setup函数时才注册用户模块
  if (options.setup) {
    const modules = options.setup(utils);
    const moduleConfigs = Array.isArray(modules) ? modules : [modules];

    moduleConfigs.forEach((module) => {
      if (!module) return;

      const basePath = module.base || "";
      const moduleName = `${module.type}模式`;

      switch (module.type) {
        case "object":
          module.apis.forEach(({ path, method, handler, description }) => {
            createRouteHandler(
              router,
              method,
              basePath,
              path,
              handler,
              prefix,
              routeCollector,
              moduleName,
              description
            );
          });
          break;

        case "direct":
          const routerDefiner = createRouterDefiner(
            router,
            basePath,
            prefix,
            routeCollector
          );
          module.setup(routerDefiner);
          break;
      }
    });
  }

  // 保存服务器信息
  serverInfo.baseUrl = `${serverInfo.prefix}`;
  serverInfo.apiBase = `${serverInfo.baseUrl}${prefix}`;

  // 配置 app
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors(options.cors || { origin: "*" }));
  app.use(prefix, router);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  // 打印服务器信息
  console.log("\n");
  console.log("🚀 Vite Advance API 插件启动成功！\n");

  console.log("📡 服务信息");
  console.log(`  • 状态：${chalk.green("运行中")} ✨`);
  console.log(`  • 前缀：${chalk.blue(prefix)} 🔗`);

  // 打印所有注册的路由
  console.log("\n📚 接口列表");
  routeCollector.printRoutes();

  console.log("\n 💡调用示例:");
  console.log("http://localhost:5173/api/status");
  // 提示信息
  console.log("💡 温馨提示");
  console.log(`  • API 文档：${chalk.cyan(prefix + "/docs")} 📖`);
  console.log("  • Hash 路由模式下请求无需包含 '#' 符号 ⚠️");

  if (!options.setup) {
    console.log(
      `  • ${chalk.yellow("当前为测试模式")}，访问以上地址即可验证插件是否正常工作 🔍`
    );
  }

  return {
    name: "vite-advance-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(app);
    },
    getServerInfo: () => serverInfo,
  };
}

export type { CreateAdvanceApiOptions, Utils, ModuleConfig, ApiRequest };
