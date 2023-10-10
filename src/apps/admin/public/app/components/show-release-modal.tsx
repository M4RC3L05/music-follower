import { Badge, Form, Image, Modal } from "react-bootstrap";
import { type FC, useEffect, useState } from "react";

import { type Release } from "#src/database/mod.js";
import { requests } from "../common/request.js";

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

  const onHideCheck = (prop: string, checked: boolean) => {
    const final = [...releaseState.hidden];

    if (!checked && final.includes(prop)) {
      final.splice(final.indexOf(prop), 1);
    }

    if (checked && !final.includes(prop)) {
      final.push(prop);
    }

    void requests.releases
      .updateRelease({
        body: { hidden: [...new Set(final)] },
        id: releaseState.id,
      })
      .then(() => {
        setReleaseState((previous) => ({ ...previous!, hidden: final }));
      });
  };

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

        <div className="text-start">
          <p>Hidden:</p>
          <Form.Switch
            label="Admin"
            checked={releaseState?.hidden?.includes("admin")}
            onChange={(event) => {
              onHideCheck("admin", event.target.checked);
            }}
          />
          <Form.Switch
            label="Feed"
            checked={releaseState?.hidden?.includes("feed")}
            onChange={(event) => {
              onHideCheck("feed", event.target.checked);
            }}
            className="mb-4"
          />

          <p>Metadata:</p>
          <pre style={{ textAlign: "start" }}>{JSON.stringify(releaseState.metadata, null, 2)}</pre>
        </div>
      </Modal.Body>
    </Modal>
  );
};
