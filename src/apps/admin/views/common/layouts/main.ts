import { html } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";

// deno-lint-ignore no-explicit-any
type Component<P extends Record<string, unknown> = any> = P extends Record<
  string,
  unknown
> ? (props: P) => HtmlEscapedString | Promise<HtmlEscapedString>
  : () => HtmlEscapedString | Promise<HtmlEscapedString>;

type ScriptComponent = Component;
type BodyComponent = Component;
type CSSComponent = Component;

const MainLayout = <B extends BodyComponent>({
  Body,
  Scripts,
  Csss,
}: { Body?: B; Scripts?: ScriptComponent[]; Csss?: CSSComponent[] }): Component<
  Parameters<B>[0]
> =>
  ((props) =>
    html`
      <!doctype html>
      <html lang="en">

      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>MUSIC FOLLOWER | ADMIN</title>
        <link rel="stylesheet" href="/public/css/main.css" />

        ${Csss?.map((Css) => Css(props))}
      </head>

      <body>
        ${Body?.(props)}
        ${Scripts?.map((Script) => Script(props))}
      </body>

      </html>
    `) as Component<Parameters<B>[0]>;

export default MainLayout;
