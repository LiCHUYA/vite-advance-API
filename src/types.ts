import { Request, Response, Router } from "express";
import { CorsOptions } from "cors";
import { CommonResponse } from "./response";
import axios from "axios";
import { AxiosInstance } from "axios";
import type { Express } from "express";

// 自定义请求和响应类型
export interface ApiRequest extends Request {
  // 可以在这里扩展请求类型
}

// 扩展 Response 接口
export interface ExtendedResponse extends Response {
  success(data: any): Response;
  error(message: string, code?: number): Response;
}

// 路由处理函数的类型定义
export type RouteHandler = (
  req: ApiRequest,
  res: ExtendedResponse
) => Promise<void> | void;

// 1. 对象模式的类型
export interface ApiConfig {
  path: string;
  method: "get" | "post" | "put" | "delete";
  handler: RouteHandler;
}

export interface ObjectModeModule {
  type: "object";
  base: string;
  apis?: ApiConfig[]; // 支持 apis 写法
  routes?: RouteDefinition[]; // 支持 routes 写法
}

// 2. 路由组模式的类型
export interface RouteDefinition {
  path: string;
  method: "get" | "post" | "put" | "delete";
  handler: RouteHandler;
  description?: string; // 接口描述
  params?: {
    // 参数说明
    [key: string]: {
      type: string;
      required?: boolean;
      description?: string;
    };
  };
  response?: {
    // 响应示例
    success?: any;
    error?: any;
  };
}

// 3. 直接路由模式的类型
export interface RouterDefiner {
  get: (path: string, handler: RouteHandler, description?: string) => void;
  post: (path: string, handler: RouteHandler, description?: string) => void;
  put: (path: string, handler: RouteHandler, description?: string) => void;
  delete: (path: string, handler: RouteHandler, description?: string) => void;
}

export interface DirectModeModule {
  type: "direct";
  base: string;
  setup: (router: RouterDefiner) => void;
}

// 核心工具集合
export interface Utils {
  router: express.Router;
  app: Express;
  express: typeof express;
  uuid: () => string;
  _: {
    pick: <T>(obj: T, paths: string[]) => Partial<T>;
    omit: <T>(obj: T, paths: string[]) => Partial<T>;
    get: (obj: any, path: string, defaultValue?: any) => any;
  };
  axios: AxiosInstance;
  defineRoutes: (base?: string, routes: RouteDefinition[]) => ModuleConfig;
  getRoutes: () => Array<{ method: string; path: string; moduleName?: string }>;
  printRoutes: () => void;
}

export interface CreateAdvanceApiOptions {
  prefix?: string; // 只保留 prefix 配置
  cors?: CorsOptions;
  setup?: (utils: Utils) => ModuleConfig[];
}

// 添加API文档相关的类型定义
export interface ApiDoc {
  title: string; // API标题
  description?: string; // API描述
  params?: Record<string, string>; // 参数说明
  response?: Record<string, any>; // 返回值示例
}

// 模块文档
export interface ModuleDoc {
  name: string; // 模块名称
  description?: string; // 模块描述
}

// 添加 NetworkInterfaceInfo 类型并导出
export interface NetworkInterfaceInfo {
  family: string;
  internal: boolean;
  address: string;
}

// 模块类型联合
export type ModuleConfig = ObjectModeModule | DirectModeModule;
