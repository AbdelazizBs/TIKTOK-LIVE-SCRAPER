import "dotenv/config";

import { createHash } from "node:crypto";
import { Command } from "commander";
import pino from "pino";
import { createClient } from "@supabase/supabase-js";
import {
  ControlEvent,
  TikTokLiveConnection,
  WebcastEvent,
  type WebcastChatMessage,
} from "tiktok-live-connector";
import { z } from "zod";
import { extractTunisiaPhoneLead } from "@live-leads/shared";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
});

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const program = new Command()
  .name("collector")
  .description("Local TikTok LIVE comment collector for Live Leads.")
  .option("--username <username>", "TikTok unique ID without @")
  .requiredOption("--session <liveSessionId>", "Supabase live_sessions.id")
  .option("--mock", "Use fake comments instead of TikTok")
  .parse(process.argv);

const options = program.opts<{
  username?: string;
  session: string;
  mock?: boolean;
}>();

if (!options.mock && !options.username) {
  logger.error("Pass --username unless you are using --mock.");
  process.exit(1);
}

const env = envSchema.safeParse(process.env);

if (!env.success) {
  logger.error({ issues: env.error.issues }, "Collector environment is invalid.");
  process.exit(1);
}

const supabase = createClient(
  env.data.SUPABASE_URL,
  env.data.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

const mockComments = [
  "98421295",
  "robe noire taille M 98421295",
  "+216 98 421 295 rouge L",
  "prix svp",
  "21698421295 confirm",
];

type LiveSession = {
  id: string;
  org_id: string;
  tiktok_username: string;
};

type Lead = {
  id: string;
  comment_count: number;
  last_called_at: string | null;
};

await main();

async function main() {
  const liveSession = await getLiveSession(options.session);

  logger.info(
    {
      session: liveSession.id,
      username: options.username ?? liveSession.tiktok_username,
      mock: options.mock ?? false,
    },
    "Collector started.",
  );

  if (options.mock) {
    for (const comment of mockComments) {
      await ingestComment({
        liveSession,
        originalComment: comment,
        tiktokUsername: "mock_user",
        tiktokUserId: "mock-user-id",
        commentTimestamp: new Date().toISOString(),
      });
    }

    logger.info("Mock collector finished.");
    return;
  }

  await startTikTokCollector({
    liveSession,
    username: options.username,
  });
}

async function getLiveSession(sessionId: string): Promise<LiveSession> {
  const { data, error } = await supabase
    .from("live_sessions")
    .select("id, org_id, tiktok_username")
    .eq("id", sessionId)
    .single();

  if (error) {
    logger.error({ error, sessionId }, "Could not load live session.");
    process.exit(1);
  }

  return data;
}

async function ingestComment(input: {
  liveSession: LiveSession;
  originalComment: string;
  tiktokUsername?: string;
  tiktokUserId?: string;
  commentTimestamp: string;
}) {
  const extracted = extractTunisiaPhoneLead(input.originalComment);

  if (!extracted) {
    logger.info({ comment: input.originalComment }, "Skipped comment without phone.");
    return;
  }

  const phoneHash = hashPhone(extracted.phoneE164);
  const existingLead = await findLead(input.liveSession.id, phoneHash);

  if (!existingLead) {
    const lead = await createLead({
      liveSession: input.liveSession,
      phoneHash,
      originalComment: input.originalComment,
      cleanContent: extracted.cleanContent,
      phoneE164: extracted.phoneE164,
      displayPhone: extracted.displayPhone,
      tiktokUsername: input.tiktokUsername,
      tiktokUserId: input.tiktokUserId,
      commentTimestamp: input.commentTimestamp,
    });

    await appendLeadComment(lead.id, input, extracted);
    logger.info({ leadId: lead.id, phone: extracted.displayPhone }, "Created lead.");
    return;
  }

  await updateLead({
    lead: existingLead,
    originalComment: input.originalComment,
    cleanContent: extracted.cleanContent,
    tiktokUsername: input.tiktokUsername,
    tiktokUserId: input.tiktokUserId,
    commentTimestamp: input.commentTimestamp,
  });
  await appendLeadComment(existingLead.id, input, extracted);

  logger.info(
    { leadId: existingLead.id, phone: extracted.displayPhone },
    "Updated existing lead.",
  );
}

async function findLead(
  liveSessionId: string,
  phoneHash: string,
): Promise<Lead | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, comment_count, last_called_at")
    .eq("live_session_id", liveSessionId)
    .eq("phone_hash", phoneHash)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function createLead(input: {
  liveSession: LiveSession;
  phoneHash: string;
  originalComment: string;
  cleanContent: string;
  phoneE164: string;
  displayPhone: string;
  tiktokUsername?: string;
  tiktokUserId?: string;
  commentTimestamp: string;
}): Promise<Lead> {
  const { data, error } = await supabase
    .from("leads")
    .insert({
      org_id: input.liveSession.org_id,
      live_session_id: input.liveSession.id,
      phone_e164: input.phoneE164,
      phone_hash: input.phoneHash,
      display_phone: input.displayPhone,
      first_comment: input.originalComment,
      latest_comment: input.originalComment,
      latest_clean_content: input.cleanContent,
      comment_count: 1,
      tiktok_username: input.tiktokUsername,
      tiktok_user_id: input.tiktokUserId,
      last_comment_at: input.commentTimestamp,
    })
    .select("id, comment_count, last_called_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateLead(input: {
  lead: Lead;
  originalComment: string;
  cleanContent: string;
  tiktokUsername?: string;
  tiktokUserId?: string;
  commentTimestamp: string;
}) {
  const hasNewCommentAfterCall =
    input.lead.last_called_at !== null &&
    new Date(input.commentTimestamp).getTime() >
      new Date(input.lead.last_called_at).getTime();

  const { error } = await supabase
    .from("leads")
    .update({
      latest_comment: input.originalComment,
      latest_clean_content: input.cleanContent,
      comment_count: input.lead.comment_count + 1,
      tiktok_username: input.tiktokUsername,
      tiktok_user_id: input.tiktokUserId,
      last_comment_at: input.commentTimestamp,
      has_new_comment_after_call: hasNewCommentAfterCall,
    })
    .eq("id", input.lead.id);

  if (error) {
    throw error;
  }
}

async function appendLeadComment(
  leadId: string,
  input: {
    originalComment: string;
    tiktokUsername?: string;
    tiktokUserId?: string;
    commentTimestamp: string;
  },
  extracted: {
    phoneE164: string;
    cleanContent: string;
  },
) {
  const { error } = await supabase.from("lead_comments").insert({
    lead_id: leadId,
    original_comment: input.originalComment,
    clean_content: extracted.cleanContent,
    phone_e164: extracted.phoneE164,
    tiktok_username: input.tiktokUsername,
    tiktok_user_id: input.tiktokUserId,
    comment_timestamp: input.commentTimestamp,
  });

  if (error) {
    throw error;
  }
}

function hashPhone(phoneE164: string): string {
  return createHash("sha256").update(phoneE164).digest("hex");
}

async function startTikTokCollector(input: {
  liveSession: LiveSession;
  username?: string;
}) {
  const username = input.username ?? input.liveSession.tiktok_username;
  let reconnectDelayMs = 3000;

  while (true) {
    const connection = new TikTokLiveConnection(username, {
      processInitialData: false,
      fetchRoomInfoOnConnect: true,
    });

    let shouldReconnect = true;

    connection.on(WebcastEvent.CHAT, async (event: WebcastChatMessage) => {
      try {
        await ingestComment({
          liveSession: input.liveSession,
          originalComment: event.comment,
          tiktokUsername: event.user?.uniqueId,
          tiktokUserId: event.user?.userId,
          commentTimestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error({ error }, "Failed to ingest TikTok comment.");
      }
    });

    connection.on(ControlEvent.CONNECTED, (state) => {
      reconnectDelayMs = 3000;
      logger.info({ roomId: state.roomId }, "Connected to TikTok LIVE.");
    });

    connection.on(ControlEvent.ERROR, (error) => {
      logger.error({ error }, "TikTok connection error.");
    });

    connection.on(ControlEvent.DISCONNECTED, (event) => {
      logger.warn({ event }, "Disconnected from TikTok LIVE.");
    });

    connection.on(WebcastEvent.STREAM_END, (event) => {
      shouldReconnect = false;
      logger.warn({ event }, "TikTok LIVE stream ended.");
    });

    try {
      await connection.connect();

      while (connection.isConnected || connection.isConnecting) {
        await sleep(1000);
      }
    } catch (error) {
      logger.error({ error, username }, "Failed to connect to TikTok LIVE.");
    } finally {
      if (connection.isConnected || connection.isConnecting) {
        await connection.disconnect();
      }
    }

    if (!shouldReconnect) {
      return;
    }

    logger.info(
      { reconnectDelayMs },
      "Waiting before reconnecting to TikTok LIVE.",
    );
    await sleep(reconnectDelayMs);
    reconnectDelayMs = Math.min(reconnectDelayMs * 2, 30000);
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
