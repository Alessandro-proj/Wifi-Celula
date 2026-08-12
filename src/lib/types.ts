export type Role = "admin" | "leader" | "assistant" | "viewer";

export type ParticipantType =
  | "member"
  | "visitor"
  | "leader"
  | "assistant"
  | "child"
  | "teenager";

export type ParticipantStatus =
  | "active"
  | "inactive"
  | "away"
  | "transferred";

export type MeetingStatus =
  | "scheduled"
  | "in_progress"
  | "finalized"
  | "cancelled";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "justified"
  | "visitor_present"
  | "not_informed";

export type NotificationType =
  | "meeting"
  | "attendance"
  | "visitor"
  | "care"
  | "birthday"
  | "report";

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: Role;
  participantId?: string;
  groupId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cell {
  id: string;
  name: string;
  description: string;
  address: string;
  neighborhood: string;
  city: string;
  weekday: string;
  startTime: string;
  hostName: string;
  contactPhone: string;
  coverUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CellGroup {
  id: string;
  cellId: string;
  name: string;
  description?: string;
  color: "blue" | "cyan" | "green" | "violet" | "amber" | "rose";
  leaderProfileId?: string;
  leaderParticipantId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  cellId: string;
  groupId?: string;
  fullName: string;
  preferredName: string;
  age?: number;
  birthDate?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  gender?: string;
  address?: string;
  neighborhood?: string;
  joinedAt: string;
  participantType: ParticipantType;
  status: ParticipantStatus;
  invitedBy?: string;
  firstVisitAt?: string;
  convertedToMemberAt?: string;
  photoUrl?: string;
  notes?: string;
  active: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  cellId: string;
  meetingDate: string;
  startTime: string;
  endTime?: string;
  theme: string;
  description?: string;
  address: string;
  responsibleUserId?: string;
  status: MeetingStatus;
  notes?: string;
  createdBy?: string;
  finalizedBy?: string;
  finalizedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  meetingId: string;
  participantId: string;
  status: AttendanceStatus;
  absenceReason?: string;
  notes?: string;
  registeredBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface ParticipantNote {
  id: string;
  participantId: string;
  authorId: string;
  note: string;
  private: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  createdAt: string;
}

export interface WorkspaceData {
  currentUser: Profile;
  cell: Cell;
  profiles: Profile[];
  cells: Cell[];
  groups: CellGroup[];
  participants: Participant[];
  meetings: Meeting[];
  attendance: Attendance[];
  notifications: Notification[];
  participantNotes: ParticipantNote[];
  auditLogs: AuditLog[];
}
