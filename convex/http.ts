import { httpRouter } from "convex/server";

import { pullHttp, pushHttp } from "./sync";

const http = httpRouter();

http.route({
  path: "/sync/push",
  method: "POST",
  handler: pushHttp,
});

http.route({
  path: "/sync/pull",
  method: "POST",
  handler: pullHttp,
});

export default http;
