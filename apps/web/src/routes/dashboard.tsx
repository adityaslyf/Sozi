import { createFileRoute, Link } from "@tanstack/react-router";
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
      <div className="grid grid-cols-12 gap-4 lg:gap-6 px-3 md:px-4 lg:px-6 py-4 lg:py-6 max-w-[1600px] mx-auto">
        {/* Sidebar */}
        <aside className="hidden lg:block col-span-2 xl:col-span-2 corp-sidebar p-5 sticky top-6 h-[calc(100vh-3rem)]">
          <div className="flex items-center gap-2 mb-6">
            <div className="corp-pill w-8 h-8 grid place-items-center text-black text-sm font-bold">AI</div>
            <div className="font-bold tracking-wide text-sm">SOZI</div>
          </div>
          <nav className="space-y-1 text-sm">
            <div className="opacity-60 mb-3 text-xs font-medium tracking-wider">MENU</div>
            <a className="corp-nav-item active flex items-center gap-3 px-3 py-2 rounded-lg">
              <div className="w-1 h-1 rounded-full bg-white/60"></div>
              Dashboard
            </a>
            <a className="corp-nav-item flex items-center gap-3 px-3 py-2 rounded-lg opacity-70">
              <div className="w-1 h-1 rounded-full bg-white/40"></div>
              Files
            </a>
            <a className="corp-nav-item flex items-center gap-3 px-3 py-2 rounded-lg opacity-70">
              <div className="w-1 h-1 rounded-full bg-white/40"></div>
              Exercises
            </a>
            <a className="corp-nav-item flex items-center gap-3 px-3 py-2 rounded-lg opacity-70">
              <div className="w-1 h-1 rounded-full bg-white/40"></div>
              Notes
            </a>
            <a className="corp-nav-item flex items-center gap-3 px-3 py-2 rounded-lg opacity-70">
              <div className="w-1 h-1 rounded-full bg-white/40"></div>
              Settings
            </a>
          </nav>
          <div className="mt-auto pt-6">
            <div className="corp-surface-soft p-3 rounded-xl text-black">
              <div className="font-semibold mb-1 text-sm">AI for results</div>
              <p className="text-xs opacity-70 mb-3">Get suggestions to improve your study sessions</p>
              <button className="corp-pill px-3 py-1.5 text-xs font-medium">Try now</button>
            </div>
          </div>
        </aside>

        {/* Main content with right rail */}
        <section className="col-span-12 lg:col-span-10 xl:col-span-10 grid xl:grid-cols-12 lg:grid-cols-12 grid-cols-1 gap-4 lg:gap-6 items-start">
          {loading ? (
            <div className="h-[60vh] grid place-items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "var(--corp-text)" }} />
            </div>
          ) : error ? (
            <div className="corp-surface p-6">{error}</div>
          ) : (
            <>
            <div className="xl:col-span-8 lg:col-span-7 col-span-12 min-w-0 grid grid-cols-12 gap-4 lg:gap-6">
              {/* Header row */}
              <div className="col-span-12">
                <HeroCard userName={user?.name || "User"} userImage={user?.picture} />
              </div>
              <div className="col-span-12">
                <WorkingFormatCard />
              </div>

              <MetricCard title="Files" value={analytics?.files ?? 0} />
              <MetricCard title="Notes" value={analytics?.notes ?? 0} />
              <MetricCard title="Exercises" value={analytics?.exercises ?? 0} />
              <MetricCard title="Summaries" value={analytics?.summaries ?? 0} />

              <div className="col-span-12 md:col-span-12 corp-surface p-5 group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg" style={{ color: "var(--corp-text)" }}>Score</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-xs opacity-70 font-medium" style={{ color: "var(--corp-muted)" }}>
                      {analytics?.score.attempts ?? 0} attempts
                    </span>
                  </div>
                </div>
                <div className="corp-progress-bar h-8 w-full rounded-full overflow-hidden">
                  <div
                    className="corp-progress-fill h-full rounded-full"
                    style={{ width: `${analytics?.score.averagePercentage ?? 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm mt-4">
                  <div className="text-center">
                    <div className="font-bold" style={{ color: "var(--corp-text)" }}>
                      {analytics?.score.averagePercentage ?? 0}%
                    </div>
                    <div className="text-xs opacity-60" style={{ color: "var(--corp-muted)" }}>Average</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold" style={{ color: "var(--corp-text)" }}>
                      {analytics?.score.bestPercentage ?? 0}%
                    </div>
                    <div className="text-xs opacity-60" style={{ color: "var(--corp-muted)" }}>Best</div>
                  </div>
                </div>
              </div>
              <ActivityCard />
              <CalendarCard />
            </div>

            {/* Right rail onboarding glass panel */}
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

function MetricCard({ title, value }: { title: string; value: number }) {
  const getAccentColor = (title: string) => {
    switch (title.toLowerCase()) {
      case 'files': return 'var(--corp-blue)';
      case 'notes': return 'var(--corp-green)';
      case 'exercises': return 'var(--corp-purple)';
      case 'summaries': return '#f59e0b';
      default: return 'var(--corp-text)';
    }
  };

  return (
    <div className="col-span-6 md:col-span-3 corp-surface corp-metric-card p-5 group">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold opacity-70" style={{ color: "var(--corp-muted)" }}>{title}</p>
        <div className="w-2 h-2 rounded-full opacity-60" style={{ background: getAccentColor(title) }}></div>
      </div>
      <p className="text-3xl font-black group-hover:scale-105 transition-transform duration-200" style={{ color: "var(--corp-text)" }}>
        {value}
      </p>
      <div className="mt-3 h-1 w-full bg-white/30 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 delay-300" 
             style={{ width: `${Math.min(value * 10, 100)}%`, background: getAccentColor(title) }}></div>
      </div>
    </div>
  );
}

function HeroCard({ userName, userImage }: { userName: string; userImage?: string }) {
  return (
    <div className="corp-surface-soft p-0 overflow-hidden h-full group">
      <div className="p-5">
        <div className="text-3xl lg:text-4xl font-black tracking-tight group-hover:scale-[1.02] transition-transform duration-300" 
             style={{ color: "var(--corp-text)" }}>
          Hello {userName?.split(" ")[0]}
          <span className="inline-block ml-2 animate-pulse">👋</span>
        </div>
        <div className="text-sm mt-2 flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer" 
             style={{ color: "var(--corp-muted)" }}>
          Go back to your workspaces
          <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="relative overflow-hidden rounded-[20px] corp-shadow-lg group-hover:shadow-xl transition-shadow duration-300">
          <img
            src={userImage || "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=1200&auto=format&fit=crop"}
            alt="profile"
            className="w-full h-40 lg:h-48 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute left-3 right-3 bottom-3 corp-surface-soft backdrop-blur-md px-4 py-3 rounded-2xl transform group-hover:scale-105 transition-transform duration-300" 
               style={{ color: "var(--corp-text)" }}>
            <div className="text-xl font-bold">{userName}</div>
            <div className="text-xs mt-0.5 opacity-70 flex items-center gap-2" style={{ color: "var(--corp-text-secondary)" }}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              Active Learner
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkingFormatCard() {
  return (
    <div className="corp-surface p-6 h-full">
      <div className="flex items-start justify-between mb-6">
        <h3 className="text-xl font-bold" style={{ color: "var(--corp-text)" }}>Working format</h3>
        <button className="w-6 h-6 rounded-full corp-surface-soft grid place-items-center text-xs opacity-70 hover:opacity-100 transition-opacity">
          ⋯
        </button>
      </div>
      
      <div className="flex items-center justify-center py-6">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10"/>
            
            {/* Progress segments */}
            {/* Teal segment - 50% (180 degrees) */}
            <circle cx="60" cy="60" r="45" fill="none" stroke="#14b8a6" strokeWidth="10" 
                    strokeDasharray="141 283" strokeDashoffset="0" strokeLinecap="round"/>
            
            {/* Purple segment - 30% (108 degrees) */}
            <circle cx="60" cy="60" r="45" fill="none" stroke="#c084fc" strokeWidth="10" 
                    strokeDasharray="85 283" strokeDashoffset="-141" strokeLinecap="round"/>
            
            {/* Yellow segment - 20% (72 degrees) */}
            <circle cx="60" cy="60" r="45" fill="none" stroke="#fbbf24" strokeWidth="10" 
                    strokeDasharray="57 283" strokeDashoffset="-226" strokeLinecap="round"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-black" style={{ color: "var(--corp-text)" }}>500</div>
            <div className="text-sm font-medium opacity-70 tracking-wider" style={{ color: "var(--corp-muted)" }}>DAYS</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center mb-6">
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-teal-500"></div>
            <span className="font-bold text-lg" style={{ color: "var(--corp-text)" }}>50%</span>
          </div>
          <div className="text-xs font-medium opacity-70 tracking-wider" style={{ color: "var(--corp-muted)" }}>OFFICE</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
            <span className="font-bold text-lg" style={{ color: "var(--corp-text)" }}>30%</span>
          </div>
          <div className="text-xs font-medium opacity-70 tracking-wider" style={{ color: "var(--corp-muted)" }}>HYBRID</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="font-bold text-lg" style={{ color: "var(--corp-text)" }}>20%</span>
          </div>
          <div className="text-xs font-medium opacity-70 tracking-wider" style={{ color: "var(--corp-muted)" }}>REMOTE</div>
        </div>
      </div>

      <div className="text-sm font-medium opacity-70" style={{ color: "var(--corp-muted)" }}>
        Exam date: 03/10/2025
      </div>
    </div>
  );
}


function ActivityCard() {
  // Mock line chart using simple SVG
  const points = [2, 3, 6, 4, 8, 10, 12, 11, 13, 14];
  const max = Math.max(...points);
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * 25} ${80 - (p / max) * 60}`)
    .join(' ');
  return (
    <div className="col-span-12 lg:col-span-6 corp-surface p-5">
      <h3 className="font-bold text-lg mb-3" style={{ color: "var(--corp-text)" }}>Activity</h3>
      <div className="h-32 rounded-xl corp-surface-soft grid place-items-center">
        <svg width="240" height="80">
          <path d={path} stroke="var(--corp-text)" strokeWidth="2.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}

function CalendarCard() {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Mock events for the calendar display

  const weekDays = ['MON, 3', 'TUE, 4', 'WED, 5', 'THU, 6', 'FRI, 7', 'SAT, 8', 'SUN, 9'];
  const timeSlots = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '13:00 PM'];

  return (
    <div className="col-span-12 lg:col-span-6 corp-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <button className="corp-pill px-3 py-1.5 text-xs font-medium opacity-70">
          ← JANUARY
        </button>
        <h3 className="font-bold text-lg" style={{ color: "var(--corp-text)" }}>
          {currentMonth}
        </h3>
        <button className="corp-pill px-3 py-1.5 text-xs font-medium opacity-70">
          MARCH →
        </button>
      </div>
      
      <div className="corp-surface-soft rounded-xl p-4">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-2 mb-3">
          <div className="text-xs font-medium opacity-60"></div>
          {weekDays.map(day => (
            <div key={day} className="text-xs font-medium text-center opacity-70" style={{ color: "var(--corp-text)" }}>
              {day}
            </div>
          ))}
        </div>

        {/* Time slots and events */}
        <div className="space-y-2">
          {timeSlots.map(time => (
            <div key={time} className="grid grid-cols-8 gap-2 items-center">
              <div className="text-xs font-medium opacity-60" style={{ color: "var(--corp-muted)" }}>
                {time}
              </div>
              <div className="col-span-7 relative h-6">
                {/* Event blocks */}
                {time === '10:00 AM' && (
                  <div className="absolute left-0 top-0 bg-black text-white px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium">
                    ONBOARDING SESSION
                    <div className="flex -space-x-1">
                      {['👨‍💼', '👩‍💼', '👨‍💻'].map((avatar, i) => (
                        <div key={i} className="w-4 h-4 rounded-full bg-white/20 grid place-items-center text-[10px]">
                          {avatar}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {time === '12:00 PM' && (
                  <div className="absolute left-20 top-0 bg-black text-white px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium">
                    DESIGN TEAM SYNC
                    <div className="flex -space-x-1">
                      {['👩‍🎨', '👨‍🎨', '👩‍💻'].map((avatar, i) => (
                        <div key={i} className="w-4 h-4 rounded-full bg-white/20 grid place-items-center text-[10px]">
                          {avatar}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Grid lines */}
                <div className="absolute inset-0 border-l border-dashed border-gray-200 opacity-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TodoListCard({ glass = false }: { glass?: boolean }) {
  const items = [
    { title: 'Onboarding session', time: 'Mon, Feb 3 | 10:00', done: true, img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=200&auto=format&fit=crop' },
    { title: 'Interview', time: 'Mon, Feb 3 | 14:00', done: true, img: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=200&auto=format&fit=crop' },
    { title: 'Project update', time: 'Mon, Feb 3 | 14:30', done: true, img: 'https://images.unsplash.com/photo-1552664730-7d8c2a5f59c7?q=80&w=200&auto=format&fit=crop' },
    { title: 'HR policy review', time: 'Mon, Feb 3 | 16:00', done: false, img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=200&auto=format&fit=crop' },
  ];
  const progress = Math.round((items.filter(i => i.done).length / items.length) * 100);
  return (
    <div className={`col-span-12 p-5 ${glass ? 'corp-glass' : 'corp-surface'} h-fit`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold" style={{ color: "var(--corp-text)" }}>Onboarding tasks</h3>
        </div>
        <div className="text-xl font-bold" style={{ color: "var(--corp-text)" }}>{progress}%</div>
      </div>
      <div className="h-3 rounded-full corp-surface-soft overflow-hidden mb-6">
        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "var(--corp-green)" }} />
      </div>
      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={idx} className="corp-task-item flex items-center gap-3 p-3 rounded-2xl corp-surface-soft">
            <img src={it.img} className="w-12 h-12 rounded-xl object-cover corp-shadow-sm" />
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-sm truncate transition-colors ${it.done ? 'line-through opacity-70' : ''}`} 
                   style={{ color: "var(--corp-text)" }}>
                {it.title}
              </div>
              <div className="text-xs mt-0.5 font-medium opacity-70" style={{ color: "var(--corp-text-secondary)" }}>
                {it.time}
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full grid place-items-center flex-shrink-0 text-xs transition-all duration-200 ${
              it.done 
                ? 'bg-green-500 text-white scale-110' 
                : 'border-2 border-gray-300 hover:border-green-400'
            }`}>
              {it.done ? '✓' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



