export function normalizeRelativeCallbackUrl(
  callbackUrl?: string | null,
): string {
  if (!callbackUrl) {
    return "/";
  }

  if (callbackUrl.startsWith("/")) {
    return callbackUrl;
  }

  try {
    const parsedUrl = new URL(callbackUrl);
    const relativeUrl = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;

    return relativeUrl.startsWith("/") ? relativeUrl : "/";
  } catch {
    return "/";
  }
}
