const apiPlugin = createAdvanceApi({
  base: "/v1",
  prefix: "/api", // 可选，默认为 "/api"
  setup: ({ _, axios, uuid, defineRoutes }) => [
    // ... 路由配置
  ],
});
