import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import axios from "axios";
import { pick, omit, get } from "lodash";
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
} from "./types";
import { CommonResponse } from "./response";

// 内置的测试路由
const builtInRoutes: RouteDefinition[] = [
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
];

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
  }> = [];

  add(method: string, path: string, moduleName?: string) {
    this.routes.push({ method: method.toUpperCase(), path, moduleName });
  }

  getRoutes() {
    return this.routes;
  }

  printRoutes() {
    console.log("\n📋 已注册的路由:");
    this.routes.forEach(({ method, path, moduleName }) => {
      console.log(
        `  ${method.padEnd(6)} ${path}${moduleName ? ` (${moduleName})` : ""}`
      );
    });
    console.log("");
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
  moduleName: string
) {
  const fullPath = joinPaths(basePath, path);
  const routerMethod =
    router[method.toLowerCase() as "get" | "post" | "put" | "delete"];
  if (routerMethod) {
    routerMethod.bind(router)(fullPath, async (req: Request, res: Response) => {
      await handler(req as ApiRequest, new CommonResponse(res));
    });
  }
  routeCollector.add(method.toUpperCase(), `${prefix}${fullPath}`, moduleName);
}

function createRouterDefiner(
  router: express.Router,
  basePath: string,
  prefix: string,
  routeCollector: RouteCollector
): RouterDefiner {
  return {
    get: (path, handler) =>
      createRouteHandler(
        router,
        "get",
        basePath,
        path,
        handler,
        prefix,
        routeCollector,
        "direct模式"
      ),
    post: (path, handler) =>
      createRouteHandler(
        router,
        "post",
        basePath,
        path,
        handler,
        prefix,
        routeCollector,
        "direct模式"
      ),
    put: (path, handler) =>
      createRouteHandler(
        router,
        "put",
        basePath,
        path,
        handler,
        prefix,
        routeCollector,
        "direct模式"
      ),
    delete: (path, handler) =>
      createRouteHandler(
        router,
        "delete",
        basePath,
        path,
        handler,
        prefix,
        routeCollector,
        "direct模式"
      ),
  };
}

export function createAdvanceApi(options: CreateAdvanceApiOptions = {}) {
  const router = express.Router();
  const app = express();
  const prefix = options.prefix || "/api";
  const routeCollector = new RouteCollector();

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
          "defineRoutes"
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
      "内置"
    );
  });

  // 只有在提供了setup函数时才注册用户模块
  if (options.setup) {
    const modules = options.setup(utils);
    const moduleConfigs = Array.isArray(modules) ? modules : [modules];

    moduleConfigs.forEach((module) => {
      if (!module) return;

      const basePath = module.base || ""; // base 默认为空字符串
      const moduleName = `${module.type}模式`;

      switch (module.type) {
        case "object":
          module.apis.forEach(({ path, method, handler }) => {
            createRouteHandler(
              router,
              method,
              basePath,
              path,
              handler,
              prefix,
              routeCollector,
              moduleName
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

  return {
    name: "vite-advance-api",
    configureServer(server: ViteDevServer) {
      // 配置 app
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(cors(options.cors || { origin: "*" }));
      app.use(prefix, router);

      app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        console.error(err);
        res.status(500).json({ error: err.message || "Internal Server Error" });
      });

      server.middlewares.use(app);

      // 添加友好的启动提示
      console.log("\n🚀 Vite Advance API 插件已启动");
      console.log(`📡 API前缀: ${prefix}`);

      // 打印所有注册的路由
      routeCollector.printRoutes();

      // Hash模式提示
      console.log("\n💡 提示：");
      console.log("  • 如果使用 Hash 路由模式，API 请求不需要包含 '#' 符号");
      console.log(`  • 例如：http://localhost:端口${prefix}/advance-api-test`);

      if (!options.setup) {
        console.log(
          "  • 当前仅启用测试接口，可以通过访问以上地址验证插件是否正常工作"
        );
      }

      console.log(""); // 空行
    },
  };
}

export type { CreateAdvanceApiOptions, Utils, ModuleConfig, ApiRequest };
