export function canManageAttendance(role?: string | null) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "ADMIN" || normalized === "HR";
}

export function canManageFeed(role?: string | null) {
  return canManageAttendance(role);
}

export function canCreateFeedPost(role?: string | null) {
  return canManageFeed(role);
}
