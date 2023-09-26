import { Alert, Modal } from "react-bootstrap";
import { Form, useActionData, useFetcher } from "react-router-dom";
import { useEffect, useState } from "react";

import html from "../common/html.js";

type AddArtistModalArgs = {
  show: boolean;
  onHide: () => unknown;
};

export const AddArtistModal = ({ show, onHide }: AddArtistModalArgs) => {
  const fetcher = useFetcher<{ data: Array<Record<string, unknown>> }>();
  const actionData = useActionData() as Record<string, unknown>;

  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!actionData) return;

    setShowAlert(true);
  }, [actionData]);

  return html`
    <${Modal}
      scrollable
      show=${show}
      onHide=${onHide}
      centered
      size="lg"
      onExited=${() => {
        setShowAlert(false);
        fetcher.load("/artists/reset");
      }}
    >
      <${Modal.Header} closeButton>
        <${Modal.Title}>Follow artist<//>
      <//>

      <${Modal.Body}>
        ${showAlert &&
        actionData &&
        actionData.intent === "subscribe" &&
        html`
          <${Alert}
            variant=${actionData.error ? "danger" : "success"}
            onClose=${() => {
              setShowAlert(false);
            }}
            dismissible
          >
            ${actionData.error ? "Unable to follow artist" : "Successfully followed artist"}
          <//>
        `}

        <${fetcher.Form} method="get" action="/artists/remote">
          <div class="mb-3">
            <input type="search" class="form-control" name="q" placeholder="Search artists to follow..." />
          </div>
        <//>

        <hr />

        ${fetcher.data?.data?.map?.(
          (remote) => html`
            <div class="card mb-3">
              <div class="row g-0">
                <div class="col-4">
                  <img src=${remote.image} class="img-fluid rounded-start" />
                </div>
                <div class="col-8 d-flex flex-column">
                  <div class="card-body" style=${{ flexGrow: 1 }}>
                    <h5 class="card-title">${remote.artistName}</h5>
                  </div>
                  <div class="card-footer text-muted">
                    <${Form} action="/artists" method="post">
                      <input type="hidden" name="intent" value="subscribe" />
                      <input type="hidden" name="name" value=${remote.artistName} />
                      <input type="hidden" name="id" value=${remote.artistId} />
                      <input type="hidden" name="image" value=${remote.image} />
                      <button type="submit" class="btn btn-primary" disabled=${
                        Boolean(remote.isSubscribed) || fetcher.state !== "idle"
                      }>
                        Subscribe
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          `,
        )}
      <//>
    <//>
  `;
};
