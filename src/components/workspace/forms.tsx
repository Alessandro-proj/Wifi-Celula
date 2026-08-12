"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save } from "lucide-react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  adminUserSchema,
  adminUserUpdateSchema,
  meetingFormSchema,
  participantFormSchema,
  type AdminUserValues,
  type AdminUserUpdateValues,
  type MeetingFormValues,
  type ParticipantFormValues,
} from "@/lib/schemas";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Cell, CellGroup, Meeting, Participant, ParticipantType, Profile } from "@/lib/types";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}

function Input({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm"
        {...props}
      />
      <FieldError message={error} />
    </label>
  );
}

function Select({
  label,
  error,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm"
        {...props}
      >
        {children}
      </select>
      <FieldError message={error} />
    </label>
  );
}

function TextArea({
  label,
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return (
    <label className="block sm:col-span-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 shadow-sm"
        {...props}
      />
      <FieldError message={error} />
    </label>
  );
}

function participantDefaults(
  participant?: Participant,
  defaultType: ParticipantType = "member",
): Partial<ParticipantFormValues> {
  return {
    fullName: participant?.fullName ?? "",
    preferredName: participant?.preferredName ?? "",
    age: participant?.age ? String(participant.age) : "",
    groupId: participant?.groupId ?? "",
    birthDate: participant?.birthDate ?? "",
    phone: participant?.phone ?? "",
    whatsapp: participant?.whatsapp ?? "",
    email: participant?.email ?? "",
    gender: participant?.gender ?? "",
    address: participant?.address ?? "",
    neighborhood: participant?.neighborhood ?? "",
    joinedAt: participant?.joinedAt ?? new Date().toISOString().slice(0, 10),
    participantType: participant?.participantType ?? defaultType,
    status: participant?.status ?? "active",
    invitedBy: participant?.invitedBy ?? "",
    firstVisitAt: participant?.firstVisitAt ?? "",
    notes: participant?.notes ?? "",
  };
}

export function ParticipantForm({
  cell,
  groups = [],
  participant,
  defaultType = "member",
  allowVisitors = true,
  onSaved,
}: {
  cell: Cell;
  groups?: CellGroup[];
  participant?: Participant;
  defaultType?: ParticipantType;
  allowVisitors?: boolean;
  onSaved?: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const isEditing = Boolean(participant);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ParticipantFormValues>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: participantDefaults(participant, defaultType),
  });

  async function onSubmit(values: ParticipantFormValues) {
    setMessage(null);
    const supabase = createBrowserSupabaseClient();
    const payload = {
      cell_id: cell.id,
      group_id: values.groupId || null,
      full_name: values.fullName,
      preferred_name: values.preferredName || values.fullName.split(" ")[0],
      age: values.age ? Number(values.age) : null,
      birth_date: values.birthDate || null,
      phone: values.phone || null,
      whatsapp: values.whatsapp || null,
      email: values.email || null,
      gender: values.gender || null,
      address: values.address || null,
      neighborhood: values.neighborhood || null,
      joined_at: values.joinedAt,
      participant_type: values.participantType,
      status: values.status,
      invited_by: values.invitedBy || null,
      first_visit_at: values.firstVisitAt || null,
      notes: values.notes || null,
      active: values.status === "active",
    };

    if (supabase) {
      const query = isEditing && participant
        ? supabase.from("participants").update(payload).eq("id", participant.id)
        : supabase.from("participants").insert(payload);
      const { error } = await query;
      if (error) {
        setMessage(error.message);
        return;
      }
    }

    setMessage(isEditing ? "Cadastro atualizado com sucesso." : defaultType === "visitor" ? "Visitante salvo com sucesso." : "Integrante salvo com sucesso.");
    if (!isEditing) reset(participantDefaults(undefined, defaultType));
    onSaved?.();
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <Input label="Nome completo" error={errors.fullName?.message} {...register("fullName")} />
      <Input label="Como prefere ser chamado" error={errors.preferredName?.message} {...register("preferredName")} />
      <Input label="Idade" type="number" min={0} max={120} error={errors.age?.message} {...register("age")} />
      <Select label="Grupo" error={errors.groupId?.message} {...register("groupId")}>
        <option value="">Sem grupo</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>{group.name}</option>
        ))}
      </Select>
      <Input label="Nascimento" type="date" error={errors.birthDate?.message} {...register("birthDate")} />
      <Input label="Data de entrada" type="date" error={errors.joinedAt?.message} {...register("joinedAt")} />
      <Input label="Telefone" error={errors.phone?.message} {...register("phone")} />
      <Input label="WhatsApp" error={errors.whatsapp?.message} {...register("whatsapp")} />
      <Input label="E-mail" type="email" error={errors.email?.message} {...register("email")} />
      <Input label="Bairro" error={errors.neighborhood?.message} {...register("neighborhood")} />
      <Select label="Tipo" error={errors.participantType?.message} {...register("participantType")}>
        <option value="member">Membro</option>
        {allowVisitors && <option value="visitor">Visitante</option>}
        <option value="leader">Líder</option>
        <option value="assistant">Auxiliar</option>
        <option value="child">Criança</option>
        <option value="teenager">Adolescente</option>
      </Select>
      <Select label="Status" error={errors.status?.message} {...register("status")}>
        <option value="active">Ativo</option>
        <option value="inactive">Inativo</option>
        <option value="away">Acompanhamento</option>
        <option value="transferred">Transferido</option>
      </Select>
      <Input label="Quem convidou" error={errors.invitedBy?.message} {...register("invitedBy")} />
      <Input label="Primeira visita" type="date" error={errors.firstVisitAt?.message} {...register("firstVisitAt")} />
      <TextArea label="Observações" error={errors.notes?.message} {...register("notes")} />
      {message && <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800 sm:col-span-2">{message}</p>}
      <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white sm:col-span-2" disabled={isSubmitting} type="submit">
        {isSubmitting ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
        {isEditing ? "Salvar alterações" : defaultType === "visitor" ? "Salvar visitante" : "Salvar integrante"}
      </button>
    </form>
  );
}

export function MeetingForm({ cell, lastMeeting }: { cell: Cell; lastMeeting?: Meeting }) {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      meetingDate: new Date().toISOString().slice(0, 10),
      startTime: cell.startTime || "19:30",
      address: cell.address,
      status: "scheduled",
    },
  });

  function duplicateLast() {
    if (!lastMeeting) return;
    reset({
      meetingDate: new Date().toISOString().slice(0, 10),
      startTime: lastMeeting.startTime,
      endTime: lastMeeting.endTime,
      theme: lastMeeting.theme,
      description: lastMeeting.description,
      address: lastMeeting.address,
      status: "scheduled",
      notes: lastMeeting.notes,
    });
  }

  async function onSubmit(values: MeetingFormValues) {
    setMessage(null);
    const supabase = createBrowserSupabaseClient();
    const payload = {
      cell_id: cell.id,
      meeting_date: values.meetingDate,
      start_time: values.startTime,
      end_time: values.endTime || null,
      theme: values.theme,
      description: values.description || null,
      address: values.address,
      status: values.status,
      notes: values.notes || null,
    };

    if (supabase) {
      const { error } = await supabase.from("meetings").insert(payload);
      if (error) {
        setMessage(error.message);
        return;
      }
    }

    setMessage("Encontro salvo com sucesso.");
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-100 bg-white px-4 text-sm font-semibold text-blue-700 sm:col-span-2" type="button" onClick={duplicateLast}>
        <Plus aria-hidden className="h-4 w-4" />
        Duplicar último encontro
      </button>
      <Input label="Data" type="date" error={errors.meetingDate?.message} {...register("meetingDate")} />
      <Input label="Horário inicial" type="time" error={errors.startTime?.message} {...register("startTime")} />
      <Input label="Horário final" type="time" error={errors.endTime?.message} {...register("endTime")} />
      <Select label="Status" error={errors.status?.message} {...register("status")}>
        <option value="scheduled">Agendado</option>
        <option value="in_progress">Em andamento</option>
        <option value="finalized">Finalizado</option>
        <option value="cancelled">Cancelado</option>
      </Select>
      <Input label="Tema" error={errors.theme?.message} {...register("theme")} />
      <Input label="Endereço" error={errors.address?.message} {...register("address")} />
      <TextArea label="Descrição" error={errors.description?.message} {...register("description")} />
      <TextArea label="Observação" error={errors.notes?.message} {...register("notes")} />
      {message && <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800 sm:col-span-2">{message}</p>}
      <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white sm:col-span-2" disabled={isSubmitting} type="submit">
        {isSubmitting ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
        Salvar encontro
      </button>
    </form>
  );
}

export function AdminUserForm({
  cell,
  groups,
  participants,
  profile,
  onSaved,
}: {
  cell: Cell;
  groups: CellGroup[];
  participants: Participant[];
  profile?: Profile;
  onSaved?: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const isEditing = Boolean(profile);
  const schema = useMemo(() => (isEditing ? adminUserUpdateSchema : adminUserSchema), [isEditing]);
  const defaultValues = useMemo(
    () => ({
      fullName: profile?.fullName ?? "",
      email: profile?.email ?? "",
      phone: profile?.phone ?? "",
      password: "",
      role: profile?.role ?? "leader",
      active: profile?.active ?? true,
      cellId: cell.id,
      groupId: profile?.groupId ?? "",
      participantId: profile?.participantId ?? "",
    }),
    [cell.id, profile],
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AdminUserValues | AdminUserUpdateValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  async function onSubmit(values: AdminUserValues | AdminUserUpdateValues) {
    setMessage(null);
    const response = await fetch("/api/admin/users", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEditing ? { ...values, id: profile?.id } : values),
    });
    const result = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "Não foi possível criar o usuário.");
      return;
    }
    setMessage(result.message ?? "Usuário criado com sucesso.");
    if (isEditing) {
      onSaved?.();
      return;
    }
    reset({ role: "leader", active: true, cellId: cell.id });
    onSaved?.();
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <Input label="Nome completo" error={errors.fullName?.message} {...register("fullName")} />
      <Input label="E-mail" type="email" error={errors.email?.message} {...register("email")} />
      <Input label="Telefone" error={errors.phone?.message} {...register("phone")} />
      <Input label={isEditing ? "Nova senha (opcional)" : "Senha temporária"} type="password" error={errors.password?.message} {...register("password")} />
      <Select label="Perfil" error={errors.role?.message} {...register("role")}>
        <option value="leader">Líder</option>
        <option value="assistant">Auxiliar</option>
        <option value="viewer">Visualização</option>
        <option value="admin">Administrador</option>
      </Select>
      <Select label="Grupo do líder" error={errors.groupId?.message} {...register("groupId")}>
        <option value="">Acesso geral da célula</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>{group.name}</option>
        ))}
      </Select>
      <Select label="Integrante vinculado" error={errors.participantId?.message} {...register("participantId")}>
        <option value="">Sem vínculo</option>
        {participants
          .filter((participant) => participant.participantType !== "visitor")
          .map((participant) => (
            <option key={participant.id} value={participant.id}>{participant.fullName}</option>
          ))}
      </Select>
      <input type="hidden" {...register("cellId")} value={cell.id} />
      <label className="flex min-h-11 items-center gap-3 pt-7 text-sm text-slate-700">
        <input className="h-4 w-4 rounded border-slate-300 text-blue-600" type="checkbox" {...register("active")} />
        Usuário ativo
      </label>
      {message && <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800 sm:col-span-2">{message}</p>}
      <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white sm:col-span-2" disabled={isSubmitting} type="submit">
        {isSubmitting ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
        {isEditing ? "Salvar usuário" : "Criar usuário"}
      </button>
    </form>
  );
}
