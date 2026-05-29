import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSupabaseAdminClient,
  hasSupabaseAdminEnv,
} from "@/lib/supabase-admin";

const updateLeadSchema = z.object({
  called: z.boolean(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json(
      { error: "Server Supabase environment is not configured." },
      { status: 500 },
    );
  }

  const body = updateLeadSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();

  if (!body.data.called) {
    const { error } = await supabase
      .from("leads")
      .update({
        status: "new",
        last_called_at: null,
        last_called_by: null,
        has_new_comment_after_call: false,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  const calledAt = new Date().toISOString();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .update({
      status: "called",
      last_called_at: calledAt,
      has_new_comment_after_call: false,
    })
    .eq("id", id)
    .select("id")
    .single();

  if (leadError) {
    return NextResponse.json({ error: leadError.message }, { status: 500 });
  }

  const { error: attemptError } = await supabase.from("call_attempts").insert({
    lead_id: lead.id,
    result: "called",
    note: "Marked called from dashboard.",
  });

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, calledAt });
}
