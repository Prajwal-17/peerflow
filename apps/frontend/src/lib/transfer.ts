import { ctrlRef, dcRef, pcRef } from "./ref";

export const handleSendFile = async (selectedFiles: File[]) => {
  if (!dcRef.current) {
    console.error(
      "Data Channel Reference is NULL. Did you call createDataChannel yet?",
    );
    return;
  }

  if (dcRef.current.readyState !== "open") {
    console.warn(
      "Data Channel is not OPEN. Current state:",
      dcRef.current.readyState,
    );
    return;
  }

  for (const file of selectedFiles) {
    const metadata = JSON.stringify({
      type: "file-meta",
      name: file.name,
      fileType: file.type,
      size: file.size,
    });
    ctrlRef.current?.send(metadata);

    if (!pcRef.current) {
      console.error(
        "Data Channel Reference is NULL. Did you call createDataChannel yet?",
      );
      return;
    }

    if (!ctrlRef.current) {
      console.error(
        "Data Channel Reference is NULL. Did you call createDataChannel yet?",
      );
      return;
    }

    await waitForReady(ctrlRef.current);

    let offset = 0;
    const chunkSize = 16 * 1024;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      const buffer = await chunk.arrayBuffer();
      dcRef.current.send(buffer);
      offset += chunkSize;
    }

    const checkBufferAndSendEOF = () => {
      if (dcRef.current?.bufferedAmount === 0) {
        ctrlRef.current?.send(
          JSON.stringify({
            type: "eof",
          }),
        );
      } else {
        setTimeout(checkBufferAndSendEOF, 50);
      }
    };
    checkBufferAndSendEOF();
  }
};

const waitForReady = (channel: RTCDataChannel): Promise<void> => {
  return new Promise((resolve) => {
    channel.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "ready") {
        // clean up the listener so it doesn't fire multiple times
        channel.onmessage = null;
        resolve();
      }
    };
  });
};
