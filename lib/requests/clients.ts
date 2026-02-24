import type { CreateRequestPayload, RequestRow } from "./types";

export async function fetchRequests(): Promise<RequestRow[]> {
  const res = await fetch("/api/requests", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load requests");
  const data = (await res.json()) as RequestRow[];
  return Array.isArray(data) ? data : [];
}

export async function createRequest(payload: CreateRequestPayload) {
  const res = await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error ?? "Failed to create request");
  }

  return res.json();
}