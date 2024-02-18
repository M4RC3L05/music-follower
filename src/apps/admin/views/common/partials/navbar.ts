import { html } from "hono/html";

const Navbar = () =>
  html`
    <nav>
      <a href="/">Home</a>
      <a href="/artists">Artists</a>
      <a href="/releases">Releases</a>
    </nav>
  `;

export default Navbar;
