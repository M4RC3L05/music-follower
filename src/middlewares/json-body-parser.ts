import { type Middleware } from "@m4rc3l05/sss";
import bodyParser from "body-parser";

const jsonBodyParser = (): Middleware => {
  const json = bodyParser.json();

  return (request, response, next) =>
    new Promise<void>((resolve, reject) => {
      json(request, response, (error) => {
        if (error) reject(error);
        resolve();
      });
    }).then(() => next());
};

export default jsonBodyParser;
