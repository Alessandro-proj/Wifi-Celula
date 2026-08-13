import { z } from "zod";
import { sanitizeText } from "./utils";

const text = (min = 1, max = 160) =>
  z
    .string()
    .min(min, "Campo obrigatório")
    .max(max, `Use no máximo ${max} caracteres`)
    .transform(sanitizeText);

const optionalText = (max = 240) =>
  z
    .string()
    .max(max, `Use no máximo ${max} caracteres`)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? sanitizeText(value) : undefined));

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido").transform(sanitizeText),
  password: z.string().min(6, "Informe sua senha"),
  remember: z.boolean().optional(),
});

export const participantFormSchema = z.object({
  fullName: text(3, 140),
  preferredName: optionalText(80),
  age: z
    .string()
    .max(3, "Informe uma idade válida")
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || (/^\d+$/.test(value) && Number(value) <= 120), "Informe uma idade válida")
    .transform((value) => (value ? sanitizeText(value) : undefined)),
  groupId: optionalText(80),
  birthDate: optionalText(20),
  phone: optionalText(30),
  whatsapp: optionalText(30),
  email: z
    .string()
    .email("Informe um e-mail válido")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? sanitizeText(value) : undefined)),
  gender: optionalText(40),
  address: optionalText(180),
  neighborhood: optionalText(80),
  joinedAt: text(4, 20),
  participantType: z.enum([
    "member",
    "visitor",
    "leader",
    "assistant",
    "child",
    "teenager",
  ]),
  status: z.enum(["active", "inactive", "away", "transferred"]),
  invitedBy: optionalText(120),
  firstVisitAt: optionalText(20),
  notes: optionalText(600),
});

export const visitorQuickSchema = z.object({
  fullName: text(3, 140),
  whatsapp: optionalText(30),
  invitedBy: optionalText(120),
  firstVisitAt: text(4, 20),
  notes: optionalText(360),
  wantsReturn: z.boolean().optional(),
});

export const groupFormSchema = z.object({
  name: text(3, 100),
  description: optionalText(280),
  color: z.enum(["blue", "cyan", "green", "violet", "amber", "rose"]),
  leaderParticipantId: optionalText(80),
  newLeaderName: optionalText(140),
});

export const meetingFormSchema = z.object({
  meetingDate: text(4, 20),
  startTime: text(4, 10),
  endTime: optionalText(10),
  theme: text(3, 140),
  description: optionalText(480),
  address: text(3, 180),
  status: z.enum(["scheduled", "in_progress", "finalized", "cancelled"]),
  notes: optionalText(600),
});

export const adminUserSchema = z.object({
  fullName: text(3, 140),
  email: z.string().email("Informe um e-mail válido").transform(sanitizeText),
  phone: optionalText(30),
  password: z.string().min(8, "Use uma senha temporária com 8 caracteres"),
  role: z.enum(["admin", "leader", "assistant", "viewer"]),
  cellId: optionalText(80),
  groupId: optionalText(80),
  participantId: optionalText(80),
  active: z.boolean().optional(),
});

export const adminUserUpdateSchema = adminUserSchema.extend({
  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || value.length >= 8, "Use uma senha temporÃ¡ria com 8 caracteres")
    .transform((value) => (value ? sanitizeText(value) : undefined)),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ParticipantFormValues = z.infer<typeof participantFormSchema>;
export type VisitorQuickValues = z.infer<typeof visitorQuickSchema>;
export type GroupFormValues = z.infer<typeof groupFormSchema>;
export type MeetingFormValues = z.infer<typeof meetingFormSchema>;
export type AdminUserValues = z.infer<typeof adminUserSchema>;
export type AdminUserUpdateValues = z.infer<typeof adminUserUpdateSchema>;
