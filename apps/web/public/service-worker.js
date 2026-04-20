/// <reference lib="webworker" />

/** @type {ServiceWorkerGlobalScope} */
const sw = self;

let activeController = null;

sw.addEventListener("install", () => {
  sw.skipWaiting();
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(sw.clients.claim());
});

sw.addEventListener("message", (event) => {
  if (!activeController) return;

  if (event.data && event.data.type === "eof") {
    activeController.close();
    activeController = null;
    return;
  }

  activeController.enqueue(event.data);
});

sw.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === "/download-stream") {
    const filename = url.searchParams.get("filename");

    const stream = new ReadableStream({
      start(controller) {
        activeController = controller;
      },
    });

    event.respondWith(
      new Response(stream, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      }),
    );
  }
});
