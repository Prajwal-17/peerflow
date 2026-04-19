/// <reference lib="webworker" />

/** @type {ServiceWorkerGlobalScope} */
const sw = self;
let streamController = null;

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
    if (!streamController) return;
    if (event.data.type === "eof") {
      streamController.close();
      streamController = null;
      return;
    }
    streamController.enqueue(event.data);
  });
};
listenEvent();

const fetchEvent = () => {
  sw.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    if (url.pathname === "/download-stream") {
      const filename = url.searchParams.get("filename");

      const stream = new ReadableStream({
        start(controller) {
          streamController = controller;
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
