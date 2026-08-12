import { clsx, type ClassValue } from "clsx";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import type {
  AttendanceStatus,
  MeetingStatus,
  ParticipantStatus,
  ParticipantType,
  Role,
} from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeText(value: string) {
  return value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatDate(date: string, pattern = "dd MMM yyyy") {
  return format(parseISO(date), pattern, { locale: ptBR });
}

export function formatToday() {
  return format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  leader: "Líder",
  assistant: "Auxiliar",
  viewer: "Visualização",
};

export const participantTypeLabels: Record<ParticipantType, string> = {
  member: "Membro",
  visitor: "Visitante",
  leader: "Líder",
  assistant: "Auxiliar",
  child: "Criança",
  teenager: "Adolescente",
};

export const participantStatusLabels: Record<ParticipantStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  away: "Acompanhamento",
  transferred: "Transferido",
};

export const meetingStatusLabels: Record<MeetingStatus, string> = {
  scheduled: "Agendado",
  in_progress: "Em andamento",
  finalized: "Finalizado",
  cancelled: "Cancelado",
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  present: "Presente",
  absent: "Faltou",
  justified: "Justificado",
  visitor_present: "Visitante presente",
  not_informed: "Não informado",
};

export function toCsv(rows: Array<Record<string, string | number | boolean>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | boolean) =>
    `"${String(value).replaceAll('"', '""')}"`;
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}
