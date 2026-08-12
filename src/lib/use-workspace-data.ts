"use client";

import { useEffect, useState } from "react";
import { demoWorkspaceData } from "./demo-data";
import { createBrowserSupabaseClient } from "./supabase/client";
import type {
  Attendance,
  AuditLog,
  Cell,
  CellGroup,
  Meeting,
  Notification,
  Participant,
  ParticipantNote,
  Profile,
  WorkspaceData,
} from "./types";

type DbRow = Record<string, unknown>;
type DataSource = "loading" | "demo" | "supabase";

const asString = (row: DbRow, key: string, fallback = "") =>
  typeof row[key] === "string" ? row[key] : fallback;

const asBoolean = (row: DbRow, key: string, fallback = true) =>
  typeof row[key] === "boolean" ? row[key] : fallback;

const asNumber = (row: DbRow, key: string) =>
  typeof row[key] === "number" ? row[key] : undefined;

const toDate = (row: DbRow, key: string, fallback = new Date().toISOString()) =>
  typeof row[key] === "string" ? row[key] : fallback;

function mapProfile(row: DbRow): Profile {
  return {
    id: asString(row, "id"),
    fullName: asString(row, "full_name", "Usuario"),
    email: asString(row, "email"),
    phone: asString(row, "phone") || undefined,
    avatarUrl: asString(row, "avatar_url") || undefined,
    role: asString(row, "role", "viewer") as Profile["role"],
    participantId: asString(row, "participant_id") || undefined,
    groupId: asString(row, "group_id") || undefined,
    active: asBoolean(row, "active"),
    createdAt: toDate(row, "created_at"),
    updatedAt: toDate(row, "updated_at"),
  };
}

function mapCell(row: DbRow): Cell {
  return {
    id: asString(row, "id"),
    name: asString(row, "name", "WiFi"),
    description: asString(row, "description"),
    address: asString(row, "address"),
    neighborhood: asString(row, "neighborhood"),
    city: asString(row, "city"),
    weekday: asString(row, "weekday"),
    startTime: asString(row, "start_time"),
    hostName: asString(row, "host_name"),
    contactPhone: asString(row, "contact_phone"),
    coverUrl: asString(row, "cover_url") || undefined,
    active: asBoolean(row, "active"),
    createdAt: toDate(row, "created_at"),
    updatedAt: toDate(row, "updated_at"),
  };
}

function mapGroup(row: DbRow): CellGroup {
  return {
    id: asString(row, "id"),
    cellId: asString(row, "cell_id"),
    name: asString(row, "name", "Grupo"),
    description: asString(row, "description") || undefined,
    color: asString(row, "color", "blue") as CellGroup["color"],
    leaderProfileId: asString(row, "leader_profile_id") || undefined,
    leaderParticipantId: asString(row, "leader_participant_id") || undefined,
    active: asBoolean(row, "active"),
    createdAt: toDate(row, "created_at"),
    updatedAt: toDate(row, "updated_at"),
  };
}

function mapParticipant(row: DbRow): Participant {
  return {
    id: asString(row, "id"),
    cellId: asString(row, "cell_id"),
    groupId: asString(row, "group_id") || undefined,
    fullName: asString(row, "full_name"),
    preferredName: asString(row, "preferred_name") || asString(row, "full_name"),
    age: asNumber(row, "age"),
    birthDate: asString(row, "birth_date") || undefined,
    phone: asString(row, "phone") || undefined,
    whatsapp: asString(row, "whatsapp") || undefined,
    email: asString(row, "email") || undefined,
    gender: asString(row, "gender") || undefined,
    address: asString(row, "address") || undefined,
    neighborhood: asString(row, "neighborhood") || undefined,
    joinedAt: asString(row, "joined_at"),
    participantType: asString(row, "participant_type", "member") as Participant["participantType"],
    status: asString(row, "status", "active") as Participant["status"],
    invitedBy: asString(row, "invited_by") || undefined,
    firstVisitAt: asString(row, "first_visit_at") || undefined,
    convertedToMemberAt: asString(row, "converted_to_member_at") || undefined,
    photoUrl: asString(row, "photo_url") || undefined,
    notes: asString(row, "notes") || undefined,
    active: asBoolean(row, "active"),
    createdBy: asString(row, "created_by") || undefined,
    createdAt: toDate(row, "created_at"),
    updatedAt: toDate(row, "updated_at"),
  };
}

function mapMeeting(row: DbRow): Meeting {
  return {
    id: asString(row, "id"),
    cellId: asString(row, "cell_id"),
    meetingDate: asString(row, "meeting_date"),
    startTime: asString(row, "start_time"),
    endTime: asString(row, "end_time") || undefined,
    theme: asString(row, "theme"),
    description: asString(row, "description") || undefined,
    address: asString(row, "address"),
    responsibleUserId: asString(row, "responsible_user_id") || undefined,
    status: asString(row, "status", "scheduled") as Meeting["status"],
    notes: asString(row, "notes") || undefined,
    createdBy: asString(row, "created_by") || undefined,
    finalizedBy: asString(row, "finalized_by") || undefined,
    finalizedAt: asString(row, "finalized_at") || undefined,
    createdAt: toDate(row, "created_at"),
    updatedAt: toDate(row, "updated_at"),
  };
}

function mapAttendance(row: DbRow): Attendance {
  return {
    id: asString(row, "id"),
    meetingId: asString(row, "meeting_id"),
    participantId: asString(row, "participant_id"),
    status: asString(row, "status", "not_informed") as Attendance["status"],
    absenceReason: asString(row, "absence_reason") || undefined,
    notes: asString(row, "notes") || undefined,
    registeredBy: asString(row, "registered_by") || undefined,
    createdAt: toDate(row, "created_at"),
    updatedAt: toDate(row, "updated_at"),
  };
}

function mapNotification(row: DbRow): Notification {
  return {
    id: asString(row, "id"),
    userId: asString(row, "user_id"),
    title: asString(row, "title"),
    message: asString(row, "message"),
    type: asString(row, "type", "meeting") as Notification["type"],
    read: asBoolean(row, "read", false),
    link: asString(row, "link") || undefined,
    createdAt: toDate(row, "created_at"),
  };
}

function mapNote(row: DbRow): ParticipantNote {
  return {
    id: asString(row, "id"),
    participantId: asString(row, "participant_id"),
    authorId: asString(row, "author_id"),
    note: asString(row, "note"),
    private: asBoolean(row, "private", false),
    createdAt: toDate(row, "created_at"),
    updatedAt: toDate(row, "updated_at"),
  };
}

function mapAudit(row: DbRow): AuditLog {
  return {
    id: asString(row, "id"),
    userId: asString(row, "user_id") || undefined,
    action: asString(row, "action"),
    tableName: asString(row, "table_name"),
    recordId: asString(row, "record_id") || undefined,
    oldData: (row.old_data as Record<string, unknown> | null) ?? null,
    newData: (row.new_data as Record<string, unknown> | null) ?? null,
    createdAt: toDate(row, "created_at"),
  };
}

function rows<T>(value: unknown, mapper: (row: DbRow) => T) {
  return Array.isArray(value) ? value.map((row) => mapper(row as DbRow)) : [];
}

export function useWorkspaceData() {
  const [data, setData] = useState<WorkspaceData>(demoWorkspaceData);
  const [source, setSource] = useState<DataSource>("loading");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      const supabase = createBrowserSupabaseClient();
      if (!supabase) {
        setSource("demo");
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const [
          profileResult,
          profilesResult,
          cellsResult,
          groupsResult,
          participantsResult,
          meetingsResult,
          attendanceResult,
          notificationsResult,
          notesResult,
          auditResult,
        ] = await Promise.all([
          user
            ? supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          supabase.from("profiles").select("*").order("full_name"),
          supabase.from("cells").select("*").order("name"),
          supabase.from("cell_groups").select("*").order("name"),
          supabase.from("participants").select("*").order("full_name"),
          supabase.from("meetings").select("*").order("meeting_date", {
            ascending: false,
          }),
          supabase.from("attendance").select("*"),
          user
            ? supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [], error: null }),
          supabase.from("participant_notes").select("*").order("created_at", {
            ascending: false,
          }),
          supabase.from("audit_logs").select("*").order("created_at", {
            ascending: false,
          }),
        ]);

        const firstCell = rows(cellsResult.data, mapCell)[0] ?? demoWorkspaceData.cell;
        const currentUser = profileResult.data
          ? mapProfile(profileResult.data as DbRow)
          : {
              ...demoWorkspaceData.currentUser,
              id: user?.id ?? "current-user",
              fullName: typeof user?.user_metadata?.full_name === "string"
                ? user.user_metadata.full_name
                : user?.email?.split("@")[0] ?? demoWorkspaceData.currentUser.fullName,
              email: user?.email ?? demoWorkspaceData.currentUser.email,
            };

        if (!mounted) return;

        setData({
          currentUser,
          cell: firstCell,
          profiles: rows(profilesResult.data, mapProfile),
          cells: rows(cellsResult.data, mapCell),
          groups: rows(groupsResult.data, mapGroup),
          participants: rows(participantsResult.data, mapParticipant),
          meetings: rows(meetingsResult.data, mapMeeting),
          attendance: rows(attendanceResult.data, mapAttendance),
          notifications: rows(notificationsResult.data, mapNotification),
          participantNotes: rows(notesResult.data, mapNote),
          auditLogs: rows(auditResult.data, mapAudit),
        });
        setSource("supabase");
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Falha ao carregar dados.");
        setSource("demo");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  return {
    data,
    source,
    loading,
    error,
    reload: () => setReloadKey((key) => key + 1),
  };
}
