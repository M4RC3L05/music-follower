import {
  type ActionFunction,
  Form,
  Link,
  type LoaderFunction,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
} from "react-router-dom";
import { Alert, Form as BSForm, Button, Card, Col, Container, Pagination, Row } from "react-bootstrap";
import { useEffect, useLayoutEffect, useState } from "react";
import { useDocumentTitle } from "usehooks-ts";

import { type ResponseBody, requests } from "../common/request.js";
import { AddArtistModal } from "../components/add-artists-modal.js";
import { type Artist } from "#src/domain/artists/types.js";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? undefined;
  const page = url.searchParams.get("page") ?? undefined;
  const limit = url.searchParams.get("limit") ?? undefined;

  return requests.artists.getArtists({ query, page, limit });
};

export const action: ActionFunction = async ({ request }) => {
  const data = await request.formData();
  const intent = data.get("intent");

  switch (intent) {
    case "subscribe": {
      return {
        ...(await requests.artists.subscribeArtist({
          body: { id: Number(data.get("id")!), name: data.get("name") as string, image: data.get("image") as string },
        })),
        intent,
      };
    }

    case "unsubscribe": {
      return { ...(await requests.artists.unsubscribeArtist({ id: Number(data.get("id")) })), intent };
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
  } = useLoaderData() as ResponseBody<Artist[]> & { pagination: { total: number } };
  const actionData = useActionData() as ResponseBody & { intent: "subscribe" | "unsubscribe" };
  const [searchParameters] = useSearchParams();
  const navigation = useNavigation();
  const page = searchParameters.has("page") ? Number(searchParameters.get("page")) : 0;
  const limit = searchParameters.has("limit") ? Number(searchParameters.get("limit")) : 12;
  const query = searchParameters.get("q");
  const [showAlert, setShowAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();

  useLayoutEffect(() => {
    globalThis.document.documentElement.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!actionData) return;

    setShowAlert(true);
  }, [actionData]);

  return (
    <>
      <AddArtistModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
        }}
      />
      <Container fluid="xl">
        {showAlert && actionData && actionData.intent === "unsubscribe" && (
          <Alert
            variant={actionData.error ? "danger" : "success"}
            onClose={() => {
              setShowAlert(false);
            }}
            dismissible
          >
            {actionData.error ? "Unable to remove artist" : "Successfully removed artist"}
          </Alert>
        )}

        <Row>
          <h1>Artists</h1>
        </Row>

        <Row>
          <Form method="get">
            <div className="mb-3">
              <BSForm.Control
                type="search"
                placeholder="Search artists..."
                name="q"
                defaultValue={query ?? ""}
                disabled={navigation.state !== "idle"}
              />
              <br />
              <Button
                variant="primary"
                onClick={() => {
                  setShowModal(true);
                }}
              >
                Follow artist
              </Button>
            </div>
          </Form>
        </Row>

        <Row className="g-4 mb-4" lg={3} md={2} sm={2} xs={1}>
          {artists.map((artist) => (
            <Col key={artist.id}>
              <Card className="text-bg-dark">
                <Form method="delete" style={{ position: "absolute", top: "8px", right: "8px", zIndex: 1 }}>
                  <BSForm.Control type="hidden" name="id" value={artist.id} />
                  <BSForm.Control type="hidden" name="intent" value="unsubscribe" />
                  <Button type="submit" variant="danger" style={{ zIndex: 2 }}>
                    <i className="bi bi-person-dash-fill"></i>
                  </Button>
                </Form>

                <Card.Img src={artist.imageUrl} style={{ aspectRatio: "1 / 1" }} />

                <Card.ImgOverlay
                  style={{
                    display: "flex",
                    justifyContent: "end",
                    flexDirection: "column",
                    background: "linear-gradient(-180deg,transparent 20%,rgba(0,0,0,.7) 100%)",
                  }}
                >
                  <Card.Title>
                    <strong>{artist.name}</strong>
                  </Card.Title>
                </Card.ImgOverlay>
              </Card>
            </Col>
          ))}
        </Row>

        <Row>
          <Col>
            <Pagination className="justify-content-center">
              <Link className={`page-link${page <= 0 ? " disabled" : ""}`} to={`?page=0${query ? `&q=${query}` : ""}`}>
                Start
              </Link>
              <Link
                className={`page-link${page <= 0 ? " disabled" : ""}`}
                to={`?page=${Math.max(page - 1, 0)}${query ? `&q=${query}` : ""}`}
              >
                Previous
              </Link>
              <Pagination.Ellipsis disabled />
              <Link
                className={`page-link${(page + 1) * limit >= total ? " disabled" : ""}`}
                to={`?page=${Math.min(page + 1, Math.ceil(total / limit) - 1)}${query ? `&q=${query}` : ""}`}
              >
                Next
              </Link>
              <Link
                className={`page-link${(page + 1) * limit >= total ? " disabled" : ""}`}
                to={`?page=${Math.ceil(total / limit) - 1}${query ? `&q=${query}` : ""}`}
              >
                End
              </Link>
            </Pagination>
          </Col>
        </Row>
      </Container>
    </>
  );
};

Component.displayName = "ArtistsPage";
