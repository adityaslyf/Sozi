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

interface ScoreCardProps {
  analytics: Analytics | null;
}

export function ScoreCard({ analytics }: ScoreCardProps) {
  return (
    <div className="card relative p-6 hover:scale-[0.97] active:scale-[0.9] transition-all duration-400 backdrop-blur-lg bg-orange-50/30 border border-orange-200/40 rounded-[2.5em] shadow-xl">
      <div className="card-content flex flex-col justify-between h-full transition-transform duration-400 hover:scale-[0.96]">
        <div className="card-top flex justify-between mb-4">
          <h3 className="card-title font-bold text-lg m-0" style={{ color: "var(--corp-text)" }}>Score Performance</h3>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            <span className="text-sm opacity-70 font-medium" style={{ color: "var(--corp-muted)" }}>
              {analytics?.score.attempts ?? 0} attempts
            </span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="h-8 w-full rounded-full overflow-hidden mb-6 shadow-inner bg-white/20">
            <div
              className="h-full rounded-full flex items-center justify-end pr-4 bg-gradient-to-r from-green-400 to-green-500"
              style={{ width: `${analytics?.score.averagePercentage ?? 0}%` }}
            >
              <span className="text-xs font-bold text-white">
                {analytics?.score.averagePercentage ?? 0}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="card-bottom grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white/20 rounded-xl">
            <div className="text-xl font-black mb-1" style={{ color: "var(--corp-text)" }}>
              {analytics?.score.averagePercentage ?? 0}%
            </div>
            <div className="text-xs opacity-60 font-medium" style={{ color: "var(--corp-muted)" }}>Average Score</div>
          </div>
          <div className="text-center p-3 bg-white/20 rounded-xl">
            <div className="text-xl font-black mb-1" style={{ color: "var(--corp-text)" }}>
              {analytics?.score.bestPercentage ?? 0}%
            </div>
            <div className="text-xs opacity-60 font-medium" style={{ color: "var(--corp-muted)" }}>Best Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
