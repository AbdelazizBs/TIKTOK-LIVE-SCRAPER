import { PhoneCall, Radio, ShieldCheck } from "lucide-react";
import { supportedLocales } from "@live-leads/shared";

const features = [
  {
    Icon: PhoneCall,
    title: "Manual calls",
    copy: "Operators call from their own phones.",
  },
  {
    Icon: ShieldCheck,
    title: "Privacy first",
    copy: "Only valid phone comments are stored.",
  },
  {
    Icon: Radio,
    title: "Local collector",
    copy: "TikTok collector stays isolated.",
  },
];

const stats = [
  { label: "Collected numbers", value: "128" },
  { label: "New", value: "42" },
  { label: "Confirmed", value: "31" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-12">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="text-xl font-bold tracking-[0]">Live Leads</div>
        <div className="flex items-center gap-3">
          <select
            aria-label="Language"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            defaultValue="en"
          >
            {supportedLocales.map((locale) => (
              <option key={locale} value={locale}>
                {locale.toUpperCase()}
              </option>
            ))}
          </select>
          <a
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            href="/login"
          >
            Login
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-md bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800">
            <Radio size={16} aria-hidden="true" />
            TikTok LIVE lead capture
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
            Turn live comments into a clean call list.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
            Capture valid Tunisian phone numbers, group duplicate comments, and
            track manual confirmation calls from one internal dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              className="rounded-md bg-cyan-600 px-5 py-3 font-semibold text-white"
              href="/dashboard"
            >
              Open dashboard
            </a>
            <a
              className="rounded-md border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-950"
              href="/live-sessions"
            >
              Live sessions
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Tonight live
              </h2>
              <p className="text-sm text-slate-500">Mock preview</p>
            </div>
            <span className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              Running
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-md bg-slate-50 p-3">
                <div className="text-2xl font-bold text-slate-950">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {[
              ["+216 98 421 295", "robe noire taille M", "new"],
              ["+216 55 120 884", "pantalon beige L", "called"],
              ["+216 27 901 442", "rouge XL", "confirmed"],
            ].map(([phone, content, status]) => (
              <div
                key={phone}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-100 p-3"
              >
                <div>
                  <div className="font-semibold text-slate-950">{phone}</div>
                  <div className="text-sm text-slate-500">{content}</div>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 pb-10 md:grid-cols-3">
        {features.map(({ Icon, title, copy }) => (
          <div
            key={title}
            className="rounded-lg border border-slate-200 bg-white p-5"
          >
            <Icon className="mb-4 text-cyan-700" size={22} aria-hidden="true" />
            <h3 className="font-semibold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
