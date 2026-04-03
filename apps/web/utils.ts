export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const k = 1024;

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(2)} ${units[i]}`;
};

export const formatETA = (seconds: number) => {
  if (!seconds || !isFinite(seconds)) return "0s";

  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};
