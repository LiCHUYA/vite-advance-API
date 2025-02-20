import { Request, Response, Router } from "express";
import { CorsOptions } from "cors";
import { CommonResponse } from "./response";
import axios from "axios";
import { AxiosInstance } from "axios";

// 路由处理器类型
export type RouteHandler = (
  req: Request,
  res: CommonResponse
) => void | Promise<void>;

// 1. 对象模式的类型
export interface ApiConfig {
  path: string;
  method: "get" | "post" | "put" | "delete";
  handler: RouteHandler;
}

export interface ObjectModeModule {
  type: "object";
  base: string;
  apis: ApiConfig[];
}

// 2. 路由组模式的类型
export interface RouteDefinition {
  path: string;
  method: "get" | "post" | "put" | "delete";
  handler: RouteHandler;
}

// 3. 直接路由模式的类型
export interface RouterDefiner {
  get: (path: string, handler: RouteHandler) => void;
  post: (path: string, handler: RouteHandler) => void;
  put: (path: string, handler: RouteHandler) => void;
  delete: (path: string, handler: RouteHandler) => void;
}

export interface DirectModeModule {
  type: "direct";
  base: string;
  setup: (router: RouterDefiner) => void;
}

// 核心工具集合
export interface Utils {
  router: Router;
  uuid: () => string;
  _: {
    pick: <T>(obj: T, paths: string[]) => Partial<T>;
    omit: <T>(obj: T, paths: string[]) => Partial<T>;
    get: (obj: any, path: string, defaultValue?: any) => any;
  };
  axios: AxiosInstance;
  defineRoutes: (base: string, routes: RouteDefinition[]) => void;
}

export interface CreateAdvanceApiOptions {
  base?: string;
  prefix?: string;
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

// 模块类型联合
export type ModuleConfig = ObjectModeModule | DirectModeModule;
