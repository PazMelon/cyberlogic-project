import type { CyberboardAttachment } from "../../../utils/api";

export function detectAttachmentProvider(url: string): CyberboardAttachment["provider"] {
  const lower = url.toLowerCase();
  if (
    lower.includes("drive.google.com") ||
    lower.includes("docs.google.com") ||
    lower.includes("sheets.google.com") ||
    lower.includes("slides.google.com")
  ) {
    return "google_drive";
  }
  if (lower.includes("dropbox.com")) {
    return "dropbox";
  }
  if (
    lower.includes("onedrive.live.com") ||
    lower.includes("sharepoint.com") ||
    lower.includes("1drv.ms")
  ) {
    return "onedrive";
  }
  if (lower.includes("figma.com")) {
    return "figma";
  }
  if (lower.includes("github.com") || lower.includes("gist.github.com")) {
    return "github";
  }
  return "general";
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export function parseLocalDate(dateStr?: string | null, fallbackYear = 2026, isEnd = false): Date {
  if (!dateStr) {
    return isEnd
      ? new Date(fallbackYear, 11, 31, 23, 59, 59, 999)
      : new Date(fallbackYear, 0, 1, 0, 0, 0, 0);
  }
  const clean = typeof dateStr === "string" ? dateStr.split("T")[0] : "";
  const parts = clean.split("-").map(Number);
  if (parts.length < 3 || parts.some(isNaN)) {
    return isEnd
      ? new Date(fallbackYear, 11, 31, 23, 59, 59, 999)
      : new Date(fallbackYear, 0, 1, 0, 0, 0, 0);
  }
  return isEnd
    ? new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999)
    : new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}
