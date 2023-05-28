import { Alert, Form as BSForm, Button, Card, Col, Container, Pagination, Row } from "react-bootstrap";
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDocumentTitle } from "usehooks-ts";

import { AddArtistModal } from "../components/add-artists-modal.js";
import html from "../common/html.js";
import { requests } from "../common/request.js";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const page = url.searchParams.get("page");
  const limit = url.searchParams.get("limit");

  return requests.artists.getArtists({ query, page, limit });
};

export const action = async ({ request }) => {
  const data = await request.formData();
  const intent = data.get("intent");

  switch (intent) {
    case "subscribe": {
      return {
        ...(await requests.artists.subscribeArtist({
          body: { id: Number(data.get("id")), name: data.get("name"), image: data.get("image") },
        })),
        intent,
      };
    }

    case "unsubscribe": {
      return {
        ...(await requests.artists.unsubscribeArtist({
          id: data.get("id"),
        })),
        intent,
      };
    }

    default: {
      return { ok: false, intent: "unknown" };
    }
  }
};

export const Component = () => {
  useDocumentTitle("Music follower | Artists");

  const {
    data: artists,
    pagination: { total },
  } = useLoaderData();
  const actionData = useActionData();
  const [searchParameters] = useSearchParams();
  const navigation = useNavigation();
  const page = searchParameters.has("page") ? Number(searchParameters.get("page")) : 0;
  const limit = searchParameters.has("limit") ? Number(searchParameters.get("limit")) : 12;
  const query = searchParameters.get("q");
  const [showAlert, setShowAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!actionData) return;

    setShowAlert(true);
  }, [actionData]);

  return html`
    <${AddArtistModal} show=${showModal} onHide=${() => setShowModal(false)} />
    <${Container} fluid="xl">
      ${showAlert &&
      actionData &&
      actionData.intent === "unsubscribe" &&
      html`
        <${Alert} variant=${actionData.error ? "danger" : "success"} onClose=${() => setShowAlert(false)} dismissible>
          ${actionData.error ? "Unable to remove artist" : "Successfully removed artist"}
        <//>
      `}
      <${Row}>
        <h1>Artists</h1>
      <//>

      <${Row}>
        <${Form} method="get">
          <div class="mb-3">
            <${BSForm.Control}
              type="search"
              placeholder="Search artists..."
              name="q"
              defaultValue=${query ?? ""}
              disabled=${navigation.state !== "idle"}
            />
            <br />
            <${Button} variant="primary" onClick=${() => setShowModal(true)}>Follow artist<//>
          </div>
        <//>
      <//>

      <${Row} className="g-4 mb-4" lg=${3} md=${2} sm=${2} xs=${1}>
        ${artists.map(
          (artist) => html`
            <${Col} key=${artist.id}>
              <${Card} className="text-bg-dark">
                <${Form} method="delete" style=${{ position: "absolute", top: "8px", right: "8px", zIndex: 1 }}>
                  <input type="hidden" name="id" value=${artist.id} />
                  <input type="hidden" name="intent" value="unsubscribe" />
                  <button type="submit" class="btn btn-danger" style=${{ zIndex: 2 }}>
                    <i class="bi bi-person-dash-fill"></i>
                  </button>
                <//>

                <${Card.Img} src=${artist.imageUrl} style=${{ aspectRatio: "1 / 1" }} />

                <${Card.ImgOverlay}
                  style=${{
                    display: "flex",
                    justifyContent: "end",
                    flexDirection: "column",
                    background: "linear-gradient(-180deg,transparent 20%,rgba(0,0,0,.7) 100%)",
                  }}
                >
                  <${Card.Title}><strong>${artist.name}</strong><//>
                <//>
              <//>
            <//>
          `,
        )}
      <//>

      <${Row}>
        <${Col}>
          <${Pagination} className="justify-content-center">
            <${Link}
              className=${`page-link${page <= 0 ? " disabled" : ""}`}
              to=${`?page=0${query ? `&q=${query}` : ""}`}
            >
              Start
            <//>
            <${Link}
              className=${`page-link${page <= 0 ? " disabled" : ""}`}
              to=${`?page=${Math.max(page - 1, 0)}${query ? `&q=${query}` : ""}`}
            >
              Previous
            <//>
            <${Pagination.Ellipsis} disabled />
            <${Link}
              className=${`page-link${(page + 1) * limit >= total ? " disabled" : ""}`}
              to=${`?page=${Math.min(page + 1, Math.ceil(total / limit) - 1)}${query ? `&q=${query}` : ""}`}
            >
              Next
            <//>
            <${Link}
              className=${`page-link${(page + 1) * limit >= total ? " disabled" : ""}`}
              to=${`?page=${Math.ceil(total / limit) - 1}${query ? `&q=${query}` : ""}`}
            >
              End
            <//>
          <//>
        <//>
      <//>
    <//>
  `;
};

Component.displayName = "ArtistsPage";
