import { Hono } from "hono";
import { Signalling } from "../lib/signalling";

type Bindings = {
  SIGNALLING: DurableObjectNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/ws", (c) => {
  // all req sent to single instance
  const id = c.env.SIGNALLING.idFromName("global-signalling-instance");
  const stub = c.env.SIGNALLING.get(id);

  // forward raw req to durable object
  return stub.fetch(c.req.raw);
});

export default app;

// wrangler expects Durable object export from main file "src/index.ts"
export { Signalling };
