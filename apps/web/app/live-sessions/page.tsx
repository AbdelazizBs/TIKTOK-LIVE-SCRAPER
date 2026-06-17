import { LiveLeadsDashboard } from "@/components/live-leads-dashboard";

export default async function LiveSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const params = await searchParams;

  return <LiveLeadsDashboard initialSessionId={params.session ?? null} />;
}
