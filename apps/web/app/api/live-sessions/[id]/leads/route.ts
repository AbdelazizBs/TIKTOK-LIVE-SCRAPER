import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSupabaseAdminClient,
  hasSupabaseAdminEnv,
} from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const leadSchema = z.object({
  id: z.string(),
  display_phone: z.string(),
  latest_clean_content: z.string().nullable(),
  comment_count: z.number(),
  status: z.string(),
  last_comment_at: z.string(),
  last_called_at: z.string().nullable(),
  has_new_comment_after_call: z.boolean(),
  tiktok_username: z.string().nullable(),
  tiktok_user_id: z.string().nullable(),
  phone_is_potential_typo: z.boolean(),
  raw_phone_candidate: z.string().nullable(),
});

const liveSessionSchema = z.object({
  id: z.string(),
  tiktok_username: z.string(),
  title: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json(
      { error: "Server Supabase environment is not configured." },
      { status: 500 },
    );
  }

  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();

  const [sessionResult, leadsResult] = await Promise.all([
    supabase
      .from("live_sessions")
      .select("id, tiktok_username, title, status, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("leads")
      .select(
        [
          "id",
          "display_phone",
          "latest_clean_content",
          "comment_count",
          "status",
          "last_comment_at",
          "last_called_at",
          "has_new_comment_after_call",
          "tiktok_username",
          "tiktok_user_id",
          "phone_is_potential_typo",
          "raw_phone_candidate",
        ].join(","),
      )
      .eq("live_session_id", id)
      .order("last_comment_at", { ascending: true })
      .limit(500),
  ]);

  if (sessionResult.error) {
    return NextResponse.json(
      { error: sessionResult.error.message },
      { status: 404 },
    );
  }

  if (leadsResult.error) {
    return NextResponse.json(
      { error: leadsResult.error.message },
      { status: 500 },
    );
  }

  const session = liveSessionSchema.parse(sessionResult.data);
  const leads = z.array(leadSchema).parse(leadsResult.data);

  return NextResponse.json(
    {
      session,
      leads,
      serverTime: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
