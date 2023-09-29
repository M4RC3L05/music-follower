import { Form as BSForm, Badge, Card, Col, Container, Pagination, Row } from "react-bootstrap";
import {
  Form,
  Link,
  type LoaderFunction,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
  useSearchParams,
} from "react-router-dom";
import { useDocumentTitle } from "usehooks-ts";
import { useLayoutEffect } from "react";

import { type ResponseBody, requests } from "../common/request.js";
import { type Release } from "#src/domain/releases/types.js";
import { ShowReleaseModal } from "../components/show-release-modal.js";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? undefined;
  const page = url.searchParams.get("page") ?? undefined;
  const limit = url.searchParams.get("limit") ?? undefined;

  return requests.releases.getReleases({ query, page, limit });
};

export const Component = () => {
  useDocumentTitle("Music follower | Releases");

  const {
    data: releases,
    pagination: { total },
  } = useLoaderData() as ResponseBody<Release[]> & { pagination: { total: number } };
  const [searchParameters] = useSearchParams();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const page = searchParameters.has("page") ? Number(searchParameters.get("page")) : 0;
  const limit = searchParameters.has("limit") ? Number(searchParameters.get("limit")) : 12;
  const query = searchParameters.get("q");
  const selectedRelease = searchParameters.get("selectedRelease");
  const release = releases.find(({ id, type }) => `${id}@${type}` === selectedRelease);
  const location = useLocation();

  useLayoutEffect(() => {
    globalThis.document.documentElement.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return (
    <>
      <ShowReleaseModal
        release={release}
        show={Boolean(release)}
        onHide={() => {
          const sp = new URLSearchParams(searchParameters);
          sp.delete("selectedRelease");
          navigate(sp.size > 0 ? `?${sp.toString()}` : "");
        }}
      />
      <Container fluid="xl">
        <Row>
          <h1>Releases</h1>
        </Row>

        <Row>
          <Form method="get">
            <div className="mb-3">
              <BSForm.Control
                type="search"
                placeholder="Search releases..."
                name="q"
                defaultValue={query ?? ""}
                disabled={navigation.state !== "idle"}
              />
            </div>
          </Form>
        </Row>

        <Row className="g-4 mb-4" lg={3} md={2} sm={2} xs={1}>
          {releases.map((release) => (
            <Col key={`${release.id}@${release.type}`}>
              <Link
                to={`?selectedRelease=${`${release.id}@${release.type}`}${page ? `&page=${page}` : ""}${
                  query ? `&q=${query}` : ""
                }`}
              >
                <Card className="text-bg-dark">
                  <Card.Img src={release.coverUrl} style={{ aspectRatio: "1 / 1" }} />
                  <Card.ImgOverlay
                    style={{
                      display: "flex",
                      justifyContent: "end",
                      flexDirection: "column",
                      background: "linear-gradient(-180deg,transparent 20%,rgba(0,0,0,.7) 100%)",
                    }}
                  >
                    <div className="mb-2">
                      {new Date(release.releasedAt).getTime() > Date.now() ? (
                        <Badge bg="info" className="me-2">
                          To be released
                        </Badge>
                      ) : null}
                      <Badge bg="success">{release.type}</Badge>
                    </div>
                    <Card.Title>
                      <strong>
                        {release.name} by {release.artistName}
                      </strong>
                    </Card.Title>
                    <Card.Text className="card-text">
                      Released at {new Date(release.releasedAt).toLocaleString()}
                    </Card.Text>
                  </Card.ImgOverlay>
                </Card>
              </Link>
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

Component.displayName = "ReleasesPage";
