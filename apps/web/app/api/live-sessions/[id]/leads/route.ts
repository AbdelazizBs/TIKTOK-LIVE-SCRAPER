import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSupabaseAdminClient,
  hasSupabaseAdminEnv,
} from "@/lib/supabase-admin";

const leadCommentSchema = z.object({
  id: z.string(),
  original_comment: z.string(),
  clean_content: z.string().nullable(),
  tiktok_username: z.string().nullable(),
  comment_timestamp: z.string(),
  created_at: z.string(),
});

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
  lead_comments: z.array(leadCommentSchema),
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
          "lead_comments(id, original_comment, clean_content, tiktok_username, comment_timestamp, created_at)",
        ].join(","),
      )
      .eq("live_session_id", id)
      .order("last_comment_at", { ascending: false })
      .order("created_at", {
        ascending: true,
        referencedTable: "lead_comments",
      }),
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

  return NextResponse.json({
    session,
    leads,
    serverTime: new Date().toISOString(),
  });
}
