import { type IncomingMessage, type ServerResponse } from "node:http";
import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";

import { type Middleware } from "@m4rc3l05/sss";
import auth from "basic-auth";

type BasicAuthArgs = {
  user: {
    name: string;
    pass: string;
  };
  jsonResponse?: boolean;
};

const respondUnAuth = (isJson: boolean) => (_: IncomingMessage, response: ServerResponse) => {
  response.statusCode = 401;

  response.setHeader("content-type", isJson ? "application/json" : "text/html");
  response.setHeader("WWW-Authenticate", 'Basic realm="Secure Area"');
  response.end(isJson ? JSON.stringify({ error: { msg: "Unauthorized" } }) : "Unauthorized");
};

const basicAuth = (args: BasicAuthArgs): Middleware => {
  const nameBuff = Buffer.from(args.user.name);
  const passBuff = Buffer.from(args.user.pass);
  const bindedRespondeUnAuth = respondUnAuth(args.jsonResponse ?? false);

  return (request, response, next) => {
    const authInfo = auth(request);

    if (!authInfo) {
      bindedRespondeUnAuth(request, response);

      return;
    }

    // Lengths comparisons are ok
    // https://github.com/nodejs/node/issues/17178#issuecomment-348784606
    const userSameLength = authInfo.name.length === args.user.name.length;
    const passSameLength = authInfo.pass.length === args.user.pass.length;
    const sameLength = userSameLength && passSameLength;

    if (!sameLength) {
      bindedRespondeUnAuth(request, response);

      return;
    }

    const userSafeEqual = timingSafeEqual(nameBuff, Buffer.from(authInfo.name));
    const passSafeEqual = timingSafeEqual(passBuff, Buffer.from(authInfo.pass));
    const safeEqual = userSafeEqual && passSafeEqual;

    if (!safeEqual) {
      bindedRespondeUnAuth(request, response);

      return;
    }

    return next();
  };
};

export default basicAuth;
