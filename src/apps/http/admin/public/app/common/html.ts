import React from "react";
import htm from "htm";

const html = (htm as any as typeof htm.default).bind(React.createElement);

export default html;
