import { Alert, Form as BSForm, Button, Card, Col, Image, Modal, Row } from "react-bootstrap";
import { type FC, useEffect, useState } from "react";
import { Form, useActionData, useFetcher } from "react-router-dom";

import { type ItunesArtistSearchModel } from "#src/remote/mod.js";

type AddArtistModalArgs = {
  show: boolean;
  onHide: () => unknown;
};

export const AddArtistModal: FC<AddArtistModalArgs> = ({ show, onHide }) => {
  const fetcher = useFetcher<{ data: Array<ItunesArtistSearchModel & { image: string; isSubscribed: boolean }> }>();
  const actionData = useActionData() as Record<string, unknown>;

  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!actionData) return;

    setShowAlert(true);
  }, [actionData]);

  return (
    <>
      <Modal
        scrollable
        show={show}
        onHide={onHide}
        centered
        size="lg"
        onExited={() => {
          setShowAlert(false);
          fetcher.load("/artists/reset");
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Follow artist</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {showAlert && actionData && actionData.intent === "subscribe" && (
            <Alert
              variant={actionData.error ? "danger" : "success"}
              onClose={() => {
                setShowAlert(false);
              }}
              dismissible
            >
              {actionData.error ? "Unable to follow artist" : "Successfully followed artist"}
            </Alert>
          )}
          <fetcher.Form method="get" action="/artists/remote">
            <div className="mb-3">
              <BSForm.Control type="search" name="q" placeholder="Search artists to follow..." />
            </div>
          </fetcher.Form>
          <hr />
          {fetcher.data?.data?.map?.((remote) => (
            <Card className="mb-3">
              <Row className="g-0">
                <Col xs={4}>
                  <Image src={remote.image} className="rounded-start" fluid />
                </Col>
                <Col xs={8} className="d-flex flex-column">
                  <Card.Body style={{ flexGrow: 1 }}>
                    <Card.Title>{remote.artistName}</Card.Title>
                  </Card.Body>
                  <Card.Footer className="text-muted">
                    <Form action="/artists" method="post">
                      <BSForm.Control type="hidden" name="intent" value="subscribe" />
                      <BSForm.Control type="hidden" name="name" value={remote.artistName} />
                      <BSForm.Control type="hidden" name="id" value={remote.artistId} />
                      <BSForm.Control type="hidden" name="image" value={remote.image} />
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={Boolean(remote.isSubscribed) || fetcher.state !== "idle"}
                      >
                        Subscribe
                      </Button>
                    </Form>
                  </Card.Footer>
                </Col>
              </Row>
            </Card>
          ))}
        </Modal.Body>
      </Modal>
    </>
  );
};
