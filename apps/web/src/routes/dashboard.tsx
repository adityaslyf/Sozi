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
          {loading ? (
            <div className="h-[60vh] grid place-items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "var(--corp-text)" }} />
            </div>
          ) : error ? (
            <div className="corp-surface p-6">{error}</div>
          ) : (
            <div className="grid grid-cols-12 gap-4">
              {/* Header row with hero and working format cards */}
              <div className="col-span-12 lg:col-span-7">
                <HeroCard userName={user?.name || "User"} userImage={user?.picture} />
              </div>
              <div className="col-span-12 lg:col-span-5">
                <WorkingFormatCard />
              </div>

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

              <ActivityCard />

              <TodoListCard />
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

function HeroCard({ userName, userImage }: { userName: string; userImage?: string }) {
  return (
    <div className="corp-surface-soft p-0 overflow-hidden rounded-[28px] h-full">
      <div className="p-6">
        <div className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: "var(--corp-text)" }}>Hello {userName?.split(" ")[0]}</div>
        <div className="text-xs mt-2" style={{ color: "var(--corp-muted)" }}>Go back to your workspaces →</div>
      </div>
      <div className="px-6 pb-6">
        <div className="relative overflow-hidden rounded-[24px] corp-shadow-lg">
          <img
            src={userImage || "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=1200&auto=format&fit=crop"}
            alt="profile"
            className="w-full h-64 object-cover"
          />
          <div className="absolute left-4 right-4 bottom-4 corp-surface-soft backdrop-blur-md px-6 py-4 rounded-3xl border" style={{ color: "var(--corp-text)" }}>
            <div className="text-2xl md:text-3xl font-extrabold">{userName}</div>
            <div className="text-xs" style={{ color: "var(--corp-muted)" }}>Learner</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkingFormatCard() {
  // Mock countdown to an exam in 5 days
  const targetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d;
  }, []);
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const msLeft = Math.max(0, targetDate.getTime() - now.getTime());
  const days = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  const rings = [
    { size: 180, color: "#80D0C7", value: 0.8 },
    { size: 160, color: "#E8D0E6", value: 0.65 },
    { size: 140, color: "#F1D786", value: 0.45 },
  ];

  return (
    <div className="corp-surface p-6 h-full">
      <div className="flex items-start justify-between">
        <h3 className="font-extrabold text-2xl" style={{ color: "var(--corp-text)" }}>Working format</h3>
        <div className="text-xl">⋮</div>
      </div>
      <div className="flex items-center justify-center py-4">
        <div className="relative" style={{ width: 200, height: 200 }}>
          {rings.map((r, i) => (
            <Ring key={i} size={r.size} color={r.color} value={r.value} />
          ))}
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-3xl font-black" style={{ color: "var(--corp-text)" }}>{days}</div>
            <div className="text-xs" style={{ color: "var(--corp-muted)" }}>DAYS</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs mt-2" style={{ color: "var(--corp-text)" }}>
        <Legend color="#80D0C7" label="50%" sub="Office" />
        <Legend color="#E8D0E6" label="30%" sub="Hybrid" />
        <Legend color="#F1D786" label="20%" sub="Remote" />
      </div>
      <div className="text-xs mt-4" style={{ color: "var(--corp-muted)" }}>Exam date: {targetDate.toLocaleDateString()}</div>
    </div>
  );
}

function Ring({ size, color, value }: { size: number; color: string; value: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute"
      style={{ left: (200 - size) / 2, top: (200 - size) / 2 }}
    >
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#eee" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function Legend({ color, label, sub }: { color: string; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
      <div>
        <div className="font-semibold" style={{ color: "var(--corp-text)" }}>{label}</div>
        <div className="uppercase tracking-wide" style={{ color: "var(--corp-muted)" }}>{sub}</div>
      </div>
    </div>
  );
}

function ActivityCard() {
  // Mock line chart using simple SVG
  const points = [2, 3, 6, 4, 8, 10, 12, 11, 13, 14];
  const max = Math.max(...points);
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * 30} ${120 - (p / max) * 100}`)
    .join(' ');
  return (
    <div className="col-span-12 lg:col-span-6 corp-surface p-6">
      <h3 className="font-semibold mb-4">Activity</h3>
      <div className="h-40 rounded-2xl corp-surface-soft grid place-items-center">
        <svg width="280" height="120">
          <path d={path} stroke="#222" strokeWidth="3" fill="none" />
        </svg>
      </div>
    </div>
  );
}

function TodoListCard() {
  const items = [
    { title: 'Onboarding session', time: 'Mon, Feb 3 | 10:00', done: true, img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=200&auto=format&fit=crop' },
    { title: 'Interview', time: 'Mon, Feb 3 | 14:00', done: true, img: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=200&auto=format&fit=crop' },
    { title: 'Project update', time: 'Mon, Feb 3 | 14:30', done: false, img: 'https://images.unsplash.com/photo-1552664730-7d8c2a5f59c7?q=80&w=200&auto=format&fit=crop' },
    { title: 'HR policy review', time: 'Mon, Feb 3 | 16:00', done: false, img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=200&auto=format&fit=crop' },
  ];
  const progress = Math.round((items.filter(i => i.done).length / items.length) * 100);
  return (
    <div className="col-span-12 corp-surface p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-extrabold text-xl">Onboarding tasks</h3>
        <div className="text-2xl font-black">{progress}%</div>
      </div>
      <div className="h-3 rounded-full corp-surface-soft overflow-hidden mb-4">
        <div className="h-full" style={{ width: `${progress}%`, background: "var(--corp-green)" }} />
      </div>
      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl corp-surface-soft">
            <img src={it.img} className="w-12 h-12 rounded-xl object-cover" />
            <div className="flex-1">
              <div className="font-semibold">{it.title}</div>
              <div className="text-xs" style={{ color: "var(--corp-muted)" }}>{it.time}</div>
            </div>
            <div className={`w-6 h-6 rounded-full grid place-items-center ${it.done ? 'bg-black text-white' : 'border'}`}>{it.done ? '✓' : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


