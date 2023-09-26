import { Col, Container, Row } from "react-bootstrap";
import { useDocumentTitle } from "usehooks-ts";

import html from "../common/html.js";

export const Component = () => {
  useDocumentTitle("Music follower | Index");

  return html`
    <${Container} className="text-center">
      <${Row}>
        <${Col}>
          <h1 class="display-2">Welcome to music follower admin</h1>
          <h4>See your releases and manage your artists</h4>
        </div>
      <//>
    <//>
  `;
};

Component.displayName = "IndexPage";
