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

type LeadComment = {
  id: string;
  original_comment: string;
  clean_content: string | null;
  tiktok_username: string | null;
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
  lead_comments: LeadComment[];
};

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

const defaultSessionId = "03cd42d6-fd62-403f-a39c-c7a6f2a88cb8";

export function LiveLeadsDashboard() {
  const [sessionId, setSessionId] = useState(defaultSessionId);
  const [activeSessionId, setActiveSessionId] = useState(defaultSessionId);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<LiveLeadsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLeads() {
      try {
        const response = await fetch(
          `/api/live-sessions/${activeSessionId}/leads`,
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
          setSelectedLeadId((current) => current ?? payload.leads[0]?.id ?? null);
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
    const interval = window.setInterval(loadLeads, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeSessionId]);

  const leads = useMemo(() => data?.leads ?? [], [data]);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return leads;
    }

    return leads.filter((lead) => {
      const commentText = lead.lead_comments
        .map((comment) => `${comment.clean_content} ${comment.original_comment}`)
        .join(" ")
        .toLowerCase();

      return (
        lead.display_phone.toLowerCase().includes(normalizedQuery) ||
        lead.status.toLowerCase().includes(normalizedQuery) ||
        commentText.includes(normalizedQuery)
      );
    });
  }, [leads, query]);

  const selectedLead =
    leads.find((lead) => lead.id === selectedLeadId) ?? filteredLeads[0] ?? null;

  const stats = useMemo(
    () => ({
      total: leads.length,
      called: leads.filter((lead) => isCalled(lead)).length,
      waiting: leads.filter((lead) => !isCalled(lead)).length,
      comments: leads.reduce((sum, lead) => sum + lead.comment_count, 0),
    }),
    [leads],
  );

  function activateSession() {
    const nextSessionId = sessionId.trim();

    if (nextSessionId.length > 0) {
      setSelectedLeadId(null);
      setLoading(true);
      setActiveSessionId(nextSessionId);
    }
  }

  async function setLeadCalled(lead: Lead, called: boolean) {
    setSavingLeadId(lead.id);
    setData((current) =>
      current
        ? {
            ...current,
            leads: current.leads.map((item) =>
              item.id === lead.id
                ? {
                    ...item,
                    status: called ? "called" : "new",
                    last_called_at: called ? new Date().toISOString() : null,
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
        body: JSON.stringify({ called }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update lead.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update lead.");
    } finally {
      setSavingLeadId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-700">
                <Radio size={16} aria-hidden="true" />
                Live Leads
              </div>
              <h1 className="text-3xl font-bold text-slate-950">
                Phone numbers from TikTok LIVE
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Tap a number to see all comments from that customer.
              </p>
            </div>

            <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[minmax(0,24rem)_auto]">
              <input
                className="min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-600"
                onChange={(event) => setSessionId(event.target.value)}
                value={sessionId}
                aria-label="Live session ID"
              />
              <button
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                onClick={activateSession}
                type="button"
              >
                Load
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Numbers" value={stats.total} />
            <StatCard label="Called" value={stats.called} />
            <StatCard label="Waiting" value={stats.waiting} />
            <StatCard label="Comments" value={stats.comments} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[24rem_minmax(0,1fr)] lg:px-8">
        <aside className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <RefreshCw size={16} aria-hidden="true" />
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : "Waiting"}
          </div>

          <div className="relative mb-3">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
              aria-hidden="true"
            />
            <input
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-950 outline-none focus:border-cyan-600"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search number or content"
              type="search"
              value={query}
            />
          </div>

          {error ? <ErrorState message={error} /> : null}
          {!error && loading ? <LoadingList /> : null}
          {!error && !loading && filteredLeads.length === 0 ? <EmptyList /> : null}

          <div className="space-y-2">
            {filteredLeads.map((lead) => (
              <PhoneListItem
                key={lead.id}
                active={selectedLead?.id === lead.id}
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
              saving={savingLeadId === selectedLead.id}
              onCalledChange={(called) => setLeadCalled(selectedLead, called)}
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
}: {
  active: boolean;
  lead: Lead;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "w-full rounded-lg border bg-white p-4 text-left shadow-sm transition",
        active
          ? "border-cyan-500 ring-2 ring-cyan-100"
          : "border-slate-200 hover:border-slate-300",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-bold text-slate-950">
            {lead.display_phone}
          </div>
          <div className="mt-1 truncate text-sm text-slate-600">
            {lead.latest_clean_content || "Phone only"}
          </div>
        </div>
        <CalledMark called={isCalled(lead)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-md bg-slate-100 px-2 py-1">
          {lead.comment_count} comments
        </span>
        {lead.has_new_comment_after_call ? (
          <span className="rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-700">
            New after call
          </span>
        ) : null}
      </div>
    </button>
  );
}

function LeadDetails({
  lead,
  onCalledChange,
  saving,
}: {
  lead: Lead;
  onCalledChange: (called: boolean) => void;
  saving: boolean;
}) {
  const called = isCalled(lead);

  return (
    <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-2xl font-bold text-slate-950">
              <Phone size={22} aria-hidden="true" />
              {lead.display_phone}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Latest: {lead.latest_clean_content || "phone only"}
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              checked={called}
              className="h-5 w-5 accent-cyan-700"
              disabled={saving}
              onChange={(event) => onCalledChange(event.target.checked)}
              type="checkbox"
            />
            <span className="font-semibold text-slate-950">
              {saving ? "Saving..." : "Already called"}
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
      </header>

      <div className="p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-950">
          <MessageSquareText size={20} aria-hidden="true" />
          Comments from this number
        </h2>

        <div className="space-y-3">
          {lead.lead_comments.map((comment) => (
            <div key={comment.id} className="rounded-lg bg-slate-50 p-4">
              <div className="text-base font-semibold text-slate-950">
                {comment.clean_content || "(phone only)"}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {comment.original_comment}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{comment.tiktok_username ?? "TikTok user"}</span>
                <span>-</span>
                <span>{formatDate(comment.comment_timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-2xl font-bold text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function CalledMark({ called }: { called: boolean }) {
  if (!called) {
    return (
      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
        Not called
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
      <Check size={13} aria-hidden="true" />
      Called
    </span>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
      <div className="flex items-center gap-2 font-semibold">
        <AlertCircle size={18} aria-hidden="true" />
        Could not load leads
      </div>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}

function LoadingList() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-24 animate-pulse rounded-lg border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

function EmptyList() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
      <h2 className="font-semibold text-slate-950">No numbers yet</h2>
      <p className="mt-2 text-sm text-slate-600">
        Valid phone comments will appear here.
      </p>
    </div>
  );
}

function EmptyDetails() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="font-semibold text-slate-950">Select a phone number</h2>
      <p className="mt-2 text-sm text-slate-600">
        Comments and call status will show here.
      </p>
    </div>
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
