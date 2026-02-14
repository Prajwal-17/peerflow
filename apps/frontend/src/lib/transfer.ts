import { dcRef } from "./ref";

export const handleSendFile = async (selectedFiles: File[]) => {
  for (const file of selectedFiles) {
    const metadata = JSON.stringify({
      type: "file-meta",
      name: file.name,
      fileType: file.type,
      size: file.size,
    });
    dcRef.current?.send(metadata);
    const buffer = await file.arrayBuffer();
    dcRef.current?.send(buffer);
  }
};
