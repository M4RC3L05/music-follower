import type { FC, PropsWithChildren } from "@hono/hono/jsx";

export const MainLayout: FC<PropsWithChildren> = (
  { children },
) => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>MUSIC FOLLOWER | ADMIN</title>
      <link rel="stylesheet" href="/public/css/main.min.css" />
    </head>

    <body>
      {children}
    </body>
  </html>
);
