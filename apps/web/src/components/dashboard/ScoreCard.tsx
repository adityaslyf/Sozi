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
    <div className="corp-glass p-4 group hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-xl">🎯</div>
          <h3 className="font-bold text-lg" style={{ color: "var(--corp-text)" }}>Score Performance</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-sm opacity-70 font-medium" style={{ color: "var(--corp-muted)" }}>
            {analytics?.score.attempts ?? 0} attempts
          </span>
        </div>
      </div>
      
      <div className="corp-progress-bar h-8 w-full rounded-full overflow-hidden mb-4 shadow-inner">
        <div
          className="corp-progress-fill h-full rounded-full flex items-center justify-end pr-4"
          style={{ width: `${analytics?.score.averagePercentage ?? 0}%` }}
        >
          <span className="text-xs font-bold text-white">
            {analytics?.score.averagePercentage ?? 0}%
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 corp-surface-soft rounded-xl">
          <div className="text-xl font-black mb-1" style={{ color: "var(--corp-text)" }}>
            {analytics?.score.averagePercentage ?? 0}%
          </div>
          <div className="text-xs opacity-60 font-medium" style={{ color: "var(--corp-muted)" }}>Average Score</div>
        </div>
        <div className="text-center p-3 corp-surface-soft rounded-xl">
          <div className="text-xl font-black mb-1" style={{ color: "var(--corp-text)" }}>
            {analytics?.score.bestPercentage ?? 0}%
          </div>
          <div className="text-xs opacity-60 font-medium" style={{ color: "var(--corp-muted)" }}>Best Score</div>
        </div>
      </div>
    </div>
  );
}
