import { Response } from "express";

// 响应状态类型
export type ResponseType = "success" | "error" | "denied";

// 响应状态码映射
export const Code = {
  success: 200,
  error: 400,
  denied: 401,
} as const;

// 响应消息映射
export const CodeMessage = {
  success: "操作成功",
  error: "操作失败",
  denied: "无权限访问",
} as const;

// 响应选项接口
export interface ResOption {
  success?: boolean;
  type?: ResponseType;
  code?: number;
  message?: string;
}

export class CommonResponse {
  private res: Response;

  constructor(res: Response) {
    this.res = res;
  }

  // 成功响应
  public success(data: unknown, message?: string, code?: number) {
    const resOptions = this.createOptions({
      success: true,
      type: "success",
      message: message || CodeMessage["success"],
      code: code ?? Code.success,
    });

    return this.respond(data, resOptions);
  }

  // 错误响应
  public error(data: unknown, message?: string, code?: number) {
    console.error(message || CodeMessage["error"]);
    const resOptions = this.createOptions({
      success: false,
      type: "error",
      message: message || CodeMessage["error"],
      code: code ?? Code.error,
    });

    return this.respond(data, resOptions);
  }

  // 无权限响应
  public denied(data: unknown, message?: string) {
    const resOptions = this.createOptions({
      success: false,
      type: "denied",
      message: message || CodeMessage["denied"],
      code: Code.denied,
    });

    return this.respond(data, resOptions);
  }

  private createOptions(options: ResOption): ResOption {
    return {
      type: options.type ?? "success",
      success: options.success ?? false,
      code: options.code,
      message: options.message ?? CodeMessage[options.type ?? "success"],
    };
  }

  private respond(data: unknown, options: ResOption) {
    const { code, message, success } = options;

    const response = {
      code,
      data,
      success,
      message,
    };

    this.res.status(code ?? 200).json(response);
  }
}
