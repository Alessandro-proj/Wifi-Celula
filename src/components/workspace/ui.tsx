"use client";

import {
  AlertCircle,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Church,
  Circle,
  Download,
  FileDown,
  LogOut,
  Loader2,
  Menu,
  MoreHorizontal,
  PanelLeft,
  Printer,
  RadioTower,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { attendanceStatusLabels, cn, initials, roleLabels, toCsv } from "@/lib/utils";
import type {
  AttendanceStatus,
  Meeting,
  Notification,
  Participant,
  ParticipantStatus,
  ParticipantType,
  Role,
} from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  admin?: boolean;
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="flex items-center gap-3" href="/dashboard" aria-label="Ir para o início">
      <span className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20">
        <Church aria-hidden className="h-6 w-6" />
        <RadioTower aria-hidden className="absolute -top-2 h-5 w-5 text-blue-500" />
      </span>
      {!compact && (
        <span>
          <span className="block text-3xl font-semibold leading-7 tracking-normal text-slate-950">WiFi</span>
          <span className="block text-xl font-semibold leading-5 text-violet-600">Célula</span>
        </span>
      )}
    </Link>
  );
}

export function Sidebar({
  items,
  activePath,
  onClose,
  open,
  role,
  userName,
}: {
  items: NavItem[];
  activePath: string;
  onClose: () => void;
  open: boolean;
  role: Role;
  userName: string;
}) {
  if (!open) return null;

  return (
    <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 overflow-hidden border-r border-blue-100 bg-white/92 px-4 py-4 shadow-[12px_0_40px_rgba(29,45,91,0.05)] backdrop-blur lg:block 2xl:w-72 2xl:px-5 2xl:py-7">
      <div className="mb-3 flex items-center justify-between 2xl:mb-5">
        <BrandMark />
        <button
          aria-label="Recolher menu lateral"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 text-slate-600 hover:bg-blue-50"
          onClick={onClose}
          type="button"
        >
          <PanelLeft aria-hidden className="h-5 w-5" />
        </button>
      </div>
      <SidebarContent activePath={activePath} items={items} role={role} showBrand={false} userName={userName} />
    </aside>
  );
}

export function MobileSidebar({
  open,
  onClose,
  items,
  activePath,
  role,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  activePath: string;
  role: Role;
  userName: string;
}) {
  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")} aria-hidden={!open}>
      <button
        className={cn("absolute inset-0 bg-slate-950/35 transition-opacity", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
        aria-label="Fechar menu"
        type="button"
      />
      <aside className={cn("absolute bottom-0 left-0 top-0 w-[min(86vw,320px)] bg-white px-5 py-6 shadow-2xl transition-transform", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-5 flex items-center justify-between">
          <BrandMark />
          <button className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-100 text-slate-600" onClick={onClose} type="button" aria-label="Fechar menu">
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent activePath={activePath} items={items} onNavigate={onClose} role={role} userName={userName} />
      </aside>
    </div>
  );
}

function SidebarContent({
  items,
  activePath,
  role,
  onNavigate,
  showBrand = true,
  userName,
}: {
  items: NavItem[];
  activePath: string;
  role: Role;
  onNavigate?: () => void;
  showBrand?: boolean;
  userName: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {showBrand && (
        <div className="hidden lg:block">
          <BrandMark />
        </div>
      )}
      <p className="mt-3 text-center text-sm leading-6 text-slate-600 lg:text-left">
        Conectados com Deus<br />e uns com os outros
      </p>
      <nav className="mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 2xl:mt-8 2xl:space-y-2" aria-label="Menu principal">
        {items
          .filter((item) => !item.admin || role === "admin")
          .map((item) => {
            const Icon = item.icon;
            const active = activePath === item.href || activePath.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition 2xl:min-h-12 2xl:px-4",
                  active
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-700 hover:bg-blue-50 hover:text-blue-700",
                )}
                href={item.href}
                onClick={onNavigate}
              >
                <Icon aria-hidden className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
      </nav>
      <div className="mt-4 hidden shrink-0 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 p-4 text-white shadow-xl shadow-blue-600/20 2xl:block">
        <p className="text-sm text-blue-50">Próximo encontro</p>
        <p className="mt-2 text-sm font-semibold">Sexta-feira, 08 ago</p>
        <p className="mt-2 text-3xl font-semibold">19:30</p>
        <p className="mt-1 text-sm text-blue-50">Na casa do João</p>
        <Link className="mt-4 flex min-h-10 items-center justify-between rounded-lg bg-white px-4 text-sm font-semibold text-blue-700" href="/encontros">
          Ver detalhes
          <ChevronRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-4 flex shrink-0 items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">{initials(userName)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-950">{userName}</span>
          <span className="block text-xs text-slate-500">{roleLabels[role]}</span>
        </span>
        <LogoutButton compact />
      </div>
    </div>
  );
}

export function MobileNavigation({
  items,
  activePath,
  attendanceHref,
}: {
  items: NavItem[];
  activePath: string;
  attendanceHref: string;
}) {
  const primary = items.filter((item) =>
    ["/dashboard", "/encontros", "/encontros/novo", "/integrantes"].includes(item.href),
  );
  const attendance = {
    href: attendanceHref,
    label: "Presença",
    icon: Check,
  };

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/94 px-2 py-2 backdrop-blur lg:hidden" aria-label="Menu inferior">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end gap-1">
        {primary.slice(0, 2).map((item) => (
          <MobileNavLink key={item.href} activePath={activePath} item={item} />
        ))}
        <MobileNavLink activePath={activePath} emphasized item={attendance} />
        {primary.slice(2, 3).map((item) => (
          <MobileNavLink key={item.href} activePath={activePath} item={item} />
        ))}
        <MobileNavLink activePath={activePath} item={{ href: "/notificacoes", label: "Mais", icon: MoreHorizontal }} />
      </div>
    </nav>
  );
}

function MobileNavLink({
  item,
  activePath,
  emphasized,
}: {
  item: NavItem;
  activePath: string;
  emphasized?: boolean;
}) {
  const Icon = item.icon;
  const active = activePath === item.href || activePath.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      className={cn(
        "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium",
        active ? "text-blue-700" : "text-slate-500",
        emphasized && "bg-blue-600 text-white shadow-lg shadow-blue-600/25",
      )}
    >
      <Icon aria-hidden className="h-5 w-5" />
      <span className="max-w-full truncate">{item.label}</span>
    </Link>
  );
}

export function AppHeader({
  greetingText,
  userName,
  cellName,
  today,
  unread,
  attendanceHref,
  desktopSidebarOpen,
  onDesktopSidebarToggle,
  onMenuClick,
}: {
  greetingText: string;
  userName: string;
  cellName: string;
  today: string;
  unread: number;
  attendanceHref: string;
  desktopSidebarOpen: boolean;
  onDesktopSidebarToggle: () => void;
  onMenuClick: () => void;
}) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-blue-100 bg-white/88 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-5 lg:px-6 2xl:min-h-20 2xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-100 bg-white text-slate-700 lg:hidden" onClick={onMenuClick} type="button" aria-label="Abrir menu">
            <PanelLeft aria-hidden className="h-5 w-5" />
          </button>
          <button
            className="hidden h-11 w-11 items-center justify-center rounded-lg border border-blue-100 bg-white text-slate-700 hover:bg-blue-50 lg:flex"
            onClick={onDesktopSidebarToggle}
            type="button"
            aria-label={desktopSidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
            aria-pressed={desktopSidebarOpen}
          >
            <PanelLeft aria-hidden className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-950">{greetingText}, {userName}!</p>
            <p className="truncate text-sm font-medium text-slate-500">{today}</p>
            <span className="sr-only">{cellName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className="hidden min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:flex"
            href={attendanceHref}
          >
            <Check aria-hidden className="h-4 w-4" />
            Registrar presença
          </Link>
          <Link
            className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-blue-100 bg-white text-slate-600 hover:bg-blue-50"
            href="/notificacoes"
            aria-label={`${unread} notificações não lidas`}
          >
            <Bell aria-hidden className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
            )}
          </Link>
          <Link
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white"
            href="/configuracoes"
            aria-label="Abrir perfil"
          >
            <UserRound aria-hidden className="h-5 w-5" />
          </Link>
          <LogoutButton compact />
        </div>
      </div>
    </header>
  );
}

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    const supabase = createBrowserSupabaseClient();
    await supabase?.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      aria-label="Sair"
      className={cn(
        "flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-100 bg-white text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-70",
        compact ? "h-10 w-10 px-0" : "px-4",
      )}
      disabled={busy}
      onClick={handleLogout}
      type="button"
    >
      {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <LogOut aria-hidden className="h-4 w-4" />}
      {!compact && "Sair"}
    </button>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  tone?: "blue" | "cyan" | "green" | "violet" | "amber" | "rose";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 shadow-blue-100",
    cyan: "bg-cyan-50 text-cyan-700 shadow-cyan-100",
    green: "bg-emerald-50 text-emerald-700 shadow-emerald-100",
    violet: "bg-violet-50 text-violet-700 shadow-violet-100",
    amber: "bg-amber-50 text-amber-700 shadow-amber-100",
    rose: "bg-rose-50 text-rose-700 shadow-rose-100",
  };
  return (
    <section className="card p-5 transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium leading-5 text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className={cn("flex h-14 w-14 items-center justify-center rounded-full shadow-lg", tones[tone])}>
          <Icon aria-hidden className="h-5 w-5" />
        </span>
      </div>
      {hint && <p className="mt-3 text-xs leading-5 text-slate-500">{hint}</p>}
    </section>
  );
}

export function ChartCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-blue-200 bg-white/70 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
        <UsersRound aria-hidden className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Carregando">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-lg bg-white/70" />
      ))}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="field flex min-h-11 items-center gap-2 px-3 text-sm">
      <Search aria-hidden className="h-4 w-4 text-slate-400" />
      <span className="sr-only">Buscar</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-slate-950 placeholder:text-slate-400"
        placeholder={placeholder}
      />
    </label>
  );
}

export function FilterDrawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")} aria-hidden={!open}>
      <div className={cn("absolute inset-0 bg-slate-950/30 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <aside className={cn("absolute bottom-0 left-0 right-0 rounded-t-lg bg-white p-5 shadow-2xl transition-transform", open ? "translate-y-0" : "translate-y-full")}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100" onClick={onClose} aria-label="Fechar filtros">
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}

export function ParticipantAvatar({
  participant,
  size = "md",
}: {
  participant: Pick<Participant, "fullName" | "photoUrl">;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-20 w-20 text-xl",
  };

  if (participant.photoUrl) {
    return (
      // Supabase signed Storage URLs are easier to handle without Next image host allowlists.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={`Foto de ${participant.fullName}`}
        className={cn("rounded-lg object-cover", sizes[size])}
        src={participant.photoUrl}
      />
    );
  }

  return (
    <span className={cn("flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-violet-100 font-semibold text-blue-700", sizes[size])}>
      {initials(participant.fullName)}
    </span>
  );
}

export function ParticipantCard({ participant, href }: { participant: Participant; href: string }) {
  return (
    <Link className="card flex items-center gap-3 p-4 transition hover:border-blue-300 hover:shadow-blue-950/10" href={href}>
      <ParticipantAvatar participant={participant} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-950">{participant.fullName}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <RoleBadge type={participant.participantType} />
          <StatusBadge status={participant.status} />
        </div>
      </div>
      <ChevronRight aria-hidden className="h-5 w-5 text-slate-400" />
    </Link>
  );
}

export function RoleBadge({ type }: { type: ParticipantType }) {
  const label: Record<ParticipantType, string> = {
    member: "Membro",
    visitor: "Visitante",
    leader: "Líder",
    assistant: "Auxiliar",
    child: "Criança",
    teenager: "Adolescente",
  };
  const tone: Record<ParticipantType, string> = {
    member: "bg-blue-50 text-blue-700",
    visitor: "bg-cyan-50 text-cyan-700",
    leader: "bg-violet-50 text-violet-700",
    assistant: "bg-emerald-50 text-emerald-700",
    child: "bg-amber-50 text-amber-700",
    teenager: "bg-rose-50 text-rose-700",
  };

  return (
    <span className={cn("inline-flex min-h-7 items-center rounded-md px-2 text-xs font-medium", tone[type])}>
      {label[type]}
    </span>
  );
}

export function StatusBadge({ status }: { status: ParticipantStatus }) {
  const label: Record<ParticipantStatus, string> = {
    active: "Ativo",
    inactive: "Inativo",
    away: "Acompanhar",
    transferred: "Transferido",
  };
  const tone: Record<ParticipantStatus, string> = {
    active: "bg-emerald-50 text-emerald-700",
    inactive: "bg-slate-100 text-slate-600",
    away: "bg-amber-50 text-amber-700",
    transferred: "bg-violet-50 text-violet-700",
  };

  return (
    <span className={cn("inline-flex min-h-7 items-center rounded-md px-2 text-xs font-medium", tone[status])}>
      {label[status]}
    </span>
  );
}

export function FrequencyBadge({ value }: { value: number }) {
  const tone =
    value >= 80
      ? "bg-emerald-50 text-emerald-700"
      : value >= 60
        ? "bg-amber-50 text-amber-700"
        : "bg-rose-50 text-rose-700";
  const label = value >= 80 ? "Alta" : value >= 60 ? "Regular" : "Acompanhar";
  return (
    <span className={cn("inline-flex min-h-7 items-center gap-1 rounded-md px-2 text-xs font-medium", tone)}>
      {label} - {value}%
    </span>
  );
}

export function AttendanceButton({
  status,
  active,
  onClick,
}: {
  status: AttendanceStatus;
  active: boolean;
  onClick: () => void;
}) {
  const Icon =
    status === "present" || status === "visitor_present"
      ? Check
      : status === "absent"
        ? X
        : status === "justified"
          ? AlertCircle
          : Circle;
  const tone: Record<AttendanceStatus, string> = {
    present: active ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700",
    absent: active ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700",
    justified: active ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700",
    visitor_present: active ? "bg-cyan-600 text-white" : "bg-cyan-50 text-cyan-700",
    not_informed: active ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn("flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition", tone[status])}
    >
      <Icon aria-hidden className="h-4 w-4" />
      {attendanceStatusLabels[status]}
    </button>
  );
}

export function AttendanceSummary({
  counts,
}: {
  counts: Record<AttendanceStatus, number>;
}) {
  const items: AttendanceStatus[] = ["present", "absent", "justified", "visitor_present", "not_informed"];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {items.map((status) => (
        <div key={status} className="rounded-lg border border-blue-100 bg-white p-3">
          <p className="text-xl font-semibold text-slate-950">{counts[status] ?? 0}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{attendanceStatusLabels[status]}</p>
        </div>
      ))}
    </div>
  );
}

export function MeetingCard({ meeting, href }: { meeting: Meeting; href: string }) {
  return (
    <Link className="card block p-4 transition hover:border-blue-300" href={href}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{meeting.theme}</p>
          <p className="mt-1 text-xs text-slate-500">
            {meeting.meetingDate} as {meeting.startTime}
          </p>
        </div>
        <ChevronRight aria-hidden className="h-5 w-5 text-slate-400" />
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
        <CalendarDays aria-hidden className="h-4 w-4" />
        <span className="truncate">{meeting.address}</span>
      </div>
    </Link>
  );
}

export function BirthdayCard({ participant }: { participant: Participant }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-white p-3">
      <ParticipantAvatar participant={participant} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-950">{participant.preferredName}</p>
        <p className="text-xs text-slate-500">{participant.birthDate?.slice(5).split("-").reverse().join("/")}</p>
      </div>
    </div>
  );
}

export function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <Link
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 transition hover:border-blue-300",
        notification.read ? "border-slate-100 bg-white" : "border-blue-100 bg-blue-50/70",
      )}
      href={notification.link ?? "/notificacoes"}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-700">
        <Bell aria-hidden className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-950">{notification.title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{notification.message}</span>
      </span>
    </Link>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
        <h2 id="confirm-title" className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700" onClick={onCancel}>
            Cancelar
          </button>
          <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white" onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FormModal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-t-lg bg-white p-5 shadow-2xl sm:rounded-lg">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100" onClick={onClose} aria-label="Fechar">
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ExportButton({
  rows,
  filename,
}: {
  rows: Array<Record<string, string | number | boolean>>;
  filename: string;
}) {
  function downloadCsv() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button className="flex min-h-10 items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 text-sm font-semibold text-blue-700" type="button" onClick={downloadCsv}>
        <Download aria-hidden className="h-4 w-4" />
        CSV
      </button>
      <button className="flex min-h-10 items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 text-sm font-semibold text-blue-700" type="button" onClick={() => window.print()}>
        <Printer aria-hidden className="h-4 w-4" />
        Imprimir/PDF
      </button>
      <span className="sr-only">Exportar relatório</span>
    </div>
  );
}

export function PermissionPanel() {
  return (
    <section className="card p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <ShieldCheck aria-hidden className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Acesso restrito</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Seu perfil atual não possui permissão para esta área. As mesmas regras também existem no Supabase RLS.
          </p>
        </div>
      </div>
    </section>
  );
}

export function CompactMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-100 bg-white text-slate-600 lg:hidden"
      type="button"
      onClick={onClick}
      aria-label="Abrir menu"
    >
      <Menu aria-hidden className="h-5 w-5" />
    </button>
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className="relative mb-5 overflow-hidden rounded-lg border border-blue-100 bg-white/72 p-4 shadow-[0_18px_55px_rgba(29,45,91,0.06)] 2xl:mb-6 2xl:p-5">
      <div className="hero-art hidden md:block">
        <span className="wifi-waves" />
      </div>
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {Icon && (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-700 shadow-lg shadow-blue-950/5">
              <Icon aria-hidden className="h-7 w-7" />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950 2xl:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}

export function SectionHeader({ title, icon: Icon }: { title: string; icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }> }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {Icon && <Icon aria-hidden className="h-5 w-5 text-blue-700" />}
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
    </div>
  );
}

export function FileExportIcon() {
  return <FileDown aria-hidden className="h-4 w-4" />;
}
