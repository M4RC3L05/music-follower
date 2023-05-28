import { Badge, Image, Modal } from "react-bootstrap";
import { useEffect, useState } from "react";

import html from "../common/html.js";

export const ShowReleaseModal = ({ release, show, onHide }) => {
  const [releaseState, setReleaseState] = useState(release);

  useEffect(() => {
    if (release) setReleaseState(release);
  }, [release]);

  if (!releaseState) return;

  return html`
    <${Modal} scrollable show=${show} onHide=${onHide} centered size="lg">
      <${Modal.Header} closeButton>
        <${Modal.Title}>Release info<//>
      <//>

      <${Modal.Body} className="text-center">
        <${Image} src=${releaseState.coverUrl} rounded fluid />

        <br />
        <br />

        <h3>${releaseState.name} by ${releaseState.artistName}</h3>

        ${new Date(releaseState.releasedAt).getTime() > Date.now()
          ? html`<${Badge} bg="info" className="me-2">To be released<//>`
          : null}
        <${Badge} bg="success">${releaseState.type}<//>

        <br />
        <br />

        <p>Release date ${new Date(releaseState.releasedAt).toLocaleString()}</p>

        ${typeof releaseState.metadata?.previewUrl === "string"
          ? html`<audio src=${releaseState.metadata.previewUrl} controls class="w-100"></audio>`
          : null}

        <p>Metadata:</p>
        <pre style=${{ textAlign: "start" }}>${JSON.stringify(releaseState.metadata, null, 2)}</pre>
      <//>
    <//>
  `;
};
