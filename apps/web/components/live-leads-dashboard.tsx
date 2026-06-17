"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  MessageSquareText,
  Phone,
  Radio,
  RefreshCw,
  Search,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LeadComment = {
  id: string;
  original_comment: string;
  clean_content: string | null;
  tiktok_username: string | null;
  tiktok_user_id: string | null;
  phone_is_potential_typo: boolean;
  raw_phone_candidate: string | null;
  comment_timestamp: string;
  created_at: string;
};

type Lead = {
  id: string;
  display_phone: string;
  latest_clean_content: string | null;
  comment_count: number;
  status: string;
  last_comment_at: string;
  last_called_at: string | null;
  has_new_comment_after_call: boolean;
  tiktok_username: string | null;
  tiktok_user_id: string | null;
  phone_is_potential_typo: boolean;
  raw_phone_candidate: string | null;
};

type ViewMode = "waiting" | "confirmed";

type LiveSession = {
  id: string;
  tiktok_username: string;
  title: string | null;
  status: string;
  created_at: string;
};

type LiveLeadsResponse = {
  session: LiveSession;
  leads: Lead[];
  serverTime: string;
};

const dashboardPollMs = 10_000;

async function cleanupConfirmedForSession(sessionId: string) {
  const response = await fetch(
    `/api/cron/cleanup-confirmed?session=${encodeURIComponent(sessionId)}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload.error ?? "Could not clean confirmed leads.");
  }
}

export function LiveLeadsDashboard({
  initialSessionId,
}: {
  initialSessionId: string | null;
}) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessionId,
  );
  const [tiktokInput, setTiktokInput] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<LiveLeadsResponse | null>(null);
  const [selectedComments, setSelectedComments] = useState<LeadComment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(initialSessionId));
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("waiting");

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    const sessionId = activeSessionId;
    let cancelled = false;

    async function loadLeads() {
      try {
        await cleanupConfirmedForSession(sessionId);
        const response = await fetch(
          `/api/live-sessions/${sessionId}/leads`,
          { cache: "no-store" },
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load live leads.");
        }

        if (!cancelled) {
          setData(payload);
          setError(null);
          setLastRefresh(new Date());
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Could not load data.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLeads();
    const interval = window.setInterval(loadLeads, dashboardPollMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeSessionId]);

  const leads = useMemo(() => data?.leads ?? [], [data]);
  const activeLeads = useMemo(
    () => leads.filter((lead) => lead.status !== "confirmed"),
    [leads],
  );
  const confirmedCount = useMemo(
    () => leads.filter((lead) => lead.status === "confirmed").length,
    [leads],
  );
  const visibleLeads = useMemo(() => {
    if (viewMode === "confirmed") {
      return leads.filter((lead) => lead.status === "confirmed");
    }

    return activeLeads;
  }, [activeLeads, leads, viewMode]);
  const sameAccountCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const lead of leads) {
      if (!lead.tiktok_user_id) {
        continue;
      }

      counts.set(lead.tiktok_user_id, (counts.get(lead.tiktok_user_id) ?? 0) + 1);
    }

    return counts;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return visibleLeads;
    }

    return visibleLeads.filter((lead) => {
      return (
        lead.display_phone.toLowerCase().includes(normalizedQuery) ||
        lead.status.toLowerCase().includes(normalizedQuery) ||
        (lead.latest_clean_content ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [visibleLeads, query]);

  const effectiveSelectedLeadId =
    selectedLeadId && visibleLeads.some((lead) => lead.id === selectedLeadId)
      ? selectedLeadId
      : (filteredLeads[0]?.id ?? null);
  const selectedLead =
    visibleLeads.find((lead) => lead.id === effectiveSelectedLeadId) ?? null;

  useEffect(() => {
    if (!effectiveSelectedLeadId) {
      return;
    }

    let cancelled = false;

    async function loadComments() {
      try {
        const response = await fetch(
          `/api/leads/${effectiveSelectedLeadId}/comments`,
          {
            cache: "no-store",
          },
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load comments.");
        }

        if (!cancelled) {
          setSelectedComments(payload.comments ?? []);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load comments.",
          );
        }
      }
    }

    void loadComments();
    const interval = window.setInterval(loadComments, dashboardPollMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [effectiveSelectedLeadId]);

  const stats = useMemo(
    () => ({
      waiting: activeLeads.length,
      confirmed: confirmedCount,
      comments: leads.reduce((sum, lead) => sum + lead.comment_count, 0),
    }),
    [activeLeads, confirmedCount, leads],
  );
  const isSessionRunning = data?.session.status === "running";

  function selectViewMode(nextViewMode: ViewMode) {
    setViewMode(nextViewMode);
    setSelectedLeadId(null);
    setSelectedComments([]);

    void refreshLeads(activeSessionId).catch((caught) => {
      setError(
        caught instanceof Error ? caught.message : "Could not refresh live leads.",
      );
    });
  }

  async function startLiveSession() {
    setStarting(true);
    setError(null);

    try {
      const response = await fetch("/api/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sessionTitle,
          tiktokInput,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not start live session.");
      }

      const nextSessionId = payload.session.id;
      setSelectedLeadId(null);
      setSelectedComments([]);
      setLoading(true);
      setActiveSessionId(nextSessionId);
      window.history.replaceState(
        null,
        "",
        `/live-sessions?session=${nextSessionId}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not start session.",
      );
    } finally {
      setStarting(false);
    }
  }

  async function stopLiveSession() {
    if (!activeSessionId) {
      return;
    }

    setStopping(true);
    setError(null);

    try {
      const response = await fetch(`/api/live-sessions/${activeSessionId}`, {
        method: "PATCH",
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not stop live session.");
      }

      setActiveSessionId(null);
      setData(null);
      setSelectedLeadId(null);
      setSelectedComments([]);
      setViewMode("waiting");
      setLastRefresh(null);
      window.history.replaceState(null, "", "/live-sessions");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not stop session.",
      );
    } finally {
      setStopping(false);
    }
  }

  async function cleanupConfirmedNow() {
    setCleaning(true);
    setError(null);

    try {
      const sessionParam = activeSessionId
        ? `&session=${encodeURIComponent(activeSessionId)}`
        : "";
      const response = await fetch(
        `/api/cron/cleanup-confirmed?force=1${sessionParam}`,
        {
          cache: "no-store",
        },
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not clean confirmed leads.");
      }

      setSelectedLeadId(null);
      setSelectedComments([]);
      setData((current) =>
        current
          ? {
              ...current,
              leads: current.leads.filter((lead) => lead.status !== "confirmed"),
            }
          : current,
      );
      await refreshLeads(activeSessionId);
      setViewMode("waiting");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Cleanup failed.");
    } finally {
      setCleaning(false);
    }
  }

  async function setLeadConfirmed(lead: Lead, confirmed: boolean) {
    setSavingLeadId(lead.id);
    if (confirmed) {
      setSelectedLeadId(null);
      setSelectedComments([]);
    }
    setData((current) =>
      current
        ? {
            ...current,
            leads: current.leads.map((item) =>
              item.id === lead.id
                ? {
                    ...item,
                    status: confirmed ? "confirmed" : "new",
                    last_called_at: confirmed ? new Date().toISOString() : null,
                    has_new_comment_after_call: false,
                  }
                : item,
            ),
          }
        : current,
    );

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update lead.");
      }
      await refreshLeads(activeSessionId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update lead.");
    } finally {
      setSavingLeadId(null);
    }
  }

  async function refreshLeads(sessionId: string | null) {
    if (!sessionId) {
      return;
    }

    await cleanupConfirmedForSession(sessionId);
    const response = await fetch(`/api/live-sessions/${sessionId}/leads`, {
      cache: "no-store",
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not refresh live leads.");
    }

    setData(payload);
    setLastRefresh(new Date());
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                <Radio size={16} aria-hidden="true" />
                Live Leads
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Phone numbers from TikTok LIVE
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Call waiting numbers, then confirm clients to remove them from the waiting list.
              </p>
              {data?.session ? (
                <div className="mt-3 inline-flex rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
                  Current session: {data.session.title ?? "Untitled"} - @
                  {data.session.tiktok_username} ({data.session.status})
                </div>
              ) : (
                <div className="mt-3 inline-flex rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Paste a TikTok LIVE URL or username, then start a live session.
                </div>
              )}
            </div>

            <Card className="lg:min-w-[34rem]">
              <CardContent className="grid gap-3 p-3">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <Input
                    onChange={(event) => setTiktokInput(event.target.value)}
                    placeholder="Paste TikTok URL or @username"
                    value={tiktokInput}
                    aria-label="TikTok LIVE URL or username"
                  />
                  <Input
                    onChange={(event) => setSessionTitle(event.target.value)}
                    placeholder="Session title optional"
                    value={sessionTitle}
                    aria-label="Session title"
                  />
                </div>
                <Button
                  disabled={starting || tiktokInput.trim().length === 0}
                  onClick={startLiveSession}
                  type="button"
                >
                  {starting ? "Starting..." : "Start live session"}
                </Button>
                {activeSessionId ? (
                  <Button
                    disabled={stopping || !isSessionRunning}
                    onClick={stopLiveSession}
                    type="button"
                    variant="outline"
                  >
                    {stopping ? "Stopping..." : "Stop live session"}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-2">
            <StatCard
              active={viewMode === "waiting"}
              description="Numbers still waiting for manual confirmation."
              label="Waiting"
              onClick={() => selectViewMode("waiting")}
              value={stats.waiting}
            />
            <StatCard
              active={viewMode === "confirmed"}
              description="Clients already confirmed by the operator."
              label="Confirmed"
              onClick={() => selectViewMode("confirmed")}
              value={stats.confirmed}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[24rem_minmax(0,1fr)] lg:px-8">
        <aside className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw size={16} aria-hidden="true" />
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : "Waiting"}
          </div>

          <div className="relative mb-3">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
              aria-hidden="true"
            />
            <Input
              className="pl-10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search number or content"
              type="search"
              value={query}
            />
          </div>

          {error ? <ErrorState message={error} /> : null}
          {!error && loading ? <LoadingList /> : null}
          {!error && !loading && filteredLeads.length === 0 ? <EmptyList /> : null}

          {viewMode === "confirmed" && stats.confirmed > 0 ? (
            <Button
              className="mb-3 w-full"
              disabled={cleaning}
              onClick={cleanupConfirmedNow}
              type="button"
              variant="destructive"
            >
              {cleaning ? "Cleaning..." : "Remove confirmed now"}
            </Button>
          ) : null}

          <div className="flex flex-col gap-2">
            {filteredLeads.map((lead) => (
              <PhoneListItem
                key={lead.id}
                active={effectiveSelectedLeadId === lead.id}
                sameAccountCount={
                  lead.tiktok_user_id
                    ? (sameAccountCounts.get(lead.tiktok_user_id) ?? 1)
                    : 1
                }
                lead={lead}
                onClick={() => setSelectedLeadId(lead.id)}
              />
            ))}
          </div>

        </aside>

        <section className="min-w-0">
          {selectedLead ? (
            <LeadDetails
              lead={selectedLead}
              comments={selectedComments}
              sameAccountLeads={
                selectedLead.tiktok_user_id
                  ? leads.filter(
                      (lead) =>
                        lead.tiktok_user_id === selectedLead.tiktok_user_id &&
                        lead.id !== selectedLead.id,
                    )
                  : []
              }
              saving={savingLeadId === selectedLead.id}
              onConfirmedChange={(confirmed) =>
                setLeadConfirmed(selectedLead, confirmed)
              }
            />
          ) : (
            <EmptyDetails />
          )}
        </section>
      </section>
    </main>
  );
}

function PhoneListItem({
  active,
  lead,
  onClick,
  sameAccountCount,
}: {
  active: boolean;
  lead: Lead;
  onClick: () => void;
  sameAccountCount: number;
}) {
  return (
    <button
      className={cn(
        "w-full rounded-lg border bg-card p-4 text-left shadow-sm transition",
        active
          ? "border-ring ring-2 ring-ring/15"
          : "border-border hover:border-ring/50",
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-bold text-card-foreground">
            {lead.display_phone}
          </div>
          <div className="mt-1 truncate text-sm text-muted-foreground">
            {lead.latest_clean_content || "Phone only"}
          </div>
        </div>
        <CalledMark confirmed={lead.status === "confirmed"} called={isCalled(lead)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge>
          {lead.comment_count} comments
        </Badge>
        {lead.has_new_comment_after_call ? (
          <Badge variant="outline">
            New after call
          </Badge>
        ) : null}
        {lead.phone_is_potential_typo ? (
          <Badge variant="outline">
            Possible typo
          </Badge>
        ) : null}
        {sameAccountCount > 1 ? (
          <Badge variant="outline">
            Same account: {sameAccountCount} numbers
          </Badge>
        ) : null}
      </div>
    </button>
  );
}

function LeadDetails({
  comments,
  lead,
  onConfirmedChange,
  sameAccountLeads,
  saving,
}: {
  comments: LeadComment[];
  lead: Lead;
  onConfirmedChange: (confirmed: boolean) => void;
  sameAccountLeads: Lead[];
  saving: boolean;
}) {
  const confirmed = lead.status === "confirmed";

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-2xl font-bold text-card-foreground">
              <Phone size={22} aria-hidden="true" />
              {lead.display_phone}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Latest: {lead.latest_clean_content || "phone only"}
            </p>
            {lead.phone_is_potential_typo ? (
              <div className="mt-3">
                <Badge variant="outline">
                  Possible typo: {lead.raw_phone_candidate ?? lead.display_phone}
                </Badge>
              </div>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3">
            <input
              checked={confirmed}
              className="h-5 w-5 accent-primary"
              disabled={saving}
              onChange={(event) => onConfirmedChange(event.target.checked)}
              type="checkbox"
            />
            <span className="font-semibold text-foreground">
              {saving ? "Saving..." : "Confirmed client"}
            </span>
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <InfoTile label="Status" value={lead.status.replaceAll("_", " ")} />
          <InfoTile label="Comments" value={String(lead.comment_count)} />
          <InfoTile
            label="Last comment"
            value={formatDate(lead.last_comment_at)}
          />
        </div>
        {sameAccountLeads.length > 0 ? (
          <div className="mt-4 rounded-lg border border-border bg-accent p-3 text-sm text-accent-foreground">
            <div className="font-semibold">
              Same TikTok account also used other numbers:
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {sameAccountLeads.map((item) => (
                <Badge key={item.id} variant="secondary">
                  {item.display_phone}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
          <MessageSquareText size={20} aria-hidden="true" />
          Comments from this number
        </h2>

        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg bg-muted p-4">
              <div className="text-base font-semibold text-foreground">
                {comment.clean_content || "(phone only)"}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {comment.original_comment}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{comment.tiktok_username ?? "TikTok user"}</span>
                <span>-</span>
                <span>{formatDate(comment.comment_timestamp)}</span>
                {comment.phone_is_potential_typo ? (
                  <>
                    <span>-</span>
                    <Badge variant="outline">
                      Recovered from {comment.raw_phone_candidate}
                    </Badge>
                  </>
                ) : null}
              </div>
            </div>
          ))}
          {comments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No comments loaded for this number yet.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  active,
  description,
  label,
  onClick,
  value,
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
  value: number;
}) {
  return (
    <button
      className={cn(
        "flex h-full min-h-32 flex-col justify-between rounded-lg border bg-card p-5 text-left shadow-sm transition",
        active
          ? "border-ring ring-2 ring-ring/15"
          : "border-border hover:border-ring/50",
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-3xl font-bold text-card-foreground">{value}</div>
          <div className="mt-1 text-sm font-medium text-card-foreground">
            {label}
          </div>
        </div>
        <Badge variant={active ? "default" : "secondary"}>
          {active ? "Viewing" : "Open"}
        </Badge>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-semibold text-foreground">{value}</div>
    </div>
  );
}

function CalledMark({
  called,
  confirmed,
}: {
  called: boolean;
  confirmed: boolean;
}) {
  if (!called && !confirmed) {
    return (
      <Badge>
        Not called
      </Badge>
    );
  }

  if (!confirmed) {
    return (
      <Badge variant="outline">
        Called
      </Badge>
    );
  }

  return (
    <Badge variant="default">
      <Check size={13} aria-hidden="true" />
      Confirmed
    </Badge>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Alert className="mb-3 border-destructive/30 text-destructive">
      <div className="flex items-center gap-2 font-semibold">
        <AlertCircle size={18} aria-hidden="true" />
        Could not load leads
      </div>
      <p className="mt-1 text-sm">{message}</p>
    </Alert>
  );
}

function LoadingList() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-24" />
      ))}
    </div>
  );
}

function EmptyList() {
  return (
    <Card className="border-dashed">
      <CardHeader className="items-center text-center">
        <CardTitle>No numbers yet</CardTitle>
        <CardDescription>
          Valid phone comments will appear here.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function EmptyDetails() {
  return (
    <Card className="border-dashed">
      <CardHeader className="items-center p-10 text-center">
        <CardTitle>Select a phone number</CardTitle>
        <CardDescription>
          Comments and call status will show here.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function isCalled(lead: Lead) {
  return lead.status !== "new" || lead.last_called_at !== null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
