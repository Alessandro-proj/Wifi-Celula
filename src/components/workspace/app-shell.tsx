"use client";

import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  Cake,
  Check,
  ClipboardList,
  Edit3,
  Eye,
  Filter,
  HeartHandshake,
  Home,
  MoreVertical,
  Network,
  Plus,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  UserCog,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MonthlyAttendanceChart, WeeklyPresenceChart } from "./charts";
import { AdminUserForm, MeetingForm, ParticipantForm } from "./forms";
import {
  AppHeader,
  AttendanceSummary,
  BirthdayCard,
  ChartCard,
  EmptyState,
  ExportButton,
  FrequencyBadge,
  FormModal,
  LoadingSkeleton,
  MobileSidebar,
  NotificationItem,
  PageTitle,
  ParticipantAvatar,
  PermissionPanel,
  RoleBadge,
  SearchInput,
  SectionHeader,
  Sidebar,
  StatCard,
  StatusBadge,
  type NavItem,
} from "./ui";
import { AttendanceRecorder } from "./attendance-recorder";
import { canAccessRoute, canDeleteMeetings, canManageCells, canManageParticipants, canManageUsers } from "@/lib/permissions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useWorkspaceData } from "@/lib/use-workspace-data";
import {
  attendanceStatusLabels,
  formatDate,
  formatToday,
  greeting,
  meetingStatusLabels,
  participantStatusLabels,
  participantTypeLabels,
  roleLabels,
} from "@/lib/utils";
import type { Attendance, AttendanceStatus, Meeting, Participant, Profile, WorkspaceData } from "@/lib/types";

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/encontros", label: "Encontros", icon: CalendarDays },
  { href: "/encontros", label: "Registrar presença", icon: Check },
  { href: "/integrantes", label: "Integrantes", icon: UsersRound },
  { href: "/grupos", label: "Grupos", icon: Network },
  { href: "/visitantes", label: "Visitantes", icon: HeartHandshake },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/aniversariantes", label: "Aniversariantes", icon: Cake },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
  { href: "/admin/usuarios", label: "Usuários", icon: UserCog, admin: true },
  { href: "/admin/auditoria", label: "Auditoria", icon: ShieldCheck, admin: true },
  { href: "/admin/celulas", label: "Células", icon: Activity, admin: true },
];

export function AppShell({ segments }: { segments: string[] }) {
  const route = `/${segments.join("/") || "dashboard"}`;
  const { data, source, loading, error, reload } = useWorkspaceData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const unread = data.notifications.filter((notification) => !notification.read).length;
  const meetingForAttendance = activeMeeting(data);
  const attendanceHref = meetingForAttendance
    ? `/encontros/${meetingForAttendance.id}/presenca`
    : "/encontros";
  const workspaceNavItems = useMemo(
    () =>
      navItems.map((item) =>
        item.label === "Registrar presença" ? { ...item, href: attendanceHref } : item,
      ),
    [attendanceHref],
  );
  const currentUserName = displayUserName(data.currentUser);

  const content = useMemo(() => {
    if (!canAccessRoute(data.currentUser.role, route)) return <PermissionPanel />;
    return renderRoute(route, data, reload);
  }, [data, reload, route]);

  return (
    <div className="page-shell flex min-h-screen">
      <Sidebar
        activePath={route}
        items={workspaceNavItems}
        onClose={() => setDesktopSidebarOpen(false)}
        open={desktopSidebarOpen}
        role={data.currentUser.role}
        userName={currentUserName}
      />
      <div className="min-w-0 flex-1">
        <AppHeader
          cellName={data.cell.name}
          desktopSidebarOpen={desktopSidebarOpen}
          greetingText={greeting()}
          today={formatToday()}
          unread={unread}
          userName={currentUserName}
          attendanceHref={attendanceHref}
          onDesktopSidebarToggle={() => setDesktopSidebarOpen((open) => !open)}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="px-4 py-5 pb-8 sm:px-5 lg:px-6 2xl:px-8 2xl:py-6">
          {source === "demo" && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span>
                <strong>Modo de desenvolvimento ativo.</strong><br />
                Configure o Supabase para usar dados reais com RLS.
              </span>
              <span className="text-lg leading-none">×</span>
            </div>
          )}
          {error && (
            <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {error}
            </div>
          )}
          {loading ? <LoadingSkeleton /> : content}
        </main>
      </div>
      <MobileSidebar
        activePath={route}
        items={workspaceNavItems}
        onClose={() => setSidebarOpen(false)}
        open={sidebarOpen}
        role={data.currentUser.role}
        userName={currentUserName}
      />
    </div>
  );
}

function displayUserName(user: WorkspaceData["currentUser"]) {
  const fullName = user.fullName.trim();
  if (fullName) return fullName;
  return user.email.split("@")[0] || "UsuÃ¡rio";
}

function renderRoute(route: string, data: WorkspaceData, onDataChanged: () => void) {
  if (route === "/dashboard") return <DashboardView data={data} />;
  if (route === "/encontros") return <MeetingsView data={data} onDataChanged={onDataChanged} />;
  if (route === "/encontros/novo") return <MeetingFormView data={data} />;
  if (route.startsWith("/encontros/") && route.endsWith("/presenca")) {
    const meetingId = route.split("/")[2];
    return <AttendanceRecorder key={meetingId} data={data} meetingId={meetingId} />;
  }
  if (route.startsWith("/encontros/")) {
    const meetingId = route.split("/")[2];
    return <MeetingDetailView data={data} meetingId={meetingId} onDataChanged={onDataChanged} />;
  }
  if (route === "/integrantes") return <ParticipantsView data={data} onDataChanged={onDataChanged} />;
  if (route === "/integrantes/novo") return <ParticipantFormView data={data} onDataChanged={onDataChanged} />;
  if (route.startsWith("/integrantes/")) {
    const participantId = route.split("/")[2];
    return <ParticipantDetailView data={data} onDataChanged={onDataChanged} participantId={participantId} />;
  }
  if (route === "/grupos") return <GroupsView data={data} />;
  if (route === "/visitantes") return <VisitorsView data={data} onDataChanged={onDataChanged} />;
  if (route === "/relatorios") return <ReportsView data={data} />;
  if (route === "/aniversariantes") return <BirthdaysView data={data} />;
  if (route === "/notificacoes") return <NotificationsView data={data} />;
  if (route === "/configuracoes") return <SettingsView data={data} />;
  if (route === "/admin/celulas") return <CellsAdminView data={data} />;
  if (route === "/admin/usuarios") return <UsersAdminView data={data} onDataChanged={onDataChanged} />;
  if (route === "/admin/auditoria") return <AuditView data={data} />;
  return (
    <EmptyState
      title="Página não encontrada"
      description="O endereço informado não corresponde a uma tela do sistema."
      action={<Link className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white" href="/dashboard">Voltar ao início</Link>}
    />
  );
}

function DashboardView({ data }: { data: WorkspaceData }) {
  const metrics = getMetrics(data);
  const sorted = sortedMeetings(data);
  const nextMeeting = sorted.find((meeting) => meeting.status === "scheduled") ?? sorted[0];
  const attention = getAttentionList(data);
  const birthdays = getBirthdays(data.participants).month.slice(0, 4);

  return (
    <>
      <PageTitle
        icon={Home}
        title="Que bom ter você por aqui!"
        subtitle="Resumo da presença, crescimento, visitantes e pessoas para acompanhar de perto."
        action={<Link className="flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20" href={nextMeeting ? `/encontros/${nextMeeting.id}/presenca` : "/encontros"}><Check aria-hidden className="h-4 w-4" />Registrar presença</Link>}
      />

      <div className="mb-5 flex items-start justify-between gap-4 rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
        <span>
          <strong>Bem-vindo ao WiFi Célula!</strong> Comece registrando a presença do último encontro.
        </span>
        <span className="text-lg leading-none">×</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard icon={UsersRound} label="Integrantes ativos" value={metrics.activeParticipants} hint="+2 este mês" tone="violet" />
        <StatCard icon={HeartHandshake} label="Visitantes no mês" value={metrics.monthVisitors} hint="+1 este mês" tone="green" />
        <StatCard icon={Check} label="Presentes no último encontro" value={metrics.lastPresent} hint="86% do total" tone="blue" />
        <StatCard icon={ClipboardList} label="Faltas no último encontro" value={metrics.lastAbsent} hint="14% do total" tone="rose" />
        <StatCard icon={CalendarDays} label="Encontros no mês" value={metrics.monthMeetings} hint="Realizados" tone="amber" />
        <StatCard icon={BarChart3} label="Média mensal" value={`${metrics.monthFrequency}%`} hint="Frequência" tone="violet" />
        <StatCard icon={HeartHandshake} label="Pessoas para acompanhar" value={attention.length} hint="Ver lista" tone="rose" />
        <StatCard icon={UserPlus} label="Novos integrantes" value="2" hint="Este mês" tone="cyan" />
      </div>

      <div className="mt-5 grid gap-5 2xl:grid-cols-[0.9fr_1.1fr]">
        <section className="card bg-gradient-to-br from-blue-600 to-cyan-500 p-5 text-white">
          <p className="text-sm font-medium text-blue-50">Próximo encontro</p>
          <h2 className="mt-2 text-2xl font-semibold">{nextMeeting?.theme ?? "Sem encontro agendado"}</h2>
          {nextMeeting && (
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Data" value={formatDate(nextMeeting.meetingDate, "dd/MM/yyyy")} />
              <Info label="Horário" value={nextMeeting.startTime} />
              <Info label="Endereço" value={nextMeeting.address} />
              <Info label="Responsável" value={profileName(data, nextMeeting.responsibleUserId)} />
              <Info label="Esperados" value={`${metrics.activeParticipants + 2} participantes`} />
            </dl>
          )}
          <Link className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-blue-700" href={nextMeeting ? `/encontros/${nextMeeting.id}/presenca` : "/encontros"}>
            <Check aria-hidden className="h-4 w-4" />
            Registrar presença
          </Link>
        </section>

        <ChartCard title="Presença por semana">
          <WeeklyPresenceChart data={weeklySeries(data)} />
        </ChartCard>
      </div>

      <div className="mt-5 grid gap-5 2xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard title="Presentes, faltas e visitantes">
          <MonthlyAttendanceChart data={weeklySeries(data)} />
        </ChartCard>
        <section className="card p-4">
          <SectionHeader icon={HeartHandshake} title="Pessoas para acompanhar de perto" />
          <div className="space-y-3">
            {attention.map((item) => (
              <div key={item.participant.id} className="flex items-center gap-3 rounded-lg border border-blue-100 bg-white p-3">
                <ParticipantAvatar participant={item.participant} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950">{item.participant.fullName}</p>
                  <p className="text-xs text-slate-500">{item.reason}</p>
                </div>
                <FrequencyBadge value={item.frequency} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card mt-5 p-4">
        <SectionHeader icon={Cake} title="Aniversariantes do mês" />
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {birthdays.map((participant) => <BirthdayCard key={participant.id} participant={participant} />)}
        </div>
      </section>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-blue-100">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function MeetingsView({
  data,
  onDataChanged,
}: {
  data: WorkspaceData;
  onDataChanged: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | Meeting["status"]>("all");
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const userCanDeleteMeetings = canDeleteMeetings(data.currentUser.role);
  const meetings = sortedMeetings(data).filter((meeting) => statusFilter === "all" || meeting.status === statusFilter);

  async function handleDeleteMeeting(meeting: Meeting) {
    if (!userCanDeleteMeetings || deletingMeetingId) return;
    const confirmed = window.confirm(`Excluir o encontro "${meeting.theme}"? As presenças vinculadas também serão apagadas.`);
    if (!confirmed) return;

    setDeleteMessage(null);
    setDeletingMeetingId(meeting.id);
    try {
      await deleteMeetingRecord(meeting.id);
      setDeleteMessage("Encontro excluído com sucesso.");
      onDataChanged();
    } catch (error) {
      setDeleteMessage(getMeetingDeleteError(error));
    } finally {
      setDeletingMeetingId(null);
    }
  }

  return (
    <>
      <PageTitle
        icon={CalendarDays}
        title="Encontros"
        subtitle="Agende, acompanhe e finalize os encontros semanais."
        action={<Link className="flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20" href="/encontros/novo"><Plus aria-hidden className="h-4 w-4" />Novo encontro</Link>}
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ["all", "Todos"],
          ["scheduled", "Agendados"],
          ["in_progress", "Em andamento"],
          ["finalized", "Finalizados"],
          ["cancelled", "Cancelados"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={`min-h-10 rounded-lg border px-4 text-sm font-semibold transition ${statusFilter === value ? "border-violet-300 bg-violet-50 text-violet-700" : "border-blue-100 bg-white text-slate-700 hover:bg-blue-50"}`}
            onClick={() => setStatusFilter(value as "all" | Meeting["status"])}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      {deleteMessage && (
        <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
          {deleteMessage}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {meetings.map((meeting) => {
          const tone = meetingTone(meeting.status);
          return (
          <section key={meeting.id} className={`card border-t-4 p-4 ${tone.border}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone.icon}`}>
                  <CalendarDays aria-hidden className="h-4 w-4" />
                </span>
                <p className="text-base font-semibold text-slate-950">{meeting.theme}</p>
                <p className="mt-2 text-sm text-slate-600">{formatDate(meeting.meetingDate, "dd/MM/yyyy")} às {meeting.startTime}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className={`rounded-md px-2 py-1 text-xs font-medium ${tone.badge}`}>
                  {meetingStatusLabels[meeting.status]}
                </span>
                {userCanDeleteMeetings && (
                  <button
                    aria-label={`Excluir ${meeting.theme}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deletingMeetingId === meeting.id}
                    onClick={() => handleDeleteMeeting(meeting)}
                    title="Excluir encontro"
                    type="button"
                  >
                    {deletingMeetingId === meeting.id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600" />
                    ) : (
                      <Trash2 aria-hidden className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{meeting.description}</p>
            <p className="mt-4 text-sm text-slate-600">{meeting.address}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link className="min-h-10 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-blue-700" href={`/encontros/${meeting.id}`}>Detalhes</Link>
              <Link className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold text-white ${tone.button}`} href={`/encontros/${meeting.id}/presenca`}>Presença</Link>
            </div>
          </section>
          );
        })}
      </div>
    </>
  );
}

function MeetingFormView({ data }: { data: WorkspaceData }) {
  return (
    <>
      <PageTitle icon={CalendarDays} title="Novo encontro" subtitle="Agende um novo encontro para sua célula." />
      <section className="card p-5">
        <MeetingForm cell={data.cell} lastMeeting={latestCompletedMeeting(data)} />
      </section>
    </>
  );
}

function MeetingDetailView({
  data,
  meetingId,
  onDataChanged,
}: {
  data: WorkspaceData;
  meetingId: string;
  onDataChanged: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const meeting = data.meetings.find((item) => item.id === meetingId) ?? data.meetings[0];
  const userCanDeleteMeetings = canDeleteMeetings(data.currentUser.role);

  if (!meeting) {
    return (
      <EmptyState
        title="Encontro não encontrado"
        description="Cadastre um novo encontro para começar a registrar presenças."
      />
    );
  }
  const counts = countAttendance(data.attendance.filter((item) => item.meetingId === meeting.id));

  async function handleDeleteMeeting() {
    if (!userCanDeleteMeetings || deleting || !meeting) return;
    const confirmed = window.confirm(`Excluir o encontro "${meeting.theme}"? As presenças vinculadas também serão apagadas.`);
    if (!confirmed) return;

    setDeleteMessage(null);
    setDeleting(true);
    try {
      await deleteMeetingRecord(meeting.id);
      onDataChanged();
      router.push("/encontros");
    } catch (error) {
      setDeleteMessage(getMeetingDeleteError(error));
      setDeleting(false);
    }
  }

  return (
    <>
      <PageTitle
        icon={CalendarDays}
        title={meeting.theme}
        subtitle={`${formatDate(meeting.meetingDate, "dd/MM/yyyy")} às ${meeting.startTime} - ${meeting.address}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link className="flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white" href={`/encontros/${meeting.id}/presenca`}>
              <Check aria-hidden className="h-4 w-4" />
              Abrir chamada
            </Link>
            {userCanDeleteMeetings && (
              <button
                className="flex min-h-11 items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deleting}
                onClick={handleDeleteMeeting}
                type="button"
              >
                {deleting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600" />
                ) : (
                  <Trash2 aria-hidden className="h-4 w-4" />
                )}
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            )}
          </div>
        }
      />
      {deleteMessage && (
        <div className="mb-5 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {deleteMessage}
        </div>
      )}
      <div className="grid gap-5 2xl:grid-cols-[0.75fr_1.25fr]">
        <section className="card p-5">
          <SectionHeader icon={CalendarDays} title="Resumo do encontro" />
          <dl className="space-y-3 text-sm">
            <Row label="Status" value={meetingStatusLabels[meeting.status]} />
            <Row label="Horário final" value={meeting.endTime ?? "Aberto"} />
            <Row label="Responsável" value={profileName(data, meeting.responsibleUserId)} />
            <Row label="Observação" value={meeting.notes || "Sem observações"} />
          </dl>
        </section>
        <section className="card p-5">
          <SectionHeader icon={ClipboardList} title="Resumo da chamada" />
          <AttendanceSummary counts={counts} />
        </section>
      </div>
    </>
  );
}

function ParticipantsView({
  data,
  onDataChanged,
}: {
  data: WorkspaceData;
  onDataChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [group, setGroup] = useState("all");
  const [status, setStatus] = useState("all");
  const [birthdayFilter, setBirthdayFilter] = useState("all");
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const canEdit = canManageParticipants(data.currentUser.role);
  const scopedParticipants = visibleParticipants(data);
  const visibleGroups = groupsForUser(data);
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  const people = scopedParticipants.filter((participant) => participant.participantType !== "visitor");
  const activePeople = people.filter((participant) => participant.active);
  const leaders = people.filter((participant) => participant.participantType === "leader").length;
  const assistants = people.filter((participant) => participant.participantType === "assistant").length;
  const members = people.filter((participant) => participant.participantType === "member").length;
  const youngPeople = people.filter((participant) => ["child", "teenager"].includes(participant.participantType)).length;
  const filtered = scopedParticipants.filter((participant) => {
    if (participant.participantType === "visitor") return false;
    const matchesQuery = [participant.fullName, participant.phone, participant.whatsapp]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesType = type === "all" || participant.participantType === type;
    const matchesGroup = group === "all" || participant.groupId === group;
    const matchesStatus = status === "all" || participant.status === status;
    const matchesBirthday =
      birthdayFilter === "all" ||
      (birthdayFilter === "month" && participant.birthDate?.slice(5, 7) === currentMonth) ||
      (birthdayFilter === "without" && !participant.birthDate);
    return matchesQuery && matchesType && matchesGroup && matchesStatus && matchesBirthday;
  });

  return (
    <>
      <PageTitle
        icon={UsersRound}
        title="Integrantes"
        subtitle="Gerencie os membros da sua célula com carinho e organização."
        action={canEdit && <Link className="flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20" href="/integrantes/novo"><Plus aria-hidden className="h-4 w-4" />Novo integrante</Link>}
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <StatCard icon={UsersRound} label="Total de integrantes" value={people.length} hint={`${activePeople.length} ativos`} tone="violet" />
        <StatCard icon={UserPlus} label="Líderes" value={leaders} tone="green" />
        <StatCard icon={UsersRound} label="Auxiliares" value={assistants} tone="blue" />
        <StatCard icon={UsersRound} label="Membros" value={members} tone="amber" />
        <StatCard icon={UserPlus} label="Crianças / adolescentes" value={youngPeople} tone="rose" />
      </div>
      <div className="card mb-5 grid gap-3 p-4 md:grid-cols-2 2xl:grid-cols-[1fr_180px_180px_180px_180px_auto]">
        <SearchInput onChange={setQuery} placeholder="Buscar por nome ou telefone..." value={query} />
        <select className="field h-11 px-3 text-sm" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">Todos os tipos</option>
          {Object.entries(participantTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <select className="field h-11 px-3 text-sm" value={group} onChange={(event) => setGroup(event.target.value)}>
          <option value="all">Todos os grupos</option>
          {visibleGroups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="field h-11 px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Todos os status</option>
          {Object.entries(participantStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <select className="field h-11 px-3 text-sm" value={birthdayFilter} onChange={(event) => setBirthdayFilter(event.target.value)}>
          <option value="all">Aniversariantes</option>
          <option value="month">Este mês</option>
          <option value="without">Sem nascimento</option>
        </select>
        <button
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-100 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-blue-50"
          onClick={() => {
            setQuery("");
            setType("all");
            setGroup("all");
            setStatus("all");
            setBirthdayFilter("all");
          }}
          type="button"
        >
          <SlidersHorizontal aria-hidden className="h-4 w-4" />
          Limpar
        </button>
      </div>
      <div className="grid gap-3 md:hidden">
        {filtered.map((participant) => (
          <section key={participant.id} className="card p-4">
            <div className="flex items-center gap-3">
              <ParticipantAvatar participant={participant} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">{participant.fullName}</p>
                <p className="truncate text-xs text-slate-500">{participant.whatsapp ?? participant.phone ?? "Sem telefone"}</p>
              </div>
              <StatusBadge status={participant.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <RoleBadge type={participant.participantType} />
              <span className="inline-flex min-h-7 items-center rounded-md bg-slate-100 px-2 text-xs font-medium text-slate-600">{groupName(data, participant.groupId)}</span>
              {participant.age && <span className="inline-flex min-h-7 items-center rounded-md bg-cyan-50 px-2 text-xs font-medium text-cyan-700">{participant.age} anos</span>}
              <FrequencyBadge value={participantFrequency(data, participant.id)} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-blue-100 px-3 text-sm font-semibold text-blue-700" href={`/integrantes/${participant.id}`}>
                <Eye aria-hidden className="h-4 w-4" />
                Ver
              </Link>
              {canEditParticipant(data, participant) && (
                <button className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white" onClick={() => setEditingParticipant(participant)} type="button">
                  <Edit3 aria-hidden className="h-4 w-4" />
                  Editar
                </button>
              )}
            </div>
          </section>
        ))}
      </div>
      <section className="card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-blue-50 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <tr>
                <th className="px-4 py-3">Integrante</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3 text-right">AÃ§Ãµes</th>
                <th className="px-4 py-3">Idade</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Frequência</th>
                <th className="px-4 py-3">Entrada</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {filtered.map((participant) => (
                <tr key={participant.id} className="hover:bg-blue-50/50">
                  <td className="px-4 py-3">
                    <Link className="flex items-center gap-3 font-semibold text-slate-950" href={`/integrantes/${participant.id}`}>
                      <ParticipantAvatar participant={participant} size="sm" />
                      <span>
                        <span className="block">{participant.fullName}</span>
                        <span className="block text-xs font-medium text-slate-500">@{participant.preferredName.toLowerCase().replaceAll(" ", ".")}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{participant.whatsapp ?? participant.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{groupName(data, participant.groupId)}</td>
                  <td className="px-4 py-3 text-slate-600">{participant.age ? `${participant.age} anos` : "-"}</td>
                  <td className="px-4 py-3"><RoleBadge type={participant.participantType} /></td>
                  <td className="px-4 py-3"><StatusBadge status={participant.status} /></td>
                  <td className="px-4 py-3"><FrequencyBadge value={participantFrequency(data, participant.id)} /></td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(participant.joinedAt, "dd/MM/yyyy")}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 text-blue-700 hover:bg-blue-50" href={`/integrantes/${participant.id}`} aria-label={`Ver ${participant.fullName}`}>
                        <Eye aria-hidden className="h-4 w-4" />
                      </Link>
                      {canEditParticipant(data, participant) && (
                        <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 text-blue-700 hover:bg-blue-50" onClick={() => setEditingParticipant(participant)} type="button" aria-label={`Editar ${participant.fullName}`}>
                          <Edit3 aria-hidden className="h-4 w-4" />
                        </button>
                      )}
                      <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 text-slate-500 hover:bg-blue-50" type="button" aria-label="Mais ações">
                        <MoreVertical aria-hidden className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <FormModal open={Boolean(editingParticipant)} title="Editar integrante" onClose={() => setEditingParticipant(null)}>
        {editingParticipant && (
          <ParticipantForm
            cell={data.cell}
            groups={visibleGroups}
            allowVisitors={canManageVisitors(data)}
            participant={editingParticipant}
            onSaved={() => {
              setEditingParticipant(null);
              onDataChanged();
            }}
          />
        )}
      </FormModal>
    </>
  );
}

function ParticipantFormView({
  data,
  onDataChanged,
}: {
  data: WorkspaceData;
  onDataChanged: () => void;
}) {
  return (
    <>
      <PageTitle icon={UserPlus} title="Novo integrante" subtitle="Cadastre membros, visitantes, crianças, adolescentes, líderes e auxiliares." />
      <section className="card p-5">
        <ParticipantForm cell={data.cell} groups={groupsForUser(data)} allowVisitors={canManageVisitors(data)} onSaved={onDataChanged} />
      </section>
    </>
  );
}

function ParticipantDetailView({
  data,
  onDataChanged,
  participantId,
}: {
  data: WorkspaceData;
  onDataChanged: () => void;
  participantId: string;
}) {
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const participant = data.participants.find((item) => item.id === participantId) ?? data.participants[0];
  const entries = data.attendance.filter((item) => item.participantId === participant.id);
  const present = entries.filter((item) => item.status === "present" || item.status === "visitor_present").length;
  const absent = entries.filter((item) => item.status === "absent").length;
  const frequency = participantFrequency(data, participant.id);
  const canEdit = canEditParticipant(data, participant);

  return (
    <>
      <PageTitle
        icon={UsersRound}
        title={participant.fullName}
        subtitle="Histórico, frequência e observações do participante."
        action={canEdit && (
          <button className="flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20" onClick={() => setEditingParticipant(participant)} type="button">
            <Edit3 aria-hidden className="h-4 w-4" />
            Editar integrante
          </button>
        )}
      />
      <div className="grid gap-5 2xl:grid-cols-[0.75fr_1.25fr]">
        <section className="card p-5">
          <ParticipantAvatar participant={participant} size="lg" />
          <h2 className="mt-4 text-xl font-semibold text-slate-950">{participant.preferredName}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <RoleBadge type={participant.participantType} />
            <StatusBadge status={participant.status} />
            <FrequencyBadge value={frequency} />
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label="Telefone" value={participant.whatsapp ?? participant.phone ?? "-"} />
            <Row label="Grupo" value={groupName(data, participant.groupId)} />
            <Row label="Idade" value={participant.age ? `${participant.age} anos` : "-"} />
            <Row label="Entrada" value={formatDate(participant.joinedAt, "dd/MM/yyyy")} />
            <Row label="Bairro" value={participant.neighborhood ?? "-"} />
            <Row label="Observações" value={participant.notes ?? "Sem observações"} />
          </dl>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button className="min-h-10 rounded-lg border border-blue-100 px-3 text-sm font-semibold text-blue-700">Ativar</button>
            <button className="min-h-10 rounded-lg border border-amber-100 px-3 text-sm font-semibold text-amber-700">Inativar</button>
            <button className="min-h-10 rounded-lg border border-violet-100 px-3 text-sm font-semibold text-violet-700">Transferir</button>
            <button className="min-h-10 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white">Transformar em membro</button>
          </div>
        </section>
        <section className="card p-5">
          <SectionHeader icon={ClipboardList} title="Participações" />
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard icon={Check} label="Presenças" value={present} tone="green" />
            <StatCard icon={Filter} label="Faltas" value={absent} tone="rose" />
            <StatCard icon={BarChart3} label="Frequência geral" value={`${frequency}%`} tone="blue" />
          </div>
          <div className="mt-5 space-y-3">
            {entries.slice(0, 8).map((entry) => {
              const meeting = data.meetings.find((item) => item.id === entry.meetingId);
              return (
                <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-white p-3 text-sm">
                  <span className="font-medium text-slate-950">{meeting?.theme ?? "Encontro"}</span>
                  <span className="text-slate-500">{attendanceStatusLabels[entry.status]}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <FormModal open={Boolean(editingParticipant)} title="Editar integrante" onClose={() => setEditingParticipant(null)}>
        {editingParticipant && (
          <ParticipantForm
            cell={data.cell}
            groups={groupsForUser(data)}
            allowVisitors={canManageVisitors(data)}
            participant={editingParticipant}
            onSaved={() => {
              setEditingParticipant(null);
              onDataChanged();
            }}
          />
        )}
      </FormModal>
    </>
  );
}

function GroupsView({ data }: { data: WorkspaceData }) {
  const visibleGroups = groupsForUser(data);
  const meeting = activeMeeting(data);
  const totalGrouped = data.participants.filter(
    (participant) => participant.active && participant.groupId && participant.participantType !== "visitor",
  ).length;

  return (
    <>
      <PageTitle
        icon={Network}
        title="Grupos"
        subtitle="Acompanhe cada grupo, seu líder e os integrantes que podem ser marcados na presença."
        action={meeting && (
          <Link className="flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20" href={`/encontros/${meeting.id}/presenca`}>
            <Check aria-hidden className="h-4 w-4" />
            Registrar presença
          </Link>
        )}
      />

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <StatCard icon={Network} label="Grupos ativos" value={visibleGroups.length} tone="violet" />
        <StatCard icon={UsersRound} label="Integrantes em grupos" value={totalGrouped} tone="blue" />
        <StatCard icon={UserPlus} label="Líderes de grupo" value={visibleGroups.filter((group) => group.leaderParticipantId || group.leaderProfileId).length} tone="green" />
      </div>

      <div className="grid gap-5 2xl:grid-cols-3">
        {visibleGroups.map((group) => {
          const participants = data.participants
            .filter((participant) => participant.active && participant.groupId === group.id && participant.participantType !== "visitor")
            .sort((a, b) => {
              if (a.participantType === "leader" && b.participantType !== "leader") return -1;
              if (b.participantType === "leader" && a.participantType !== "leader") return 1;
              return a.fullName.localeCompare(b.fullName);
            });
          const leader =
            data.participants.find((participant) => participant.id === group.leaderParticipantId) ??
            participants.find((participant) => participant.participantType === "leader");
          const frequency = participants.length
            ? Math.round(participants.reduce((sum, participant) => sum + participantFrequency(data, participant.id), 0) / participants.length)
            : 0;

          return (
            <section key={group.id} className="card flex min-h-[420px] flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Liderado por</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">{leader?.fullName ?? "Sem líder definido"}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{group.description ?? group.name}</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Network aria-hidden className="h-6 w-6" />
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                  <p className="text-2xl font-semibold text-slate-950">{participants.length}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">integrantes</p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                  <p className="text-2xl font-semibold text-slate-950">{frequency}%</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">frequência média</p>
                </div>
              </div>

              <div className="mt-5 flex-1 space-y-2">
                {participants.map((participant) => (
                  <Link key={participant.id} className="flex items-center gap-3 rounded-lg border border-blue-100 bg-white p-3 hover:bg-blue-50/60" href={`/integrantes/${participant.id}`}>
                    <ParticipantAvatar participant={participant} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-950">{participant.fullName}</span>
                      <span className="block text-xs text-slate-500">{participant.age ? `${participant.age} anos` : participantTypeLabels[participant.participantType]}</span>
                    </span>
                    <RoleBadge type={participant.participantType} />
                  </Link>
                ))}
              </div>

              {meeting && (
                <Link className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-100 bg-white px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50" href={`/encontros/${meeting.id}/presenca?grupo=${group.id}`}>
                  <ClipboardList aria-hidden className="h-4 w-4" />
                  Chamada do grupo
                </Link>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

function VisitorsView({
  data,
  onDataChanged,
}: {
  data: WorkspaceData;
  onDataChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editingVisitor, setEditingVisitor] = useState<Participant | null>(null);
  const [creatingVisitor, setCreatingVisitor] = useState(false);
  const [visitorModalTitle, setVisitorModalTitle] = useState("Editar visitante");
  const canEdit = canManageVisitors(data);
  const visitors = data.participants.filter((participant) => participant.participantType === "visitor");
  const metrics = getMetrics(data);
  const returningVisitors = visitors.filter((visitor) => visitorVisitCount(data, visitor.id) > 1).length;
  const convertedVisitors = data.participants.filter((participant) => Boolean(participant.convertedToMemberAt)).length;
  const conversionRate = Math.round((convertedVisitors / Math.max(1, visitors.length + convertedVisitors)) * 100);
  const filtered = visitors.filter((visitor) => {
    const matchesQuery = [visitor.fullName, visitor.phone, visitor.whatsapp, visitor.invitedBy]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesStatus = status === "all" || visitor.status === status;
    return matchesQuery && matchesStatus;
  });

  return (
    <>
      <PageTitle
        icon={HeartHandshake}
        title="Visitantes"
        subtitle="Acompanhe retornos, origem do convite e conversão em integrante."
        action={canEdit && (
          <button className="flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20" onClick={() => setCreatingVisitor(true)} type="button">
            <Plus aria-hidden className="h-4 w-4" />
            Adicionar visitante
          </button>
        )}
      />
      <div className="mb-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard icon={HeartHandshake} label="Visitantes no mês" value={metrics.monthVisitors || visitors.length} hint="Total de visitas" tone="blue" />
        <StatCard icon={Check} label="Retornaram" value={returningVisitors} hint="Este mês" tone="green" />
        <StatCard icon={UserPlus} label="Converteram" value={convertedVisitors} hint="Este mês" tone="violet" />
        <StatCard icon={BarChart3} label="Taxa de conversão" value={`${conversionRate}%`} hint="Este mês" tone="amber" />
      </div>
      <div className="card mb-5 grid gap-3 p-4 md:grid-cols-2 2xl:grid-cols-[1fr_220px_auto]">
        <SearchInput onChange={setQuery} placeholder="Buscar por nome, telefone ou convite..." value={query} />
        <select className="field h-11 px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Todos os status</option>
          {Object.entries(participantStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <button
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-100 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-blue-50"
          onClick={() => {
            setQuery("");
            setStatus("all");
          }}
          type="button"
        >
          <SlidersHorizontal aria-hidden className="h-4 w-4" />
          Limpar
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {filtered.map((visitor) => {
          const visits = visitorVisitCount(data, visitor.id);
          return (
            <section key={visitor.id} className="card p-4">
              <div className="flex items-start gap-3">
                <ParticipantAvatar participant={visitor} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-slate-950">{visitor.fullName}</h2>
                  <p className="text-sm text-slate-500">{visitor.whatsapp ?? visitor.phone}</p>
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={visitor.status} />
                  {canEdit && (
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50"
                      onClick={() => {
                        setVisitorModalTitle("Editar visitante");
                        setEditingVisitor(visitor);
                      }}
                      type="button"
                      aria-label={`Editar ${visitor.fullName}`}
                    >
                      <Edit3 aria-hidden className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Quem convidou" value={visitor.invitedBy ?? "-"} />
                <Row label="Primeira visita" value={visitor.firstVisitAt ? formatDate(visitor.firstVisitAt, "dd/MM/yyyy") : "-"} />
                <Row label="Total de visitas" value={`${visits} ${visits === 1 ? "vez" : "vezes"}`} />
              </dl>
              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                {canEdit && (
                  <button
                    className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                    onClick={() => {
                      setVisitorModalTitle("Transformar em integrante");
                      setEditingVisitor({ ...visitor, participantType: "member", status: "active" });
                    }}
                    type="button"
                  >
                    <UserPlus aria-hidden className="h-4 w-4" />
                    Transformar em integrante
                  </button>
                )}
                <Link className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-blue-100 px-3 text-sm font-semibold text-blue-700" href={`/integrantes/${visitor.id}`}>
                  <Eye aria-hidden className="h-4 w-4" />
                  Histórico
                </Link>
              </div>
            </section>
          );
        })}
      </div>
      <FormModal open={creatingVisitor} title="Adicionar visitante" onClose={() => setCreatingVisitor(false)}>
        <ParticipantForm
          cell={data.cell}
          groups={groupsForUser(data)}
          allowVisitors={canManageVisitors(data)}
          defaultType="visitor"
          onSaved={() => {
            setCreatingVisitor(false);
            onDataChanged();
          }}
        />
      </FormModal>
      <FormModal open={Boolean(editingVisitor)} title={visitorModalTitle} onClose={() => setEditingVisitor(null)}>
        {editingVisitor && (
          <ParticipantForm
            cell={data.cell}
            groups={groupsForUser(data)}
            allowVisitors={canManageVisitors(data)}
            participant={editingVisitor}
            onSaved={() => {
              setEditingVisitor(null);
              onDataChanged();
            }}
          />
        )}
      </FormModal>
    </>
  );
}

function ReportsView({ data }: { data: WorkspaceData }) {
  const rows = visibleParticipants(data).map((participant) => ({
    nome: participant.fullName,
    grupo: groupName(data, participant.groupId),
    idade: participant.age ?? "",
    tipo: participantTypeLabels[participant.participantType],
    status: participantStatusLabels[participant.status],
    frequência: `${participantFrequency(data, participant.id)}%`,
  }));
  const metrics = getMetrics(data);

  return (
    <>
      <PageTitle
        icon={BarChart3}
        title="Relatórios"
        subtitle="Acompanhe a frequência, presença e crescimento da sua célula de forma simples e completa."
        action={<ExportButton filename="relatorio-wifi-celula.csv" rows={rows} />}
      />
      <section className="card mb-5 grid gap-3 p-4 md:grid-cols-5">
        <input className="field h-11 px-3 text-sm" type="date" aria-label="Período inicial" />
        <input className="field h-11 px-3 text-sm" type="date" aria-label="Período final" />
        <select className="field h-11 px-3 text-sm" aria-label="Mês"><option>Mês atual</option><option>Mês anterior</option></select>
        <select className="h-11 rounded-lg border border-blue-100 px-3 text-sm" aria-label="Tipo"><option>Todos os tipos</option><option>Membros</option><option>Visitantes</option></select>
        <select className="h-11 rounded-lg border border-blue-100 px-3 text-sm" aria-label="Status"><option>Todos os status</option><option>Presentes</option><option>Faltas</option></select>
      </section>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="Encontros" value={metrics.monthMeetings} tone="blue" />
        <StatCard icon={Check} label="Média de presentes" value={metrics.lastPresent} tone="green" />
        <StatCard icon={HeartHandshake} label="Visitantes únicos" value={metrics.monthVisitors} tone="cyan" />
        <StatCard icon={BarChart3} label="Frequência média" value={`${metrics.monthFrequency}%`} tone="violet" />
      </div>
      <div className="mt-5 grid gap-5 2xl:grid-cols-2">
        <ChartCard title="Presença semanal"><WeeklyPresenceChart data={weeklySeries(data)} /></ChartCard>
        <ChartCard title="Crescimento da célula"><MonthlyAttendanceChart data={weeklySeries(data)} /></ChartCard>
      </div>
      <section className="card mt-5 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-blue-50 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <tr>
              <th className="px-4 py-3">Participante</th>
              <th className="px-4 py-3">Grupo</th>
              <th className="px-4 py-3">Idade</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Frequência</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {rows.map((row) => (
              <tr key={row.nome}>
                <td className="px-4 py-3 font-medium text-slate-950">{row.nome}</td>
                <td className="px-4 py-3 text-slate-600">{row.grupo}</td>
                <td className="px-4 py-3 text-slate-600">{row.idade || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{row.tipo}</td>
                <td className="px-4 py-3 text-slate-600">{row.status}</td>
                <td className="px-4 py-3 text-slate-600">{row.frequência}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </>
  );
}

function BirthdaysView({ data }: { data: WorkspaceData }) {
  const birthdays = getBirthdays(data.participants);
  return (
    <>
      <PageTitle icon={Cake} title="Aniversariantes" subtitle="Celebrações do dia, da semana e do mês." />
      <div className="grid gap-5 2xl:grid-cols-3">
        <BirthdaySection title="Hoje" participants={birthdays.today} />
        <BirthdaySection title="Esta semana" participants={birthdays.week} />
        <BirthdaySection title="Este mês" participants={birthdays.month} />
      </div>
    </>
  );
}

function BirthdaySection({ title, participants }: { title: string; participants: Participant[] }) {
  return (
    <section className="card p-4">
      <SectionHeader icon={Cake} title={title} />
      <div className="space-y-3">
        {participants.length ? participants.map((participant) => <BirthdayCard key={participant.id} participant={participant} />) : <p className="text-sm text-slate-500">Nenhum aniversário neste período.</p>}
      </div>
    </section>
  );
}

function NotificationsView({ data }: { data: WorkspaceData }) {
  return (
    <>
      <PageTitle icon={Bell} title="Notificações" subtitle="Fique por dentro de tudo que acontece na sua célula." />
      <div className="space-y-3">
        {data.notifications.map((notification) => <NotificationItem key={notification.id} notification={notification} />)}
      </div>
    </>
  );
}

function SettingsView({ data }: { data: WorkspaceData }) {
  return (
    <>
      <PageTitle icon={Settings} title="Configurações" subtitle="Identidade visual, conta, célula e preparação para backup." />
      <div className="grid gap-5 2xl:grid-cols-2">
        <section className="card p-5">
          <SectionHeader icon={UserCog} title="Perfil" />
          <dl className="space-y-3 text-sm">
            <Row label="Nome" value={data.currentUser.fullName} />
            <Row label="E-mail" value={data.currentUser.email} />
            <Row label="Perfil" value={roleLabels[data.currentUser.role]} />
          </dl>
        </section>
        <section className="card p-5">
          <SectionHeader icon={Activity} title="Célula" />
          <dl className="space-y-3 text-sm">
            <Row label="Nome" value={data.cell.name} />
            <Row label="Dia" value={data.cell.weekday} />
            <Row label="Horário" value={data.cell.startTime} />
            <Row label="Contato" value={data.cell.contactPhone} />
          </dl>
        </section>
      </div>
    </>
  );
}

function CellsAdminView({ data }: { data: WorkspaceData }) {
  if (!canManageCells(data.currentUser.role)) return <PermissionPanel />;
  return (
    <>
      <PageTitle icon={Activity} title="Células" subtitle="Estrutura preparada para múltiplas células." />
      <div className="grid gap-4 lg:grid-cols-2">
        {data.cells.map((cell) => (
          <section key={cell.id} className="card p-5">
            <h2 className="text-lg font-semibold text-slate-950">{cell.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{cell.description}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Endereço" value={`${cell.address}, ${cell.neighborhood}`} />
              <Row label="Cidade" value={cell.city} />
              <Row label="Dia e horário" value={`${cell.weekday} às ${cell.startTime}`} />
              <Row label="Anfitrião" value={cell.hostName} />
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}

function UsersAdminView({
  data,
  onDataChanged,
}: {
  data: WorkspaceData;
  onDataChanged: () => void;
}) {
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  if (!canManageUsers(data.currentUser.role)) return <PermissionPanel />;
  return (
    <>
      <PageTitle icon={UserCog} title="Usuários" subtitle="Cadastre líderes, auxiliares e perfis de visualização sem expor a service role no frontend." />
      <div className="grid gap-5 2xl:grid-cols-[0.9fr_1.1fr]">
        <section className="card p-5">
          <SectionHeader icon={Plus} title="Novo usuário" />
          <AdminUserForm cell={data.cell} groups={data.groups} participants={data.participants} onSaved={onDataChanged} />
        </section>
        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-blue-50 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3 text-right">AÃ§Ãµes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {data.profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{profile.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{profile.email}</td>
                  <td className="px-4 py-3 text-slate-600">{roleLabels[profile.role]}</td>
                  <td className="px-4 py-3 text-slate-600">{groupName(data, profile.groupId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 text-blue-700 hover:bg-blue-50"
                        onClick={() => setEditingProfile(profile)}
                        type="button"
                        aria-label={`Editar ${profile.fullName}`}
                      >
                        <Edit3 aria-hidden className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
      </div>
      <FormModal open={Boolean(editingProfile)} title="Editar usuário" onClose={() => setEditingProfile(null)}>
        {editingProfile && (
          <AdminUserForm
            cell={data.cell}
            groups={data.groups}
            participants={data.participants}
            profile={editingProfile}
            onSaved={() => {
              setEditingProfile(null);
              onDataChanged();
            }}
          />
        )}
      </FormModal>
    </>
  );
}

function AuditView({ data }: { data: WorkspaceData }) {
  return (
    <>
      <PageTitle icon={ShieldCheck} title="Auditoria" subtitle="Histórico de ações sensíveis realizadas no sistema." />
      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-blue-50 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">Tabela</th>
              <th className="px-4 py-3">Registro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {data.auditLogs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-slate-600">{formatDate(log.createdAt, "dd/MM/yyyy HH:mm")}</td>
                <td className="px-4 py-3 font-medium text-slate-950">{log.action}</td>
                <td className="px-4 py-3 text-slate-600">{log.tableName}</td>
                <td className="px-4 py-3 text-slate-600">{log.recordId ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </>
  );
}

function meetingTone(status: Meeting["status"]) {
  const tones = {
    scheduled: {
      border: "border-t-blue-500",
      badge: "bg-blue-50 text-blue-700",
      button: "bg-blue-600",
      icon: "bg-blue-50 text-blue-700",
    },
    in_progress: {
      border: "border-t-amber-400",
      badge: "bg-amber-50 text-amber-700",
      button: "bg-amber-500",
      icon: "bg-amber-50 text-amber-700",
    },
    finalized: {
      border: "border-t-emerald-400",
      badge: "bg-emerald-50 text-emerald-700",
      button: "bg-emerald-600",
      icon: "bg-emerald-50 text-emerald-700",
    },
    cancelled: {
      border: "border-t-rose-400",
      badge: "bg-rose-50 text-rose-700",
      button: "bg-rose-600",
      icon: "bg-rose-50 text-rose-700",
    },
  } satisfies Record<Meeting["status"], Record<"border" | "badge" | "button" | "icon", string>>;

  return tones[status];
}

async function deleteMeetingRecord(meetingId: string) {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    throw new Error("Configure o Supabase para excluir encontros.");
  }

  const { error } = await supabase.from("meetings").delete().eq("id", meetingId);
  if (error) {
    throw new Error(error.message);
  }
}

function getMeetingDeleteError(error: unknown) {
  if (error instanceof Error && error.message.includes("Configure o Supabase")) {
    return error.message;
  }
  return "Não foi possível excluir este encontro. Apenas administradores podem apagar encontros.";
}

function visitorVisitCount(data: WorkspaceData, participantId: string) {
  return data.attendance.filter((entry) => entry.participantId === participantId && entry.status === "visitor_present").length;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-950">{value}</dd>
    </div>
  );
}

function visibleParticipants(data: WorkspaceData) {
  const groupId = data.currentUser.groupId;
  if (!groupId || data.currentUser.role === "admin") return data.participants;
  return data.participants.filter((participant) => participant.groupId === groupId);
}

function groupsForUser(data: WorkspaceData) {
  if (!data.currentUser.groupId || data.currentUser.role === "admin") return data.groups;
  return data.groups.filter((group) => group.id === data.currentUser.groupId);
}

function canEditParticipant(data: WorkspaceData, participant: Participant) {
  if (!canManageParticipants(data.currentUser.role)) return false;
  if (data.currentUser.role === "admin" || !data.currentUser.groupId) return true;
  return participant.groupId === data.currentUser.groupId;
}

function canManageVisitors(data: WorkspaceData) {
  return canManageParticipants(data.currentUser.role)
    && (data.currentUser.role === "admin" || !data.currentUser.groupId);
}

function groupName(data: WorkspaceData, groupId?: string) {
  return data.groups.find((group) => group.id === groupId)?.name ?? "Sem grupo";
}

function profileName(data: WorkspaceData, profileId?: string) {
  if (!profileId) return "-";
  return data.profiles.find((profile) => profile.id === profileId)?.fullName ?? "-";
}

function countAttendance(entries: Attendance[]) {
  const counts: Record<AttendanceStatus, number> = {
    present: 0,
    absent: 0,
    justified: 0,
    visitor_present: 0,
    not_informed: 0,
  };
  entries.forEach((entry) => {
    counts[entry.status] += 1;
  });
  return counts;
}

function getMetrics(data: WorkspaceData) {
  const activeParticipants = data.participants.filter((participant) => participant.active && participant.participantType !== "visitor").length;
  const lastMeeting = latestCompletedMeeting(data);
  const referenceMonth = lastMeeting?.meetingDate.slice(0, 7) ?? new Date().toISOString().slice(0, 7);
  const monthMeetings = data.meetings.filter((meeting) => meeting.meetingDate.startsWith(referenceMonth)).length;
  const lastCounts = countAttendance(data.attendance.filter((entry) => entry.meetingId === lastMeeting?.id));
  const monthEntries = data.attendance.filter((entry) => {
    const meeting = data.meetings.find((item) => item.id === entry.meetingId);
    return meeting?.meetingDate.startsWith(referenceMonth);
  });
  const monthPresent = monthEntries.filter((entry) => entry.status === "present" || entry.status === "visitor_present").length;
  const possible = Math.max(1, monthEntries.length);
  const monthFrequency = Math.round((monthPresent / possible) * 100);
  const monthVisitors = new Set(monthEntries.filter((entry) => entry.status === "visitor_present").map((entry) => entry.participantId)).size;

  return {
    activeParticipants,
    monthVisitors,
    lastPresent: lastCounts.present + lastCounts.visitor_present,
    lastAbsent: lastCounts.absent,
    monthFrequency,
    monthMeetings,
  };
}

function weeklySeries(data: WorkspaceData) {
  return data.meetings
    .filter((meeting) => meeting.status !== "scheduled")
    .slice()
    .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate))
    .map((meeting) => {
      const counts = countAttendance(data.attendance.filter((entry) => entry.meetingId === meeting.id));
      return {
        semana: formatDate(meeting.meetingDate, "dd/MM"),
        presentes: counts.present + counts.visitor_present,
        faltas: counts.absent + counts.justified,
        visitantes: counts.visitor_present,
      };
    });
}

function sortedMeetings(data: WorkspaceData): Meeting[] {
  return [...data.meetings].sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
}

function latestCompletedMeeting(data: WorkspaceData) {
  return sortedMeetings(data).find((meeting) => meeting.status !== "scheduled") ?? data.meetings[0];
}

function activeMeeting(data: WorkspaceData) {
  const sorted = sortedMeetings(data);
  return (
    sorted.find((meeting) => meeting.status === "in_progress") ??
    sorted.find((meeting) => meeting.status === "scheduled") ??
    sorted[0]
  );
}

function participantFrequency(data: WorkspaceData, participantId: string) {
  const participant = data.participants.find((item) => item.id === participantId);
  const possibleMeetings = data.meetings.filter(
    (meeting) =>
      meeting.status !== "scheduled" &&
      (!participant?.joinedAt || meeting.meetingDate >= participant.joinedAt),
  );
  const entries = data.attendance.filter((entry) => entry.participantId === participantId);
  const present = entries.filter((entry) => entry.status === "present" || entry.status === "visitor_present").length;
  return Math.round((present / Math.max(1, possibleMeetings.length)) * 100);
}

function getAttentionList(data: WorkspaceData) {
  return data.participants
    .filter((participant) => participant.active && participant.participantType !== "visitor")
    .map((participant) => {
      const frequency = participantFrequency(data, participant.id);
      const entries = data.attendance
        .filter((entry) => entry.participantId === participant.id)
        .slice(-3);
      const consecutiveAbsences = entries.length === 3 && entries.every((entry) => entry.status === "absent");
      const reason = consecutiveAbsences
        ? "Três encontros sem participar"
        : frequency < 50
          ? "Frequência abaixo de 50% no período"
          : "Mais de 14 dias sem registro de presença";
      return { participant, frequency, reason };
    })
    .filter((item) => item.frequency < 60 || item.reason.includes("14"))
    .slice(0, 5);
}

function getBirthdays(participants: Participant[]) {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const monthBirthdays = participants.filter((participant) => participant.birthDate?.slice(5, 7) === month);
  return {
    today: monthBirthdays.filter((participant) => participant.birthDate?.slice(8, 10) === day),
    week: monthBirthdays.slice(0, 6),
    month: monthBirthdays,
  };
}
