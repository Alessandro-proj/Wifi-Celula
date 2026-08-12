import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { adminUserSchema, adminUserUpdateSchema } from "@/lib/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasServiceRole, hasSupabaseEnv, serviceRoleKey, supabaseUrl } from "@/lib/supabase/env";

type AdminClient = SupabaseClient;

export async function POST(request: Request) {
  const parsed = adminUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados invalidos." }, { status: 400 });
  }

  const context = await requireAdminContext();
  if ("response" in context) return context.response;
  const { admin } = context;
  const values = parsed.data;

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: values.email,
    password: values.password,
    email_confirm: true,
    user_metadata: { full_name: values.fullName },
  });

  if (authError || !created.user) {
    return NextResponse.json({ error: authError?.message ?? "Nao foi possivel criar o usuario." }, { status: 400 });
  }

  const response = await saveProfileData({
    admin,
    profileId: created.user.id,
    values,
  });
  if (response) return response;

  return NextResponse.json({ message: "Usuario criado com sucesso." }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const profileId = typeof body.id === "string" ? body.id : "";

  if (!profileId) {
    return NextResponse.json({ error: "Usuario nao informado." }, { status: 400 });
  }

  const parsed = adminUserUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados invalidos." }, { status: 400 });
  }

  const context = await requireAdminContext();
  if ("response" in context) return context.response;
  const { admin } = context;
  const values = parsed.data;

  const authPayload: {
    email: string;
    password?: string;
    user_metadata: { full_name: string };
  } = {
    email: values.email,
    user_metadata: { full_name: values.fullName },
  };
  if (values.password) authPayload.password = values.password;

  const { error: authError } = await admin.auth.admin.updateUserById(profileId, authPayload);
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const response = await saveProfileData({
    admin,
    profileId,
    values,
  });
  if (response) return response;

  return NextResponse.json({ message: "Usuario atualizado com sucesso." });
}

async function requireAdminContext() {
  if (!hasSupabaseEnv || !hasServiceRole) {
    return {
      response: NextResponse.json(
        { error: "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor." },
        { status: 503 },
      ),
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { response: NextResponse.json({ error: "Supabase indisponivel." }, { status: 503 }) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { response: NextResponse.json({ error: "Autenticacao obrigatoria." }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return { response: NextResponse.json({ error: "Permissao negada." }, { status: 403 }) };
  }

  return {
    admin: createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
  };
}

async function saveProfileData({
  admin,
  profileId,
  values,
}: {
  admin: AdminClient;
  profileId: string;
  values: {
    fullName: string;
    email: string;
    phone?: string;
    role: "admin" | "leader" | "assistant" | "viewer";
    cellId?: string;
    groupId?: string;
    participantId?: string;
    active?: boolean;
  };
}) {
  const { error: profileError } = await admin.from("profiles").upsert({
    id: profileId,
    full_name: values.fullName,
    email: values.email,
    phone: values.phone ?? null,
    role: values.role,
    group_id: values.groupId ?? null,
    participant_id: values.participantId ?? null,
    active: values.active ?? true,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (values.cellId) {
    const { error: cellUserError } = await admin.from("cell_users").upsert(
      {
        cell_id: values.cellId,
        user_id: profileId,
        role_in_cell: values.role,
        active: values.active ?? true,
      },
      { onConflict: "cell_id,user_id" },
    );

    if (cellUserError) {
      return NextResponse.json({ error: cellUserError.message }, { status: 400 });
    }
  }

  await admin
    .from("cell_groups")
    .update({ leader_profile_id: null, leader_participant_id: null })
    .eq("leader_profile_id", profileId);

  if (values.groupId && values.role === "leader") {
    await admin
      .from("cell_groups")
      .update({
        leader_profile_id: profileId,
        leader_participant_id: values.participantId ?? null,
      })
      .eq("id", values.groupId);
  }

  return null;
}
