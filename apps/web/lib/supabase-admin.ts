import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export function createSupabaseAdminClient() {
  const env = envSchema.parse(process.env);

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export function hasSupabaseAdminEnv() {
  return envSchema.safeParse(process.env).success;
}
