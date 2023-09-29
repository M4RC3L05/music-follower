import { Badge, Image, Modal } from "react-bootstrap";
import { type FC, useEffect, useState } from "react";

import { type Release } from "#src/domain/releases/types.js";

type ShowReleaseModalArgs = {
  release?: Release;
  show: boolean;
  onHide: () => unknown;
};

export const ShowReleaseModal: FC<ShowReleaseModalArgs> = ({ release, show, onHide }) => {
  const [releaseState, setReleaseState] = useState(release);

  useEffect(() => {
    if (release) setReleaseState(release);
  }, [release]);

  if (!releaseState) return;

  return (
    <Modal scrollable show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Release info</Modal.Title>
      </Modal.Header>

      <Modal.Body className="text-center">
        <Image src={releaseState.coverUrl} rounded fluid />

        <br />
        <br />

        <h3>
          {releaseState.name} by {releaseState.artistName}
        </h3>

        {new Date(releaseState.releasedAt).getTime() > Date.now() ? (
          <Badge bg="info" className="me-2">
            To be released
          </Badge>
        ) : null}
        <Badge bg="success">{releaseState.type}</Badge>

        <br />
        <br />

        <p>Release date {new Date(releaseState.releasedAt).toLocaleString()}</p>

        {typeof releaseState.metadata?.previewUrl === "string" ? (
          <audio src={releaseState.metadata.previewUrl} controls className="w-100"></audio>
        ) : null}

        <p>Metadata:</p>
        <pre style={{ textAlign: "start" }}>{JSON.stringify(releaseState.metadata, null, 2)}</pre>
      </Modal.Body>
    </Modal>
  );
};
