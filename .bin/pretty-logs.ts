#!/usr/bin/env -S deno run -A

import type { LevelName } from "@std/log";
import { TextLineStream } from "@std/streams";

const jsonParse = (data: string) => {
  try {
    return JSON.parse(data);
  } catch {
    //
  }
};

const levelColor: Record<LevelName, string> = {
  "INFO": "color:cyan",
  CRITICAL: "color:darkred",
  DEBUG: "color:purple",
  ERROR: "color:red",
  WARN: "color:yellow",
  NOTSET: "color:reset",
};

// Make sure to wait for stdin to close to close the script
if (!Deno.stdin.isTerminal()) {
  Deno.addSignalListener("SIGINT", () => {});
}

const stdinByLines = Deno.stdin.readable
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TextLineStream());

for await (const line of stdinByLines) {
  const jsonParsed = jsonParse(line);

  if (!jsonParsed || typeof jsonParsed !== "object") {
    console.log(line);

    continue;
  }

  const { datetime, name, level, message, ...rest } = jsonParsed;

  if (datetime && name && level) {
    console.log(
      `%c[${datetime}] %c(${name}) %c${level}: %c${message}%c${
        Object.keys(rest ?? {}).length > 0
          ? `\n${
            Deno.inspect(rest, {
              colors: true,
              compact: false,
              strAbbreviateSize: Number.POSITIVE_INFINITY,
              depth: 1000,
              sorted: true,
              trailingComma: true,
            })
          }`
          : ""
      }`,
      "color:lightpink",
      "color:orange",
      levelColor[level as LevelName],
      "color:default",
      "color:reset",
    );
  } else {
    console.log(jsonParsed);
  }
}
