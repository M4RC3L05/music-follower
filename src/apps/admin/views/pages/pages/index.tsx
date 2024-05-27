import type { FC } from "@hono/hono/jsx";

export const PagesIndexPage: FC = () => (
  <>
    <header>
      <nav>
        <a class="current" href="/">Home</a>
        <a href="/artists">Artists</a>
        <a href="/releases">Releases</a>
      </nav>
    </header>

    <main>
      <h1>Welcome to music follower admin</h1>
      <p>See your releases and manage your artists</p>
    </main>
  </>
);
