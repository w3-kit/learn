import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { createServerEntry } from "@tanstack/react-start/server-entry";

const handler = createStartHandler({
  handler: defaultStreamHandler,
});

export default createServerEntry({
  async fetch(request) {
    return handler(request);
  },
});
