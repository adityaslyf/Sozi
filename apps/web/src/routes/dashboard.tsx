import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { googleAuth } from "@/lib/google-auth";
import AUTH_CONFIG from "@/config/auth";
import { Button } from "@/components/ui/button";

type Analytics = {
  files: number;
  summaries: number;
  notes: number;
  mcqSessions: number;
  exercises: number;
  score: {
    averagePercentage: number;
    bestPercentage: number;
    attempts: number;
  };
};

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const isLoggedIn = googleAuth.isLoggedIn();

  useEffect(() => {
    async function bootstrap() {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }
      try {
        const token = googleAuth.getAccessToken();
        // Load user workspaces
        const wsRes = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        const wsData = await wsRes.json();
        const list = (wsData?.workspaces ?? []) as Array<{ id: string; name: string }>;
        setWorkspaces(list);
        if (list.length === 0) {
          setLoading(false);
          return;
        }
        // Use first workspace for now
        const wsId = list[0].id;
        const res = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${wsId}/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setAnalytics(data.analytics);
        } else {
          setError(data.message || "Failed to load analytics");
        }
      } catch (e: any) {
        setError(e?.message || "Network error");
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [isLoggedIn]);

  const user = useMemo(() => googleAuth.getCurrentUser(), []);

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-2">Please sign in</h1>
        <p className="text-gray-600 mb-6">Sign in to view your dashboard.</p>
        <Button asChild>
          <Link to="/">Go to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="corp-theme min-h-screen" style={{ background: "var(--corp-bg)" }}>
      <div className="grid grid-cols-12 gap-6 px-4 md:px-6 py-6 max-w-[1400px] mx-auto">
        {/* Sidebar */}
        <aside className="hidden md:block col-span-3 lg:col-span-2 corp-sidebar rounded-3xl p-6 sticky top-6 h-[calc(100vh-3rem)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="corp-pill w-10 h-10 grid place-items-center text-black">AI</div>
            <div className="font-semibold tracking-wide">SOZI</div>
          </div>
          <nav className="space-y-2 text-sm">
            <div className="opacity-70 mb-2">MENU</div>
            <a className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/10">Dashboard</a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5">Files</a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5">Exercises</a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5">Notes</a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5">Settings</a>
          </nav>
          <div className="mt-auto pt-8">
            <div className="corp-surface-soft p-4 rounded-2xl text-black">
              <div className="font-medium mb-1">AI for results</div>
              <p className="text-xs text-[var(--corp-muted)] mb-3">Get suggestions to improve your study sessions</p>
              <button className="corp-pill px-4 py-2 text-sm">Try now</button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="col-span-12 md:col-span-9 lg:col-span-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--corp-text)" }}>
                Hello {user?.name?.split(" ")[0] || "there"}
              </h1>
              <p className="text-sm" style={{ color: "var(--corp-muted)" }}>Your learning overview</p>
            </div>
            {workspaces.length > 0 && (
              <Button className="corp-pill" variant="outline" onClick={() => navigate({ to: "/workspaces/$workspaceId", params: { workspaceId: workspaces[0].id } })}>
                Go to workspace
              </Button>
            )}
          </div>

          {loading ? (
            <div className="h-[60vh] grid place-items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "var(--corp-text)" }} />
            </div>
          ) : error ? (
            <div className="corp-surface p-6">{error}</div>
          ) : (
            <div className="grid grid-cols-12 gap-4">
              <MetricCard title="Files" value={analytics?.files ?? 0} />
              <MetricCard title="Notes" value={analytics?.notes ?? 0} />
              <MetricCard title="Exercises" value={analytics?.exercises ?? 0} />
              <MetricCard title="Summaries" value={analytics?.summaries ?? 0} />

              <div className="col-span-12 lg:col-span-6 corp-surface p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Score</h3>
                  <span className="text-xs" style={{ color: "var(--corp-muted)" }}>Attempts {analytics?.score.attempts ?? 0}</span>
                </div>
                <div className="h-12 w-full rounded-full overflow-hidden corp-surface-soft">
                  <div
                    className="h-full"
                    style={{ width: `${analytics?.score.averagePercentage ?? 0}%`, background: "var(--corp-green)" }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm mt-2" style={{ color: "var(--corp-muted)" }}>
                  <span>Average {analytics?.score.averagePercentage ?? 0}%</span>
                  <span>Best {analytics?.score.bestPercentage ?? 0}%</span>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-6 corp-surface p-6">
                <h3 className="font-semibold mb-4">Activity</h3>
                <div className="h-40 rounded-2xl corp-surface-soft" />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="col-span-12 sm:col-span-6 lg:col-span-3 corp-surface p-6">
      <p className="text-sm" style={{ color: "var(--corp-muted)" }}>{title}</p>
      <p className="text-4xl font-extrabold mt-2" style={{ color: "var(--corp-text)" }}>{value}</p>
    </div>
  );
}


