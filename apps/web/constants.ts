export const config = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export const featurePills = [
  "No account needed",
  "Any file type",
  "No size limits",
];

export const steps = [
  {
    id: "01",
    title: "Open Peerflow",
    desc: "On both devices, no install needed",
    delay: "0.55s",
  },
  {
    id: "02",
    title: "Connect peers",
    desc: "Discover nearby or share a link",
    delay: "0.65s",
  },
  {
  id: "03",
    title: "Drop & transfer",
    desc: "Files fly over WebRTC — zero servers",
    delay: "0.75s",
  },
];
