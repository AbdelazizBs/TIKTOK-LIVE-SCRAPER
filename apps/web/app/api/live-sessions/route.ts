import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSupabaseAdminClient,
  hasSupabaseAdminEnv,
} from "@/lib/supabase-admin";

const createLiveSessionSchema = z.object({
  title: z.string().trim().max(120).optional(),
  tiktokInput: z.string().trim().min(1).max(300),
});

export async function POST(request: Request) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json(
      { error: "Server Supabase environment is not configured." },
      { status: 500 },
    );
  }

  const body = createLiveSessionSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const tiktokUsername = parseTikTokUsername(body.data.tiktokInput);

  if (!tiktokUsername) {
    return NextResponse.json(
      { error: "Enter a valid TikTok username or LIVE URL." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (organizationError) {
    return NextResponse.json(
      { error: organizationError.message },
      { status: 500 },
    );
  }

  await supabase
    .from("live_sessions")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
    })
    .eq("org_id", organization.id)
    .eq("status", "running");

  const title =
    body.data.title?.trim() ||
    `${tiktokUsername} live ${new Date().toLocaleDateString("en-CA")}`;

  const { data: session, error } = await supabase
    .from("live_sessions")
    .insert({
      org_id: organization.id,
      tiktok_username: tiktokUsername,
      title,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id, tiktok_username, title, status, started_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session });
}

function parseTikTokUsername(input: string) {
  const value = input.trim();

  try {
    const url = new URL(value);
    const match = url.pathname.match(/@([^/]+)/);
    return match?.[1]?.replace(/^@/, "") ?? null;
  } catch {
    return value
      .replace(/^https?:\/\/(www\.)?tiktok\.com\/@/i, "")
      .replace(/\/live\/?$/i, "")
      .replace(/^@/, "")
      .trim()
      .split("/")
      .filter(Boolean)[0];
  }
}
