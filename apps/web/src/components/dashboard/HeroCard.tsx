import { Link } from "@tanstack/react-router";

interface HeroCardProps {
  userName: string;
  userImage?: string;
}

export function HeroCard({ userName, userImage }: HeroCardProps) {
  return (
    <div className="card relative p-6 h-full cursor-pointer hover:scale-[0.97] active:scale-[0.9] transition-all duration-400 backdrop-blur-lg bg-white/30 border border-white/50 rounded-[2.5em] shadow-xl">
      <div className="card-content flex flex-col justify-between h-full transition-transform duration-400 hover:scale-[0.96]">
        <div className="card-top">
          <div className="text-2xl lg:text-3xl font-black tracking-tight m-0"
               style={{ color: "var(--corp-text)" }}>
            Hello {userName?.split(" ")[0]}
          </div>
          <Link to="/workspaces" className="text-sm mt-3 flex items-center gap-2 opacity-70 hover:opacity-100 transition-all duration-200 w-fit group/link"
               style={{ color: "var(--corp-muted)" }}>
            <span>Go back to your workspaces</span>
            <span className="text-base group-hover/link:translate-x-1 transition-transform duration-200">→</span>
          </Link>
        </div>
        
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="relative overflow-hidden rounded-2xl shadow-lg w-full max-w-xs">
            <img
              src={userImage || "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=1200&auto=format&fit=crop"}
              alt="profile"
              className="w-full h-40 object-cover"
            />
            <div className="absolute left-3 right-3 bottom-3 backdrop-blur-lg bg-white/20 px-4 py-3 rounded-xl border border-white/30"
                 style={{ color: "var(--corp-text)" }}>
              <div className="text-lg font-bold mb-0.5">{userName}</div>
              <div className="text-xs opacity-80 flex items-center gap-2" style={{ color: "var(--corp-text-secondary)" }}>
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="font-medium">Active Learner</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-bottom">
          {/* Empty for now, can add stats later */}
        </div>
      </div>
    </div>
  );
}
