import { createAdvanceApi, ApiRequest } from "vite-advance-api";

createAdvanceApi({
  setup: ({ defineRoutes }) => [
    {
      type: "object",
      base: "/user",
      apis: [
        {
          path: "/profile",
          method: "get",
          handler: async (req: ApiRequest, res) => {
            // 可以使用类型提示
            const userId = req.query.id;
            res.success({ id: userId });
          },
        },
      ],
    },
  ],
});
