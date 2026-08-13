import type { Role } from "./types";

export function canManageUsers(role: Role) {
  return role === "admin";
}

export function canManageCells(role: Role) {
  return role === "admin";
}

export function canDeleteMeetings(role: Role) {
  return role === "admin";
}

export function canManageParticipants(role: Role) {
  return role === "admin" || role === "leader";
}

export function canRegisterAttendance(role: Role) {
  return role === "admin" || role === "leader" || role === "assistant";
}

export function canEditFinalizedAttendance(role: Role) {
  return role === "admin" || role === "leader";
}

export function canViewReports(role: Role) {
  return role === "admin" || role === "leader" || role === "assistant";
}

export function canAccessRoute(role: Role, route: string) {
  if (route.startsWith("/admin")) return role === "admin";
  if (route.includes("/presenca")) return canRegisterAttendance(role);
  if (route === "/relatorios") return canViewReports(role);
  return true;
}
