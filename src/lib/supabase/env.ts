export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const hasSupabaseEnv =
  supabaseUrl.startsWith("https://") && supabaseAnonKey.length > 20;

export const hasServiceRole = serviceRoleKey.length > 20;
