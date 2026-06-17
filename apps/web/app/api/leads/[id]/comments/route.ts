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
  tiktok_user_id: z.string().nullable(),
  phone_is_potential_typo: z.boolean(),
  raw_phone_candidate: z.string().nullable(),
  comment_timestamp: z.string(),
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
  const { data, error } = await supabase
    .from("lead_comments")
    .select(
      "id, original_comment, clean_content, tiktok_username, tiktok_user_id, phone_is_potential_typo, raw_phone_candidate, comment_timestamp, created_at",
    )
    .eq("lead_id", id)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    comments: z.array(leadCommentSchema).parse(data),
  });
}
