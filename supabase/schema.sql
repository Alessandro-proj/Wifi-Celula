create extension if not exists "pgcrypto";

create type public.app_role as enum ('admin', 'leader', 'assistant', 'viewer');
create type public.participant_type as enum ('member', 'visitor', 'leader', 'assistant', 'child', 'teenager');
create type public.participant_status as enum ('active', 'inactive', 'away', 'transferred');
create type public.meeting_status as enum ('scheduled', 'in_progress', 'finalized', 'cancelled');
create type public.attendance_status as enum ('present', 'absent', 'justified', 'visitor_present', 'not_informed');
create type public.notification_type as enum ('meeting', 'attendance', 'visitor', 'care', 'birthday', 'report');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  role public.app_role not null default 'viewer',
  participant_id uuid,
  group_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cells (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  address text not null,
  neighborhood text,
  city text,
  weekday text not null,
  start_time time not null,
  host_name text,
  contact_phone text,
  cover_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cell_users (
  id uuid primary key default gen_random_uuid(),
  cell_id uuid not null references public.cells(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_in_cell public.app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (cell_id, user_id)
);

create table public.cell_groups (
  id uuid primary key default gen_random_uuid(),
  cell_id uuid not null references public.cells(id) on delete cascade,
  name text not null,
  description text,
  color text not null default 'blue' check (color in ('blue', 'cyan', 'green', 'violet', 'amber', 'rose')),
  leader_profile_id uuid references public.profiles(id) on delete set null,
  leader_participant_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cell_id, name)
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  cell_id uuid not null references public.cells(id) on delete restrict,
  group_id uuid references public.cell_groups(id) on delete set null,
  full_name text not null,
  preferred_name text,
  age integer check (age is null or age between 0 and 120),
  birth_date date,
  phone text,
  whatsapp text,
  email text,
  gender text,
  address text,
  neighborhood text,
  joined_at date not null default current_date,
  participant_type public.participant_type not null default 'member',
  status public.participant_status not null default 'active',
  invited_by text,
  first_visit_at date,
  converted_to_member_at date,
  photo_url text,
  notes text,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_participant_id_fkey
  foreign key (participant_id) references public.participants(id) on delete set null;

alter table public.profiles
  add constraint profiles_group_id_fkey
  foreign key (group_id) references public.cell_groups(id) on delete set null;

alter table public.cell_groups
  add constraint cell_groups_leader_participant_id_fkey
  foreign key (leader_participant_id) references public.participants(id) on delete set null;

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  cell_id uuid not null references public.cells(id) on delete restrict,
  meeting_date date not null,
  start_time time not null,
  end_time time,
  theme text not null,
  description text,
  address text not null,
  responsible_user_id uuid references public.profiles(id) on delete set null,
  status public.meeting_status not null default 'scheduled',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  finalized_by uuid references public.profiles(id) on delete set null,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete restrict,
  status public.attendance_status not null default 'not_informed',
  absence_reason text,
  notes text,
  registered_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meeting_id, participant_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type public.notification_type not null default 'meeting',
  read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

create table public.participant_notes (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  note text not null,
  private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_cells_active on public.cells(active);
create index idx_cell_users_user_id on public.cell_users(user_id);
create index idx_cell_users_cell_id on public.cell_users(cell_id);
create index idx_cell_groups_cell_id on public.cell_groups(cell_id);
create index idx_cell_groups_leader_profile_id on public.cell_groups(leader_profile_id);
create index idx_participants_cell_id on public.participants(cell_id);
create index idx_participants_group_id on public.participants(group_id);
create index idx_participants_active on public.participants(active);
create index idx_participants_type on public.participants(participant_type);
create index idx_participants_status on public.participants(status);
create index idx_participants_birth_date on public.participants(birth_date);
create unique index participants_cell_email_unique
  on public.participants(cell_id, lower(email))
  where email is not null and email <> '';
create unique index participants_cell_whatsapp_unique
  on public.participants(cell_id, whatsapp)
  where whatsapp is not null and whatsapp <> '';
create index idx_meetings_cell_date on public.meetings(cell_id, meeting_date desc);
create index idx_attendance_meeting_id on public.attendance(meeting_id);
create index idx_attendance_participant_id on public.attendance(participant_id);
create index idx_attendance_status on public.attendance(status);
create index idx_notifications_user_read on public.notifications(user_id, read);
create index idx_audit_logs_table_record on public.audit_logs(table_name, record_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_cells_updated_at
before update on public.cells
for each row execute function public.set_updated_at();

create trigger set_cell_groups_updated_at
before update on public.cell_groups
for each row execute function public.set_updated_at();

create trigger set_participants_updated_at
before update on public.participants
for each row execute function public.set_updated_at();

create trigger set_meetings_updated_at
before update on public.meetings
for each row execute function public.set_updated_at();

create trigger set_attendance_updated_at
before update on public.attendance
for each row execute function public.set_updated_at();

create trigger set_participant_notes_updated_at
before update on public.participant_notes
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid() and active = true
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.cell_role(target_cell_id uuid)
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select cu.role_in_cell
  from public.cell_users cu
  where cu.cell_id = target_cell_id
    and cu.user_id = auth.uid()
    and cu.active = true
  limit 1
$$;

create or replace function public.current_user_group_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select group_id from public.profiles where id = auth.uid() and active = true
$$;

create or replace function public.can_access_cell(target_cell_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.cell_users cu
      where cu.cell_id = target_cell_id
        and cu.user_id = auth.uid()
        and cu.active = true
    )
$$;

create or replace function public.can_manage_cell_people(target_cell_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin()
    or public.cell_role(target_cell_id) in ('leader', 'assistant')
$$;

create or replace function public.can_manage_cell_core(target_cell_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin()
    or (
      public.cell_role(target_cell_id) = 'leader'
      and public.current_user_group_id() is null
    )
$$;

create or replace function public.can_access_participant(target_participant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.participants p
    where p.id = target_participant_id
      and (
        public.is_admin()
        or (
          public.current_user_group_id() is null
          and public.can_access_cell(p.cell_id)
        )
        or (
          p.group_id = public.current_user_group_id()
          and p.participant_type <> 'visitor'
        )
      )
  )
$$;

create or replace function public.can_manage_participant(target_participant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.participants p
    where p.id = target_participant_id
      and (
        public.is_admin()
        or (
          public.current_user_group_id() is null
          and public.can_manage_cell_people(p.cell_id)
        )
        or (
          p.group_id = public.current_user_group_id()
          and p.participant_type <> 'visitor'
          and public.cell_role(p.cell_id) in ('leader', 'assistant')
        )
      )
  )
$$;

create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = new.id and old.role is distinct from new.role then
    raise exception 'Users cannot change their own role.';
  end if;
  return new;
end;
$$;

create trigger prevent_profiles_self_role_change
before update on public.profiles
for each row execute function public.prevent_role_self_escalation();

create or replace function public.audit_row_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_record uuid;
begin
  changed_record := coalesce(new.id, old.id);

  insert into public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  )
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    changed_record,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

create trigger audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.audit_row_changes();

create trigger audit_cells
after insert or update or delete on public.cells
for each row execute function public.audit_row_changes();

create trigger audit_cell_groups
after insert or update or delete on public.cell_groups
for each row execute function public.audit_row_changes();

create trigger audit_participants
after insert or update or delete on public.participants
for each row execute function public.audit_row_changes();

create trigger audit_meetings
after insert or update or delete on public.meetings
for each row execute function public.audit_row_changes();

create trigger audit_attendance
after insert or update or delete on public.attendance
for each row execute function public.audit_row_changes();

create trigger audit_participant_notes
after insert or update or delete on public.participant_notes
for each row execute function public.audit_row_changes();

alter table public.profiles enable row level security;
alter table public.cells enable row level security;
alter table public.cell_users enable row level security;
alter table public.cell_groups enable row level security;
alter table public.participants enable row level security;
alter table public.meetings enable row level security;
alter table public.attendance enable row level security;
alter table public.notifications enable row level security;
alter table public.participant_notes enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_self_or_admin
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy profiles_admin_all
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

create policy profiles_update_self_without_role
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_user_role());

create policy cells_select_allowed
on public.cells for select
using (public.can_access_cell(id));

create policy cells_admin_insert
on public.cells for insert
with check (public.is_admin());

create policy cells_admin_update
on public.cells for update
using (public.is_admin())
with check (public.is_admin());

create policy cells_admin_delete
on public.cells for delete
using (public.is_admin());

create policy cell_users_select_allowed
on public.cell_users for select
using (public.is_admin() or user_id = auth.uid() or public.can_access_cell(cell_id));

create policy cell_users_admin_all
on public.cell_users for all
using (public.is_admin())
with check (public.is_admin());

create policy cell_groups_select_allowed
on public.cell_groups for select
using (
  public.can_access_cell(cell_id)
  and (
    public.is_admin()
    or public.current_user_group_id() is null
    or id = public.current_user_group_id()
  )
);

create policy cell_groups_insert_core
on public.cell_groups for insert
with check (public.can_manage_cell_core(cell_id));

create policy cell_groups_update_core
on public.cell_groups for update
using (public.can_manage_cell_core(cell_id))
with check (public.can_manage_cell_core(cell_id));

create policy cell_groups_delete_admin_only
on public.cell_groups for delete
using (public.is_admin());

create policy participants_select_allowed
on public.participants for select
using (public.can_access_participant(id));

create policy participants_insert_leader_or_assistant
on public.participants for insert
with check (
  public.is_admin()
  or (
    public.current_user_group_id() is null
    and public.cell_role(cell_id) = 'leader'
  )
  or (
    public.current_user_group_id() is not null
    and group_id = public.current_user_group_id()
    and participant_type <> 'visitor'
    and public.cell_role(cell_id) = 'leader'
  )
  or (public.cell_role(cell_id) = 'assistant' and participant_type = 'visitor')
);

create policy participants_update_admin_or_leader
on public.participants for update
using (public.can_manage_participant(id))
with check (
  public.is_admin()
  or (
    public.current_user_group_id() is null
    and public.cell_role(cell_id) = 'leader'
  )
  or (
    public.current_user_group_id() is not null
    and group_id = public.current_user_group_id()
    and participant_type <> 'visitor'
    and public.cell_role(cell_id) = 'leader'
  )
);

create policy participants_delete_admin_only
on public.participants for delete
using (public.is_admin());

create policy meetings_select_allowed
on public.meetings for select
using (public.can_access_cell(cell_id));

create policy meetings_insert_leader
on public.meetings for insert
with check (public.can_manage_cell_core(cell_id));

create policy meetings_update_leader_or_admin
on public.meetings for update
using (public.can_manage_cell_core(cell_id))
with check (public.can_manage_cell_core(cell_id));

create policy meetings_delete_admin_only
on public.meetings for delete
using (public.is_admin());

create policy attendance_select_allowed
on public.attendance for select
using (
  exists (
    select 1 from public.meetings m
    where m.id = meeting_id
      and public.can_access_cell(m.cell_id)
      and public.can_access_participant(participant_id)
  )
);

create policy attendance_insert_allowed
on public.attendance for insert
with check (
  exists (
    select 1 from public.meetings m
    join public.participants p on p.id = participant_id and p.cell_id = m.cell_id
    where m.id = meeting_id
      and (
        public.is_admin()
        or (
          public.current_user_group_id() is null
          and public.can_manage_cell_people(m.cell_id)
        )
        or (
          p.group_id = public.current_user_group_id()
          and p.participant_type <> 'visitor'
          and public.cell_role(m.cell_id) in ('leader', 'assistant')
        )
      )
  )
);

create policy attendance_update_allowed
on public.attendance for update
using (
  exists (
    select 1 from public.meetings m
    join public.participants p on p.id = participant_id and p.cell_id = m.cell_id
    where m.id = meeting_id
      and (
        public.is_admin()
        or (
          public.current_user_group_id() is null
          and public.cell_role(m.cell_id) = 'leader'
        )
        or (
          p.group_id = public.current_user_group_id()
          and p.participant_type <> 'visitor'
          and public.cell_role(m.cell_id) in ('leader', 'assistant')
          and m.status <> 'finalized'
        )
        or (
          public.current_user_group_id() is null
          and public.cell_role(m.cell_id) = 'assistant'
          and m.status <> 'finalized'
        )
      )
  )
)
with check (
  exists (
    select 1 from public.meetings m
    join public.participants p on p.id = participant_id and p.cell_id = m.cell_id
    where m.id = meeting_id
      and (
        public.is_admin()
        or (
          public.current_user_group_id() is null
          and public.cell_role(m.cell_id) = 'leader'
        )
        or (
          p.group_id = public.current_user_group_id()
          and p.participant_type <> 'visitor'
          and public.cell_role(m.cell_id) in ('leader', 'assistant')
          and m.status <> 'finalized'
        )
        or (
          public.current_user_group_id() is null
          and public.cell_role(m.cell_id) = 'assistant'
          and m.status <> 'finalized'
        )
      )
  )
);

create policy attendance_delete_admin_only
on public.attendance for delete
using (public.is_admin());

create policy notifications_select_own
on public.notifications for select
using (user_id = auth.uid() or public.is_admin());

create policy notifications_update_own_read
on public.notifications for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy notifications_insert_admin
on public.notifications for insert
with check (public.is_admin());

create policy participant_notes_select_allowed
on public.participant_notes for select
using (
  exists (
    select 1 from public.participants p
    where p.id = participant_id
      and public.can_access_participant(p.id)
  )
);

create policy participant_notes_insert_allowed
on public.participant_notes for insert
with check (
  exists (
    select 1 from public.participants p
    where p.id = participant_id
      and public.can_manage_participant(p.id)
  )
);

create policy participant_notes_update_author_or_admin
on public.participant_notes for update
using (author_id = auth.uid() or public.is_admin())
with check (author_id = auth.uid() or public.is_admin());

create policy audit_logs_select_admin
on public.audit_logs for select
using (public.is_admin());

create policy audit_logs_insert_system
on public.audit_logs for insert
with check (auth.uid() is not null);

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', false),
  ('participant-photos', 'participant-photos', false),
  ('cell-covers', 'cell-covers', true)
on conflict (id) do nothing;

create policy storage_avatars_read_own_or_admin
on storage.objects for select
using (
  bucket_id in ('avatars', 'participant-photos', 'cell-covers')
  and auth.uid() is not null
);

create policy storage_authenticated_uploads
on storage.objects for insert
with check (
  bucket_id in ('avatars', 'participant-photos', 'cell-covers')
  and auth.uid() is not null
);

create policy storage_owner_or_admin_updates
on storage.objects for update
using (owner = auth.uid() or public.is_admin())
with check (owner = auth.uid() or public.is_admin());

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
on
  public.cells,
  public.cell_groups,
  public.cell_users,
  public.profiles,
  public.participants,
  public.meetings,
  public.attendance,
  public.notifications,
  public.participant_notes,
  public.audit_logs
to authenticated, service_role;

grant usage, select on all sequences in schema public to authenticated, service_role;
