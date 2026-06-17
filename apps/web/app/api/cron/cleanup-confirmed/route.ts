import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSupabaseAdminClient,
  hasSupabaseAdminEnv,
} from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const envSchema = z.object({
  CRON_SECRET: z.string().optional(),
});

export async function GET(request: Request) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json(
      { error: "Server Supabase environment is not configured." },
      { status: 500 },
    );
  }

  const env = envSchema.parse(process.env);
  const authorization = request.headers.get("authorization");

  if (env.CRON_SECRET && authorization !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const sessionId = url.searchParams.get("session");
  const supabase = createSupabaseAdminClient();

  if (force || sessionId) {
    let deleteQuery = supabase
      .from("leads")
      .delete()
      .eq("status", "confirmed")
      .select("id");

    if (sessionId) {
      deleteQuery = deleteQuery.eq("live_session_id", sessionId);
    }

    if (!force) {
      deleteQuery = deleteQuery.lt(
        "updated_at",
        new Date(Date.now() - 30_000).toISOString(),
      );
    }

    const { data, error } = await deleteQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return noStoreJson({
      ok: true,
      deletedLeads: data?.length ?? 0,
      mode: "force",
    });
  }

  const { data, error } = await supabase.rpc("cleanup_confirmed_leads");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return noStoreJson({
    ok: true,
    deletedLeads: data ?? 0,
  });
}

function noStoreJson(body: unknown) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
