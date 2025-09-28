import { Link } from "@tanstack/react-router";

interface HeroCardProps {
  userName: string;
  userImage?: string;
}

export function HeroCard({ userName, userImage }: HeroCardProps) {
  return (
    <div className="corp-glass p-0 overflow-hidden h-full group cursor-pointer hover:scale-[1.01] transition-all duration-300">
      <div className="p-4">
        <div className="text-2xl lg:text-3xl font-black tracking-tight group-hover:scale-[1.02] transition-transform duration-300"
             style={{ color: "var(--corp-text)" }}>
          <span className="text-2xl mr-2">👋</span>
          Hello {userName?.split(" ")[0]}
        </div>
        <Link to="/workspaces" className="text-xs mt-2 flex items-center gap-2 opacity-70 hover:opacity-100 transition-all duration-200 w-fit group/link"
             style={{ color: "var(--corp-muted)" }}>
          <span>Go back to your workspaces</span>
          <span className="text-base group-hover/link:translate-x-1 transition-transform duration-200">→</span>
        </Link>
      </div>
      <div className="px-4 pb-4">
        <div className="relative overflow-hidden rounded-2xl shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
          <img
            src={userImage || "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=1200&auto=format&fit=crop"}
            alt="profile"
            className="w-full h-32 lg:h-36 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute left-3 right-3 bottom-3 corp-glass backdrop-blur-lg px-4 py-3 rounded-xl transform group-hover:scale-105 transition-transform duration-300 border border-white/20"
               style={{ color: "var(--corp-text)" }}>
            <div className="text-lg font-bold mb-0.5">{userName}</div>
            <div className="text-xs opacity-80 flex items-center gap-2" style={{ color: "var(--corp-text-secondary)" }}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-sm"></div>
              <span className="font-medium">Active Learner</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
