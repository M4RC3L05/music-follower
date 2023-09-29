import { Container, Nav, Navbar } from "react-bootstrap";
import { NavLink, Outlet } from "react-router-dom";
import { type FC } from "react";
import { useDarkMode } from "usehooks-ts";

const Layout: FC = () => {
  const { isDarkMode } = useDarkMode();

  return (
    <>
      <Navbar bg={isDarkMode ? "dark" : "light"} fixed="top" expand="lg">
        <Container fluid="xl">
          <Navbar.Brand>Music follower</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <NavLink className="nav-link" to="/" end>
                Home
              </NavLink>
              <NavLink className="nav-link" to="/artists">
                Artists
              </NavLink>
              <NavLink className="nav-link" to="/releases">
                Releases
              </NavLink>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div style={{ marginTop: "56px" }}>
        <Outlet />
      </div>
    </>
  );
};

export default Layout;
