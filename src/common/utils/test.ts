import type { Hono } from "@hono/hono";
import { DOMParser, type Element, type HTMLDocument } from "@b-fuze/deno-dom";
import {
  assertEquals,
  assertExists,
  AssertionError,
  assertStringIncludes,
  assertThrows,
} from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import toDiffableHtml from "diffable-html";

export const getSessionCookie = (response: Response) => {
  return response.headers.get("set-cookie")?.slice(
    0,
    response.headers.get("set-cookie")?.indexOf(";"),
  ) ?? "";
};

export const authenticateRequest = async (app: Hono) => {
  const res = await app.request("/auth/login", {
    method: "post",
    redirect: "follow",
    headers: { origin: "http://localhost" },
    body: new URLSearchParams({
      username: "foo",
      password: "bar",
    }),
  });

  return { sid: getSessionCookie(res), res } as const;
};

export const getDom = async (response: Response) => {
  return new DOMParser().parseFromString(await response.text(), "text/html");
};

export const prettyFormatHTML = (input: string) => {
  return toDiffableHtml(input);
};

const getAssertSeeContent = (
  ele: Element,
  textOnly?: boolean,
) => {
  return textOnly ? ele.textContent : ele.outerHTML;
};

export const assertSeeTextInOrder = (
  dom: HTMLDocument,
  what: string[],
  where?: string,
) => {
  const contentStr = getAssertSeeContent(
    where ? dom.querySelector(where)! : dom.documentElement!,
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

export const assertSeeText = (
  dom: HTMLDocument,
  what: string,
  where?: string,
) => {
  const contentStr = getAssertSeeContent(
    where ? dom.querySelector(where)! : dom as unknown as Element,
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

export const assertNotSeeText = (
  dom: HTMLDocument,
  what: string,
  where?: string,
) => {
  const contentStr = getAssertSeeContent(
    where ? dom.querySelector(where)! : dom as unknown as Element,
    true,
  );

  assertThrows(
    () => assertSeeText(dom, what, where),
    `Could see text content matching:\n\n${what}\n\nin:\n\n${contentStr}`,
  );
};

export const assertSeeInOrder = (
  dom: HTMLDocument,
  what: string[],
  where?: string,
) => {
  const contentStr = where
    ? getAssertSeeContent(dom.querySelector(where)!, false)
    : dom.documentElement!.outerHTML;

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

export const assertSee = (dom: HTMLDocument, what: string, where?: string) => {
  const contentStr = where
    ? getAssertSeeContent(dom.querySelector(where)!, false)
    : dom.documentElement!.outerHTML;

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

export const assertNotSee = (
  dom: HTMLDocument,
  what: string,
  where?: string,
) => {
  const contentStr = where
    ? getAssertSeeContent(dom.querySelector(where)!, false)!
    : dom.documentElement!.outerHTML;

  assertThrows(
    () => assertSee(dom, what, where),
    `Could see an text matching:\n\n${what}\n\nin:\n${
      prettyFormatHTML(contentStr)
    }`,
  );
};

export const assertNodeNotExists = (
  dom: HTMLDocument,
  what: string,
  where?: string,
) => {
  const container = where ? dom.querySelector(where) : dom;

  if (!container) {
    throw new AssertionError("Could not get container element");
  }

  assertExists(
    container.querySelector(what) ? undefined : true,
    `Could find an element matching:\n\n${what}\n\nin\n${
      prettyFormatHTML(
        container === dom
          ? dom.documentElement!.outerHTML
          : (container as Element).innerHTML,
      )
    }"`,
  );
};

export const assertNodeExists = (
  dom: HTMLDocument,
  what: string,
  where?: string,
) => {
  const container = where ? dom.querySelector(where) : dom;

  if (!container) {
    throw new AssertionError("Could not get container element");
  }

  assertExists(
    container.querySelector(what),
    `Could not find an element matching:\n\n${what}\n\nin\n${
      prettyFormatHTML(
        container === dom
          ? dom.documentElement!.outerHTML
          : (container as Element).innerHTML,
      )
    }"`,
  );
};

export const expectHtmlSnapshot = async (
  t: Deno.TestContext,
  dom: HTMLDocument,
  where?: string,
) => {
  const content = where
    ? dom.querySelector(where)!.outerHTML
    : dom.documentElement!.outerHTML;

  await assertSnapshot(
    t,
    prettyFormatHTML(content),
  );
};
