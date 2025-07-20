import type { Hono } from "@hono/hono";
import { JSDOM } from "jsdom";
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
