import type { Hono } from "@hono/hono";
import { encodeBase64 } from "@std/encoding";
import { JSDOM } from "jsdom";
import config from "#src/common/config/mod.ts";
import {
  assertEquals,
  assertExists,
  AssertionError,
  assertStringIncludes,
  assertThrows,
} from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import toDiffableHtml from "diffable-html";

const basicAuth = config.apps.web.basicAuth;

export const requestAuth = (
  app: Hono,
  ...args: Parameters<Hono["request"]>
) => {
  const basicAuthHeaderValue = `Basic ${
    encodeBase64(`${basicAuth.username}:${basicAuth.password}`)
  }`;

  args[1] ??= {};

  const newHeaders: Record<string, string> = (
    args[1].headers instanceof Headers
      ? Object.fromEntries(args[1].headers.entries())
      : (args[1].headers ?? {})
  ) as Record<string, string>;

  newHeaders["authorization"] = basicAuthHeaderValue;

  args[1].headers = newHeaders;

  return app.request(...args);
};

export const getDom = async (response: Response) => {
  return new JSDOM(await response.text());
};

export const prettyFormatHTML = (input: string) => {
  return toDiffableHtml(input);
};

const getAssertSeeContent = (ele: Element, textOnly?: boolean) => {
  return textOnly ? ele.textContent : ele.outerHTML;
};

export const assertSeeTextInOrder = (
  dom: JSDOM,
  what: string[],
  where?: string,
) => {
  const contentStr = getAssertSeeContent(
    where
      ? dom.window.document.querySelector(where)!
      : dom.window.document as unknown as Element,
    true,
  );

  if (!contentStr) {
    throw new AssertionError("Could not get text content");
  }

  let lastIndex = 0;

  for (const item of what) {
    const contentSliced = contentStr.slice(lastIndex);
    lastIndex = contentSliced.indexOf(item);

    if (lastIndex === -1) {
      throw new AssertionError(
        `Could not see text content matching in order:\n\n${item}\n\nin:\n\n${contentSliced}`,
      );
    }
  }
};

export const assertSeeText = (dom: JSDOM, what: string, where?: string) => {
  const contentStr = getAssertSeeContent(
    where
      ? dom.window.document.querySelector(where)!
      : dom.window.document as unknown as Element,
    true,
  );

  if (!contentStr) {
    throw new AssertionError("Could not get text content");
  }

  assertStringIncludes(
    contentStr,
    what,
    `Could not see text content matching:\n\n${what}\n\nin:\n${contentStr}`,
  );
};

export const assertNotSeeText = (dom: JSDOM, what: string, where?: string) => {
  const contentStr = getAssertSeeContent(
    where
      ? dom.window.document.querySelector(where)!
      : dom.window.document as unknown as Element,
    true,
  );

  assertThrows(
    () => assertSeeText(dom, what, where),
    `Could see text content matching:\n\n${what}\n\nin:\n\n${contentStr}`,
  );
};

export const assertSeeInOrder = (
  dom: JSDOM,
  what: string[],
  where?: string,
) => {
  const contentStr = where
    ? getAssertSeeContent(dom.window.document.querySelector(where)!, false)
    : dom.serialize();

  if (!contentStr) {
    throw new AssertionError("Could not get text content");
  }

  let lastIndex = 0;

  for (const item of what) {
    const contentSliced = contentStr.slice(lastIndex);
    lastIndex = contentSliced.indexOf(item);

    if (lastIndex === -1) {
      throw new AssertionError(
        `Could see text matching in order:\n\n${item}\n\nin:\n\n${
          prettyFormatHTML(contentSliced)
        }`,
      );
    }
  }
};

export const assertSee = (dom: JSDOM, what: string, where?: string) => {
  const contentStr = where
    ? getAssertSeeContent(dom.window.document.querySelector(where)!, false)
    : dom.serialize();

  if (!contentStr) {
    throw new AssertionError("Could not get text content");
  }

  assertEquals(
    contentStr.includes(what),
    true,
    `Could not see text matching:\n\n${what}\n\nin:\n${
      prettyFormatHTML(contentStr)
    }`,
  );
};

export const assertNotSee = (dom: JSDOM, what: string, where?: string) => {
  const contentStr = where
    ? getAssertSeeContent(dom.window.document.querySelector(where)!, false)!
    : dom.serialize();

  assertThrows(
    () => assertSee(dom, what, where),
    `Could see an text matching:\n\n${what}\n\nin:\n${
      prettyFormatHTML(contentStr)
    }`,
  );
};

export const assertNodeNotExists = (
  dom: JSDOM,
  what: string,
  where?: string,
) => {
  const container = where
    ? dom.window.document.querySelector(where)
    : dom.window.document;

  if (!container) {
    throw new AssertionError("Could not get container element");
  }

  assertExists(
    container.querySelector(what) ? undefined : true,
    `Could find an element matching:\n\n${what}\n\nin\n${
      prettyFormatHTML(
        container === dom.window.document
          ? dom.serialize()
          : (container as Element).innerHTML,
      )
    }"`,
  );
};

export const assertNodeExists = (dom: JSDOM, what: string, where?: string) => {
  const container = where
    ? dom.window.document.querySelector(where)
    : dom.window.document;

  if (!container) {
    throw new AssertionError("Could not get container element");
  }

  assertExists(
    container.querySelector(what),
    `Could not find an element matching:\n\n${what}\n\nin\n${
      prettyFormatHTML(
        container === dom.window.document
          ? dom.serialize()
          : (container as Element).innerHTML,
      )
    }"`,
  );
};

export const expectHtmlSnapshot = async (
  t: Deno.TestContext,
  dom: JSDOM,
  where?: string,
) => {
  const content = where
    ? dom.window.document.querySelector(where)!.outerHTML
    : dom.serialize();
  await assertSnapshot(
    t,
    prettyFormatHTML(content),
  );
};
