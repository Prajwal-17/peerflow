export const config = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export const CODE_LENGTH = 5;

export const featurePills = [
  "No account needed",
  "Any file type",
  "No size limits",
];

export const steps = [
  {
    id: "01",
    title: "Select files & Send",
    desc: "Choose files to share and click send to create a room",
    delay: "0.55s",
  },
  {
    id: "02",
    title: "Receiver joins",
    desc: "Join using the room ID, invite link, or QR scanner",
    delay: "0.65s",
  },
  {
    id: "03",
    title: "Transfer starts",
    desc: "Files seamlessly transfer directly via WebRTC",
    delay: "0.75s",
  },
];
