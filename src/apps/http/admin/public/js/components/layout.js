import { Container, Nav, Navbar } from "react-bootstrap";
import { NavLink, Outlet } from "react-router-dom";
import { useDarkMode } from "usehooks-ts";

import html from "../common/html.js";

const Layout = () => {
  const { isDarkMode } = useDarkMode();

  return html`
    <${Navbar} bg=${isDarkMode ? "dark" : "light"} fixed="top" expand="lg">
      <${Container} fluid="xl">
        <${Navbar.Brand}>Music follower<//>
        <${Navbar.Toggle} aria-controls="basic-navbar-nav" />
        <${Navbar.Collapse} id="basic-navbar-nav">
          <${Nav} className="me-auto">
            <${NavLink} className="nav-link" to="/" end>Home<//>
            <${NavLink} className="nav-link" to="/artists">Artists<//>
            <${NavLink} className="nav-link" to="/releases">Releases<//>
          <//>
        <//>
      <//>
    <//>

    <div style=${{ marginTop: "56px" }}>
      <${Outlet} />
    </div>
  `;
};

export default Layout;
