import { type Middleware } from "@m4rc3l05/sss";

const cors: Middleware = (request, response, next) => {
  response.setHeader("vary", "origin");
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "GET,HEAD,PUT,POST,DELETE,PATCH");

  const requestHeadrs = request.headers["access-control-request-headers"];
  if (requestHeadrs) {
    response.setHeader("access-control-allow-headers", requestHeadrs);
  }

  if (request.method === "OPTIONS") {
    response.statusCode = 204;

    response.end();
    return;
  }

  return next();
};

export default cors;
