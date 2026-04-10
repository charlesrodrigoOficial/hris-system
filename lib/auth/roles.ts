export function canManageAttendance(role?: string | null) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "SUPER_ADMIN" || normalized === "HR_MANAGER";
}

export function canManageFeed(role?: string | null) {
  return canManageAttendance(role);
}

export function canCreateFeedPost(role?: string | null) {
  return canManageFeed(role);
}
