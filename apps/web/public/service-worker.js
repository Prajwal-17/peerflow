/// <reference lib="webworker" />

/** @type {ServiceWorkerGlobalScope} */
const sw = self;
const streamControllers = new Map();

const installEvent = () => {
  sw.addEventListener("install", () => {
    sw.skipWaiting();
  });
};
installEvent();

const activateEvent = () => {
  sw.addEventListener("activate", (event) => {
    event.waitUntil(sw.clients.claim());
  });
};
activateEvent();

const listenEvent = () => {
  sw.addEventListener("message", (event) => {
    const clientId = event.source.id;
    const controller = streamControllers.get(clientId);
    if (!controller) return;

    if (event.data.type === "eof") {
      controller.close();
      streamControllers.delete(clientId);
      return;
    }
    controller.enqueue(event.data);
  });
};
listenEvent();

const fetchEvent = () => {
  sw.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    if (url.pathname === "/download-stream") {
      const filename = url.searchParams.get("filename");

      // to isolate data streams else when 2 tab are opened in browser they send msg to themselves
      const clientId = event.clientId;

      const stream = new ReadableStream({
        start(controller) {
          streamControllers.set(clientId, controller);
        },
      });

      event.respondWith(
        new Response(stream, {
          headers: {
            "Content-type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        }),
      );
    }
  });
};
fetchEvent();
