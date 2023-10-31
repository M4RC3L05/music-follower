import { Alert, Form as BSForm, Button, Modal } from "react-bootstrap";
import { type FC, useEffect, useState } from "react";
import { Form, useActionData, useFetcher } from "react-router-dom";

type ImportArtistModalArgs = {
  show: boolean;
  onHide: () => unknown;
};

export const ImportArtistModal: FC<ImportArtistModalArgs> = ({ show, onHide }) => {
  const fetcher = useFetcher<{ data: undefined }>();
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
          <Modal.Title>Import artist</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {showAlert && actionData && actionData.intent === "import" && (
            <Alert
              variant={actionData.error ? "danger" : "success"}
              onClose={() => {
                setShowAlert(false);
              }}
              dismissible
            >
              {actionData.error ? "Unable to import artists" : "Successfully followed artist"}
            </Alert>
          )}
          <Form action="/artists" method="post" encType="multipart/form-data">
            <BSForm.Control type="hidden" name="intent" value="import" />
            <BSForm.Control type="file" name="artists" className="mb-2" />
            <Button type="submit" variant="primary" disabled={fetcher.state !== "idle"}>
              Import
            </Button>
          </Form>
          <hr />
        </Modal.Body>
      </Modal>
    </>
  );
};
