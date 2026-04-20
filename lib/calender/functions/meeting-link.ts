export function normalizeOptionalMeetLink(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function isGoogleMeetUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.toLowerCase() === "meet.google.com"
    );
  } catch {
    return false;
  }
}
