import { Col, Container, Row } from "react-bootstrap";
import { useDocumentTitle } from "usehooks-ts";

export const Component = () => {
  useDocumentTitle("Music follower | Index");

  return (
    <Container className="text-center">
      <Row>
        <Col>
          <h1 className="display-2">Welcome to music follower admin</h1>
          <h4>See your releases and manage your artists</h4>
        </Col>
      </Row>
    </Container>
  );
};

Component.displayName = "IndexPage";
