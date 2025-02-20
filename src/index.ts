import express from "express";
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

function createRouterDefiner(
  router: express.Router,
  basePath: string
): RouterDefiner {
  return {
    get: (path, handler) =>
      router.get(`${basePath}${path}`, (req, res) =>
        handler(req, new CommonResponse(res))
      ),
    post: (path, handler) =>
      router.post(`${basePath}${path}`, (req, res) =>
        handler(req, new CommonResponse(res))
      ),
    put: (path, handler) =>
      router.put(`${basePath}${path}`, (req, res) =>
        handler(req, new CommonResponse(res))
      ),
    delete: (path, handler) =>
      router.delete(`${basePath}${path}`, (req, res) =>
        handler(req, new CommonResponse(res))
      ),
  };
}

export function createAdvanceApi(options: CreateAdvanceApiOptions = {}) {
  const router = express.Router();
  const prefix = options.prefix || "/api"; // 只保留 prefix，用于指定 API 前缀

  const utils: Utils = {
    router,
    uuid: uuidv4,
    _: { pick, omit, get },
    axios,
    defineRoutes: (base: string, routes: RouteDefinition[]) => {
      routes.forEach(({ path, method, handler }) => {
        router[method](`${base}${path}`, (req, res) =>
          handler(req, new CommonResponse(res))
        );
      });
    },
  };

  // 注册内置路由
  builtInRoutes.forEach(({ path, method, handler }) => {
    router[method](path, (req, res) => handler(req, new CommonResponse(res)));
  });

  // 只有在提供了setup函数时才注册用户模块
  if (options.setup) {
    const modules = options.setup(utils);
    modules.forEach((module) => {
      switch (module.type) {
        case "object":
          // 对象模式
          module.apis.forEach(({ path, method, handler }) => {
            router[method](`${module.base}${path}`, (req, res) =>
              handler(req, new CommonResponse(res))
            );
          });
          break;

        case "direct":
          // 直接路由模式
          const routerDefiner = createRouterDefiner(router, module.base);
          module.setup(routerDefiner);
          break;
      }
    });
  }

  return {
    name: "vite-advance-api",
    configureServer(server: ViteDevServer) {
      const app = express();

      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(cors(options.cors || { origin: "*" }));
      app.use(prefix, router);

      app.use(
        (
          err: any,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction
        ) => {
          console.error(err);
          res
            .status(500)
            .json({ error: err.message || "Internal Server Error" });
        }
      );

      server.middlewares.use(app);

      // 添加友好的启动提示
      console.log("\n🚀 Vite Advance API 插件已启动");

      // 测试接口地址
      const testUrl = `${prefix}/advance-api-test`;
      console.log(`📡 测试接口: ${testUrl}`);

      // Hash模式提示
      console.log("\n💡 提示：");
      console.log("  • 如果使用 Hash 路由模式，API 请求不需要包含 '#' 符号");
      console.log(`  • 例如：http://localhost:端口${testUrl}`);

      if (!options.setup) {
        console.log(
          "  • 当前仅启用测试接口，可以通过访问以上地址验证插件是否正常工作"
        );
      }

      console.log(""); // 空行
    },
  };
}

export type { CreateAdvanceApiOptions, Utils, ModuleConfig };
