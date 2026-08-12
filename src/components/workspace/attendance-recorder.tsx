"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Plus, RotateCcw, Save, Search, WifiOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AttendanceButton,
  AttendanceSummary,
  ConfirmDialog,
  FormModal,
  ParticipantAvatar,
  RoleBadge,
} from "./ui";
import { visitorQuickSchema, type VisitorQuickValues } from "@/lib/schemas";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { AttendanceStatus, Participant, WorkspaceData } from "@/lib/types";
import { attendanceStatusLabels, cn, formatDate } from "@/lib/utils";

type Draft = Record<string, AttendanceStatus>;

const statuses: AttendanceStatus[] = ["present", "absent", "justified", "not_informed"];

export function AttendanceRecorder({
  data,
  meetingId,
}: {
  data: WorkspaceData;
  meetingId: string;
}) {
  const searchParams = useSearchParams();
  const meeting = data.meetings.find((item) => item.id === meetingId) ?? data.meetings[0];
  const forcedGroupId = data.currentUser.groupId && data.currentUser.role !== "admin"
    ? data.currentUser.groupId
    : undefined;
  const requestedGroupId = searchParams.get("grupo") ?? "all";
  const [selectedGroupId, setSelectedGroupId] = useState(forcedGroupId ?? requestedGroupId);
  const storageKey = `wifi-attendance-${meeting?.id ?? "draft"}`;
  const [draft, setDraft] = useState<Draft>(() => {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Draft) : {};
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "members" | "visitors">("all");
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [unsynced, setUnsynced] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [visitorOpen, setVisitorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [extraVisitors, setExtraVisitors] = useState<Participant[]>([]);
  const activeGroupId = forcedGroupId ?? selectedGroupId;
  const activeGroup = data.groups.find((group) => group.id === activeGroupId);
  const canAddVisitors = !forcedGroupId && data.currentUser.role !== "viewer";
  const visibleGroups = forcedGroupId
    ? data.groups.filter((group) => group.id === forcedGroupId)
    : data.groups;

  const meetingParticipants = useMemo(
    () =>
      [...data.participants, ...extraVisitors].filter((participant) => {
        if (!participant.active) return false;
        if (activeGroupId !== "all" && participant.groupId !== activeGroupId) return false;
        if (filter === "members" && participant.participantType === "visitor") return false;
        if (filter === "visitors" && participant.participantType !== "visitor") return false;
        return participant.fullName.toLowerCase().includes(query.toLowerCase());
      }),
    [activeGroupId, data.participants, extraVisitors, filter, query],
  );

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      setToast("Conexão restabelecida. Revise e sincronize a chamada.");
    }
    function handleOffline() {
      setOnline(false);
      setToast("Você está offline. A chamada será salva neste dispositivo.");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [storageKey]);

  const counts = countDraft(meetingParticipants, draft);
  const marked = meetingParticipants.filter((participant) => draft[participant.id]).length;

  function updateStatus(participantId: string, status: AttendanceStatus) {
    setDraft((current) => {
      const next = { ...current, [participantId]: status };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
    setUnsynced(true);
  }

  function markAllPresent() {
    const next = Object.fromEntries(meetingParticipants.map((participant) => [participant.id, participant.participantType === "visitor" ? "visitor_present" : "present"])) as Draft;
    setDraft(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setUnsynced(true);
  }

  function clearDraft() {
    setDraft({});
    localStorage.removeItem(storageKey);
    setUnsynced(false);
  }

  function savePartial() {
    localStorage.setItem(storageKey, JSON.stringify(draft));
    setUnsynced(true);
    setToast("Chamada salva parcialmente neste dispositivo.");
  }

  async function finalizeAttendance() {
    setSaving(true);
    const supabase = createBrowserSupabaseClient();
    const allowedParticipantIds = new Set(meetingParticipants.map((participant) => participant.id));
    const rows = Object.entries(draft)
      .filter(([participantId]) => allowedParticipantIds.has(participantId))
      .map(([participantId, status]) => ({
        meeting_id: meeting.id,
        participant_id: participantId,
        status,
        registered_by: data.currentUser.id,
      }));

    if (supabase && online && rows.length) {
      const { error } = await supabase.from("attendance").upsert(rows, {
        onConflict: "meeting_id,participant_id",
      });
      if (error) {
        setToast(error.message);
        setSaving(false);
        return;
      }

      if (!forcedGroupId && activeGroupId === "all") {
        await supabase
          .from("meetings")
          .update({
            status: "finalized",
            finalized_by: data.currentUser.id,
            finalized_at: new Date().toISOString(),
          })
          .eq("id", meeting.id);
      }
    }

    localStorage.removeItem(storageKey);
    setUnsynced(false);
    setConfirmOpen(false);
    setSaving(false);
    setToast(activeGroup ? "Chamada do grupo salva com sucesso." : "Lista de presença finalizada.");
  }

  if (!meeting) {
    return <p className="text-sm text-slate-600">Encontro não encontrado.</p>;
  }

  return (
    <>
      <div className="mb-5 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 p-5 text-white shadow-xl shadow-blue-950/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-50">
              {activeGroup ? `Chamada do ${activeGroup.name}` : `Chamada da célula ${data.cell.name}`}
            </p>
            <h1 className="mt-2 text-2xl font-semibold">{meeting.theme}</h1>
            <p className="mt-2 text-sm text-blue-50">
              {formatDate(meeting.meetingDate, "dd/MM/yyyy")} às {meeting.startTime}
            </p>
          </div>
          <div className="rounded-lg bg-white/14 p-4">
            <p className="text-3xl font-semibold">{marked} de {meetingParticipants.length}</p>
            <p className="text-sm text-blue-50">participantes marcados</p>
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.round((marked / Math.max(1, meetingParticipants.length)) * 100)}%` }} />
        </div>
      </div>

      <section className="card mb-5 p-4">
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-[minmax(220px,1fr)_170px_190px_auto_auto_auto]">
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 text-sm">
            <Search aria-hidden className="h-4 w-4 text-slate-400" />
            <span className="sr-only">Pesquisar participante</span>
            <input className="min-w-0 flex-1" placeholder="Pesquisar participante" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <select className="h-11 rounded-lg border border-blue-100 bg-white px-3 text-sm" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
            <option value="all">Todos</option>
            <option value="members">Membros</option>
            {canAddVisitors && <option value="visitors">Visitantes</option>}
          </select>
          <select
            className="h-11 rounded-lg border border-blue-100 bg-white px-3 text-sm disabled:bg-slate-50 disabled:text-slate-500"
            disabled={Boolean(forcedGroupId)}
            value={activeGroupId}
            onChange={(event) => setSelectedGroupId(event.target.value)}
          >
            {!forcedGroupId && <option value="all">Todos os grupos</option>}
            {visibleGroups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
          <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700" type="button" onClick={markAllPresent}>
            <Plus aria-hidden className="h-4 w-4" />
            Todos presentes
          </button>
          <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700" type="button" onClick={clearDraft}>
            <RotateCcw aria-hidden className="h-4 w-4" />
            Limpar
          </button>
          {canAddVisitors && (
            <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-100 bg-cyan-50 px-3 text-sm font-semibold text-cyan-700" type="button" onClick={() => setVisitorOpen(true)}>
              <Plus aria-hidden className="h-4 w-4" />
              Adicionar visitante
            </button>
          )}
        </div>
      </section>

      <div className="mb-5 grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-3">
          {meetingParticipants.map((participant) => (
            <article key={participant.id} className="card overflow-hidden p-4">
              <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <ParticipantAvatar participant={participant} />
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-slate-950">{participant.fullName}</h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <RoleBadge type={participant.participantType} />
                      {participant.groupId && (
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {data.groups.find((group) => group.id === participant.groupId)?.name ?? "Grupo"}
                        </span>
                      )}
                      <span className={cn("rounded-md px-2 py-1 text-xs font-medium", draft[participant.id] ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500")}>
                        {draft[participant.id] ? attendanceStatusLabels[draft[participant.id]] : "Não informado"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 2xl:flex-[0_1_520px]">
                  {statuses.map((status) => (
                    <AttendanceButton key={status} active={draft[participant.id] === status} status={status} onClick={() => updateStatus(participant.id, status)} />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="space-y-4">
          <section className="card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-950">Resumo</h2>
              <span className={cn("inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium", online ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
                {!online && <WifiOff aria-hidden className="h-4 w-4" />}
                {online ? "Online" : "Offline"}
              </span>
            </div>
            <AttendanceSummary counts={counts} />
            {unsynced && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Existem alterações não sincronizadas.</p>}
          </section>
          {toast && <p className="rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm text-blue-800">{toast}</p>}
          <div className="sticky bottom-24 grid gap-2 2xl:bottom-4">
            <button className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blue-100 bg-white text-sm font-semibold text-blue-700" type="button" onClick={savePartial}>
              <Save aria-hidden className="h-4 w-4" />
              Salvar parcialmente
            </button>
            <button className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/20" type="button" onClick={() => setConfirmOpen(true)}>
              <Check aria-hidden className="h-4 w-4" />
              Finalizar chamada
            </button>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        busy={saving}
        confirmLabel={activeGroup ? "Salvar grupo" : "Finalizar"}
        description={`Presentes: ${counts.present + counts.visitor_present}. Faltas: ${counts.absent}. Justificadas: ${counts.justified}. Não informados: ${counts.not_informed}.`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={finalizeAttendance}
        open={confirmOpen}
        title="Deseja finalizar a lista de presença?"
      />

      <VisitorModal
        cellId={data.cell.id}
        onAdd={(visitor) => {
          setExtraVisitors((current) => [...current, visitor]);
          setDraft((current) => ({ ...current, [visitor.id]: "visitor_present" }));
          setUnsynced(true);
          setVisitorOpen(false);
        }}
        onClose={() => setVisitorOpen(false)}
        open={visitorOpen}
      />
    </>
  );
}

function VisitorModal({
  open,
  onClose,
  onAdd,
  cellId,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (participant: Participant) => void;
  cellId: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VisitorQuickValues>({
    resolver: zodResolver(visitorQuickSchema),
    defaultValues: { firstVisitAt: new Date().toISOString().slice(0, 10), wantsReturn: true },
  });
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(values: VisitorQuickValues) {
    setMessage(null);
    const supabase = createBrowserSupabaseClient();
    const visitor: Participant = {
      id: `visitor-${values.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${values.firstVisitAt}`,
      cellId,
      fullName: values.fullName,
      preferredName: values.fullName.split(" ")[0],
      whatsapp: values.whatsapp,
      joinedAt: values.firstVisitAt,
      participantType: "visitor",
      status: "active",
      invitedBy: values.invitedBy,
      firstVisitAt: values.firstVisitAt,
      notes: values.notes,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase
        .from("participants")
        .insert({
          cell_id: cellId,
          full_name: values.fullName,
          preferred_name: values.fullName.split(" ")[0],
          whatsapp: values.whatsapp || null,
          joined_at: values.firstVisitAt,
          participant_type: "visitor",
          status: "active",
          invited_by: values.invitedBy || null,
          first_visit_at: values.firstVisitAt,
          notes: values.notes || null,
          active: true,
        })
        .select("*")
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      visitor.id = String(data.id);
    }

    onAdd(visitor);
  }

  return (
    <FormModal onClose={onClose} open={open} title="Adicionar visitante">
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Nome</span>
          <input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" {...register("fullName")} />
          {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">WhatsApp</span>
          <input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" {...register("whatsapp")} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Quem convidou</span>
          <input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" {...register("invitedBy")} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Primeira visita</span>
          <input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" type="date" {...register("firstVisitAt")} />
        </label>
        <label className="flex min-h-11 items-center gap-3 pt-7 text-sm text-slate-700">
          <input className="h-4 w-4 rounded border-slate-300 text-blue-600" type="checkbox" {...register("wantsReturn")} />
          Interesse em continuar
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Observação</span>
          <textarea className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("notes")} />
        </label>
        {message && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:col-span-2">{message}</p>}
        <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white sm:col-span-2" disabled={isSubmitting} type="submit">
          {isSubmitting ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Plus aria-hidden className="h-4 w-4" />}
          Adicionar visitante
        </button>
      </form>
    </FormModal>
  );
}

function countDraft(participants: Participant[], draft: Draft) {
  const counts: Record<AttendanceStatus, number> = {
    present: 0,
    absent: 0,
    justified: 0,
    visitor_present: 0,
    not_informed: 0,
  };
  participants.forEach((participant) => {
    const status = draft[participant.id] ?? "not_informed";
    counts[status] += 1;
  });
  return counts;
}
