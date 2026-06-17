import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  hasSupabaseAdminEnv,
} from "@/lib/supabase-admin";

export async function PATCH(
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
  const { data: session, error } = await supabase
    .from("live_sessions")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "running")
    .select("id, tiktok_username, title, status, created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json(
      { error: "Live session is not running." },
      { status: 409 },
    );
  }

  return NextResponse.json({ session });
}
