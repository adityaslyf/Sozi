import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { googleAuth } from "@/lib/google-auth";
import AUTH_CONFIG from "@/config/auth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  HeroCard,
  MetricCard,
  WorkingFormatCard,
  ScoreCard,
  ActivityCard,
  CalendarCard,
  TodoListCard
} from "@/components/dashboard";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
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
        if (list.length === 0) {
          setLoading(false);
          return;
        }
        // Use first workspace for now
        const wsId = list[0].id;

        // Load analytics for the workspace
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
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Network error");
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [isLoggedIn]);

  const user = googleAuth.getCurrentUser();

  if (!isLoggedIn) {
    return (
      <div className="corp-theme min-h-screen grid place-items-center" style={{ background: "var(--corp-bg)" }}>
        <div className="corp-glass p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--corp-text)" }}>
            Please log in to view your dashboard
          </h2>
          <p className="text-sm opacity-70 mb-6" style={{ color: "var(--corp-muted)" }}>
            You need to be authenticated to access your personalized analytics and data.
          </p>
          <Button onClick={() => googleAuth.signIn()} className="w-full">
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="corp-theme min-h-screen" style={{ background: "var(--corp-bg)" }}>
      <div className="grid grid-cols-12 gap-4 md:gap-6 lg:gap-8 px-3 md:px-4 lg:px-6 py-4 lg:py-8 max-w-[1600px] mx-auto">
        {/* Sidebar Component */}
        <Sidebar />

        {/* Main Content */}
        <section className="col-span-12 lg:col-span-10 xl:col-span-10 grid xl:grid-cols-12 lg:grid-cols-12 grid-cols-1 gap-4 md:gap-6 lg:gap-8 items-start">
          {loading ? (
            <div className="col-span-12 h-[60vh] grid place-items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "var(--corp-text)" }} />
            </div>
          ) : error ? (
            <div className="col-span-12 corp-glass p-8 text-center">
              <div className="text-lg font-semibold mb-2" style={{ color: "var(--corp-text)" }}>Unable to load dashboard</div>
              <div className="text-sm opacity-70" style={{ color: "var(--corp-muted)" }}>{error}</div>
            </div>
          ) : (
            <>
            {/* Main Content - 3 Row Layout */}
            <div className="xl:col-span-8 lg:col-span-7 col-span-12 grid grid-cols-12 gap-4 md:gap-6">
              
              {/* ROW 1: Hero + Working Format + Activity */}
              <div className="col-span-12 lg:col-span-4">
                <HeroCard userName={user?.name || "User"} userImage={user?.picture} />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <WorkingFormatCard />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <ActivityCard />
              </div>

              {/* ROW 2: 4 Metric Cards in horizontal row (small) */}
              <div className="col-span-12 grid grid-cols-4 gap-3">
                <MetricCard title="Files" value={analytics?.files ?? 0} />
                <MetricCard title="Notes" value={analytics?.notes ?? 0} />
                <MetricCard title="Exercises" value={analytics?.exercises ?? 0} />
                <MetricCard title="Summaries" value={analytics?.summaries ?? 0} />
              </div>

              {/* ROW 3: Calendar + Score Card */}
              <div className="col-span-12 lg:col-span-8">
                <CalendarCard />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <ScoreCard analytics={analytics} />
              </div>
            </div>

            {/* Right Rail - Todo List */}
            <div className="xl:col-span-4 lg:col-span-5 col-span-12 sticky top-6">
              <TodoListCard glass />
            </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}