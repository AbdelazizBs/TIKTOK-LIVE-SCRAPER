export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <form className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Supabase email/password auth will be connected in Phase 3.
        </p>
        <label className="mt-6 block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
            name="email"
            type="email"
            disabled
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Password
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
            name="password"
            type="password"
            disabled
          />
        </label>
        <button
          className="mt-6 w-full rounded-md bg-slate-950 px-4 py-2 font-semibold text-white disabled:opacity-60"
          disabled
          type="button"
        >
          Coming in Phase 3
        </button>
      </form>
    </main>
  );
}
