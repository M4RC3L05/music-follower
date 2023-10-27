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
  const incomingNameBuff = Buffer.alloc(nameBuff.byteLength);
  const passBuff = Buffer.from(args.user.pass);
  const incomingPassBuff = Buffer.alloc(passBuff.byteLength);
  const bindedRespondeUnAuth = respondUnAuth(args.jsonResponse ?? false);

  return (request, response, next) => {
    const authInfo = auth(request);

    if (!authInfo) {
      bindedRespondeUnAuth(request, response);

      return;
    }

    incomingNameBuff.write(authInfo.name);
    incomingPassBuff.write(authInfo.pass);

    if (!timingSafeEqual(nameBuff, incomingNameBuff) || !timingSafeEqual(passBuff, incomingPassBuff)) {
      bindedRespondeUnAuth(request, response);

      return;
    }

    return next();
  };
};

export default basicAuth;
